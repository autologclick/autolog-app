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
  userId?