import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AlertService } from '../services/alertService';
import { triggerAlertCheck, triggerMetricsCollection } from '../services/alertQueue';
import { notificationService } from '../services/notificationService';
import AlertConfiguration from '../models/AlertConfiguration';
import AlertHistory from '../models/AlertHistory';
import MetricsSnapshot from '../models/MetricsSnapshot';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

/**
 * Create a new alert configuration
 */
export const createAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const organizationId = req.organization!.id;
    const alertService = new AlertService({ organizationId });

    const {
      websiteId,
      name,
      description,
      alertType,
      conditions,
      notificationChannels,
      cooldownMinutes
    } = req.body;

    const alert = await alertService.createAlert({
      websiteId,
      name,
      description,
      alertType,
      conditions,
      notificationChannels,
      cooldownMinutes
    });

    logger.info(`Alert created by user ${req.user?.id}:`, { alertId: alert.id, name });

    res.status(201).json({
      success: true,
      message: 'Alert configuration created successfully',
      data: alert
    });
  } catch (error) {
    logger.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all alert configurations
 */
export const getAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organization!.id;
    const alertService = new AlertService({ organizationId });

    const {
      websiteId,
      alertType,
      isActive,
      page = 1,
      limit = 20
    } = req.query;

    const result = await alertService.getAlerts({
      websiteId: websiteId as string,
      alertType: alertType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve alert configurations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get specific alert configuration
 */
export const getAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.organization!.id;

    const alert = await AlertConfiguration.findOne({
      where: { id, organizationId },
      include: [
        { model: require('../models').Website, as: 'website', attributes: ['id', 'name', 'url'] }
      ]
    });

    if (!alert) {
      res.status(404).json({
        success: false,
        message: 'Alert configuration not found'
      });
      return;
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Get alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve alert configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update alert configuration
 */
export const updateAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { id } = req.params;
    const organizationId = req.organization!.id;
    const alertService = new AlertService({ organizationId });

    const updatedAlert = await alertService.updateAlert(id, req.body);

    if (!updatedAlert) {
      res.status(404).json({
        success: false,
        message: 'Alert configuration not found'
      });
      return;
    }

    logger.info(`Alert updated by user ${req.user?.id}:`, { alertId: id });

    res.json({
      success: true,
      message: 'Alert configuration updated successfully',
      data: updatedAlert
    });
  } catch (error) {
    logger.error('Update alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete alert configuration
 */
export const deleteAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.organization!.id;
    const alertService = new AlertService({ organizationId });

    const deleted = await alertService.deleteAlert(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Alert configuration not found'
      });
      return;
    }

    logger.info(`Alert deleted by user ${req.user?.id}:`, { alertId: id });

    res.json({
      success: true,
      message: 'Alert configuration deleted successfully'
    });
  } catch (error) {
    logger.error('Delete alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get alert history
 */
export const getAlertHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organization!.id;
    const alertService = new AlertService({ organizationId });

    const {
      alertConfigId,
      websiteId,
      alertType,
      notificationStatus,
      page = 1,
      limit = 20
    } = req.query;

    const result = await alertService.getAlertHistory({
      alertConfigId: alertConfigId as string,
      websiteId: websiteId as string,
      alertType: alertType as string,
      notificationStatus: notificationStatus as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get alert history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve alert history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Test alert configuration
 */
export const testAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.organization!.id;
    const alertService = new AlertService({ organizationId });

    const testResult = await alertService.testAlert(id);

    logger.info(`Alert tested by user ${req.user?.id}:`, { alertId: id, wouldTrigger: testResult.wouldTrigger });

    res.json({
      success: true,
      message: 'Alert test completed',
      data: testResult
    });
  } catch (error) {
    logger.error('Test alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test alert configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Trigger manual alert check
 */
export const triggerManualCheck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organization!.id;
    const { websiteId, alertType } = req.body;

    const job = await triggerAlertCheck({
      organizationId,
      websiteId,
      alertType
    });

    logger.info(`Manual alert check triggered by user ${req.user?.id}:`, { jobId: job.id, organizationId, websiteId });

    res.json({
      success: true,
      message: 'Alert check triggered successfully',
      data: {
        jobId: job.id,
        status: 'queued'
      }
    });
  } catch (error) {
    logger.error('Trigger manual check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger alert check',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Trigger manual metrics collection
 */
export const triggerMetricsCollectionManual = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organization!.id;
    const { websiteId, platform } = req.body;

    const job = await triggerMetricsCollection({
      organizationId,
      websiteId,
      platform
    });

    logger.info(`Manual metrics collection triggered by user ${req.user?.id}:`, { jobId: job.id, organizationId, websiteId });

    res.json({
      success: true,
      message: 'Metrics collection triggered successfully',
      data: {
        jobId: job.id,
        status: 'queued'
      }
    });
  } catch (error) {
    logger.error('Trigger metrics collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger metrics collection',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get alert dashboard summary
 */
export const getAlertDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organization!.id;
    const alertService = new AlertService({ organizationId });

    const { websiteId } = req.query;

    const summary = await alertService.getMetricsSummary(websiteId as string);

    // Get recent alert history for dashboard
    const recentHistory = await alertService.getAlertHistory({
      page: 1,
      limit: 5
    });

    res.json({
      success: true,
      data: {
        summary,
        recentHistory: recentHistory.history
      }
    });
  } catch (error) {
    logger.error('Get alert dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve alert dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get metrics snapshots for charts
 */
export const getMetricsSnapshots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organization!.id;
    const {
      websiteId,
      metricType,
      platform = 'all',
      timeWindow = '1d',
      days = 7
    } = req.query;

    if (!websiteId || !metricType) {
      res.status(400).json({
        success: false,
        message: 'websiteId and metricType are required'
      });
      return;
    }

    const snapshots = await MetricsSnapshot.findAll({
      where: {
        organizationId,
        websiteId: websiteId as string,
        metricType: metricType as string,
        platform: platform as string,
        timeWindow: timeWindow as string
      },
      order: [['snapshotAt', 'ASC']],
      limit: parseInt(days as string) * 24 // Hourly snapshots for requested days
    });

    res.json({
      success: true,
      data: snapshots
    });
  } catch (error) {
    logger.error('Get metrics snapshots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics snapshots',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Resend failed notifications
 */
export const resendNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.organization!.id;

    const alertHistory = await AlertHistory.findOne({
      where: { id, organizationId }
    });

    if (!alertHistory) {
      res.status(404).json({
        success: false,
        message: 'Alert history not found'
      });
      return;
    }

    if (!alertHistory.shouldRetryNotification()) {
      res.status(400).json({
        success: false,
        message: 'Notification cannot be retried at this time'
      });
      return;
    }

    // Queue the notification again
    await notificationService.queueNotification({
      alertHistoryId: alertHistory.id,
      organizationId,
      channels: alertHistory.notificationChannels || ['email'],
      templateData: alertHistory.triggerData
    });

    logger.info(`Notification resend triggered by user ${req.user?.id}:`, { alertHistoryId: id });

    res.json({
      success: true,
      message: 'Notification queued for resending'
    });
  } catch (error) {
    logger.error('Resend notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};