import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireGarageOwner, jsonResponse, handleApiError, getPaginationParams, paginationMeta } from '@/lib/api-helpers';

// GET /api/garage/appointments - Get appointments for garage owned by current user
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);
    const { page, skip, limit } = getPaginationParams(req);

    // Find garage owned by current user
    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
    });

    if (!garage) {
      return jsonResponse({ appointments: [], total: 0 });
    }

    // Get appointments for this garage
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: { garageId: garage.id },
        include: {
          vehicle: {
            select: {
              nickname: true,
              licensePlate: true,
              model: true,
            },
          },
          user: {
            select: {
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: { date: 'asc' },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where: { garageId: garage.id } }),
    ]);

    return jsonResponse({ appointments, ...paginationMeta(total, page, limit) });
  } catch (error) {
    return handleApiError(error);
  }
}
