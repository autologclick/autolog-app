import { createLogger } from './logger';
import { NextRequest } from 'next/server';

/**
 * Audit logging system for compliance and accountability
 * Logs all data modifications with full context for audit trails
 *
 * Actions: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, PERMISSION_CHANGE
 */

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'REFRESH_TOKEN'
  | 'PERMISSION_CHANGE'
  | 'EXPORT'
  | 'IMPORT';

export type ResourceType =
  | 'user'
  | 'vehicle'
  | 'inspection'
  | 'sos_event'
  | 'appointment'
  | 'document'
  | 'expense'
  | 'garage'
  | 'permission'
  | 'session';

export interface AuditLogEntry {
  timestamp: string;
  action: AuditAction;
  userId: string;
  resourceType: ResourceType;
  resourceId: string;
  resourceName?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ip: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

const auditLogger = createLogger('security');

/**
 * Extract IP address from NextRequest
 */
function getIpAddress(req?: NextRequest): string {
  if (!req) return 'unknown';
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Extract User Agent from NextRequest
 */
function getUserAgent(req?: NextRequest): string | undefined {
  return req?.headers.get('user-agent') || undefined;
}

/**
 * Log an audit event
 * Use this for all user actions that modify data
 */
export function logAuditEvent(
  action: AuditAction,
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  options?: {
    resourceName?: string;
    changes?: {
      before?: Record<string, any>;
      after?: Record<string, any>;
    };
    ip?: string;
    userAgent?: string;
    status?: 'success' | 'failure';
    errorMessage?: string;
    metadata?: Record<string, any>;
    req?: NextRequest;
  }
): AuditLogEntry {
  const ip = options?.ip || getIpAddress(options?.req);
  const userAgent = options?.userAgent || getUserAgent(options?.req);

  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    resourceType,
    resourceId,
    resourceName: options?.resourceName,
    changes: options?.changes,
    ip,
    userAgent,
    status: options?.status || 'success',
    errorMessage: options?.errorMessage,
    metadata: options?.metadata,
  };

  // Log the audit event
  const level =
    entry.status === 'failure' ||
    action === 'DELETE' ||
    action === 'PERMISSION_CHANGE'
      ? 'warn'
      : 'info';

  const context = sanitizeAuditEntry(entry);

  auditLogger[level](
    `AUDIT: ${action} ${resourceType}/${resourceId} by user ${userId}`,
    context
  );

  // In a production system, also persist to audit log database
  persistAuditLog(entry);

  return entry;
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  action: 'LOGIN' | 'LOGOUT' | 'REFRESH_TOKEN',
  userId: string,
  options?: {
    ip?: string;
    userAgent?: string;
    status?: 'success' | 'failure';
    errorMessage?: string;
    req?: NextRequest;
  }
): AuditLogEntry {
  return logAuditEvent(action, userId, 'session', userId, {
    ...options,
    status: options?.status || 'success',
  });
}

/**
 * Log data creation
 */
export function logCreateEvent(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  data: Record<string, any>,
  options?: {
    resourceName?: string;
    ip?: string;
    req?: NextRequest;
  }
): AuditLogEntry {
  return logAuditEvent('CREATE', userId, resourceType, resourceId, {
    ...options,
    changes: {
      after: sanitizeData(data),
    },
    status: 'success',
  });
}

/**
 * Log data modification
 */
export function logUpdateEvent(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  before: Record<string, any>,
  after: Record<string, any>,
  options?: {
    resourceName?: string;
    ip?: string;
    req?: NextRequest;
  }
): AuditLogEntry {
  return logAuditEvent('UPDATE', userId, resourceType, resourceId, {
    ...options,
    changes: {
      before: sanitizeData(before),
      after: sanitizeData(after),
    },
    status: 'success',
  });
}

/**
 * Log data deletion
 */
export function logDeleteEvent(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  data?: Record<string, any>,
  options?: {
    resourceName?: string;
    ip?: string;
    req?: NextRequest;
  }
): AuditLogEntry {
  return logAuditEvent('DELETE', userId, resourceType, resourceId, {
    ...options,
    changes: {
      before: data ? sanitizeData(data) : undefined,
    },
    status: 'success',
  });
}

/**
 * Log permission changes
 */
export function logPermissionChangeEvent(
  userId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  options?: {
    ip?: string;
    req?: NextRequest;
  }
): AuditLogEntry {
  return logAuditEvent('PERMISSION_CHANGE', userId, 'permission', targetUserId, {
    ...options,
    changes: {
      before: { role: oldRole },
      after: { role: newRole },
    },
    status: 'success',
  });
}

/**
 * Sanitize audit entry to remove sensitive data
 */
function sanitizeAuditEntry(entry: AuditLogEntry): AuditLogEntry {
  const sanitized = { ...entry };

  if (sanitized.changes) {
    sanitized.changes = {
      before: sanitized.changes.before
        ? sanitizeData(sanitized.changes.before)
        : undefined,
      after: sanitized.changes.after
        ? sanitizeData(sanitized.changes.after)
        : undefined,
    };
  }

  return sanitized;
}

/**
 * Sanitize data to remove sensitive fields
 * Redacts passwords, tokens, and credit card information
 */
function sanitizeData(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };
  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'apiKey',
    'secret',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
    'socialSecurityNumber',
  ];

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (
      sensitiveFields.some(
        (field) =>
          lowerKey.includes(field) || lowerKey === field
      )
    ) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Persist audit log to database (stub for future implementation)
 * In production, this would write to an audit log table
 */
async function persistAuditLog(entry: AuditLogEntry): Promise<void> {
  // TODO: Implement actual persistence to database
  // This should store audit logs in a dedicated audit table
  // with proper indexing for userId, resourceType, timestamp
  //
  // Example:
  // await prisma.auditLog.create({
  //   data: {
  //     ...entry,
  //     changes: entry.changes ? JSON.stringify(entry.changes) : null,
  //   },
  // });
}

/**
 * Query audit logs (stub for future implementation)
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  resourceType?: ResourceType;
  resourceId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  // TODO: Implement actual querying from audit log table
  // This would be used for compliance reports and investigations
  return [];
}

/**
 * Export audit logs for compliance/reporting
 */
export async function exportAuditLogs(filters?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<string> {
  // TODO: Generate CSV or JSON export of audit logs
  const logs = await queryAuditLogs({
    startDate: filters?.startDate,
    endDate: filters?.endDate,
    limit: 10000,
  });

  return JSON.stringify(logs, null, 2);
}
