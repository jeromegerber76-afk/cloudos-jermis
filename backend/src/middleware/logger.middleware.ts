import { Request, Response, NextFunction } from 'express';
import { Logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface RequestWithId extends Request {
  id?: string;
  startTime?: number;
}

const logger = new Logger('RequestLogger');

/**
 * Request logging middleware
 * Logs incoming requests and their duration
 */
export const requestLogger = (req: RequestWithId, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.id = uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers for tracking
  res.setHeader('X-Request-ID', req.id);

  // Log request start
  logger.http(`${req.method} ${req.originalUrl}`, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });

  // Log response when finished
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - (req.startTime || 0);
    
    logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode}`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: Buffer.byteLength(data || '', 'utf8')
    });

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.originalUrl}`, {
        requestId: req.id,
        duration: `${duration}ms`
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

/**
 * API version middleware
 */
export const apiVersion = (version: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('API-Version', version);
    next();
  };
};