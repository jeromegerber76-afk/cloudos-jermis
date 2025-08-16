"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiVersion = exports.securityHeaders = exports.requestLogger = void 0;
var logger_1 = require("@/utils/logger");
var uuid_1 = require("uuid");
var logger = new logger_1.Logger('RequestLogger');
/**
 * Request logging middleware
 * Logs incoming requests and their duration
 */
var requestLogger = function (req, res, next) {
    // Generate unique request ID
    req.id = (0, uuid_1.v4)();
    req.startTime = Date.now();
    // Add request ID to response headers for tracking
    res.setHeader('X-Request-ID', req.id);
    // Log request start
    logger.http("".concat(req.method, " ").concat(req.originalUrl), {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length')
    });
    // Log response when finished
    var originalSend = res.send;
    res.send = function (data) {
        var duration = Date.now() - (req.startTime || 0);
        logger.http("".concat(req.method, " ").concat(req.originalUrl, " - ").concat(res.statusCode), {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: "".concat(duration, "ms"),
            responseSize: Buffer.byteLength(data || '', 'utf8')
        });
        // Log slow requests (> 1 second)
        if (duration > 1000) {
            logger.warn("Slow request detected: ".concat(req.method, " ").concat(req.originalUrl), {
                requestId: req.id,
                duration: "".concat(duration, "ms")
            });
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.requestLogger = requestLogger;
/**
 * Security headers middleware
 */
var securityHeaders = function (req, res, next) {
    // Remove server information
    res.removeHeader('X-Powered-By');
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Add HSTS in production
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
};
exports.securityHeaders = securityHeaders;
/**
 * API version middleware
 */
var apiVersion = function (version) {
    return function (req, res, next) {
        res.setHeader('API-Version', version);
        next();
    };
};
exports.apiVersion = apiVersion;
