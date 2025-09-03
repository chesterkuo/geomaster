"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const website_routes_1 = __importDefault(require("./website.routes"));
const router = (0, express_1.Router)();
// Mount routes
router.use('/auth', auth_routes_1.default);
router.use('/websites', website_routes_1.default);
// API health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'GEO Platform API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// API info
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to GEO Platform API',
        version: '1.0.0',
        documentation: '/api/v1/docs',
        endpoints: {
            auth: '/api/v1/auth',
            websites: '/api/v1/websites',
            scans: '/api/v1/scans',
            content: '/api/v1/content',
            tracking: '/api/v1/tracking',
            reports: '/api/v1/reports'
        }
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map