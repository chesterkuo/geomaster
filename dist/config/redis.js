"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueRedis = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null
};
exports.redis = new ioredis_1.default(redisConfig);
// Queue Redis instance for Bull
exports.queueRedis = new ioredis_1.default(redisConfig);
exports.redis.on('connect', () => {
    console.log('Redis connected successfully');
});
exports.redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});
exports.default = exports.redis;
//# sourceMappingURL=redis.js.map