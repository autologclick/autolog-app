import { NextRequest } from 'next/server';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';
import { queryAuditLogs } from '@/lib/audit-log';

// GET /api/admin/audit-logs - Query audit logs. Immutable: no DELETE handler.
// Admins cannot tamper with their own trail.
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('userId') || undefined;
    const action = (searchParams.get('action') || undefined) as
      | 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'REFRESH_TOKEN' | 'PERMISSION_CHANGE' | 'EXPORT' | 'IMPORT'
      | undefined;
    const resourceType = (searchParams.get('resourceType') || undefined) as
      | 'user' | 'vehicle' | 'inspection' | 'sos_event' | 'appointment' | 'document' | 'expense' | 'garage' | 'permission' | 'session'
      | undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const logs = await queryAuditLogs({ limit, offset, userId, action, resourceType, startDate, endDate });
    return jsonResponse({ logs, count: logs.length });
  } catch (error) {
    return handleApiError(error);
  }
}
