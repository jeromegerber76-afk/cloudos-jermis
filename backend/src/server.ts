import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from '@/routes/auth.routes';
import userRoutes from '@/routes/user.routes';
import dashboardRoutes from '@/routes/dashboard.routes';
import timesheetRoutes from '@/routes/timesheet.routes';
import expenseRoutes from '@/routes/expense.routes';
import fileRoutes from '@/routes/file.routes';
import inventoryRoutes from '@/routes/inventory.routes';
import shopifyRoutes from '@/routes/shopify.routes';
import aiRoutes from '@/routes/ai.routes';

// Import middleware
import { errorHandler } from '@/middleware/error.middleware';
import { notFound } from '@/middleware/notFound.middleware';
import { requestLogger } from '@/middleware/logger.middleware';
import { validateApiKey } from '@/middleware/auth.middleware';

// Import services
import { PrismaService } from '@/services/prisma.service';
import { Logger } from '@/utils/logger';

// Load environment variables
dotenv.config();

class CloudOSServer {
  private app: express.Application;
  private port: number;
  private prisma: PrismaService;
  private logger: Logger;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001', 10);
    this.prisma = new PrismaService();
    this.logger = new Logger('CloudOSServer');
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://graph.microsoft.com", "https://login.microsoftonline.com"]
        }
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api', limiter);

    // Body parsing middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }
    this.app.use(requestLogger);

    // Trust proxy (for Azure deployment)
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    const apiRouter = express.Router();

    // Health check endpoint
    apiRouter.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'CloudOS.Jermis API',
        version: process.env.API_VERSION || 'v1',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Public routes (no authentication required)
    apiRouter.use('/auth', authRoutes);

    // Protected routes (authentication required)
    apiRouter.use('/users', validateApiKey, userRoutes);
    apiRouter.use('/dashboard', validateApiKey, dashboardRoutes);
    apiRouter.use('/timesheet', validateApiKey, timesheetRoutes);
    apiRouter.use('/expenses', validateApiKey, expenseRoutes);
    apiRouter.use('/files', validateApiKey, fileRoutes);
    apiRouter.use('/inventory', validateApiKey, inventoryRoutes);
    apiRouter.use('/shopify', validateApiKey, shopifyRoutes);
    apiRouter.use('/ai', validateApiKey, aiRoutes);

    // Mount API routes
    this.app.use(`/api/${process.env.API_VERSION || 'v1'}`, apiRouter);

    // Serve static files (for file uploads)
    this.app.use('/uploads', express.static('uploads'));

    // API documentation endpoint
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'CloudOS.Jermis API Documentation',
        version: process.env.API_VERSION || 'v1',
        description: 'KI-gestütztes Intranet-System für JERMIS',
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          dashboard: '/api/v1/dashboard',
          timesheet: '/api/v1/timesheet',
          expenses: '/api/v1/expenses',
          files: '/api/v1/files',
          inventory: '/api/v1/inventory',
          shopify: '/api/v1/shopify',
          ai: '/api/v1/ai'
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFound);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await this.prisma.connect();
      this.logger.info('Database connected successfully');

      // Start server
      this.app.listen(this.port, () => {
        this.logger.info(`🚀 CloudOS.Jermis Server running on port ${this.port}`);
        this.logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
        this.logger.info(`📖 API Documentation: http://localhost:${this.port}/api/docs`);
        this.logger.info(`💚 Health Check: http://localhost:${this.port}/api/v1/health`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      this.logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down CloudOS.Jermis Server...');
    
    try {
      await this.prisma.disconnect();
      this.logger.info('Database disconnected successfully');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new CloudOSServer();
server.start().catch(error => {
  console.error('Failed to start CloudOS.Jermis Server:', error);
  process.exit(1);
});

export default CloudOSServer;