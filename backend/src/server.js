"use strict";
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
var express_1 = require("express");
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var compression_1 = require("compression");
var morgan_1 = require("morgan");
var dotenv_1 = require("dotenv");
var express_rate_limit_1 = require("express-rate-limit");
// Import routes
var auth_routes_1 = require("@/routes/auth.routes");
var user_routes_1 = require("@/routes/user.routes");
var dashboard_routes_1 = require("@/routes/dashboard.routes");
var timesheet_routes_1 = require("@/routes/timesheet.routes");
var expense_routes_1 = require("@/routes/expense.routes");
var file_routes_1 = require("@/routes/file.routes");
var inventory_routes_1 = require("@/routes/inventory.routes");
var shopify_routes_1 = require("@/routes/shopify.routes");
var ai_routes_1 = require("@/routes/ai.routes");
// Import middleware
var error_middleware_1 = require("@/middleware/error.middleware");
var notFound_middleware_1 = require("@/middleware/notFound.middleware");
var logger_middleware_1 = require("@/middleware/logger.middleware");
var auth_middleware_1 = require("@/middleware/auth.middleware");
// Import services
var prisma_service_1 = require("@/services/prisma.service");
var logger_1 = require("@/utils/logger");
// Load environment variables
dotenv_1.default.config();
var CloudOSServer = /** @class */ (function () {
    function CloudOSServer() {
        this.app = (0, express_1.default)();
        this.port = parseInt(process.env.PORT || '3001', 10);
        this.prisma = new prisma_service_1.PrismaService();
        this.logger = new logger_1.Logger('CloudOSServer');
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    CloudOSServer.prototype.initializeMiddleware = function () {
        var _a;
        // Security middleware
        this.app.use((0, helmet_1.default)({
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
        this.app.use((0, cors_1.default)({
            origin: ((_a = process.env.CORS_ORIGIN) === null || _a === void 0 ? void 0 : _a.split(',')) || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
        }));
        // Rate limiting
        var limiter = (0, express_rate_limit_1.default)({
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
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Logging middleware
        if (process.env.NODE_ENV !== 'test') {
            this.app.use((0, morgan_1.default)('combined'));
        }
        this.app.use(logger_middleware_1.requestLogger);
        // Trust proxy (for Azure deployment)
        this.app.set('trust proxy', 1);
    };
    CloudOSServer.prototype.initializeRoutes = function () {
        var apiRouter = express_1.default.Router();
        // Health check endpoint
        apiRouter.get('/health', function (req, res) {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                service: 'CloudOS.Jermis API',
                version: process.env.API_VERSION || 'v1',
                environment: process.env.NODE_ENV || 'development'
            });
        });
        // Public routes (no authentication required)
        apiRouter.use('/auth', auth_routes_1.default);
        // Protected routes (authentication required)
        apiRouter.use('/users', auth_middleware_1.validateApiKey, user_routes_1.default);
        apiRouter.use('/dashboard', auth_middleware_1.validateApiKey, dashboard_routes_1.default);
        apiRouter.use('/timesheet', auth_middleware_1.validateApiKey, timesheet_routes_1.default);
        apiRouter.use('/expenses', auth_middleware_1.validateApiKey, expense_routes_1.default);
        apiRouter.use('/files', auth_middleware_1.validateApiKey, file_routes_1.default);
        apiRouter.use('/inventory', auth_middleware_1.validateApiKey, inventory_routes_1.default);
        apiRouter.use('/shopify', auth_middleware_1.validateApiKey, shopify_routes_1.default);
        apiRouter.use('/ai', auth_middleware_1.validateApiKey, ai_routes_1.default);
        // Mount API routes
        this.app.use("/api/".concat(process.env.API_VERSION || 'v1'), apiRouter);
        // Serve static files (for file uploads)
        this.app.use('/uploads', express_1.default.static('uploads'));
        // API documentation endpoint
        this.app.get('/api/docs', function (req, res) {
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
    };
    CloudOSServer.prototype.initializeErrorHandling = function () {
        // 404 handler
        this.app.use(notFound_middleware_1.notFound);
        // Global error handler
        this.app.use(error_middleware_1.errorHandler);
    };
    CloudOSServer.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Connect to database
                        return [4 /*yield*/, this.prisma.connect()];
                    case 1:
                        // Connect to database
                        _a.sent();
                        this.logger.info('Database connected successfully');
                        // Start server
                        this.app.listen(this.port, function () {
                            _this.logger.info("\uD83D\uDE80 CloudOS.Jermis Server running on port ".concat(_this.port));
                            _this.logger.info("\uD83D\uDCF1 Environment: ".concat(process.env.NODE_ENV || 'development'));
                            _this.logger.info("\uD83D\uDCD6 API Documentation: http://localhost:".concat(_this.port, "/api/docs"));
                            _this.logger.info("\uD83D\uDC9A Health Check: http://localhost:".concat(_this.port, "/api/v1/health"));
                        });
                        // Graceful shutdown
                        process.on('SIGTERM', function () { return _this.shutdown(); });
                        process.on('SIGINT', function () { return _this.shutdown(); });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.logger.error('Failed to start server:', error_1);
                        process.exit(1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CloudOSServer.prototype.shutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info('Shutting down CloudOS.Jermis Server...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.prisma.disconnect()];
                    case 2:
                        _a.sent();
                        this.logger.info('Database disconnected successfully');
                        process.exit(0);
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        this.logger.error('Error during shutdown:', error_2);
                        process.exit(1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return CloudOSServer;
}());
// Start the server
var server = new CloudOSServer();
server.start().catch(function (error) {
    console.error('Failed to start CloudOS.Jermis Server:', error);
    process.exit(1);
});
exports.default = CloudOSServer;
