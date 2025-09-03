export interface CrawlResult {
    url: string;
    title?: string;
    metaDescription?: string;
    headings: {
        h1: string[];
        h2: string[];
        h3: string[];
    };
    content: string;
    wordCount: number;
    images: {
        src: string;
        alt?: string;
        title?: string;
    }[];
    links: {
        href: string;
        text: string;
        type: 'internal' | 'external';
    }[];
    schema: any[];
    robotsTxt?: {
        content: string;
        allowsAIBots: boolean;
        blocked: string[];
        allowed: string[];
    };
    performance?: {
        loadTime: number;
        domContentLoaded: number;
        firstContentfulPaint: number;
    };
    technical: {
        hasSchemaMarkup: boolean;
        hasOpenGraph: boolean;
        hasTwitterCard: boolean;
        responsiveDesign: boolean;
        httpsEnabled: boolean;
    };
}
export declare class CrawlerService {
    private browser?;
    private readonly userAgent;
    private readonly timeout;
    private readonly rateLimit;
    constructor();
    private initializeBrowser;
    crawlWebsite(websiteUrl: string, scanType?: 'quick' | 'standard' | 'deep'): Promise<CrawlResult[]>;
    private crawlPage;
    private fetchRobotsTxt;
    private discoverPages;
    private delay;
    close(): Promise<void>;
}
//# sourceMappingURL=crawler.service.d.ts.map