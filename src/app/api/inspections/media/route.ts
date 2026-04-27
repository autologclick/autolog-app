import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file (videos can be large)

/**
 * POST /api/inspections/media — Upload inspection photo or video to Vercel Blob
 *
 * Accepts base64 data URL (image or video) and returns a permanent public URL.
 * Used by the new-inspection form to upload media before submitting the inspection.
 *
 * Body: { file: string (base64 data URL), category: string, key?: string }
 * Returns: { url: string }
 */
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();
    const { file, category, key } = body;

    if (!file || typeof file !== 'string') {
      return errorResponse('חסר קובץ להעלאה', 400);
    }

    // Parse base64 data URL — supports both image/* and video/*
    const match = file.match(/^data:((?:image|video)\/[a-z0-9+.-]+);base64,(.+)$/i);
    if (!match) {
      return errorResponse('פורמט קובץ לא תקין', 400);
    }

    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');

    if (buffer.length > MAX_FILE_SIZE) {
      return errorResponse('הקובץ גדול מדי (מקסימום 20MB)', 400);
    }

    // Determine file extension
    const isVideo = contentType.startsWith('video/');
    let ext = contentType.split('/')[1].replace('+xml', '');
    if (ext === 'quicktime') ext = 'mov';

    // Build a meaningful path: inspections/{userId}/{category}_{key}_{timestamp}.{ext}
    const timestamp = Date.now();
    const filename = key
      ? `${category}_${key}_${timestamp}.${ext}`
      : `${category}_${timestamp}.${ext}`;

    const blob = await put(`inspections/${payload.userId}/${filename}`, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    });

    return jsonResponse({ url: blob.url });
  } catch (error) {
    return handleApiError(error);
  }
}
