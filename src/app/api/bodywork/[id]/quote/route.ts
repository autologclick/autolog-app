import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';

/**
 * POST /api/bodywork/[id]/quote — Garage submits a quote for a bodywork request
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    if (payload.role !== 'garage_owner' && payload.role !== 'admin') {
      return errorResponse('רק מוסכים יכולים לשלוח הצעות מחיר', 403);
    }

    const garage = await prisma.garage.findUnique({ where: { ownerId: payload.userId } });
    if (!garage) return errorResponse('מוסך לא נמצא', 404);

    // Only garages offering bodywork can submit quotes
    const services: string[] = garage.services ? JSON.parse(garage.services) : [];
    const hasBodywork = services.some(s => s === 'bodywork' || s.includes('פחחות'));
    if (!hasBodywork) {
      return errorResponse('המוסך שלך לא מציע שירותי פחחות', 403);
    }

    // Verify request exists and is open
    const request = await prisma.bodyworkRequest.findUnique({ where: { id } });
    if (!request) return errorResponse('בקשה לא נמצאה', 404);
    if (request.status === 'cancelled' || request.status === 'closed') {
      return errorResponse('הבקשה כבר סגורה', 400);
    }

    // Check if garage already quoted
    const existingQuote = await prisma.bodyworkQuote.findUnique({
      where: { requestId_garageId: { requestId: id, garageId: garage.id } },
    });
    if (existingQuote) {
      return errorResponse('כבר שלחת הצעה לבקשה זו', 400);
    }

    const body = await req.json();
    const { price, estimatedDays, notes, warranty } = body;

    if (!price || price <= 0) {
      return errorResponse('יש להזין מחיר תקין', 400);
    }

    const quote = await prisma.bodyworkQuote.create({
      data: {
        requestId: id,
        garageId: garage.id,
        price,
        estimatedDays: estimatedDays || null,
        notes: notes || null,
        warranty: warranty || null,
      },
      include: {
        garage: { select: { id: true, name: true, city: true, rating: true, reviewCount: true } },
      },
    });

    // Update request status to "quoted" if it was "open"
    if (request.status === 'open') {
      await prisma.bodyworkRequest.update({
        where: { id },
        data: { status: 'quoted' },
      });
    }

    return jsonResponse(quote, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
