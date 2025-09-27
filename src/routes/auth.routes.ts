import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest, authSchemas } from '../middlewares/validation.middleware';
import { authenticateToken } from '../middlewares/auth.middleware';
import { authRateLimit, apiRateLimit } from '../middleware/security-middleware';

const router = Router();
const authController = new AuthController();

// Public routes with rate limiting
router.post('/register',
  authRateLimit,
  validateRequest({ body: authSchemas.register }),
  authController.register
);

router.post('/login',
  authRateLimit,
  validateRequest({ body: authSchemas.login }),
  authController.login
);

router.post('/refresh',
  authRateLimit,
  validateRequest({ body: authSchemas.refreshToken }),
  authController.refreshToken
);

router.post('/forgot-password',
  authRateLimit,
  validateRequest({ body: authSchemas.forgotPassword }),
  authController.forgotPassword
);

router.post('/reset-password',
  authRateLimit,
  validateRequest({ body: authSchemas.resetPassword }),
  authController.resetPassword
);

// Protected routes with JWT authentication
router.post('/logout',
  apiRateLimit,
  authenticateToken,
  authController.logout
);

router.get('/profile',
  apiRateLimit,
  authenticateToken,
  authController.getProfile
);

router.put('/profile',
  apiRateLimit,
  authenticateToken,
  authController.updateProfile
);

// Note: Session management routes removed - using JWT-only authentication

// Password change route
router.put('/change-password',
  apiRateLimit,
  authenticateToken,
  validateRequest({ body: authSchemas.changePassword }),
  authController.changePassword
);

export default router;