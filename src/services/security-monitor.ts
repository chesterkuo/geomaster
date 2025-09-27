import { Request } from 'express';
import { redis as redisClient } from '../config/redis';
import { SessionManager } from './session-manager';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  sessionId?: string;
  ip: string;
  userAgent: string;
  details: any;
  timestamp: Date;
  location?: string;
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  SESSION_HIJACK_ATTEMPT = 'SESSION_HIJACK_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  MULTIPLE_LOGIN_ATTEMPTS = 'MULTIPLE_LOGIN_ATTEMPTS',
  ACCOUNT_LOCKOUT = 'ACCOUNT_LOCKOUT',
  UNUSUAL_LOCATION = 'UNUSUAL_LOCATION',
  API_ABUSE = 'API_ABUSE',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT'
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: SecuritySeverity;
  events: SecurityEvent[];
  timestamp: Date;
  acknowledged: boolean;
}

export class SecurityMonitor {
  private static readonly SECURITY_LOG_PREFIX = 'security_log:';
  private static readonly SECURITY_ALERT_PREFIX = 'security_alert:';
  private static readonly USER_ACTIVITY_PREFIX = 'user_activity:';
  private static readonly SUSPICIOUS_IP_PREFIX = 'suspicious_ip:';

  /**
   * Log a security event
   */
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const logKey = `${this.SECURITY_LOG_PREFIX}${eventId}`;

      // Store event in Redis with 30-day TTL
      await redisClient.setex(logKey, 30 * 24 * 60 * 60, JSON.stringify(event));

      // Add to daily event index for easier querying
      const dateKey = `security_events:${new Date().toISOString().split('T')[0]}`;
      await redisClient.sadd(dateKey, eventId);
      await redisClient.expire(dateKey, 30 * 24 * 60 * 60);

      // Track user activity for anomaly detection
      if (event.userId) {
        await this.trackUserActivity(event.userId, event);
      }

      // Check for critical events that need immediate alerting
      if (event.severity === SecuritySeverity.CRITICAL) {
        await this.sendAlert(event);
      }

      // Run anomaly detection
      await this.detectAnomalies(event);

      console.log(`🔒 Security Event: ${event.type} - ${event.severity}`, {
        userId: event.userId,
        ip: event.ip,
        details: event.details
      });

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Track user activity for pattern analysis
   */
  private static async trackUserActivity(userId: string, event: SecurityEvent): Promise<void> {
    const activityKey = `${this.USER_ACTIVITY_PREFIX}${userId}`;
    const activity = {
      type: event.type,
      ip: event.ip,
      userAgent: event.userAgent,
      timestamp: event.timestamp
    };

    // Store last 50 activities per user
    await redisClient.lpush(activityKey, JSON.stringify(activity));
    await redisClient.ltrim(activityKey, 0, 49);
    await redisClient.expire(activityKey, 7 * 24 * 60 * 60); // 7 days
  }

  /**
   * Detect anomalous behavior patterns
   */
  static async detectAnomalies(event: SecurityEvent): Promise<void> {
    try {
      // Check for multiple failed login attempts
      if (event.type === SecurityEventType.LOGIN_FAILURE) {
        await this.checkMultipleFailedLogins(event.ip, event.userId);
      }

      // Check for unusual location access
      if (event.userId && event.type === SecurityEventType.LOGIN_SUCCESS) {
        await this.checkUnusualLocation(event.userId, event.ip);
      }

      // Check for rapid API requests (potential abuse)
      await this.checkAPIAbuse(event.ip);

      // Check for suspicious session activities
      if (event.sessionId) {
        await this.checkSuspiciousSession(event.sessionId, event);
      }

    } catch (error) {
      console.error('Anomaly detection failed:', error);
    }
  }

