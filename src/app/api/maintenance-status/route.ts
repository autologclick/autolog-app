import prisma from '@/lib/db';
import { jsonResponse, handleApiError } from '@/lib/api-helpers';
import { getCacheStore } from '@/lib/cache-store';

// This endpoint is called by every client shell on every page load
// to check for the maintenance banner. Caching it for 30 seconds cuts
// the database load dramatically while still reflecting admin toggles
// within half a minute.
const MAINTENANCE_CACHE_TTL_MS = 30 * 1000;
const MAINTENANCE_CACHE_KEY = 'api:maintenance-status';

type MaintenanceStatus = { enabled: boolean; message: string };

// Public GET: used by the client shell to show a maintenance banner/page.
export async function GET() {
  try {
    const cache = getCacheStore();
    const cached = cache.get<MaintenanceStatus>(MAINTENANCE_CACHE_KEY);
    if (cached) {
      return jsonResponse(cached);
    }

    const row = await prisma.maintenanceMode.findFirst();
    const status: MaintenanceStatus = {
      enabled: row?.enabled ?? false,
      message: row?.message || '',
    };
    cache.set(MAINTENANCE_CACHE_KEY, status, MAINTENANCE_CACHE_TTL_MS);
    return jsonResponse(status);
  } catch (error) {
    return handleApiError(error);
  }
}
