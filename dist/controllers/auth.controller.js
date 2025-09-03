"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const error_middleware_1 = require("../middlewares/error.middleware");
class AuthController {
    constructor() {
        this.register = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { email, password, fullName, company } = req.body;
            // Check if user already exists
            const existingUser = await models_1.User.findOne({ where: { email } });
            if (existingUser) {
                throw new error_middleware_1.AppError('User already exists with this email', 409);
            }
            // Create default organization for the user
            const organization = await models_1.Organization.create({
                name: company || `${fullName}'s Organization`,
                slug: this.generateSlug(company || fullName),
                plan: 'free'
            });
            // Create user
            const user = await models_1.User.create({
                email,
                passwordHash: password, // Will be hashed by the model hook
                fullName,
                company,
                role: 'admin' // First user is admin of their organization
            });
            // Associate user with organization (commented out as association method needs to be properly defined)
            // TODO: Implement proper user-organization association after defining Sequelize associations
            // await user.$add('organizations', organization);
            const token = this.generateToken(user.id);
            const refreshToken = this.generateRefreshToken(user.id);
            res.status(201).json({
                success: true,
                data: {
                    user: user.toJSON(),
                    organization: organization.toJSON(),
                    token,
                    refreshToken
                }
            });
        });
        this.login = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { email, password } = req.body;
            // Find user with organizations
            const user = await models_1.User.findOne({
                where: { email },
                include: ['organizations']
            });
            if (!user || !user.isActive) {
                throw new error_middleware_1.AppError('Invalid credentials', 401);
            }
            // Validate password
            const isPasswordValid = await user.validatePassword(password);
            if (!isPasswordValid) {
                throw new error_middleware_1.AppError('Invalid credentials', 401);
            }
            // Update last login
            user.lastLoginAt = new Date();
            await user.save();
            const token = this.generateToken(user.id);
            const refreshToken = this.generateRefreshToken(user.id);
            res.json({
                success: true,
                data: {
                    user: user.toJSON(),
                    organizations: user.get('organizations'),
                    token,
                    refreshToken
                }
            });
        });
        this.refreshToken = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new error_middleware_1.AppError('Refresh token required', 400);
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                const user = await models_1.User.findByPk(decoded.userId, {
                    include: ['organizations']
                });
                if (!user || !user.isActive) {
                    throw new error_middleware_1.AppError('User not found', 404);
                }
                const newToken = this.generateToken(user.id);
                const newRefreshToken = this.generateRefreshToken(user.id);
                res.json({
                    success: true,
                    data: {
                        user: user.toJSON(),
                        organizations: user.get('organizations'),
                        token: newToken,
                        refreshToken: newRefreshToken
                    }
                });
            }
            catch (error) {
                throw new error_middleware_1.AppError('Invalid refresh token', 401);
            }
        });
        this.logout = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            // In a production app, you might want to maintain a blacklist of tokens
            // or use Redis to store valid tokens
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        });
        this.forgotPassword = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { email } = req.body;
            const user = await models_1.User.findOne({ where: { email } });
            if (!user) {
                // Don't reveal if email exists
                res.json({
                    success: true,
                    message: 'If email exists, password reset link has been sent'
                });
                return;
            }
            // Generate reset token (in production, store this in database)
            const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'password-reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
            // TODO: Send email with reset link
            // await emailService.sendPasswordResetEmail(user.email, resetToken);
            res.json({
                success: true,
                message: 'Password reset link has been sent to your email',
                ...(process.env.NODE_ENV === 'development' && { resetToken }) // Only in dev
            });
        });
        this.resetPassword = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { token, password } = req.body;
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                if (decoded.type !== 'password-reset') {
                    throw new error_middleware_1.AppError('Invalid token type', 400);
                }
                const user = await models_1.User.findByPk(decoded.userId);
                if (!user) {
                    throw new error_middleware_1.AppError('User not found', 404);
                }
                // Update password
                user.passwordHash = password; // Will be hashed by the model hook
                await user.save();
                res.json({
                    success: true,
                    message: 'Password reset successfully'
                });
            }
            catch (error) {
                throw new error_middleware_1.AppError('Invalid or expired reset token', 400);
            }
        });
        this.getProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const user = await models_1.User.findByPk(userId, {
                include: ['organizations']
            });
            res.json({
                success: true,
                data: {
                    user: user?.toJSON(),
                    organizations: user?.get('organizations')
                }
            });
        });
        this.updateProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { fullName, company } = req.body;
            const user = await models_1.User.findByPk(userId);
            if (!user) {
                throw new error_middleware_1.AppError('User not found', 404);
            }
            if (fullName)
                user.fullName = fullName;
            if (company)
                user.company = company;
            await user.save();
            res.json({
                success: true,
                data: {
                    user: user.toJSON()
                }
            });
        });
    }
    generateToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '24h' });
    }
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' });
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 50);
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map