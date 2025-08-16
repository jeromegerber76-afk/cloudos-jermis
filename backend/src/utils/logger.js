"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var winston_1 = require("winston");
var path_1 = require("path");
// Define log levels
var levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define colors for each level
var colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
// Tell winston that you want to link the colors
winston_1.default.addColors(colors);
// Define which level of logs to show based on environment
var level = function () {
    var env = process.env.NODE_ENV || 'development';
    var isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};
// Format for console output
var consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(function (info) { return "".concat(info.timestamp, " ").concat(info.level, ": ").concat(info.message); }));
// Format for file output
var fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
// Define transports
var transports = [
    // Console transport
    new winston_1.default.transports.Console({
        format: consoleFormat,
    }),
    // File transport for all logs
    new winston_1.default.transports.File({
        filename: path_1.default.join(process.cwd(), 'logs', 'all.log'),
        format: fileFormat,
    }),
    // File transport for error logs only
    new winston_1.default.transports.File({
        filename: path_1.default.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: fileFormat,
    }),
];
// Create the logger
var logger = winston_1.default.createLogger({
    level: level(),
    levels: levels,
    transports: transports,
    // Don't exit on handled exceptions
    exitOnError: false,
});
// Logger class for use throughout the application
var Logger = /** @class */ (function () {
    function Logger(context) {
        this.context = context;
    }
    Logger.prototype.formatMessage = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var formattedArgs = args.length > 0 ? " ".concat(JSON.stringify(args)) : '';
        return "[".concat(this.context, "] ").concat(message).concat(formattedArgs);
    };
    Logger.prototype.debug = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        logger.debug(this.formatMessage.apply(this, __spreadArray([message], args, false)));
    };
    Logger.prototype.info = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        logger.info(this.formatMessage.apply(this, __spreadArray([message], args, false)));
    };
    Logger.prototype.warn = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        logger.warn(this.formatMessage.apply(this, __spreadArray([message], args, false)));
    };
    Logger.prototype.error = function (message, error) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var errorMessage = error instanceof Error
            ? "".concat(message, " - ").concat(error.message, "\nStack: ").concat(error.stack)
            : this.formatMessage.apply(this, __spreadArray([message, error], args, false));
        logger.error("[".concat(this.context, "] ").concat(errorMessage));
    };
    Logger.prototype.http = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        logger.http(this.formatMessage.apply(this, __spreadArray([message], args, false)));
    };
    return Logger;
}());
exports.Logger = Logger;
// Export the default logger instance
exports.default = logger;
