/**
 * POST /api/admin/social/generate
 *
 * Generates a social post via Claude using the AutoLog brand voice.
 * Returns parsed { caption, hashtags, callToAction, imagePrompt }.
 *
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
import { generateWithClaude } from '@/lib/social/ai-clients';
import {
  buildSystemPrompt,
  PLATFORM_RULES,
  CONTENT_OCCASIONS,
  BRAND_VOICE_VERSION,
} from '@/lib/social/brand-voice';

const generateSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'instagram_story', 'whatsapp']),
  occasion: z
    .enum(CONTENT_OCCASIONS.map((o) => o.id) as [string, ...string[]])
    .optional(),
  prompt: z.string().min(3).max(2000),       // what the admin wants to say
  extraContext: z.string().max(2000).optional(), // e.g. "מבצע 20% עד 30/06"
  tone: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    const json = await req.json();
    const parsed = generateSchema.safeParse(json);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    if (!process.env.ANTHROPIC_API_KEY) {
      return errorResponse('ANTHROPIC_API_KEY חסר — הגדר אותו ב-.env', 503);
    }

    const platformKey = parsed.data.platform as keyof typeof PLATFORM_RULES;
    const occasionLabel = parsed.data.occasion
      ? CONTENT_OCCASIONS.find((o) => o.id === parsed.data.occasion)?.label
      : undefined;

    const systemPrompt = buildSystemPrompt({
      platform: platformKey,
      occasion: parsed.data.occasion as never,
      extraContext: [
        occasionLabel ? `אירוע / נושא: ${occasionLabel}` : null,
        parsed.data.tone ? `טון מבוקש: ${parsed.data.tone}` : null,
        parsed.data.extraContext || null,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    const result = await generateWithClaude({
      systemPrompt,
      userPrompt: parsed.data.prompt,
    });

    return jsonResponse({
      ...result,
      brandVoiceVersion: BRAND_VOICE_VERSION,
      aiModel: 'claude-sonnet-4-6',
    });
  } catch (err) {
    return handleApiError(err);
  }
}
