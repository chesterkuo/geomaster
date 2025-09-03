"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// Public routes
router.post('/register', (0, validation_middleware_1.validateRequest)({ body: validation_middleware_1.authSchemas.register }), authController.register);
router.post('/login', (0, validation_middleware_1.validateRequest)({ body: validation_middleware_1.authSchemas.login }), authController.login);
router.post('/refresh', (0, validation_middleware_1.validateRequest)({ body: validation_middleware_1.authSchemas.refreshToken }), authController.refreshToken);
router.post('/forgot-password', (0, validation_middleware_1.validateRequest)({ body: validation_middleware_1.authSchemas.forgotPassword }), authController.forgotPassword);
router.post('/reset-password', (0, validation_middleware_1.validateRequest)({ body: validation_middleware_1.authSchemas.resetPassword }), authController.resetPassword);
// Protected routes
router.post('/logout', auth_middleware_1.authenticateToken, authController.logout);
router.get('/profile', auth_middleware_1.authenticateToken, authController.getProfile);
router.put('/profile', auth_middleware_1.authenticateToken, authController.updateProfile);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map