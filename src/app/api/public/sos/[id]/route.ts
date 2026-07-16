import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { verifyShareToken } from '@/lib/share-tokens';
import { requireAuth } from '@/lib/api-helpers';

/**
 * GET /api/public/sos/[id]?token=<hmac>&exp=<epoch>
 *
 * Public incident report, gated by a valid HMAC share token.
 * Falls back to authenticated owner/admin. A guessed id alone is not enough.
 *
 * PRIVACY (2026-07-14):
 * When accessed anonymously via a share link, national ID numbers and driver
 * licence numbers of third parties (other drivers, owners, witnesses) are
 * MASKED to their last 4 digits. A share link is a bearer credential that can
 * be forwarded, so it must not carry the full national identifiers of people
 * who never consented to this platform. The authenticated owner and admins
 * continue to see the complete record.
 *
 * Every anonymous access is written to AuditLog (Israeli Privacy Protection
 * Security Regulations 2017, reg. 10 — access logging).
 */

/** ●●●●●1234 — keep the last 4 digits so the recipient can still cross-check. */
function maskId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (!v) return undefined;
  if (v.length <= 4) return '●'.repeat(v.length);
  return '●'.repeat(Math.max(v.length - 4, 3)) + v.slice(-4);
}

/** Redact the sensitive identifiers of third parties inside incidentData. */
function redactIncidentData(raw: unknown): unknown {
  if (typeof raw !== 'string' || !raw) return raw;
  let report: any;
  try {
    report = JSON.parse(raw);
  } catch {
    return raw; // unparseable — return as-is rather than break the page
  }
  if (!report || typeof report !== 'object') return raw;

  if (Array.isArray(report.involvedParties)) {
    report.involvedParties = report.involvedParties.map((p: any) => {
      if (!p || typeof p !== 'object') return p;
      return {
        ...p,
        idNumber: maskId(p.idNumber),
        driverLicenseNumber: maskId(p.driverLicenseNumber),
      };
    });
  }

  return JSON.stringify(report);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    const expiresAt = parseInt(url.searchParams.get('exp') || '0', 10);
    const tokenOk = !!token && verifyShareToken('sos-incident', id, token, expiresAt);

    // true  = anonymous holder of a share link  -> redact third-party identifiers
    // false = authenticated owner/admin         -> full record
    let anonymous = true;

    if (!tokenOk) {
      let payload;
      try {
        payload = requireAuth(req);
      } catch {
        return new Response(JSON.stringify({ error: 'אין הרשאה' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
      const owned = await prisma.sosEvent.findUnique({ where: { id }, select: { userId: true } });
      if (!owned) {
        return new Response(JSON.stringify({ error: 'האירוע לא נמצא' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      if (payload.role !== 'admin' && owned.userId !== payload.userId) {
        return new Response(JSON.stringify({ error: 'אין הרשאה' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
      anonymous = false;
    }

    const event = await prisma.sosEvent.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        eventType: true,
        status: true,
        location: true,
        notes: true,
        description: true,
        incidentData: true,
        photos: true,
        createdAt: true,
        vehicle: { select: { manufacturer: true, model: true, year: true, licensePlate: true } },
      },
    });

    if (!event) {
      return new Response(JSON.stringify({ error: 'האירוע לא נמצא' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const { userId: ownerId, ...rest } = event as any;
    const payloadOut = anonymous
      ? { ...rest, incidentData: redactIncidentData(event.incidentData), redacted: true }
      : rest;

    // --- reg. 10 access logging: record every anonymous share-link view ---
    if (anonymous) {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        null;
      prisma.auditLog
        .create({
          data: {
            action: 'EXPORT',
            userId: ownerId,
            resourceType: 'SosEvent',
            resourceId: id,
            resourceName: 'צפייה בדוח תאונה דרך קישור שיתוף ציבורי',
            ip: ip || undefined,
            userAgent: req.headers.get('user-agent') || undefined,
            status: 'success',
            metadata: JSON.stringify({ via: 'public-share-link', redacted: true }),
          },
        })
        .catch(() => { /* logging must never break the response */ });
    }

    return new Response(JSON.stringify({ event: payloadOut }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store',
        // never let an incident report be indexed or archived
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'שגיאה בטעינת האירוע' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
