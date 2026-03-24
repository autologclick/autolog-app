import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  validationErrorResponse,
  handleApiError,
  AuthError,
} from '@/lib/api-helpers';

const updateAppointmentSchema = z.object({
  status: z.enum(['cancelled']),
});

// GET /api/appointments/[id] - Get single appointment
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        garage: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            phone: true,
            email: true,
            rating: true,
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
            mileage: true,
          },
        },
      },
    });

    if (!appointment) {
      return jsonResponse({ error: 'התור לא נמצא' }, 404);
    }

    // Verify ownership
    if (appointment.userId !== payload.userId) {
      throw new AuthError('Forbidden', 403);
    }

    return jsonResponse({ appointment });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/appointments/[id] - Update appointment status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;
    const body = await req.json();

    // Validate input
    const validation = updateAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { status } = validation.data;

    // Get appointment and verify ownership
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!appointment) {
      return jsonResponse({ error: 'התור לא נמצא' }, 404);
    }

    if (appointment.userId !== payload.userId) {
      throw new AuthError('Forbidden', 403);
    }

    // Can't update cancelled appointments
    if (appointment.status === 'cancelled') {
      return jsonResponse(
        { error: 'לא ניתן לעדכן תור מבוטל' },
        400
      );
    }

    // Can't update completed appointments
    if (appointment.status === 'completed') {
      return jsonResponse(
        { error: 'לא ניתן לעדכן תור שהושלם' },
        400
      );
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        garage: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            nickname: true,
            licensePlate: true,
          },
        },
      },
    });

    return jsonResponse({
      appointment: updated,
      message: `התור עודכן ל${status === 'confirmed' ? 'מאושר' : status === 'cancelled' ? 'מבוטל' : 'הושלם'}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/appointments/[id] - Cancel appointment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    // Get appointment and verify ownership
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!appointment) {
      return jsonResponse({ error: 'התור לא נמצא' }, 404);
    }

    if (appointment.userId !== payload.userId) {
      throw new AuthError('Forbidden', 403);
    }

    // Can only cancel pending or confirmed appointments
    if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
      return jsonResponse(
        { error: 'לא ניתן לבטל תור זה' },
        400
      );
    }

    const cancelled = await prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        garage: {
          select: { name: true },
        },
        vehicle: {
          select: { nickname: true },
        },
      },
    });

    return jsonResponse({
      appointment: cancelled,
      message: 'התור בוטל בהצלחה',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
