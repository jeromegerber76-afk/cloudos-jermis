import { Router } from 'express';
import { DashboardController } from '@/controllers/dashboard.controller';
import { requireAdminOrSupport } from '@/middleware/auth.middleware';
import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const dashboardController = new DashboardController();

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

// News creation validation
const newsValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must not exceed 500 characters'),
  body('priority')
    .optional()
    .isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority level'),
  body('targetRoles')
    .optional()
    .isArray()
    .withMessage('Target roles must be an array'),
  body('publishNow')
    .optional()
    .isBoolean()
    .withMessage('PublishNow must be a boolean'),
  handleValidationErrors
];

// Pagination validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

/**
 * @route   GET /api/v1/dashboard
 * @desc    Get dashboard overview with news, events, and stats
 * @access  Private
 */
router.get('/', dashboardController.getDashboard);

/**
 * @route   GET /api/v1/dashboard/news
 * @desc    Get news articles with pagination
 * @access  Private
 */
router.get('/news', paginationValidation, dashboardController.getNews);

/**
 * @route   POST /api/v1/dashboard/news
 * @desc    Create new news article
 * @access  Private (Admin/Support only)
 */
router.post('/news', 
  requireAdminOrSupport,
  newsValidation,
  dashboardController.createNews
);

/**
 * @route   GET /api/v1/dashboard/calendar
 * @desc    Get upcoming calendar events
 * @access  Private
 */
router.get('/calendar', dashboardController.getCalendarEvents);

/**
 * @route   GET /api/v1/dashboard/team-status
 * @desc    Get team online status
 * @access  Private
 */
router.get('/team-status', async (req, res) => {
  try {
    const teamStatus = await dashboardController.getTeamStatus();
    res.json({
      success: true,
      teamStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get team status'
    });
  }
});

export default router;