import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaService } from '@/services/prisma.service';
import { Logger } from '@/utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
}

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export class AuthMiddleware {
  private static prisma = new PrismaService();
  private static logger = new Logger('AuthMiddleware');

  /**
   * Validate JWT token and attach user to request
   */
  public static validateApiKey = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Access token required'
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      // Check if session exists and is valid
      const session = await AuthMiddleware.prisma.client.session.findUnique({
        where: { sessionToken: token },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
              lastLogin: true
            }
          }
        }
      });

      if (!session || session.expires < new Date()) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
        return;
      }

      // Check if user is still active
      if (session.user.status !== 'ACTIVE') {
        res.status(401).json({
          success: false,
          error: 'Account is not active'
        });
        return;
      }

      // Attach user to request
      req.user = {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        status: session.user.status
      };

      // Log API access for audit trail
      await AuthMiddleware.logApiAccess(req, session.user.id);

      next();

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
        return;
      }

      AuthMiddleware.logger.error('Authentication middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  };

  /**
   * Require specific roles
   */
  public static requireRoles = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: req.user.role
        });
        return;
      }

      next();
    };
  };

  /**
   * Require admin role
   */
  public static requireAdmin = AuthMiddleware.requireRoles(['ADMIN']);

  /**
   * Require admin or support role
   */
  public static requireAdminOrSupport = AuthMiddleware.requireRoles([
    'ADMIN',
    'SUPPORT'
  ]);

  /**
   * Require accounting permissions
   */
  public static requireAccounting = AuthMiddleware.requireRoles([
    'ADMIN',
    'ACCOUNTING'
  ]);

  /**
   * Require warehouse permissions
   */
  public static requireWarehouse = AuthMiddleware.requireRoles([
    'ADMIN',
    'WAREHOUSE'
  ]);

  /**
   * Check if user owns resource or has admin permissions
   */
  public static requireOwnershipOrAdmin = (userIdField: string = 'userId') => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Admins can access everything
      if (req.user.role === 'ADMIN') {
        next();
        return;
      }

      // Check ownership based on route parameter or request body
      const resourceUserId = req.params[userIdField] || req.body[userIdField];
      
      if (resourceUserId && resourceUserId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied - you can only access your own resources'
        });
        return;
      }

      next();
    };
  };

  /**
   * Log API access for audit trail
   */
  private static async logApiAccess(req: Request, userId: string): Promise<void> {
    try {
      // Skip logging for health checks and frequent endpoints
      const skipPaths = ['/health', '/auth/verify'];
      const shouldSkip = skipPaths.some(path => req.path.includes(path));
      
      if (shouldSkip) return;

      await AuthMiddleware.prisma.client.auditLog.create({
        data: {
          userId,
          action: 'API_ACCESS',
          entity: 'API',
          entityId: req.path,
          changes: JSON.stringify({
            method: req.method,
            path: req.path,
            query: req.query,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          }),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      AuthMiddleware.logger.error('Failed to log API access:', error);
    }
  }

  /**
   * Rate limiting for sensitive operations
   */
  public static rateLimitSensitive(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    const attempts = new Map<string, { count: number; resetTime: number }>();

    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      const key = req.ip + (req.user?.id || 'anonymous');
      const now = Date.now();
      
      const userAttempts = attempts.get(key);
      
      if (!userAttempts || now > userAttempts.resetTime) {
        attempts.set(key, { count: 1, resetTime: now + windowMs });
        next();
        return;
      }

      if (userAttempts.count >= maxAttempts) {
        res.status(429).json({
          success: false,
          error: 'Too many attempts, please try again later',
          retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
        });
        return;
      }

      userAttempts.count++;
      next();
    };
  }
}

// Export individual middleware functions for easier use
export const validateApiKey = AuthMiddleware.validateApiKey;
export const requireRoles = AuthMiddleware.requireRoles;
export const requireAdmin = AuthMiddleware.requireAdmin;
export const requireAdminOrSupport = AuthMiddleware.requireAdminOrSupport;
export const requireAccounting = AuthMiddleware.requireAccounting;
export const requireWarehouse = AuthMiddleware.requireWarehouse;
export const requireOwnershipOrAdmin = AuthMiddleware.requireOwnershipOrAdmin;
export const rateLimitSensitive = AuthMiddleware.rateLimitSensitive;