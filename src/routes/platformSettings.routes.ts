import { Router } from 'express';
import { PlatformSettingsController } from '../controllers/platformSettings.controller';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import Joi from 'joi';

const router = Router();
const platformSettingsController = new PlatformSettingsController();

// All routes require authentication and organization
router.use(authenticateToken);
router.use(requireOrganization);

// Validation schemas
const platformSettingsSchemas = {
  platformParam: {
    params: Joi.object({
      platform: Joi.string().valid('chatgpt', 'openai', 'gemini', 'google', 'claude', 'anthropic', 'perplexity').required()
    })
  },
  
  validateApiKey: {
    params: Joi.object({
      platform: Joi.string().valid('chatgpt', 'openai', 'gemini', 'google', 'claude', 'anthropic', 'perplexity').required()
    }),
    body: Joi.object({
      apiKey: Joi.string().min(10).max(500).required()
    })
  },
  
  updateApiKey: {
    params: Joi.object({
      platform: Joi.string().valid('chatgpt', 'openai', 'gemini', 'google', 'claude', 'anthropic', 'perplexity').required()
    }),
    body: Joi.object({
      apiKey: Joi.string().min(10).max(500).required(),
      enabled: Joi.boolean().optional()
    })
  },
  
  togglePlatform: {
    params: Joi.object({
      platform: Joi.string().valid('chatgpt', 'openai', 'gemini', 'google', 'claude', 'anthropic', 'perplexity').required()
    }),
    body: Joi.object({
      enabled: Joi.boolean().required()
    })
  }
};

// Routes
// GET /api/v1/platforms - Get all platform settings
router.get(
  '/',
  platformSettingsController.getPlatformSettings
);

// GET /api/v1/platforms/:platform/requirements - Get API key requirements
router.get(
  '/:platform/requirements',
  validateRequest(platformSettingsSchemas.platformParam),
  platformSettingsController.getApiKeyRequirements
);

// POST /api/v1/platforms/:platform/validate - Validate API key
router.post(
  '/:platform/validate',
  validateRequest(platformSettingsSchemas.validateApiKey),
  platformSettingsController.validateApiKey
);

// PUT /api/v1/platforms/:platform/api-key - Update API key
router.put(
  '/:platform/api-key',
  validateRequest(platformSettingsSchemas.updateApiKey),
  platformSettingsController.updateApiKey
);

// DELETE /api/v1/platforms/:platform/api-key - Remove API key
router.delete(
  '/:platform/api-key',
  validateRequest(platformSettingsSchemas.platformParam),
  platformSettingsController.removeApiKey
);

// PUT /api/v1/platforms/:platform/toggle - Toggle platform enabled/disabled
router.put(
  '/:platform/toggle',
  validateRequest(platformSettingsSchemas.togglePlatform),
  platformSettingsController.togglePlatform
);

export default router;