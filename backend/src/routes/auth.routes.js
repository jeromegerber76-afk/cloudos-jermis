"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_controller_1 = require("@/controllers/auth.controller");
var auth_middleware_1 = require("@/middleware/auth.middleware");
var express_validator_1 = require("express-validator");
var router = (0, express_1.Router)();
var authController = new auth_controller_1.AuthController();
// Validation middleware
var handleValidationErrors = function (req, res, next) {
    var errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
        return;
    }
    next();
};
// Login validation rules
var loginValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    handleValidationErrors
];
/**
 * @route   GET /api/v1/auth/azure/url
 * @desc    Get Azure AD authorization URL
 * @access  Public
 */
router.get('/azure/url', authController.getAuthUrl);
/**
 * @route   GET /api/v1/auth/azure/callback
 * @desc    Handle Azure AD callback
 * @access  Public
 */
router.get('/azure/callback', authController.handleCallback);
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post('/login', (0, auth_middleware_1.rateLimitSensitive)(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
loginValidation, authController.login);
/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', auth_middleware_1.validateApiKey, authController.logout);
/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', auth_middleware_1.validateApiKey, authController.getProfile);
/**
 * @route   GET /api/v1/auth/verify
 * @desc    Verify JWT token
 * @access  Public
 */
router.get('/verify', authController.verifyToken);
exports.default = router;
