import { Router } from 'express';
import { ScanController } from '../controllers/scan.controller';
import { validateRequest, scanSchemas, commonSchemas } from '../middlewares/validation.middleware';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import Joi from 'joi';

const router = Router();
const scanController = new ScanController();

// Apply authentication and organization middleware
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