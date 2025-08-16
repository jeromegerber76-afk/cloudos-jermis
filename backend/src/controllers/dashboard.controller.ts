import { Request, Response } from 'express';
import { Client } from '@microsoft/microsoft-graph-client';
import { PrismaService } from '@/services/prisma.service';
import { Logger } from '@/utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Constants for SQLite (since enums don't work)
export const NEWS_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED'
} as const;

export const NEWS_PRIORITY = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',
  ACCOUNTING: 'ACCOUNTING',
  WAREHOUSE: 'WAREHOUSE',
  EMPLOYEE: 'EMPLOYEE',
  EXTERNAL: 'EXTERNAL',
  GUEST: 'GUEST'
} as const;

interface OutlookEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
}

export class DashboardController {
  private prisma: PrismaService;
  private logger: Logger;

  constructor() {
    this.prisma = new PrismaService();
    this.logger = new Logger('DashboardController');
  }

  /**
   * Get dashboard overview with news, events, and stats
   */
  public getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get dashboard data in parallel
      const [
        newsArticles,
        upcomingEvents,
        teamStatus,
        userStats,
        pendingApprovals,
        lowStockItems,
        recentActivities
      ] = await Promise.all([
        this.getNewsForUser(userRole),
        this.getUpcomingEvents(userId),
        this.getTeamStatus(),
        this.getUserStats(userId),
        this.getPendingApprovals(userId, userRole),
        this.getLowStockItems(),
        this.getRecentActivities(userId)
      ]);

