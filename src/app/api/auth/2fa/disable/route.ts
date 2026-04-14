import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { verifyPassword } from '@/lib/auth';
import { verifyTotp, verifyBackupCode } from '@/lib/totp';
import { logAuditEvent } from '@/lib/audit-log';

// POST /api/auth/2fa/disable - Disable 2FA. Requires current password
// plus a valid TOTP/backup code. Admins are blocked from disabling (see below).
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();
    const password: string = (body?.password || '').toString();
    const code: string = (body?.code || '').toString();

    if (!password || !code) return errorResponse('נדרשת סיסמה וקוד אימות', 400);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        passwordHash: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
        role: true,
      },
    });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return errorResponse('2FA אינו מופעל', 400);
    }

    // Admin policy: cannot self-disable (must go through another admin / recovery)
    if (user.role === 'admin') {
      return errorResponse('חשבון אדמין לא יכול לבטל 2FA בעצמו', 403);
    }

    const pwOk = await verifyPassword(password, user.passwordHash);
    if (!pwOk) return errorResponse('סיסמה שגויה', 400);

    let codeOk = verifyTotp(user.twoFactorSecret, code);
    if (!codeOk && user.twoFactorBackupCodes) {
      const list: string[] = JSON.parse(user.twoFactorBackupCodes);
      const res = verifyBackupCode(code, list);
      if (res.ok) codeOk = true;
    }
    if (!codeOk) return errorResponse('קוד שגוי', 400);

    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    logAuditEvent('PERMISSION_CHANGE', payload.userId, 'user', payload.userId, {
      req,
      metadata: { twoFactorEnabled: false },
    });

    return jsonResponse({ success: true, message: '2FA בוטל' });
  } catch (error) {
    return handleApiError(error);
  }
}
