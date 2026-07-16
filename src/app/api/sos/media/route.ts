import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

// This host has no Vercel Blob configured, so we keep the incident photo inline:
// validate that it is an image data URL and return it as-is. It is then stored in
// the database together with the report (the same way inspection photos are stored).
const MAX = 4_000_000; // ~3MB per photo (base64 string length)

export async function POST(req: NextRequest) {
  try {
    requireAuth(req);
    const body = await req.json();
    const file = typeof body?.file === 'string' ? body.file : '';
    if (!/^data:image\/[a-z0-9+.\-]+;base64,/i.test(file)) {
      return errorResponse('פורמט תמונה לא תקין', 400);
    }
    if (file.length > MAX) {
      return errorResponse('התמונה גדולה מדי', 400);
    }
    return jsonResponse({ url: file });
  } catch (error) {
    return handleApiError(error);
  }
}
