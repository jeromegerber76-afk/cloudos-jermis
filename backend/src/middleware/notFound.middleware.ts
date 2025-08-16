import { Request, Response, NextFunction } from 'express';
import { Logger } from '@/utils/logger';

const logger = new Logger('NotFoundMiddleware');

/**
 * 404 Not Found middleware
 * This should be the last middleware before error handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = `Route not found: ${req.method} ${req.originalUrl}`;
  
  // Log the 404 for debugging
  logger.warn(error, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: {
      auth: '/api/v1/auth',
      dashboard: '/api/v1/dashboard',
      users: '/api/v1/users',
      timesheet: '/api/v1/timesheet',
      expenses: '/api/v1/expenses',
      files: '/api/v1/files',
      inventory: '/api/v1/inventory',
      shopify: '/api/v1/shopify',
      ai: '/api/v1/ai',
      health: '/api/v1/health',
      docs: '/api/docs'
    }
  });
};