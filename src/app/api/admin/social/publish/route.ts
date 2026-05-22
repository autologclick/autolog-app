/**
 * POST /api/admin/social/publish
 *
 * Body: { postId: string }
 * Publishes the post immediately via the linked SocialAccount.
 * Updates status → publishing → published / failed.
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
  errorResponse,
} from '@/lib/api-helpers';
import { publishToFacebook, publishToInstagram } from '@/lib/social/meta-publisher';

const schema = z.object({ postId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const post = await prisma.socialPost.findUnique({
      where: { id: parsed.data.postId },
      include: { socialAccount: true },
    });
    if (!post) return errorResponse('פוסט לא נמצא', 404);
    if (!post.socialAccount) {
      return errorResponse('הפוסט לא מקושר לחשבון רשת חברתית', 400);
    }
    if (post.status === 'published') {
      return errorResponse('הפוסט כבר פורסם', 400);
    }

    // Mark as publishing first so concurrent calls don't double-send
    await prisma.socialPost.update({
      where: { id: post.id },
      data: { status: 'publishing' },
    });

    try {
      const fullText = [post.caption, post.hashtags].filter(Boolean).join('\n\n');
      let externalId: string;

      if (post.platform === 'facebook') {
        const md = (post.socialAccount.metadata ?? {}) as { pageId?: string };
        const r = await publishToFacebook({
          pageId: md.pageId ?? post.socialAccount.accountId,
          pageAccessToken: post.socialAccount.accessToken,
          message: fullText,
          imageUrl: post.mediaUrls[0],
          linkUrl: post.linkUrl ?? undefined,
        });
        externalId = r.id;
      } else if (post.platform === 'instagram' || post.platform === 'instagram_story') {
        if (!post.mediaUrls[0]) {
          throw new Error('אינסטגרם דורש תמונה — אנא צרף מדיה לפני פרסום');
        }
        const md = (post.socialAccount.metadata ?? {}) as { instagramAccountId?: string };
        const igId = md.instagramAccountId ?? post.socialAccount.accountId;
        const r = await publishToInstagram({
          igUserId: igId,
          accessToken: post.socialAccount.accessToken,
          imageUrl: post.mediaUrls[0],
          caption: fullText,
          isStory: post.platform === 'instagram_story',
        });
        externalId = r.id;
      } else if (post.platform === 'whatsapp') {
        // WhatsApp Cloud API send is more involved (template name + variables).
        // Implemented as a stub for now — the WhatsApp tab uses /whatsapp-templates
        // for management. Live broadcast can be added in a follow-up.
        throw new Error('פרסום WhatsApp דורש בחירת תבנית מאושרת — השתמש בטאב WhatsApp.');
      } else {
        throw new Error(`פלטפורמה לא נתמכת: ${post.platform}`);
      }

      const updated = await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: 'published',
          publishedAt: new Date(),
          externalPostId: externalId,
          errorMessage: null,
        },
      });
      await prisma.socialAccount.update({
        where: { id: post.socialAccount.id },
        data: { lastUsedAt: new Date() },
      });
      return jsonResponse({ post: updated });
    } catch (publishErr) {
      const message = publishErr instanceof Error ? publishErr.message : String(publishErr);
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: 'failed', errorMessage: message.slice(0, 1000) },
      });
      return errorResponse(message, 502);
    }
  } catch (err) {
    return handleApiError(err);
  }
}
