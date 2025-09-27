import { Request, Response, NextFunction } from 'express';
import { SessionManager, SessionData } from '../services/session-manager';
import { AuthRequest } from '../middlewares/auth.middleware';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      session?: SessionData;
      deviceFingerprint?: string;
    }
  }
}

/**
 * Generate device fingerprint from request headers
 */
function generateDeviceFingerprint(req: Request): string {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.ip || req.connection.remoteAddress || '',
    req.headers['x-forwarded-for'] || ''
  ];

  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
}

/**
 * Extract device information from request
 */
function getDeviceInfo(req: Request): string {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const parts = userAgent.match(/\(([^)]+)\)/);
  const platform = parts ? parts[1] : 'Unknown Platform';

  return `${platform} - ${userAgent.substring(0, 100)}`;
}

/**
 * Middleware to add device fingerprint to requests
 */
export function deviceFingerprintMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  req.deviceFingerprint = generateDeviceFingerprint(req);
  next();
}

/**
 * Middleware to validate session for protected routes
 */
export async function sessionValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract session ID from cookie or header
    const sessionId = req.signedCookies?.session_id || req.headers['x-session-id'] as string;

    if (!sessionId) {
      res.status(401).json({
        success: false,
        message: 'No session found',
        code: 'NO_SESSION'
      });
      return;
    }

    // Validate session
    const fingerprint = req.deviceFingerprint || generateDeviceFingerprint(req);
    const sessionData = await SessionManager.validateSession(sessionId, fingerprint);

    if (!sessionData) {
      SessionManager.clearSessionCookie(res);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
        code: 'INVALID_SESSION'
      });
      return;
    }

    // Attach session data to request
    req.session = sessionData;
    next();

  } catch (error: any) {
    console.error('Session validation error:', error.message);

    // Handle session hijacking attempts
    if (error.message.includes('fingerprint mismatch')) {
      res.status(401).json({
        success: false,
        message: 'Session security violation detected',
        code: 'SESSION_HIJACK_DETECTED'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Session validation failed',
      code: 'SESSION_ERROR'
    });
  }
}

/**
 * Middleware to create session after successful authentication
 */
export async function createSessionMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    console.log('🔍 createSessionMiddleware called, req.user:', req.user ? `${req.user.id}` : 'undefined');

    if (!req.user?.id) {
      console.log('❌ No user ID found, skipping session creation');
      next();
      return;
    }

    const fingerprint = req.deviceFingerprint || generateDeviceFingerprint(req);
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    console.log('📋 Session creation details:', { userId: req.user.id, deviceInfo, ipAddress, fingerprint: fingerprint.substring(0, 8) + '...' });

    // Create new session
    const sessionId = await SessionManager.createSession(
      req.user.id,
      deviceInfo,
      ipAddress,
      fingerprint
    );

    console.log('✅ Session created successfully:', sessionId);

    // Set secure session cookie
    SessionManager.setSessionCookie(res, sessionId);
    console.log('🍪 Session cookie set');

    // Add session info to response
    res.locals.sessionId = sessionId;
    next();

  } catch (error: any) {
    console.error('❌ Session creation error:', error.message);
    next(error);
  }
}

/**
 * Middleware to handle session logout
 */
export async function logoutSessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = req.signedCookies?.session_id || req.headers['x-session-id'] as string;

    if (sessionId) {
      await SessionManager.invalidateSession(sessionId);
      SessionManager.clearSessionCookie(res);
    }

    next();

  } catch (error: any) {
    console.error('Session logout error:', error.message);
    next();
  }
}

/**
 * Middleware to invalidate all user sessions (for password changes)
 */
export async function invalidateAllUserSessionsMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id || req.body.userId;

    if (userId) {
      await SessionManager.invalidateAllUserSessions(userId);
    }

    next();

  } catch (error: any) {
    console.error('User session invalidation error:', error.message);
    next();
  }
}

/**
 * Session timeout warning middleware (optional)
 */
export async function sessionTimeoutWarningMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.session) {
      const lastActivity = new Date(req.session.lastActivity);
      const warningThreshold = 5 * 60 * 1000; // 5 minutes before timeout
      const timeoutLimit = parseInt(process.env.INACTIVITY_TIMEOUT_MINUTES || '30') * 60 * 1000;
      const timeUntilTimeout = timeoutLimit - (Date.now() - lastActivity.getTime());

      if (timeUntilTimeout <= warningThreshold && timeUntilTimeout > 0) {
        res.setHeader('X-Session-Warning', 'true');
        res.setHeader('X-Session-Timeout-In', Math.floor(timeUntilTimeout / 1000).toString());
      }
    }

    next();

  } catch (error: any) {
    console.error('Session timeout warning error:', error.message);
    next();
  }
}