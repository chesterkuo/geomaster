"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentSchemas = exports.scanSchemas = exports.websiteSchemas = exports.authSchemas = exports.commonSchemas = exports.validateRequest = void 0;
const joi_1 = __importDefault(require("joi"));
const validateRequest = (schema) => {
    return (req, res, next) => {
        const errors = [];
        // Validate body
        if (schema.body) {
            const { error } = schema.body.validate(req.body);
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        // Validate query
        if (schema.query) {
            const { error } = schema.query.validate(req.query);
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        // Validate params
        if (schema.params) {
            const { error } = schema.params.validate(req.params);
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        if (errors.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
            return;
        }
        next();
    };
};
exports.validateRequest = validateRequest;
// Common validation schemas
exports.commonSchemas = {
    uuid: joi_1.default.string().uuid().required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required(),
    url: joi_1.default.string().uri().required(),
    pagination: {
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(10)
    }
};
// Authentication validation schemas
exports.authSchemas = {
    register: joi_1.default.object({
        email: exports.commonSchemas.email,
        password: exports.commonSchemas.password,
        fullName: joi_1.default.string().min(2).max(100).required(),
        company: joi_1.default.string().max(100).optional()
    }),
    login: joi_1.default.object({
        email: exports.commonSchemas.email,
        password: joi_1.default.string().required()
    }),
    refreshToken: joi_1.default.object({
        refreshToken: joi_1.default.string().required()
    }),
    forgotPassword: joi_1.default.object({
        email: exports.commonSchemas.email
    }),
    resetPassword: joi_1.default.object({
        token: joi_1.default.string().required(),
        password: exports.commonSchemas.password
    })
};
// Website validation schemas
exports.websiteSchemas = {
    create: joi_1.default.object({
        url: exports.commonSchemas.url,
        name: joi_1.default.string().min(2).max(255).required(),
        description: joi_1.default.string().max(1000).optional(),
        scanFrequency: joi_1.default.string().valid('daily', 'weekly', 'monthly').default('weekly')
    }),
    update: joi_1.default.object({
        name: joi_1.default.string().min(2).max(255).optional(),
        description: joi_1.default.string().max(1000).optional(),
        scanFrequency: joi_1.default.string().valid('daily', 'weekly', 'monthly').optional(),
        isActive: joi_1.default.boolean().optional()
    }),
    list: joi_1.default.object({
        page: exports.commonSchemas.pagination.page,
        limit: exports.commonSchemas.pagination.limit,
        search: joi_1.default.string().max(255).optional(),
        isActive: joi_1.default.boolean().optional()
    })
};
// Scan validation schemas
exports.scanSchemas = {
    create: joi_1.default.object({
        websiteId: exports.commonSchemas.uuid,
        scanType: joi_1.default.string().valid('quick', 'standard', 'deep').default('standard')
    })
};
// Content validation schemas
exports.contentSchemas = {
    analyze: joi_1.default.object({
        content: joi_1.default.string().required(),
        targetKeywords: joi_1.default.array().items(joi_1.default.string().max(255)).optional()
    }),
    optimize: joi_1.default.object({
        contentId: exports.commonSchemas.uuid,
        applyOptimizations: joi_1.default.array().items(joi_1.default.string()).optional()
    })
};
//# sourceMappingURL=validation.middleware.js.map