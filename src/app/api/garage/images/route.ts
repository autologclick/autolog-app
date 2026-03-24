import { NextRequest } from 'next/server';
import { requireGarageOwner, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { basename } from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'garages');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 10;

function ensureDir(subDir?: string) {
  const dir = subDir ? path.join(UPLOAD_DIR, subDir) : UPLOAD_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function parseBase64Image(image: string): { ext: string; buffer: Buffer } | null {
  if (!image || !image.startsWith('data:image/')) return null;
  const matches = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
  if (!matches) return null;
  const ext = matches[1] === 'jpg' ? 'jpeg' : matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  return { ext, buffer };
}

// GET /api/garage/images - Get all images for garage
export async function GET(req: NextRequest) {
  try {
    const payload = requireGarageOwner(req);

    const garage = await prisma.garage.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true, imageUrl: true },
    });

    if (!garage) {
      return errorResponse('מוסך לא נמצא', 404);
    }

    const garageDir = path.join(UPLOAD_DIR, garage.id);
    let galleryImages: string[] = [];

    if (fs.existsSync(garageDir)) {
      galleryImages = fs.readdirSync(garageDir)
        .filter(f => /\.(jpeg|jpg|png|webp)$/i.test(f) && !f.startsWith('logo.'))
        .map(f => `/uploads/garages/${garage.id}/${f}`)
        .sort();
    }

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
      return errorResponse('מוסך לא נמצא', 404);
    }

    const body = await req.json();
    const { type, image, images } = body;
    // type: 'logo' | 'gallery'
    // image: single base64 (for logo)
    // images: array of base64 (for gallery batch upload)

    const garageDir = ensureDir(garage.id);

    if (type === 'logo') {
      if (!image) return errorResponse('לא נבחרה תמונה', 400);

      const parsed = parseBase64Image(image);
      if (!parsed) return errorResponse('פורמט תמונה לא נתמך. השתמש ב-JPEG, PNG או WebP', 400);
      if (parsed.buffer.length > MAX_FILE_SIZE) return errorResponse('התמונה גדולה מדי (מקסימום 5MB)', 400);

      // Remove old logo
      const oldLogos = fs.readdirSync(garageDir).filter(f => f.startsWith('logo.'));
      oldLogos.forEach(f => {
        // Ensure file is in expected directory (defense in depth)
        const sanitized = basename(f);
        if (sanitized === f) {
          fs.unlinkSync(path.join(garageDir, sanitized));
        }
      });

      // Save new logo
      const filename = `logo.${parsed.ext}`;
      fs.writeFileSync(path.join(garageDir, filename), parsed.buffer);
      const logoUrl = `/uploads/garages/${garage.id}/${filename}`;

      // Update DB
      await prisma.garage.update({
        where: { id: garage.id },
        data: { imageUrl: logoUrl },
      });

      return jsonResponse({ logo: logoUrl, message: 'הלוגו הועלה בהצלחה' });
    }

    if (type === 'gallery') {
      const imagesToUpload = images || (image ? [image] : []);
      if (!imagesToUpload.length) return errorResponse('לא נבחרו תמונות', 400);

      // Check existing gallery count
      const existingFiles = fs.readdirSync(garageDir).filter(f => !f.startsWith('logo.') && /\.(jpeg|jpg|png|webp)$/i.test(f));
      if (existingFiles.length + imagesToUpload.length > MAX_IMAGES) {
        return errorResponse(`ניתן להעלות עד ${MAX_IMAGES} תמונות לגלריה. יש כרגע ${existingFiles.length} תמונות.`, 400);
      }

      const uploadedUrls: string[] = [];

      for (let i = 0; i < imagesToUpload.length; i++) {
        const parsed = parseBase64Image(imagesToUpload[i]);
        if (!parsed) continue;
        if (parsed.buffer.length > MAX_FILE_SIZE) continue;

        const timestamp = Date.now();
        const filename = `img_${timestamp}_${i}.${parsed.ext}`;
        fs.writeFileSync(path.join(garageDir, filename), parsed.buffer);
        uploadedUrls.push(`/uploads/garages/${garage.id}/${filename}`);
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
      return errorResponse('מוסך לא נמצא', 404);
    }

    const body = await req.json();
    const { imageUrl, type } = body;

    if (type === 'logo') {
      // Delete logo
      const garageDir = path.join(UPLOAD_DIR, garage.id);
      if (fs.existsSync(garageDir)) {
        const logos = fs.readdirSync(garageDir).filter(f => f.startsWith('logo.'));
        logos.forEach(f => {
          // Sanitize filename to prevent path traversal
          const sanitized = basename(f);
          if (sanitized === f) {
            fs.unlinkSync(path.join(garageDir, sanitized));
          }
        });
      }
      await prisma.garage.update({
        where: { id: garage.id },
        data: { imageUrl: null },
      });
      return jsonResponse({ message: 'הלוגו נמחק' });
    }

    if (imageUrl) {
      // Verify the URL belongs to this garage
      const expectedPrefix = `/uploads/garages/${garage.id}/`;
      if (!imageUrl.startsWith(expectedPrefix)) {
        return errorResponse('תמונה לא תקינה', 400);
      }

      const filename = imageUrl.replace(expectedPrefix, '');

      // Sanitize filename to prevent path traversal attacks (e.g., ../../etc/passwd)
      const sanitizedFilename = basename(filename);
      if (sanitizedFilename !== filename) {
        return errorResponse('שם קובץ לא תקין', 400);
      }

      const filePath = path.join(UPLOAD_DIR, garage.id, sanitizedFilename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return jsonResponse({ message: 'התמונה נמחקה' });
    }

    return errorResponse('נא לציין תמונה למחיקה', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
