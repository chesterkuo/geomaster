import { notificationQueue } from './alertQueue';
import AlertHistory, { NOTIFICATION_STATUS } from '../models/AlertHistory';
import AlertConfiguration from '../models/AlertConfiguration';
import { Website, Organization, User } from '../models';
import { getWebSocketService, AlertNotificationEvent } from './websocketService';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { logger } from '../utils/logger';

// Notification template interface
interface NotificationTemplate {
  subject?: string;
  body: string;
  html?: string;
}

// Webhook payload interface
interface WebhookPayload {
  alertId: string;
  alertType: string;
  websiteName: string;
  triggerData: any;
  timestamp: string;
  organizationId: string;
}

export class NotificationService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.setupEmailTransporter();
    this.setupNotificationProcessor();
  }

  /**
   * Setup email transporter using environment variables
   */
  private setupEmailTransporter(): void {
    if (process.env.SENDGRID_API_KEY) {
      // SendGrid configuration
      this.transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    } else if (process.env.SMTP_HOST) {
      // Generic SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      logger.warn('No email configuration found. Email notifications will be disabled.');
    }
  }

  /**
   * Setup the notification queue processor
   */
  private setupNotificationProcessor(): void {
    notificationQueue.process('send-notification', async (job) => {
      const { alertHistoryId, organizationId, channels, templateData } = job.data;
      
      try {
        const alertHistory = await AlertHistory.findByPk(alertHistoryId, {
          include: [
            {
              model: AlertConfiguration,
              as: 'alertConfiguration'
            },
            {
              model: Website,
              as: 'website'
            }
          ]
        });

        if (!alertHistory) {
          throw new Error(`Alert history not found: ${alertHistoryId}`);
        }

        const results = await Promise.allSettled(
          channels.map((channel: string) => this.sendNotification(channel, alertHistory, templateData))
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failureCount = results.length - successCount;

        if (failureCount === 0) {
          await alertHistory.markSent();
          logger.info(`All notifications sent successfully for alert: ${alertHistoryId}`);
        } else {
          const failedReasons = results
            .filter(r => r.status === 'rejected')
            .map(r => (r as PromiseRejectedResult).reason)
            .join('; ');
          
          await alertHistory.markFailed(`${failureCount}/${results.length} notifications failed: ${failedReasons}`);
          logger.error(`Some notifications failed for alert: ${alertHistoryId}`, { failedReasons });
        }

        return { successCount, failureCount };

      } catch (error) {
        logger.error(`Notification job failed for alert: ${alertHistoryId}`, error);
        
        // Try to mark as failed in database
        try {
          const alertHistory = await AlertHistory.findByPk(alertHistoryId);
          if (alertHistory) {
            await alertHistory.markFailed(error instanceof Error ? error.message : 'Unknown error');
          }
        } catch (dbError) {
          logger.error('Failed to update alert history status:', dbError);
        }

        throw error;
      }
    });
  }

  /**
   * Send notification via specified channel
   */
  private async sendNotification(
    channel: string, 
    alertHistory: AlertHistory, 
    templateData: any
  ): Promise<void> {
    switch (channel.toLowerCase()) {
      case 'email':
        return await this.sendEmailNotification(alertHistory, templateData);
      case 'slack':
        return await this.sendSlackNotification(alertHistory, templateData);
      case 'webhook':
        return await this.sendWebhookNotification(alertHistory, templateData);
      case 'in_app':
        return await this.createInAppNotification(alertHistory, templateData);
      case 'websocket':
        return await this.sendWebSocketNotification(alertHistory, templateData);
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  /**
   * Send WebSocket real-time notification
   */
  private async sendWebSocketNotification(alertHistory: AlertHistory, templateData: any): Promise<void> {
    const websocketService = getWebSocketService();
    
    if (!websocketService) {
      logger.warn(`WebSocket service not available for alert: ${alertHistory.id}`);
      return;
    }

    // Get website name for the notification
    const websiteName = templateData.website_name || 'Unknown Website';
    
    // Create alert notification event
    const alertEvent: AlertNotificationEvent = {
      type: 'alert_triggered',
      data: {
        alertId: alertHistory.id,
        alertType: alertHistory.alertType,
        websiteName,
        message: this.getNotificationMessage(alertHistory.alertType, templateData),
        timestamp: new Date().toISOString(),
        severity: this.getAlertSeverity(alertHistory.alertType),
        triggerData: templateData
      }
    };

    // Broadcast to organization members
    websocketService.broadcastAlertToOrganization(alertHistory.organizationId, alertEvent);
    
    logger.info(`WebSocket notification sent for alert: ${alertHistory.id} to organization: ${alertHistory.organizationId}`);
  }

  /**
   * Get alert severity level
   */
  private getAlertSeverity(alertType: string): 'info' | 'warning' | 'error' | 'success' {
    switch (alertType) {
      case 'mention_spike':
      case 'new_mention':
        return 'success';
      case 'visibility_drop':
      case 'competitor_outrank':
        return 'warning';
      case 'score_change':
      case 'sentiment_change':
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alertHistory: AlertHistory, templateData: any): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not configured');
    }

    const organization = await Organization.findByPk(alertHistory.organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get organization users with email notification enabled
    const users = await User.findAll({
      include: [{
        model: Organization,
        as: 'organizations',
        where: { id: alertHistory.organizationId },
        through: { attributes: [] }
      }]
    });

    const template = this.getEmailTemplate(alertHistory.alertType, templateData);
    const websiteName = (alertHistory as any).website?.name || 'Unknown Website';

    const emailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@geoplatform.com',
      subject: template.subject?.replace('{{website_name}}', websiteName) || `Alert: ${alertHistory.alertType}`,
      text: this.populateTemplate(template.body, {
        ...templateData,
        website_name: websiteName,
        organization_name: organization.name,
        dashboard_url: `${process.env.FRONTEND_URL}/alerts`
      }),
      html: template.html ? this.populateTemplate(template.html, {
        ...templateData,
        website_name: websiteName,
        organization_name: organization.name,
        dashboard_url: `${process.env.FRONTEND_URL}/alerts`
      }) : undefined
    };

    // Send to all organization users
    const emailPromises = users.map(user => 
      this.transporter!.sendMail({
        ...emailOptions,
        to: user.email
      })
    );

    await Promise.all(emailPromises);
    logger.info(`Email notifications sent for alert: ${alertHistory.id} to ${users.length} recipients`);
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alertHistory: AlertHistory, templateData: any): Promise<void> {
    // This would require Slack webhook URL from organization settings
    // For now, we'll just log that Slack notifications would be sent
    logger.info(`Slack notification would be sent for alert: ${alertHistory.id}`);
    
    // TODO: Implement actual Slack webhook integration
    // const slackWebhookUrl = await this.getSlackWebhookUrl(alertHistory.organizationId);
    // if (slackWebhookUrl) {
    //   const slackMessage = this.getSlackTemplate(alertHistory.alertType, templateData);
    //   await axios.post(slackWebhookUrl, slackMessage);
    // }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alertHistory: AlertHistory, templateData: any): Promise<void> {
    // Get webhook endpoints for the organization
    // This would require webhook endpoints table implementation
    logger.info(`Webhook notification would be sent for alert: ${alertHistory.id}`);

    // TODO: Implement webhook endpoints lookup and sending
    // const webhooks = await WebhookEndpoint.findAll({
    //   where: { organizationId: alertHistory.organizationId, isActive: true }
    // });
    //
    // const payload: WebhookPayload = {
    //   alertId: alertHistory.id,
    //   alertType: alertHistory.alertType,
    //   websiteName: (alertHistory as any).website?.name || 'Unknown',
    //   triggerData: templateData,
    //   timestamp: new Date().toISOString(),
    //   organizationId: alertHistory.organizationId
    // };
    //
    // const webhookPromises = webhooks.map(webhook => 
    //   this.sendWebhookPayload(webhook.url, payload, webhook.secretKey)
    // );
    //
    // await Promise.all(webhookPromises);
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(alertHistory: AlertHistory, templateData: any): Promise<void> {
    // This would integrate with the existing notifications table
    const { User: UserModel } = require('../models');
    
    // Get organization users
    const users = await UserModel.findAll({
      include: [{
        model: Organization,
        as: 'organizations',
        where: { id: alertHistory.organizationId },
        through: { attributes: [] }
      }]
    });

    const notificationTitle = this.getNotificationTitle(alertHistory.alertType, templateData);
    const notificationMessage = this.getNotificationMessage(alertHistory.alertType, templateData);

    // Create in-app notifications for all users
    const { Notification } = require('../models');
    const notificationPromises = users.map((user: any) =>
      Notification.create({
        userId: user.id,
        type: 'warning',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          alertId: alertHistory.id,
          alertType: alertHistory.alertType,
          triggerData: templateData
        }
      })
    );

    await Promise.all(notificationPromises);
    logger.info(`In-app notifications created for alert: ${alertHistory.id} for ${users.length} users`);
  }

  /**
   * Get email template based on alert type
   */
  private getEmailTemplate(alertType: string, data: any): NotificationTemplate {
    switch (alertType) {
      case 'mention_spike':
        return {
          subject: '🚀 AI Mention Spike Alert - {{website_name}}',
          body: `Your website {{website_name}} has experienced a significant spike in AI mentions!

Current mentions: {{current_value}}
Previous period: {{previous_value}}
Increase: {{change_percentage}}%

Platform: {{platform}}

This indicates increased visibility and interest in your content across AI platforms.

View details: {{dashboard_url}}`,
          html: this.getMentionSpikeHtmlTemplate()
        };

      case 'visibility_drop':
        return {
          subject: '⚠️ AI Visibility Drop Alert - {{website_name}}',
          body: `Your website {{website_name}} visibility has dropped significantly.

Current visibility: {{current_value}}%
Previous period: {{previous_value}}%
Decrease: {{change_percentage}}%

Recommendations:
- Review recent content changes
- Check for technical issues
- Analyze competitor activity

View details: {{dashboard_url}}`
        };

      case 'new_mention':
        return {
          subject: '💬 New AI Mention - {{website_name}}',
          body: `Your website {{website_name}} was mentioned in a new AI response!

Platform: {{platform}}
Query: {{query}}
Context: {{mention_context}}

View full details: {{dashboard_url}}`
        };

      default:
        return {
          subject: 'GEO Platform Alert - {{website_name}}',
          body: 'An alert has been triggered for your website. Please check your dashboard for details.'
        };
    }
  }

  /**
   * Populate template with data
   */
  private populateTemplate(template: string, data: Record<string, any>): string {
    let result = template;
    
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = data[key] !== undefined ? String(data[key]) : '';
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    return result;
  }

  /**
   * Get notification title for in-app notifications
   */
  private getNotificationTitle(alertType: string, data: any): string {
    switch (alertType) {
      case 'mention_spike':
        return 'AI Mention Spike Detected';
      case 'visibility_drop':
        return 'Visibility Drop Alert';
      case 'new_mention':
        return 'New AI Mention';
      default:
        return 'Alert Triggered';
    }
  }

  /**
   * Get notification message for in-app notifications
   */
  private getNotificationMessage(alertType: string, data: any): string {
    switch (alertType) {
      case 'mention_spike':
        return `Mentions increased by ${data.change_percentage}% (${data.current_value} mentions)`;
      case 'visibility_drop':
        return `Visibility dropped by ${Math.abs(data.change_percentage)}% (${data.current_value}%)`;
      case 'new_mention':
        return `Mentioned on ${data.platform}: "${data.query}"`;
      default:
        return 'An alert condition has been met';
    }
  }

  /**
   * HTML template for mention spike emails
   */
  private getMentionSpikeHtmlTemplate(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🚀 AI Mention Spike!</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333;">{{website_name}}</h2>
          <p>Great news! Your website has experienced a significant spike in AI mentions.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;">
            <strong>Current mentions:</strong> {{current_value}}<br>
            <strong>Previous period:</strong> {{previous_value}}<br>
            <strong>Increase:</strong> <span style="color: #28a745; font-weight: bold;">{{change_percentage}}%</span>
          </div>
          
          <p>This indicates increased visibility and interest in your content across AI platforms.</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="{{dashboard_url}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dashboard</a>
          </div>
        </div>
        <div style="background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>GEO Platform - AI Search Engine Optimization</p>
        </div>
      </div>
    `;
  }

  /**
   * Queue a notification manually
   */
  public async queueNotification(data: {
    alertHistoryId: string;
    organizationId: string;
    channels: string[];
    templateData: any;
  }): Promise<void> {
    await notificationQueue.add('send-notification', data, {
      priority: 15,
      attempts: 3
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;