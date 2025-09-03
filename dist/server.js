"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./utils/logger");
// Load environment variables
dotenv_1.default.config();
// Validate required environment variables
const requiredEnvVars = [
    'JWT_SECRET',
    'DB_NAME',
    'DB_USER',
    'DB_HOST'
];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    logger_1.logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    logger_1.logger.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
}
// Create and start the application
const app = new app_1.default();
const port = parseInt(process.env.PORT || '8000', 10);
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Start server
app.listen(port);
//# sourceMappingURL=server.js.map