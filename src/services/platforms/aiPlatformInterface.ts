// AI Platform Interface Definition
export interface QueryParams {
  query: string;
  website: string;
  keywords: string[];
  competitors?: string[];
  context?: string;
  maxResults?: number;
}

export interface TrackingResult {
  platform: string;
  query: string;
  response: string;
  mentions: Mention[];
  competitors: CompetitorMention[];
  metadata: QueryMetadata;
  timestamp: Date;
}

export interface Mention {
  type: 'direct' | 'indirect' | 'competitor';
  website: string;
  content: string;
  position: number | null;
  context: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-1 confidence score
  citationQuality: 'high' | 'medium' | 'low';
}

export interface CompetitorMention {
  competitorDomain: string;
  competitorName: string;
  mentions: Mention[];
  relativePosition: number | null; // Position relative to target website
  visibilityScore: number; // 0-100 score
}

export interface QueryMetadata {
  executionTime: number; // ms
  tokensUsed?: number;
  apiCost?: number;
  rateLimit?: {
    remaining: number;
    resetTime: Date;
  };
  error?: string;
  retryCount?: number;
}

export interface ParsedResult {
  mentions: Mention[];
  competitors: CompetitorMention[];
  overallSentiment: 'positive' | 'neutral' | 'negative';
  visibilityScore: number;
  insights: string[];
}

// Main AI Platform Interface
export interface AITrackingPlatform {
  name: string;
  
  // Core functionality
  query(params: QueryParams): Promise<TrackingResult>;
  parseResults(response: any, params: QueryParams): ParsedResult;
  extractMentions(content: string, website: string, competitors: string[]): Mention[];
  
  // Platform-specific methods
  isAvailable(): Promise<boolean>;
  getRateLimit(): Promise<{ remaining: number; resetTime: Date } | null>;
  validateApiKey(): Promise<boolean>;
  
  // Configuration
  getConfig(): PlatformConfig;
  updateConfig(config: Partial<PlatformConfig>): void;
}

export interface PlatformConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  requestsPerMinute?: number;
  maxRetries?: number;
  timeout?: number; // ms
}

// Query Templates
export interface QueryTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: 'brand' | 'competitive' | 'feature' | 'comparison';
  platforms: string[];
}

// Analysis Types
export interface SentimentAnalysis {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0 to 1
}

export interface CompetitiveAnalysis {
  targetWebsite: string;
  competitors: CompetitorMention[];
  marketPosition: number; // 1-based ranking
  visibilityTrend: 'increasing' | 'stable' | 'decreasing';
  recommendations: string[];
}

// Error Types
export class PlatformError extends Error {
  constructor(
    public platform: string,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}

export class RateLimitError extends PlatformError {
  constructor(
    platform: string,
    public resetTime: Date,
    public remaining: number = 0
  ) {
    super(platform, 'RATE_LIMIT', `Rate limit exceeded for ${platform}. Resets at ${resetTime}`);
  }
}

export class APIKeyError extends PlatformError {
  constructor(platform: string) {
    super(platform, 'INVALID_API_KEY', `Invalid or missing API key for ${platform}`);
  }
}

export class QuotaExceededError extends PlatformError {
  constructor(platform: string, public quotaType: string) {
    super(platform, 'QUOTA_EXCEEDED', `${quotaType} quota exceeded for ${platform}`);
  }
}

// Platform Factory Interface
export interface PlatformFactory {
  createPlatform(platformName: string, config: PlatformConfig): AITrackingPlatform;
  getSupportedPlatforms(): string[];
  isPlatformSupported(platformName: string): boolean;
}

// Job Data Interfaces for Queue System
export interface AITrackingJobData {
  websiteId: string;
  organizationId: string;
  platforms: string[];
  keywords: string[];
  competitors: string[];
  trackingSettings: {
    frequency: 'hourly' | 'daily' | 'weekly';
    platforms: string[];
    alertsEnabled: boolean;
  };
  queryTemplates?: QueryTemplate[];
  priority?: number;
  scheduledAt?: Date;
}

export interface TrackingJobResult {
  websiteId: string;
  organizationId: string;
  platform: string;
  results: TrackingResult[];
  summary: {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    totalMentions: number;
    averageVisibilityScore: number;
    overallSentiment: 'positive' | 'neutral' | 'negative';
  };
  errors: Array<{
    query: string;
    error: string;
    code: string;
  }>;
  executionTime: number;
  completedAt: Date;
}

// Utility Types
export type PlatformName = 'chatgpt' | 'claude' | 'gemini' | 'perplexity';
export type QueryCategory = 'brand' | 'competitive' | 'feature' | 'comparison';
export type SentimentLabel = 'positive' | 'neutral' | 'negative';
export type CitationQuality = 'high' | 'medium' | 'low';
export type MentionType = 'direct' | 'indirect' | 'competitor';