import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import routes from './routes';
import { initializeDatabase } from './models';
import { logger } from './utils/logger';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeDatabase();
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
          'http://localhost:3000', 
          'http://10.74.100.10:3000',
          'http://localhost:8081',
          'http://10.74.100.10:8081'
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

  public listen(port: number): void {
    const server = this.app.listen(port, '0.0.0.0', () => {
      logger.info(`🚀 GEO Platform API server is running on port ${port}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${port}/health`);
      logger.info(`📚 API docs: http://localhost:${port}/api/v1/docs`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  }
}

export default App;