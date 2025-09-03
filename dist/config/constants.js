"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_NAMES = exports.GEO_SCORING_WEIGHTS = exports.INTEGRATION_LEVELS = exports.INTEGRATION_TYPES = exports.OPTIMIZATION_TYPES = exports.AI_PLATFORMS = exports.ORGANIZATION_PLANS = exports.USER_ROLES = exports.SCAN_STATUS = exports.SCAN_TYPES = exports.API_ROUTES = void 0;
exports.API_ROUTES = {
    AUTH: '/api/v1/auth',
    WEBSITES: '/api/v1/websites',
    SCANS: '/api/v1/scans',
    CONTENT: '/api/v1/content',
    TRACKING: '/api/v1/tracking',
    REPORTS: '/api/v1/reports',
    ORGANIZATIONS: '/api/v1/organizations'
};
exports.SCAN_TYPES = {
    QUICK: 'quick',
    STANDARD: 'standard',
    DEEP: 'deep'
};
exports.SCAN_STATUS = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed'
};
exports.USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    USER: 'user',
    VIEWER: 'viewer'
};
exports.ORGANIZATION_PLANS = {
    FREE: 'free',
    STARTER: 'starter',
    PROFESSIONAL: 'professional',
    ENTERPRISE: 'enterprise'
};
exports.AI_PLATFORMS = {
    CHATGPT: 'chatgpt',
    GEMINI: 'gemini',
    PERPLEXITY: 'perplexity',
    CLAUDE: 'claude'
};
exports.OPTIMIZATION_TYPES = {
    SCHEMA_INJECTION: 'schema_injection',
    CONTENT_OPTIMIZATION: 'content_optimization',
    META_UPDATE: 'meta_update',
    FAQ_GENERATION: 'faq_generation'
};
exports.INTEGRATION_TYPES = {
    WORDPRESS: 'wordpress',
    SHOPIFY: 'shopify',
    WIX: 'wix',
    API: 'api',
    JAVASCRIPT: 'javascript'
};
exports.INTEGRATION_LEVELS = {
    NO_INTEGRATION: 'no_integration',
    JAVASCRIPT: 'javascript',
    PLUGIN: 'plugin',
    API: 'api',
    FULL_INTEGRATION: 'full_integration'
};
exports.GEO_SCORING_WEIGHTS = {
    CONTENT_DEPTH: 0.1,
    STRUCTURE_QUALITY: 0.1,
    SCHEMA_COMPLETENESS: 0.1,
    FRESHNESS: 0.1,
    CRAWLABILITY: 0.15,
    SITE_SPEED: 0.15,
    CITATIONS: 0.15,
    EXPERTISE: 0.15
};
exports.QUEUE_NAMES = {
    WEBSITE_SCAN: 'website-scan',
    CONTENT_OPTIMIZATION: 'content-optimization',
    AI_TRACKING: 'ai-tracking',
    REPORT_GENERATION: 'report-generation'
};
//# sourceMappingURL=constants.js.map