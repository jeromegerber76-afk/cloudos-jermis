import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { PrismaService } from '@/services/prisma.service';
import { Logger } from '@/utils/logger';

interface AuthRequest extends Request {
  user?: any;
}

interface AzureUserInfo {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
}

// Constants for user roles and status (since SQLite doesn't support enums)
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',
  ACCOUNTING: 'ACCOUNTING',
  WAREHOUSE: 'WAREHOUSE',
  EMPLOYEE: 'EMPLOYEE',
  EXTERNAL: 'EXTERNAL',
  GUEST: 'GUEST'
} as const;

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING'
} as const;

export class AuthController {
  private prisma: PrismaService;
  private logger: Logger;
  private msalInstance: ConfidentialClientApplication;

  constructor() {
    this.prisma = new PrismaService();
    this.logger = new Logger('AuthController');
    
    // Initialize MSAL (Microsoft Authentication Library)
    this.msalInstance = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.AZURE_CLIENT_ID!,
        clientSecret: process.env.AZURE_CLIENT_SECRET!,
        authority: process.env.AZURE_AUTHORITY!,
      },
    });
  }

  /**
   * Get Azure AD authorization URL
   */
  public getAuthUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const authCodeUrlParameters = {
        scopes: ['user.read', 'profile', 'openid', 'email'],
        redirectUri: process.env.AZURE_REDIRECT_URI!,
        state: this.generateState(),
      };

      const response = await this.msalInstance.getAuthCodeUrl(authCodeUrlParameters);
      
      res.json({
        success: true,
        authUrl: response,
        state: authCodeUrlParameters.state
      });

    } catch (error) {
      this.logger.error('Error generating auth URL:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate authentication URL'
      });
    }
  };

  /**
   * Handle Azure AD callback and create/update user
   */
  public handleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, state } = req.query;

      if (!code || typeof code !== 'string') {
        throw new Error('Authorization code not provided');
      }

      // Exchange code for token
      const tokenRequest = {
        code,
        scopes: ['user.read', 'profile', 'openid', 'email'],
        redirectUri: process.env.AZURE_REDIRECT_URI!,
      };

      const response = await this.msalInstance.acquireTokenByCode(tokenRequest);
      
      if (!response) {
        throw new Error('Failed to acquire token');
      }

      // Get user info from Microsoft Graph
      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, response.accessToken);
        },
      });

      const userInfo: AzureUserInfo = await graphClient.api('/me').get();
      
      // Create or update user in database
      const user = await this.createOrUpdateUser(userInfo);
      
      // Generate JWT token
      const jwtToken = this.generateJwtToken(user);
      
      // Create session
      await this.createSession(user.id, jwtToken);

      // Log successful login
      this.logger.info(`User logged in: ${user.email}`);
      
      // Redirect to frontend with token
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }))}`);

    } catch (error) {
      this.logger.error('Authentication callback error:', error);
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Authentication failed')}`);
    }
  };

  /**
   * Login with email and password (for non-Azure users)
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      // Find user by email
      const user = await this.prisma.client.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user || user.status !== USER_STATUS.ACTIVE) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials or inactive account'
        });
        return;
      }

      // For demo purposes - in production, use proper password hashing
      if (user.password !== password) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      // Update login statistics
      await this.prisma.client.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          loginCount: user.loginCount + 1
        }
      });

      // Generate JWT token
      const token = this.generateJwtToken(user);
      
      // Create session
      await this.createSession(user.id, token);

      this.logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          role: user.role,
          department: user.department,
          position: user.position,
          avatar: user.avatar
        }
      });

    } catch (error) {
      this.logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  };

  /**
   * Logout user
   */
  public logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        // Remove session from database
        await this.prisma.client.session.deleteMany({
          where: { sessionToken: token }
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      this.logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  };

  /**
   * Get current user profile
   */
  public getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await this.prisma.client.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          phoneNumber: true,
          avatar: true,
          role: true,
          status: true,
          department: true,
          position: true,
          timezone: true,
          language: true,
          theme: true,
          lastLogin: true,
          createdAt: true
        }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        user
      });

    } catch (error) {
      this.logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile'
      });
    }
  };

  /**
   * Verify JWT token
   */
  public verifyToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided'
        });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Check if session exists
      const session = await this.prisma.client.session.findUnique({
        where: { sessionToken: token },
        include: { user: true }
      });

      if (!session || session.expires < new Date()) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
        return;
      }

      res.json({
        success: true,
        valid: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          role: session.user.role
        }
      });

    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  };

  // Private helper methods

  private async createOrUpdateUser(userInfo: AzureUserInfo) {
    const existingUser = await this.prisma.client.user.findUnique({
      where: { azureId: userInfo.id }
    });

    if (existingUser) {
      // Update existing user
      return await this.prisma.client.user.update({
        where: { id: existingUser.id },
        data: {
          email: userInfo.mail || userInfo.userPrincipalName,
          firstName: userInfo.givenName,
          lastName: userInfo.surname,
          displayName: userInfo.displayName,
          department: userInfo.department,
          position: userInfo.jobTitle,
          lastLogin: new Date(),
          loginCount: existingUser.loginCount + 1
        }
      });
    } else {
      // Create new user
      return await this.prisma.client.user.create({
        data: {
          azureId: userInfo.id,
          email: userInfo.mail || userInfo.userPrincipalName,
          firstName: userInfo.givenName,
          lastName: userInfo.surname,
          displayName: userInfo.displayName,
          department: userInfo.department,
          position: userInfo.jobTitle,
          role: USER_ROLES.EMPLOYEE, // Default role
          status: USER_STATUS.ACTIVE,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          lastLogin: new Date(),
          loginCount: 1
        }
      });
    }
  }

  private generateJwtToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    );
  }

  private async createSession(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    await this.prisma.client.session.create({
      data: {
        sessionToken: token,
        userId,
        expires: expiresAt
      }
    });
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}