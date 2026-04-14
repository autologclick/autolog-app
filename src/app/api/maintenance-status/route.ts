import prisma from '@/lib/db';
import { jsonResponse, handleApiError } from '@/lib/api-helpers';

// Public GET: used by the client shell to show a maintenance banner/page.
export async function GET() {
  try {
    const row = await prisma.maintenanceMode.findFirst();
    return jsonResponse({
      enabled: row?.enabled ?? false,
      message: row?.message || '',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
