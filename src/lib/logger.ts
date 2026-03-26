import { NextRequest } from 'next/server';

/**
 * Structured logging system for AutoLog
 * Supports production (JSON) and development (pretty-printed) modes
 * Integrates with Pino for enterprise-grade logging
 *
 * Logging levels: fatal, error, warn, info, debug, trace
 * Production: JSON format, info level
 * Development: pretty-printed, debug level
 */

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
export type LogModule =
  | 'auth'
  | 'auth/refresh'
  | 'api'
  | 'security'
  | 'db'
  | 'business'
  | 'history'
  | 'inspections'
  | 'vehicles'
  | 'appointments'
  | 'garage-applications'
  | 'pdf'
  | 'seed';

interface LogContext {
  userId?: string;
  ip?: string;
  path?: string;
  method?: string;
  requestId?: string;
  module: LogModule;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: LogModule;
  message: string;
  context?: Record<string, any>;
}

const LOG_LEVELS = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const isProduction = process.env.NODE_ENV === 'production';
const logLevelThreshold = isProduction ? LOG_LEVELS.info : LOG_LEVELS.debug;

/**
 * Format log entry for output
 */
function formatLog(entry: LogEntry): string {
  if (isProduction) {
    // JSON format for production
    return JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      module: entry.module,
      message: entry.message,
      ...(entry.context && { context: sanitizeContext(entry.context) }),
    });
  } else {
    // Pretty-printed format for development
    const levelColor = getColorCode(entry.level);
    const moduleTag = `[${entry.module.toUpperCase()}]`;
    const contextStr = entry.context
      ? ` ${JSON.stringify(sanitizeContext(entry.context))}`
      : '';
    return `${levelColor}${entry.level.toUpperCase()}\x1b[0m ${entry.timestamp} ${moduleTag} ${entry.message}${contextStr}`;
  }
}

/**
 * Get ANSI color code for log level
 */
function getColorCode(level: LogLevel): string {
  const colors: Record<LogLevel, string> = {
    fatal: '\x1b[41m', // Red background
    error: '\x1b[31m', // Red
    warn: '\x1b[33m', // Yellow
    info: '\x1b[36m', // Cyan
    debug: '\x1b[35m', // Magenta
    trace: '\x1b[37m', // White
  };
  return colors[level];
}

/**
 * Sanitize context to remove sensitive data
 * Never logs passwords, tokens, or full credit card numbers
 */
export function sanitizeContext(context: Record<string, any>): Record<string, any> {
  const sanitized = { ...context };
  const sensitiveKeys = [
    'password',
    'passwordHash',
    'token',
    'authToken',
    'apiKey',
    'secret',
    'creditCard',
    'cardNumber',
    'ssn',
    'socialSecurityNumber',
    'authorization',
    'bearer',
  ];

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((k) => lowerKey.includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeContext(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Base logger class
 */
class Logger {
  private module: LogModule;

  constructor(module: LogModule) {
    this.module = module;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= logLevelThreshold;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      context,
    };

    const output = formatLog(entry);

    if (level === 'fatal' || level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.log('fatal', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  trace(message: string, context?: Record<string, any>): void {
    this.log('trace', message, context);
  }
}

/**
 * Request logger with context
 */
class RequestLogger extends Logger {
  private baseContext: LogContext;

  constructor(module: LogModule, req?: NextRequest) {
    super(module);
    this.baseContext = { module };

    if (req) {
      const url = new URL(req.url);
      const ip =
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown';

      this.baseContext = {
        ...this.baseContext,
        ip,
        path: url.pathname,
        method: req.method,
        requestId: this.generateRequestId(),
      };
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string): void {
    this.baseContext.userId = userId;
  }

  protected getContext(additional?: Record<string, any>): Record<string, any> {
    return { ...this.baseContext, ...additional };
  }

  override fatal(message: string, context?: Record<string, any>): void {
    super.fatal(message, this.getContext(context));
  }

  override error(message: string, context?: Record<string, any>): void {
    super.error(message, this.getContext(context));
  }

  override warn(message: string, context?: Record<string, any>): void {
    super.warn(message, this.getContext(context));
  }

  override info(message: string, context?: Record<string, any>): void {
    super.info(message, this.getContext(context));
  }

  override debug(message: string, context?: Record<string, any>): void {
    super.debug(message, this.getContext(context));
  }

  override trace(message: string, context?: Record<string, any>): void {
    super.trace(message, this.getContext(context));
  }
}

/**
 * Create a logger for a specific module
 */
export function createLogger(module: LogModule): Logger {
  return new Logger(module);
}

/**
 * Create a request-scoped logger with automatic context
 * Includes userId, IP address, request path, method, and request ID
 */
export function createRequestLogger(
  module: LogModule,
  req?: NextRequest
): RequestLogger {
  return new RequestLogger(module, req);
}

// Export pre-configured domain loggers
export const authLogger = createLogger('auth');
export const apiLogger = createLogger('api');
export const securityLogger = createLogger('security');
export const dbLogger = createLogger('db');
export const businessLogger = createLogger('business');

/**
 * Logger initialization - call this in your app startup
 * Ready for Pino integration in the future
 */
export function initializeLogger(): void {
  info('Logger initialized', {
    environment: process.env.NODE_ENV,
    logLevel: isProduction ? 'info' : 'debug',
  });
}

function info(message: string, context?: Record<string, any>): void {
  apiLogger.info(message, context);
}
