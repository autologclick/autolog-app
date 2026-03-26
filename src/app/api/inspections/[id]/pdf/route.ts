import { NextRequest } from 'next/server';
import { execSync, spawnSync } from 'child_process';
import path from 'path';
import prisma from '@/lib/db';
import { requireAuth, errorResponse, handleApiError } from '@/lib/api-helpers';
import { createLogger } from '@/lib/logger';

const logger = createLogger('pdf');

// Detect the Python command available on this system
function getPythonCommand(): string {
  try {
    execSync('python3 --version', { stdio: 'ignore' });
    return 'python3';
  } catch {
    try {
      execSync('python --version', { stdio: 'ignore' });
      return 'python';
    } catch {
      throw new Error('Python is not installed. Please install Python 3 to generate PDF reports.');
    }
  }
}

import { safeJsonParse } from '@/lib/utils';

// GET /api/inspections/[id]/pdf - Generate and return inspection PDF
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const payload = requireAuth(req);

    // Fetch the inspection with all related data
    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            nickname: true,
            manufacturer: true,
            model: true,
            year: true,
            licensePlate: true,
            color: true,
            vin: true,
            userId: true,
            mileage: true,
          },
        },
        garage: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        items: true,
      },
    });

    if (!inspection) {
      return errorResponse('בדיקה לא נמצאה', 404);
    }

    // Verify access control
    if (payload.role === 'user') {
      // Regular users can only access PDFs for their own vehicles
      if (inspection.vehicle.userId !== payload.userId) {
        return errorResponse('אין הרשאה להוריד דוח זה', 403);
      }
    } else if (payload.role === 'garage_owner') {
      // Garage owners can only access PDFs for inspections they performed
      const garage = await prisma.garage.findUnique({
        where: { ownerId: payload.userId },
        select: { id: true },
      });
      if (garage?.id !== inspection.garageId) {
        return errorResponse('אין הרשאה להוריד דוח זה', 403);
      }
    }
    // Admin can access all PDFs

    // Prepare data for PDF generation
    const pdfData = {
      id: inspection.id,
      date: inspection.date.toISOString(),
      inspectionType: inspection.inspectionType,
      status: inspection.status,
      overallScore: inspection.overallScore,
      mileage: inspection.mileage,
      mechanicName: inspection.mechanicName,
      summary: inspection.summary,
      vehicle: inspection.vehicle,
      garage: inspection.garage,
      items: inspection.items,
      tiresData: safeJsonParse(inspection.tiresData),
      brakingSystem: safeJsonParse(inspection.brakingSystem),
      lightsData: safeJsonParse(inspection.lightsData),
      fluidsData: safeJsonParse(inspection.fluidsData),
      bodyData: safeJsonParse(inspection.bodyData),
      recommendations: safeJsonParse(inspection.recommendations),
      notes: safeJsonParse(inspection.notes),
      engineIssues: safeJsonParse(inspection.engineIssues),
      customerName: inspection.customerName,
    };

    // Call the Python PDF generation script
    const scriptPath = path.join(
      process.cwd(),
      'scripts/generate-inspection-pdf.py'
    );

    let pdfBuffer: Buffer;
    try {
      const pythonCmd = getPythonCommand();
      const jsonInput = JSON.stringify(pdfData);
      const result = execSync(`${pythonCmd} "${scriptPath}"`, {
        input: jsonInput,
        encoding: 'binary',
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024, // 10MB max buffer
      });
      pdfBuffer = Buffer.from(result, 'binary');
    } catch (error: any) {
      logger.error('PDF generation error', { error: error.message });
      return errorResponse(
        'שגיאה בייצור דוח PDF: ' + (error.message || 'שגיאה לא ידועה'),
        500
      );
    }

    // Return the PDF with appropriate headers
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="inspection-${inspection.id}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
