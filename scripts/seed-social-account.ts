/**
 * scripts/seed-social-account.ts
 *
 * Creates (or updates) the SocialAccount rows the publisher needs, using the
 * never-expiring system-user token from /opt/autolog-marketing/.env.
 *
 * Replaces the 60-day OAuth token flow. Page tokens derived from a
 * non-expiring system-user token do not expire either, so tokenExpiresAt
 * stays null and nothing silently dies two months from now.
 *
 * Run:  cd /var/www/autolog-app && npx tsx scripts/seed-social-account.ts
 * Safe to run repeatedly — upserts on (platform, accountId).
 */
import { readFileSync } from 'node:fs';
import prisma from '../src/lib/db';

const ENV_PATH = '/opt/autolog-marketing/.env';

function loadEnv(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

async function fetchPageToken(
  version: string,
  pageId: string,
  systemUserToken: string,
): Promise<string> {
  const url = `https://graph.facebook.com/${version}/me/accounts?fields=id,name,access_token&access_token=${systemUserToken}`;
  const res = await fetch(url);
  const body = (await res.json()) as {
    data?: Array<{ id: string; name: string; access_token: string }>;
    error?: { message: string };
  };

  if (body.error) throw new Error(`Meta error: ${body.error.message}`);

  const page = body.data?.find((p) => p.id === pageId);
  if (!page) throw new Error(`Page ${pageId} not found on this token`);
  return page.access_token;
}

async function main(): Promise<void> {
  const env = loadEnv(ENV_PATH);
  const version = env.META_API_VERSION ?? 'v26.0';
  const pageId = env.META_PAGE_ID;
  const igId = env.META_IG_ID;
  const systemToken = env.META_SYSTEM_USER_TOKEN;

  if (!pageId || !igId || !systemToken) {
    throw new Error(`Missing META_PAGE_ID / META_IG_ID / META_SYSTEM_USER_TOKEN in ${ENV_PATH}`);
  }

  const pageToken = await fetchPageToken(version, pageId, systemToken);
  console.log(`[ OK ] page token retrieved (${pageToken.length} chars)`);

  // Instagram publishing via Facebook Login uses the Page token, not the
  // system-user token directly.
  const rows = [
    { platform: 'facebook' as const, accountId: pageId, accountName: 'אוטולוג AutoLog' },
    { platform: 'instagram' as const, accountId: igId, accountName: '@autolog.click' },
  ];

  for (const row of rows) {
    await prisma.socialAccount.upsert({
      where: { platform_accountId: { platform: row.platform, accountId: row.accountId } },
      create: {
        ...row,
        accessToken: pageToken,
        tokenExpiresAt: null,
        isActive: true,
        metadata: { source: 'system_user', businessId: env.META_BUSINESS_ID ?? null },
      },
      update: {
        accessToken: pageToken,
        tokenExpiresAt: null,
        isActive: true,
        metadata: { source: 'system_user', businessId: env.META_BUSINESS_ID ?? null },
      },
    });
    console.log(`[ OK ] ${row.platform} → ${row.accountName} (${row.accountId})`);
  }

  const total = await prisma.socialAccount.count({ where: { isActive: true } });
  console.log(`[ OK ] ${total} active social accounts`);
}

main()
  .catch((error: unknown) => {
    console.error('[FAIL]', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
