import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer, Server as HttpServer } from 'http';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import routes from './routes';
import { initializeDatabase } from './models';
import { logger } from './utils/logger';
import { initializeWebSocketService } from './services/websocketService';
import { setupAlertScheduler } from './services/alertQueue';
import { RealTimeMetricsService } from './services/realTimeMetrics.service';
import { queueManager } from './services/queue/queueManager';
import { queueWorker } from './services/queue/queueWorker';
import { QueryTypes } from 'sequelize';
import { platformFactory } from './services/platforms/platformFactory';

class App {
  public app: Application;
  public server: HttpServer;
  public realTimeMetrics!: RealTimeMetricsService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  async initialize(): Promise<void> {
    await this.initializeDatabase();
    this.initializePlatforms();
    this.initializeWebSocket();
    await this.initializeBackgroundJobs();
  }

  private initializeMiddlewares(): void {
    // Security middlewares
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : [
          'http://localhost:3001',
          'http://10.74.100.10:3001',
          'http://localhost:8081',
          'http://10.74.100.10:8081',
          'http://localhost:5173',
          'https://api-geo-staging.boxtradex.io',
          'https://api-geo.boxtradex.io'
        ];

    // Allow all origins in development for now
    this.app.use(cors({
      origin: true,
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Note: Cookie parsing removed - using JWT-only authentication

    // Compression and logging
    this.app.use(compression());
    
    // Morgan logging with winston
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim());
        }
      }
    }));

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/v1', routes);
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'GEO Platform API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      });
    });

    // API documentation
    this.app.get('/api/v1/docs', (req, res) => {
      res.json({
        success: true,
        message: 'GEO Platform API Documentation',
        version: '1.0.0',
        endpoints: {
          authentication: {
            'POST /api/v1/auth/register': 'Register new user',
            'POST /api/v1/auth/login': 'User login',
            'POST /api/v1/auth/refresh': 'Refresh access token',
            'POST /api/v1/auth/logout': 'User logout',
            'GET /api/v1/auth/profile': 'Get user profile',
            'PUT /api/v1/auth/profile': 'Update user profile'
          },
          websites: {
            'GET /api/v1/websites': 'List websites',
            'POST /api/v1/websites': 'Create website',
            'GET /api/v1/websites/:id': 'Get website details',
            'PUT /api/v1/websites/:id': 'Update website',
            'DELETE /api/v1/websites/:id': 'Delete website',
            'GET /api/v1/websites/:id/content': 'Get website content',
            'GET /api/v1/websites/:id/analytics': 'Get website analytics'
          },
          scans: {
            'POST /api/v1/scans': 'Start website scan',
            'GET /api/v1/scans/:id': 'Get scan status',
            'GET /api/v1/scans/:id/results': 'Get scan results'
          },
          optimization: {
            'POST /api/v1/content/analyze': 'Analyze content',
            'POST /api/v1/content/optimize': 'Optimize content',
            'GET /api/v1/content/:id/preview': 'Preview optimization'
          },
          tracking: {
            'GET /api/v1/tracking/mentions': 'Get AI mentions',
            'POST /api/v1/tracking/track': 'Track visibility',
            'GET /api/v1/tracking/metrics': 'Get visibility metrics'
          }
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await initializeDatabase();
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Database initialization failed:', error);
      process.exit(1);
    }
  }

  private initializePlatforms(): void {
    try {
      // Clear platform factory cache to ensure fresh instances with updated configurations
      platformFactory.clearAllCache();
      logger.info('Platform factory cache cleared for fresh model configurations');
    } catch (error) {
      logger.error('Platform cache clearing failed:', error);
      // Don't exit - this is not critical for startup
    }
  }

  private initializeWebSocket(): void {
    try {
      // Initialize the existing WebSocket service
      initializeWebSocketService(this.server);
      
      // Initialize the new real-time metrics service
      this.realTimeMetrics = new RealTimeMetricsService(this.server);
      
      // Make it globally accessible for services that need to broadcast updates
      (global as any).realTimeMetrics = this.realTimeMetrics;
      
      logger.info('WebSocket and real-time metrics services initialized successfully');
    } catch (error) {
      logger.error('WebSocket initialization failed:', error);
      // Don't exit - WebSocket is not critical for basic functionality
    }
  }

  private async initializeBackgroundJobs(): Promise<void> {
    try {
      // Initialize alert scheduler
      setupAlertScheduler();
      logger.info('Alert scheduler initialized successfully');
      
      // Initialize queue manager and worker
      await this.initializeQueueSystem();
      
    } catch (error) {
      logger.error('Background jobs initialization failed:', error);
      // Don't exit - background jobs can be set up later
    }
  }

  private async initializeQueueSystem(): Promise<void> {
    try {
      // Start queue worker
      await queueWorker.start();
      logger.info('Queue worker started successfully');
      
      // Schedule recurring AI tracking jobs for existing websites
      await this.scheduleExistingWebsiteTracking();
      
    } catch (error) {
      logger.error('Queue system initialization failed:', error);
      throw error;
    }
  }

  private async scheduleExistingWebsiteTracking(): Promise<void> {
    try {
      // Set up a single hourly scheduler that checks all organizations
      await queueManager.addRecurringTrackingJob({
        websiteId: 'scheduler',
        organizationId: 'system',
        platforms: [],
        keywords: [],
        trackingSettings: {
          frequency: 'hourly',
          platforms: [],
          alertsEnabled: false,
          isSchedulerJob: true
        }
      }, '0 * * * *'); // Every hour at minute 0

      logger.info('✅ Hourly scheduler job set up successfully');

      // Trigger an immediate check for organizations that need tracking now
      await this.checkAndTriggerTrackingJobs();

    } catch (error) {
      logger.error('Error scheduling website tracking:', error);
      // Don't throw - this is not critical for startup
    }
  }

  public async checkAndTriggerTrackingJobs(): Promise<void> {
    try {
      // Import models here to avoid circular dependencies
      const Website = (await import('./models/Website')).default;
      const TrackingSettings = (await import('./models/TrackingSettings')).default;
      const PlatformSettings = (await import('./models/PlatformSettings')).default;
      const { sequelize } = await import('./models');

      // Find all organizations with their tracking settings, websites, and keywords
      const organizationsWithTracking = await sequelize.query(`
        SELECT
          o.id as organization_id,
          o.name as organization_name,
          ts.tracking_enabled,
          ts.tracking_frequency,
          ts.platforms,
          ts.alerts_enabled,
          ts.updated_at as tracking_settings_updated,
          COUNT(DISTINCT w.id) as website_count,
          GROUP_CONCAT(DISTINCT k.keyword) as keywords
        FROM organizations o
        LEFT JOIN tracking_settings ts ON o.id = ts.organization_id
        LEFT JOIN websites w ON o.id = w.organization_id AND w.is_active = 1
        LEFT JOIN keywords k ON o.id = k.organization_id
        WHERE ts.tracking_enabled = 1
        GROUP BY o.id, ts.id, ts.updated_at
      `, { type: QueryTypes.SELECT });

      logger.info(`Found ${organizationsWithTracking.length} organizations with tracking enabled`);

      const currentTime = new Date();

      // Check each organization to see if they need tracking now
      for (const org of organizationsWithTracking as any[]) {
        if (!org.tracking_enabled || org.website_count === 0) continue;

        // Parse platforms - handle both string and array formats
        let platforms: string[] = ['gemini', 'claude']; // default
        if (org.platforms) {
          if (typeof org.platforms === 'string') {
            platforms = org.platforms.split(',').map((p: string) => p.trim());
          } else if (Array.isArray(org.platforms)) {
            platforms = org.platforms;
          }
        }

        // Parse keywords from comma-separated string
        const keywords = org.keywords ? org.keywords.split(',').map((k: string) => k.trim()) : ['ai', 'tracking'];

        // Get last tracking time for this organization
        const lastTrackingResult = await sequelize.query(`
          SELECT MAX(atr.tracked_at) as last_tracked
          FROM ai_tracking_results atr
          JOIN websites w ON atr.website_id = w.id
          WHERE w.organization_id = ?
        `, {
          replacements: [org.organization_id],
          type: QueryTypes.SELECT
        });

        const lastTracked = (lastTrackingResult[0] as any)?.last_tracked ? new Date((lastTrackingResult[0] as any).last_tracked) : null;

        // Determine if we need to run tracking based on frequency
        let shouldTrack = false;
        const timeSinceLastTrack = lastTracked ? (currentTime.getTime() - lastTracked.getTime()) / (1000 * 60 * 60) : 999;

        if (org.tracking_frequency === 'hourly' && timeSinceLastTrack >= 1) {
          shouldTrack = true;
        } else if (org.tracking_frequency === 'daily' && timeSinceLastTrack >= 24) {
          shouldTrack = true;
        } else if (org.tracking_frequency === 'weekly' && timeSinceLastTrack >= 168) {
          shouldTrack = true;
        }

        if (shouldTrack) {
          await this.triggerTrackingForOrganization(org.organization_id, platforms, keywords, false);
        }
      }

    } catch (error) {
      logger.error('Error checking and triggering tracking jobs:', error);
    }
  }

  public async triggerTrackingForOrganization(
    organizationId: string,
    platforms: string[],
    keywords: string[],
    immediate: boolean = false
  ): Promise<void> {
    try {
      // Import models here to avoid circular dependencies
      const Website = (await import('./models/Website')).default;
      const PlatformSettings = (await import('./models/PlatformSettings')).default;

      // Get platform settings for this organization to check for API keys
      const platformSettings = await PlatformSettings.findAll({
        where: {
          organizationId,
          enabled: true
        }
      });

      // Build platform configuration with API keys
      const platformConfig: any = {};
      platformSettings.forEach(setting => {
        if (platforms.includes(setting.platform)) {
          platformConfig[setting.platform] = {
            enabled: setting.enabled,
            apiKey: setting.apiKey,
            settings: setting.settings
          };
        }
      });

      // Get all websites for this organization
      const websites = await Website.findAll({
        where: {
          organizationId,
          isActive: true
        }
      });

      // Queue tracking for each website in this organization
      for (const website of websites) {
        await queueManager.addTrackingJob({
          websiteId: website.id,
          organizationId,
          platforms,
          keywords,
          trackingSettings: {
            frequency: immediate ? 'immediate' : 'scheduled',
            platforms,
            alertsEnabled: true,
            platformConfig,
            immediate
          }
        });

        logger.info(`Queued ${immediate ? 'immediate' : 'scheduled'} AI tracking for website: ${website.domain}`);
        logger.info(`  - Platforms: [${platforms.join(', ')}]`);
        logger.info(`  - Keywords: [${keywords.join(', ')}]`);
      }

    } catch (error) {
      logger.error('Error triggering tracking for organization:', error);
      throw error;
    }
  }

  public listen(port: number): void {
    this.server.listen(port, '0.0.0.0', () => {
      logger.info(`🚀 GEO Platform API server is running on port ${port}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${port}/health`);
      logger.info(`📚 API docs: http://localhost:${port}/api/v1/docs`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  }
}

export default App;
