import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError,
  enforceRateLimit,
} from '@/lib/api-helpers';
import { analyzeInspection } from '@/lib/ai-analysis';

// GET /api/ai/inspection-analysis?inspectionId=xxx
export async function GET(req: NextRequest) {
  try {
    // Try auth — but allow unauthenticated access (same as inspection page)
    let payload: { userId: string; role: string } | null = null;
    try {
      payload = requireAuth(req);
    } catch {
      // Not authenticated — allowed for shared links (WhatsApp, etc.)
    }

    if (payload) {
      const rateLimitError = enforceRateLimit(payload.userId);
      if (rateLimitError) return rateLimitError;
    }

    const url = new URL(req.url);
    const inspectionId = url.searchParams.get('inspectionId');

    if (!inspectionId) {
      return errorResponse('חסר מזהה אבחון', 400);
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
      return errorResponse('אבחון לא נמצא', 404);
    }

    // Access control — mirror the inspection page logic:
    // Unauthenticated: allowed (shared link viewers)
    // Users: must own the vehicle
    // Garage owners: must own the garage that performed the inspection
    // Admins: always allowed
    if (payload) {
      if (payload.role === 'user' && payload.userId !== inspection.vehicle.userId) {
        return errorResponse('אין הרשאה', 403);
      }
      if (payload.role === 'garage_owner') {
        const garage = await prisma.garage.findUnique({
          where: { ownerId: payload.userId },
          select: { id: true },
        });
        if (garage?.id !== inspection.garageId) {
          return errorResponse('אין הרשאה', 403);
        }
      }
    }

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
