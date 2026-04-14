import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { generateSecret, buildOtpauthUri } from '@/lib/totp';

// POST /api/auth/2fa/setup - Generate new TOTP secret + otpauth URI.
// The user must then verify a code before 2FA is actually enabled.
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, twoFactorEnabled: true },
    });
    if (!user) return errorResponse('משתמש לא נמצא', 404);
    if (user.twoFactorEnabled) {
      return errorResponse('2FA כבר מופעל. יש לבטל לפני הגדרה מחדש.', 400);
    }

    const secret = generateSecret();
    // Stage the secret on the user row but keep disabled until verified
    await prisma.user.update({
      where: { id: payload.userId },
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
    });

    const uri = buildOtpauthUri({
      secret,
      label: user.email,
      issuer: 'AutoLog',
    });

    return jsonResponse({ secret, otpauthUri: uri });
  } catch (error) {
    return handleApiError(error);
  }
}
