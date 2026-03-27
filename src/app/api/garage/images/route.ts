import { NextRequest } from 'next/server';
import { requireGarageOwner, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { NOT_FOUND } from '@/lib/messages';
import path from 'path';
import {
  parseBase64Image,
  validateImageSize,
  ensureUploadDir,
  saveImageFile,
  deleteMatchingFiles,
  listImageFiles,
  MAX_FILE_SIZE,
} from '@/lib/services/image-service';
import { basename } from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'garages');
const MAX_GALLERY_IMAGES = 10;

// GET /api/garage/images - Get all images for garage
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true, imageUrl: true },
    });

    if (!garage) {
      return errorResponse(NOT_FOUND.GARAGE, 404);
    }

    const garageDir = path.join(UPLOAD_DIR, garage.id);
    const galleryImages = listImageFiles(garageDir, 'logo.')
      .map((f) => `/uploads/garages/${garage.id}/${f}`);

    return jsonResponse({
      logo: garage.imageUrl || null,
      gallery: galleryImages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/garage/images - Upload garage images (logo or gallery)
export async function POST(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true, imageUrl: true },
    });

    if (!garage) {
      return errorResponse(NOT_FOUND.GARAGE, 404);
    }

    const body = await req.json();
    const { type, image, images } = body;

    const garageDir = ensureUploadDir(UPLOAD_DIR, garage.id);
    const publicPrefix = `/uploads/garages/${garage.id}`;

    if (type === 'logo') {
      if (!image) return errorResponse('לא נבחרה תמונה', 400);

      const parsed = parseBase64Image(image);
      if (!parsed) return errorResponse('פורמט תמונה לא נתמך. השתמש ב-JPEG, PNG או WebP', 400);

      const sizeError = validateImageSize(parsed);
      if (sizeError) return errorResponse(sizeError, 400);

      // Remove old logo
      deleteMatchingFiles(garageDir, (f) => f.startsWith('logo.'));

      // Save new logo
      const filename = `logo.${parsed.ext}`;
      const logoUrl = saveImageFile(garageDir, filename, parsed.buffer, publicPrefix);

      await prisma.garage.update({
        where: { id: garage.id },
        data: { imageUrl: logoUrl },
      });

      return jsonResponse({ logo: logoUrl, message: 'הלוגו הועלה בהצלחה' });
    }

    if (type === 'gallery') {
      const imagesToUpload = images || (image ? [image] : []);
      if (!imagesToUpload.length) return errorResponse('לא נבחרו תמונות', 400);

      const existingCount = listImageFiles(garageDir, 'logo.').length;
      if (existingCount + imagesToUpload.length > MAX_GALLERY_IMAGES) {
        return errorResponse(`ניתן להעלות עד ${MAX_GALLERY_IMAGES} תמונות לגלריה. יש כרגע ${existingCount} תמונות.`, 400);
      }

      const uploadedUrls: string[] = [];

      for (let i = 0; i < imagesToUpload.length; i++) {
        const parsed = parseBase64Image(imagesToUpload[i]);
        if (!parsed) continue;

        const sizeError = validateImageSize(parsed);
        if (sizeError) continue;

        const timestamp = Date.now();
        const filename = `img_${timestamp}_${i}.${parsed.ext}`;
        uploadedUrls.push(saveImageFile(garageDir, filename, parsed.buffer, publicPrefix));
      }

      if (!uploadedUrls.length) {
        return errorResponse('לא הצלחנו להעלות את התמונות. בדוק את הפורמט והגודל.', 400);
      }

      return jsonResponse({
        uploaded: uploadedUrls,
        message: `${uploadedUrls.length} תמונות הועלו בהצלחה`,
      });
    }

    return errorResponse('סוג לא תקין. השתמש ב-logo או gallery', 400);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/garage/images - Delete a garage image
export async function DELETE(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true, imageUrl: true },
    });

    if (!garage) {
      return errorResponse(NOT_FOUND.GARAGE, 404);
    }

    const body = await req.json();
    const { imageUrl, type } = body;

    if (type === 'logo') {
      const garageDir = path.join(UPLOAD_DIR, garage.id);
      deleteMatchingFiles(garageDir, (f) => f.startsWith('logo.'));

      await prisma.garage.update({
        where: { id: garage.id },
        data: { imageUrl: null },
      });
      return jsonResponse({ message: 'הלוגו נמחק' });
    }

    if (imageUrl) {
      const expectedPrefix = `/uploads/garages/${garage.id}/`;
      if (!imageUrl.startsWith(expectedPrefix)) {
        return errorResponse('תמונה לא תקינה', 400);
      }

      const filename = imageUrl.replace(expectedPrefix, '');
      const sanitizedFilename = basename(filename);
      if (sanitizedFilename !== filename) {
        return errorResponse('שם קובץ לא תקין', 400);
      }

      deleteMatchingFiles(path.join(UPLOAD_DIR, garage.id), (f) => f === sanitizedFilename);
      return jsonResponse({ message: 'התמונה נמחקה' });
    }

    return errorResponse('נא לציין תמונה למחיקה', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
