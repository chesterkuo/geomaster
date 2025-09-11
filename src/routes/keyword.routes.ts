import { Router } from 'express';
import { KeywordController } from '../controllers/keyword.controller';
import { validateRequest, commonSchemas } from '../middlewares/validation.middleware';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import Joi from 'joi';

const router = Router();
const keywordController = new KeywordController();

// Apply authentication and organization middleware
router.use(authenticateToken);
router.use(requireOrganization);

// Keyword management routes

// GET /api/v1/keywords - List all keywords by type
router.get('/',
  validateRequest({
    query: Joi.object({
      type: Joi.string().valid('informational', 'commercial', 'transactional', 'navigational').optional(),
      page: commonSchemas.pagination.page,
      limit: commonSchemas.pagination.limit,
      search: Joi.string().optional()
    })
  }),
  keywordController.getKeywords.bind(keywordController)
);

// POST /api/v1/keywords - Add new keyword
router.post('/',
  validateRequest({
    body: Joi.object({
      keyword: Joi.string().min(1).max(255).required(),
      searchVolume: Joi.number().integer().min(0).optional(),
      difficulty: Joi.number().min(0).max(100).optional(),
      cpc: Joi.number().min(0).optional(),
      intent: Joi.string().valid('informational', 'commercial', 'transactional', 'navigational').optional()
    })
  }),
  keywordController.createKeyword.bind(keywordController)
);

// PUT /api/v1/keywords/:id - Update keyword
router.put('/:id',
  validateRequest({
    params: Joi.object({
      id: commonSchemas.uuid.required()
    }),
    body: Joi.object({
      keyword: Joi.string().min(1).max(255).optional(),
      searchVolume: Joi.number().integer().min(0).optional(),
      difficulty: Joi.number().min(0).max(100).optional(),
      cpc: Joi.number().min(0).optional(),
      intent: Joi.string().valid('informational', 'commercial', 'transactional', 'navigational').optional()
    })
  }),
  keywordController.updateKeyword.bind(keywordController)
);

// DELETE /api/v1/keywords/:id - Delete keyword
router.delete('/:id',
  validateRequest({
    params: Joi.object({
      id: commonSchemas.uuid.required()
    })
  }),
  keywordController.deleteKeyword.bind(keywordController)
);

// GET /api/v1/keywords/types - Get keyword types
router.get('/types',
  keywordController.getKeywordTypes.bind(keywordController)
);

export default router;