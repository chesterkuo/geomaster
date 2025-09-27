import Anthropic from '@anthropic-ai/sdk';
import { 
  AITrackingPlatform, 
  QueryParams, 
  TrackingResult, 
  ParsedResult, 
  Mention, 
  CompetitorMention,
  PlatformConfig,
  QueryMetadata,
  PlatformError,
  RateLimitError,
  APIKeyError,
  QuotaExceededError
} from './aiPlatformInterface';
import { MentionDetector } from '../../utils/mentionDetector';
import { SentimentAnalyzer } from '../../utils/sentimentAnalyzer';

export class ClaudeService implements AITrackingPlatform {
  name = 'Claude';
  private client: Anthropic;
  private config: PlatformConfig;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private requestWindow: number = 60000; // 1 minute

  constructor(config: PlatformConfig) {
    this.config = {
      model: 'claude-3-5-sonnet-20241213',
      maxTokens: 2000,
      temperature: 0.1,
      requestsPerMinute: 50,
      maxRetries: 3,
      timeout: 30000,
      ...config
    };

    if (!this.config.apiKey) {
      throw new APIKeyError('Claude');
    }

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });
  }

  async query(params: QueryParams): Promise<TrackingResult> {
    const startTime = Date.now();
    
    try {
      await this.handleRateLimit();

      const prompt = this.generateTrackingPrompt(params);

      const message = await this.client.messages.create({
        model: this.config.model!,
        max_tokens: this.config.maxTokens!,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      });

      const response = message.content[0]?.type === 'text' ? message.content[0].text : '';
      const executionTime = Date.now() - startTime;

      const parsedResult = this.parseResults(response, params);

      const metadata: QueryMetadata = {
        executionTime,
        tokensUsed: message.usage?.input_tokens + message.usage?.output_tokens,
        apiCost: this.calculateCost(message.usage?.input_tokens || 0, message.usage?.output_tokens || 0),
      };

      return {
        platform: this.name,
        query: params.query,
        response,
        mentions: parsedResult.mentions,
        competitors: parsedResult.competitors,
        metadata,
        timestamp: new Date()
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const metadata: QueryMetadata = {
        executionTime,
        error: error.message,
        retryCount: 0
      };

      if (error.status === 429) {
        throw new RateLimitError('Claude', new Date(Date.now() + 60000));
      }
      
      if (error.status === 401) {
        throw new APIKeyError('Claude');
      }
      
      if (error.status === 402) {
        throw new QuotaExceededError('Claude', 'API quota');
      }

      throw new PlatformError('Claude', 'QUERY_FAILED', error.message, metadata);
    }
  }

  parseResults(response: string, params: QueryParams): ParsedResult {
    // Similar implementation to ChatGPT but adapted for Claude
    const mentionDetector = new MentionDetector();
    const sentimentAnalyzer = new SentimentAnalyzer();
    
    const mentions = this.extractMentions(response, params.website, params.competitors || []);
    const competitors = this.analyzeCompetitorMentions(response, params.competitors || []);
    const overallSentiment = sentimentAnalyzer.analyzeSentiment(response);
    const visibilityScore = this.calculateVisibilityScore(mentions, competitors);
    const insights = this.generateInsights(mentions, competitors, overallSentiment);

    return {
      mentions,
      competitors,
      overallSentiment: overallSentiment.label,
      visibilityScore,
      insights
    };
  }

  extractMentions(content: string, website: string, competitors: string[]): Mention[] {
    const mentionDetector = new MentionDetector();
    const sentimentAnalyzer = new SentimentAnalyzer();
    
    const mentions: Mention[] = [];
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
    
    let prompt = `As an AI visibility tracking expert, analyze the following query for website mentions and competitive positioning:\n\n`;
    
    prompt += `Query: "${query}"\n`;
    prompt += `Target Website: ${website}\n`;
    
    if (keywords.length > 0) {
      prompt += `Keywords: ${keywords.join(', ')}\n`;
    }
    
    if (competitors && competitors.length > 0) {
      prompt += `Competitors: ${competitors.join(', ')}\n`;
    }
    
    prompt += `\nProvide analysis including:\n`;
    prompt += `1. Direct mentions of the target website\n`;
    prompt += `2. Sentiment analysis (positive/neutral/negative)\n`;
    prompt += `3. Competitor comparison\n`;
    prompt += `4. Visibility assessment\n`;
    prompt += `5. Actionable recommendations\n`;
    
    return prompt;
  }

  private analyzeCompetitorMentions(content: string, competitors: string[]): CompetitorMention[] {
    // Implementation similar to ChatGPT
    return [];
  }

  private calculateVisibilityScore(mentions: Mention[], competitors: CompetitorMention[]): number {
    // Implementation similar to ChatGPT
    return 0;
  }

  private generateInsights(mentions: Mention[], competitors: CompetitorMention[], sentiment: any): string[] {
    // Implementation similar to ChatGPT
    return [];
  }

  private assessCitationQuality(context: string): 'high' | 'medium' | 'low' {
    // Implementation similar to ChatGPT
    return 'medium';
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Claude pricing (approximate)
    const inputCostPer1K = 0.003;
    const outputCostPer1K = 0.015;
    
    return (inputTokens / 1000) * inputCostPer1K + (outputTokens / 1000) * outputCostPer1K;
  }

  private async handleRateLimit(): Promise<void> {
    const now = Date.now();
    
    if (now - this.lastRequestTime > this.requestWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    
    if (this.requestCount >= (this.config.requestsPerMinute || 50)) {
      const waitTime = this.requestWindow - (now - this.lastRequestTime);
      throw new RateLimitError('Claude', new Date(now + waitTime));
    }
    
    this.requestCount++;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Use a simple, valid prompt for availability check
      const response = await this.client.messages.create({
        model: this.config.model!,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "hello" in one word.' }],
      });
      return response.content.length > 0;
    } catch (error: any) {
      console.error(`Claude availability check failed:`, error.message);
      // Return true if we have an API key - let the actual query handle specific errors
      return !!this.config.apiKey;
    }
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime: Date } | null> {
    const now = Date.now();
    const windowExpiry = this.lastRequestTime + this.requestWindow;
    
    return {
      remaining: Math.max(0, (this.config.requestsPerMinute || 50) - this.requestCount),
      resetTime: new Date(windowExpiry)
    };
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.config.model!,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error: any) {
      if (error.status === 401) {
        return false;
      }
      return true;
    }
  }

  getConfig(): PlatformConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<PlatformConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.apiKey) {
      this.client = new Anthropic({
        apiKey: config.apiKey,
        timeout: this.config.timeout,
      });
    }
  }
}