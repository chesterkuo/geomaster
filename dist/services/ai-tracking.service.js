"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AITrackingService = void 0;
const openai_1 = __importDefault(require("openai"));
const axios_1 = __importDefault(require("axios"));
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const constants_1 = require("../config/constants");
class AITrackingService {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
        this.geminiApiKey = process.env.GOOGLE_API_KEY || '';
    }
    async trackWebsiteVisibility(websiteId, queries, platforms) {
        try {
            const website = await models_1.Website.findByPk(websiteId);
            if (!website) {
                throw new Error('Website not found');
            }
            const targetPlatforms = platforms || Object.values(constants_1.AI_PLATFORMS);
            const results = [];
            for (const platform of targetPlatforms) {
                for (const query of queries) {
                    try {
                        const result = await this.queryAIPlatform(platform, query, website.url, website.domain);
                        results.push(result);
                        // Save to database
                        await this.saveTrackingResult(websiteId, result);
                        // Rate limiting between queries
                        await this.delay(2000);
                    }
                    catch (error) {
                        logger_1.logger.error(`Failed to track ${platform} for query "${query}":`, error);
                    }
                }
            }
            return results;
        }
        catch (error) {
            logger_1.logger.error('Website visibility tracking failed:', error);
            throw error;
        }
    }
    async queryAIPlatform(platform, query, websiteUrl, domain) {
        let response = '';
        try {
            switch (platform) {
                case constants_1.AI_PLATFORMS.CHATGPT:
                    response = await this.queryChatGPT(query);
                    break;
                case constants_1.AI_PLATFORMS.PERPLEXITY:
                    response = await this.queryPerplexity(query);
                    break;
                case constants_1.AI_PLATFORMS.GEMINI:
                    response = await this.queryGemini(query);
                    break;
                case constants_1.AI_PLATFORMS.CLAUDE:
                    response = await this.queryClaude(query);
                    break;
                default:
                    throw new Error(`Unsupported platform: ${platform}`);
            }
            return this.analyzeResponse(platform, query, response, websiteUrl, domain);
        }
        catch (error) {
            logger_1.logger.error(`Failed to query ${platform}:`, error);
            return {
                platform,
                query,
                isMentioned: false,
                isCited: false,
                fullResponse: '',
                competitorMentions: [],
                confidence: 0
            };
        }
    }
    async queryChatGPT(query) {
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant. Provide comprehensive, factual answers with citations when possible.'
                },
                {
                    role: 'user',
                    content: query
                }
            ],
            max_tokens: 2000,
            temperature: 0.1
        });
        return response.choices[0].message.content || '';
    }
    async queryPerplexity(query) {
        if (!this.perplexityApiKey) {
            throw new Error('Perplexity API key not configured');
        }
        try {
            const response = await axios_1.default.post('https://api.perplexity.ai/chat/completions', {
                model: 'llama-3.1-sonar-large-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that provides accurate information with citations.'
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                max_tokens: 2000,
                temperature: 0.1,
                search_domain_filter: ["perplexity.ai"],
                return_citations: true
            }, {
                headers: {
                    'Authorization': `Bearer ${this.perplexityApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.choices[0].message.content || '';
        }
        catch (error) {
            logger_1.logger.error('Perplexity API error:', error);
            throw new Error('Failed to query Perplexity');
        }
    }
    async queryGemini(query) {
        if (!this.geminiApiKey) {
            throw new Error('Gemini API key not configured');
        }
        try {
            const response = await axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
                contents: [
                    {
                        parts: [
                            {
                                text: query
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2000
                }
            });
            return response.data.candidates[0].content.parts[0].text || '';
        }
        catch (error) {
            logger_1.logger.error('Gemini API error:', error);
            throw new Error('Failed to query Gemini');
        }
    }
    async queryClaude(query) {
        // Note: Claude API would require Anthropic's API key and SDK
        // For now, we'll simulate or skip this platform
        logger_1.logger.warn('Claude API not implemented yet');
        return '';
    }
    analyzeResponse(platform, query, response, websiteUrl, domain) {
        const lowerResponse = response.toLowerCase();
        const lowerDomain = domain.toLowerCase();
        const lowerUrl = websiteUrl.toLowerCase();
        // Check if website is mentioned
        const isMentioned = lowerResponse.includes(lowerDomain) ||
            lowerResponse.includes(lowerUrl) ||
            this.findMentionVariations(lowerResponse, domain);
        // Check if website is cited (look for URL patterns, reference patterns)
        const citationPatterns = [
            new RegExp(`\\b${domain.replace('.', '\\.')}\\b`, 'gi'),
            new RegExp(websiteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
            /https?:\/\/[^\s]+/g
        ];
        let isCited = false;
        let citationPosition;
        let snippet;
        // Look for citations and their positions
        const sentences = response.split(/[.!?]+/).filter(s => s.trim());
        sentences.forEach((sentence, index) => {
            citationPatterns.forEach(pattern => {
                if (pattern.test(sentence)) {
                    isCited = true;
                    if (!citationPosition) {
                        citationPosition = index + 1;
                        snippet = sentence.trim().substring(0, 200);
                    }
                }
            });
        });
        // Find competitor mentions
        const competitorMentions = this.findCompetitorMentions(response, domain);
        // Calculate confidence score
        const confidence = this.calculateConfidence(isMentioned, isCited, snippet, response, domain);
        return {
            platform,
            query,
            isMentioned,
            isCited,
            citationPosition,
            snippet,
            fullResponse: response,
            competitorMentions,
            confidence
        };
    }
    findMentionVariations(response, domain) {
        // Remove common TLDs and check for brand name variations
        const brandName = domain.split('.')[0];
        const variations = [
            brandName,
            brandName.replace(/[-_]/g, ' '),
            brandName.replace(/[-_]/g, ''),
            `${brandName} platform`,
            `${brandName} service`,
            `${brandName} company`
        ];
        return variations.some(variation => response.includes(variation.toLowerCase()));
    }
    findCompetitorMentions(response, currentDomain) {
        // Common competitor patterns (this would be enhanced with actual competitor lists)
        const competitorPatterns = [
            /\b\w+\.com\b/g,
            /\b\w+\.io\b/g,
            /\b\w+\.ai\b/g,
            /\b\w+\.co\b/g
        ];
        const competitors = new Set();
        const lowerResponse = response.toLowerCase();
        competitorPatterns.forEach(pattern => {
            const matches = lowerResponse.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    if (match !== currentDomain.toLowerCase() && match.length > 3) {
                        competitors.add(match);
                    }
                });
            }
        });
        return Array.from(competitors).slice(0, 10); // Limit to top 10
    }
    calculateConfidence(isMentioned, isCited, snippet, response, domain) {
        let confidence = 0;
        // Base score for being mentioned
        if (isMentioned)
            confidence += 40;
        // Higher score for being cited
        if (isCited)
            confidence += 35;
        // Bonus for having a snippet
        if (snippet && snippet.length > 50)
            confidence += 15;
        // Bonus for multiple mentions
        const mentionCount = (response.toLowerCase().match(new RegExp(domain.toLowerCase(), 'g')) || []).length;
        confidence += Math.min(10, mentionCount * 2);
        return Math.min(100, confidence);
    }
    async saveTrackingResult(websiteId, result) {
        try {
            await models_1.AITrackingResult.create({
                websiteId,
                platform: result.platform,
                query: result.query,
                isMentioned: result.isMentioned,
                isCited: result.isCited,
                citationPosition: result.citationPosition,
                snippet: result.snippet,
                fullResponse: result.fullResponse,
                competitorMentions: result.competitorMentions,
                trackedAt: new Date()
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to save tracking result:', error);
        }
    }
    async getVisibilityMetrics(websiteId, dateFrom, dateTo) {
        try {
            const results = await models_1.AITrackingResult.findAll({
                where: {
                    websiteId,
                    trackedAt: {
                        [require('sequelize').Op.between]: [dateFrom, dateTo]
                    }
                },
                attributes: [
                    'platform',
                    [models_1.AITrackingResult.sequelize.fn('COUNT', '*'), 'totalQueries'],
                    [models_1.AITrackingResult.sequelize.fn('SUM', models_1.AITrackingResult.sequelize.col('is_mentioned')), 'mentions'],
                    [models_1.AITrackingResult.sequelize.fn('SUM', models_1.AITrackingResult.sequelize.col('is_cited')), 'citations'],
                    [models_1.AITrackingResult.sequelize.fn('AVG', models_1.AITrackingResult.sequelize.col('citation_position')), 'avgPosition']
                ],
                group: ['platform'],
                raw: true
            });
            return results.map((result) => ({
                platform: result.platform,
                totalQueries: parseInt(result.totalQueries),
                mentions: parseInt(result.mentions) || 0,
                citations: parseInt(result.citations) || 0,
                avgPosition: result.avgPosition ? parseFloat(result.avgPosition).toFixed(1) : null,
                mentionRate: ((parseInt(result.mentions) || 0) / parseInt(result.totalQueries)) * 100,
                citationRate: ((parseInt(result.citations) || 0) / parseInt(result.totalQueries)) * 100
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get visibility metrics:', error);
            throw error;
        }
    }
    async getCompetitorAnalysis(websiteId, dateFrom, dateTo) {
        try {
            const results = await models_1.AITrackingResult.findAll({
                where: {
                    websiteId,
                    trackedAt: {
                        [require('sequelize').Op.between]: [dateFrom, dateTo]
                    }
                },
                attributes: ['competitorMentions']
            });
            const competitorCount = {};
            results.forEach(result => {
                const competitors = result.competitorMentions;
                if (Array.isArray(competitors)) {
                    competitors.forEach(competitor => {
                        competitorCount[competitor] = (competitorCount[competitor] || 0) + 1;
                    });
                }
            });
            // Sort by frequency and return top 20
            return Object.entries(competitorCount)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 20)
                .map(([domain, count]) => ({ domain, mentions: count }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get competitor analysis:', error);
            throw error;
        }
    }
    async getTrendingQueries(websiteId, limit = 10) {
        try {
            const results = await models_1.AITrackingResult.findAll({
                where: {
                    websiteId,
                    isMentioned: true
                },
                attributes: [
                    'query',
                    [models_1.AITrackingResult.sequelize.fn('COUNT', '*'), 'frequency'],
                    [models_1.AITrackingResult.sequelize.fn('AVG', models_1.AITrackingResult.sequelize.literal('CASE WHEN is_cited = true THEN 1 ELSE 0 END')), 'citationRate']
                ],
                group: ['query'],
                order: [[models_1.AITrackingResult.sequelize.literal('frequency'), 'DESC']],
                limit,
                raw: true
            });
            return results.map((result) => ({
                query: result.query,
                frequency: parseInt(result.frequency),
                citationRate: (parseFloat(result.citationRate) * 100).toFixed(1)
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get trending queries:', error);
            throw error;
        }
    }
    async generateKeywordSuggestions(websiteId, topic) {
        try {
            const website = await models_1.Website.findByPk(websiteId);
            if (!website) {
                throw new Error('Website not found');
            }
            const prompt = `
Based on the website ${website.url} and the topic "${topic}", generate 15-20 relevant search queries that users might ask AI assistants when looking for information related to this topic.

Consider:
1. Common user questions and pain points
2. "How to" queries
3. Comparison queries
4. Problem-solving queries
5. Educational/informational queries
6. Product/service specific queries

Return the queries as a JSON array of strings. Return only the JSON array, no other text.

Example format: ["query 1", "query 2", "query 3"]
`;
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                temperature: 0.7
            });
            const content = response.choices[0].message.content;
            if (!content)
                return [];
            return JSON.parse(content);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate keyword suggestions:', error);
            return [];
        }
    }
    async bulkTrackQueries(websiteId, queries, platforms = Object.values(constants_1.AI_PLATFORMS)) {
        try {
            // Process in batches to avoid rate limiting
            const batchSize = 5;
            const batches = [];
            for (let i = 0; i < queries.length; i += batchSize) {
                batches.push(queries.slice(i, i + batchSize));
            }
            for (const batch of batches) {
                await this.trackWebsiteVisibility(websiteId, batch, platforms);
                // Wait between batches to respect rate limits
                await this.delay(5000);
            }
        }
        catch (error) {
            logger_1.logger.error('Bulk tracking failed:', error);
            throw error;
        }
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.AITrackingService = AITrackingService;
//# sourceMappingURL=ai-tracking.service.js.map