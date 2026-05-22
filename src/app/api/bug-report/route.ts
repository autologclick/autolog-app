import { NextRequest } from 'next/server';
import { z } from 'zod';
import { sendEmail, buildBugReportEmailHtml } from '@/lib/email';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/db';
import { createLogger } from '@/lib/logger';

const logger = createLogger('bug-report');

// =====================================================
// In-memory deduplication — prevents email storms
// =====================================================
// Key: hash of (source + error message + page URL)
// Value: timestamp of last email sent
// If a duplicate arrives within DEDUP_WINDOW, we record it but don't
// fire another email. Survives only for the lifetime of the Vercel
// serverless instance (a few minutes), which is plenty — if 50 users
// hit the same bug in 5 minutes, you'd get 1 email instead of 50.
const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const dedupCache = new Map<string, number>();

function dedupKey(parts: { source: string; errorMessage?: string | null; pageUrl: string }): string {
  return [parts.source, parts.errorMessage || 'no-error', parts.pageUrl].join('|');
}

function wasRecentlySent(key: string): boolean {
  const last = dedupCache.get(key);
  if (!last) return false;
  if (Date.now() - last > DEDUP_WINDOW_MS) {
    dedupCache.delete(key);
    return false;
  }
  return true;
}

function markSent(key: string): void {
  // Keep cache small (max 200 entries) — evict oldest if needed
  if (dedupCache.size > 200) {
    const oldestKey = dedupCache.keys().next().value;
    if (oldestKey) dedupCache.delete(oldestKey);
  }
  dedupCache.set(key, Date.now());
}

// =====================================================
// Schema
// =====================================================

const bugReportSchema = z.object({
  source: z.enum(['user-report', 'error-boundary', 'global-error']),
  userDescription: z.string().max(5000).optional(),
  errorMessage: z.string().max(2000).optional(),
  errorStack: z.string().max(10_000).optional(),
  pageUrl: z.string().max(500),
  userAgent: z.string().max(500),
  viewport: z.string().max(50).optional(),
  userEmail: z.string().email().max(200).optional().or(z.literal('')),
  sentryEventId: z.string().max(100).optional(),
});

// =====================================================
// Handler
// =====================================================

// Where the email goes. Hardcoded to the AutoLog ops inbox, with env
// override for staging/testing environments.
const RECIPIENT = process.env.BUG_REPORT_EMAIL || 'info@trademax.co.il';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bugReportSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || 'נתונים לא תקינים', 400);
    }
    const data = parsed.data;

    // Try to identify the user from their auth cookie (optional — anonymous
    // reports are valid for prospects hitting bugs on the homepage).
    let userName: string | null = null;
    let userId: string | null = null;
    let userEmailFromAuth: string | null = null;
    try {
      const token = req.cookies.get('auth-token')?.value;
      if (token) {
        const payload = verifyToken(token);
        if (payload?.userId) {
          userId = payload.userId;
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { fullName: true, email: true },
          });
          if (user) {
            userName = user.fullName;
            userEmailFromAuth = user.email;
          }
        }
      }
    } catch {
      // Anonymous report — that's fine
    }

    const finalUserEmail = data.userEmail || userEmailFromAuth;

    // Dedup check
    const key = dedupKey({
      source: data.source,
      errorMessage: data.errorMessage,
      pageUrl: data.pageUrl,
    });
    const isDuplicate = wasRecentlySent(key);

    if (isDuplicate) {
      logger.info('Bug report deduped', { source: data.source, pageUrl: data.pageUrl });
      // Still return success so the client doesn't show an error to the user
      return jsonResponse({ ok: true, deduped: true });
    }

    // Send the email
    const emailHtml = buildBugReportEmailHtml({
      source: data.source,
      userDescription: data.userDescription || null,
      errorMessage: data.errorMessage || null,
      errorStack: data.errorStack || null,
      pageUrl: data.pageUrl,
      userAgent: data.userAgent,
      viewport: data.viewport,
      userEmail: finalUserEmail,
      userName,
      userId,
      timestamp: new Date().toISOString(),
      sentryEventId: data.sentryEventId || null,
    });

    const subjectPrefix = {
      'user-report': '👤 דיווח באג ממשתמש',
      'error-boundary': '⚠️ קריסת רינדור',
      'global-error': '🚨 קריסה גלובלית',
    }[data.source];

    const subjectSuffix = data.userDescription
      ? `: ${data.userDescription.slice(0, 60)}`
      : data.errorMessage
      ? `: ${data.errorMessage.slice(0, 60)}`
      : ` ב-${new URL(data.pageUrl).pathname}`;

    const sent = await sendEmail({
      to: RECIPIENT,
      subject: `${subjectPrefix}${subjectSuffix}`,
      html: emailHtml,
    });

    if (sent) {
      markSent(key);
      logger.info('Bug report email sent', { source: data.source, to: RECIPIENT });
    } else {
      logger.warn('Bug report email failed to send (Resend issue)', {
        source: data.source,
        userId,
      });
    }

    // Return ok=true regardless — we don't want the user-facing UI to show
    // a failure if our email server has a hiccup. The Sentry capture (done
    // separately on the client) is the durable backup.
    return jsonResponse({ ok: true, emailSent: sent, deduped: false });
  } catch (error) {
    logger.error('Bug report handler crashed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error);
  }
}
