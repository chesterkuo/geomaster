import { Response } from 'express';
import crypto from 'crypto';
import { redis as redisClient } from '../config/redis';

export interface SessionData {
  userId: string;
  sessionId: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  fingerprint: string;
}

export interface SessionConfig {
  maxSessions: number;
  sessionTimeout: number; // in minutes
  inactivityTimeout: number; // in minutes
  enforceMaxSessions: boolean;
}

export class SessionManager {
  private static readonly SESSION_PREFIX = 'session:';
  private static readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private static readonly config: SessionConfig = {
    maxSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '3'),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '480'), // 8 hours
    inactivityTimeout: parseInt(process.env.INACTIVITY_TIMEOUT_MINUTES || '30'),
    enforceMaxSessions: true
  };

  /**
   * Create a new session for a user
   */
  static async createSession(
    userId: string,
    deviceInfo: string,
    ipAddress: string,
    fingerprint: string
  ): Promise<string> {
    const sessionId = crypto.randomUUID();

    // Check for existing sessions and enforce limits
    if (this.config.enforceMaxSessions) {
      await this.enforceSessionLimits(userId);
    }

    const sessionData: SessionData = {
      userId,
      sessionId,
      deviceInfo,
      ipAddress,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      fingerprint
    };

    // Store session data
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;

    await Promise.all([
      redisClient.setex(
        sessionKey,
        this.config.sessionTimeout * 60,
        JSON.stringify(sessionData)
      ),
      redisClient.sadd(userSessionsKey, sessionId),
      redisClient.expire(userSessionsKey, this.config.sessionTimeout * 60)
    ]);

    return sessionId;
  }

  /**
   * Validate and refresh a session
   */
  static async validateSession(sessionId: string, fingerprint: string): Promise<SessionData | null> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const sessionDataRaw = await redisClient.get(sessionKey);

    if (!sessionDataRaw) {
      return null;
    }

    const sessionData: SessionData = JSON.parse(sessionDataRaw);

    // Validate fingerprint
    if (sessionData.fingerprint !== fingerprint) {
      await this.invalidateSession(sessionId);
      throw new Error('Session fingerprint mismatch - possible session hijacking');
    }

    // Check for inactivity timeout
    const lastActivity = new Date(sessionData.lastActivity);
    const inactivityLimit = new Date(Date.now() - (this.config.inactivityTimeout * 60 * 1000));

    if (lastActivity < inactivityLimit) {
      await this.invalidateSession(sessionId);
      return null;
    }

    // Update last activity
    sessionData.lastActivity = new Date();
    await redisClient.setex(
      sessionKey,
      this.config.sessionTimeout * 60,
      JSON.stringify(sessionData)
    );

    return sessionData;
  }

  /**
   * Invalidate a specific session
   */
  static async invalidateSession(sessionId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const sessionDataRaw = await redisClient.get(sessionKey);

    if (sessionDataRaw) {
      const sessionData: SessionData = JSON.parse(sessionDataRaw);
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${sessionData.userId}`;

      await Promise.all([
        redisClient.del(sessionKey),
        redisClient.srem(userSessionsKey, sessionId)
      ]);
    }
  }

  /**
   * Invalidate all sessions for a user (useful for password changes)
   */
  static async invalidateAllUserSessions(userId: string): Promise<void> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await redisClient.smembers(userSessionsKey);

    if (sessionIds.length > 0) {
      const sessionKeys = sessionIds.map(id => `${this.SESSION_PREFIX}${id}`);
      await Promise.all([
        redisClient.del(...sessionKeys),
        redisClient.del(userSessionsKey)
      ]);
    }
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<SessionData[]> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await redisClient.smembers(userSessionsKey);

    if (sessionIds.length === 0) {
      return [];
    }

    const sessionKeys = sessionIds.map((id: string) => `${this.SESSION_PREFIX}${id}`);
    const sessionsData = await redisClient.mget(...sessionKeys);

    return sessionsData
      .filter((data: string | null) => data !== null)
      .map((data: string | null) => JSON.parse(data as string));
  }

  /**
   * Enforce session limits by removing oldest sessions
   */
  private static async enforceSessionLimits(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);

    if (sessions.length >= this.config.maxSessions) {
      // Sort by creation date and remove oldest sessions
      const sortedSessions = sessions.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const sessionsToRemove = sortedSessions.slice(0, sessions.length - this.config.maxSessions + 1);

      for (const session of sessionsToRemove) {
        await this.invalidateSession(session.sessionId);
      }
    }
  }

  /**
   * Clean up expired sessions (run periodically)
   */
  static async cleanupExpiredSessions(): Promise<void> {
    // This would typically be run as a background job
    // For now, Redis TTL handles most cleanup automatically
    console.log('Session cleanup completed');
  }

  /**
   * Set secure session cookie
   */
  static setSessionCookie(res: Response, sessionId: string): void {
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Allow cross-origin in development
      maxAge: this.config.sessionTimeout * 60 * 1000,
      signed: true
    });
  }

  /**
   * Clear session cookie
   */
  static clearSessionCookie(res: Response): void {
    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      signed: true
    });
  }

  /**
   * Get session statistics for monitoring
   */
  static async getSessionStats(): Promise<{
    totalActiveSessions: number;
    uniqueUsers: number;
    averageSessionsPerUser: number;
  }> {
    const keys = await redisClient.keys(`${this.SESSION_PREFIX}*`);
    const userKeys = await redisClient.keys(`${this.USER_SESSIONS_PREFIX}*`);

    return {
      totalActiveSessions: keys.length,
      uniqueUsers: userKeys.length,
      averageSessionsPerUser: userKeys.length > 0 ? keys.length / userKeys.length : 0
    };
  }
}