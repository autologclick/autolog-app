import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-helpers';

/**
 * DELETE /api/user/account
 *
 * Permanently deletes the authenticated user's account and all personal data.
 * Implements the data-subject right of erasure promised in the privacy policy
 * (Israeli Privacy Protection Law).
 *
 * Confirmation: the caller must send their own e-mail address in the body.
 * This is a deliberate friction step — an accidental click cannot destroy data.
 *
 * Order of operations matters:
 *  1. Write the AuditLog entry FIRST. AuditLog has no foreign key to User, so
 *     the record survives the deletion and gives us a retained, PII-free trace
 *     that an erasure happened (required by the security regulations).
 *  2. Delete VehicleShare rows explicitly — its `owner` relation is required
 *     with no onDelete rule, so Postgres would RESTRICT the user delete.
 *  3. Delete the User. Cascades take care of Vehicle -> Treatment / Expense /
 *     Document / Inspection, plus SosEvent, Appointment, Notification, OAuth.
 */
export async function DELETE(req: NextRequest) {
  let payload;
  try {
    payload = requireAuth(req);
  } catch {
    return new Response(JSON.stringify({ error: 'אין הרשאה' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const confirmEmail = String(body?.confirmEmail || '').trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'המשתמש לא נמצא' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!confirmEmail || confirmEmail !== user.email.trim().toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'כתובת הדוא"ל שהוזנה אינה תואמת לכתובת החשבון' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Guard: an admin deleting themselves would lock the platform out.
    if (user.role === 'admin') {
      return new Response(
        JSON.stringify({ error: 'לא ניתן למחוק חשבון מנהל דרך המסך הזה' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      undefined;

    // 1. retained, PII-free record of the erasure
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        userId: user.id,
        resourceType: 'User',
        resourceId: user.id,
        resourceName: 'מחיקת חשבון ביוזמת המשתמש',
        ip,
        userAgent: req.headers.get('user-agent') || undefined,
        status: 'success',
        metadata: JSON.stringify({ reason: 'user-requested-erasure', at: new Date().toISOString() }),
      },
    }).catch(() => { /* never block the erasure on logging */ });

    // 2. + 3. remove blocking rows, then the user (cascades do the rest)
    await prisma.$transaction(async (tx) => {
      await tx.vehicleShare.deleteMany({
        where: { OR: [{ ownerUserId: user.id }, { sharedWithUserId: user.id }] },
      });
      await tx.user.delete({ where: { id: user.id } });
    });

    // clear the session cookie
    const res = new Response(
      JSON.stringify({ ok: true, message: 'החשבון והמידע נמחקו' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    res.headers.append('Set-Cookie', 'token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure');
    res.headers.append('Set-Cookie', 'auth-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure');
    return res;
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'שגיאה במחיקת החשבון. אנא פנה אלינו: info@autolog.click' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
