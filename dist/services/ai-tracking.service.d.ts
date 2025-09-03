export interface TrackingQuery {
    query: string;
    keywords?: string[];
    websiteUrl: string;
    platforms?: string[];
}
export interface TrackingResult {
    platform: string;
    query: string;
    isMentioned: boolean;
    isCited: boolean;
    citationPosition?: number;
    snippet?: string;
    fullResponse: string;
    competitorMentions: string[];
    confidence: number;
}
export declare class AITrackingService {
    private openai;
    private perplexityApiKey;
    private geminiApiKey;
    constructor();
    trackWebsiteVisibility(websiteId: string, queries: string[], platforms?: string[]): Promise<TrackingResult[]>;
    private queryAIPlatform;
    private queryChatGPT;
    private queryPerplexity;
    private queryGemini;
    private queryClaude;
    private analyzeResponse;
    private findMentionVariations;
    private findCompetitorMentions;
    private calculateConfidence;
    private saveTrackingResult;
    getVisibilityMetrics(websiteId: string, dateFrom: Date, dateTo: Date): Promise<any>;
    getCompetitorAnalysis(websiteId: string, dateFrom: Date, dateTo: Date): Promise<any>;
    getTrendingQueries(websiteId: string, limit?: number): Promise<any>;
    generateKeywordSuggestions(websiteId: string, topic: string): Promise<string[]>;
    bulkTrackQueries(websiteId: string, queries: string[], platforms?: string[]): Promise<void>;
    private delay;
}
//# sourceMappingURL=ai-tracking.service.d.ts.map