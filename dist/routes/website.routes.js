"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const website_controller_1 = require("../controllers/website.controller");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
const websiteController = new website_controller_1.WebsiteController();
// Apply authentication and organization middleware to all routes
router.use(auth_middleware_1.authenticateToken);
router.use(auth_middleware_1.requireOrganization);
// Website CRUD routes
router.get('/', (0, validation_middleware_1.validateRequest)({ query: validation_middleware_1.websiteSchemas.list }), websiteController.getWebsites);
router.get('/:id', (0, validation_middleware_1.validateRequest)({ params: joi_1.default.object({ id: validation_middleware_1.commonSchemas.uuid }) }), websiteController.getWebsite);
router.post('/', (0, validation_middleware_1.validateRequest)({ body: validation_middleware_1.websiteSchemas.create }), websiteController.createWebsite);
router.put('/:id', (0, validation_middleware_1.validateRequest)({
    params: joi_1.default.object({ id: validation_middleware_1.commonSchemas.uuid }),
    body: validation_middleware_1.websiteSchemas.update
}), websiteController.updateWebsite);
router.delete('/:id', (0, validation_middleware_1.validateRequest)({ params: joi_1.default.object({ id: validation_middleware_1.commonSchemas.uuid }) }), websiteController.deleteWebsite);
// Website content routes
router.get('/:id/content', (0, validation_middleware_1.validateRequest)({
    params: joi_1.default.object({ id: validation_middleware_1.commonSchemas.uuid }),
    query: joi_1.default.object({
        page: validation_middleware_1.commonSchemas.pagination.page,
        limit: validation_middleware_1.commonSchemas.pagination.limit,
        search: joi_1.default.string().max(255).optional(),
        optimizationStatus: joi_1.default.string().valid('pending', 'optimized', 'needs_update').optional()
    })
}), websiteController.getWebsiteContent);
// Website analytics
router.get('/:id/analytics', (0, validation_middleware_1.validateRequest)({ params: joi_1.default.object({ id: validation_middleware_1.commonSchemas.uuid }) }), websiteController.getWebsiteAnalytics);
exports.default = router;
//# sourceMappingURL=website.routes.js.map