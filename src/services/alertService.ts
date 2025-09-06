import { Op } from 'sequelize';
import sequelize from '../config/database';
import AlertConfiguration, { ALERT_TYPES, AlertCondition } from '../models/AlertConfiguration';
import AlertHistory, { NOTIFICATION_STATUS, TriggerData } from '../models/AlertHistory';
import MetricsSnapshot, { METRIC_TYPES, PLATFORMS, TIME_WINDOWS } from '../models/MetricsSnapshot';
import AITrackingResult from '../models/AITrackingResult';
import { Website, Organization } from '../models';
import { logger } from '../utils/logger';

export interface AlertServiceConfig {
  organizationId: string;
}

export class AlertService {
  private organizationId: string;

  constructor(config: AlertServiceConfig) {
    this.organizationId = config.organizationId;
  }

  /**
   * Create a new alert configuration
   */
  async createAlert(data: {
    websiteId?: string;
    name: string;
    description?: string;
    alertType: string;
    conditions: AlertCondition[];
    notificationChannels?: string[];
    cooldownMinutes?: number;
  }): Promise<AlertConfiguration> {
    const alert = await AlertConfiguration.create({
      organizationId: this.organizationId,
      ...data,
      alertType: data.alertType as typeof import('../models/AlertConfiguration').ALERT_TYPES[keyof typeof import('../models/AlertConfiguration').ALERT_TYPES],
      isActive: true
    });

    logger.info(`Alert configuration created: ${alert.id} for organization: ${this.organizationId}`);
    return alert;
  }

