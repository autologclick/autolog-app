import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError, errorResponse, jsonResponse } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { NOT_FOUND } from '@/lib/messages';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'vehicles');

// Ensure upload directory exists
function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// POST /api/vehicles/[id]/image - Upload vehicle image
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    // Verify vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId: payload.userId },
      select: { id: true },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    const body = await req.json();
    const { image } = body; // base64 data URL

    if (!image || !image.startsWith('data:image/')) {
      return errorResponse('תמונה לא תקינה', 400);
    }

    // Extract base64 data and determine format
    const matches = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
    if (!matches) {
      return errorResponse('פורמט תמונה לא נתמך', 400);
    }

    const ext = matches[1] === 'jpg' ? 'jpeg' : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Limit file size (5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return errorResponse('התמונה גדולה מדי (מקסימום 5MB)', 400);
    }

    ensureDir();

    // Remove old images for this vehicle
    const existingFiles = fs.readdirSync(UPLOAD_DIR).filter(f => f.startsWith(id + '.'));
    existingFiles.forEach(f => fs.unlinkSync(path.join(UPLOAD_DIR, f)));

    // Save new image
    const filename = `${id}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

    const imageUrl = `/uploads/vehicles/${filename}`;
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

    // Verify vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId: payload.userId },
      select: { id: true },
    });

    if (!vehicle) {
      return errorResponse(NOT_FOUND.VEHICLE, 404);
    }

    ensureDir();

    // Remove all images for this vehicle
    const existingFiles = fs.readdirSync(UPLOAD_DIR).filter(f => f.startsWith(id + '.'));
    existingFiles.forEach(f => fs.unlinkSync(path.join(UPLOAD_DIR, f)));

    return jsonResponse({ message: 'התמונה נמחקה' });
  } catch (error) {
    return handleApiError(error);
  }
}
