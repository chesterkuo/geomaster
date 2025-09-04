import { Router } from 'express';
import { TrackingController } from '../controllers/tracking.controller';
import { validateRequest, commonSchemas } from '../middlewares/validation.middleware';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import Joi from 'joi';

const router = Router();
const trackingController = new TrackingController();

// Apply authentication and organization middleware
router.use(authenticateToken);
router.use(requireOrganization);

// Tracking routes
router.get('/mentions',
  validateRequest({ 
    query: Joi.object({
      websiteId: commonSchemas.uuid.optional(),
      platform: Joi.string().valid('ChatGPT', 'Perplexity', 'Gemini', 'Claude').optional(),
      dateRange: Joi.string().optional(),
      page: commonSchemas.pagination.page,
      limit: commonSchemas.pagination.limit
    })
  }),
  trackingController.getMentions
);

router.get('/visibility-trends',
  validateRequest({ 
    query: Joi.object({
      websiteId: commonSchemas.uuid.required(),
      period: Joi.string().valid('7d', '30d', '90d', '1y').default('30d')
    })
  }),
  trackingController.getVisibilityTrends
);

export default router;