import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  handleApiError,
  getPaginationParams,
} from '@/lib/api-helpers';
import { appointmentSchema } from '@/lib/validations';
import { createLogger } from '@/lib/logger';

const logger = createLogger('appointments');

// GET /api/appointments - List user's appointments
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { skip, limit } = getPaginationParams(req);
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let where: any = { userId: payload.userId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          garage: {
            select: {
              id: true,
              name: true,
              city: true,
              phone: true,
              address: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              nickname: true,
              manufacturer: true,
              model: true,
              year: true,
              licensePlate: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return jsonResponse({ appointments, total });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/appointments - Create new appointment
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    // Validate input
    const validation = appointmentSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { garageId, vehicleId, serviceType, date, time, notes } = validation.data;

    // Verify garage exists
    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: { id: true, isActive: true },
    });

    if (!garage || !garage.isActive) {
      return errorResponse('מוסך לא נמצא או אינו פעיל', 404);
    }

    // Verify vehicle exists and belongs to user
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, userId: true },
    });

    if (!vehicle || vehicle.userId !== payload.userId) {
      return errorResponse('רכב לא נמצא', 404);
    }

    // Parse date
    let appointmentDate: Date;
    if (date.includes('T')) {
      appointmentDate = new Date(date);
    } else {
      appointmentDate = new Date(`${date}T${time}:00`);
    }

    // Validate date is valid
    if (isNaN(appointmentDate.getTime())) {
      return errorResponse('תאריך לא תקין', 400);
    }

    // Check if appointment is in the future
    if (appointmentDate < new Date()) {
      return errorResponse('לא ניתן להזמין תור בתאריך שעבר', 400);
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: payload.userId,
        garageId,
        vehicleId,
        serviceType,
        date: appointmentDate,
        time,
        notes: notes || null,
        status: 'pending',
      },
      include: {
        garage: {
          select: {
            id: true,
            name: true,
            city: true,
            phone: true,
            address: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            nickname: true,
            manufacturer: true,
            model: true,
            year: true,
            licensePlate: true,
          },
        },
      },
    });

    // Send notification to garage owner
    try {
      const garageWithOwner = await prisma.garage.findUnique({
        where: { id: garageId },
        select: { ownerId: true, name: true },
      });
      if (garageWithOwner?.ownerId) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { fullName: true },
        });
        const veh = await prisma.vehicle.findUnique({
          where: { id: vehicleId },
          select: { nickname: true, manufacturer: true, model: true, licensePlate: true },
        });
        const vehicleLabel = veh ? `${veh.nickname || veh.manufacturer + ' ' + veh.model} (${veh.licensePlate})` : '';
        const dateLabel = appointmentDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeLabel = time || appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

        const serviceTypeHeb: Record<string, string> = {
          inspection: 'בדיקה',
          maintenance: 'טיפול',
          repair: 'תיקון',
          test_prep: 'הכנה לטסט',
        };
        const serviceLabel = serviceTypeHeb[serviceType] || serviceType;

        await prisma.notification.create({
          data: {
            userId: garageWithOwner.ownerId,
            type: 'appointment',
            title: `תור חדש — ${user?.fullName || 'לקוח'}`,
            message: `${user?.fullName || 'לקוח'} קבע תור ל${serviceLabel} עבור ${vehicleLabel} בתאריך ${dateLabel} בשעה ${timeLabel}`,
            link: '/garage/appointments',
          },
        });
      }
    } catch (notifError) {
      // Don't fail the appointment creation if notification fails
      logger.warn('Failed to create garage notification', { error: notifError instanceof Error ? notifError.message : String(notifError) });
    }

    return jsonResponse(
      { appointment, message: 'התור נקבע בהצלחה!' },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
