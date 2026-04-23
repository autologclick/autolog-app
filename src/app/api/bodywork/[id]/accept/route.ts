import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';

/**
 * PUT /api/bodywork/[id]/accept — User accepts a quote
 * Body: { quoteId: string }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { quoteId } = body;

    if (!quoteId) return errorResponse('חסר מזהה הצעה', 400);

    // Verify request belongs to user
    const request = await prisma.bodyworkRequest.findUnique({ where: { id } });
    if (!request) return errorResponse('בקשה לא נמצאה', 404);
    if (request.userId !== payload.userId && payload.role !== 'admin') {
      return errorResponse('אין הרשאה', 403);
    }
    if (request.status === 'accepted' || request.status === 'completed') {
      return errorResponse('כבר נבחרה הצעה לבקשה זו', 400);
    }

    // Verify quote exists for this request
    const quote = await prisma.bodyworkQuote.findFirst({
      where: { id: quoteId, requestId: id },
    });
    if (!quote) return errorResponse('הצעה לא נמצאה', 404);

    // Accept the quote, reject all others
    await prisma.$transaction([
      // Mark chosen quote as accepted
      prisma.bodyworkQuote.update({
        where: { id: quoteId },
        data: { status: 'accepted' },
      }),
      // Reject all other quotes for this request
      prisma.bodyworkQuote.updateMany({
        where: { requestId: id, id: { not: quoteId } },
        data: { status: 'rejected' },
      }),
      // Update request status
      prisma.bodyworkRequest.update({
        where: { id },
        data: { status: 'accepted', acceptedQuoteId: quoteId },
      }),
    ]);

    return jsonResponse({ success: true, acceptedQuoteId: quoteId });
  } catch (err) {
    return handleApiError(err);
  }
}
