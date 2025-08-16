import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level of logs to show based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'all.log'),
    format: fileFormat,
  }),
  
  // File transport for error logs only
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: fileFormat,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Logger class for use throughout the application
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(message: string, ...args: any[]): string {
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    return `[${this.context}] ${message}${formattedArgs}`;
  }

  debug(message: string, ...args: any[]): void {
    logger.debug(this.formatMessage(message, ...args));
  }

  info(message: string, ...args: any[]): void {
    logger.info(this.formatMessage(message, ...args));
  }

  warn(message: string, ...args: any[]): void {
    logger.warn(this.formatMessage(message, ...args));
  }

  error(message: string, error?: Error | any, ...args: any[]): void {
    const errorMessage = error instanceof Error 
      ? `${message} - ${error.message}\nStack: ${error.stack}`
      : this.formatMessage(message, error, ...args);
    
    logger.error(`[${this.context}] ${errorMessage}`);
  }

  http(message: string, ...args: any[]): void {
    logger.http(this.formatMessage(message, ...args));
  }
}

// Export the default logger instance
export default logger;