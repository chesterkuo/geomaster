import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { SecurityMonitor, SecurityEventType, SecuritySeverity } from '../services/security-monitor';

/**
 * Security Middleware Configuration
 * Implements comprehensive security controls including CORS, CSP, and rate limiting
 */

// Environment-based allowed origins
const getAllowedOrigins = (): string[] => {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') {
    return [
      'https://geo-platform.com',
      'https://app.geo-platform.com',
      'https://api.geo-platform.com'
    ];
  } else if (env === 'staging') {
    return [
      'https://staging.geo-platform.com',
      'https://staging-app.geo-platform.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
  } else {
    // Development
    return [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://10.74.100.10:3000',
      'http://10.74.100.10:5173'
    ];
  }
};

/**
 * Secure CORS Configuration
 */
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      } else {
        return callback(new Error('Origin required for security'), false);
      }
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from unauthorized origin', { origin });
      callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Organization-ID',
    'X-API-Key',
    'X-Fingerprint'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 600, // 10 minutes (reduced from 24 hours for security)
  optionsSuccessStatus: 200,
  preflightContinue: false
};

/**
 * Security Headers with Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for some admin panels
        'https://cdn.jsdelivr.net',
        'https://unpkg.com'
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'blob:'
      ],
      connectSrc: [
        "'self'",
        'https://api.geo-platform.com',
        'wss://ws.geo-platform.com',
        'https://api.openai.com',
        'https://api.anthropic.com'
      ],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      ...(process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
      ...(process.env.NODE_ENV === 'production' ? { blockAllMixedContent: [] } : {})
    },
    reportOnly: process.env.NODE_ENV === 'development'
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Prevent MIME type sniffing
  noSniff: true,

  // Prevent XSS attacks
  xssFilter: true,

  // Control referrer policy
  referrerPolicy: {
    policy: ['origin-when-cross-origin', 'strict-origin-when-cross-origin']
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Prevent clickjacking
  frameguard: { action: 'deny' },

  // DNS prefetch control
  dnsPrefetchControl: { allow: false }
});

/**
 * Rate Limiting for Authentication Endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again in 15 minutes',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP and user email if provided
    const email = req.body?.email || 'unknown';
    return `${req.ip}:${email}`;
  },
  skip: (req) => {
    // Skip rate limiting for successful requests in development
    return process.env.NODE_ENV === 'development' && req.path.includes('/verify');
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      endpoint: req.path
    });
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again in 15 minutes',
      retryAfter: 900
    });
  }
});

/**
 * General API Rate Limiting
 */
export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please slow down.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Include user ID in rate limiting key if authenticated
    const userId = (req as any).user?.id || 'anonymous';
    return `${req.ip}:${userId}`;
  }
});

/**
 * Slow Down Middleware for Expensive Operations (Temporarily Disabled)
 */
export const slowDownMiddleware: any = (req: any, res: any, next: any) => next();

/**
 * Request Sanitization Middleware
 */
export const sanitizeRequest = [
  // Prevent NoSQL injection
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      logger.warn('Request sanitized - potential NoSQL injection attempt', {
        ip: req.ip,
        key,
        userAgent: req.get('user-agent')
      });
    }
  }),

  // Prevent HTTP Parameter Pollution
  hpp({
    whitelist: ['tags', 'categories', 'filters'] // Allow arrays for these params
  })
];

/**
 * Security Event Logging Middleware
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log potentially suspicious requests
  const suspiciousPatterns = [
    /\b(script|javascript|vbscript)\b/i,
    /[<>'"]/,
    /(union|select|insert|drop|delete|update)\s/i,
    /\.\./,
    /%[0-9a-f]{2}/i
  ];

  const url = req.originalUrl;
  const userAgent = req.get('user-agent') || '';
  const suspicious = suspiciousPatterns.some(pattern =>
    pattern.test(url) || pattern.test(userAgent) ||
    pattern.test(JSON.stringify(req.query)) ||
    pattern.test(JSON.stringify(req.body))
  );

  if (suspicious) {
    logger.warn('Suspicious request detected', {
      ip: req.ip,
      method: req.method,
      url,
      userAgent,
      query: req.query,
      body: req.body,
      headers: req.headers
    });
  }

  next();
};

/**
 * Content Type Validation
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');

    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type header required',
        code: 'MISSING_CONTENT_TYPE'
      });
    }

    const allowedTypes = [
      'application/json',
      'multipart/form-data',
      'application/x-www-form-urlencoded'
    ];

    const isValidType = allowedTypes.some(type =>
      contentType.toLowerCase().includes(type)
    );

    if (!isValidType) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        code: 'INVALID_CONTENT_TYPE',
        allowed: allowedTypes
      });
    }
  }

  next();
};

/**
 * Request Size Limiting
 */
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const contentLength = parseInt(req.get('content-length') || '0');

  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Request entity too large',
      maxSize: '10MB',
      received: `${Math.round(contentLength / 1024 / 1024)}MB`
    });
  }

  next();
};

/**
 * Apply all security middleware
 */
