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
      content: Joi.string().allow('', null).optional(),
      provider: Joi.string().valid('openai', 'gemini').optional().default('openai')
    })
  }),
  contentController.getOptimizationSuggestions
);

// Page analysis management routes
router.get('/pages',
  contentController.getPages
);

router.post('/pages',
  validateRequest({
    body: Joi.object({
      title: Joi.string().required(),
      url: Joi.string().uri().required(),
      type: Joi.string().valid('產品頁', '部落格', 'FAQ', '服務頁', '其他').default('其他'),
      traffic: Joi.string().valid('高', '中', '低').default('中')
    })
  }),
  contentController.addPage
);

router.put('/pages/:pageId',
  validateRequest({
    params: Joi.object({
      pageId: Joi.string().uuid().required()
    }),
    body: Joi.object({
      title: Joi.string().optional(),
      url: Joi.string().uri().optional(),
      type: Joi.string().valid('產品頁', '部落格', 'FAQ', '服務頁', '其他').optional(),
      traffic: Joi.string().valid('高', '中', '低').optional()
    })
  }),
  contentController.updatePage
);

router.delete('/pages/:pageId',
  validateRequest({
    params: Joi.object({
      pageId: Joi.string().uuid().required()
    })
  }),
  contentController.deletePage
);

router.post('/pages/:pageId/analyze',
  validateRequest({
    params: Joi.object({
      pageId: Joi.string().uuid().required()
    }),
    body: Joi.object({
      provider: Joi.string().valid('openai', 'gemini').optional().default('openai')
    })
  }),
  contentController.analyzePage
);

router.post('/pages/batch-analyze',
  validateRequest({
    body: Joi.object({
      pageIds: Joi.array().items(Joi.string().uuid()).required(),
      provider: Joi.string().valid('openai', 'gemini').optional().default('openai')
    })
  }),
  contentController.batchAnalyzePages
);

export default router;