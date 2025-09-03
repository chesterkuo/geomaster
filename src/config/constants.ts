export const API_ROUTES = {
  AUTH: '/api/v1/auth',
  WEBSITES: '/api/v1/websites',
  SCANS: '/api/v1/scans',
  CONTENT: '/api/v1/content',
  TRACKING: '/api/v1/tracking',
  REPORTS: '/api/v1/reports',
  ORGANIZATIONS: '/api/v1/organizations'
} as const;

export const SCAN_TYPES = {
  QUICK: 'quick',
  STANDARD: 'standard',
  DEEP: 'deep'
} as const;

export const SCAN_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer'
} as const;

export const ORGANIZATION_PLANS = {
  FREE: 'free',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise'
} as const;

export const AI_PLATFORMS = {
  CHATGPT: 'chatgpt',
  GEMINI: 'gemini',
  PERPLEXITY: 'perplexity',
  CLAUDE: 'claude'
} as const;

export const OPTIMIZATION_TYPES = {
  SCHEMA_INJECTION: 'schema_injection',
  CONTENT_OPTIMIZATION: 'content_optimization',
  META_UPDATE: 'meta_update',
  FAQ_GENERATION: 'faq_generation'
} as const;

export const INTEGRATION_TYPES = {
  WORDPRESS: 'wordpress',
  SHOPIFY: 'shopify',
  WIX: 'wix',
  API: 'api',
  JAVASCRIPT: 'javascript'
} as const;

export const INTEGRATION_LEVELS = {
  NO_INTEGRATION: 'no_integration',
  JAVASCRIPT: 'javascript',
  PLUGIN: 'plugin',
  API: 'api',
  FULL_INTEGRATION: 'full_integration'
} as const;

export const GEO_SCORING_WEIGHTS = {
  CONTENT_DEPTH: 0.1,
  STRUCTURE_QUALITY: 0.1,
  SCHEMA_COMPLETENESS: 0.1,
  FRESHNESS: 0.1,
  CRAWLABILITY: 0.15,
  SITE_SPEED: 0.15,
  CITATIONS: 0.15,
  EXPERTISE: 0.15
} as const;

export const QUEUE_NAMES = {
  WEBSITE_SCAN: 'website-scan',
  CONTENT_OPTIMIZATION: 'content-optimization',
  AI_TRACKING: 'ai-tracking',
  REPORT_GENERATION: 'report-generation'
} as const;