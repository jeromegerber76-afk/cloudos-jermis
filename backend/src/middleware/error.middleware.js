"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.asyncHandler = exports.errorHandler = exports.ErrorMiddleware = void 0;
var logger_1 = require("@/utils/logger");
var ErrorMiddleware = /** @class */ (function () {
    function ErrorMiddleware() {
    }
    ErrorMiddleware.logger = new logger_1.Logger('ErrorMiddleware');
    /**
     * Global error handler
     */
    ErrorMiddleware.handle = function (error, req, res, next) {
        var _a;
        // Log the error
        ErrorMiddleware.logger.error('Unhandled error:', error);
        // Get status code
        var statusCode = error.status || error.statusCode || 500;
        // Determine if we should expose error details
        var isDevelopment = process.env.NODE_ENV === 'development';
        var isClientError = statusCode >= 400 && statusCode < 500;
        // Prepare error response
        var errorResponse = {
            success: false,
            error: 'An error occurred'
        };
        // Handle different types of errors
        if (error.name === 'ValidationError') {
            errorResponse = {
                success: false,
                error: 'Validation failed',
                details: error.details || error.message
            };
        }
        else if (error.name === 'UnauthorizedError' || statusCode === 401) {
            errorResponse = {
                success: false,
                error: 'Unauthorized access'
            };
        }
        else if (error.name === 'ForbiddenError' || statusCode === 403) {
            errorResponse = {
                success: false,
                error: 'Access forbidden'
            };
        }
        else if (error.name === 'NotFoundError' || statusCode === 404) {
            errorResponse = {
                success: false,
                error: 'Resource not found'
            };
        }
        else if (statusCode === 429) {
            errorResponse = {
                success: false,
                error: 'Too many requests',
                retryAfter: (_a = error.details) === null || _a === void 0 ? void 0 : _a.retryAfter
            };
        }
        else if (isClientError) {
            // Client errors (4xx) - safe to expose message
            errorResponse = {
                success: false,
                error: error.message || 'Bad request'
            };
        }
        else {
            // Server errors (5xx) - be careful about exposing details
            if (isDevelopment) {
                errorResponse = {
                    success: false,
                    error: error.message || 'Internal server error',
                    stack: error.stack,
                    details: error.details
                };
            }
            else {
                errorResponse = {
                    success: false,
                    error: 'Internal server error'
                };
            }
        }
        // Add request ID for tracking
        if (req.headers['x-request-id']) {
            errorResponse.requestId = req.headers['x-request-id'];
        }
        // Send error response
        res.status(statusCode).json(errorResponse);
    };
    /**
     * Async error handler wrapper
     */
    ErrorMiddleware.asyncHandler = function (fn) {
        return function (req, res, next) {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    };
    /**
     * Create custom error
     */
    ErrorMiddleware.createError = function (message, statusCode, details) {
        if (statusCode === void 0) { statusCode = 500; }
        var error = new Error(message);
        error.status = statusCode;
        error.details = details;
        return error;
    };
    return ErrorMiddleware;
}());
exports.ErrorMiddleware = ErrorMiddleware;
// Export the error handler function
exports.errorHandler = ErrorMiddleware.handle;
exports.asyncHandler = ErrorMiddleware.asyncHandler;
exports.createError = ErrorMiddleware.createError;
