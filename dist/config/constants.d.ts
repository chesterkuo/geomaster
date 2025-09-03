export declare const API_ROUTES: {
    readonly AUTH: "/api/v1/auth";
    readonly WEBSITES: "/api/v1/websites";
    readonly SCANS: "/api/v1/scans";
    readonly CONTENT: "/api/v1/content";
    readonly TRACKING: "/api/v1/tracking";
    readonly REPORTS: "/api/v1/reports";
    readonly ORGANIZATIONS: "/api/v1/organizations";
};
export declare const SCAN_TYPES: {
    readonly QUICK: "quick";
    readonly STANDARD: "standard";
    readonly DEEP: "deep";
};
export declare const SCAN_STATUS: {
    readonly PENDING: "pending";
    readonly RUNNING: "running";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
};
export declare const USER_ROLES: {
    readonly ADMIN: "admin";
    readonly MANAGER: "manager";
    readonly USER: "user";
    readonly VIEWER: "viewer";
};
export declare const ORGANIZATION_PLANS: {
    readonly FREE: "free";
    readonly STARTER: "starter";
    readonly PROFESSIONAL: "professional";
    readonly ENTERPRISE: "enterprise";
};
export declare const AI_PLATFORMS: {
    readonly CHATGPT: "chatgpt";
    readonly GEMINI: "gemini";
    readonly PERPLEXITY: "perplexity";
    readonly CLAUDE: "claude";
};
export declare const OPTIMIZATION_TYPES: {
    readonly SCHEMA_INJECTION: "schema_injection";
    readonly CONTENT_OPTIMIZATION: "content_optimization";
    readonly META_UPDATE: "meta_update";
    readonly FAQ_GENERATION: "faq_generation";
};
export declare const INTEGRATION_TYPES: {
    readonly WORDPRESS: "wordpress";
    readonly SHOPIFY: "shopify";
    readonly WIX: "wix";
    readonly API: "api";
    readonly JAVASCRIPT: "javascript";
};
export declare const INTEGRATION_LEVELS: {
    readonly NO_INTEGRATION: "no_integration";
    readonly JAVASCRIPT: "javascript";
    readonly PLUGIN: "plugin";
    readonly API: "api";
    readonly FULL_INTEGRATION: "full_integration";
};
export declare const GEO_SCORING_WEIGHTS: {
    readonly CONTENT_DEPTH: 0.1;
    readonly STRUCTURE_QUALITY: 0.1;
    readonly SCHEMA_COMPLETENESS: 0.1;
    readonly FRESHNESS: 0.1;
    readonly CRAWLABILITY: 0.15;
    readonly SITE_SPEED: 0.15;
    readonly CITATIONS: 0.15;
    readonly EXPERTISE: 0.15;
};
export declare const QUEUE_NAMES: {
    readonly WEBSITE_SCAN: "website-scan";
    readonly CONTENT_OPTIMIZATION: "content-optimization";
    readonly AI_TRACKING: "ai-tracking";
    readonly REPORT_GENERATION: "report-generation";
};
//# sourceMappingURL=constants.d.ts.map