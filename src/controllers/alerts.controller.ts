import { Request, Response } from 'express';
import { AlertService } from '../services/alertService';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import { ALERT_TYPES, NOTIFICATION_CHANNELS } from '../models/AlertConfiguration';
import { METRIC_TYPES, PLATFORMS, TIME_WINDOWS } from '../models/MetricsSnapshot';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

// Type definitions for dynamic alert configuration response
interface AlertTypeConfig {
  type: string;
  name: string;
  description: string;
}

interface MetricTypeConfig {
  metric: string;
  name: string;
  description: string;
}

interface TimeWindowConfig {
  value: string;
  name: string;
  description?: string;
}

interface OperatorConfig {
  value: string;
  name: string;
  description?: string;
}

interface NotificationChannelConfig {
  channel: string;
  name: string;
  description: string;
}

interface PlatformConfig {
  platform: string;
  name: string;
  description: string;
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
   * GET /api/v1/alerts/types - Get available alert types and metrics (dynamic configuration)
   */
  public getAlertTypes = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Get organization ID for potential future filtering
      const organizationId = req.organization?.id;

      // Generate dynamic alert types from model enum
      const alertTypes: AlertTypeConfig[] = this.generateAlertTypeConfigurations();

      // Generate dynamic metric types from model enum
      const metricTypes: MetricTypeConfig[] = this.generateMetricTypeConfigurations();

      // Generate dynamic time windows from model enum
      const timeWindows: TimeWindowConfig[] = this.generateTimeWindowConfigurations();

      // Generate dynamic operators (based on AlertCondition interface)
      const operators: OperatorConfig[] = this.generateOperatorConfigurations();

      // Generate notification channels from model enum
      const notificationChannels: NotificationChannelConfig[] = this.generateNotificationChannelConfigurations();

      // Generate platform configurations from model enum
      const platforms: PlatformConfig[] = this.generatePlatformConfigurations();

