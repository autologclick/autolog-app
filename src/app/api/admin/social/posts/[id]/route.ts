/**
 * GET    /api/admin/social/posts/[id]   → fetch single post
 * PATCH  /api/admin/social/posts/[id]   → update fields (caption, schedule, status)
 * DELETE /api/admin/social/posts/[id]   → soft-delete (status=archived)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import {
  requireAdmin,
  jsonResponse,
  handleApiError,
  validationErrorResponse,
  errorResponse,
} from '@/lib/api-helpers';

const patchSchema = z.object({
  caption: z.string().min(1).max(5000).optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  graphicConfig: z.any().optional(),
  hashtags: z.string().max(500).optional(),
  callToAction: z.string().max(200).optional(),
  linkUrl: z.string().url().optional().or(z.literal('')),
  scheduledFor: z.string().datetime().nullable().optional(),
  status: z
    .enum(['draft', 'scheduled', 'published', 'failed', 'archived'])
    .optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(_req);
    const post = await prisma.socialPost.findUnique({ where: { id: params.id } });
    if (!post) return errorResponse('פוסט לא נמצא', 404);
    return jsonResponse({ post });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req);
    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const data = parsed.data;
    const post = await prisma.socialPost.update({
      where: { id: params.id },
      data: {
        ...(data.caption !== undefined ? { caption: data.caption } : {}),
        ...(data.mediaUrls !== undefined ? { mediaUrls: data.mediaUrls } : {}),
        ...(data.graphicConfig !== undefined ? { graphicConfig: data.graphicConfig } : {}),
        ...(data.hashtags !== undefined ? { hashtags: data.hashtags } : {}),
        ...(data.callToAction !== undefined ? { callToAction: data.callToAction } : {}),
        ...(data.linkUrl !== undefined ? { linkUrl: data.linkUrl || null } : {}),
        ...(data.scheduledFor !== undefined
          ? { scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
    return jsonResponse({ post });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(_req);
    const post = await prisma.socialPost.update({
      where: { id: params.id },
      data: { status: 'archived' },
    });
    return jsonResponse({ post });
  } catch (err) {
    return handleApiError(err);
  }
}
