import { NextRequest } from 'next/server';
import { put, del, list } from '@vercel/blob';
import { requireGarageOwner, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { NOT_FOUND } from '@/lib/messages';

const MAX_GALLERY_IMAGES = 10;

/**
 * Parse base64 data URL → { contentType, buffer, ext }
 * Accepts any image/* format (jpeg, png, webp, etc.)
 */
function parseBase64(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) return null;
  const contentType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const ext = contentType.split('/')[1].replace('+xml', '') || 'jpeg';
  return { contentType, buffer, ext };
}

// GET /api/garage/images
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);
    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true, imageUrl: true, galleryImages: true },
    });
    if (!garage) return errorResponse(NOT_FOUND.GARAGE, 404);

    const gallery: string[] = garage.galleryImages ? JSON.parse(garage.galleryImages) : [];

    return jsonResponse({
      logo: garage.imageUrl || null,
      gallery,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/garage/images — upload logo or gallery images via Vercel Blob
export async function POST(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);
    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true, imageUrl: true, galleryImages: true },
    });
    if (!garage) return errorResponse(NOT_FOUND.GARAGE, 404);

    const body = await req.json();
    const { type, image, images } = body;

    if (type === 'logo') {
      if (!image) return errorResponse('לא נבחרה תמונה', 400);
      const parsed = parseBase64(image);
      if (!parsed) return errorResponse('פורמט תמונה לא תקין', 400);
      if (parsed.buffer.length > 5 * 1024 * 1024) return errorResponse('התמונה גדולה מדי (מקסימום 5MB)', 400);

      // Delete old logo blob if exists
      if (garage.imageUrl) {
        try { await del(garage.imageUrl); } catch {}
      }

      // Upload to Vercel Blob
      const blob = await put(`garages/${garage.id}/logo.${parsed.ext}`, parsed.buffer, {
        access: 'public',
        contentType: parsed.contentType,
        addRandomSuffix: true,
      });

      await prisma.garage.update({
        where: { id: garage.id },
        data: { imageUrl: blob.url },
      });

      return jsonResponse({ logo: blob.url, message: 'הלוגו הועלה בהצלחה' });
    }

    if (type === 'gallery') {
      const imagesToUpload = images || (image ? [image] : []);
      if (!imagesToUpload.length) return errorResponse('לא נבחרו תמונות', 400);

      const currentGallery: string[] = garage.galleryImages ? JSON.parse(garage.galleryImages) : [];
      if (currentGallery.length + imagesToUpload.length > MAX_GALLERY_IMAGES) {
        return errorResponse(`ניתן להעלות עד ${MAX_GALLERY_IMAGES} תמונות. יש כרגע ${currentGallery.length}.`, 400);
      }

      const uploadedUrls: string[] = [];

      for (let i = 0; i < imagesToUpload.length; i++) {
        const parsed = parseBase64(imagesToUpload[i]);
        if (!parsed) continue;
        if (parsed.buffer.length > 5 * 1024 * 1024) continue;

        const blob = await put(`garages/${garage.id}/img_${Date.now()}_${i}.${parsed.ext}`, parsed.buffer, {
          access: 'public',
          contentType: parsed.contentType,
          addRandomSuffix: true,
        });
        uploadedUrls.push(blob.url);
      }

      if (!uploadedUrls.length) return errorResponse('לא הצלחנו להעלות תמונות', 400);

      // Update gallery in DB
      const newGallery = [...currentGallery, ...uploadedUrls];
      await prisma.garage.update({
        where: { id: garage.id },
        data: { galleryImages: JSON.stringify(newGallery) },
      });

      return jsonResponse({
        uploaded: uploadedUrls,
        message: `${uploadedUrls.length} תמונות הועלו בהצלחה`,
      });
    }

    return errorResponse('סוג העלאה לא תקין. השתמש ב-logo או gallery.', 400);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/garage/images — delete logo or gallery image
export async function DELETE(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);
    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true, imageUrl: true, galleryImages: true },
    });
    if (!garage) return errorResponse(NOT_FOUND.GARAGE, 404);

    const body = await req.json();
    const { imageUrl, type } = body;

    if (type === 'logo') {
      if (garage.imageUrl) {
        try { await del(garage.imageUrl); } catch {}
      }
      await prisma.garage.update({
        where: { id: garage.id },
        data: { imageUrl: null },
      });
      return jsonResponse({ message: 'הלוגו נמחק' });
    }

    if (imageUrl) {
      // Delete from Vercel Blob
      try { await del(imageUrl); } catch {}

      // Remove from gallery array in DB
      const currentGallery: string[] = garage.galleryImages ? JSON.parse(garage.galleryImages) : [];
      const newGallery = currentGallery.filter(url => url !== imageUrl);
      await prisma.garage.update({
        where: { id: garage.id },
        data: { galleryImages: JSON.stringify(newGallery) },
      });

      return jsonResponse({ message: 'התמונה נמחקה' });
    }

    return errorResponse('יש לציין תמונה למחיקה', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
