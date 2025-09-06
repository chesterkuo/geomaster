import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import { validateRequest, commonSchemas } from '../middlewares/validation.middleware';
import Joi from 'joi';

const router = Router();
const settingsController = new SettingsController();

// Apply authentication and organization validation to all settings routes
router.use(authenticateToken);
router.use(requireOrganization);

// Settings validation schemas
const settingsSchemas = {
  organization: {
    body: Joi.object({
      name: Joi.string().min(1).max(100).optional(),
      website: Joi.string().uri().optional(),
      timezone: Joi.string().optional(),
      language: Joi.string().valid('zh-TW', 'zh-CN', 'en').optional(),
      currency: Joi.string().length(3).optional(),
      dateFormat: Joi.string().valid('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD').optional(),
      autoDataSync: Joi.boolean().optional(),
      dataRetentionMonths: Joi.number().integer().min(1).max(60).optional(),
      defaultReportFormat: Joi.string().valid('pdf', 'excel', 'csv').optional()
    })
  },

  passwordChange: {
    body: Joi.object({
      currentPassword: Joi.string().min(1).required(),
      newPassword: Joi.string().min(8).required()
    })
  },

  preferences: {
    body: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'system').optional(),
      compactMode: Joi.boolean().optional(),
      animations: Joi.boolean().optional(),
      language: Joi.string().valid('zh-TW', 'zh-CN', 'en').optional(),
      defaultView: Joi.string().optional(),
      itemsPerPage: Joi.number().integer().min(5).max(100).optional(),
      chartColors: Joi.array().items(Joi.string()).optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        browser: Joi.boolean().optional(),
        mobile: Joi.boolean().optional()
      }).optional(),
      dashboardLayout: Joi.string().valid('default', 'compact', 'expanded').optional()
    })
  },

  twoFactorToken: {
    body: Joi.object({
      token: Joi.string().length(6).pattern(/^\d{6}$/).required()
    })
  },

  disable2FA: {
    body: Joi.object({
      token: Joi.string().length(6).pattern(/^\d{6}$/).required(),
      password: Joi.string().min(1).required()
    })
  }
};

// Organization settings routes
router.get('/organization', settingsController.getOrganizationSettings);
router.put('/organization', 
  validateRequest(settingsSchemas.organization), 
  settingsController.updateOrganizationSettings
);

// Security settings routes
router.get('/security', settingsController.getSecuritySettings);
router.put('/password', 
  validateRequest(settingsSchemas.passwordChange), 
  settingsController.changePassword
);
router.get('/security/sessions', settingsController.getActiveSessions);

// Two-Factor Authentication routes
router.post('/2fa/enable', settingsController.enable2FA);
router.post('/2fa/verify', 
  validateRequest(settingsSchemas.twoFactorToken), 
  settingsController.verify2FA
);
router.delete('/2fa', 
  validateRequest(settingsSchemas.disable2FA), 
  settingsController.disable2FA
);

// User preferences routes
router.get('/preferences', settingsController.getUserPreferences);
router.put('/preferences', 
  validateRequest(settingsSchemas.preferences), 
  settingsController.updateUserPreferences
);

export default router;