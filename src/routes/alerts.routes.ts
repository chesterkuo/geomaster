import { Router } from 'express';
import { AlertsController } from '../controllers/alerts.controller';
import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';

const router = Router();
const alertsController = new AlertsController();

// Apply authentication and organization middleware
router.use(authenticateToken);
router.use(requireOrganization);

// Alert configuration routes
router.get('/', alertsController.getAlerts);
router.post('/', alertsController.createAlert);
router.put('/:id', alertsController.updateAlert);
router.delete('/:id', alertsController.deleteAlert);

// Alert history and testing
router.get('/history', alertsController.getAlertHistory);
router.post('/:id/test', alertsController.testAlert);

// Metrics and monitoring
router.get('/metrics/summary', alertsController.getMetricsSummary);
router.post('/metrics/snapshot', alertsController.createMetricsSnapshot);

// Alert checking
router.post('/check/:websiteId', alertsController.checkAlertsForWebsite);

// Metadata routes
router.get('/types', alertsController.getAlertTypes);

export default router;