  /**
   * Check for multiple failed login attempts
   */
  private static async checkMultipleFailedLogins(ip: string, userId?: string): Promise<void> {
    const key = `failed_logins:${ip}`;
    const count = await redisClient.incr(key);
    await redisClient.expire(key, 15 * 60); // 15 minutes window

    if (count >= 5) {
      await this.logSecurityEvent({
        type: SecurityEventType.MULTIPLE_LOGIN_ATTEMPTS,
        severity: SecuritySeverity.HIGH,
        userId,
        ip,
        userAgent: '',
        details: { failedAttempts: count },
        timestamp: new Date()
      });

      // Mark IP as suspicious
      await this.flagSuspiciousIP(ip, 'Multiple failed login attempts');
    }
  }

  /**
   * Check for unusual location access
   */
  private static async checkUnusualLocation(userId: string, currentIP: string): Promise<void> {
    const userIPKey = `user_ips:${userId}`;
    const knownIPs = await redisClient.smembers(userIPKey);

    if (!knownIPs.includes(currentIP)) {
      // New IP for this user
      await redisClient.sadd(userIPKey, currentIP);
      await redisClient.expire(userIPKey, 90 * 24 * 60 * 60); // 90 days

      if (knownIPs.length > 0) {
        // User has known IPs, this is unusual
        await this.logSecurityEvent({
          type: SecurityEventType.UNUSUAL_LOCATION,
          severity: SecuritySeverity.MEDIUM,
          userId,
          ip: currentIP,
          userAgent: '',
          details: { previousIPs: knownIPs.slice(-3) },
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Check for API abuse patterns
   */
  private static async checkAPIAbuse(ip: string): Promise<void> {
    const requestKey = `api_requests:${ip}:${Math.floor(Date.now() / 60000)}`; // per minute
    const count = await redisClient.incr(requestKey);
    await redisClient.expire(requestKey, 60);

    if (count > 100) { // More than 100 requests per minute
      await this.logSecurityEvent({
        type: SecurityEventType.API_ABUSE,
        severity: SecuritySeverity.HIGH,
        ip,
        userAgent: '',
        details: { requestsPerMinute: count },
        timestamp: new Date()
      });

      await this.flagSuspiciousIP(ip, 'High API request rate');
    }
  }

  /**
   * Check for suspicious session activities
   */
  private static async checkSuspiciousSession(sessionId: string, event: SecurityEvent): Promise<void> {
    // Get session data to check for anomalies
    const sessionData = await SessionManager.validateSession(sessionId, event.details?.fingerprint || '');

    if (sessionData) {
      // Check if session is being used from multiple IPs rapidly
      const sessionIPKey = `session_ips:${sessionId}`;
      await redisClient.sadd(sessionIPKey, event.ip);
      await redisClient.expire(sessionIPKey, 60 * 60); // 1 hour

      const uniqueIPs = await redisClient.smembers(sessionIPKey);
      if (uniqueIPs.length > 3) {
        await this.logSecurityEvent({
          type: SecurityEventType.SESSION_HIJACK_ATTEMPT,
          severity: SecuritySeverity.CRITICAL,
          userId: sessionData.userId,
          sessionId,
          ip: event.ip,
          userAgent: event.userAgent,
          details: { uniqueIPs, suspiciousActivity: 'Multiple IPs for single session' },
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Flag an IP as suspicious
   */
  private static async flagSuspiciousIP(ip: string, reason: string): Promise<void> {
    const suspiciousKey = `${this.SUSPICIOUS_IP_PREFIX}${ip}`;
    const data = {
      ip,
      reason,
      flaggedAt: new Date(),
      flagCount: await redisClient.incr(`${suspiciousKey}:count`)
    };

    await redisClient.setex(suspiciousKey, 24 * 60 * 60, JSON.stringify(data)); // 24 hours
  }

  /**
   * Check if IP is flagged as suspicious
   */
  static async isSuspiciousIP(ip: string): Promise<boolean> {
    const suspiciousKey = `${this.SUSPICIOUS_IP_PREFIX}${ip}`;
    return await redisClient.exists(suspiciousKey) === 1;
  }

  /**
   * Send security alert for critical events
   */
  private static async sendAlert(event: SecurityEvent): Promise<void> {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}`,
      title: `Critical Security Event: ${event.type}`,
      description: this.generateAlertDescription(event),
      severity: event.severity,
      events: [event],
      timestamp: new Date(),
      acknowledged: false
    };

    const alertKey = `${this.SECURITY_ALERT_PREFIX}${alert.id}`;
    await redisClient.setex(alertKey, 7 * 24 * 60 * 60, JSON.stringify(alert)); // 7 days

    // In a production environment, you would send this to:
    // - Security team email/Slack
    // - SIEM system
    // - Incident management system
    console.error(`🚨 CRITICAL SECURITY ALERT: ${alert.title}`, alert);
  }

  /**
   * Generate human-readable alert description
   */
  private static generateAlertDescription(event: SecurityEvent): string {
    switch (event.type) {
      case SecurityEventType.SESSION_HIJACK_ATTEMPT:
        return `Potential session hijacking detected for user ${event.userId} from IP ${event.ip}`;
      case SecurityEventType.MULTIPLE_LOGIN_ATTEMPTS:
        return `Multiple failed login attempts detected from IP ${event.ip}`;
      case SecurityEventType.API_ABUSE:
        return `Suspicious API usage pattern detected from IP ${event.ip}`;
      case SecurityEventType.SQL_INJECTION_ATTEMPT:
        return `SQL injection attempt detected from IP ${event.ip}`;
      default:
        return `Security event ${event.type} detected from IP ${event.ip}`;
    }
  }

  /**
   * Get security dashboard statistics
   */
  static async getSecurityStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    const now = new Date();
    const timeframeDates = this.getTimeframeDates(now, timeframe);

    const stats = {
      totalEvents: 0,
      eventsByType: {} as Record<string, number>,
      eventsBySeverity: {} as Record<string, number>,
      suspiciousIPs: 0,
      activeAlerts: 0,
      recentEvents: [] as SecurityEvent[]
    };

    try {
      // Get events for timeframe
      for (const date of timeframeDates) {
        const dateKey = `security_events:${date}`;
        const eventIds = await redisClient.smembers(dateKey);

        for (const eventId of eventIds) {
          const eventData = await redisClient.get(`${this.SECURITY_LOG_PREFIX}${eventId}`);
          if (eventData) {
            const event: SecurityEvent = JSON.parse(eventData);
            stats.totalEvents++;
            stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
            stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;

            if (stats.recentEvents.length < 20) {
              stats.recentEvents.push(event);
            }
          }
        }
      }

      // Count suspicious IPs
      const suspiciousIPKeys = await redisClient.keys(`${this.SUSPICIOUS_IP_PREFIX}*`);
      stats.suspiciousIPs = suspiciousIPKeys.length;

      // Count active alerts
      const alertKeys = await redisClient.keys(`${this.SECURITY_ALERT_PREFIX}*`);
      stats.activeAlerts = alertKeys.length;

      // Sort recent events by timestamp
      stats.recentEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
      console.error('Failed to get security stats:', error);
    }

    return stats;
  }

  /**
   * Helper to get date strings for timeframe
   */
  private static getTimeframeDates(now: Date, timeframe: 'hour' | 'day' | 'week'): string[] {
    const dates: string[] = [];
    const today = now.toISOString().split('T')[0];

    switch (timeframe) {
      case 'hour':
        dates.push(today);
        break;
      case 'day':
        dates.push(today);
        break;
      case 'week':
        for (let i = 0; i < 7; i++) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
    }

    return dates;
  }

  /**
   * Middleware to automatically log security events from requests
   */
  static createSecurityEventFromRequest(
    req: Request,
    eventType: SecurityEventType,
    severity: SecuritySeverity = SecuritySeverity.LOW,
    additionalDetails: any = {}
  ): SecurityEvent {
    return {
      type: eventType,
      severity,
      userId: (req as any).user?.id,
      sessionId: req.signedCookies?.session_id,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      details: {
        url: req.url,
        method: req.method,
        ...additionalDetails
      },
      timestamp: new Date()
    };
  }
}