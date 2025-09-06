import express from 'express';
import {
  createAlert,
  getAlerts,
  getAlert,
  updateAlert,
  deleteAlert,
  getAlertHistory,
  testAlert,
  triggerManualCheck,
  triggerMetricsCollectionManual,
  getAlertDashboard,
  getMetricsSnapshots,
  resendNotification
} from '../controllers/alert.controller';

import { authenticateToken, requireOrganization } from '../middlewares/auth.middleware';
import {
  validateCreateAlert,
  validateUpdateAlert,
  validateAlertId,
  validateGetAlerts,
  validateGetAlertHistory,
  validateManualTrigger,
  validateGetMetricsSnapshots
} from '../middleware/alertValidation';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireOrganization);

// Alert configuration routes
router.post('/configurations', validateCreateAlert, createAlert);
router.get('/configurations', validateGetAlerts, getAlerts);
router.get('/configurations/:id', validateAlertId, getAlert);
router.put('/configurations/:id', validateUpdateAlert, updateAlert);
router.delete('/configurations/:id', validateAlertId, deleteAlert);

// Alert testing and management
router.post('/configurations/:id/test', validateAlertId, testAlert);
router.post('/trigger-check', validateManualTrigger, triggerManualCheck);
router.post('/collect-metrics', validateManualTrigger, triggerMetricsCollectionManual);

// Alert history routes
router.get('/history', validateGetAlertHistory, getAlertHistory);
router.post('/history/:id/resend', validateAlertId, resendNotification);

// Dashboard and metrics routes
router.get('/dashboard', getAlertDashboard);
router.get('/metrics/snapshots', validateGetMetricsSnapshots, getMetricsSnapshots);

export default router;