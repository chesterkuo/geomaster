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

// Platform configurations for tracking features
export const PLATFORM_CONFIGS = {
  [AI_PLATFORMS.CHATGPT]: {
    id: AI_PLATFORMS.CHATGPT,
    name: 'ChatGPT',
    description: 'OpenAI ChatGPT platform tracking with comprehensive content analysis',
    icon: 'openai',
    supported: true,
    requiresApiKey: false,
    features: ['content_tracking', 'mention_analysis', 'sentiment_analysis'],
    maxRequestsPerDay: 1000,
    pricing: { free: true, paidOnly: false }
  },
  [AI_PLATFORMS.GEMINI]: {
    id: AI_PLATFORMS.GEMINI,
    name: 'Google Gemini',
    description: 'Google Gemini AI platform tracking with advanced search capabilities',
    icon: 'google',
    supported: true,
    requiresApiKey: true,
    features: ['content_tracking', 'real_time_monitoring', 'advanced_analytics'],
    maxRequestsPerDay: 500,
    pricing: { free: false, paidOnly: true }
  },
  [AI_PLATFORMS.PERPLEXITY]: {
    id: AI_PLATFORMS.PERPLEXITY,
    name: 'Perplexity AI',
    description: 'Perplexity AI search platform tracking with citation analysis',
    icon: 'perplexity',
    supported: true,
    requiresApiKey: true,
    features: ['search_tracking', 'citation_analysis', 'source_verification'],
    maxRequestsPerDay: 200,
    pricing: { free: false, paidOnly: true }
  },
  [AI_PLATFORMS.CLAUDE]: {
    id: AI_PLATFORMS.CLAUDE,
    name: 'Claude AI',
    description: 'Anthropic Claude AI platform tracking with conversation analysis',
    icon: 'anthropic',
    supported: true,
    requiresApiKey: true,
    features: ['conversation_tracking', 'content_analysis', 'ethical_monitoring'],
    maxRequestsPerDay: 300,
    pricing: { free: true, paidOnly: false }
  }
} as const;

export const PLAN_LIMITATIONS = {
  [ORGANIZATION_PLANS.FREE]: {
    maxPlatforms: 2,
    maxAlertEmails: 1,
    defaultFrequency: 'weekly' as const,
    alertsEnabled: false,
    requestMultiplier: 0.1
  },
  [ORGANIZATION_PLANS.STARTER]: {
    maxPlatforms: -1,
    maxAlertEmails: 3,
    defaultFrequency: 'daily' as const,
    alertsEnabled: true,
    requestMultiplier: 0.5
  },
  [ORGANIZATION_PLANS.PROFESSIONAL]: {
    maxPlatforms: -1,
    maxAlertEmails: -1,
    defaultFrequency: 'daily' as const,
    alertsEnabled: true,
    requestMultiplier: 1.0
  },
  [ORGANIZATION_PLANS.ENTERPRISE]: {
    maxPlatforms: -1,
    maxAlertEmails: -1,
    defaultFrequency: 'daily' as const,
    alertsEnabled: true,
    requestMultiplier: 2.0
  }
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