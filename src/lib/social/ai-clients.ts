/**
 * Minimal fetch-based clients for the AI providers used by the social module.
 *
 * No SDK dependency on purpose — keeps the bundle small and avoids version
 * mismatches with the Next.js runtime. If you later swap providers, change
 * only this file.
 *
 * Env vars required (set in .env / Vercel):
 *   ANTHROPIC_API_KEY  — Claude (text generation)
 *   OPENAI_API_KEY     — DALL-E (image generation)
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_IMAGE_URL = 'https://api.openai.com/v1/images/generations';

export interface GeneratedPost {
  caption: string;
  hashtags: string;
  callToAction: string;
  imagePrompt: string;
}

/**
 * Call Claude and return parsed JSON (the system prompt instructs Claude to
 * reply with raw JSON). Throws on malformed output so the caller can fall
 * back to displaying the raw text in the UI.
 */
export async function generateWithClaude(opts: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}): Promise<GeneratedPost> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: opts.model ?? 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: opts.systemPrompt,
      messages: [{ role: 'user', content: opts.userPrompt }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Claude API error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === 'text')?.text ?? '';

  // Claude sometimes wraps the JSON in ```json ... ``` — strip it.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as GeneratedPost;
    return {
      caption: parsed.caption ?? '',
      hashtags: parsed.hashtags ?? '',
      callToAction: parsed.callToAction ?? '',
      imagePrompt: parsed.imagePrompt ?? '',
    };
  } catch {
    // Fall back — return the raw text as caption so the admin can edit.
    return { caption: text, hashtags: '', callToAction: '', imagePrompt: '' };
  }
}

/**
 * Generate an image via DALL-E 3. Returns a URL hosted by OpenAI (valid for
 * ~1 hour). Caller is expected to download and re-upload to Vercel Blob.
 */
export async function generateImageWithDalle(opts: {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
}): Promise<{ url: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not configured');

  const res = await fetch(OPENAI_IMAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: opts.prompt,
      size: opts.size ?? '1024x1024',
      n: 1,
      quality: 'standard',
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = (await res.json()) as { data: Array<{ url: string }> };
  const url = data.data?.[0]?.url;
  if (!url) throw new Error('No image returned from DALL-E');
  return { url };
}
