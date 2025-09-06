import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';

const router = Router();
const reportsController = new ReportsController();

// Apply authentication and organization middleware
router.use(authenticateToken);
router.use(requireOrganization);

// Report template routes
router.get('/templates', reportsController.getTemplates);
router.post('/templates', reportsController.createTemplate);
router.get('/templates/:id', reportsController.getTemplate);
router.put('/templates/:id', reportsController.updateTemplate);
router.delete('/templates/:id', reportsController.deleteTemplate);
router.post('/templates/:id/clone', reportsController.cloneTemplate);

// Generated report routes
router.get('/', reportsController.getReports);
router.post('/generate', reportsController.generateReport);
router.get('/stats', reportsController.getReportingStats);
router.get('/:id', reportsController.getReport);
router.get('/:id/download', reportsController.downloadReport);
router.delete('/:id', reportsController.deleteReport);

export default router;