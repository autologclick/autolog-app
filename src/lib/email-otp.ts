import crypto from 'crypto';
import prisma from '@/lib/db';
import { sendEmail } from '@/lib/email';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateCode(): string {
  // 6-digit numeric code (cryptographically random)
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}

/**
 * Issue a fresh OTP: invalidates any previous unconsumed codes for this email,
 * persists the hashed new code, and emails the plaintext code.
 */
export async function issueEmailOtp(email: string, fullName?: string | null): Promise<void> {
  const normalized = email.toLowerCase();
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Invalidate any outstanding codes for this email (prevent stockpiling)
  await prisma.emailOtp.updateMany({
    where: { email: normalized, consumed: false },
    data: { consumed: true },
  });

  await prisma.emailOtp.create({
    data: { email: normalized, codeHash, expiresAt },
  });

  await sendEmail({
    to: email,
    subject: 'AutoLog — קוד אימות כניסה',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg,#2563eb,#1e40af); color:#fff; padding:20px; border-radius:12px 12px 0 0;">
          <h1 style="margin:0; font-size:22px;">AutoLog</h1>
        </div>
        <div style="background:#fff; border:1px solid #e5e7eb; border-top:0; padding:24px; border-radius:0 0 12px 12px;">
          <p style="font-size:16px; margin-top:0;">שלום ${fullName || ''},</p>
          <p style="font-size:16px;">קוד האימות לכניסה לחשבון שלך הוא:</p>
          <div style="font-family: 'Courier New', monospace; font-size:36px; letter-spacing:8px; text-align:center; background:#f3f4f6; padding:20px; border-radius:12px; margin:20px 0; font-weight:bold; color:#1e40af;">
            ${code}
          </div>
          <p style="font-size:14px; color:#6b7280;">הקוד תקף ל-10 דקות ונועד לשימוש חד-פעמי.</p>
          <p style="font-size:14px; color:#dc2626; margin-top:20px;">
            <strong>אם לא ביקשת להתחבר — התעלם מהודעה זו ושקול להחליף את הסיסמה שלך.</strong>
          </p>
          <hr style="border:0; border-top:1px solid #e5e7eb; margin:24px 0;">
          <p style="font-size:12px; color:#9ca3af; margin:0;">
            AutoLog · autolog.click · אימייל אוטומטי, אנא אל תשיב
          </p>
        </div>
      </div>
    `,
  });
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'expired' | 'too_many_attempts' | 'invalid' };

/**
 * Verify a submitted code. On success, marks it consumed. On failure, increments attempts.
 */
export async function verifyEmailOtp(email: string, code: string): Promise<OtpVerifyResult> {
  const normalized = email.toLowerCase();
  const codeHash = hashCode(code);

  const record = await prisma.emailOtp.findFirst({
    where: { email: normalized, consumed: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) return { ok: false, reason: 'not_found' };
  if (record.expiresAt < new Date()) return { ok: false, reason: 'expired' };
  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.emailOtp.update({ where: { id: record.id }, data: { consumed: true } });
    return { ok: false, reason: 'too_many_attempts' };
  }

  if (record.codeHash !== codeHash) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: 'invalid' };
  }

  // Success — consume
  await prisma.emailOtp.update({
    where: { id: record.id },
    data: { consumed: true },
  });
  return { ok: true };
}

/**
 * Housekeeping — delete consumed/expired records older than 24 hours.
 * Called opportunistically from the issue endpoint.
 */
export async function pruneOldOtps(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.emailOtp.deleteMany({
      where: {
        OR: [{ consumed: true }, { expiresAt: { lt: new Date() } }],
        createdAt: { lt: cutoff },
      },
    });
  } catch {
    // non-fatal
  }
}
