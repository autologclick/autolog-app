/**
 * GET  /api/admin/social/posts          → list (with filters)
 * POST /api/admin/social/posts          → create draft / scheduled post
 *
 * Auth: admin-only.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import {
  requireAdmin,
  jsonResponse,
  handleApiError,
  validationErrorResponse,
} from '@/lib/api-helpers';

const createSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'instagram_story', 'whatsapp']),
  caption: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  graphicConfig: z.any().optional(),
  hashtags: z.string().max(500).optional(),
  callToAction: z.string().max(200).optional(),
  linkUrl: z.string().url().optional().or(z.literal('')),
  scheduledFor: z.string().datetime().optional(),
  socialAccountId: z.string().optional(),
  aiPrompt: z.string().max(2000).optional(),
  aiModel: z.string().max(100).optional(),
  brandVoiceVersion: z.string().max(50).optional(),
  status: z.enum(['draft', 'scheduled']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const platform = url.searchParams.get('platform');

    const posts = await prisma.socialPost.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(platform ? { platform: platform as never } : {}),
        NOT: { status: 'archived' },
      },
      orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      include: {
        socialAccount: { select: { accountName: true, platform: true } },
      },
    });
    return jsonResponse({ posts });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const d = parsed.data;
    const post = await prisma.socialPost.create({
      data: {
        platform: d.platform,
        caption: d.caption,
        mediaUrls: d.mediaUrls ?? [],
        graphicConfig: d.graphicConfig ?? undefined,
        hashtags: d.hashtags ?? null,
        callToAction: d.callToAction ?? null,
        linkUrl: d.linkUrl || null,
        scheduledFor: d.scheduledFor ? new Date(d.scheduledFor) : null,
        socialAccountId: d.socialAccountId ?? null,
        aiPrompt: d.aiPrompt ?? null,
        aiModel: d.aiModel ?? null,
        brandVoiceVersion: d.brandVoiceVersion ?? null,
        status: d.status ?? (d.scheduledFor ? 'scheduled' : 'draft'),
        createdById: admin.userId,
      },
    });
    return jsonResponse({ post }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
