export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard — aggregated payload for the user dashboard.
 *
 * Replaces 8+ separate client fetches with a single round-trip by composing
 * the EXISTING route handlers internally (no query logic is duplicated here;
 * every sub-handler keeps enforcing its own auth/ownership/rate-limit rules).
 *
 * Query params:
 *   vehicleId — preferred vehicle (falls back to primary, then first)
 *   scope=vehicle — skip user/vehicles/transfers, return only vehicleData
 *                   (used when switching vehicles in the UI)
 *
 * Response: { user, vehicles, pagination, transfers, vehicleData }
 *   vehicleData: { vehicleId, treatments, documents, expenses,
 *                  appointments, maintenanceSchedule } | null
 */

import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, handleApiError } from '@/lib/api-helpers';
import { GET as meGET } from '@/app/api/auth/me/route';
import { GET as vehiclesGET } from '@/app/api/vehicles/route';
import { GET as transfersGET } from '@/app/api/vehicles/transfer/route';
import { GET as treatmentsGET } from '@/app/api/treatments/route';
import { GET as documentsGET } from '@/app/api/documents/route';
import { GET as expensesGET } from '@/app/api/expenses/route';
import { GET as appointmentsGET } from '@/app/api/appointments/route';
import { GET as maintenanceGET } from '@/app/api/vehicles/[id]/maintenance-schedule/route';

function subRequest(req: NextRequest, path: string, params: Record<string, string> = {}) {
  const url = new URL(req.url);
  url.pathname = path;
  url.search = new URLSearchParams(params).toString();
  // Forward original headers so cookies / bearer token reach the sub-handler
  return new NextRequest(url.toString(), { headers: req.headers });
}

async function safeJson(res: Response): Promise<Record<string, unknown> | null> {
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

interface VehicleLite {
  id: string;
  isPrimary?: boolean;
}

export async function GET(req: NextRequest) {
  try {
    requireAuth(req); // fail fast with 401 before firing sub-queries

    const url = new URL(req.url);
    const requestedVehicleId = url.searchParams.get('vehicleId');
    const vehicleScopeOnly = url.searchParams.get('scope') === 'vehicle';

    let user: unknown = null;
    let vehicles: VehicleLite[] = [];
    let pagination: unknown = null;
    let transfers: unknown[] = [];
    let vehicleId = requestedVehicleId;

    if (!vehicleScopeOnly) {
      const [meRes, vehRes, trRes] = await Promise.all([
        meGET(subRequest(req, '/api/auth/me')),
        vehiclesGET(subRequest(req, '/api/vehicles')),
        transfersGET(subRequest(req, '/api/vehicles/transfer', { type: 'all' })),
      ]);
      if (vehRes.status === 401) return jsonResponse({ error: 'unauthorized' }, 401);

      const [meData, vehData, trData] = await Promise.all([
        safeJson(meRes), safeJson(vehRes), safeJson(trRes),
      ]);
      user = meData?.user ?? null;
      vehicles = (vehData?.vehicles as VehicleLite[]) ?? [];
      pagination = vehData?.pagination ?? null;
      transfers = (trData?.transfers as unknown[]) ?? [];

      // Resolve selected vehicle: requested (if owned/shared) → primary → first
      const ids = vehicles.map(v => v.id);
      if (!vehicleId || !ids.includes(vehicleId)) {
        vehicleId = vehicles.find(v => v.isPrimary)?.id ?? vehicles[0]?.id ?? null;
      }
    }

    let vehicleData: Record<string, unknown> | null = null;
    if (vehicleId) {
      const [tRes, dRes, eRes, aRes, mRes] = await Promise.all([
        treatmentsGET(subRequest(req, '/api/treatments', { vehicleId })),
        documentsGET(subRequest(req, '/api/documents', { vehicleId })),
        expensesGET(subRequest(req, '/api/expenses', { vehicleId, limit: '10' })),
        appointmentsGET(subRequest(req, '/api/appointments', { vehicleId })),
        maintenanceGET(
          subRequest(req, `/api/vehicles/${vehicleId}/maintenance-schedule`),
          { params: { id: vehicleId } },
        ),
      ]);
      const [t, d, e, a, m] = await Promise.all([
        safeJson(tRes), safeJson(dRes), safeJson(eRes), safeJson(aRes), safeJson(mRes),
      ]);
      vehicleData = {
        vehicleId,
        treatments: t?.treatments ?? [],
        documents: d?.documents ?? [],
        expenses: e?.expenses ?? [],
        appointments: a?.appointments ?? [],
        maintenanceSchedule: m?.schedule ?? null,
      };
    }

    return jsonResponse({ user, vehicles, pagination, transfers, vehicleData });
  } catch (error) {
    return handleApiError(error);
  }
}
