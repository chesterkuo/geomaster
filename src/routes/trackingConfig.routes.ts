import { Router } from 'express';
import { TrackingConfigController } from '../controllers/trackingConfig.controller';
import { validateRequest, commonSchemas } from '../middlewares/validation.middleware';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import Joi from 'joi';

const router = Router();
const trackingConfigController = new TrackingConfigController();

// Apply authentication and organization middleware
router.use(authenticateToken);
router.use(requireOrganization);

// Tracking configuration routes

// GET /api/v1/tracking/settings - Get tracking configuration
router.get('/settings',
  trackingConfigController.getTrackingSettings.bind(trackingConfigController)
);

// PUT /api/v1/tracking/settings - Update tracking settings
router.put('/settings',
  validateRequest({
    body: Joi.object({
      trackingEnabled: Joi.boolean().optional(),
      trackingFrequency: Joi.string().valid('hourly', 'daily', 'weekly').optional(),
      platforms: Joi.array().items(
        Joi.string().valid('chatgpt', 'gemini', 'perplexity', 'claude')
      ).optional(),
      alertsEnabled: Joi.boolean().optional(),
      alertThreshold: Joi.number().integer().min(1).optional(),
      alertEmails: Joi.array().items(Joi.string().email()).optional(),
      settings: Joi.object().optional()
    })
  }),
  trackingConfigController.updateTrackingSettings.bind(trackingConfigController)
);

// POST /api/v1/tracking/platforms - Configure platform monitoring
router.post('/platforms',
  validateRequest({
    body: Joi.object({
      platform: Joi.string().valid('chatgpt', 'gemini', 'perplexity', 'claude').required(),
      enabled: Joi.boolean().optional(),
      settings: Joi.object().optional(),
      apiKey: Joi.string().optional()
    })
  }),
  trackingConfigController.configurePlatform.bind(trackingConfigController)
);

// GET /api/v1/tracking/platforms - List monitored platforms
router.get('/platforms',
  trackingConfigController.getPlatforms.bind(trackingConfigController)
);

// GET /api/v1/tracking/platforms/available - Get available platforms
router.get('/platforms/available',
  trackingConfigController.getAvailablePlatforms.bind(trackingConfigController)
);

export default router;