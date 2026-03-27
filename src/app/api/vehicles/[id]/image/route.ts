import { NextRequest } from 'next/server';
import { requireAuth, handleApiError, errorResponse, jsonResponse } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { NOT_FOUND } from '@/lib/messages';
import path from 'path';
import {
  parseBase64Image,
  validateImageSize,
  ensureUploadDir,
  saveImageFile,
  deleteMatchingFiles,
} from '@/lib/services/image-service';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'vehicles');

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
      select: { id: true },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    const body = await req.json();
    const { image } = body;

    const parsed = parseBase64Image(image);
    if (!parsed) {
      return errorResponse('פורמט תמונה לא נתמך', 400);
    }

    const sizeError = validateImageSize(parsed);
    if (sizeError) {
      return errorResponse(sizeError, 400);
    }

    ensureUploadDir(UPLOAD_DIR);

    // Remove old images for this vehicle
    deleteMatchingFiles(UPLOAD_DIR, (f) => f.startsWith(id + '.'));

    // Save new image
    const filename = `${id}.${parsed.ext}`;
    const imageUrl = saveImageFile(UPLOAD_DIR, filename, parsed.buffer, '/uploads/vehicles');

    return jsonResponse({ imageUrl, message: 'התמונה הועלתה בהצלחה' });
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
      select: { id: true },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    ensureUploadDir(UPLOAD_DIR);
    deleteMatchingFiles(UPLOAD_DIR, (f) => f.startsWith(id + '.'));

    return jsonResponse({ message: 'התמונה נמחקה' });
  } catch (error) {
    return handleApiError(error);
  }
}
