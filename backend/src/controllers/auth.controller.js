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
exports.AuthController = void 0;
var jsonwebtoken_1 = require("jsonwebtoken");
var msal_node_1 = require("@azure/msal-node");
var microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
var prisma_service_1 = require("@/services/prisma.service");
var logger_1 = require("@/utils/logger");
var client_1 = require("@prisma/client");
var AuthController = /** @class */ (function () {
    function AuthController() {
        var _this = this;
        /**
         * Get Azure AD authorization URL
         */
        this.getAuthUrl = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var authCodeUrlParameters, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        authCodeUrlParameters = {
                            scopes: ['user.read', 'profile', 'openid', 'email'],
                            redirectUri: process.env.AZURE_REDIRECT_URI,
                            state: this.generateState(),
                        };
                        return [4 /*yield*/, this.msalInstance.getAuthCodeUrl(authCodeUrlParameters)];
                    case 1:
                        response = _a.sent();
                        res.json({
                            success: true,
                            authUrl: response,
                            state: authCodeUrlParameters.state
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.logger.error('Error generating auth URL:', error_1);
                        res.status(500).json({
                            success: false,
                            error: 'Failed to generate authentication URL'
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Handle Azure AD callback and create/update user
         */
        this.handleCallback = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var _a, code, state, tokenRequest, response_1, graphClient, userInfo, user, jwtToken, frontendUrl, error_2, frontendUrl;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        _a = req.query, code = _a.code, state = _a.state;
                        if (!code || typeof code !== 'string') {
                            throw new Error('Authorization code not provided');
                        }
                        tokenRequest = {
                            code: code,
                            scopes: ['user.read', 'profile', 'openid', 'email'],
                            redirectUri: process.env.AZURE_REDIRECT_URI,
                        };
                        return [4 /*yield*/, this.msalInstance.acquireTokenByCode(tokenRequest)];
                    case 1:
                        response_1 = _b.sent();
                        if (!response_1) {
                            throw new Error('Failed to acquire token');
                        }
                        graphClient = microsoft_graph_client_1.Client.init({
                            authProvider: function (done) {
                                done(null, response_1.accessToken);
                            },
                        });
                        return [4 /*yield*/, graphClient.api('/me').get()];
                    case 2:
                        userInfo = _b.sent();
                        return [4 /*yield*/, this.createOrUpdateUser(userInfo)];
                    case 3:
                        user = _b.sent();
                        jwtToken = this.generateJwtToken(user);
                        // Create session
                        return [4 /*yield*/, this.createSession(user.id, jwtToken)];
                    case 4:
                        // Create session
                        _b.sent();
                        // Log successful login
                        this.logger.info("User logged in: ".concat(user.email));
                        frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
                        res.redirect("".concat(frontendUrl, "/auth/callback?token=").concat(jwtToken, "&user=").concat(encodeURIComponent(JSON.stringify({
                            id: user.id,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role
                        }))));
                        return [3 /*break*/, 6];
                    case 5:
                        error_2 = _b.sent();
                        this.logger.error('Authentication callback error:', error_2);
                        frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
                        res.redirect("".concat(frontendUrl, "/auth/error?message=").concat(encodeURIComponent('Authentication failed')));
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Login with email and password (for non-Azure users)
         */
        this.login = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var _a, email, password, user, token, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        _a = req.body, email = _a.email, password = _a.password;
                        if (!email || !password) {
                            res.status(400).json({
                                success: false,
                                error: 'Email and password are required'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.prisma.client.user.findUnique({
                                where: { email: email.toLowerCase() }
                            })];
                    case 1:
                        user = _b.sent();
                        if (!user || user.status !== client_1.UserStatus.ACTIVE) {
                            res.status(401).json({
                                success: false,
                                error: 'Invalid credentials or inactive account'
                            });
                            return [2 /*return*/];
                        }
                        // For demo purposes - in production, use proper password hashing
                        if (user.password !== password) {
                            res.status(401).json({
                                success: false,
                                error: 'Invalid credentials'
                            });
                            return [2 /*return*/];
                        }
                        // Update login statistics
                        return [4 /*yield*/, this.prisma.client.user.update({
                                where: { id: user.id },
                                data: {
                                    lastLogin: new Date(),
                                    loginCount: user.loginCount + 1
                                }
                            })];
                    case 2:
                        // Update login statistics
                        _b.sent();
                        token = this.generateJwtToken(user);
                        // Create session
                        return [4 /*yield*/, this.createSession(user.id, token)];
                    case 3:
                        // Create session
                        _b.sent();
                        this.logger.info("User logged in: ".concat(user.email));
                        res.json({
                            success: true,
                            token: token,
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
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _b.sent();
                        this.logger.error('Login error:', error_3);
                        res.status(500).json({
                            success: false,
                            error: 'Login failed'
                        });
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Logout user
         */
        this.logout = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var token, error_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
                        if (!token) return [3 /*break*/, 2];
                        // Remove session from database
                        return [4 /*yield*/, this.prisma.client.session.deleteMany({
                                where: { sessionToken: token }
                            })];
                    case 1:
                        // Remove session from database
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        res.json({
                            success: true,
                            message: 'Logged out successfully'
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _b.sent();
                        this.logger.error('Logout error:', error_4);
                        res.status(500).json({
                            success: false,
                            error: 'Logout failed'
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Get current user profile
         */
        this.getProfile = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var user, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.prisma.client.user.findUnique({
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
                            })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            res.status(404).json({
                                success: false,
                                error: 'User not found'
                            });
                            return [2 /*return*/];
                        }
                        res.json({
                            success: true,
                            user: user
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        this.logger.error('Get profile error:', error_5);
                        res.status(500).json({
                            success: false,
                            error: 'Failed to get user profile'
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Verify JWT token
         */
        this.verifyToken = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var token, decoded, session, error_6;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
                        if (!token) {
                            res.status(401).json({
                                success: false,
                                error: 'No token provided'
                            });
                            return [2 /*return*/];
                        }
                        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                        return [4 /*yield*/, this.prisma.client.session.findUnique({
                                where: { sessionToken: token },
                                include: { user: true }
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
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _b.sent();
                        res.status(401).json({
                            success: false,
                            error: 'Invalid token'
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.prisma = new prisma_service_1.PrismaService();
        this.logger = new logger_1.Logger('AuthController');
        // Initialize MSAL (Microsoft Authentication Library)
        this.msalInstance = new msal_node_1.ConfidentialClientApplication({
            auth: {
                clientId: process.env.AZURE_CLIENT_ID,
                clientSecret: process.env.AZURE_CLIENT_SECRET,
                authority: process.env.AZURE_AUTHORITY,
            },
        });
    }
    // Private helper methods
    AuthController.prototype.createOrUpdateUser = function (userInfo) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.client.user.findUnique({
                            where: { azureId: userInfo.id }
                        })];
                    case 1:
                        existingUser = _a.sent();
                        if (!existingUser) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.prisma.client.user.update({
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
                            })];
                    case 2: 
                    // Update existing user
                    return [2 /*return*/, _a.sent()];
                    case 3: return [4 /*yield*/, this.prisma.client.user.create({
                            data: {
                                azureId: userInfo.id,
                                email: userInfo.mail || userInfo.userPrincipalName,
                                firstName: userInfo.givenName,
                                lastName: userInfo.surname,
                                displayName: userInfo.displayName,
                                department: userInfo.department,
                                position: userInfo.jobTitle,
                                role: client_1.UserRole.EMPLOYEE, // Default role
                                status: client_1.UserStatus.ACTIVE,
                                isEmailVerified: true,
                                emailVerifiedAt: new Date(),
                                lastLogin: new Date(),
                                loginCount: 1
                            }
                        })];
                    case 4: 
                    // Create new user
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthController.prototype.generateJwtToken = function (user) {
        return jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });
    };
    AuthController.prototype.createSession = function (userId, token) {
        return __awaiter(this, void 0, void 0, function () {
            var expiresAt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expiresAt = new Date();
                        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
                        return [4 /*yield*/, this.prisma.client.session.create({
                                data: {
                                    sessionToken: token,
                                    userId: userId,
                                    expires: expiresAt
                                }
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    AuthController.prototype.generateState = function () {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    };
    return AuthController;
}());
exports.AuthController = AuthController;
