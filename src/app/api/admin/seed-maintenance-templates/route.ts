import { NextRequest } from 'next/server';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';
import { seedAllTemplates, ISRAELI_MARKET_TEMPLATES } from '@/lib/maintenance-templates';

/**
 * POST /api/admin/seed-maintenance-templates
 * Seeds maintenance templates for popular Israeli market vehicles.
 * Admin only.
 */
export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);

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
    requireAdmin(req);

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
