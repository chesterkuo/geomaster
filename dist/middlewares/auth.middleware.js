"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOrganization = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Access token required'
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Find user with organization data
        const user = await models_1.User.findByPk(decoded.userId, {
            include: ['organizations']
        });
        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireOrganization = async (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
        return;
    }
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
        res.status(400).json({
            success: false,
            message: 'Organization ID required in headers'
        });
        return;
    }
    try {
        // Check if user belongs to the organization
        const userOrgs = req.user.organizations || [];
        const organization = userOrgs.find((org) => org.id === organizationId);
        if (!organization) {
            res.status(403).json({
                success: false,
                message: 'User not authorized for this organization'
            });
            return;
        }
        req.organization = organization;
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error validating organization access'
        });
    }
};
exports.requireOrganization = requireOrganization;
//# sourceMappingURL=auth.middleware.js.map