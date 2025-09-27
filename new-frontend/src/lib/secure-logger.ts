/**
 * Secure Logger Utility
 * Replaces console.log statements with secure, environment-aware logging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  sanitized?: boolean;
}

class SecureLogger {
  private static instance: SecureLogger;
  private readonly isDevelopment: boolean;
  private readonly isProduction: boolean;
  private readonly sensitivePatterns: RegExp[];

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.isProduction = import.meta.env.PROD;

    // Patterns to detect and sanitize sensitive information
    this.sensitivePatterns = [
      /token[s]?\s*[:=]\s*['"]\w+['"]/gi,
      /api[_-]?key[s]?\s*[:=]\s*['"]\w+['"]/gi,
      /password[s]?\s*[:=]\s*['"]\w+['"]/gi,
      /secret[s]?\s*[:=]\s*['"]\w+['"]/gi,
      /bearer\s+[\w-]+/gi,
      /sk_[\w\-]+/gi,
      /pk_[\w\-]+/gi,
      /(ey[A-Za-z0-9_-]*\.ey[A-Za-z0-9_-]*\.[\w\-]*)/gi, // JWT tokens
    ];
  }

  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  /**
   * Sanitize potentially sensitive data before logging
   */
  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      let sanitized = data;
      this.sensitivePatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      });
      return sanitized;
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = Array.isArray(data) ? [] : {};

      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          // Sanitize keys that might contain sensitive info
          if (/token|password|secret|key|auth/i.test(key)) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = this.sanitizeData(data[key]);
          }
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const levelStr = LogLevel[entry.level];
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    return `[${timestamp}] ${levelStr}: ${entry.message}${context}`;
  }

  /**
   * Log with specified level
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    // In production, only log errors and warnings
    if (this.isProduction && level > LogLevel.WARN) {
      return;
    }

    // In development, show all logs but sanitize sensitive data
    const sanitizedContext = context ? this.sanitizeData(context) : undefined;
    const sanitizedMessage = this.sanitizeData(message);

    const entry: LogEntry = {
      level,
      message: sanitizedMessage,
      timestamp: new Date(),
      context: sanitizedContext,
      sanitized: true
    };

    // Use appropriate console method based on level
    const formattedEntry = this.formatLogEntry(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedEntry);
        break;
      case LogLevel.WARN:
        console.warn(formattedEntry);
        break;
      case LogLevel.INFO:
        if (this.isDevelopment) {
          console.info(formattedEntry);
        }
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedEntry);
        }
        break;
      default:
        if (this.isDevelopment) {
          console.log(formattedEntry);
        }
    }

    // In production, could send to logging service here
    if (this.isProduction && level <= LogLevel.WARN) {
      this.sendToLogService(entry);
    }
  }

  /**
   * Send logs to external service (production only)
   */
  private async sendToLogService(entry: LogEntry): Promise<void> {
    // Implementation would send to external logging service
    // For now, just store in sessionStorage for debugging
    try {
      const logs = JSON.parse(sessionStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      // Keep only last 100 entries
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      sessionStorage.setItem('app_logs', JSON.stringify(logs));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Public logging methods
   */
  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Specialized logging methods for common scenarios
   */
  apiRequest(url: string, method: string, sanitizeUrl = true): void {
    if (this.isDevelopment) {
      const sanitizedUrl = sanitizeUrl ? this.sanitizeData(url) : url;
      this.debug('API Request', { url: sanitizedUrl, method });
    }
  }

  apiError(message: string, error: any): void {
    const sanitizedError = this.sanitizeData(error);
    this.error(message, { error: sanitizedError });
  }

  authEvent(event: string, details?: Record<string, any>): void {
    if (this.isDevelopment) {
      const sanitizedDetails = details ? this.sanitizeData(details) : undefined;
      this.debug(`Auth: ${event}`, sanitizedDetails);
    }
  }

  securityEvent(event: string, details: Record<string, any>): void {
    // Security events are always logged
    this.warn(`Security: ${event}`, this.sanitizeData(details));
  }

  websocketEvent(event: string, data?: any): void {
    if (this.isDevelopment) {
      const sanitizedData = data ? this.sanitizeData(data) : undefined;
      this.debug(`WebSocket: ${event}`, sanitizedData);
    }
  }
}

// Export singleton instance
export const logger = SecureLogger.getInstance();

// Export for backward compatibility and testing
export default logger;