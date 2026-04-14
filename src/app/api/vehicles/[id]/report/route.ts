import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

const treatmentTypeHeb: Record<string, string> = {
  maintenance: 'טיפול שוטף',
  repair: 'תיקון',
  oil_change: 'החלפת שמן',
  tires: 'צמיגים',
  brakes: 'בלמים',
  electrical: 'חשמל',
  ac: 'מיזוג אוויר',
  bodywork: 'פחחות וצבע',
  other: 'אחר',
};

const serviceTypeHeb: Record<string, string> = {
  inspection: 'בדיקה',
  maintenance: 'טיפול',
  repair: 'תיקון',
  test_prep: 'הכנה לטסט',
};

const expenseCategoryHeb: Record<string, string> = {
  fuel: 'דלק',
  maintenance: 'תחזוקה',
  insurance: 'ביטוח',
  test: 'טסט',
  parking: 'חנייה',
  fines: 'קנסות',
  other: 'אחר',
};

// GET /api/vehicles/[id]/report - Get full vehicle history report
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    // Verify ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId: payload.userId },
    });

    if (!vehicle) {
      return errorResponse('רכב לא נמצא', 404);
    }

    // Fetch all data in parallel
    const [treatments, appointments, inspections, expenses, documents] = await Promise.all([
      prisma.treatment.findMany({
        where: { vehicleId: id, status: 'approved' },
        orderBy: { date: 'desc' },
      }),
      prisma.appointment.findMany({
        where: { vehicleId: id, status: { in: ['completed', 'confirmed', 'in_progress'] } },
        orderBy: { date: 'desc' },
        include: { garage: { select: { name: true, city: true } } },
      }),
      prisma.inspection.findMany({
        where: { vehicleId: id, status: 'completed' },
        orderBy: { date: 'desc' },
        include: { garage: { select: { name: true } } },
      }),
      prisma.expense.findMany({
        where: { vehicleId: id },
        orderBy: { date: 'desc' },
      }),
      prisma.document.findMany({
        where: { vehicleId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, title: true, expiryDate: true, createdAt: true },
      }),
    ]);

    // Build structured report
    const report = {
      vehicle: {
        nickname: vehicle.nickname,
        manufacturer: vehicle.manufacturer || '',
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        color: vehicle.color || '',
        vin: vehicle.vin || '',
        testExpiryDate: vehicle.testExpiryDate,
        insuranceExpiry: vehicle.insuranceExpiry,
      },
      summary: {
        totalTreatments: treatments.length,
        totalAppointments: appointments.length,
        totalInspections: inspections.length,
        totalExpenses: expenses.length,
        totalCost: treatments.reduce((sum, t) => sum + (t.cost || 0), 0) +
                   expenses.filter(e => !e.treatmentId).reduce((sum, e) => sum + e.amount, 0),
        lastTreatmentDate: treatments[0]?.date || null,
        lastInspectionDate: inspections[0]?.date || null,
        lastMileage: treatments.reduce((max, t) => Math.max(max, t.mileage || 0), 0),
      },
      treatments: treatments.map(t => ({
        id: t.id,
        date: t.date,
        type: treatmentTypeHeb[t.type] || t.type,
        title: t.title,
        description: t.description,
        garageName: t.garageName,
        mechanicName: t.mechanicName,
        mileage: t.mileage,
        cost: t.cost,
        items: t.items,
      })),
      appointments: appointments.map(a => ({
        id: a.id,
        date: a.date,
        time: a.time,
        serviceType: serviceTypeHeb[a.serviceType] || a.serviceType,
        status: a.status,
        garageName: a.garage.name,
        garageCity: a.garage.city,
        completionNotes: a.completionNotes,
      })),
      inspections: inspections.map(i => ({
        id: i.id,
        date: i.date,
        type: i.inspectionType,
        overallScore: i.overallScore,
        garageName: i.garage?.name,
        summary: i.summary,
      })),
      expenses: expenses.map(e => ({
        id: e.id,
        date: e.date,
        category: expenseCategoryHeb[e.category] || e.category,
        amount: e.amount,
        description: e.description,
      })),
      documents: documents.map(d => ({
        id: d.id,
        type: d.type,
        title: d.title,
        expiryDate: d.expiryDate,
      })),
      generatedAt: new Date().toISOString(),
    };

    return jsonResponse(report);
  } catch (error) {
    return handleApiError(error);
  }
}
