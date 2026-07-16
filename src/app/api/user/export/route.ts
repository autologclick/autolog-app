import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-helpers';

/**
 * GET /api/user/export
 *
 * Returns everything we hold about the authenticated user as a single JSON file.
 * This implements the data-subject right of access promised in the privacy policy
 * (Israeli Privacy Protection Law — זכות עיון).
 *
 * Deliberately excludes: passwordHash, twoFactorSecret, twoFactorBackupCodes and
 * reset tokens. Those are credentials, not "information about the person", and
 * handing them back would be a security regression, not a transparency win.
 */
export async function GET(req: NextRequest) {
  let payload;
  try {
    payload = requireAuth(req);
  } catch {
    return new Response(JSON.stringify({ error: 'אין הרשאה' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const userId = payload.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, phone: true, fullName: true, idNumber: true,
        licenseNumber: true, licenseExpiry: true, role: true, city: true,
        address: true, dateOfBirth: true, gender: true, preferredLanguage: true,
        emailVerified: true, phoneVerified: true, lastLoginAt: true,
        createdAt: true, updatedAt: true, avatarUrl: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'המשתמש לא נמצא' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    const [vehicles, sosEvents, appointments, notifications, auditLog] = await Promise.all([
      prisma.vehicle.findMany({ where: { userId } }),
      prisma.sosEvent.findMany({ where: { userId } }),
      prisma.appointment.findMany({ where: { userId } }).catch(() => []),
      prisma.notification.findMany({ where: { userId } }).catch(() => []),
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 500,
        select: { timestamp: true, action: true, resourceType: true, resourceName: true, ip: true },
      }).catch(() => []),
    ]);

    const vehicleIds = vehicles.map((v: any) => v.id);
    const [treatments, expenses, documents] = await Promise.all([
      prisma.treatment.findMany({ where: { vehicleId: { in: vehicleIds } } }).catch(() => []),
      prisma.expense.findMany({ where: { vehicleId: { in: vehicleIds } } }).catch(() => []),
      prisma.document.findMany({ where: { vehicleId: { in: vehicleIds } } }).catch(() => []),
    ]);

    const bundle = {
      _meta: {
        generatedAt: new Date().toISOString(),
        service: 'AutoLog',
        note: 'ייצוא מלא של המידע האישי שלך, בהתאם לזכות העיון לפי חוק הגנת הפרטיות. ' +
              'סיסמאות וסודות אימות אינם נכללים מטעמי אבטחה.',
      },
      חשבון: user,
      רכבים: vehicles,
      טיפולים: treatments,
      הוצאות: expenses,
      מסמכים: documents,
      תורים: appointments,
      אירועי_חירום_ותאונות: sosEvents,
      התראות: notifications,
      יומן_פעולות_אחרון: auditLog,
    };

    // record the access request itself — reg. 10
    prisma.auditLog.create({
      data: {
        action: 'EXPORT',
        userId,
        resourceType: 'User',
        resourceId: userId,
        resourceName: 'ייצוא מידע אישי ביוזמת המשתמש (זכות עיון)',
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        status: 'success',
      },
    }).catch(() => {});

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="autolog-my-data-${stamp}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'שגיאה בייצוא. פנה אלינו: info@autolog.click' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
