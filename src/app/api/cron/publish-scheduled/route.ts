/**
 * GET /api/cron/publish-scheduled
 *
 * Run by Vercel Cron (every 5 minutes is a good default — add to vercel.json):
 *   { "crons": [{ "path": "/api/cron/publish-scheduled", "schedule": "every 5 min" }] }
 *
 * Finds all scheduled posts whose scheduledFor <= now and publishes them
 * via the same code path as the manual /publish endpoint.
 *
 * Auth: shared secret in `Authorization: Bearer <CRON_SECRET>` header
 * (Vercel sets this automatically when CRON_SECRET env var is configured).
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { publishToFacebook, publishToInstagram } from '@/lib/social/meta-publisher';

export async function GET(req: NextRequest) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get('authorization') ?? '';
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const due = await prisma.socialPost.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: { lte: new Date() },
    },
    include: { socialAccount: true },
    take: 25, // safety cap per run
  });

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const post of due) {
    if (!post.socialAccount) {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: 'failed', errorMessage: 'אין SocialAccount מקושר' },
      });
      results.push({ id: post.id, ok: false, error: 'no account' });
      continue;
    }

    try {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: 'publishing' },
      });
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
        if (!post.mediaUrls[0]) throw new Error('IG דורש תמונה');
        const md = (post.socialAccount.metadata ?? {}) as { instagramAccountId?: string };
        const r = await publishToInstagram({
          igUserId: md.instagramAccountId ?? post.socialAccount.accountId,
          accessToken: post.socialAccount.accessToken,
          imageUrl: post.mediaUrls[0],
          caption: fullText,
          isStory: post.platform === 'instagram_story',
        });
        externalId = r.id;
      } else {
        throw new Error(`קרון לא תומך ב-${post.platform} כרגע`);
      }

      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: 'published',
          publishedAt: new Date(),
          externalPostId: externalId,
          errorMessage: null,
        },
      });
      results.push({ id: post.id, ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: 'failed', errorMessage: msg.slice(0, 1000) },
      });
      results.push({ id: post.id, ok: false, error: msg });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
