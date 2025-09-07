import { Request, Response } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticateToken, requireOrganization, AuthRequest } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { IntegrationsService } from '../services/integrations.service';
import { WebhookService } from '../services/webhook.service';
import { logger } from '../utils/logger';

const integrationsService = new IntegrationsService();
const webhookService = new WebhookService();

// Request validation schemas
const createIntegrationSchema = {
  body: Joi.object({
    integrationType: Joi.string().valid('zapier', 'make', 'slack', 'teams', 'discord', 'telegram', 'email').required(),
    name: Joi.string().required(),
    config: Joi.object().optional(),
    credentials: Joi.object().optional(),
    webhookUrl: Joi.string().uri().optional()
  })
};

const updateIntegrationSchema = {
  params: Joi.object({
    integrationId: Joi.string().uuid().required()
  }),
  body: Joi.object({
    name: Joi.string().optional(),
    config: Joi.object().optional(),
    credentials: Joi.object().optional(),
    webhookUrl: Joi.string().uri().optional(),
    isActive: Joi.boolean().optional()
  })
};

const createWebhookSchema = {
  body: Joi.object({
    name: Joi.string().required(),
    url: Joi.string().uri().required(),
    events: Joi.array().items(Joi.string()).required(),
    secret: Joi.string().optional(),
    headers: Joi.object().optional(),
    retryAttempts: Joi.number().integer().min(0).max(10).default(3),
    timeoutSeconds: Joi.number().integer().min(1).max(300).default(30)
  })
};

const createWorkflowSchema = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    triggerEvent: Joi.string().required(),
    triggerConditions: Joi.object().optional(),
    actions: Joi.array().items(Joi.object()).required()
  })
};

const setupZapierSchema = {
  body: Joi.object({
    apiKey: Joi.string().required(),
    webhookUrl: Joi.string().uri().optional()
  })
};

const setupSlackSchema = {
  body: Joi.object({
    botToken: Joi.string().required(),
    channel: Joi.string().required(),
    teamId: Joi.string().optional(),
    webhookUrl: Joi.string().uri().optional()
  })
};

export class IntegrationsController {
  public getIntegrations = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { type, isActive } = req.query;

    const integrations = await integrationsService.getIntegrations({
      organizationId,
      type: type as string,
      isActive: isActive === 'true'
    });

    res.json({
      success: true,
      data: integrations
    });
  });

  public createIntegration = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;

    const integration = await integrationsService.createIntegration({
      organizationId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: integration
    });
  });

  public getIntegrationById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { integrationId } = req.params;

    // Mock integration data
    const integration = {
      id: integrationId,
      organizationId,
      integrationType: 'slack',
      name: 'Team Slack Integration',
      isActive: true,
      createdAt: new Date()
    };

    res.json({
      success: true,
      data: integration
    });
  });

  public updateIntegration = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { integrationId } = req.params;

    const integration = await integrationsService.updateIntegration({
      integrationId,
      organizationId,
      updateData: req.body
    });

    res.json({
      success: true,
      data: integration
    });
  });

  public deleteIntegration = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { integrationId } = req.params;

    await integrationsService.deleteIntegration({
      integrationId,
      organizationId
    });

    res.json({
      success: true,
      message: 'Integration deleted successfully'
    });
  });

  public testIntegration = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { integrationId } = req.params;

    const testResult = await integrationsService.testIntegration({
      integrationId,
      organizationId
    });

    res.json({
      success: true,
      data: testResult
    });
  });

  public getWebhooks = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { isActive } = req.query;

    const processedIsActive = isActive === 'false' ? false : isActive === 'true' ? true : undefined;
    console.log(`[DEBUG] getWebhooks controller: organizationId=${organizationId}, isActive param=${isActive}, processed=${processedIsActive}`);
    
    const webhooks = await webhookService.getWebhooks({
      organizationId,
      isActive: processedIsActive
    });

    console.log(`[DEBUG] getWebhooks controller: returning ${webhooks.length} webhooks`);
    
    res.json({
      success: true,
      data: webhooks
    });
  });

  public createWebhook = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;

    const webhook = await webhookService.createWebhook({
      organizationId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: webhook
    });
  });

  public getWebhookById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { webhookId } = req.params;

    // Mock webhook data
    const webhook = {
      id: webhookId,
      organizationId,
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      events: ['scan_completed'],
      isActive: true,
      createdAt: new Date()
    };

    res.json({
      success: true,
      data: webhook
    });
  });

  public updateWebhook = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { webhookId } = req.params;

    const webhook = await webhookService.updateWebhook({
      webhookId,
      organizationId,
      updateData: req.body
    });

    res.json({
      success: true,
      data: webhook
    });
  });

  public deleteWebhook = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { webhookId } = req.params;

    await webhookService.deleteWebhook({
      webhookId,
      organizationId
    });

    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  });

  public testWebhook = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { webhookId } = req.params;
    const { testPayload } = req.body;

    const testResult = await webhookService.testWebhook({
      webhookId,
      organizationId,
      testPayload
    });

    res.json({
      success: true,
      data: testResult
    });
  });

  public getWebhookDeliveries = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { webhookId } = req.params;
    const { status, eventType, page = 1, limit = 20 } = req.query;

    const result = await webhookService.getWebhookDeliveries({
      webhookId,
      organizationId,
      status: status as string,
      eventType: eventType as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: result
    });
  });

  public getWorkflows = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { isActive, triggerEvent } = req.query;

    const workflows = await integrationsService.getWorkflows({
      organizationId,
      isActive: isActive === 'true',
      triggerEvent: triggerEvent as string
    });

    res.json({
      success: true,
      data: workflows
    });
  });

  public createWorkflow = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;

    const workflow = await integrationsService.createWorkflow({
      organizationId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: workflow
    });
  });

  public getWorkflowById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { workflowId } = req.params;

    // Mock workflow data
    const workflow = {
      id: workflowId,
      organizationId,
      name: 'Alert Notification Workflow',
      triggerEvent: 'alert_triggered',
      isActive: true,
      createdAt: new Date()
    };

    res.json({
      success: true,
      data: workflow
    });
  });

  public executeWorkflow = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { workflowId } = req.params;
    const { triggerData } = req.body;

    const execution = await integrationsService.executeWorkflow({
      workflowId,
      organizationId,
      triggerData
    });

    res.json({
      success: true,
      data: execution
    });
  });

  public setupZapierIntegration = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;

    const integration = await integrationsService.setupZapierIntegration({
      organizationId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: integration
    });
  });

  public setupSlackIntegration = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;

    const integration = await integrationsService.setupSlackIntegration({
      organizationId,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: integration
    });
  });

  public getIntegrationTypes = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const integrationTypes = await integrationsService.getAvailableIntegrationTypes();

    res.json({
      success: true,
      data: integrationTypes
    });
  });

  public getUsageStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { integrationId, days = 30 } = req.query;

    const stats = await integrationsService.getUsageStats({
      organizationId,
      integrationId: integrationId as string,
      days: parseInt(days as string)
    });

    res.json({
      success: true,
      data: stats
    });
  });

  public getWebhookEvents = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const events = await webhookService.getWebhookEvents();

    res.json({
      success: true,
      data: events
    });
  });

  public getWebhookStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization?.id;
    const { webhookId, days = 30 } = req.query;

    const stats = await webhookService.getWebhookStats({
      organizationId,
      webhookId: webhookId as string,
      days: parseInt(days as string)
    });

    res.json({
      success: true,
      data: stats
    });
  });
}

