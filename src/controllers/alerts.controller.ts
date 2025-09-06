import { Request, Response } from 'express';
import { AlertService } from '../services/alertService';
import { AppError, asyncHandler } from '../middlewares/error.middleware';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class AlertsController {
  /**
   * GET /api/v1/alerts - Get all alert configurations
   */
  public getAlerts = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { websiteId, alertType, isActive, page, limit } = req.query;

    const alertService = new AlertService({ organizationId });
    
    const result = await alertService.getAlerts({
      websiteId: websiteId as string,
      alertType: alertType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * POST /api/v1/alerts - Create new alert configuration
   */
  public createAlert = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { websiteId, name, description, alertType, conditions, notificationChannels, cooldownMinutes } = req.body;

    if (!name || !alertType || !conditions || !Array.isArray(conditions) || conditions.length === 0) {
      throw new AppError('Missing required fields: name, alertType, and conditions', 400);
    }

    const alertService = new AlertService({ organizationId });
    
    const alert = await alertService.createAlert({
      websiteId,
      name,
      description,
      alertType,
      conditions,
      notificationChannels,
      cooldownMinutes: cooldownMinutes || 60
    });

    res.status(201).json({
      success: true,
      data: { alert }
    });
  });

  /**
   * PUT /api/v1/alerts/:id - Update alert configuration
   */
  public updateAlert = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { id } = req.params;
    const { name, description, conditions, notificationChannels, isActive, cooldownMinutes } = req.body;

    const alertService = new AlertService({ organizationId });
    
    const alert = await alertService.updateAlert(id, {
      name,
      description,
      conditions,
      notificationChannels,
      isActive,
      cooldownMinutes
    });

    if (!alert) {
      throw new AppError('Alert configuration not found', 404);
    }

    res.json({
      success: true,
      data: { alert }
    });
  });

  /**
   * DELETE /api/v1/alerts/:id - Delete alert configuration
   */
  public deleteAlert = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { id } = req.params;

    const alertService = new AlertService({ organizationId });
    
    const deleted = await alertService.deleteAlert(id);

    if (!deleted) {
      throw new AppError('Alert configuration not found', 404);
    }

    res.json({
      success: true,
      message: 'Alert configuration deleted successfully'
    });
  });

  /**
   * GET /api/v1/alerts/history - Get alert history
   */
  public getAlertHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { alertConfigId, websiteId, alertType, notificationStatus, page, limit } = req.query;

    const alertService = new AlertService({ organizationId });
    
    const result = await alertService.getAlertHistory({
      alertConfigId: alertConfigId as string,
      websiteId: websiteId as string,
      alertType: alertType as string,
      notificationStatus: notificationStatus as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * POST /api/v1/alerts/:id/test - Test alert configuration (dry run)
   */
  public testAlert = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { id } = req.params;

    const alertService = new AlertService({ organizationId });
    
    const testResult = await alertService.testAlert(id);

    res.json({
      success: true,
      data: testResult
    });
  });

  /**
   * GET /api/v1/alerts/metrics/summary - Get metrics summary for dashboard
   */
  public getMetricsSummary = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { websiteId } = req.query;

    const alertService = new AlertService({ organizationId });
    
    const summary = await alertService.getMetricsSummary(websiteId as string);

    res.json({
      success: true,
      data: summary
    });
  });

  /**
   * POST /api/v1/alerts/metrics/snapshot - Create metrics snapshot
   */
  public createMetricsSnapshot = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { websiteId, metricType, platform, timeWindow, metricValue } = req.body;

    if (!websiteId || !metricType || !timeWindow || metricValue === undefined) {
      throw new AppError('Missing required fields: websiteId, metricType, timeWindow, metricValue', 400);
    }

    const alertService = new AlertService({ organizationId });
    
    const snapshot = await alertService.createMetricsSnapshot({
      websiteId,
      metricType,
      platform: platform || 'all',
      timeWindow,
      metricValue
    });

    res.status(201).json({
      success: true,
      data: { snapshot }
    });
  });

  /**
   * POST /api/v1/alerts/check/:websiteId - Manually check alerts for a website
   */
  public checkAlertsForWebsite = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const organizationId = req.organization.id;
    const { websiteId } = req.params;

    const alertService = new AlertService({ organizationId });
    
    const triggeredAlerts = await alertService.checkAlertsForWebsite(websiteId);

    res.json({
      success: true,
      data: {
        triggeredAlerts: triggeredAlerts.length,
        alerts: triggeredAlerts
      }
    });
  });

  /**
   * GET /api/v1/alerts/types - Get available alert types and metrics
   */
  public getAlertTypes = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const alertTypes = [
      {
        type: 'mention_spike',
        name: 'Mention Spike',
        description: 'Triggered when AI platform mentions increase significantly'
      },
      {
        type: 'visibility_drop',
        name: 'Visibility Drop',
        description: 'Triggered when AI visibility decreases below threshold'
      },
      {
        type: 'score_change',
        name: 'Score Change',
        description: 'Triggered when GEO score changes significantly'
      }
    ];

    const metricTypes = [
      {
        metric: 'mention_count',
        name: 'Mention Count',
        description: 'Number of AI platform mentions'
      },
      {
        metric: 'sentiment_score',
        name: 'Sentiment Score',
        description: 'Average sentiment score of mentions'
      },
      {
        metric: 'visibility_percentage',
        name: 'Visibility Percentage',
        description: 'Percentage visibility across AI platforms'
      },
      {
        metric: 'geo_score',
        name: 'GEO Score',
        description: 'Overall Generative Engine Optimization score'
      }
    ];

    const timeWindows = [
      { value: '1h', name: '1 Hour' },
      { value: '1d', name: '1 Day' },
      { value: '7d', name: '7 Days' },
      { value: '30d', name: '30 Days' }
    ];

    const operators = [
      { value: 'greater_than', name: 'Greater Than' },
      { value: 'less_than', name: 'Less Than' },
      { value: 'equals', name: 'Equals' },
      { value: 'percentage_change', name: 'Percentage Change' }
    ];

    res.json({
      success: true,
      data: {
        alertTypes,
        metricTypes,
        timeWindows,
        operators
      }
    });
  });
}