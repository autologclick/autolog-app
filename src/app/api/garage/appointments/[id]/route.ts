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
import { sendEmail, buildCustomerStatusEmailHtml } from '@/lib/email';

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
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!appointment) {
      return errorResponse('התור לא נמצא', 404);
    }

    // Verify this garage belongs to the current user
    if (appointment.garage.ownerId !== payload.userId) {
      return errorResponse('אין הרשאה', 403);
    }

    // Can't update cancelled, rejected, or already completed appointments
    if (appointment.status === 'cancelled' || appointment.status === 'rejected') {
      return errorResponse('לא ניתן לעדכן תור שבוטל או נדחה', 400);
    }
    if (appointment.status === 'completed') {
      return errorResponse('התור כבר הושלם', 400);
    }

    // Prevent re-confirming an already-confirmed appointment
    if (status === 'confirmed' && appointment.status === 'confirmed') {
      return errorResponse('התור כבר אושר על ידך קודם לכן.', 400);
    }
    if (status === 'rejected' && appointment.status === 'confirmed') {
      return errorResponse('התור כבר אושר ולא ניתן לדחות אותו כעת.', 400);
    }

    // For confirm/reject: check 15-minute response window
    if ((status === 'confirmed' || status === 'rejected') && appointment.status === 'pending') {
      const createdAt = new Date(appointment.createdAt).getTime();
      const now = Date.now();
      const fifteenMinutes = 15 * 60 * 1000;
      if (now - createdAt > fifteenMinutes) {
        // Auto-reject expired appointments
        await prisma.appointment.update({
          where: { id },
          data: { status: 'rejected' },
        });
        return errorResponse('חלון הזמן לאישור (15 דקות) חלף. ההזמנה נדחתה אוטומטית.', 400);
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
        garage: { select: { name: true, phone: true, address: true, city: true } },
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
          title: 'הטיפול הושלם בהצלחה!',
          message: completionNotes
            ? `${serviceLabel} ברכב ${vehicleLabel} (${appointment.vehicle.licensePlate}) הושלם ב${appointment.garage.name}. סיכום: ${completionNotes}`
            : `${serviceLabel} ברכב ${vehicleLabel} (${appointment.vehicle.licensePlate}) הושלם בהצלחה ב${appointment.garage.name}.`,
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
          title: 'התור אושר!',
          message: `התור שלך ב${appointment.garage.name} אושר. נתראה בתאריך ${new Date(appointment.date).toLocaleDateString('he-IL')} בשעה ${appointment.time}.`,
          link: '/user/appointments',
        },
      });
    }

    // If rejected by garage, notify the customer
    if (status === 'rejected') {
      const reason = rejectionReason ? ` סיבה: ${rejectionReason}` : '';
      await prisma.notification.create({
        data: {
          userId: appointment.user.id,
          type: 'appointment',
          title: 'ההזמנה נדחתה',
          message: `ההזמנה שלך ב${appointment.garage.name} נדחתה.${reason} ניתן לנסות מוסך אחר.`,
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
          title: 'התור בוטל',
          message: `התור שלך ב${appointment.garage.name} בוטל. אנא צור קשר עם המוסך לפרטים נוספים.`,
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
          title: 'הרכב נכנס לטיפול',
          message: `הרכב שלך נכנס לטיפול ב${appointment.garage.name}.`,
          link: '/user/appointments',
        },
      });
    }

    // Send email to customer for status changes (fire-and-forget)
    if (['confirmed', 'rejected', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      const serviceLabel = SERVICE_TYPE_HEB[appointment.serviceType] || appointment.serviceType;
      const vehicleLabel = appointment.vehicle.nickname || `${appointment.vehicle.manufacturer} ${appointment.vehicle.model}`;
      const dateLabel = new Date(appointment.date).toLocaleDateString('he-IL');
      const customerEmail = appointment.user.email;

      if (customerEmail) {
        const statusTitles: Record<string, string> = {
          confirmed: 'התור שלך אושר!',
          rejected: 'ההזמנה נדחתה',
          in_progress: 'הרכב נכנס לטיפול',
          completed: 'הטיפול הושלם!',
          cancelled: 'התור בוטל',
        };

        // Fetch garage contact details for confirmed emails
        const garageDetails = await prisma.garage.findUnique({
          where: { id: appointment.garage.id },
          select: { phone: true, address: true, city: true },
        });

        sendEmail({
          to: customerEmail,
          subject: `AutoLog — ${statusTitles[status] || 'עדכון תור'}`,
          html: buildCustomerStatusEmailHtml({
            customerName: appointment.user.fullName,
            garageName: appointment.garage.name,
            vehicleLabel: `${vehicleLabel} (${appointment.vehicle.licensePlate})`,
            serviceLabel,
            dateLabel,
            timeLabel: appointment.time,
            status: status as 'confirmed' | 'rejected' | 'in_progress' | 'completed' | 'cancelled',
            completionNotes: completionNotes || null,
            rejectionReason: rejectionReason || null,
            garagePhone: garageDetails?.phone || null,
            garageAddress: garageDetails?.address || null,
            garageCity: garageDetails?.city || null,
          }),
        }).catch(() => { /* silent */ });
      }
    }

    return jsonResponse({
      appointment: updated,
      message: `התור עודכן ל${APPOINTMENT_STATUS_HEB[status] || status}`,
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
      return errorResponse('התור לא נמצא', 404);
    }

    if (appointment.garage.ownerId !== payload.userId) {
      return errorResponse('אין הרשאה', 403);
    }

    return jsonResponse({ appointment });
  } catch (error) {
    return handleApiError(error);
  }
}
