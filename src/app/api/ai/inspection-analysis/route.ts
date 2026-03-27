import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError, requireOwnershipOrAdmin   enforceRateLimit,
} from '@/lib/api-helpers';
import { analyzeInspection } from '@/lib/ai-analysis';

// GET /api/ai/inspection-analysis?inspectionId=xxx
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    const rateLimitError = enforceRateLimit(payload.userId);
    if (rateLimitError) return rateLimitError;

    const url = new URL(req.url);
    const inspectionId = url.searchParams.get('inspectionId');

    if (!inspectionId) {
      return errorResponse('××¡×¨ ×××× ××××§×', 400);
    }

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        items: true,
        vehicle: {
          select: { manufacturer: true, model: true, year: true, mileage: true, userId: true },
        },
      },
    });

    if (!inspection) {
      return errorResponse('××××§× ×× × ××¦××', 404);
    }

    requireOwnershipOrAdmin(payload, inspection.vehicle.userId);

    // Parse JSON fields (recommendations and workPerformed are stored as JSON strings)
    let recommendations: Array<{ text: string; urgency?: string; estimatedCost?: string }> | undefined;
    try {
      if (inspection.recommendations) {
        recommendations = JSON.parse(inspection.recommendations as string);
      }
    } catch { /* ignore parse errors */ }

    let workPerformed: Array<{ item: string; action: string; notes?: string; cost?: number }> | undefined;
    try {
      if (inspection.workPerformed) {
        workPerformed = JSON.parse(inspection.workPerformed as string);
      }
    } catch { /* ignore parse errors */ }

    const inspectionData = {
      inspectionType: inspection.inspectionType,
      overallScore: inspection.overallScore || 0,
      items: inspection.items.map(item => ({
        category: item.category,
        itemName: item.itemName,
        status: item.status,
        notes: item.notes || undefined,
        score: item.score || undefined,
      })),
      recommendations,
      vehicle: {
        manufacturer: inspection.vehicle.manufacturer || undefined,
        model: inspection.vehicle.model,
        year: inspection.vehicle.year || undefined,
        mileage: inspection.vehicle.mileage || undefined,
      },
      workPerformed,
    };

    const analysis = analyzeInspection(inspectionData);

    // Also update the aiSummary field on the inspection
    await prisma.inspection.update({
      where: { id: inspectionId },
      data: { aiSummary: analysis.summary },
    });

    return jsonResponse({ analysis });
  } catch (error) {
    return handleApiError(error);
  }
}