export const applySecurityMiddleware = [
  securityHeaders,
  cors(corsOptions),
  ...sanitizeRequest,
  securityLogger,
  validateContentType,
  requestSizeLimit
];

/**
 * CSP Violation Reporter
 */
export const cspViolationReporter = (req: Request, res: Response) => {
  const violation = req.body;

  logger.warn('CSP Violation Report', {
    documentUri: violation['document-uri'],
    violatedDirective: violation['violated-directive'],
    blockedUri: violation['blocked-uri'],
    sourceFile: violation['source-file'],
    lineNumber: violation['line-number'],
    columnNumber: violation['column-number'],
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  res.status(204).end();
};

/**
 * Enhanced Security Monitoring Middleware
 */

/**
 * Middleware to automatically log security events with SecurityMonitor
 */
export const securityEventLoggingMiddleware = (
  eventType: SecurityEventType,
  severity: SecuritySeverity = SecuritySeverity.LOW
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = SecurityMonitor.createSecurityEventFromRequest(
        req,
        eventType,
        severity
      );

      await SecurityMonitor.logSecurityEvent(event);
      next();
    } catch (error) {
      logger.error('Security event logging middleware error:', error);
      next(); // Continue even if logging fails
    }
  };
};

/**
 * Middleware to check for suspicious IPs using SecurityMonitor
 */
export const suspiciousIPMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const isSuspicious = await SecurityMonitor.isSuspiciousIP(clientIP);

    if (isSuspicious) {
      const event = SecurityMonitor.createSecurityEventFromRequest(
        req,
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        SecuritySeverity.HIGH,
        { reason: 'Request from flagged suspicious IP' }
      );

      await SecurityMonitor.logSecurityEvent(event);

      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP has been flagged for suspicious activity'
      });
    }

    next();
  } catch (error) {
    logger.error('Suspicious IP middleware error:', error);
    next(); // Continue on error
  }
};

/**
 * Enhanced SQL injection detection with SecurityMonitor integration
 */
export const sqlInjectionDetectionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const suspiciousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(--|\/\*|\*\/|;)/g,
      /(\bOR\b|\bAND\b).*[=<>]/gi,
      /'.*(\bOR\b|\bAND\b).*'/gi,
      /(\bUNION\b.*\bSELECT\b)/gi,
      /(\bINTO\b.*\bOUTFILE\b)/gi
    ];

    const checkValue = (value: any): boolean => {
      if (typeof value === 'string') {
        return suspiciousPatterns.some(pattern => pattern.test(value));
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkValue);
      }
      return false;
    };

    const hasSQLInjection = checkValue(req.query) ||
                          checkValue(req.body) ||
                          checkValue(req.params);

    if (hasSQLInjection) {
      const event = SecurityMonitor.createSecurityEventFromRequest(
        req,
        SecurityEventType.SQL_INJECTION_ATTEMPT,
        SecuritySeverity.CRITICAL,
        {
          query: req.query,
          body: req.body,
          params: req.params,
          detectedPatterns: suspiciousPatterns.filter(p =>
            checkValue(req.query) || checkValue(req.body) || checkValue(req.params)
          )
        }
      );

      await SecurityMonitor.logSecurityEvent(event);

      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request contains potentially malicious content'
      });
    }

    next();
  } catch (error) {
    logger.error('SQL injection detection middleware error:', error);
    next();
  }
};

/**
 * Enhanced XSS detection with SecurityMonitor integration
 */
export const xssDetectionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /expression\s*\(/gi,
      /vbscript:/gi
    ];

    const checkValue = (value: any): boolean => {
      if (typeof value === 'string') {
        return xssPatterns.some(pattern => pattern.test(value));
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkValue);
      }
      return false;
    };

    const hasXSS = checkValue(req.query) ||
                   checkValue(req.body) ||
                   checkValue(req.params);

    if (hasXSS) {
      const event = SecurityMonitor.createSecurityEventFromRequest(
        req,
        SecurityEventType.XSS_ATTEMPT,
        SecuritySeverity.HIGH,
        {
          query: req.query,
          body: req.body,
          params: req.params,
          detectedPatterns: xssPatterns.filter(p =>
            checkValue(req.query) || checkValue(req.body) || checkValue(req.params)
          )
        }
      );

      await SecurityMonitor.logSecurityEvent(event);

      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request contains potentially malicious content'
      });
    }

    next();
  } catch (error) {
    logger.error('XSS detection middleware error:', error);
    next();
  }
};

/**
 * API usage tracking with SecurityMonitor integration
 */
export const apiUsageTrackingMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Create a low-priority API access event for monitoring
    const event = SecurityMonitor.createSecurityEventFromRequest(
      req,
      SecurityEventType.API_ABUSE, // SecurityMonitor will filter based on actual abuse patterns
      SecuritySeverity.LOW,
      {
        endpoint: req.path,
        method: req.method
      }
    );

    // Don't await to avoid blocking the request
    SecurityMonitor.logSecurityEvent(event).catch(error => {
      logger.error('API usage tracking error:', error);
    });

    next();
  } catch (error) {
    logger.error('API usage tracking middleware error:', error);
    next();
  }
};