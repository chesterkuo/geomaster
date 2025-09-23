import { queueManager } from './queueManager';
import { QUEUE_NAMES } from '../../config/constants';
import { 
  processAITrackingJob, 
  processCompetitorAnalysisJob, 
  processReportGenerationJob 
} from '../../jobs/aiTrackingJob';

export class QueueWorker {
  private isRunning = false;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ Queue worker is already running');
      return;
    }

    console.log('🚀 Starting queue worker...');
    this.isRunning = true;

    try {
      // Setup job processors for different queue types
      await this.setupJobProcessors();
      
      console.log('✅ Queue worker started successfully');
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ Failed to start queue worker:', error);
      this.isRunning = false;
      throw error;
    }
  }

  private async setupJobProcessors(): Promise<void> {
    // AI Tracking Queue
    const aiTrackingQueue = queueManager.getQueue(QUEUE_NAMES.AI_TRACKING);
    if (aiTrackingQueue) {
      // Process AI tracking jobs
      aiTrackingQueue.process('ai-tracking', 2, processAITrackingJob);
      
      // Process competitor analysis jobs
      aiTrackingQueue.process('competitor-analysis', 1, processCompetitorAnalysisJob);
      
      console.log('✅ AI tracking queue processors setup');
    }

    // Report Generation Queue
    const reportQueue = queueManager.getQueue(QUEUE_NAMES.REPORT_GENERATION);
    if (reportQueue) {
      reportQueue.process('generate-report', 1, processReportGenerationJob);
      console.log('✅ Report generation queue processors setup');
    }

    // Website Scan Queue (existing)
    const websiteScanQueue = queueManager.getQueue(QUEUE_NAMES.WEBSITE_SCAN);
    if (websiteScanQueue) {
      // Placeholder for existing website scan processor
      websiteScanQueue.process('website-scan', 3, async (job) => {
        console.log('🔍 Processing website scan job:', job.id);
        return { status: 'completed', message: 'Website scan completed' };
      });
      console.log('✅ Website scan queue processors setup');
    }

    // Content Optimization Queue (existing)
    const contentOptQueue = queueManager.getQueue(QUEUE_NAMES.CONTENT_OPTIMIZATION);
    if (contentOptQueue) {
      // Placeholder for existing content optimization processor
      contentOptQueue.process('content-optimization', 2, async (job) => {
        console.log('📝 Processing content optimization job:', job.id);
        return { status: 'completed', message: 'Content optimization completed' };
      });
      console.log('✅ Content optimization queue processors setup');
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('⚠️ Queue worker is not running');
      return;
    }

    console.log('🔄 Stopping queue worker...');
    this.isRunning = false;

    try {
      await queueManager.close();
      console.log('✅ Queue worker stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping queue worker:', error);
      throw error;
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📢 Received ${signal}. Graceful shutdown...`);
      
      try {
        await this.stop();
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  }

  async getStatus(): Promise<{
    isRunning: boolean;
    queueStats: Record<string, any>;
    health: boolean;
  }> {
    const queueStats = await queueManager.getAllQueueStats();
    const health = await queueManager.healthCheck();

    return {
      isRunning: this.isRunning,
      queueStats,
      health
    };
  }

  // Schedule recurring jobs
  async scheduleRecurringJobs(): Promise<void> {
    console.log('📅 Setting up recurring AI tracking jobs...');

    // This would typically be called during application initialization
    // to set up recurring tracking jobs for all active websites
    
    // Example: Daily tracking for all websites
    // const websites = await Website.findAll({ where: { isActive: true } });
    // 
    // for (const website of websites) {
    //   await queueManager.addRecurringTrackingJob({
    //     websiteId: website.id,
    //     organizationId: website.organizationId,
    //     platforms: ['chatgpt', 'claude'],
    //     keywords: website.keywords || [],
    //     competitors: [],
    //     trackingSettings: { frequency: 'daily' }
    //   }, '0 9 * * *'); // Daily at 9 AM
    // }
  }

  // Manual job triggering for testing
  async triggerTestJob(): Promise<void> {
    console.log('🧪 Triggering test AI tracking job...');
    
    await queueManager.addTrackingJob({
      websiteId: 'test-website-id',
      organizationId: 'test-org-id',
      platforms: ['chatgpt'],
      keywords: ['AI', 'tracking', 'test'],
      trackingSettings: { frequency: 'daily', platforms: ['chatgpt'], alertsEnabled: false }
    });
    
    console.log('✅ Test job added to queue');
  }
}

// Export singleton instance
export const queueWorker = new QueueWorker();