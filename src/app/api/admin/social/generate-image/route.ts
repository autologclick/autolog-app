/**
 * POST /api/admin/social/generate-image
 *
 * Generates an image with OpenAI and stores it on our own disk under
 * public/social/, returning a permanent autolog.click URL.
 *
 * Two things changed from the original:
 *   - Vercel Blob -> local storage. AutoLog is self-hosted; Blob needed a
 *     token that was never set and stores files on infrastructure we don't run.
 *   - dall-e-3 -> gpt-image-*. OpenAI retired dall-e-3; the new models return
 *     base64 directly, so there is no temporary URL to download.
 *
 * Body: { prompt: string, size?: '1024x1024' | '1792x1024' | '1024x1792' }
 * Auth: admin-only.
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  requireAdmin,
  jsonResponse,
  handleApiError,
  validationErrorResponse,
  errorResponse,
} from '@/lib/api-helpers';
import { generateImage, ImageGenerationError } from '@/lib/social/image-gen';
import { storeFile, StorageError } from '@/lib/storage';

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

    const image = await generateImage({
      prompt: parsed.data.prompt,
      size: parsed.data.size,
    });

    const stored = await storeFile('social', 'png', image.data);

    return jsonResponse({
      url: stored.url,
      prompt: parsed.data.prompt,
      size: image.size,
      model: image.model,
      bytes: stored.bytes,
    });
  } catch (err) {
    // Surface the real cause in Hebrew instead of a generic 500. The previous
    // version hid "model does not exist" behind שגיאת שרת פנימית.
    if (err instanceof ImageGenerationError) {
      return errorResponse(`יצירת התמונה נכשלה: ${err.message}`, err.status ?? 502);
    }
    if (err instanceof StorageError) {
      return errorResponse(`שמירת התמונה נכשלה: ${err.message}`, 500);
    }
    return handleApiError(err);
  }
}
