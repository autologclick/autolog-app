/**
 * GET /api/cron/social-publish
 *
 * Publishes every SocialPost whose scheduledFor has passed. This is the piece
 * that was missing: scheduledFor was written but nothing ever read it.
 *
 * Auth: same bearer-token pattern as /api/cron/send-reminders.
 * Cron:  every 10 minutes (see 08-install-cron.sh)
 *
 * Safety:
 *   - One post per run. Meta rate limits are per-account and a stuck video
 *     upload can take minutes; serial keeps us far from any ceiling.
 *   - Three attempts, then status=failed with the error recorded so it shows
 *     up in the dashboard instead of retrying forever.
 *   - DRY_RUN_SOCIAL=1 in env publishes nothing publicly — Facebook posts are
 *     created unpublished, Instagram stops at the container.
 */
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { jsonResponse, handleApiError } from '@/lib/api-helpers';
import {
  publishToFacebook,
  publishToInstagram,
  MetaPublishError,
} from '@/lib/social/meta-publisher';

const MAX_ATTEMPTS = 3;

/**
 * Deliberately console, not the app logger.
 *
 * An earlier version imported a logger that resolved to undefined at runtime.
 * It threw *after* a post had published successfully, and the catch block then
 * recorded the post as failed — the publish worked, the bookkeeping lied.
 * Logging must never be able to do that. console always exists, and PM2
 * captures stdout.
 */
function log(event: string, data: Record<string, unknown>): void {
  console.log(JSON.stringify({ event, ...data }));
}

/** Posts that failed this many times stop being retried. */
function hasExhaustedRetries(errorMessage: string | null): boolean {
  if (!errorMessage) return false;
  const match = errorMessage.match(/^\[attempt (\d+)\]/);
  return match ? Number(match[1]) >= MAX_ATTEMPTS : false;
}

function attemptNumber(errorMessage: string | null): number {
  if (!errorMessage) return 1;
  const match = errorMessage.match(/^\[attempt (\d+)\]/);
  return match ? Number(match[1]) + 1 : 1;
}

export async function GET(req: NextRequest) {
  try {
    const expected = process.env.CRON_SECRET;
    const provided = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!expected || provided !== expected) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const dryRun = process.env.DRY_RUN_SOCIAL === '1';

    const post = await prisma.socialPost.findFirst({
      where: {
        status: 'scheduled',
        scheduledFor: { lte: new Date() },
      },
      orderBy: { scheduledFor: 'asc' },
      include: { socialAccount: true },
    });

    if (!post) {
      return jsonResponse({ published: 0, message: 'nothing due' });
    }

    if (hasExhaustedRetries(post.errorMessage)) {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: 'failed' },
      });
      return jsonResponse({ published: 0, message: `post ${post.id} exhausted retries` });
    }

    if (!post.socialAccount || !post.socialAccount.isActive) {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: 'failed', errorMessage: 'No active social account linked' },
      });
      return jsonResponse({ published: 0, message: 'no active account' });
    }

    await prisma.socialPost.update({
      where: { id: post.id },
      data: { status: 'publishing' },
    });

    const account = post.socialAccount;
    const mediaUrl = post.mediaUrls[0];
    const caption = [post.caption, post.hashtags].filter(Boolean).join('\n\n');

    // Only the network call belongs in the try. Once Meta has accepted the
    // post, nothing that happens afterwards may mark it failed.
    let externalPostId: string;
    try {
      if (account.platform === 'facebook') {
        const result = await publishToFacebook({
          pageId: account.accountId,
          pageAccessToken: account.accessToken,
          message: caption,
          mediaUrl,
          linkUrl: post.linkUrl ?? undefined,
          dryRun,
        });
        externalPostId = result.id;
      } else {
        if (!mediaUrl) throw new MetaPublishError('Instagram posts require media');
        const result = await publishToInstagram({
          igUserId: account.accountId,
          accessToken: account.accessToken,
          caption,
          mediaUrl,
          isStory: account.platform === 'instagram_story',
          dryRun,
        });
        externalPostId = result.id;
      }
    } catch (error) {
      const attempt = attemptNumber(post.errorMessage);
      const detail = error instanceof MetaPublishError
        ? `${error.message}${error.code ? ` (code ${error.code})` : ''}`
        : error instanceof Error
          ? error.message
          : 'Unknown error';

      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: attempt >= MAX_ATTEMPTS ? 'failed' : 'scheduled',
          errorMessage: `[attempt ${attempt}] ${detail}`,
        },
      });

      log('social_publish_failed', { postId: post.id, platform: account.platform, attempt, detail });
      return jsonResponse({ published: 0, postId: post.id, attempt, error: detail });
    }

    // Past this point the post exists on Meta. Record that fact.
    await prisma.$transaction([
      prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: dryRun ? 'draft' : 'published',
          publishedAt: dryRun ? null : new Date(),
          externalPostId,
          errorMessage: dryRun ? '[dry run] not made public' : null,
        },
      }),
      prisma.socialAccount.update({
        where: { id: account.id },
        data: { lastUsedAt: new Date() },
      }),
    ]);

    log('social_published', { postId: post.id, platform: account.platform, externalPostId, dryRun });
    return jsonResponse({ published: 1, postId: post.id, externalPostId, dryRun });
  } catch (error) {
    return handleApiError(error);
  }
}
