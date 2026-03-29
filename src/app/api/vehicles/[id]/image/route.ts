import { NextRequest } from 'next/server';
import { requireAuth, handleApiError, errorResponse, jsonResponse } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { NOT_FOUND } from '@/lib/messages';

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB max for base64 data URL

// POST /api/vehicles/[id]/image - Upload vehicle image
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId: payload.userId },
      select: { id: true, imageUrl: true },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    const body = await req.json();
    const { image } = body;

    if (!image || !image.startsWith('data:image/')) {
      return errorResponse('פורמט תמונה לא נתמך', 400);
    }

    // Check base64 size (approximate - base64 is ~33% larger than binary)
    if (image.length > MAX_IMAGE_SIZE * 1.37) {
      return errorResponse('התמונה גדולה מדי (מקסימום 500KB)', 400);
    }

    // Save data URL directly to database
    await prisma.vehicle.update({
      where: { id },
      data: { imageUrl: image },
    });

    return jsonResponse({ imageUrl: image, message: 'התמונה הועלתה בהצלחה' });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/vehicles/[id]/image - Remove vehicle image
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId: payload.userId },
      select: { id: true, imageUrl: true },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    await prisma.vehicle.update({
      where: { id },
      data: { imageUrl: null },
    });

    return jsonResponse({ message: 'התמונה נמחקה' });
  } catch (error) {
    return handleApiError(error);
  }
}
