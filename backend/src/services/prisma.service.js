"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.PrismaService = void 0;
var client_1 = require("@prisma/client");
var logger_1 = require("@/utils/logger");
var PrismaService = /** @class */ (function () {
    function PrismaService() {
        var _this = this;
        this.logger = new logger_1.Logger('PrismaService');
        this.prisma = new client_1.PrismaClient({
            log: [
                {
                    emit: 'event',
                    level: 'query',
                },
                {
                    emit: 'event',
                    level: 'error',
                },
                {
                    emit: 'event',
                    level: 'info',
                },
                {
                    emit: 'event',
                    level: 'warn',
                },
            ],
            errorFormat: 'minimal',
        });
        // Log database queries in development
        if (process.env.NODE_ENV === 'development') {
            this.prisma.$on('query', function (e) {
                _this.logger.debug("Query: ".concat(e.query));
                _this.logger.debug("Params: ".concat(e.params));
                _this.logger.debug("Duration: ".concat(e.duration, "ms"));
            });
        }
        // Log database errors
        this.prisma.$on('error', function (e) {
            _this.logger.error('Database error:', e);
        });
        // Log database info
        this.prisma.$on('info', function (e) {
            _this.logger.info("Database info: ".concat(e.message));
        });
        // Log database warnings
        this.prisma.$on('warn', function (e) {
            _this.logger.warn("Database warning: ".concat(e.message));
        });
    }
    Object.defineProperty(PrismaService.prototype, "client", {
        /**
         * Get Prisma client instance
         */
        get: function () {
            return this.prisma;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Connect to database
     */
    PrismaService.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.prisma.$connect()];
                    case 1:
                        _a.sent();
                        this.logger.info('Successfully connected to database');
                        // Test the connection
                        return [4 /*yield*/, this.prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1"], ["SELECT 1"])))];
                    case 2:
                        // Test the connection
                        _a.sent();
                        this.logger.info('Database connection test passed');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.logger.error('Failed to connect to database:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Disconnect from database
     */
    PrismaService.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.prisma.$disconnect()];
                    case 1:
                        _a.sent();
                        this.logger.info('Successfully disconnected from database');
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        this.logger.error('Error disconnecting from database:', error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check database health
     */
    PrismaService.prototype.healthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var start, latency, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        start = Date.now();
                        return [4 /*yield*/, this.prisma.$queryRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["SELECT 1"], ["SELECT 1"])))];
                    case 1:
                        _a.sent();
                        latency = Date.now() - start;
                        return [2 /*return*/, {
                                status: 'healthy',
                                latency: latency
                            }];
                    case 2:
                        error_3 = _a.sent();
                        this.logger.error('Database health check failed:', error_3);
                        return [2 /*return*/, {
                                status: 'unhealthy',
                                latency: -1
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute database transaction
     */
    PrismaService.prototype.transaction = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.prisma.$transaction(fn)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_4 = _a.sent();
                        this.logger.error('Transaction failed:', error_4);
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get singleton instance
     */
    PrismaService.getInstance = function () {
        if (!PrismaService.instance) {
            PrismaService.instance = new PrismaService();
        }
        return PrismaService.instance;
    };
    /**
     * Seed database with initial data
     */
    PrismaService.prototype.seedDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var adminExists, newsExists, projectExists, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        this.logger.info('Starting database seeding...');
                        return [4 /*yield*/, this.prisma.user.findFirst({
                                where: { role: 'ADMIN' }
                            })];
                    case 1:
                        adminExists = _a.sent();
                        if (!!adminExists) return [3 /*break*/, 3];
                        // Create default admin user
                        return [4 /*yield*/, this.prisma.user.create({
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
                            })];
                    case 2:
                        // Create default admin user
                        _a.sent();
                        this.logger.info('Admin user created');
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.prisma.newsArticle.findFirst()];
                    case 4:
                        newsExists = _a.sent();
                        if (!(!newsExists && adminExists)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.prisma.newsArticle.create({
                                data: {
                                    title: 'Welcome to CloudOS.Jermis!',
                                    content: 'Welcome to your new intranet system. This is a sample news article to get you started.',
                                    excerpt: 'Welcome message for the new intranet system',
                                    status: 'PUBLISHED',
                                    priority: 'HIGH',
                                    publishedAt: new Date(),
                                    authorId: adminExists.id
                                }
                            })];
                    case 5:
                        _a.sent();
                        this.logger.info('Sample news article created');
                        _a.label = 6;
                    case 6: return [4 /*yield*/, this.prisma.project.findFirst()];
                    case 7:
                        projectExists = _a.sent();
                        if (!!projectExists) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.prisma.project.createMany({
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
                            })];
                    case 8:
                        _a.sent();
                        this.logger.info('Sample projects created');
                        _a.label = 9;
                    case 9:
                        this.logger.info('Database seeding completed successfully');
                        return [3 /*break*/, 11];
                    case 10:
                        error_5 = _a.sent();
                        this.logger.error('Database seeding failed:', error_5);
                        throw error_5;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    return PrismaService;
}());
exports.PrismaService = PrismaService;
var templateObject_1, templateObject_2;
