import { NextRequest } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import prisma from 'A/lib/db';
import { requireAuth, errorResponse, handleApiError } from '@/lib/api-helpers';
import { createLogger } from '@/lib/logger';

const logger = createLogger('vehicle-report-pdf');

function getPythonCommand(): string {
  try {
    execSync('python3 --version', { stdio: 'ignore' });
    return 'python3';
  } catch {
    try {
      execSync('python --version', { stdio: 'ignore' });
      return 'python';
    } catch {
      throw new Error('Python is not installed');
    }
  }
}

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

// GET /api/vehicles/[id]/report/pdf
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId: payload.userId },
    });

    if (!vehicle) {
      return errorResponse('רכב לא נמצא', 404);
    }

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
        select: { id: true, type: true, title: true, expiryDate: true },
      }),
    ]);

    const pdfData = {
      vehicle: {
        nickname: vehicle.nickname,
        manufacturer: vehicle.manufacturer || '',
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        color: vehicle.color || '',
        vin: vehicle.vin || '',
        testExpiryDate: vehicle.testExpiryDate?.toISOString() || null,
        insuranceExpiry: vehicle.insuranceExpiry?.toISOString() || null,
      },
      summary: {
        totalTreatments: treatments.length,
        totalAppointments: appointments.length,
        totalInspections: inspections.length,
        totalExpenses: expenses.length,
        totalCost: treatments.reduce((sum, t) => sum + (t.cost || 0), 0) +
                   expenses.reduce((sum, e) => sum + e.amount, 0),
        lastMileage: treatments.reduce((max, t) => Math.max(max, t.mileage || 0), 0),
      },
      treatments: treatments.map(t => ({
        date: t.date,
        type: treatmentTypeHeb[t.type] || t.type,
        title: t.title,
        description: t.description,
        garageName: t.garageName,
        mileage: t.mileage,
        cost: t.cost,
      })),
      inspections: inspections.map(i => ({
        date: i.date,
        type: i.inspectionType,
        overallScore: i.overallScore,
        garageName: i.garage?.name,
        summary: i.summary,
      })),
      appointments: appointments.map(a => ({
        date: a.date,
        serviceType: serviceTypeHeb[a.serviceType] || a.serviceType,
        status: a.status,
        garageName: a.garage.name,
      })),
      expenses: expenses.map(e => ({
        date: e.date,
        category: expenseCategoryHeb[e.category] || e.category,
        amount: e.amount,
        description: e.description,
      })),
      generatedAt: new Date().toISOString(),
    };

    const scriptPath = path.join(process.cwd(), 'scripts/generate-vehicle-report-pdf.py');

    let pdfBuffer: Buffer;
    try {
      const pythonCmd = getPythonCommand();
      const jsonInput = JSON.stringify(pdfData);
      const result = execSync(`${pythonCmd} "${scriptPath}"`, {
        input: jsonInput,
        encoding: 'binary',
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
      });
      pdfBuffer = Buffer.from(result, 'binary');
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      const stderr = (error as { stderr?: Buffer })?.stderr?.toString();
      logger.error('Vehicle report PDF generation error', { error: stderr || errMsg });
      return errorResponse('שגיאה בייצור דוח PDF', 500);
    }

    const filename = `vehicle-report-${vehicle.licensePlate}.pdf`;
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
