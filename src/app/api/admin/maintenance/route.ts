import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { logAuditEvent } from '@/lib/audit-log';

// GET /api/admin/maintenance - current state
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const row = await prisma.maintenanceMode.findFirst();
    return jsonResponse({
      enabled: row?.enabled ?? false,
      message: row?.message || '',
      enabledBy: row?.enabledBy || null,
      updatedAt: row?.updatedAt || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/admin/maintenance - toggle
export async function POST(req: NextRequest) {
  try {
    const payload = requireAdmin(req);
    const body = await req.json();
    const enabled = Boolean(body.enabled);
    const message = typeof body.message === 'string' ? body.message.slice(0, 500) : '';

    const existing = await prisma.maintenanceMode.findFirst();
    const row = existing
      ? await prisma.maintenanceMode.update({
          where: { id: existing.id },
          data: { enabled, message, enabledBy: payload.userId },
        })
      : await prisma.maintenanceMode.create({
          data: { enabled, message, enabledBy: payload.userId },
        });

    try {
      logAuditEvent(
        'UPDATE',
        payload.userId,
        'system',
        row.id,
        { metadata: { enabled, message, op: enabled ? 'maintenance.enable' : 'maintenance.disable' }, req }
      );
    } catch { /* non-fatal */ }

    return jsonResponse({ enabled: row.enabled, message: row.message });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'שגיאה', 500);
  }
}
