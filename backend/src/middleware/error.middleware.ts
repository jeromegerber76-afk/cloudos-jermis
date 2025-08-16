import { Request, Response, NextFunction } from 'express';
import { Logger } from '@/utils/logger';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  details?: any;
}

export class ErrorMiddleware {
  private static logger = new Logger('ErrorMiddleware');

  /**
   * Global error handler
   */
  public static handle = (
    error: ErrorWithStatus,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // Log the error
    ErrorMiddleware.logger.error('Unhandled error:', error);

    // Get status code
    const statusCode = error.status || error.statusCode || 500;
    
    // Determine if we should expose error details
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isClientError = statusCode >= 400 && statusCode < 500;

    // Prepare error response
    let errorResponse: any = {
      success: false,
      error: 'An error occurred'
    };

    // Handle different types of errors
    if (error.name === 'ValidationError') {
      errorResponse = {
        success: false,
        error: 'Validation failed',
        details: error.details || error.message
      };
    } else if (error.name === 'UnauthorizedError' || statusCode === 401) {
      errorResponse = {
        success: false,
        error: 'Unauthorized access'
      };
    } else if (error.name === 'ForbiddenError' || statusCode === 403) {
      errorResponse = {
        success: false,
        error: 'Access forbidden'
      };
    } else if (error.name === 'NotFoundError' || statusCode === 404) {
      errorResponse = {
        success: false,
        error: 'Resource not found'
      };
    } else if (statusCode === 429) {
      errorResponse = {
        success: false,
        error: 'Too many requests',
        retryAfter: error.details?.retryAfter
      };
    } else if (isClientError) {
      // Client errors (4xx) - safe to expose message
      errorResponse = {
        success: false,
        error: error.message || 'Bad request'
      };
    } else {
      // Server errors (5xx) - be careful about exposing details
      if (isDevelopment) {
        errorResponse = {
          success: false,
          error: error.message || 'Internal server error',
          stack: error.stack,
          details: error.details
        };
      } else {
        errorResponse = {
          success: false,
          error: 'Internal server error'
        };
      }
    }

    // Add request ID for tracking
    if (req.headers['x-request-id']) {
      errorResponse.requestId = req.headers['x-request-id'];
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
  };

  /**
   * Async error handler wrapper
   */
  public static asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  /**
   * Create custom error
   */
  public static createError = (message: string, statusCode: number = 500, details?: any): ErrorWithStatus => {
    const error: ErrorWithStatus = new Error(message);
    error.status = statusCode;
    error.details = details;
    return error;
  };
}

// Export the error handler function
export const errorHandler = ErrorMiddleware.handle;
export const asyncHandler = ErrorMiddleware.asyncHandler;
export const createError = ErrorMiddleware.createError;