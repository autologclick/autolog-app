import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, handleApiError } from '@/lib/api-helpers';
import { seedAllTemplates, ISRAELI_MARKET_TEMPLATES } from '@/lib/maintenance-templates';

/**
 * POST /api/admin/seed-maintenance-templates
 * Seeds maintenance templates for popular Israeli market vehicles.
 * Admin only.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Only admins can seed templates
    if (payload.role !== 'admin') {
      return jsonResponse({ error: 'אין הרשאה' }, 403);
    }

    const count = await seedAllTemplates();

    const manufacturers = ISRAELI_MARKET_TEMPLATES.map(t => t.manufacturer);

    return jsonResponse({
      success: true,
      message: `נטענו ${count} תבניות תחזוקה`,
      manufacturers,
      count,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/admin/seed-maintenance-templates
 * Lists currently available templates.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    if (payload.role !== 'admin') {
      return jsonResponse({ error: 'אין הרשאה' }, 403);
    }

    const templates = ISRAELI_MARKET_TEMPLATES.map(t => ({
      manufacturer: t.manufacturer,
      model: t.model,
      yearRange: `${t.yearFrom}-${t.yearTo}`,
      fuelType: t.fuelType || 'הכל',
      itemCount: t.items.length,
      source: t.source,
    }));

    return jsonResponse({ templates, total: templates.length });
  } catch (error) {
    return handleApiError(error);
  }
}
