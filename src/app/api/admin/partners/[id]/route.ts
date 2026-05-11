/**
 * Admin Partner detail API
 *
 * GET    /api/admin/partners/:id        → partner details + recent signups
 * PATCH  /api/admin/partners/:id        → update partner (name, status, commission, notes)
 * POST   /api/admin/partners/:id/payout → record a payout (handled via PATCH ?action=payout)
 *
 * Auth: admin-only.
 */

import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAdmin,
  jsonResponse,
  handleApiError,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-helpers';
import { partnerUpdateSchema, partnerPayoutSchema } from '@/lib/validations';
import { recordPayout, unpaidBalance } from '@/lib/services/partner-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    requireAdmin(req);
    const { id } = await context.params;

    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        referrals: {
          select: {
            id: true,
            fullName: true,
            email: true,
            createdAt: true,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!partner) {
      return errorResponse('שותף לא נמצא', 404);
    }

    return jsonResponse({
      partner: {
        ...partner,
        unpaidBalance: unpaidBalance(partner),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    requireAdmin(req);
    const { id } = await context.params;
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner) return errorResponse('שותף לא נמצא', 404);

    // Special-case: record a payout. Uses partnerPayoutSchema instead of partnerUpdateSchema.
    if (action === 'payout') {
      const body = await req.json();
      const validation = partnerPayoutSchema.safeParse(body);
      if (!validation.success) return validationErrorResponse(validation.error);
      await recordPayout({ partnerId: id, amount: validation.data.amount });
      const refreshed = await prisma.partner.findUnique({ where: { id } });
      return jsonResponse({
        partner: { ...refreshed, unpaidBalance: unpaidBalance(refreshed!) },
      });
    }

    // Normal update path
    const body = await req.json();
    const validation = partnerUpdateSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);
    const data = validation.data;

    const updated = await prisma.partner.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.contactName !== undefined ? { contactName: data.contactName || null } : {}),
        ...(data.contactPhone !== undefined ? { contactPhone: data.contactPhone || null } : {}),
        ...(data.contactEmail !== undefined ? { contactEmail: data.contactEmail || null } : {}),
        ...(data.commissionPerSignup !== undefined ? { commissionPerSignup: data.commissionPerSignup } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        // Note: `code` is intentionally NOT updatable here — changing a partner's
        // code would silently break their printed posters. To change a code,
        // archive the partner and create a new one.
      },
    });

    return jsonResponse({
      partner: { ...updated, unpaidBalance: unpaidBalance(updated) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
