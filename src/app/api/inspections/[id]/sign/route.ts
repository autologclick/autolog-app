import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { jsonResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-helpers';
import { NOT_FOUND } from '@/lib/messages';

const signSchema = z.object({
  customerName: z.string().min(2, 'נא להזין שם מלא'),
  customerIdNumber: z.string().regex(/^\d{5,9}$/, 'מספר ת"ז לא תקין'),
  customerSignature: z.string().min(50, 'נא לחתום בשדה החתימה'),
});

// PUT /api/inspections/[id]/sign - Customer signs inspection report (no auth required)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const validation = signSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { customerName, customerIdNumber, customerSignature } = validation.data;

    // Find inspection
    const inspection = await prisma.inspection.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!inspection) {
      return errorResponse(NOT_FOUND.INSPECTION, 404);
    }

    if (inspection.status !== 'awaiting_signature') {
      return errorResponse('הבדיקה אינה ממתינה לחתימה', 400);
    }

    // Update inspection with signature and change status to completed
    const updated = await prisma.inspection.update({
      where: { id },
      data: {
        customerName,
        customerIdNumber,
        customerSignature,
        signedAt: new Date(),
        status: 'completed',
      },
      include: {
        vehicle: { select: { nickname: true, model: true, manufacturer: true, licensePlate: true } },
        garage: { select: { name: true, city: true } },
        items: true,
      },
    });

    return jsonResponse({
      success: true,
      message: 'החתימה נקלטה בהצלחה',
      inspection: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
