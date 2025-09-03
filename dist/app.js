"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const error_middleware_1 = require("./middlewares/error.middleware");
const routes_1 = __importDefault(require("./routes"));
const models_1 = require("./models");
const logger_1 = require("./utils/logger");
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeDatabase();
    }
    initializeMiddlewares() {
        // Security middlewares
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        this.app.use((0, cors_1.default)({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
            optionsSuccessStatus: 200
        }));
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
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
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Compression and logging
        this.app.use((0, compression_1.default)());
        // Morgan logging with winston
        this.app.use((0, morgan_1.default)('combined', {
            stream: {
                write: (message) => {
                    logger_1.logger.info(message.trim());
                }
            }
        }));
        // Trust proxy for accurate IP addresses
        this.app.set('trust proxy', 1);
    }
    initializeRoutes() {
        // API routes
        this.app.use('/api/v1', routes_1.default);
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
    initializeErrorHandling() {
        // 404 handler
        this.app.use(error_middleware_1.notFoundHandler);
        // Global error handler
        this.app.use(error_middleware_1.errorHandler);
    }
    async initializeDatabase() {
        try {
            await (0, models_1.initializeDatabase)();
            logger_1.logger.info('Database initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Database initialization failed:', error);
            process.exit(1);
        }
    }
    listen(port) {
        const server = this.app.listen(port, () => {
            logger_1.logger.info(`🚀 GEO Platform API server is running on port ${port}`);
            logger_1.logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger_1.logger.info(`🔗 Health check: http://localhost:${port}/health`);
            logger_1.logger.info(`📚 API docs: http://localhost:${port}/api/v1/docs`);
        });
        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger_1.logger.info('SIGTERM received, shutting down gracefully');
            server.close(() => {
                logger_1.logger.info('Process terminated');
                process.exit(0);
            });
        });
        process.on('SIGINT', () => {
            logger_1.logger.info('SIGINT received, shutting down gracefully');
            server.close(() => {
                logger_1.logger.info('Process terminated');
                process.exit(0);
            });
        });
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map