      res.json({
        success: true,
        dashboard: {
          news: newsArticles,
          upcomingEvents,
          teamStatus,
          userStats,
          pendingApprovals,
          lowStockItems,
          recentActivities,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      this.logger.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load dashboard'
      });
    }
  };

  /**
   * Get news articles for the dashboard
   */
  public getNews = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userRole = req.user!.role;
      const { page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Simplified where clause for SQLite
      const whereClause = {
        status: NEWS_STATUS.PUBLISHED,
        publishedAt: {
          lte: new Date()
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
        // Note: targetRoles filtering will be done in application logic
      };

      const [articles, total] = await Promise.all([
        this.prisma.client.newsArticle.findMany({
          where: whereClause,
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true,
                displayName: true,
                avatar: true
              }
            },
            comments: {
              take: 3,
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: [
            { priority: 'desc' },
            { publishedAt: 'desc' }
          ],
          skip,
          take: Number(limit)
        }),
        this.prisma.client.newsArticle.count({ where: whereClause })
      ]);

      // Filter articles by role in application logic (since SQLite doesn't support JSON queries)
      const filteredArticles = articles.filter(article => {
        if (!article.targetRoles) return true;
        try {
          const targetRoles = article.targetRoles.split(',');
          return targetRoles.includes(userRole);
        } catch {
          return true;
        }
      });

      res.json({
        success: true,
        articles: filteredArticles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      this.logger.error('Get news error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load news'
      });
    }
  };

  /**
   * Create news article
   */
  public createNews = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Only admins and support can create news
      if (![USER_ROLES.ADMIN, USER_ROLES.SUPPORT].includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
        return;
      }

      const {
        title,
        content,
        excerpt,
        priority = NEWS_PRIORITY.NORMAL,
        targetRoles,
        targetUsers,
        featuredImage,
        publishNow = false
      } = req.body;

      if (!title || !content) {
        res.status(400).json({
          success: false,
          error: 'Title and content are required'
        });
        return;
      }

      const article = await this.prisma.client.newsArticle.create({
        data: {
          title,
          content,
          excerpt,
          priority,
          targetRoles: targetRoles ? targetRoles.join(',') : null, // Store as comma-separated string
          targetUsers: targetUsers ? targetUsers.join(',') : null, // Store as comma-separated string
          featuredImage,
          authorId: userId,
          status: publishNow ? NEWS_STATUS.PUBLISHED : NEWS_STATUS.DRAFT,
          publishedAt: publishNow ? new Date() : null
        },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      this.logger.info(`News article created: ${article.title} by ${req.user!.email}`);

      res.status(201).json({
        success: true,
        article
      });

    } catch (error) {
      this.logger.error('Create news error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create news article'
      });
    }
  };

  /**
   * Get upcoming calendar events from Outlook
   */
  public getCalendarEvents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // This would require user's access token for Microsoft Graph
      // For now, return mock data or implement token refresh logic
      
      const mockEvents = [
        {
          id: '1',
          subject: 'Team Meeting',
          start: {
            dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            timeZone: 'Europe/Zurich'
          },
          end: {
            dateTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
            timeZone: 'Europe/Zurich'
          },
          location: { displayName: 'Conference Room A' }
        },
        {
          id: '2',
          subject: 'Client Presentation',
          start: {
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            timeZone: 'Europe/Zurich'
          },
          end: {
            dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
            timeZone: 'Europe/Zurich'
          },
          location: { displayName: 'Client Office' }
        }
      ];

      res.json({
        success: true,
        events: mockEvents
      });

    } catch (error) {
      this.logger.error('Get calendar events error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load calendar events'
      });
    }
  };

  /**
   * Get team status (who's online, on vacation, etc.)
   */
  public getTeamStatus = async (): Promise<any[]> => {
    try {
      const users = await this.prisma.client.user.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatar: true,
          department: true,
          position: true,
          lastLogin: true
        },
        orderBy: {
          lastLogin: 'desc'
        },
        take: 20
      });

      return users.map(user => ({
        ...user,
        isOnline: user.lastLogin && 
          new Date().getTime() - new Date(user.lastLogin).getTime() < 15 * 60 * 1000, // 15 minutes
        status: this.getUserPresenceStatus(user.lastLogin)
      }));

    } catch (error) {
      this.logger.error('Get team status error:', error);
      return [];
    }
  };

  // Private helper methods

  private async getNewsForUser(userRole: string) {
    const articles = await this.prisma.client.newsArticle.findMany({
      where: {
        status: NEWS_STATUS.PUBLISHED,
        publishedAt: {
          lte: new Date()
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: 5
    });

    // Filter by role in application logic
    return articles.filter(article => {
      if (!article.targetRoles) return true;
      try {
        const targetRoles = article.targetRoles.split(',');
        return targetRoles.includes(userRole);
      } catch {
        return true;
      }
    });
  }

  private async getUpcomingEvents(userId: string) {
    // Mock implementation - integrate with Microsoft Graph Calendar API
    return [
      {
        id: '1',
        title: 'Team Standup',
        start: new Date(Date.now() + 1 * 60 * 60 * 1000),
        end: new Date(Date.now() + 1.5 * 60 * 60 * 1000),
        location: 'Conference Room A'
      },
      {
        id: '2',
        title: 'Client Meeting',
        start: new Date(Date.now() + 4 * 60 * 60 * 1000),
        end: new Date(Date.now() + 5 * 60 * 60 * 1000),
        location: 'Zoom'
      }
    ];
  }

  private async getUserStats(userId: string) {
    const [timesheetHours, pendingExpenses, recentFiles] = await Promise.all([
      this.prisma.client.timesheet.aggregate({
        where: {
          userId,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: {
          hours: true
        }
      }),
      this.prisma.client.expense.count({
        where: {
          userId,
          status: 'SUBMITTED'
        }
      }),
      this.prisma.client.file.count({
        where: {
          uploadedById: userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    return {
      monthlyHours: timesheetHours._sum.hours || 0,
      pendingExpenses,
      recentUploads: recentFiles
    };
  }

  private async getPendingApprovals(userId: string, userRole: string) {
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPPORT, USER_ROLES.ACCOUNTING].includes(userRole)) {
      return { timesheets: 0, expenses: 0 };
    }

    const [pendingTimesheets, pendingExpenses] = await Promise.all([
      this.prisma.client.timesheet.count({
        where: { status: 'SUBMITTED' }
      }),
      this.prisma.client.expense.count({
        where: { status: 'SUBMITTED' }
      })
    ]);

    return {
      timesheets: pendingTimesheets,
      expenses: pendingExpenses
    };
  }

  private async getLowStockItems() {
    return await this.prisma.client.inventoryItem.findMany({
      where: {
        OR: [
          { status: 'LOW_STOCK' },
          { status: 'OUT_OF_STOCK' }
        ]
      },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        minStock: true,
        status: true
      },
      take: 10
    });
  }

  private async getRecentActivities(userId: string) {
    return await this.prisma.client.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  private getUserPresenceStatus(lastLogin: Date | null): string {
    if (!lastLogin) return 'offline';
    
    const now = new Date().getTime();
    const lastLoginTime = new Date(lastLogin).getTime();
    const diffMinutes = (now - lastLoginTime) / (1000 * 60);

    if (diffMinutes < 5) return 'online';
    if (diffMinutes < 30) return 'away';
    return 'offline';
  }
}