import { NextRequest } from 'next/server';
import { jsonResponse, handleApiError, requireAdmin } from '@/lib/api-helpers';
import { getApplications, getApplicationCount } from '@/lib/garage-applications-db';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const [applications, counts] = await Promise.all([
      getApplications(status),
      getApplicationCount(),
    ]);

    return jsonResponse({ applications, ...counts });
  } catch (error) {
    return handleApiError(error);
  }
}
