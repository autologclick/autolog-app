import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { z } from 'zod';

const schema = z.object({
  currentPassword: z.string().min(1, 'סיסמה נוכחית נדרשת'),
  newPassword: z.string().min(6, 'סיסמה חדשה חייבת להכיל לפחות 6 תווים'),
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
      return errorResponse('משתמש לא נמצא', 404);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return errorResponse('סיסמה נוכחית שגויה', 401);
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash: newHash },
    });

    return jsonResponse({ message: 'הסיסמה שונתה בהצלחה' });
  } catch (error) {
    return handleApiError(error);
  }
}
