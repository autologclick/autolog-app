import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { notifyAdmins } from '@/lib/services/notification-service';
import { Prisma } from '@prisma/client';
import { requireAuth, jsonResponse, errorResponse, handleApiError, getPaginationParams, paginationMeta, validationErrorResponse } from '@/lib/api-helpers';
import { sosEventSchema } from '@/lib/validations';
import { NOT_FOUND } from '@/lib/messages';

// GET /api/sos - List user's SOS events
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { page, skip, limit } = getPaginationParams(req);

    const where: Prisma.SosEventWhereInput = {};
    if (payload.role === 'user') {
      where.userId = payload.userId;
    }
    // admin sees all

    const [events, total] = await Promise.all([
      prisma.sosEvent.findMany({
        where,
        include: {
          vehicle: { select: { nickname: true, licensePlate: true, model: true } },
          user: { select: { fullName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sosEvent.count({ where }),
    ]);

    return jsonResponse({ events, ...paginationMeta(total, page, limit) });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/sos - Report new SOS event
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    // Validate input with Zod
    const validation = sosEventSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { vehicleId, eventType, description, location, latitude, longitude } = validation.data;

    // If vehicleId provided, verify ownership. Otherwise use primary vehicle.
    let vehicle;
    if (vehicleId) {
      vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, userId: payload.userId },
      });
    } else {
      vehicle = await prisma.vehicle.findFirst({
        where: { userId: payload.userId },
        orderBy: { isPrimary: 'desc' },
      });
    }
    if (!vehicle) return errorResponse('×× × ××¦× ×¨××. ××© ××××¡××£ ×¨×× ×ª××××.', 404);

    const event = await prisma.sosEvent.create({
      data: {
        userId: payload.userId,
        vehicleId: vehicle.id,
        eventType,
        description: description || null,
        location: location || null,
        latitude: latitude || null,
        longitude: longitude || null,
        status: 'open',
        priority: eventType === 'accident' ? 'critical' : 'medium',
      },
    });

    // Create notification for admins
    await notifyAdmins(
      'sos',
      'אירוע SOS חדש!',
      `${vehicle.nickname} (${vehicle.licensePlate}) - ${eventType}`,
      `/admin/sos/${event.id}`,
    )

    return jsonResponse({ event, message: '×××¨××¢ SOS ×××× ×××¦×××. ×¦×××ª ×©×× × ×××¨×!' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
