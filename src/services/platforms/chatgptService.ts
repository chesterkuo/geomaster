import OpenAI from 'openai';
import { 
  AITrackingPlatform, 
  QueryParams, 
  TrackingResult, 
  ParsedResult, 
  Mention, 
  CompetitorMention,
  PlatformConfig,
  QueryMetadata,
  SentimentAnalysis,
  PlatformError,
  RateLimitError,
  APIKeyError,
  QuotaExceededError
} from './aiPlatformInterface';
import { MentionDetector } from '../../utils/mentionDetector';
import { SentimentAnalyzer } from '../../utils/sentimentAnalyzer';

export class ChatGPTService implements AITrackingPlatform {
  name = 'ChatGPT';
  private client: OpenAI;
  private config: PlatformConfig;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private requestWindow: number = 60000; // 1 minute

  constructor(config: PlatformConfig) {
    this.config = {
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.1,
      requestsPerMinute: 60,
      maxRetries: 3,
      timeout: 30000,
      ...config
    };

    if (!this.config.apiKey) {
      throw new APIKeyError('ChatGPT');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });
  }

  async query(params: QueryParams): Promise<TrackingResult> {
    const startTime = Date.now();
    
    try {
      // Rate limiting
      await this.handleRateLimit();

      // Generate the prompt for AI tracking
      const prompt = this.generateTrackingPrompt(params);

      // Call OpenAI API
      const completion = await this.client.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: 'You are an AI visibility tracking expert. Your task is to analyze queries about websites and competitors, providing detailed insights about mentions, sentiment, and competitive positioning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const response = completion.choices[0]?.message?.content || '';
      const executionTime = Date.now() - startTime;

      // Parse the response
      const parsedResult = this.parseResults(response, params);

      // Create metadata
      const metadata: QueryMetadata = {
        executionTime,
        tokensUsed: completion.usage?.total_tokens,
        apiCost: this.calculateCost(completion.usage?.total_tokens || 0),
      };

      // Create tracking result
      const result: TrackingResult = {
        platform: this.name,
        query: params.query,
        response,
        mentions: parsedResult.mentions,
        competitors: parsedResult.competitors,
        metadata,
        timestamp: new Date()
      };

      return result;

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const metadata: QueryMetadata = {
        executionTime,
        error: error.message,
        retryCount: 0
      };

      // Handle specific OpenAI errors
      if (error.status === 429) {
        throw new RateLimitError('ChatGPT', new Date(Date.now() + 60000)); // Reset in 1 minute
      }
      
      if (error.status === 401) {
        throw new APIKeyError('ChatGPT');
      }
      
      if (error.status === 402) {
        throw new QuotaExceededError('ChatGPT', 'API quota');
      }

      throw new PlatformError('ChatGPT', 'QUERY_FAILED', error.message, metadata);
    }
  }

  parseResults(response: string, params: QueryParams): ParsedResult {
    try {
      // Try to parse as JSON first (if the response is structured)
      let analysisData: any;
      
      try {
        analysisData = JSON.parse(response);
      } catch {
        // If not JSON, treat as plain text and analyze
        analysisData = this.analyzePlainTextResponse(response, params);
      }

      // Extract mentions using our mention detector
      const mentions = this.extractMentions(response, params.website, params.competitors || []);
      
      // Analyze competitor mentions
      const competitors = this.analyzeCompetitorMentions(response, params.competitors || []);
      
      // Calculate overall sentiment
      const sentimentAnalyzer = new SentimentAnalyzer();
      const overallSentiment = sentimentAnalyzer.analyzeSentiment(response);
      
      // Calculate visibility score
      const visibilityScore = this.calculateVisibilityScore(mentions, competitors);
      
      // Generate insights
      const insights = this.generateInsights(mentions, competitors, overallSentiment);

      return {
        mentions,
        competitors,
        overallSentiment: overallSentiment.label,
        visibilityScore,
        insights
      };

    } catch (error) {
      console.error('Error parsing ChatGPT results:', error);
      return {
        mentions: [],
        competitors: [],
        overallSentiment: 'neutral',
        visibilityScore: 0,
        insights: ['Failed to parse response']
      };
    }
  }

  extractMentions(content: string, website: string, competitors: string[]): Mention[] {
    const mentionDetector = new MentionDetector();
    const sentimentAnalyzer = new SentimentAnalyzer();
    
    const mentions: Mention[] = [];
    
    // Detect direct mentions of the target website
    const directMentions = mentionDetector.detectMentions(content, [website]);
    
    directMentions.forEach(mention => {
      const sentiment = sentimentAnalyzer.analyzeSentiment(mention.context);
      
      mentions.push({
        type: 'direct',
        website: website,
        content: mention.text,
        position: mention.position,
        context: mention.context,
        sentiment: sentiment.label,
        confidence: mention.confidence,
        citationQuality: this.assessCitationQuality(mention.context)
      });
    });

    return mentions;
  }

  private generateTrackingPrompt(params: QueryParams): string {
    const { query, website, keywords, competitors } = params;
    
    let prompt = `I need you to analyze the following query and provide insights about website visibility and competitive positioning:\n\n`;
    
    prompt += `Query: "${query}"\n`;
    prompt += `Target Website: ${website}\n`;
    
    if (keywords.length > 0) {
      prompt += `Relevant Keywords: ${keywords.join(', ')}\n`;
    }
    
    if (competitors && competitors.length > 0) {
      prompt += `Competitors to analyze: ${competitors.join(', ')}\n`;
    }
    
    prompt += `\nPlease provide a comprehensive analysis that includes:\n`;
    prompt += `1. Any mentions or references to the target website\n`;
    prompt += `2. Sentiment analysis of any mentions (positive, neutral, negative)\n`;
    prompt += `3. Competitive analysis comparing the target website to competitors\n`;
    prompt += `4. Overall visibility assessment\n`;
    prompt += `5. Recommendations for improving visibility\n\n`;
    
    prompt += `Please structure your response to be clear and actionable. Include specific quotes and contexts where relevant.`;
    
    return prompt;
  }

  private analyzePlainTextResponse(response: string, params: QueryParams): any {
    return {
      rawResponse: response,
      targetWebsite: params.website,
      keywords: params.keywords,
      competitors: params.competitors,
      analyzedAt: new Date().toISOString()
    };
  }

  private analyzeCompetitorMentions(content: string, competitors: string[]): CompetitorMention[] {
    const mentionDetector = new MentionDetector();
    const competitorMentions: CompetitorMention[] = [];

    competitors.forEach(competitor => {
      const mentions = this.extractMentions(content, competitor, []);
      
      if (mentions.length > 0) {
        const visibilityScore = this.calculateCompetitorVisibilityScore(mentions);
        
        competitorMentions.push({
          competitorDomain: competitor,
          competitorName: this.extractDomainName(competitor),
          mentions,
          relativePosition: this.calculateRelativePosition(content, competitor),
          visibilityScore
        });
      }
    });

    return competitorMentions;
  }

  private calculateVisibilityScore(mentions: Mention[], competitors: CompetitorMention[]): number {
    let score = 0;
    
    // Base score from direct mentions
    mentions.forEach(mention => {
      let mentionScore = 10; // Base score per mention
      
      // Adjust for sentiment
      if (mention.sentiment === 'positive') mentionScore += 5;
      else if (mention.sentiment === 'negative') mentionScore -= 3;
      
      // Adjust for citation quality
      if (mention.citationQuality === 'high') mentionScore += 3;
      else if (mention.citationQuality === 'low') mentionScore -= 1;
      
      // Adjust for confidence
      mentionScore *= mention.confidence;
      
      score += mentionScore;
    });

    // Adjust for competitive context
    const competitorMentionCount = competitors.reduce((sum, comp) => sum + comp.mentions.length, 0);
    if (competitorMentionCount > 0) {
      score *= (mentions.length / (mentions.length + competitorMentionCount));
    }

    return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
  }

  private calculateCompetitorVisibilityScore(mentions: Mention[]): number {
    return mentions.reduce((score, mention) => {
      let mentionScore = 10;
      if (mention.sentiment === 'positive') mentionScore += 5;
      else if (mention.sentiment === 'negative') mentionScore -= 3;
      return score + (mentionScore * mention.confidence);
    }, 0);
  }

  private calculateRelativePosition(content: string, competitor: string): number | null {
    const position = content.toLowerCase().indexOf(competitor.toLowerCase());
    return position !== -1 ? position : null;
  }

  private assessCitationQuality(context: string): 'high' | 'medium' | 'low' {
    const highQualityIndicators = ['expert', 'research', 'study', 'data', 'analysis', 'recommend'];
    const lowQualityIndicators = ['maybe', 'probably', 'seem', 'appear', 'might'];
    
    const contextLower = context.toLowerCase();
    
    const highScore = highQualityIndicators.filter(indicator => contextLower.includes(indicator)).length;
    const lowScore = lowQualityIndicators.filter(indicator => contextLower.includes(indicator)).length;
    
    if (highScore > lowScore) return 'high';
    if (lowScore > highScore) return 'low';
    return 'medium';
  }

  private extractDomainName(url: string): string {
    try {
      const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      return domain.split('.')[0];
    } catch {
      return url;
    }
  }

  private generateInsights(mentions: Mention[], competitors: CompetitorMention[], sentiment: SentimentAnalysis): string[] {
    const insights: string[] = [];
    
    if (mentions.length === 0) {
      insights.push('No direct mentions found - opportunity to improve visibility');
    } else {
      insights.push(`Found ${mentions.length} mention(s) of target website`);
    }

    if (sentiment.label === 'positive') {
      insights.push('Overall sentiment is positive - good brand perception');
    } else if (sentiment.label === 'negative') {
      insights.push('Overall sentiment is negative - may need reputation management');
    }

    if (competitors.length > 0) {
      const topCompetitor = competitors.sort((a, b) => b.visibilityScore - a.visibilityScore)[0];
      insights.push(`Top competitor: ${topCompetitor.competitorName} (score: ${topCompetitor.visibilityScore})`);
    }

    return insights;
  }

  private calculateCost(tokens: number): number {
    // GPT-4 pricing (approximate)
    const inputCostPer1K = 0.03;
    const outputCostPer1K = 0.06;
    
    // Assume roughly 50/50 split between input and output tokens
    const inputTokens = tokens * 0.5;
    const outputTokens = tokens * 0.5;
    
    return (inputTokens / 1000) * inputCostPer1K + (outputTokens / 1000) * outputCostPer1K;
  }

  private async handleRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset counter if window expired
    if (now - this.lastRequestTime > this.requestWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    
    // Check if we're exceeding rate limit
    if (this.requestCount >= (this.config.requestsPerMinute || 60)) {
      const waitTime = this.requestWindow - (now - this.lastRequestTime);
      throw new RateLimitError('ChatGPT', new Date(now + waitTime));
    }
    
    this.requestCount++;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple ping to check if the service is available
      const response = await this.client.chat.completions.create({
        model: this.config.model!,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      });
      return response.choices.length > 0;
    } catch (error) {
      return false;
    }
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime: Date } | null> {
    const now = Date.now();
    const windowExpiry = this.lastRequestTime + this.requestWindow;
    
    return {
      remaining: Math.max(0, (this.config.requestsPerMinute || 60) - this.requestCount),
      resetTime: new Date(windowExpiry)
    };
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error: any) {
      if (error.status === 401) {
        return false;
      }
      // Other errors might be temporary, so consider key valid
      return true;
    }
  }

  getConfig(): PlatformConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<PlatformConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Recreate client if API key changed
    if (config.apiKey) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        timeout: this.config.timeout,
      });
    }
  }
}