import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import Joi from 'joi';

const router = Router();
const contentController = new ContentController();

// Apply authentication and organization middleware
router.use(authenticateToken);
router.use(requireOrganization);

// Content optimization routes
router.post('/optimization-suggestions',
  validateRequest({ 
    body: Joi.object({
      url: Joi.string().uri().required(),
      content: Joi.string().optional()
    })
  }),
  contentController.getOptimizationSuggestions
);

export default router;