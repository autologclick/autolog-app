import { NextRequest } from 'next/server';
import { requireAuth, handleApiError, errorResponse, jsonResponse } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { NOT_FOUND } from '@/lib/messages';
import { put, del } from '@vercel/blob';
import { parseBase64Image, validateImageSize } from '@/lib/services/image-service';

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

    const parsed = parseBase64Image(image);
    if (!parsed) {
      return errorResponse('פורמט תמונה לא נתמך', 400);
    }

    const sizeError = validateImageSize(parsed);
    if (sizeError) {
      return errorResponse(sizeError, 400);
    }

    // Delete old blob if exists
    if (vehicle.imageUrl) {
      try { await del(vehicle.imageUrl); } catch (e) { /* ignore */ }
    }

    // Upload to Vercel Blob
    const blob = await put(
      'vehicles/' + id + '.' + parsed.ext,
      parsed.buffer,
      { access: 'public', contentType: 'image/' + parsed.ext }
    );

    // Save URL to database
    await prisma.vehicle.update({
      where: { id },
      data: { imageUrl: blob.url },
    });

    return jsonResponse({ imageUrl: blob.url, message: 'התמונה הועלתה בהצלחה' });
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

    // Delete from Vercel Blob
    if (vehicle.imageUrl) {
      try { await del(vehicle.imageUrl); } catch (e) { /* ignore */ }
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