const integrationsController = new IntegrationsController();

// Export middleware chains
export const getIntegrations = [
  authenticateToken,
  requireOrganization,
  integrationsController.getIntegrations
];

export const createIntegration = [
  authenticateToken,
  requireOrganization,
  validateRequest(createIntegrationSchema),
  integrationsController.createIntegration
];

export const getIntegrationById = [
  authenticateToken,
  requireOrganization,
  integrationsController.getIntegrationById
];

export const updateIntegration = [
  authenticateToken,
  requireOrganization,
  validateRequest(updateIntegrationSchema),
  integrationsController.updateIntegration
];

export const deleteIntegration = [
  authenticateToken,
  requireOrganization,
  integrationsController.deleteIntegration
];

export const testIntegration = [
  authenticateToken,
  requireOrganization,
  integrationsController.testIntegration
];

export const getWebhooks = [
  authenticateToken,
  requireOrganization,
  integrationsController.getWebhooks
];

export const createWebhook = [
  authenticateToken,
  requireOrganization,
  validateRequest(createWebhookSchema),
  integrationsController.createWebhook
];

export const getWebhookById = [
  authenticateToken,
  requireOrganization,
  integrationsController.getWebhookById
];

export const updateWebhook = [
  authenticateToken,
  requireOrganization,
  integrationsController.updateWebhook
];

export const deleteWebhook = [
  authenticateToken,
  requireOrganization,
  integrationsController.deleteWebhook
];

export const testWebhook = [
  authenticateToken,
  requireOrganization,
  integrationsController.testWebhook
];

export const getWebhookDeliveries = [
  authenticateToken,
  requireOrganization,
  integrationsController.getWebhookDeliveries
];

export const getWorkflows = [
  authenticateToken,
  requireOrganization,
  integrationsController.getWorkflows
];

export const createWorkflow = [
  authenticateToken,
  requireOrganization,
  validateRequest(createWorkflowSchema),
  integrationsController.createWorkflow
];

export const getWorkflowById = [
  authenticateToken,
  requireOrganization,
  integrationsController.getWorkflowById
];

export const executeWorkflow = [
  authenticateToken,
  requireOrganization,
  integrationsController.executeWorkflow
];

export const setupZapierIntegration = [
  authenticateToken,
  requireOrganization,
  validateRequest(setupZapierSchema),
  integrationsController.setupZapierIntegration
];

export const setupSlackIntegration = [
  authenticateToken,
  requireOrganization,
  validateRequest(setupSlackSchema),
  integrationsController.setupSlackIntegration
];

export const getIntegrationTypes = [
  authenticateToken,
  requireOrganization,
  integrationsController.getIntegrationTypes
];

export const getUsageStats = [
  authenticateToken,
  requireOrganization,
  integrationsController.getUsageStats
];

export const getWebhookEvents = [
  authenticateToken,
  requireOrganization,
  integrationsController.getWebhookEvents
];

export const getWebhookStats = [
  authenticateToken,
  requireOrganization,
  integrationsController.getWebhookStats
];