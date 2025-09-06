import Bull from 'bull';
import { queueRedis } from '../config/redis';
import { AlertService } from './alertService';
import MetricsSnapshot, { METRIC_TYPES, PLATFORMS, TIME_WINDOWS } from '../models/MetricsSnapshot';
import AITrackingResult from '../models/AITrackingResult';
import { Website, Organization } from '../models';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';

// Queue options
const queueOptions: Bull.QueueOptions = {
  redis: {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
    password: process.env.REDIS_PASSWORD || undefined
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
};

// Create queues
export const alertMonitoringQueue = new Bull('alert-monitoring', queueOptions);
export const metricsCollectionQueue = new Bull('metrics-collection', queueOptions);
export const notificationQueue = new Bull('notifications', queueOptions);

// Job data interfaces
interface AlertMonitoringJobData {
  organizationId?: string;
  websiteId?: string;
  alertType?: string;
}

interface MetricsCollectionJobData {
  organizationId?: string;
  websiteId?: string;
  platform?: string;
}

interface NotificationJobData {
  alertHistoryId: string;
  organizationId: string;
  channels: string[];
  templateData: any;
}

/**
 * Alert Monitoring Job Processor
 * Checks all active alerts and triggers notifications when conditions are met
 */
alertMonitoringQueue.process('check-alerts', async (job: Bull.Job<AlertMonitoringJobData>) => {
  const { organizationId, websiteId, alertType } = job.data;
  
  try {
    logger.info(`Starting alert monitoring job`, { organizationId, websiteId, alertType });

    // Get organizations to check
    let organizationsToCheck: Organization[] = [];
    
    if (organizationId) {
      const org = await Organization.findByPk(organizationId);
      if (org) organizationsToCheck.push(org);
    } else {
      // Check all active organizations
      organizationsToCheck = await Organization.findAll({
        where: { plan: { [Op.ne]: 'free' } } // Only check paid plans
      });
    }

    let totalAlertsChecked = 0;
    let totalAlertsTriggered = 0;

    for (const organization of organizationsToCheck) {
      const alertService = new AlertService({ organizationId: organization.id });

      // Get websites to check
      let websitesToCheck: Website[] = [];
      
      if (websiteId) {
        const website = await Website.findOne({
          where: { id: websiteId, organizationId: organization.id }
        });
        if (website) websitesToCheck.push(website);
      } else {
        websitesToCheck = await Website.findAll({
          where: { organizationId: organization.id, isActive: true }
        });
      }

      for (const website of websitesToCheck) {
        const triggeredAlerts = await alertService.checkAlertsForWebsite(website.id);
        totalAlertsChecked++;
        
        if (triggeredAlerts.length > 0) {
          totalAlertsTriggered += triggeredAlerts.length;
          
          // Queue notification jobs for each triggered alert
          for (const alertHistory of triggeredAlerts) {
            await notificationQueue.add('send-notification', {
              alertHistoryId: alertHistory.id,
              organizationId: organization.id,
              channels: alertHistory.notificationChannels || ['email'],
              templateData: alertHistory.triggerData
            }, {
              delay: 1000, // Slight delay to prevent spam
              priority: alertHistory.alertType === 'new_mention' ? 10 : 5
            });
          }
        }
      }
    }

    logger.info(`Alert monitoring job completed`, {
      totalAlertsChecked,
      totalAlertsTriggered,
      processingTime: Date.now() - job.timestamp
    });

    return { totalAlertsChecked, totalAlertsTriggered };
    
  } catch (error) {
    logger.error(`Alert monitoring job failed:`, error);
    throw error;
  }
});

/**
 * Metrics Collection Job Processor
 * Collects current metrics and creates snapshots for comparison
 */
metricsCollectionQueue.process('collect-metrics', async (job: Bull.Job<MetricsCollectionJobData>) => {
  const { organizationId, websiteId, platform } = job.data;
  
  try {
    logger.info(`Starting metrics collection job`, { organizationId, websiteId, platform });

    // Get websites to collect metrics for
    let websitesToProcess: Array<{ id: string; organizationId: string }> = [];
    
    if (websiteId && organizationId) {
      websitesToProcess.push({ id: websiteId, organizationId });
    } else {
      const websites = await Website.findAll({
        where: {
          isActive: true,
          ...(organizationId && { organizationId: organizationId })
        },
        include: [{
          model: Organization,
          as: 'organization',
          where: { plan: { [Op.ne]: 'free' } }
        }],
        attributes: ['id', 'organization_id']
      });
      
      websitesToProcess = websites.map(w => ({ 
        id: w.id, 
        organizationId: w.get('organization_id') as string 
      }));
    }

    let totalMetricsCollected = 0;

    for (const website of websitesToProcess) {
      const alertService = new AlertService({ organizationId: website.organizationId });

      // Collect mention count metrics
      const mentionCount = await AITrackingResult.count({
        where: {
          websiteId: website.id,
          trackedAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          },
          isMentioned: true
        }
      });

      await alertService.createMetricsSnapshot({
        websiteId: website.id,
        metricType: METRIC_TYPES.MENTION_COUNT,
        platform: PLATFORMS.ALL,
        timeWindow: TIME_WINDOWS.ONE_DAY,
        metricValue: mentionCount
      });

      // Collect sentiment score metrics (average sentiment)
      const sentimentResults = await AITrackingResult.findAll({
        where: {
          websiteId: website.id,
          trackedAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          isMentioned: true
        },
        attributes: ['full_response']
      });

      const avgSentiment = calculateAverageSentiment(sentimentResults);
      
      await alertService.createMetricsSnapshot({
        websiteId: website.id,
        metricType: METRIC_TYPES.SENTIMENT_SCORE,
        platform: PLATFORMS.ALL,
        timeWindow: TIME_WINDOWS.ONE_DAY,
        metricValue: avgSentiment
      });

      // Collect visibility percentage (mentions/total queries ratio)
      const totalQueries = await AITrackingResult.count({
        where: {
          websiteId: website.id,
          trackedAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      const visibilityPercentage = totalQueries > 0 ? (mentionCount / totalQueries) * 100 : 0;
      
      await alertService.createMetricsSnapshot({
        websiteId: website.id,
        metricType: METRIC_TYPES.VISIBILITY_PERCENTAGE,
        platform: PLATFORMS.ALL,
        timeWindow: TIME_WINDOWS.ONE_DAY,
        metricValue: visibilityPercentage
      });

      totalMetricsCollected += 3; // 3 metrics per website
    }

    logger.info(`Metrics collection job completed`, {
      totalMetricsCollected,
      websitesProcessed: websitesToProcess.length,
      processingTime: Date.now() - job.timestamp
    });

    return { totalMetricsCollected, websitesProcessed: websitesToProcess.length };
    
  } catch (error) {
    logger.error(`Metrics collection job failed:`, error);
    throw error;
  }
});

/**
 * Calculate average sentiment score from AI responses
 * This is a simple implementation - can be enhanced with actual sentiment analysis
 */
function calculateAverageSentiment(results: AITrackingResult[]): number {
  if (results.length === 0) return 0.5; // Neutral sentiment
  
  let totalSentiment = 0;
  let validResults = 0;

  for (const result of results) {
    const response = result.get('full_response') as string;
    if (response) {
      // Simple keyword-based sentiment analysis
      const positive = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'best', 'outstanding'].some(word => 
        response.toLowerCase().includes(word)
      );
      const negative = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointing', 'useless'].some(word => 
        response.toLowerCase().includes(word)
      );
      
      if (positive && !negative) {
        totalSentiment += 0.8; // Positive
      } else if (negative && !positive) {
        totalSentiment += 0.2; // Negative
      } else {
        totalSentiment += 0.5; // Neutral
      }
      validResults++;
    }
  }

  return validResults > 0 ? totalSentiment / validResults : 0.5;
}

/**
 * Schedule recurring jobs
 */
export function setupAlertScheduler(): void {
  // Check alerts every 15 minutes
  alertMonitoringQueue.add('check-alerts', {}, {
    repeat: { cron: '*/15 * * * *' }, // Every 15 minutes
    jobId: 'alert-monitoring-recurring'
  });

  // Collect metrics every hour
  metricsCollectionQueue.add('collect-metrics', {}, {
    repeat: { cron: '0 * * * *' }, // Every hour
    jobId: 'metrics-collection-recurring'
  });

  logger.info('Alert monitoring scheduler setup completed');
}

/**
 * Manual trigger functions for API endpoints
 */
export async function triggerAlertCheck(data: AlertMonitoringJobData = {}): Promise<Bull.Job> {
  return await alertMonitoringQueue.add('check-alerts', data, {
    priority: 20 // Higher priority for manual triggers
  });
}

export async function triggerMetricsCollection(data: MetricsCollectionJobData = {}): Promise<Bull.Job> {
  return await metricsCollectionQueue.add('collect-metrics', data, {
    priority: 20
  });
}

// Queue event handlers
alertMonitoringQueue.on('completed', (job, result) => {
  logger.info(`Alert monitoring job completed: ${job.id}`, result);
});

alertMonitoringQueue.on('failed', (job, err) => {
  logger.error(`Alert monitoring job failed: ${job.id}`, err);
});

metricsCollectionQueue.on('completed', (job, result) => {
  logger.info(`Metrics collection job completed: ${job.id}`, result);
});

metricsCollectionQueue.on('failed', (job, err) => {
  logger.error(`Metrics collection job failed: ${job.id}`, err);
});

notificationQueue.on('completed', (job, result) => {
  logger.info(`Notification job completed: ${job.id}`, result);
});

notificationQueue.on('failed', (job, err) => {
  logger.error(`Notification job failed: ${job.id}`, err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down alert queues...');
  await Promise.all([
    alertMonitoringQueue.close(),
    metricsCollectionQueue.close(),
    notificationQueue.close()
  ]);
});

export { Bull };