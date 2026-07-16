import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, handleApiError, errorResponse } from '@/lib/api-helpers';
import { createShareToken } from '@/lib/share-tokens';

/**
 * POST /api/sos/[id]/share-link
 * Returns a signed public URL for sharing an incident report (e.g. with an insurance agent).
 * Only the owner (or admin) can create one.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const event = await prisma.sosEvent.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!event) return errorResponse('האירוע לא נמצא', 404);
    if (payload.role !== 'admin' && event.userId !== payload.userId) {
      return errorResponse('אין הרשאה', 403);
    }

    const { token, expiresAt } = createShareToken('sos-incident', id);
    const origin = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://autolog.click').replace(/\/$/, '');
    const url = `${origin}/shared/incident/${id}?token=${token}&exp=${expiresAt}`;

    return jsonResponse({ url, expiresAt });
  } catch (error) {
    return handleApiError(error);
  }
}