  /**
   * Get all alert configurations for the organization
   */
  async getAlerts(options: {
    websiteId?: string;
    alertType?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    alerts: AlertConfiguration[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { websiteId, alertType, isActive, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const where: any = { organizationId: this.organizationId };
    
    if (websiteId) where.websiteId = websiteId;
    if (alertType) where.alertType = alertType;
    if (isActive !== undefined) where.isActive = isActive;

    const { rows: alerts, count: total } = await AlertConfiguration.findAndCountAll({
      where,
      include: [
        {
          model: Website,
          as: 'website',
          attributes: ['id', 'name', 'url', 'domain']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    return { alerts, total, page, limit };
  }

  /**
   * Update alert configuration
   */
  async updateAlert(alertId: string, data: Partial<{
    name: string;
    description: string;
    conditions: AlertCondition[];
    notificationChannels: string[];
    isActive: boolean;
    cooldownMinutes: number;
  }>): Promise<AlertConfiguration | null> {
    const alert = await AlertConfiguration.findOne({
      where: { id: alertId, organizationId: this.organizationId }
    });

    if (!alert) {
      throw new Error('Alert configuration not found');
    }

    await alert.update(data);
    logger.info(`Alert configuration updated: ${alertId}`);
    
    return alert;
  }

  /**
   * Delete alert configuration
   */
  async deleteAlert(alertId: string): Promise<boolean> {
    const deleted = await AlertConfiguration.destroy({
      where: { id: alertId, organizationId: this.organizationId }
    });

    if (deleted > 0) {
      logger.info(`Alert configuration deleted: ${alertId}`);
      return true;
    }

    return false;
  }

  /**
   * Get alert history
   */
  async getAlertHistory(options: {
    alertConfigId?: string;
    websiteId?: string;
    alertType?: string;
    notificationStatus?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    history: AlertHistory[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { alertConfigId, websiteId, alertType, notificationStatus, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const where: any = { organizationId: this.organizationId };
    
    if (alertConfigId) where.alertConfigId = alertConfigId;
    if (websiteId) where.websiteId = websiteId;
    if (alertType) where.alertType = alertType;
    if (notificationStatus) where.notificationStatus = notificationStatus;

    const { rows: history, count: total } = await AlertHistory.findAndCountAll({
      where,
      include: [
        {
          model: AlertConfiguration,
          as: 'alertConfiguration',
          attributes: ['id', 'name', 'alertType']
        },
        {
          model: Website,
          as: 'website',
          attributes: ['id', 'name', 'url', 'domain']
        }
      ],
      order: [['triggeredAt', 'DESC']],
      offset,
      limit
    });

    return { history, total, page, limit };
  }

  /**
   * Check alerts for a specific website
   */
  async checkAlertsForWebsite(websiteId: string): Promise<AlertHistory[]> {
    const triggeredAlerts: AlertHistory[] = [];

    // Get active alert configurations for the website
    const [websiteAlerts, orgAlerts] = await Promise.all([
      AlertConfiguration.findAll({
        where: {
          organizationId: this.organizationId,
          websiteId: websiteId,
          isActive: true
        }
      }),
      AlertConfiguration.findAll({
        where: {
          organizationId: this.organizationId,
          isActive: true,
          [Op.and]: [
            sequelize.where(
              sequelize.col('websiteId'),
              'IS',
              null
            )
          ]
        }
      })
    ]);

    const alerts = [...websiteAlerts, ...orgAlerts];

    for (const alert of alerts) {
      if (!alert.canTrigger()) {
        continue;
      }

      const shouldTrigger = await this.evaluateAlertConditions(alert, websiteId);
      
      if (shouldTrigger) {
        const triggerData = await this.buildTriggerData(alert, websiteId);
        
        const alertHistory = await AlertHistory.create({
          alertConfigId: alert.id,
          organizationId: this.organizationId,
          websiteId: websiteId,
          alertType: alert.alertType,
          triggerData,
          notificationChannels: alert.getNotificationChannels()
        });

        await alert.markTriggered();
        triggeredAlerts.push(alertHistory);

        logger.info(`Alert triggered: ${alert.name} (${alert.id}) for website: ${websiteId}`);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Evaluate if alert conditions are met
   */
  private async evaluateAlertConditions(alert: AlertConfiguration, websiteId: string): Promise<boolean> {
    const conditions = alert.conditions;
    
    // All conditions must be met (AND logic)
    for (const condition of conditions) {
      const met = await this.evaluateCondition(condition, websiteId, alert.alertType);
      if (!met) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: AlertCondition, 
    websiteId: string, 
    alertType: string
  ): Promise<boolean> {
    const latestSnapshot = await MetricsSnapshot.getLatestSnapshot(
      this.organizationId,
      websiteId,
      condition.metric,
      PLATFORMS.ALL,
      condition.timeframe
    );

    if (!latestSnapshot) {
      return false;
    }

    const currentValue = latestSnapshot.metricValue;
    const previousValue = latestSnapshot.previousValue;

    switch (condition.operator) {
      case 'greater_than':
        return currentValue > condition.value;
        
      case 'less_than':
        return currentValue < condition.value;
        
      case 'equals':
        return Math.abs(currentValue - condition.value) < 0.01;
        
      case 'percentage_change':
        if (previousValue === undefined) return false;
        const changePercentage = latestSnapshot.changePercentage || 0;
        return Math.abs(changePercentage) >= condition.value;
        
      default:
        return false;
    }
  }

  /**
   * Build trigger data for alert history
   */
  private async buildTriggerData(alert: AlertConfiguration, websiteId: string): Promise<TriggerData> {
    const condition = alert.conditions[0]; // Use first condition for trigger data
    
    const latestSnapshot = await MetricsSnapshot.getLatestSnapshot(
      this.organizationId,
      websiteId,
      condition.metric,
      PLATFORMS.ALL,
      condition.timeframe
    );

    const triggerData: TriggerData = {
      metric: condition.metric,
      currentValue: latestSnapshot?.metricValue || 0,
      previousValue: latestSnapshot?.previousValue,
      threshold: condition.value,
      changePercentage: latestSnapshot?.changePercentage
    };

    // Add specific data based on alert type
    if (alert.alertType === ALERT_TYPES.NEW_MENTION) {
      // Get latest AI tracking result for context
      const latestResult = await AITrackingResult.findOne({
        where: { websiteId },
        order: [['trackedAt', 'DESC']]
      });

      if (latestResult) {
        triggerData.platform = latestResult.platform;
        triggerData.query = latestResult.query;
        triggerData.snippet = latestResult.snippet;
        triggerData.mentionContext = latestResult.fullResponse?.substring(0, 200);
      }
    }

    return triggerData;
  }

  /**
   * Create metrics snapshot for tracking
   */
  async createMetricsSnapshot(data: {
    websiteId: string;
    metricType: string;
    platform?: string;
    timeWindow: string;
    metricValue: number;
  }): Promise<MetricsSnapshot> {
    return await MetricsSnapshot.createSnapshot({
      organizationId: this.organizationId,
      ...data
    });
  }

  /**
   * Get metrics for dashboard
   */
  async getMetricsSummary(websiteId?: string): Promise<{
    totalAlerts: number;
    activeAlerts: number;
    recentTriggers: number;
    failedNotifications: number;
  }> {
    const whereClause: any = { organizationId: this.organizationId };
    if (websiteId) whereClause.websiteId = websiteId;

    const [totalAlerts, activeAlerts, recentTriggers, failedNotifications] = await Promise.all([
      AlertConfiguration.count({ where: whereClause }),
      AlertConfiguration.count({ where: { ...whereClause, isActive: true } }),
      AlertHistory.count({
        where: {
          ...whereClause,
          triggeredAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      AlertHistory.count({
        where: {
          ...whereClause,
          notificationStatus: NOTIFICATION_STATUS.FAILED
        }
      })
    ]);

    return {
      totalAlerts,
      activeAlerts,
      recentTriggers,
      failedNotifications
    };
  }

  /**
   * Test alert configuration (dry run)
   */
  async testAlert(alertId: string): Promise<{
    canTrigger: boolean;
    wouldTrigger: boolean;
    conditionResults: Array<{
      condition: AlertCondition;
      met: boolean;
      currentValue?: number;
      reason?: string;
    }>;
  }> {
    const alert = await AlertConfiguration.findOne({
      where: { id: alertId, organizationId: this.organizationId }
    });

    if (!alert) {
      throw new Error('Alert configuration not found');
    }

    const canTrigger = alert.canTrigger();
    const conditionResults = [];

    let wouldTrigger = canTrigger;

    for (const condition of alert.conditions) {
      const websiteId = alert.websiteId;
      if (!websiteId) {
        conditionResults.push({
          condition,
          met: false,
          reason: 'No website specified for condition evaluation'
        });
        wouldTrigger = false;
        continue;
      }

      const latestSnapshot = await MetricsSnapshot.getLatestSnapshot(
        this.organizationId,
        websiteId,
        condition.metric,
        PLATFORMS.ALL,
        condition.timeframe
      );

      if (!latestSnapshot) {
        conditionResults.push({
          condition,
          met: false,
          reason: 'No metrics data available'
        });
        wouldTrigger = false;
        continue;
      }

      const met = await this.evaluateCondition(condition, websiteId, alert.alertType);
      conditionResults.push({
        condition,
        met,
        currentValue: latestSnapshot.metricValue
      });

      if (!met) {
        wouldTrigger = false;
      }
    }

    return {
      canTrigger,
      wouldTrigger,
      conditionResults
    };
  }
}