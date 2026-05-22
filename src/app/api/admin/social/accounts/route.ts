/**
 * GET    /api/admin/social/accounts          → list connected social accounts
 * DELETE /api/admin/social/accounts?id=...   → disconnect (soft, isActive=false)
 *
 * Connection itself is done via /api/admin/social/meta/oauth-callback.
 */

import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAdmin,
  jsonResponse,
  handleApiError,
  errorResponse,
} from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const accounts = await prisma.socialAccount.findMany({
      orderBy: [{ isActive: 'desc' }, { platform: 'asc' }],
      select: {
        id: true,
        platform: true,
        accountId: true,
        accountName: true,
        tokenExpiresAt: true,
        isActive: true,
        lastUsedAt: true,
        metadata: true,
        createdAt: true,
        // accessToken intentionally NOT returned
      },
    });
    return jsonResponse({ accounts });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    requireAdmin(req);
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return errorResponse('id חסר', 400);
    const account = await prisma.socialAccount.update({
      where: { id },
      data: { isActive: false },
    });
    return jsonResponse({ account: { id: account.id, isActive: account.isActive } });
  } catch (err) {
    return handleApiError(err);
  }
}
