/**
 * POST /api/admin/social/generate-image
 *
 * Generates an image via DALL-E 3, downloads it, uploads to Vercel Blob,
 * and returns a permanent URL the admin can use in the editor.
 *
 * Body: { prompt: string, size?: '1024x1024' | '1792x1024' | '1024x1792' }
 * Auth: admin-only.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { put } from '@vercel/blob';
import {
  requireAdmin,
  jsonResponse,
  handleApiError,
  validationErrorResponse,
  errorResponse,
} from '@/lib/api-helpers';
import { generateImageWithDalle } from '@/lib/social/ai-clients';

const schema = z.object({
  prompt: z.string().min(5).max(1000),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    if (!process.env.OPENAI_API_KEY) {
      return errorResponse('OPENAI_API_KEY חסר — הגדר אותו ב-.env', 503);
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return errorResponse('BLOB_READ_WRITE_TOKEN חסר — צריך Vercel Blob', 503);
    }

    // 1) Ask DALL-E
    const { url: tempUrl } = await generateImageWithDalle({
      prompt: parsed.data.prompt,
      size: parsed.data.size,
    });

    // 2) Download + push to Blob so the URL doesn't expire
    const imgRes = await fetch(tempUrl);
    if (!imgRes.ok) {
      return errorResponse('הורדת התמונה מ-DALL-E נכשלה', 502);
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());

    const filename = `social/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const blob = await put(filename, buf, {
      access: 'public',
      contentType: 'image/png',
    });

    return jsonResponse({
      url: blob.url,
      prompt: parsed.data.prompt,
      size: parsed.data.size ?? '1024x1024',
    });
  } catch (err) {
    return handleApiError(err);
  }
}
