/**
 * Partner / Affiliate Service
 *
 * Handles the bookkeeping for the AutoLog affiliate program:
 *   - Crediting a partner when a referred user signs up
 *   - Notifying admins when a partner's unpaid balance crosses ₪100
 *   - Marking payouts as completed
 *
 * Partners are managed via /admin/partners. Each partner has a unique
 * URL-safe `code` that appears in their personalized poster QR code, e.g.
 *   https://autolog.click/?ref=mosach-david-tlv
 *
 * The frontend captures `?ref=CODE` on landing, persists it in a cookie,
 * and forwards it through the signup form.
 */

import prisma from '@/lib/db';
import { notifyAdmins } from './notification-service';

/** Threshold (in ILS) at which admins get a "time to pay" notification. */
export const PAYOUT_NOTIFICATION_THRESHOLD = 100;

/**
 * Credit a partner for a new user signup.
 * Called from /api/auth/register *after* the user record is created.
 *
 * Behaviour:
 *   - Resolves the partner by `code` (lowercased, trimmed)
 *   - Only credits if partner exists AND status is `active`
 *   - In one transaction: links user → partner, increments signup/earnings totals
 *   - When unpaid balance crosses ₪100, sends a single admin notification
 *
 * Robustness:
 *   Errors are SWALLOWED and logged — a referral failure must never
 *   block the user's signup. The user gets registered either way.
 */
export async function creditReferral(opts: {
  userId: string;
  rawCode: string;
}): Promise<{ credited: boolean; partnerId?: string }> {
  const { userId, rawCode } = opts;
  const code = (rawCode || '').trim().toLowerCase();
  if (!code) return { credited: false };

  try {
    const partner = await prisma.partner.findUnique({ where: { code } });
    if (!partner || partner.status !== 'active') {
      // Unknown or inactive code — silently ignore.
      return { credited: false };
    }

    const commission = partner.commissionPerSignup;
    const balanceBefore = partner.totalEarned - partner.totalPaid;

    // Atomic: link user → partner AND bump partner totals.
    const updatedPartner = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { referredById: partner.id },
      });
      return tx.partner.update({
        where: { id: partner.id },
        data: {
          totalSignups: { increment: 1 },
          totalEarned: { increment: commission },
        },
      });
    });

    const balanceAfter = updatedPartner.totalEarned - updatedPartner.totalPaid;

    // Fire the "time to pay" admin notification exactly when we cross the threshold.
    // (We avoid re-notifying on every signup once balance >= threshold.)
    if (
      balanceBefore < PAYOUT_NOTIFICATION_THRESHOLD &&
      balanceAfter >= PAYOUT_NOTIFICATION_THRESHOLD
    ) {
      try {
        await notifyAdmins(
          'system',
          `הגיע הזמן לשלם ל${partner.name}`,
          `יתרת התשלום הצבורה: ₪${balanceAfter.toFixed(2)} (${updatedPartner.totalSignups} הרשמות). ניתן לסמן כשולם בדף הניהול.`,
          `/admin/partners/${partner.id}`,
        );
      } catch (notifyErr) {
        // Even if notification fails, the credit succeeded — log and move on.
        console.error('[partner-service] admin notification failed', notifyErr);
      }
    }

    return { credited: true, partnerId: partner.id };
  } catch (error) {
    console.error('[partner-service] creditReferral failed', {
      userId,
      rawCode,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return { credited: false };
  }
}

/**
 * Record a payout to a partner.
 * Called from the admin "mark as paid" action.
 *
 * Doesn't check that amount <= balance — the admin can record a partial or
 * over-payment if needed. The running totals just reflect what was paid.
 */
export async function recordPayout(opts: {
  partnerId: string;
  amount: number;
}): Promise<void> {
  const { partnerId, amount } = opts;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid payout amount');
  }
  await prisma.partner.update({
    where: { id: partnerId },
    data: {
      totalPaid: { increment: amount },
    },
  });
}

/**
 * Helper: compute outstanding balance.
 */
export function unpaidBalance(p: { totalEarned: number; totalPaid: number }): number {
  return Math.max(0, p.totalEarned - p.totalPaid);
}
