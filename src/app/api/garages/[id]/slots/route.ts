import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

/**
 * GET /api/garages/[id]/slots?date=2026-04-20
 *
 * Returns booked (unavailable) time slots for a garage on a specific date.
 * Only counts appointments that are not cancelled.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAuth(req);
    const { id: garageId } = params;
    const url = new URL(req.url);
    const dateStr = url.searchParams.get('date');

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return errorResponse('נא לספק תאריך בפורמט YYYY-MM-DD', 400);
    }

    // Find all non-cancelled appointments for this garage on this date
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const appointments = await prisma.appointment.findMany({
      where: {
        garageId,
        date: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['cancelled', 'rejected'] },
      },
      select: { time: true },
    });

    const bookedSlots = appointments.map(a => a.time);

    return jsonResponse({ bookedSlots });
  } catch (error) {
    return handleApiError(error);
  }
}
