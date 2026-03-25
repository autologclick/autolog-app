import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
  validationErrorResponse,
  sanitize,
} from '@/lib/api-helpers';
import { createNotification } from '@/lib/integrations/notification-service';

const signInspectionSchema = z.object({
  customerName: z.string().min(2, 'שם מלא חייב להכיל לפחות 2 תווים').max(100),
  customerIdNumber: z.string().regex(/^\d{5,9}$/, 'מספר ת.ז. חייב להכיל 5-9 ספרות'),
  customerSignature: z.string().min(100, 'חתימה לא תקינה'), // base64 PNG must be substantial
});

// PUT /api/inspections/[id]/sign - Customer signs an inspection report
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    // Validate input
    const body = await req.json();
    const validation = signInspectionSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { customerName, customerIdNumber, customerSignature } = validation.data;

    // Get the inspection and verify it belongs to the user's vehicle
    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        vehicle: { select: { userId: true, nickname: true, licensePlate: true } },
        garage: { select: { id: true, ownerId: true, name: true } },
      },
    });

    if (!inspection) {
      return errorResponse('בדיקה לא נמצאה', 404);
    }

    // Verify the user owns the vehicle
    if (inspection.vehicle.userId !== payload.userId) {
      return errorResponse('אין הרשאה לחתום על בדיקה זו', 403);
    }

    // Verify inspection is awaiting signature
    if (inspection.status !== 'awaiting_signature') {
      return errorResponse(
        inspection.status === 'completed'
          ? 'בדיקה זו כבר נחתמה'
          : 'בדיקה זו אינה ממתינה לחתימה',
        400
      );
    }

    // Capture audit info
    const signatureIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const signatureDevice = req.headers.get('user-agent') || 'unknown';

    // Update inspection with signature and set to completed
    const updated = await prisma.inspection.update({
      where: { id },
      data: {
        customerName: sanitize(customerName),
        customerIdNumber: customerIdNumber,
        customerSignature: customerSignature,
        signedAt: new Date(),
        status: 'completed',
      },
    });

    // Also update via raw SQL for the new audit fields
    try {
      await (prisma as any).$executeRawUnsafe(
        'UPDATE "Inspection" SET "signatureIp" = $1, "signatureDevice" = $2 WHERE "id" = $3',
        signatureIp.substring(0, 45),
        signatureDevice.substring(0, 500),
        id
      );
    } catch {
      // Non-critical: audit fields might not exist yet in DB
    }

    // If linked to appointment, update appointment to completed
    if (inspection.appointmentId) {
      try {
        await prisma.appointment.update({
          where: { id: inspection.appointmentId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            completionNotes: 'הבדיקה הושלמה ונחתמה על ידי הלקוח',
          },
        });
      } catch {
        // Appointment might already be completed
      }
    }

    // Notify garage owner that customer signed
    if (inspection.garage.ownerId) {
      try {
        await createNotification({
          userId: inspection.garage.ownerId,
          type: 'inspection_signed',
          title: 'לקוח חתם על דוח בדיקה',
          message: `${customerName} חתם/ה על דוח הבדיקה של ${inspection.vehicle.nickname || inspection.vehicle.licensePlate}`,
        });
      } catch {
        // Non-critical
      }
    }

    return jsonResponse({
      success: true,
      message: 'הדוח נחתם בהצלחה',
      inspection: {
        id: updated.id,
        status: updated.status,
        signedAt: updated.signedAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
