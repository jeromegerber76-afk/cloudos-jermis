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
exports.rateLimitSensitive = exports.requireOwnershipOrAdmin = exports.requireWarehouse = exports.requireAccounting = exports.requireAdminOrSupport = exports.requireAdmin = exports.requireRoles = exports.validateApiKey = exports.AuthMiddleware = void 0;
var jsonwebtoken_1 = require("jsonwebtoken");
var prisma_service_1 = require("@/services/prisma.service");
var logger_1 = require("@/utils/logger");
var AuthMiddleware = /** @class */ (function () {
    function AuthMiddleware() {
    }
    /**
     * Log API access for audit trail
     */
    AuthMiddleware.logApiAccess = function (req, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var skipPaths, shouldSkip, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        skipPaths = ['/health', '/auth/verify'];
                        shouldSkip = skipPaths.some(function (path) { return req.path.includes(path); });
                        if (shouldSkip)
                            return [2 /*return*/];
                        return [4 /*yield*/, _a.prisma.client.auditLog.create({
                                data: {
                                    userId: userId,
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
                            })];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        // Don't fail the request if audit logging fails
                        _a.logger.error('Failed to log API access:', error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Rate limiting for sensitive operations
     */
    AuthMiddleware.rateLimitSensitive = function (maxAttempts, windowMs) {
        if (maxAttempts === void 0) { maxAttempts = 5; }
        if (windowMs === void 0) { windowMs = 15 * 60 * 1000; }
        var attempts = new Map();
        return function (req, res, next) {
            var _b;
            var key = req.ip + (((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || 'anonymous');
            var now = Date.now();
            var userAttempts = attempts.get(key);
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
    };
    var _a;
    _a = AuthMiddleware;
    AuthMiddleware.prisma = new prisma_service_1.PrismaService();
    AuthMiddleware.logger = new logger_1.Logger('AuthMiddleware');
    /**
     * Validate JWT token and attach user to request
     */
    AuthMiddleware.validateApiKey = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var authHeader, token, decoded, session, error_2;
        return __generator(_a, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    authHeader = req.headers.authorization;
                    if (!authHeader || !authHeader.startsWith('Bearer ')) {
                        res.status(401).json({
                            success: false,
                            error: 'Access token required'
                        });
                        return [2 /*return*/];
                    }
                    token = authHeader.substring(7);
                    decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                    return [4 /*yield*/, _a.prisma.client.session.findUnique({
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
                        })];
                case 1:
                    session = _b.sent();
                    if (!session || session.expires < new Date()) {
                        res.status(401).json({
                            success: false,
                            error: 'Invalid or expired token'
                        });
                        return [2 /*return*/];
                    }
                    // Check if user is still active
                    if (session.user.status !== 'ACTIVE') {
                        res.status(401).json({
                            success: false,
                            error: 'Account is not active'
                        });
                        return [2 /*return*/];
                    }
                    // Attach user to request
                    req.user = {
                        id: session.user.id,
                        email: session.user.email,
                        role: session.user.role,
                        status: session.user.status
                    };
                    // Log API access for audit trail
                    return [4 /*yield*/, _a.logApiAccess(req, session.user.id)];
                case 2:
                    // Log API access for audit trail
                    _b.sent();
                    next();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _b.sent();
                    if (error_2 instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                        res.status(401).json({
                            success: false,
                            error: 'Invalid token'
                        });
                        return [2 /*return*/];
                    }
                    _a.logger.error('Authentication middleware error:', error_2);
                    res.status(500).json({
                        success: false,
                        error: 'Authentication failed'
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Require specific roles
     */
    AuthMiddleware.requireRoles = function (allowedRoles) {
        return function (req, res, next) {
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
    AuthMiddleware.requireAdmin = _a.requireRoles(['ADMIN']);
    /**
     * Require admin or support role
     */
    AuthMiddleware.requireAdminOrSupport = _a.requireRoles([
        'ADMIN',
        'SUPPORT'
    ]);
    /**
     * Require accounting permissions
     */
    AuthMiddleware.requireAccounting = _a.requireRoles([
        'ADMIN',
        'ACCOUNTING'
    ]);
    /**
     * Require warehouse permissions
     */
    AuthMiddleware.requireWarehouse = _a.requireRoles([
        'ADMIN',
        'WAREHOUSE'
    ]);
    /**
     * Check if user owns resource or has admin permissions
     */
    AuthMiddleware.requireOwnershipOrAdmin = function (userIdField) {
        if (userIdField === void 0) { userIdField = 'userId'; }
        return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
            var resourceUserId;
            return __generator(_a, function (_b) {
                if (!req.user) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return [2 /*return*/];
                }
                // Admins can access everything
                if (req.user.role === 'ADMIN') {
                    next();
                    return [2 /*return*/];
                }
                resourceUserId = req.params[userIdField] || req.body[userIdField];
                if (resourceUserId && resourceUserId !== req.user.id) {
                    res.status(403).json({
                        success: false,
                        error: 'Access denied - you can only access your own resources'
                    });
                    return [2 /*return*/];
                }
                next();
                return [2 /*return*/];
            });
        }); };
    };
    return AuthMiddleware;
}());
exports.AuthMiddleware = AuthMiddleware;
// Export individual middleware functions for easier use
exports.validateApiKey = AuthMiddleware.validateApiKey;
exports.requireRoles = AuthMiddleware.requireRoles;
exports.requireAdmin = AuthMiddleware.requireAdmin;
exports.requireAdminOrSupport = AuthMiddleware.requireAdminOrSupport;
exports.requireAccounting = AuthMiddleware.requireAccounting;
exports.requireWarehouse = AuthMiddleware.requireWarehouse;
exports.requireOwnershipOrAdmin = AuthMiddleware.requireOwnershipOrAdmin;
exports.rateLimitSensitive = AuthMiddleware.rateLimitSensitive;
