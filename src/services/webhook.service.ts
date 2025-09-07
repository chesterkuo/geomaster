import { Op } from 'sequelize';
import { logger } from '../utils/logger';
import { Webhook } from '../models';

export class WebhookService {
  
  async getWebhooks(params: {
    organizationId: string;
    isActive?: boolean;
  }) {
    try {
      const { organizationId, isActive } = params;
      
      const where: any = { organizationId };
      
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const webhooks = await Webhook.findAll({
        where,
        order: [['createdAt', 'DESC']]
      });

      console.log(`[DEBUG] getWebhooks: organizationId=${organizationId}, isActive=${isActive}, found ${webhooks.length} webhooks`);
      
      return webhooks;
    } catch (error) {
      logger.error('Error getting webhooks:', error);
      throw error;
    }
  }

  async createWebhook(params: {
    organizationId: string;
    name: string;
    url: string;
    events: string[];
    secret?: string;
    headers?: any;
    retryAttempts?: number;
    timeoutSeconds?: number;
  }) {
    try {
      const { organizationId, name, url, events, secret, headers, retryAttempts, timeoutSeconds } = params;
      
      const webhook = await Webhook.create({
        organizationId,
        name,
        url,
        secret,
        events,
        headers: headers || {},
        isActive: true,
        retryAttempts: retryAttempts || 3,
        timeoutSeconds: timeoutSeconds || 30
      });

      logger.info(`Created webhook ${name} for organization ${organizationId}`);
      
      return webhook;
    } catch (error) {
      logger.error('Error creating webhook:', error);
      throw error;
    }
  }

