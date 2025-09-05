import { Router } from 'express';
import { CompetitionController } from '../controllers/competition.controller';
import { validateRequest, commonSchemas } from '../middlewares/validation.middleware';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import Joi from 'joi';

const router = Router();
const competitionController = new CompetitionController();

// Apply authentication and organization middleware
router.use(authenticateToken);
router.use(requireOrganization);

// Competition analysis routes

// GET /api/v1/tracking/competitors - List competitors
router.get('/competitors',
  validateRequest({
    query: Joi.object({
      page: commonSchemas.pagination.page,
      limit: commonSchemas.pagination.limit,
      active: Joi.boolean().optional()
    })
  }),
  competitionController.getCompetitors
);

// POST /api/v1/tracking/competitors - Add competitor
router.post('/competitors',
  validateRequest({
    body: Joi.object({
      websiteUrl: Joi.string().uri().required(),
      name: Joi.string().min(1).max(255).optional()
    })
  }),
  competitionController.addCompetitor
);

// PUT /api/v1/tracking/competitors/:id - Update competitor
router.put('/competitors/:id',
  validateRequest({
    params: Joi.object({
      id: commonSchemas.uuid.required()
    }),
    body: Joi.object({
      name: Joi.string().min(1).max(255).optional(),
      websiteUrl: Joi.string().uri().optional(),
      isActive: Joi.boolean().optional()
    })
  }),
  competitionController.updateCompetitor
);

// DELETE /api/v1/tracking/competitors/:id - Remove competitor
router.delete('/competitors/:id',
  validateRequest({
    params: Joi.object({
      id: commonSchemas.uuid.required()
    })
  }),
  competitionController.removeCompetitor
);

// GET /api/v1/tracking/competitive-analysis - Competitor comparison data
router.get('/competitive-analysis',
  validateRequest({
    query: Joi.object({
      timeframe: Joi.string().valid('7d', '30d', '90d').default('30d'),
      platform: Joi.string().valid('chatgpt', 'gemini', 'perplexity', 'claude').optional()
    })
  }),
  competitionController.getCompetitiveAnalysis
);

export default router;