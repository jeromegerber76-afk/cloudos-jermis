"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
var prisma_service_1 = require("@/services/prisma.service");
var logger_1 = require("@/utils/logger");
var client_1 = require("@prisma/client");
var DashboardController = /** @class */ (function () {
    function DashboardController() {
        var _this = this;
        /**
         * Get dashboard overview with news, events, and stats
         */
        this.getDashboard = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var userId, userRole, _a, newsArticles, upcomingEvents, teamStatus, userStats, pendingApprovals, lowStockItems, recentActivities, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = req.user.id;
                        userRole = req.user.role;
                        return [4 /*yield*/, Promise.all([
                                this.getNewsForUser(userRole),
                                this.getUpcomingEvents(userId),
                                this.getTeamStatus(),
                                this.getUserStats(userId),
                                this.getPendingApprovals(userId, userRole),
                                this.getLowStockItems(),
                                this.getRecentActivities(userId)
                            ])];
                    case 1:
                        _a = _b.sent(), newsArticles = _a[0], upcomingEvents = _a[1], teamStatus = _a[2], userStats = _a[3], pendingApprovals = _a[4], lowStockItems = _a[5], recentActivities = _a[6];
                        res.json({
                            success: true,
                            dashboard: {
                                news: newsArticles,
                                upcomingEvents: upcomingEvents,
                                teamStatus: teamStatus,
                                userStats: userStats,
                                pendingApprovals: pendingApprovals,
                                lowStockItems: lowStockItems,
                                recentActivities: recentActivities,
                                lastUpdated: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        this.logger.error('Dashboard error:', error_1);
                        res.status(500).json({
                            success: false,
                            error: 'Failed to load dashboard'
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Get news articles for the dashboard
         */
        this.getNews = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var userRole, _a, _b, page, _c, limit, skip, whereClause, _d, articles, total, error_2;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        userRole = req.user.role;
                        _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c;
                        skip = (Number(page) - 1) * Number(limit);
                        whereClause = {
                            status: client_1.NewsStatus.PUBLISHED,
                            publishedAt: {
                                lte: new Date()
                            },
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gte: new Date() } }
                            ],
                            AND: [
                                {
                                    OR: [
                                        { targetRoles: null },
                                        { targetRoles: { array_contains: userRole } }
                                    ]
                                }
                            ]
                        };
                        return [4 /*yield*/, Promise.all([
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
                                    skip: skip,
                                    take: Number(limit)
                                }),
                                this.prisma.client.newsArticle.count({ where: whereClause })
                            ])];
                    case 1:
                        _d = _e.sent(), articles = _d[0], total = _d[1];
                        res.json({
                            success: true,
                            articles: articles,
                            pagination: {
                                page: Number(page),
                                limit: Number(limit),
                                total: total,
                                pages: Math.ceil(total / Number(limit))
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _e.sent();
                        this.logger.error('Get news error:', error_2);
                        res.status(500).json({
                            success: false,
                            error: 'Failed to load news'
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Create news article
         */
        this.createNews = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var userId, userRole, _a, title, content, excerpt, _b, priority, targetRoles, targetUsers, featuredImage, _c, publishNow, article, error_3;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        userId = req.user.id;
                        userRole = req.user.role;
                        // Only admins and support can create news
                        if (![client_1.UserRole.ADMIN, client_1.UserRole.SUPPORT].includes(userRole)) {
                            res.status(403).json({
                                success: false,
                                error: 'Insufficient permissions'
                            });
                            return [2 /*return*/];
                        }
                        _a = req.body, title = _a.title, content = _a.content, excerpt = _a.excerpt, _b = _a.priority, priority = _b === void 0 ? client_1.NewsPriority.NORMAL : _b, targetRoles = _a.targetRoles, targetUsers = _a.targetUsers, featuredImage = _a.featuredImage, _c = _a.publishNow, publishNow = _c === void 0 ? false : _c;
                        if (!title || !content) {
                            res.status(400).json({
                                success: false,
                                error: 'Title and content are required'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.prisma.client.newsArticle.create({
                                data: {
                                    title: title,
                                    content: content,
                                    excerpt: excerpt,
                                    priority: priority,
                                    targetRoles: targetRoles ? JSON.stringify(targetRoles) : null,
                                    targetUsers: targetUsers ? JSON.stringify(targetUsers) : null,
                                    featuredImage: featuredImage,
                                    authorId: userId,
                                    status: publishNow ? client_1.NewsStatus.PUBLISHED : client_1.NewsStatus.DRAFT,
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
                            })];
                    case 1:
                        article = _d.sent();
                        this.logger.info("News article created: ".concat(article.title, " by ").concat(req.user.email));
                        res.status(201).json({
                            success: true,
                            article: article
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _d.sent();
                        this.logger.error('Create news error:', error_3);
                        res.status(500).json({
                            success: false,
                            error: 'Failed to create news article'
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Get upcoming calendar events from Outlook
         */
        this.getCalendarEvents = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var mockEvents;
            return __generator(this, function (_a) {
                try {
                    mockEvents = [
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
                }
                catch (error) {
                    this.logger.error('Get calendar events error:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to load calendar events'
                    });
                }
                return [2 /*return*/];
            });
        }); };
        /**
         * Get team status (who's online, on vacation, etc.)
         */
        this.getTeamStatus = function () { return __awaiter(_this, void 0, void 0, function () {
            var users, error_4;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.prisma.client.user.findMany({
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
                            })];
                    case 1:
                        users = _a.sent();
                        return [2 /*return*/, users.map(function (user) { return (__assign(__assign({}, user), { isOnline: user.lastLogin &&
                                    new Date().getTime() - new Date(user.lastLogin).getTime() < 15 * 60 * 1000, status: _this.getUserPresenceStatus(user.lastLogin) })); })];
                    case 2:
                        error_4 = _a.sent();
                        this.logger.error('Get team status error:', error_4);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.prisma = new prisma_service_1.PrismaService();
        this.logger = new logger_1.Logger('DashboardController');
    }
    // Private helper methods
    DashboardController.prototype.getNewsForUser = function (userRole) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.client.newsArticle.findMany({
                            where: {
                                status: client_1.NewsStatus.PUBLISHED,
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
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DashboardController.prototype.getUpcomingEvents = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Mock implementation - integrate with Microsoft Graph Calendar API
                return [2 /*return*/, [
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
                    ]];
            });
        });
    };
    DashboardController.prototype.getUserStats = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, timesheetHours, pendingExpenses, recentFiles;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.prisma.client.timesheet.aggregate({
                                where: {
                                    userId: userId,
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
                                    userId: userId,
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
                        ])];
                    case 1:
                        _a = _b.sent(), timesheetHours = _a[0], pendingExpenses = _a[1], recentFiles = _a[2];
                        return [2 /*return*/, {
                                monthlyHours: timesheetHours._sum.hours || 0,
                                pendingExpenses: pendingExpenses,
                                recentUploads: recentFiles
                            }];
                }
            });
        });
    };
    DashboardController.prototype.getPendingApprovals = function (userId, userRole) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, pendingTimesheets, pendingExpenses;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (![client_1.UserRole.ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.ACCOUNTING].includes(userRole)) {
                            return [2 /*return*/, { timesheets: 0, expenses: 0 }];
                        }
                        return [4 /*yield*/, Promise.all([
                                this.prisma.client.timesheet.count({
                                    where: { status: 'SUBMITTED' }
                                }),
                                this.prisma.client.expense.count({
                                    where: { status: 'SUBMITTED' }
                                })
                            ])];
                    case 1:
                        _a = _b.sent(), pendingTimesheets = _a[0], pendingExpenses = _a[1];
                        return [2 /*return*/, {
                                timesheets: pendingTimesheets,
                                expenses: pendingExpenses
                            }];
                }
            });
        });
    };
    DashboardController.prototype.getLowStockItems = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.client.inventoryItem.findMany({
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
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DashboardController.prototype.getRecentActivities = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.client.auditLog.findMany({
                            where: { userId: userId },
                            orderBy: { createdAt: 'desc' },
                            take: 10
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DashboardController.prototype.getUserPresenceStatus = function (lastLogin) {
        if (!lastLogin)
            return 'offline';
        var now = new Date().getTime();
        var lastLoginTime = new Date(lastLogin).getTime();
        var diffMinutes = (now - lastLoginTime) / (1000 * 60);
        if (diffMinutes < 5)
            return 'online';
        if (diffMinutes < 30)
            return 'away';
        return 'offline';
    };
    return DashboardController;
}());
exports.DashboardController = DashboardController;
