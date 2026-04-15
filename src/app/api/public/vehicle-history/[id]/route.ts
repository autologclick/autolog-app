import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { verifyShareToken } from '@/lib/share-tokens';
import { requireAuth } from '@/lib/api-helpers';

/**
 * GET /api/public/vehicle-history/[id]?token=<hmac>&exp=<epoch>
 *
 * Returns vehicle inspection & service history. Access granted via either:
 *  (a) valid HMAC share token + expiration (for public sharing with buyers), OR
 *  (b) authenticated owner / admin.
 *
 * A guessed vehicle UUID alone is NOT sufficient.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = params.id;

    // --- Access control: token OR owner/admin ---
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    const expStr = url.searchParams.get('exp') || '0';
    const expiresAt = parseInt(expStr, 10);
    const tokenOk = token && verifyShareToken('vehicle-history', vehicleId, token, expiresAt);

    if (!tokenOk) {
      // Fall back to authenticated access
      let payload;
      try {
        payload = requireAuth(req);
      } catch {
        return new Response(
          JSON.stringify({ error: 'אין הרשאה לצפות בהיסטוריית הרכב' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const owned = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { userId: true },
      });
      if (!owned) {
        return new Response(
          JSON.stringify({ error: 'רכב לא נמצא' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (payload.role !== 'admin' && owned.userId !== payload.userId) {
        return new Response(
          JSON.stringify({ error: 'אין הרשאה לצפות בהיסטוריית הרכב' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
        manufacturer: true,
        model: true,
        year: true,
        licensePlate: true,
        color: true,
        mileage: true,
        testExpiryDate: true,
        testStatus: true,
        insuranceExpiry: true,
        insuranceStatus: true,
        createdAt: true,
      },
    });

    if (!vehicle) {
      return new Response(
        JSON.stringify({ error: '\u05e8\u05db\u05d1 \u05dc\u05d0 \u05e0\u05de\u05e6\u05d0' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get inspections
    const inspections = await prisma.inspection.findMany({
      where: { vehicleId, status: 'completed' },
      select: {
        id: true,
        date: true,
        inspectionType: true,
        overallScore: true,
        mileage: true,
        summary: true,
        mechanicName: true,
        garage: { select: { name: true, city: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Get appointments (completed only)
    const appointments = await prisma.appointment.findMany({
      where: { vehicleId, status: 'completed' },
      select: {
        id: true,
        date: true,
        serviceType: true,
        notes: true,
        completionNotes: true,
        garage: { select: { name: true, city: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Build timeline
    const timeline = [];

    for (const insp of inspections) {
      timeline.push({
        type: 'inspection',
        date: insp.date,
        title: getInspectionTypeHeb(insp.inspectionType),
        score: insp.overallScore,
        mileage: insp.mileage,
        summary: insp.summary,
        mechanic: insp.mechanicName,
        garage: insp.garage?.name || null,
        city: insp.garage?.city || null,
        inspectionId: insp.id,
      });
    }

    for (const appt of appointments) {
      timeline.push({
        type: 'service',
        date: appt.date,
        title: getServiceTypeHeb(appt.serviceType),
        notes: appt.completionNotes || appt.notes,
        garage: appt.garage?.name || null,
        city: appt.garage?.city || null,
      });
    }

    // Sort by date desc
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return new Response(
      JSON.stringify({
        vehicle,
        timeline,
        totalInspections: inspections.length,
        totalServices: appointments.length,
        generatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=300',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '\u05e9\u05d2\u05d9\u05d0\u05d4 \u05d1\u05d8\u05e2\u05d9\u05e0\u05ea \u05d4\u05d9\u05e1\u05d8\u05d5\u05e8\u05d9\u05d4' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function getInspectionTypeHeb(type: string): string {
  const map: Record<string, string> = {
    full: '\u05d1\u05d3\u05d9\u05e7\u05d4 \u05de\u05e7\u05d9\u05e4\u05d4',
    rot: '\u05d1\u05d3\u05d9\u05e7\u05ea ROT',
    engine: '\u05d1\u05d3\u05d9\u05e7\u05ea \u05de\u05e0\u05d5\u05e2',
    pre_test: '\u05d1\u05d3\u05d9\u05e7\u05d4 \u05dc\u05e4\u05e0\u05d9 \u05d8\u05e1\u05d8',
    tires: '\u05d1\u05d3\u05d9\u05e7\u05ea \u05e6\u05de\u05d9\u05d2\u05d9\u05dd',
    brakes: '\u05d1\u05d3\u05d9\u05e7\u05ea \u05d1\u05dc\u05de\u05d9\u05dd',
    periodic: '\u05d1\u05d3\u05d9\u05e7\u05d4 \u05ea\u05e7\u05d5\u05e4\u05ea\u05d9\u05ea',
    troubleshoot: '\u05d0\u05d9\u05d1\u05d7\u05d5\u05df \u05ea\u05e7\u05dc\u05d4',
  };
  return map[type] || '\u05d1\u05d3\u05d9\u05e7\u05d4';
}

function getServiceTypeHeb(type: string): string {
  const map: Record<string, string> = {
    inspection: '\u05d1\u05d3\u05d9\u05e7\u05d4',
    maintenance: '\u05d8\u05d9\u05e4\u05d5\u05dc',
    repair: '\u05ea\u05d9\u05e7\u05d5\u05df',
    test_prep: '\u05d4\u05db\u05e0\u05d4 \u05dc\u05d8\u05e1\u05d8',
  };
  return map[type] || '\u05e9\u05d9\u05e8\u05d5\u05ea';
}
