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
  APIKeyError
} from './aiPlatformInterface';
import { MentionDetector } from '../../utils/mentionDetector';
import { SentimentAnalyzer } from '../../utils/sentimentAnalyzer';

export class PerplexityService implements AITrackingPlatform {
  name = 'Perplexity';
  private config: PlatformConfig;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private requestWindow: number = 60000; // 1 minute

  constructor(config: PlatformConfig) {
    this.config = {
      model: 'llama-3-sonar-large-32k-online',
      maxTokens: 2000,
      temperature: 0.1,
      requestsPerMinute: 20, // Perplexity has lower limits
      maxRetries: 3,
      timeout: 30000,
      baseUrl: 'https://api.perplexity.ai/chat/completions',
      ...config
    };

    if (!this.config.apiKey) {
      throw new APIKeyError('Perplexity');
    }
  }

  async query(params: QueryParams): Promise<TrackingResult> {
    const startTime = Date.now();
    
    try {
      await this.handleRateLimit();

      const prompt = this.generateTrackingPrompt(params);
      
      // Call Perplexity API
      const response = await this.callPerplexityAPI(prompt);
      const executionTime = Date.now() - startTime;

      const parsedResult = this.parseResults(response, params);

      const metadata: QueryMetadata = {
        executionTime,
        tokensUsed: response.length, // Approximate
        apiCost: this.calculateCost(response.length),
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
        throw new RateLimitError('Perplexity', new Date(Date.now() + 60000));
      }
      
      if (error.status === 401 || error.status === 403) {
        throw new APIKeyError('Perplexity');
      }

      throw new PlatformError('Perplexity', 'QUERY_FAILED', error.message, metadata);
    }
  }

  private async callPerplexityAPI(prompt: string): Promise<string> {
    const requestBody = {
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI visibility tracking expert. Analyze queries for website mentions and competitive positioning.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: false
    };

    const response = await fetch(this.config.baseUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    
    throw new Error('Invalid response format from Perplexity API');
  }

  parseResults(response: string, params: QueryParams): ParsedResult {
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
    
    let prompt = `Analyze this search query for AI visibility and competitive positioning:\n\n`;
    
    prompt += `Query: "${query}"\n`;
    prompt += `Target Website: ${website}\n`;
    
    if (keywords.length > 0) {
      prompt += `Keywords: ${keywords.join(', ')}\n`;
    }
    
    if (competitors && competitors.length > 0) {
      prompt += `Competitors: ${competitors.join(', ')}\n`;
    }
    
    prompt += `\nProvide analysis including mentions, sentiment, and competitive insights with real-time data.`;
    
    return prompt;
  }

  private analyzeCompetitorMentions(content: string, competitors: string[]): CompetitorMention[] {
    return []; // Placeholder
  }

  private calculateVisibilityScore(mentions: Mention[], competitors: CompetitorMention[]): number {
    return 0; // Placeholder
  }

  private generateInsights(mentions: Mention[], competitors: CompetitorMention[], sentiment: any): string[] {
    return []; // Placeholder
  }

  private assessCitationQuality(context: string): 'high' | 'medium' | 'low' {
    return 'medium'; // Placeholder
  }

  private calculateCost(responseLength: number): number {
    // Perplexity pricing (approximate)
    const tokensApprox = responseLength / 4;
    const costPer1K = 0.002;
    return (tokensApprox / 1000) * costPer1K;
  }

  private async handleRateLimit(): Promise<void> {
    const now = Date.now();
    
    if (now - this.lastRequestTime > this.requestWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    
    if (this.requestCount >= (this.config.requestsPerMinute || 20)) {
      const waitTime = this.requestWindow - (now - this.lastRequestTime);
      throw new RateLimitError('Perplexity', new Date(now + waitTime));
    }
    
    this.requestCount++;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.callPerplexityAPI('test');
      return true;
    } catch (error) {
      return false;
    }
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime: Date } | null> {
    const now = Date.now();
    const windowExpiry = this.lastRequestTime + this.requestWindow;
    
    return {
      remaining: Math.max(0, (this.config.requestsPerMinute || 20) - this.requestCount),
      resetTime: new Date(windowExpiry)
    };
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.callPerplexityAPI('test');
      return true;
    } catch (error: any) {
      if (error.message.includes('401') || error.message.includes('403')) {
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
  }
}