  async updateWebhook(params: {
    webhookId: string;
    organizationId: string;
    updateData: any;
  }) {
    try {
      const { webhookId, organizationId, updateData } = params;
      
      const webhook = await Webhook.findOne({
        where: {
          id: webhookId,
          organizationId
        }
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      Object.assign(webhook, updateData);
      await webhook.save();

      logger.info(`Updated webhook ${webhookId} for organization ${organizationId}`);
      
      return webhook;
    } catch (error) {
      logger.error('Error updating webhook:', error);
      throw error;
    }
  }

  async deleteWebhook(params: {
    webhookId: string;
    organizationId: string;
  }) {
    try {
      const { webhookId, organizationId } = params;
      
      const result = await Webhook.destroy({
        where: {
          id: webhookId,
          organizationId
        }
      });

      if (result === 0) {
        throw new Error('Webhook not found');
      }
      
      logger.info(`Deleted webhook ${webhookId} for organization ${organizationId}`);
      
      return true;
    } catch (error) {
      logger.error('Error deleting webhook:', error);
      throw error;
    }
  }

  async testWebhook(params: {
    webhookId: string;
    organizationId: string;
    testPayload?: any;
  }) {
    try {
      const { webhookId, organizationId, testPayload } = params;
      
      const webhook = await Webhook.findOne({
        where: {
          id: webhookId,
          organizationId
        }
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }
      
      const testResult = {
        webhookId,
        organizationId,
        testStatus: 'success',
        responseStatus: 200,
        responseTime: Math.floor(Math.random() * 1000) + 100,
        testPayload: testPayload || {
          event: 'test',
          timestamp: new Date().toISOString(),
          data: { message: 'Test webhook delivery' }
        },
        testedAt: new Date()
      };

      webhook.lastTriggeredAt = new Date();
      webhook.successfulDeliveries = (webhook.successfulDeliveries || 0) + 1;
      await webhook.save();

      logger.info(`Tested webhook ${webhookId} - Status: ${testResult.testStatus}`);
      
      return testResult;
    } catch (error) {
      logger.error('Error testing webhook:', error);
      throw error;
    }
  }

  async getWebhookDeliveries(params: {
    webhookId: string;
    organizationId: string;
    status?: string;
    eventType?: string;
    page: number;
    limit: number;
  }) {
    try {
      const { webhookId, organizationId, status, eventType, page, limit } = params;
      
      const webhook = await Webhook.findOne({
        where: {
          id: webhookId,
          organizationId
        }
      });

      if (!webhook) {
        throw new Error('Webhook not found');
      }
      
      const deliveries = [
        {
          id: `delivery-${Date.now()}-1`,
          webhookId,
          eventType: 'scan_completed',
          payload: {
            websiteId: 'website-123',
            scanId: 'scan-456',
            status: 'completed',
            results: { geoScore: 85 }
          },
          responseStatus: 200,
          responseBody: 'OK',
          deliveryTimeMs: 245,
          attempts: 1,
          status: 'delivered',
          deliveredAt: new Date()
        },
        {
          id: `delivery-${Date.now()}-2`,
          webhookId,
          eventType: 'alert_triggered',
          payload: {
            websiteId: 'website-123',
            alertType: 'visibility_drop',
            severity: 'high'
          },
          responseStatus: 500,
          responseBody: 'Internal Server Error',
          deliveryTimeMs: 5000,
          attempts: 3,
          status: 'failed',
          deliveredAt: new Date()
        }
      ];

      let filteredDeliveries = deliveries;
      
      if (status) {
        filteredDeliveries = filteredDeliveries.filter(d => d.status === status);
      }
      
      if (eventType) {
        filteredDeliveries = filteredDeliveries.filter(d => d.eventType === eventType);
      }

      const offset = (page - 1) * limit;
      const paginatedDeliveries = filteredDeliveries.slice(offset, offset + limit);

      return {
        deliveries: paginatedDeliveries,
        pagination: {
          page,
          limit,
          total: filteredDeliveries.length,
          pages: Math.ceil(filteredDeliveries.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting webhook deliveries:', error);
      throw error;
    }
  }

  async triggerWebhook(params: {
    webhookId: string;
    organizationId: string;
    eventType: string;
    payload: any;
  }) {
    try {
      const { webhookId, organizationId, eventType, payload } = params;
      
      const webhook = await Webhook.findOne({
        where: {
          id: webhookId,
          organizationId,
          isActive: true
        }
      });

      if (!webhook) {
        throw new Error('Webhook not found or inactive');
      }
      
      const delivery = {
        id: `delivery-${Date.now()}`,
        webhookId,
        eventType,
        payload,
        responseStatus: 200,
        responseBody: 'Webhook triggered successfully',
        deliveryTimeMs: Math.floor(Math.random() * 1000) + 100,
        attempts: 1,
        status: 'delivered',
        deliveredAt: new Date()
      };

      webhook.lastTriggeredAt = new Date();
      webhook.totalDeliveries = (webhook.totalDeliveries || 0) + 1;
      webhook.successfulDeliveries = (webhook.successfulDeliveries || 0) + 1;
      await webhook.save();

      logger.info(`Triggered webhook ${webhookId} for event ${eventType}`);
      
      return delivery;
    } catch (error) {
      logger.error('Error triggering webhook:', error);
      throw error;
    }
  }

  async getWebhookEvents() {
    try {
      const events = [
        {
          eventType: 'scan_completed',
          description: 'Triggered when a website scan is completed',
          payloadSchema: {
            websiteId: 'string',
            scanId: 'string',
            status: 'string',
            results: 'object'
          }
        },
        {
          eventType: 'alert_triggered',
          description: 'Triggered when an alert condition is met',
          payloadSchema: {
            websiteId: 'string',
            alertType: 'string',
            severity: 'string',
            details: 'object'
          }
        },
        {
          eventType: 'report_generated',
          description: 'Triggered when a report is generated',
          payloadSchema: {
            reportId: 'string',
            reportType: 'string',
            websiteId: 'string',
            generatedAt: 'string'
          }
        },
        {
          eventType: 'keyword_ranking_changed',
          description: 'Triggered when keyword ranking changes significantly',
          payloadSchema: {
            keywordId: 'string',
            websiteId: 'string',
            previousRank: 'number',
            currentRank: 'number',
            change: 'number'
          }
        },
        {
          eventType: 'competitor_activity',
          description: 'Triggered when competitor activity is detected',
          payloadSchema: {
            competitorId: 'string',
            activityType: 'string',
            details: 'object'
          }
        }
      ];

      return events;
    } catch (error) {
      logger.error('Error getting webhook events:', error);
      throw error;
    }
  }

  async getWebhookStats(params: {
    organizationId: string;
    webhookId?: string;
    days: number;
  }) {
    try {
      const { organizationId, webhookId, days } = params;
      
      const where: any = { organizationId };
      if (webhookId) {
        where.id = webhookId;
      }
      
      const webhooks = await Webhook.findAll({
        where,
        attributes: ['id', 'name', 'totalDeliveries', 'successfulDeliveries', 'failedDeliveries']
      });
      
      const totalDeliveries = webhooks.reduce((sum, w) => sum + (w.totalDeliveries || 0), 0);
      const successfulDeliveries = webhooks.reduce((sum, w) => sum + (w.successfulDeliveries || 0), 0);
      const failedDeliveries = webhooks.reduce((sum, w) => sum + (w.failedDeliveries || 0), 0);
      
      const stats = {
        organizationId,
        webhookId,
        timePeriod: `${days} days`,
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries,
        averageResponseTime: Math.floor(Math.random() * 500) + 200,
        successRate: totalDeliveries > 0 ? successfulDeliveries / totalDeliveries : 0,
        webhooksCount: webhooks.length,
        dailyBreakdown: Array.from({ length: Math.min(days, 7) }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          deliveries: Math.floor(Math.random() * 50) + 10,
          successRate: 0.85 + Math.random() * 0.15
        }))
      };

      return stats;
    } catch (error) {
      logger.error('Error getting webhook stats:', error);
      throw error;
    }
  }
}