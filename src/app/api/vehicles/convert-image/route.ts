import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import { requireAuth, enforceRateLimit, handleApiError } from '@/lib/api-helpers';

const execFileP = promisify(execFile);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 14 * 1024 * 1024;

/**
 * Server-side image conversion fallback for the vehicle image upload.
 * Some mobile browsers (in-app WebViews in particular) cannot decode or
 * convert HEIC/HEIF photos client-side; this endpoint accepts the original
 * file and returns a resized JPEG data URL. ImageMagick + libheif handle
 * HEIC, JPEG, PNG and WebP alike.
 */
export async function POST(req: NextRequest) {
  const tmpId = randomUUID();
  const inPath = `/tmp/imgconv-${tmpId}.in`;
  const outPath = `/tmp/imgconv-${tmpId}.jpg`;
  try {
    const payload = requireAuth(req);
    const rateLimitError = await enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'no file' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'file too large' }, { status: 413 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(inPath, buf);
    // [0] = first frame; -auto-orient applies EXIF rotation; cap longest edge at 1600px
    await execFileP(
      'convert',
      [`${inPath}[0]`, '-auto-orient', '-resize', '1600x1600>', '-strip', '-quality', '82', outPath],
      { timeout: 25000 }
    );
    const out = await readFile(outPath);
    console.log(`[convert-image] ok in=${buf.length}B out=${out.length}B type=${file.type || 'unknown'}`);
    return NextResponse.json({ dataUrl: `data:image/jpeg;base64,${out.toString('base64')}` });
  } catch (error) {
    console.error('[convert-image] failed:', error instanceof Error ? error.message : error);
    return handleApiError(error);
  } finally {
    unlink(inPath).catch(() => {});
    unlink(outPath).catch(() => {});
  }
}
