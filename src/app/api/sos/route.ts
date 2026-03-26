import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireAuth, jsonResponse, errorResponse, handleApiError, getPaginationParams, paginationMeta, validationErrorResponse } from '@/lib/api-helpers';
import { sosEventSchema } from '@/lib/validations';

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
    if (!vehicle) return errorResponse('לא נמצא רכב. יש להוסיף רכב תחילה.', 404);

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

    // Create notification for admin
    const admins = await prisma.user.findMany({ where: { role: 'admin' } });
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: 'sos',
        title: 'אירוע SOS חדש!',
        message: `${vehicle.nickname} (${vehicle.licensePlate}) - ${eventType}`,
        link: `/admin/sos/${event.id}`,
      })),
    });

    return jsonResponse({ event, message: 'אירוע SOS דווח בהצלחה. צוות שלנו בדרך!' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
