import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest, authSchemas } from '../middlewares/validation.middleware';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', 
  validateRequest({ body: authSchemas.register }), 
  authController.register
);

router.post('/login', 
  validateRequest({ body: authSchemas.login }), 
  authController.login
);

router.post('/refresh', 
  validateRequest({ body: authSchemas.refreshToken }), 
  authController.refreshToken
);

router.post('/forgot-password', 
  validateRequest({ body: authSchemas.forgotPassword }), 
  authController.forgotPassword
);

router.post('/reset-password', 
  validateRequest({ body: authSchemas.resetPassword }), 
  authController.resetPassword
);

// Protected routes
router.post('/logout', authenticateToken, authController.logout);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

export default router;