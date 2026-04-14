import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { verifyPassword } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit-log';

// POST /api/user/gdpr-delete - GDPR Art. 17 "right to be forgotten".
// Hard-deletes the caller's account and all related data. Irreversible.
// Requires password confirmation and a textual confirmation phrase.
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();
    const { password, confirmPhrase } = body || {};

    if (!password || confirmPhrase !== 'מחק את החשבון שלי') {
      return errorResponse('יש לאשר עם סיסמה וכיתוב "מחק את החשבון שלי"', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, passwordHash: true, role: true, email: true, fullName: true },
    });
    if (!user) return errorResponse('משתמש לא נמצא', 404);
    if (user.role === 'admin') {
      return errorResponse('לא ניתן למחוק חשבון אדמין דרך GDPR. פנה לאדמין אחר.', 403);
    }

    const pwOk = await verifyPassword(password, user.passwordHash);
    if (!pwOk) return errorResponse('סיסמה שגויה', 401);

    const userId = user.id;

    // Collect vehicle IDs for manual cleanup of non-cascading relations
    const vehicles = await prisma.vehicle.findMany({
      where: { userId },
      select: { id: true },
    });
    const vehicleIds = vehicles.map(v => v.id);

    // Cascade manually where Prisma relations don't cascade
    await prisma.$transaction([
      prisma.treatment.deleteMany({ where: { OR: [{ userId }, { vehicleId: { in: vehicleIds } }] } }),
      prisma.expense.deleteMany({ where: { vehicleId: { in: vehicleIds } } }),
      prisma.inspectionItem.deleteMany({ where: { inspection: { vehicleId: { in: vehicleIds } } } }),
      prisma.inspection.deleteMany({ where: { vehicleId: { in: vehicleIds } } }),
      prisma.document.deleteMany({ where: { vehicleId: { in: vehicleIds } } }),
      prisma.benefitRedemption.deleteMany({ where: { userId } }),
      prisma.vehicleShare.deleteMany({ where: { OR: [{ ownerId: userId }, { sharedWithUserId: userId }] } }),
      // appointments/sosEvents/notifications/vehicles are cascaded via onDelete: Cascade on User
      prisma.user.delete({ where: { id: userId } }),
    ]);

    logAuditEvent('DELETE', userId, 'user', userId, {
      req,
      resourceName: user.email,
      metadata: { gdpr: true, email: user.email },
    });

    const response = jsonResponse({ success: true, message: 'החשבון נמחק' });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('refresh-token', '', { maxAge: 0, path: '/' });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
