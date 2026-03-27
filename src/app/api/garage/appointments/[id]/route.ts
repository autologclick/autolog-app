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
import { NOT_FOUND, APPOINTMENT_ERRORS } from '@/lib/messages';
import {
  notifyAppointmentCompleted,
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
  notifyAppointmentInProgress,
} from '@/lib/services/notification-service';

const updateSchema = z.object({
  status: z.enum(['confirmed', 'in_progress', 'completed', 'cancelled']),
  completionNotes: z.string().optional(),
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

    const { status, completionNotes } = validation.data;

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
      return errorResponse(NOT_FOUND.APPOINTMENT, 404);
    }

    // Verify this garage belongs to the current user
    if (appointment.garage.ownerId !== payload.userId) {
      return errorResponse(AUTH_ERRORS.FORBIDDEN, 403);
    }

    // Can't update cancelled or already completed appointments
    if (appointment.status === 'cancelled') {
      return errorResponse(APPOINTMENT_ERRORS.CANNOT_UPDATE_CANCELLED, 400);
    }
    if (appointment.status === 'completed') {
      return errorResponse(APPOINTMENT_ERRORS.ALREADY_COMPLETED, 400);
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
      await notifyAppointmentCompleted(
        appointment.user.id,
        appointment.garage.name,
        serviceLabel,
        vehicleLabel,
        appointment.vehicle.licensePlate,
        completionNotes,
      );
    }

    // If confirmed, notify the customer
    if (status === 'confirmed') {
      await notifyAppointmentConfirmed(
        appointment.user.id,
        appointment.garage.name,
        new Date(appointment.date).toLocaleDateString('he-IL'),
        appointment.time,
      );
    }

    // If cancelled by garage, notify the customer
    if (status === 'cancelled') {
      await notifyAppointmentCancelled(appointment.user.id, appointment.garage.name);
    }

    // If in_progress, notify the customer
    if (status === 'in_progress') {
      await notifyAppointmentInProgress(appointment.user.id, appointment.garage.name);
    }

    return jsonResponse({
      appointment: updated,
      message: `ÃÂÃÂªÃÂÃÂ¨ ÃÂ¢ÃÂÃÂÃÂÃÂ ÃÂ${APPOINTMENT_STATUS_HEB[status] || status}`,
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
      return errorResponse(NOT_FOUND.APPOINTMENT, 404);
    }

    if (appointment.garage.ownerId !== payload.userId) {
      return errorResponse(AUTH_ERRORS.FORBIDDEN, 403);
    }

    return jsonResponse({ appointment });
  } catch (error) {
    return handleApiError(error);
  }
}
