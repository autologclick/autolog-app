import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { verifyTotp, generateBackupCodes } from '@/lib/totp';
import { logAuditEvent } from '@/lib/audit-log';

// POST /api/auth/2fa/verify - Confirm staged secret with a TOTP code;
// on success, enable 2FA and issue backup codes.
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();
    const code: string = (body?.code || '').toString();
    if (!code) return errorResponse('חסר קוד אימות', 400);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user?.twoFactorSecret) return errorResponse('לא התבצעה התחלת הגדרה של 2FA', 400);

    if (!verifyTotp(user.twoFactorSecret, code)) {
      return errorResponse('קוד שגוי. נסה שוב.', 400);
    }

    const { plain, hashed } = generateBackupCodes();
    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(hashed),
      },
    });

    logAuditEvent('PERMISSION_CHANGE', payload.userId, 'user', payload.userId, {
      req,
      metadata: { twoFactorEnabled: true },
    });

    return jsonResponse({
      success: true,
      backupCodes: plain,
      message: '2FA הופעל. שמור את קודי הגיבוי במקום בטוח.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
