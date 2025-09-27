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

export class GeminiService implements AITrackingPlatform {
  name = 'Gemini';
  private config: PlatformConfig;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private requestWindow: number = 60000; // 1 minute

  constructor(config: PlatformConfig) {
    this.config = {
      model: 'gemini-2.5-flash',
      maxTokens: 2000,
      temperature: 0.1,
      requestsPerMinute: 60,
      maxRetries: 3,
      timeout: 30000,
      baseUrl: 'https://generativelanguage.googleapis.com/v1/models',
      ...config
    };

    if (!this.config.apiKey) {
      throw new APIKeyError('Gemini');
    }
  }

  async query(params: QueryParams): Promise<TrackingResult> {
    const startTime = Date.now();
    
    try {
      await this.handleRateLimit();

      const prompt = this.generateTrackingPrompt(params);
      
      // Call Gemini API
      const response = await this.callGeminiAPI(prompt);
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
        throw new RateLimitError('Gemini', new Date(Date.now() + 60000));
      }
      
      if (error.status === 401 || error.status === 403) {
        throw new APIKeyError('Gemini');
      }

      throw new PlatformError('Gemini', 'QUERY_FAILED', error.message, metadata);
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `${this.config.baseUrl}/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('Invalid response format from Gemini API');
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
    // Similar to other platforms
    return `Analyze this query for AI visibility tracking: "${params.query}" for website ${params.website}`;
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
    // Gemini pricing (approximate)
    const tokensApprox = responseLength / 4; // Rough approximation
    const costPer1K = 0.001;
    return (tokensApprox / 1000) * costPer1K;
  }

  private async handleRateLimit(): Promise<void> {
    const now = Date.now();
    
    if (now - this.lastRequestTime > this.requestWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    
    if (this.requestCount >= (this.config.requestsPerMinute || 60)) {
      const waitTime = this.requestWindow - (now - this.lastRequestTime);
      throw new RateLimitError('Gemini', new Date(now + waitTime));
    }
    
    this.requestCount++;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Use a simple, valid prompt for availability check
      const testPrompt = "Say 'hello' in one word.";
      await this.callGeminiAPI(testPrompt);
      return true;
    } catch (error: any) {
      console.error(`Gemini availability check failed:`, error.message);
      // Return true if we have an API key - let the actual query handle specific errors
      return !!this.config.apiKey;
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
      await this.callGeminiAPI('test');
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