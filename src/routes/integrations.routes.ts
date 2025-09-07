import { Router } from 'express';
import {
  getIntegrations,
  createIntegration,
  getIntegrationById,
  updateIntegration,
  deleteIntegration,
  testIntegration,
  getWebhooks,
  createWebhook,
  getWebhookById,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookDeliveries,
  getWorkflows,
  createWorkflow,
  getWorkflowById,
  executeWorkflow,
  setupZapierIntegration,
  setupSlackIntegration,
  getUsageStats,
  getIntegrationTypes,
  getWebhookEvents,
  getWebhookStats
} from '../controllers/integrations.controller';

const router = Router();

// Third-party Integrations Routes (non-parameterized first)
router.get('/', getIntegrations);
router.post('/', createIntegration);
router.get('/types', getIntegrationTypes);
router.get('/stats', getUsageStats);

// Webhooks Routes (specific routes before parameterized ones)
router.get('/webhooks', getWebhooks);
router.post('/webhooks', createWebhook);
router.get('/webhooks/events', getWebhookEvents);
router.get('/webhooks/stats', getWebhookStats);
router.get('/webhooks/:webhookId', getWebhookById);
router.put('/webhooks/:webhookId', updateWebhook);
router.delete('/webhooks/:webhookId', deleteWebhook);
router.post('/webhooks/:webhookId/test', testWebhook);
router.get('/webhooks/:webhookId/deliveries', getWebhookDeliveries);

// Third-party Integrations Routes (parameterized routes last)
router.get('/:integrationId', getIntegrationById);
router.put('/:integrationId', updateIntegration);
router.delete('/:integrationId', deleteIntegration);
router.post('/:integrationId/test', testIntegration);

// Automation Workflows Routes
router.get('/workflows', getWorkflows);
router.post('/workflows', createWorkflow);
router.get('/workflows/:workflowId', getWorkflowById);
router.post('/workflows/:workflowId/execute', executeWorkflow);

// Platform-specific Setup Routes
router.post('/zapier/setup', setupZapierIntegration);
router.post('/slack/setup', setupSlackIntegration);

export default router;