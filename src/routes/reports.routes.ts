import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { validateRequest, commonSchemas } from '../middlewares/validation.middleware';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import Joi from 'joi';

const router = Router();
const reportsController = new ReportsController();

// Apply authentication and organization middleware
router.use(authenticateToken);
router.use(requireOrganization);

// Validation schemas
const reportTypeSchema = Joi.string().valid('competitor_benchmark', 'market_position', 'swot_analysis', 'keyword_analysis', 'custom');
const reportStatusSchema = Joi.string().valid('generating', 'completed', 'failed');
const fileFormatSchema = Joi.string().valid('pdf', 'excel', 'csv', 'json').default('pdf');
const scheduleTypeSchema = Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly', 'custom');

// Routes
router.get('/',
  validateRequest({
    query: Joi.object({
      reportType: reportTypeSchema.optional(),
      status: reportStatusSchema.optional(),
      limit: commonSchemas.pagination.limit
    })
  }),
  reportsController.getReports
);

// Scheduled Reports Routes - Must come before parameterized routes
router.get('/scheduled',
  reportsController.getScheduledReports
);

router.post('/schedule',
  validateRequest({
    body: Joi.object({
      templateId: Joi.string().required(),
      name: Joi.string().min(2).max(255).required(),
      schedule: Joi.object({
        type: scheduleTypeSchema.required(),
        frequency: Joi.number().min(1).default(1),
        dayOfWeek: Joi.number().min(0).max(6).optional(),
        dayOfMonth: Joi.number().min(1).max(31).optional(),
        hour: Joi.number().min(0).max(23).required(),
        minute: Joi.number().min(0).max(59).required(),
        timezone: Joi.string().optional().default('UTC')
      }).required(),
      recipients: Joi.array().items(Joi.string().email()).min(1).required(),
      parameters: Joi.object().optional(),
      isActive: Joi.boolean().optional().default(true)
    })
  }),
  reportsController.scheduleReport
);

router.put('/scheduled/:scheduledReportId',
  validateRequest({
    params: Joi.object({
      scheduledReportId: commonSchemas.uuid
    }),
    body: Joi.object({
      templateId: Joi.string().optional(),
      name: Joi.string().min(2).max(255).optional(),
      schedule: Joi.object({
        type: scheduleTypeSchema.optional(),
        frequency: Joi.number().min(1).optional(),
        dayOfWeek: Joi.number().min(0).max(6).optional(),
        dayOfMonth: Joi.number().min(1).max(31).optional(),
        hour: Joi.number().min(0).max(23).optional(),
        minute: Joi.number().min(0).max(59).optional(),
        timezone: Joi.string().optional()
      }).optional(),
      recipients: Joi.array().items(Joi.string().email()).min(1).optional(),
      parameters: Joi.object().optional(),
      isActive: Joi.boolean().optional()
    })
  }),
  reportsController.updateScheduledReport
);

router.delete('/scheduled/:scheduledReportId',
  validateRequest({
    params: Joi.object({
      scheduledReportId: commonSchemas.uuid
    })
  }),
  reportsController.deleteScheduledReport
);

router.get('/:reportId',
  validateRequest({
    params: Joi.object({
      reportId: commonSchemas.uuid
    })
  }),
  reportsController.getReport
);

router.post('/',
  validateRequest({
    body: Joi.object({
      name: Joi.string().min(2).max(255).required(),
      reportType: reportTypeSchema.required(),
      parameters: Joi.object().optional(),
      fileFormat: fileFormatSchema
    })
  }),
  reportsController.generateReport
);

router.delete('/:reportId',
  validateRequest({
    params: Joi.object({
      reportId: commonSchemas.uuid
    })
  }),
  reportsController.deleteReport
);

router.get('/:reportId/download',
  validateRequest({
    params: Joi.object({
      reportId: commonSchemas.uuid
    })
  }),
  reportsController.downloadReport
);

export default router;