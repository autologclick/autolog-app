import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  requireGarageOwner,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import { SERVICE_TYPE_HEB, APPOINTMENT_STATUS_HEB } from '@/lib/constants/translations';

const updateSchema = z.object({
  status: z.enum(['confirmed', 'rejected', 'in_progress', 'completed', 'cancelled']),
  completionNotes: z.string().optional(),
  rejectionReason: z.string().max(300).optional(),
});

// PUT /api/garage/appointments/[id] - Update appointment status (garage owner)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireGarageOwner(req);
    const { id } = params;
    const body = await req.json();

    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { status, completionNotes, rejectionReason } = validation.data;

    // Get appointment and verify garage ownership
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        garage: { select: { id: true, ownerId: true, name: true } },
        vehicle: { select: { id: true, nickname: true, licensePlate: true, model: true, manufacturer: true } },
        user: { select: { id: true, fullName: true } },
      },
    });

    if (!appointment) {
      return errorResponse('××ª××¨ ×× × ××¦×', 404);
    }

    // Verify this garage belongs to the current user
    if (appointment.garage.ownerId !== payload.userId) {
      return errorResponse('××× ××¨×©××', 403);
    }

    // Can't update cancelled, rejected, or already completed appointments
    if (appointment.status === 'cancelled' || appointment.status === 'rejected') {
      return errorResponse('×× × ××ª× ××¢××× ×ª××¨ ×©×××× ×× × ×××', 400);
    }
    if (appointment.status === 'completed') {
      return errorResponse('××ª××¨ ×××¨ ×××©××', 400);
    }

    // For confirm/reject: check 3-minute response window
    if ((status === 'confirmed' || status === 'rejected') && appointment.status === 'pending') {
      const createdAt = new Date(appointment.createdAt).getTime();
      const now = Date.now();
      const threeMinutes = 3 * 60 * 1000;
      if (now - createdAt > threeMinutes) {
        // Auto-reject expired appointments
        await prisma.appointment.update({
          where: { id },
          data: { status: 'rejected' },
        });
        return errorResponse('×××× ×××× ××××©××¨ (3 ××§××ª) ×××£. ××××× × × ×××ª× ××××××××ª.', 400);
      }
    }

    // Build update data
    const updateData: Prisma.AppointmentUpdateInput = { status };

    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
      if (completionNotes) {
        updateData.completionNotes = completionNotes;
      }
    }

    // Update the appointment
    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        garage: { select: { name: true } },
        vehicle: { select: { nickname: true, licensePlate: true } },
        user: { select: { id: true, fullName: true } },
      },
    });

    // If completed, create a notification for the customer
    if (status === 'completed') {
      const serviceLabel = SERVICE_TYPE_HEB[appointment.serviceType] || appointment.serviceType;
      const vehicleLabel = appointment.vehicle.nickname || `${appointment.vehicle.manufacturer} ${appointment.vehicle.model}`;

      await prisma.notification.create({
        data: {
          userId: appointment.user.id,
          type: 'appointment',
          title: '××××¤×× ×××©×× ×××¦×××!',
          message: completionNotes
            ? `${serviceLabel} ××¨×× ${vehicleLabel} (${appointment.vehicle.licensePlate}) ×××©×× ×${appointment.garage.name}. ×¡××××: ${completionNotes}`
            : `${serviceLabel} ××¨×× ${vehicleLabel} (${appointment.vehicle.licensePlate}) ×××©×× ×××¦××× ×${appointment.garage.name}.`,
          link: '/user/appointments',
        },
      });
    }

    // If confirmed, notify the customer
    if (status === 'confirmed') {
      await prisma.notification.create({
        data: {
          userId: appointment.user.id,
          type: 'appointment',
          title: '××ª××¨ ×××©×¨!',
          message: `××ª××¨ ×©×× ×${appointment.garage.name} ×××©×¨. × ×ª×¨×× ××ª××¨×× ${new Date(appointment.date).toLocaleDateString('he-IL')} ××©×¢× ${appointment.time}.`,
          link: '/user/appointments',
        },
      });
    }

    // If rejected by garage, notify the customer
    if (status === 'rejected') {
      const reason = rejectionReason ? ` ×¡×××: ${rejectionReason}` : '';
      await prisma.notification.create({
        data: {
          userId: appointment.user.id,
          type: 'appointment',
          title: '××××× × × ×××ª×',
          message: `××××× × ×©×× ×${appointment.garage.name} × ×××ª×.${reason} × ××ª× ×× ×¡××ª ×××¡× ×××¨.`,
          link: '/user/appointments',
        },
      });
    }

    // If cancelled by garage, notify the customer
    if (status === 'cancelled') {
      await prisma.notification.create({
        data: {
          userId: appointment.user.id,
          type: 'appointment',
          title: '××ª××¨ ××××',
          message: `××ª××¨ ×©×× ×${appointment.garage.name} ××××. ×× × ×¦××¨ ×§×©×¨ ×¢× ××××¡× ××¤×¨××× × ××¡×¤××.`,
          link: '/user/appointments',
        },
      });
    }

    // If in_progress, notify the customer
    if (status === 'in_progress') {
      await prisma.notification.create({
        data: {
          userId: appointment.user.id,
          type: 'appointment',
          title: '××¨×× × ×× ×¡ ××××¤××',
          message: `××¨×× ×©×× × ×× ×¡ ××××¤×× ×${appointment.garage.name}.`,
          link: '/user/appointments',
        },
      });
    }

    return jsonResponse({
      appointment: updated,
      message: `××ª××¨ ×¢×××× ×${APPOINTMENT_STATUS_HEB[status] || status}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/garage/appointments/[id] - Get single appointment details (garage owner)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireGarageOwner(req);
    const { id } = params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        garage: { select: { id: true, ownerId: true, name: true, city: true, address: true, phone: true } },
        vehicle: { select: { id: true, nickname: true, licensePlate: true, model: true, manufacturer: true, year: true, mileage: true } },
        user: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });

    if (!appointment) {
      return errorResponse('××ª××¨ ×× × ××¦×', 404);
    }

    if (appointment.garage.ownerId !== payload.userId) {
      return errorResponse('××× ××¨×©××', 403);
    }

    return jsonResponse({ appointment });
  } catch (error) {
    return handleApiError(error);
  }
}