      res.json({
        success: true,
        data: {
          alertTypes,
          metricTypes,
          timeWindows,
          operators,
          notificationChannels,
          platforms
        }
      });
    } catch (error) {
      throw new AppError('Failed to retrieve alert configuration types', 500);
    }
  });

  /**
   * Generate alert type configurations from ALERT_TYPES enum
   */
  private generateAlertTypeConfigurations(): AlertTypeConfig[] {
    const alertTypeDescriptions: Record<string, { name: string; description: string }> = {
      [ALERT_TYPES.MENTION_SPIKE]: {
        name: 'Mention Spike',
        description: 'Triggered when AI platform mentions increase significantly above normal levels'
      },
      [ALERT_TYPES.VISIBILITY_DROP]: {
        name: 'Visibility Drop',
        description: 'Triggered when visibility across AI platforms decreases below specified threshold'
      },
      [ALERT_TYPES.COMPETITOR_OUTRANK]: {
        name: 'Competitor Outrank',
        description: 'Triggered when competitors achieve higher ranking or visibility than your content'
      },
      [ALERT_TYPES.SCORE_CHANGE]: {
        name: 'Score Change',
        description: 'Triggered when GEO score changes significantly from previous measurements'
      },
      [ALERT_TYPES.NEW_MENTION]: {
        name: 'New Mention',
        description: 'Triggered when your brand/website receives new mentions on AI platforms'
      },
      [ALERT_TYPES.SENTIMENT_CHANGE]: {
        name: 'Sentiment Change',
        description: 'Triggered when sentiment score of mentions changes beyond specified thresholds'
      }
    };

    return Object.values(ALERT_TYPES).map((type) => ({
      type,
      name: alertTypeDescriptions[type]?.name || this.formatEnumValueToTitle(type),
      description: alertTypeDescriptions[type]?.description || `Alert triggered for ${this.formatEnumValueToTitle(type)} events`
    }));
  }

  /**
   * Generate metric type configurations from METRIC_TYPES enum
   */
  private generateMetricTypeConfigurations(): MetricTypeConfig[] {
    const metricTypeDescriptions: Record<string, { name: string; description: string }> = {
      [METRIC_TYPES.MENTION_COUNT]: {
        name: 'Mention Count',
        description: 'Total number of mentions across AI platforms within the specified time window'
      },
      [METRIC_TYPES.SENTIMENT_SCORE]: {
        name: 'Sentiment Score',
        description: 'Average sentiment score of mentions, ranging from negative to positive values'
      },
      [METRIC_TYPES.VISIBILITY_PERCENTAGE]: {
        name: 'Visibility Percentage',
        description: 'Percentage of queries where your content appears in AI platform responses'
      },
      [METRIC_TYPES.GEO_SCORE]: {
        name: 'GEO Score',
        description: 'Overall Generative Engine Optimization score based on multiple visibility factors'
      },
      [METRIC_TYPES.COMPETITOR_RANK]: {
        name: 'Competitor Rank',
        description: 'Your ranking position relative to competitors in AI platform responses'
      }
    };

    return Object.values(METRIC_TYPES).map((metric) => ({
      metric,
      name: metricTypeDescriptions[metric]?.name || this.formatEnumValueToTitle(metric),
      description: metricTypeDescriptions[metric]?.description || `Metric tracking ${this.formatEnumValueToTitle(metric)}`
    }));
  }

  /**
   * Generate time window configurations from TIME_WINDOWS enum
   */
  private generateTimeWindowConfigurations(): TimeWindowConfig[] {
    const timeWindowDescriptions: Record<string, { name: string; description: string }> = {
      [TIME_WINDOWS.ONE_HOUR]: {
        name: '1 Hour',
        description: 'Metrics calculated over the last 1 hour period'
      },
      [TIME_WINDOWS.ONE_DAY]: {
        name: '1 Day',
        description: 'Metrics calculated over the last 24 hour period'
      },
      [TIME_WINDOWS.SEVEN_DAYS]: {
        name: '7 Days',
        description: 'Metrics calculated over the last 7 day period'
      },
      [TIME_WINDOWS.THIRTY_DAYS]: {
        name: '30 Days',
        description: 'Metrics calculated over the last 30 day period'
      }
    };

    return Object.values(TIME_WINDOWS).map((value) => ({
      value,
      name: timeWindowDescriptions[value]?.name || value.toUpperCase(),
      description: timeWindowDescriptions[value]?.description || `Time window of ${value}`
    }));
  }

  /**
   * Generate operator configurations (based on AlertCondition interface)
   */
  private generateOperatorConfigurations(): OperatorConfig[] {
    const operators = [
      {
        value: 'greater_than',
        name: 'Greater Than',
        description: 'Trigger when metric value is greater than the specified threshold'
      },
      {
        value: 'less_than',
        name: 'Less Than',
        description: 'Trigger when metric value is less than the specified threshold'
      },
      {
        value: 'equals',
        name: 'Equals',
        description: 'Trigger when metric value equals the specified value (with small tolerance)'
      },
      {
        value: 'percentage_change',
        name: 'Percentage Change',
        description: 'Trigger when metric changes by the specified percentage from previous value'
      }
    ];

    return operators;
  }

  /**
   * Generate notification channel configurations from NOTIFICATION_CHANNELS enum
   */
  private generateNotificationChannelConfigurations(): NotificationChannelConfig[] {
    const channelDescriptions: Record<string, { name: string; description: string }> = {
      [NOTIFICATION_CHANNELS.EMAIL]: {
        name: 'Email',
        description: 'Send alert notifications via email to configured recipients'
      },
      [NOTIFICATION_CHANNELS.SLACK]: {
        name: 'Slack',
        description: 'Send alert notifications to specified Slack channels or users'
      },
      [NOTIFICATION_CHANNELS.WEBHOOK]: {
        name: 'Webhook',
        description: 'Send alert data to external webhook URLs for custom integrations'
      },
      [NOTIFICATION_CHANNELS.IN_APP]: {
        name: 'In-App',
        description: 'Display alert notifications within the application interface'
      }
    };

    return Object.values(NOTIFICATION_CHANNELS).map((channel) => ({
      channel,
      name: channelDescriptions[channel]?.name || this.formatEnumValueToTitle(channel),
      description: channelDescriptions[channel]?.description || `Notification via ${this.formatEnumValueToTitle(channel)}`
    }));
  }

  /**
   * Generate platform configurations from PLATFORMS enum
   */
  private generatePlatformConfigurations(): PlatformConfig[] {
    const platformDescriptions: Record<string, { name: string; description: string }> = {
      [PLATFORMS.CHATGPT]: {
        name: 'ChatGPT',
        description: 'OpenAI ChatGPT platform monitoring and tracking'
      },
      [PLATFORMS.GEMINI]: {
        name: 'Gemini',
        description: 'Google Gemini (formerly Bard) platform monitoring and tracking'
      },
      [PLATFORMS.PERPLEXITY]: {
        name: 'Perplexity',
        description: 'Perplexity AI platform monitoring and tracking'
      },
      [PLATFORMS.CLAUDE]: {
        name: 'Claude',
        description: 'Anthropic Claude platform monitoring and tracking'
      },
      [PLATFORMS.ALL]: {
        name: 'All Platforms',
        description: 'Aggregate metrics across all monitored AI platforms'
      }
    };

    return Object.values(PLATFORMS).map((platform) => ({
      platform,
      name: platformDescriptions[platform]?.name || this.formatEnumValueToTitle(platform),
      description: platformDescriptions[platform]?.description || `${this.formatEnumValueToTitle(platform)} platform`
    }));
  }

  /**
   * Utility method to format enum values into human-readable titles
   */
  private formatEnumValueToTitle(enumValue: string): string {
    return enumValue
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}