import { CrawlResult } from './crawler.service';
interface ScanResults {
    crawlData: CrawlResult[];
    geoScore: number;
    recommendations: any[];
    contentAnalysis: any;
    technicalIssues: any[];
    performance: any;
}
export declare class ScanService {
    private scanQueue;
    private crawlerService;
    private optimizationService;
    private aiTrackingService;
    constructor();
    private setupQueueProcessors;
    initiateScan(websiteId: string, scanType?: string, userId?: string): Promise<string>;
    getScanStatus(scanId: string): Promise<any>;
    getScanResults(scanId: string): Promise<ScanResults | null>;
    private getWebsiteUrl;
    private updateScanStatus;
    private getScanStartTime;
    private analyzeContent;
    private calculateGEOScore;
    private calculateStructureQuality;
    private calculateFreshness;
    private calculateCrawlability;
    private calculateCitations;
    private calculateExpertise;
    private isAuthoritativeSource;
    private generateRecommendations;
    private analyzeTechnicalIssues;
    private calculatePerformanceMetrics;
    private saveContentData;
    private completeScan;
    private failScan;
    private estimateTimeRemaining;
    getQueueStatus(): Promise<any>;
    close(): Promise<void>;
}
export {};
//# sourceMappingURL=scan.service.d.ts.map