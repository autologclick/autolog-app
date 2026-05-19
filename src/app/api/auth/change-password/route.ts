import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { NOT_FOUND, AUTH_ERRORS, SUCCESS_MESSAGES } from '@/lib/messages';
import { z } from 'zod';

// Match the registration password policy. Allowing a weaker password here
// was a silent security regression — an attacker who steals a session can
// downgrade the victim's password to something easy to brute-force.
const schema = z.object({
  currentPassword: z.string().min(1, 'סיסמה נוכחית נדרשת'),
  newPassword: z
    .string()
    .min(8, 'סיסמה חדשה חייבת להכיל לפחות 8 תווים')
    .regex(/[A-Z]/, 'הסיסמה חייבת לכלול אות גדולה באנגלית')
    .regex(/[a-z]/, 'הסיסמה חייבת לכלול אות קטנה באנגלית')
    .regex(/[0-9]/, 'הסיסמה חייבת לכלול ספרה')
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/, 'הסיסמה חייבת לכלול תו מיוחד'),
});

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const validation = schema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'שגיאת אימות';
      return errorResponse(firstError, 400);
    }

    const { currentPassword, newPassword } = validation.data;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return errorResponse(NOT_FOUND.USER, 404);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return errorResponse(AUTH_ERRORS.CURRENT_PASSWORD_WRONG, 401);
    }

    // Reject reusing the same password
    const sameAsOld = await bcrypt.compare(newPassword, user.passwordHash);
    if (sameAsOld) {
      return errorResponse('הסיסמה החדשה זהה לקיימת. אנא בחר סיסמה שונה.', 400);
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash: newHash },
    });

    return jsonResponse({ message: SUCCESS_MESSAGES.PASSWORD_CHANGED });
  } catch (error) {
    return handleApiError(error);
  }
}
