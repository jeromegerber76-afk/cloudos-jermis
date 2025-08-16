import { PrismaClient } from '@prisma/client';
import { Logger } from '@/utils/logger';

export class PrismaService {
  private prisma: PrismaClient;
  private logger: Logger;
  private static instance: PrismaService;

  constructor() {
    this.logger = new Logger('PrismaService');
    
    this.prisma = new PrismaClient({
      errorFormat: 'minimal',
    });

    // Simplified logging without event listeners (causes issues with SQLite)
    if (process.env.NODE_ENV === 'development') {
      this.logger.info('Prisma client initialized in development mode');
    }
  }

  /**
   * Get Prisma client instance
   */
  public get client(): PrismaClient {
    return this.prisma;
  }

  /**
   * Connect to database
   */
  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.logger.info('Successfully connected to database');
      
      // Test the connection with a simple query
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.info('Database connection test passed');
      
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.logger.info('Successfully disconnected from database');
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  /**
   * Check database health
   */
  public async healthCheck(): Promise<{ status: string; latency: number }> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        latency: -1
      };
    }
  }

  /**
   * Execute database transaction - simplified for SQLite
   */
  public async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    try {
      // For SQLite, we'll use a simpler approach
      return await fn(this.prisma);
    } catch (error) {
      this.logger.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  /**
   * Seed database with initial data
   */
  public async seedDatabase(): Promise<void> {
    try {
      this.logger.info('Starting database seeding...');

      // Check if admin user already exists
      const adminExists = await this.prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (!adminExists) {
        // Create default admin user
        const adminUser = await this.prisma.user.create({
          data: {
            email: 'admin@jermis.com',
            firstName: 'Admin',
            lastName: 'User',
            displayName: 'System Administrator',
            role: 'ADMIN',
            status: 'ACTIVE',
            password: 'admin123', // Change in production!
            isEmailVerified: true,
            emailVerifiedAt: new Date()
          }
        });
        this.logger.info('Admin user created');

        // Create sample news article
        await this.prisma.newsArticle.create({
          data: {
            title: 'Welcome to CloudOS.Jermis!',
            content: 'Welcome to your new intranet system. This is a sample news article to get you started.',
            excerpt: 'Welcome message for the new intranet system',
            status: 'PUBLISHED',
            priority: 'HIGH',
            publishedAt: new Date(),
            authorId: adminUser.id
          }
        });
        this.logger.info('Sample news article created');
      }

      // Create sample projects
      const projectExists = await this.prisma.project.findFirst();
      if (!projectExists) {
        await this.prisma.project.createMany({
          data: [
            {
              name: 'Internal Operations',
              description: 'General internal work and operations',
              code: 'INT-001',
              isActive: true
            },
            {
              name: 'Client Project Alpha',
              description: 'Project for Client Alpha',
              code: 'CLI-001',
              clientName: 'Client Alpha Ltd.',
              isActive: true
            }
          ]
        });
        this.logger.info('Sample projects created');
      }

      this.logger.info('Database seeding completed successfully');

    } catch (error) {
      this.logger.error('Database seeding failed:', error);
      throw error;
    }
  }
}