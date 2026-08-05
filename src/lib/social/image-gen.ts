/**
 * OpenAI image generation — src/lib/social/image-gen.ts
 *
 * Replaces generateImageWithDalle(). OpenAI retired `dall-e-3`; the account
 * now offers gpt-image-1 / -mini / -1.5 / -2. Two API differences matter:
 *
 *   1. The gpt-image models return base64, not a temporary URL, so there is
 *      no download step and nothing that can expire mid-flight.
 *   2. Sizes changed. 1792x1024 and 1024x1792 no longer exist; the landscape
 *      and portrait options are 1536x1024 and 1024x1536.
 *
 * Model is env-overridable so a future retirement is a config change, not a
 * deploy. Both response shapes are handled, so this keeps working if OpenAI
 * ever returns URLs again.
 */

const OPENAI_IMAGE_URL = 'https://api.openai.com/v1/images/generations';
const DEFAULT_MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1';
const REQUEST_TIMEOUT_MS = 120_000;

/** What the admin UI still sends, mapped to what the API now accepts. */
const SIZE_MAP: Record<string, string> = {
  '1024x1024': '1024x1024',
  '1792x1024': '1536x1024',
  '1024x1792': '1024x1536',
};

export interface GeneratedImage {
  data: Buffer;
  model: string;
  size: string;
}

export class ImageGenerationError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ImageGenerationError';
  }
}

interface OpenAiImageResponse {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message: string; code?: string };
}

export async function generateImage(opts: {
  prompt: string;
  size?: string;
  quality?: 'low' | 'medium' | 'high' | 'auto';
}): Promise<GeneratedImage> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new ImageGenerationError('OPENAI_API_KEY not configured');

  const size = SIZE_MAP[opts.size ?? '1024x1024'] ?? '1024x1024';

  const res = await fetch(OPENAI_IMAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      prompt: opts.prompt,
      size,
      n: 1,
      quality: opts.quality ?? 'medium',
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await res.text();
  let body: OpenAiImageResponse;
  try {
    body = JSON.parse(text) as OpenAiImageResponse;
  } catch {
    throw new ImageGenerationError(`OpenAI returned non-JSON (${res.status}): ${text.slice(0, 200)}`, res.status);
  }

  if (body.error) {
    throw new ImageGenerationError(body.error.message, res.status);
  }
  if (!res.ok) {
    throw new ImageGenerationError(`OpenAI error ${res.status}: ${text.slice(0, 200)}`, res.status);
  }

  const first = body.data?.[0];
  if (!first) throw new ImageGenerationError('OpenAI returned no image');

  // Current models return base64; older ones returned a URL. Handle both.
  if (first.b64_json) {
    return { data: Buffer.from(first.b64_json, 'base64'), model: DEFAULT_MODEL, size };
  }

  if (first.url) {
    const imgRes = await fetch(first.url, { signal: AbortSignal.timeout(30_000) });
    if (!imgRes.ok) throw new ImageGenerationError(`Could not download generated image (${imgRes.status})`);
    return { data: Buffer.from(await imgRes.arrayBuffer()), model: DEFAULT_MODEL, size };
  }

  throw new ImageGenerationError('OpenAI response contained neither b64_json nor url');
}
