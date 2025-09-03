export interface OptimizationOptions {
    targetKeywords?: string[];
    contentType?: 'page' | 'post' | 'product' | 'faq';
    optimizationTypes?: string[];
    targetAudience?: string;
    tone?: 'professional' | 'casual' | 'technical' | 'friendly';
}
export interface OptimizationResult {
    optimizedContent: string;
    optimizedTitle?: string;
    optimizedMetaDescription?: string;
    generatedFAQ?: Array<{
        question: string;
        answer: string;
    }>;
    schemaMarkup?: any[];
    improvements: Array<{
        type: string;
        description: string;
        beforeValue?: string;
        afterValue?: string;
        impact: 'high' | 'medium' | 'low';
    }>;
    geoScoreImprovement: number;
}
export declare class OptimizationService {
    private openai;
    constructor();
    optimizeContent(contentId: string, options?: OptimizationOptions): Promise<OptimizationResult>;
    private optimizeMainContent;
    private optimizeTitle;
    private optimizeMetaDescription;
    private generateFAQ;
    private generateSchemaMarkup;
    private calculateImprovements;
    private estimateScoreImprovement;
    private saveOptimizedContent;
    generateOneClickOptimization(websiteId: string, options?: OptimizationOptions): Promise<any>;
    generateOptimizationDownloadPackage(websiteId: string, contentIds: string[]): Promise<any>;
    getOptimizationPreview(contentId: string, optimizationType: string): Promise<any>;
    private generateContentPreview;
    private generateSchemaPreview;
    private generateFAQPreview;
    private generateMetaPreview;
}
//# sourceMappingURL=optimization.service.d.ts.map