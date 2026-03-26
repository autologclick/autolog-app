import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  handleApiError,
  AuthError,
  requireOwnership,
} from '@/lib/api-helpers';
import { updateDocumentSchema } from '@/lib/validations';

// GET /api/documents/[id] - Get single document
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            userId: true,
            nickname: true,
            licensePlate: true,
            manufacturer: true,
            model: true,
          },
        },
      },
    });

    if (!document) {
      return errorResponse('מסמך לא נמצא', 404);
    }

    // Verify user owns the vehicle
    requireOwnership(payload.userId, document.vehicle.userId);

    return jsonResponse({ document });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/documents/[id] - Update document
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;
    const body = await req.json();

    // Validate input
    const validation = updateDocumentSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    // Verify ownership
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: { userId: true },
        },
      },
    });

    if (!document) {
      return errorResponse('מסמך לא נמצא', 404);
    }

    requireOwnership(payload.userId, document.vehicle.userId);

    // Build update data from validated input
    const updateData: Prisma.DocumentUpdateInput = {};
    const d = validation.data;

    if (d.type !== undefined) updateData.type = d.type;
    if (d.title !== undefined) updateData.title = d.title;
    if (d.description !== undefined) updateData.description = d.description || null;
    if (d.fileUrl !== undefined) updateData.fileUrl = d.fileUrl || null;
    if (d.fileName !== undefined) updateData.fileName = d.fileName || null;
    if (d.fileType !== undefined) updateData.fileType = d.fileType || null;
    if (d.isActive !== undefined) updateData.isActive = d.isActive;

    // Parse and update expiry date if provided
    if (d.expiryDate !== undefined) {
      if (d.expiryDate) {
        const expiryDateParsed = new Date(d.expiryDate);
        if (!isNaN(expiryDateParsed.getTime())) {
          updateData.expiryDate = expiryDateParsed;
        }
      } else {
        updateData.expiryDate = null;
      }
    }

    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
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
      document: updated,
      message: 'המסמך עודכן בהצלחה',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    // Verify ownership
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: { userId: true },
        },
      },
    });

    if (!document) {
      return errorResponse('מסמך לא נמצא', 404);
    }

    requireOwnership(payload.userId, document.vehicle.userId);

    // Delete document
    await prisma.document.delete({
      where: { id },
    });

    return jsonResponse({ message: 'המסמך נמחק בהצלחה' });
  } catch (error) {
    return handleApiError(error);
  }
}
