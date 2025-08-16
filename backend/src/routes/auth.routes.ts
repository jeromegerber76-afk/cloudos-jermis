import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { validateApiKey, rateLimitSensitive } from '@/middleware/auth.middleware';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const authController = new AuthController();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
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
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
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
router.post('/login', 
  rateLimitSensitive(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  loginValidation,
  authController.login
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', validateApiKey, authController.logout);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', validateApiKey, authController.getProfile);

/**
 * @route   GET /api/v1/auth/verify
 * @desc    Verify JWT token
 * @access  Public
 */
router.get('/verify', authController.verifyToken);

export default router;