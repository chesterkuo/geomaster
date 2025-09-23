import Bull, { Queue, Job } from 'bull';
import IORedis from 'ioredis';
import { QUEUE_NAMES } from '../../config/constants';

interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  defaultJobOptions: Bull.JobOptions;
}

interface TrackingJobData {
  websiteId: string;
  keywords: string[];
  platforms: string[];
  trackingSettings: any;
  organizationId: string;
}

interface CompetitorAnalysisJobData {
  websiteId: string;
  competitorIds: string[];
  platforms: string[];
  organizationId: string;
}

interface ReportGenerationJobData {
  organizationId: string;
  websiteId: string;
  reportType: 'weekly' | 'monthly' | 'competitive';
  dateRange: {
    start: Date;
    end: Date;
  };
}

export class QueueManager {
  private redis!: IORedis;
  private queues: Map<string, Queue> = new Map();
  private config: QueueConfig;

  constructor() {
    this.config = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      },
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50,      // Keep last 50 failed jobs
        attempts: 3,           // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 2000,        // Start with 2 second delay
        },
        delay: 0,             // No delay by default
      }
    };

    this.initializeRedis();
    this.initializeQueues();
  }

  private initializeRedis(): void {
    this.redis = new IORedis({
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis connected for queue management');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });
  }

  private initializeQueues(): void {
    // AI Tracking Queue
    const aiTrackingQueue = new Bull(QUEUE_NAMES.AI_TRACKING, {
      redis: this.config.redis,
      defaultJobOptions: {
        ...this.config.defaultJobOptions,
        priority: 1, // Normal priority
      }
    });

    // Content Optimization Queue (existing)
    const contentOptimizationQueue = new Bull(QUEUE_NAMES.CONTENT_OPTIMIZATION, {
      redis: this.config.redis,
      defaultJobOptions: {
        ...this.config.defaultJobOptions,
        priority: 2, // Lower priority
      }
    });

    // Report Generation Queue
    const reportGenerationQueue = new Bull(QUEUE_NAMES.REPORT_GENERATION, {
      redis: this.config.redis,
      defaultJobOptions: {
        ...this.config.defaultJobOptions,
        priority: 3, // Lowest priority
      }
    });

    // Website Scan Queue (existing)
    const websiteScanQueue = new Bull(QUEUE_NAMES.WEBSITE_SCAN, {
      redis: this.config.redis,
      defaultJobOptions: {
        ...this.config.defaultJobOptions,
        priority: 1, // Normal priority
      }
    });

    // Store queues in map
    this.queues.set(QUEUE_NAMES.AI_TRACKING, aiTrackingQueue);
    this.queues.set(QUEUE_NAMES.CONTENT_OPTIMIZATION, contentOptimizationQueue);
    this.queues.set(QUEUE_NAMES.REPORT_GENERATION, reportGenerationQueue);
    this.queues.set(QUEUE_NAMES.WEBSITE_SCAN, websiteScanQueue);

    // Setup error handlers for all queues
    this.setupQueueErrorHandlers();

    console.log('✅ Queue Manager initialized with queues:', Array.from(this.queues.keys()));
  }

  private setupQueueErrorHandlers(): void {
    this.queues.forEach((queue, queueName) => {
      queue.on('error', (error) => {
        console.error(`❌ Queue ${queueName} error:`, error);
      });

      queue.on('waiting', (jobId) => {
        console.log(`⏳ Job ${jobId} waiting in queue ${queueName}`);
      });

      queue.on('active', (job) => {
        console.log(`🟡 Job ${job.id} started in queue ${queueName}`);
      });

      queue.on('completed', (job, result) => {
        console.log(`✅ Job ${job.id} completed in queue ${queueName}:`, result);
      });

      queue.on('failed', (job, err) => {
        console.error(`❌ Job ${job.id} failed in queue ${queueName}:`, err);
      });

      queue.on('stalled', (job) => {
        console.warn(`⚠️ Job ${job.id} stalled in queue ${queueName}`);
      });
    });
  }

  // AI Tracking Jobs
  async addTrackingJob(
    data: TrackingJobData, 
    options?: Bull.JobOptions
  ): Promise<Job<TrackingJobData>> {
    const queue = this.queues.get(QUEUE_NAMES.AI_TRACKING);
    if (!queue) {
      throw new Error('AI Tracking queue not initialized');
    }

    const jobOptions: Bull.JobOptions = {
      ...this.config.defaultJobOptions,
      ...options,
      jobId: `tracking-${data.websiteId}-${Date.now()}`, // Unique job ID
    };

    return queue.add('ai-tracking', data, jobOptions);
  }

  // Competitor Analysis Jobs
  async addCompetitorAnalysisJob(
    data: CompetitorAnalysisJobData,
    options?: Bull.JobOptions
  ): Promise<Job<CompetitorAnalysisJobData>> {
    const queue = this.queues.get(QUEUE_NAMES.AI_TRACKING);
    if (!queue) {
      throw new Error('AI Tracking queue not initialized');
    }

    const jobOptions: Bull.JobOptions = {
      ...this.config.defaultJobOptions,
      ...options,
      jobId: `competitor-analysis-${data.websiteId}-${Date.now()}`,
      priority: 2, // Lower priority than regular tracking
    };

    return queue.add('competitor-analysis', data, jobOptions);
  }

  // Report Generation Jobs
  async addReportGenerationJob(
    data: ReportGenerationJobData,
    options?: Bull.JobOptions
  ): Promise<Job<ReportGenerationJobData>> {
    const queue = this.queues.get(QUEUE_NAMES.REPORT_GENERATION);
    if (!queue) {
      throw new Error('Report Generation queue not initialized');
    }

    const jobOptions: Bull.JobOptions = {
      ...this.config.defaultJobOptions,
      ...options,
      jobId: `report-${data.reportType}-${data.websiteId}-${Date.now()}`,
    };

    return queue.add('generate-report', data, jobOptions);
  }

  // Recurring job scheduling
  async addRecurringTrackingJob(
    data: TrackingJobData,
    cronExpression: string
  ): Promise<Job<TrackingJobData>> {
    const queue = this.queues.get(QUEUE_NAMES.AI_TRACKING);
    if (!queue) {
      throw new Error('AI Tracking queue not initialized');
    }

    return queue.add('ai-tracking', data, {
      repeat: { cron: cronExpression },
      jobId: `recurring-tracking-${data.websiteId}`, // Consistent ID for recurring jobs
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  // Queue Management Methods
  async getQueueStats(queueName: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async getAllQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    
    for (const queueName of this.queues.keys()) {
      stats[queueName] = await this.getQueueStats(queueName);
    }

    return stats;
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    console.log(`⏸️ Queue ${queueName} paused`);
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    console.log(`▶️ Queue ${queueName} resumed`);
  }

  async cleanQueue(queueName: string, grace: number = 0): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.clean(grace, 'completed');
    await queue.clean(grace, 'failed');
    console.log(`🧹 Queue ${queueName} cleaned`);
  }

  async getJob(queueName: string, jobId: string): Promise<Job | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.getJob(jobId);
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      console.log(`🗑️ Job ${jobId} removed from queue ${queueName}`);
    }
  }

  // Graceful shutdown
  async close(): Promise<void> {
    console.log('🔄 Closing queue connections...');
    
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    
    await this.redis.disconnect();
    console.log('✅ All queue connections closed');
  }

  // Get specific queue instance
  getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('❌ Queue Manager health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const queueManager = new QueueManager();