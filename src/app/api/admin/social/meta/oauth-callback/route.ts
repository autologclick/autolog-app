/**
 * GET /api/admin/social/meta/oauth-callback?code=...
 *
 * OAuth 2.0 callback for the Meta (Facebook) Login flow.
 *
 * Flow:
 *   1. Admin clicks "Connect Facebook" → browser is sent to
 *      https://www.facebook.com/v20.0/dialog/oauth?client_id=...&redirect_uri=...&scope=...
 *   2. Meta redirects back here with ?code=XXX
 *   3. We exchange code → short-lived user token → long-lived user token
 *   4. We list the user's pages, save one SocialAccount row per page
 *      (and a second row for any connected Instagram business account)
 *   5. Redirect the admin back to /admin/social?connected=1
 *
 * ENV required:
 *   META_APP_ID
 *   META_APP_SECRET
 *   NEXT_PUBLIC_APP_URL   (used to build redirect_uri)
 *
 * Permissions to request in the OAuth dialog:
 *   pages_show_list
 *   pages_manage_posts
 *   pages_read_engagement
 *   instagram_basic
 *   instagram_content_publish
 *   business_management
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, handleApiError } from '@/lib/api-helpers';
import {
  exchangeForLongLivedToken,
  fetchUserPages,
} from '@/lib/social/meta-publisher';

const GRAPH_VERSION = 'v20.0';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const code = new URL(req.url).searchParams.get('code');
    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/social?error=missing_code', req.url),
      );
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

    if (!appId || !appSecret) {
      return NextResponse.redirect(
        new URL('/admin/social?error=meta_not_configured', req.url),
      );
    }

    const redirectUri = `${appUrl}/api/admin/social/meta/oauth-callback`;

    // 1) code → short-lived token
    const tokenUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const shortRes = await fetch(tokenUrl.toString());
    if (!shortRes.ok) {
      return NextResponse.redirect(
        new URL('/admin/social?error=short_token_failed', req.url),
      );
    }
    const shortJson = (await shortRes.json()) as { access_token: string };

    // 2) short-lived → long-lived user token
    const longLived = await exchangeForLongLivedToken({
      shortLivedToken: shortJson.access_token,
      appId,
      appSecret,
    });

    // 3) pages the user manages
    const pages = await fetchUserPages(longLived.accessToken);

    // 4) Upsert one SocialAccount per page (+ IG if connected)
    for (const page of pages.data) {
      await prisma.socialAccount.upsert({
        where: {
          platform_accountId: { platform: 'facebook', accountId: page.id },
        },
        create: {
          platform: 'facebook',
          accountId: page.id,
          accountName: page.name,
          accessToken: page.access_token, // page token = permanent when derived from long-lived user token
          metadata: { pageId: page.id },
          isActive: true,
        },
        update: {
          accountName: page.name,
          accessToken: page.access_token,
          metadata: { pageId: page.id },
          isActive: true,
        },
      });

      if (page.instagram_business_account?.id) {
        const igId = page.instagram_business_account.id;
        await prisma.socialAccount.upsert({
          where: {
            platform_accountId: { platform: 'instagram', accountId: igId },
          },
          create: {
            platform: 'instagram',
            accountId: igId,
            accountName: `${page.name} (Instagram)`,
            accessToken: page.access_token,
            metadata: { instagramAccountId: igId, linkedPageId: page.id },
            isActive: true,
          },
          update: {
            accountName: `${page.name} (Instagram)`,
            accessToken: page.access_token,
            metadata: { instagramAccountId: igId, linkedPageId: page.id },
            isActive: true,
          },
        });
      }
    }

    return NextResponse.redirect(
      new URL('/admin/social?connected=1', req.url),
    );
  } catch (err) {
    return handleApiError(err);
  }
}
