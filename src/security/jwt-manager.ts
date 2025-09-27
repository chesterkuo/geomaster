import { generateKeyPairSync, randomBytes, createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

interface TokenPayload {
  jti: string;           // JWT ID for tracking
  sub: string;           // User ID
  iat: number;           // Issued at
  exp: number;           // Expiry
  nbf: number;           // Not before
  iss: string;           // Issuer
  aud: string[];         // Audiences
  scope: string[];       // Permissions
  fingerprint: string;   // Browser fingerprint hash
  sessionId: string;     // Session identifier
  organizationId?: string; // Organization context
}

interface RefreshTokenData {
  userId: string;
  sessionId: string;
  fingerprint: string;
  createdAt: string;
  scope: string[];
  organizationId?: string;
}

/**
 * Enhanced JWT Manager with RS256 and security features
 * - Asymmetric encryption (RS256)
 * - Token fingerprinting
 * - JTI tracking
 * - Token blacklisting
 * - Refresh token rotation
 */
export class EnhancedJWTManager {
  private redis: Redis;
  private readonly ACCESS_TOKEN_TTL = 300;    // 5 minutes
  private readonly REFRESH_TOKEN_TTL = 86400; // 24 hours
  private readonly keyPair: { public: string; private: string };

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    // Generate RSA key pair for development
    // In production, these should be loaded from secure storage
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    this.keyPair = { public: publicKey, private: privateKey };

    logger.info('JWT Manager initialized with RS256 keys');
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(
    userId: string,
    fingerprint: string,
    scope: string[] = ['user'],
    organizationId?: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      const jti = randomBytes(32).toString('hex');
      const sessionId = randomBytes(16).toString('hex');
      const now = Math.floor(Date.now() / 1000);

      const payload: TokenPayload = {
        jti,
        sub: userId,
        iat: now,
        exp: now + this.ACCESS_TOKEN_TTL,
        nbf: now,
        iss: 'geo-platform',
        aud: ['api.geo-platform.com', 'app.geo-platform.com'],
        scope,
        fingerprint: this.hashFingerprint(fingerprint),
        sessionId,
        organizationId
      };

      // Generate access token with RS256
      const accessToken = jwt.sign(payload, this.keyPair.private, {
        algorithm: 'RS256',
        keyid: await this.getCurrentKeyId()
      });

      // Generate refresh token
      const refreshToken = randomBytes(64).toString('hex');

      // Store refresh token in Redis with metadata
      const refreshData: RefreshTokenData = {
        userId,
        sessionId,
        fingerprint: this.hashFingerprint(fingerprint),
        createdAt: new Date().toISOString(),
        scope,
        organizationId
      };

      await this.redis.setex(
        `refresh:${refreshToken}`,
        this.REFRESH_TOKEN_TTL,
        JSON.stringify(refreshData)
      );

      // Track active tokens for user
      await this.redis.sadd(`user:${userId}:tokens`, jti);
      await this.redis.expire(`user:${userId}:tokens`, this.REFRESH_TOKEN_TTL);

      // Store session info
      await this.redis.setex(
        `session:${sessionId}`,
        this.REFRESH_TOKEN_TTL,
        JSON.stringify({ userId, fingerprint: this.hashFingerprint(fingerprint) })
      );

      logger.info('Token pair generated', {
        userId,
        sessionId,
        scope,
        organizationId,
        expiresIn: this.ACCESS_TOKEN_TTL
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: this.ACCESS_TOKEN_TTL
      };
    } catch (error: any) {
      logger.error('Failed to generate token pair:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Verify and decode access token
   */
  async verifyToken(token: string, fingerprint: string): Promise<TokenPayload> {
    try {
      // Verify signature and decode
      const decoded = jwt.verify(token, this.keyPair.public, {
        algorithms: ['RS256'],
        issuer: 'geo-platform',
        audience: ['api.geo-platform.com', 'app.geo-platform.com'],
        complete: false
      }) as TokenPayload;

      // Verify fingerprint
      if (decoded.fingerprint !== this.hashFingerprint(fingerprint)) {
        throw new Error('Invalid token fingerprint');
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.redis.get(`blacklist:${decoded.jti}`);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      // Check if session is valid
      const sessionData = await this.redis.get(`session:${decoded.sessionId}`);
      if (!sessionData) {
        throw new Error('Session expired or invalid');
      }

      const session = JSON.parse(sessionData);
      if (session.fingerprint !== this.hashFingerprint(fingerprint)) {
        throw new Error('Session fingerprint mismatch');
      }

      // Update token last used time
      await this.redis.setex(
        `token:${decoded.jti}:lastused`,
        this.ACCESS_TOKEN_TTL,
        Date.now().toString()
      );

      return decoded;
    } catch (error: any) {
      logger.warn('Token verification failed:', {
        error: error.message,
        fingerprint: this.hashFingerprint(fingerprint)
      });
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(
    refreshToken: string,
    fingerprint: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      // Get refresh token data
      const refreshData = await this.redis.get(`refresh:${refreshToken}`);
      if (!refreshData) {
        throw new Error('Invalid or expired refresh token');
      }

      const data: RefreshTokenData = JSON.parse(refreshData);

      // Verify fingerprint
      if (data.fingerprint !== this.hashFingerprint(fingerprint)) {
        throw new Error('Refresh token fingerprint mismatch');
      }

      // Delete old refresh token (rotation)
      await this.redis.del(`refresh:${refreshToken}`);

      // Generate new token pair
      const newTokens = await this.generateTokenPair(
        data.userId,
        fingerprint,
        data.scope,
        data.organizationId
      );

      logger.info('Token refreshed successfully', {
        userId: data.userId,
        oldSessionId: data.sessionId
      });

      return newTokens;
    } catch (error: any) {
      logger.error('Token refresh failed:', error);
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Revoke a specific token
   */
  async revokeToken(jti: string): Promise<void> {
    try {
      await this.redis.setex(`blacklist:${jti}`, this.ACCESS_TOKEN_TTL, '1');
      logger.info('Token revoked', { jti });
    } catch (error: any) {
      logger.error('Failed to revoke token:', error);
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Get all user tokens
      const tokens = await this.redis.smembers(`user:${userId}:tokens`);

      // Blacklist all tokens
      const pipeline = this.redis.pipeline();
      for (const jti of tokens) {
        pipeline.setex(`blacklist:${jti}`, this.ACCESS_TOKEN_TTL, '1');
      }
      await pipeline.exec();

      // Clear user tokens set
      await this.redis.del(`user:${userId}:tokens`);

      // Remove all refresh tokens for this user
      const refreshKeys = await this.redis.keys(`refresh:*`);
      for (const key of refreshKeys) {
        const data = await this.redis.get(key);
        if (data) {
          const refreshData: RefreshTokenData = JSON.parse(data);
          if (refreshData.userId === userId) {
            await this.redis.del(key);
          }
        }
      }

      logger.info('All user tokens revoked', { userId, tokenCount: tokens.length });
    } catch (error: any) {
      logger.error('Failed to revoke all user tokens:', error);
    }
  }

  /**
   * Revoke session and associated tokens
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      // Delete session
      await this.redis.del(`session:${sessionId}`);

      // Find and blacklist tokens with this session ID
      // Note: In production, you'd want to store session->token mapping
      logger.info('Session revoked', { sessionId });
    } catch (error: any) {
      logger.error('Failed to revoke session:', error);
    }
  }

  /**
   * Get token statistics for monitoring
   */
  async getTokenStats(userId?: string): Promise<any> {
    try {
      const stats: any = {
        activeTokens: 0,
        blacklistedTokens: 0,
        activeSessions: 0
      };

      if (userId) {
        const userTokens = await this.redis.smembers(`user:${userId}:tokens`);
        stats.userActiveTokens = userTokens.length;
      }

      // Get blacklisted tokens count
      const blacklistKeys = await this.redis.keys('blacklist:*');
      stats.blacklistedTokens = blacklistKeys.length;

      // Get active sessions count
      const sessionKeys = await this.redis.keys('session:*');
      stats.activeSessions = sessionKeys.length;

      return stats;
    } catch (error: any) {
      logger.error('Failed to get token stats:', error);
      return {};
    }
  }

  /**
   * Clean up expired tokens and sessions
   */
  async cleanup(): Promise<void> {
    try {
      // Redis TTL will handle most cleanup, but we can do additional cleanup here
      const expiredTokens = await this.redis.keys('token:*:lastused');
      const now = Date.now();

      for (const key of expiredTokens) {
        const lastUsed = await this.redis.get(key);
        if (lastUsed && (now - parseInt(lastUsed)) > this.ACCESS_TOKEN_TTL * 1000) {
          await this.redis.del(key);
        }
      }

      logger.info('Token cleanup completed');
    } catch (error: any) {
      logger.error('Token cleanup failed:', error);
    }
  }

  /**
   * Hash fingerprint for storage
   */
  private hashFingerprint(fingerprint: string): string {
    return createHash('sha256').update(fingerprint + process.env.JWT_SECRET).digest('hex');
  }

  /**
   * Get current key ID for rotation
   */
  private async getCurrentKeyId(): Promise<string> {
    // In production, implement key rotation logic
    return `geo-platform-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Generate device fingerprint from request
   */
  static generateFingerprint(req: any): string {
    const components = [
      req.get('user-agent') || '',
      req.get('accept-language') || '',
      req.get('accept-encoding') || '',
      req.ip || req.connection.remoteAddress || '',
      req.get('x-forwarded-for') || ''
    ];

    return createHash('md5').update(components.join('|')).digest('hex');
  }

  /**
   * Validate token scope
   */
  static hasScope(token: TokenPayload, requiredScope: string): boolean {
    return token.scope.includes(requiredScope) || token.scope.includes('admin');
  }

  /**
   * Check if token is about to expire
   */
  static isTokenExpiringSoon(token: TokenPayload, thresholdSeconds: number = 60): boolean {
    const now = Math.floor(Date.now() / 1000);
    return (token.exp - now) <= thresholdSeconds;
  }
}