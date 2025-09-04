import { Router } from 'express';
import { ScanController } from '../controllers/scan.controller';
import { validateRequest, scanSchemas, commonSchemas } from '../middlewares/validation.middleware';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import Joi from 'joi';

const router = Router();
const scanController = new ScanController();

// Anonymous scan endpoints (no authentication required)
router.post('/anonymous', 
  validateRequest({ body: Joi.object({
    url: Joi.string().uri().required(),
    scanType: Joi.string().valid('basic', 'quick').default('basic')
  }) }), 
  scanController.createAnonymousScan
);

router.get('/anonymous/:id', 
  validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), 
  scanController.getAnonymousScan
);

// Apply authentication and organization middleware for protected routes
router.use(authenticateToken);
router.use(requireOrganization);

// Scan routes
router.post('/', 
  validateRequest({ body: scanSchemas.create }), 
  scanController.createScan
);

router.get('/:id', 
  validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), 
  scanController.getScan
);

router.get('/', 
  validateRequest({ 
    query: Joi.object({
      websiteId: commonSchemas.uuid.optional(),
      page: commonSchemas.pagination.page,
      limit: commonSchemas.pagination.limit
    })
  }), 
  scanController.getScans
);

export default router;