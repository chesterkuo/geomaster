import { Router } from 'express';
import { WebsiteController } from '../controllers/website.controller';
import { validateRequest, websiteSchemas, commonSchemas } from '../middlewares/validation.middleware';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import Joi from 'joi';

const router = Router();
const websiteController = new WebsiteController();

// Apply authentication and organization middleware to all routes
router.use(authenticateToken);
router.use(requireOrganization);

// Website CRUD routes
router.get('/', 
  validateRequest({ query: websiteSchemas.list }), 
  websiteController.getWebsites
);

router.get('/:id', 
  validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), 
  websiteController.getWebsite
);

router.post('/', 
  validateRequest({ body: websiteSchemas.create }), 
  websiteController.createWebsite
);

router.put('/:id', 
  validateRequest({ 
    params: Joi.object({ id: commonSchemas.uuid }),
    body: websiteSchemas.update
  }), 
  websiteController.updateWebsite
);

router.delete('/:id', 
  validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), 
  websiteController.deleteWebsite
);

// Website content routes
router.get('/:id/content', 
  validateRequest({ 
    params: Joi.object({ id: commonSchemas.uuid }),
    query: Joi.object({
      page: commonSchemas.pagination.page,
      limit: commonSchemas.pagination.limit,
      search: Joi.string().max(255).optional(),
      optimizationStatus: Joi.string().valid('pending', 'optimized', 'needs_update').optional()
    })
  }), 
  websiteController.getWebsiteContent
);

// Website analytics
router.get('/:id/analytics', 
  validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), 
  websiteController.getWebsiteAnalytics
);

export default router;