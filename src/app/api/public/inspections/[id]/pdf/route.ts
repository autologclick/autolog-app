import { NextRequest } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import prisma from '@/lib/db';
import { errorResponse, handleApiError, requireAuth } from '@/lib/api-helpers';
import { createLogger } from '@/lib/logger';
import { verifyShareToken } from '@/lib/share-tokens';

const logger = createLogger('pdf');

// Access control: either valid HMAC share token (for buyer-facing links)
// or authenticated owner/admin. UUID alone is NOT sufficient.

function getPythonCommand(): string {
  try {
    execSync('python3 --version', { stdio: 'ignore' });
    return 'python3';
  } catch {
    try {
      execSync('python --version', { stdio: 'ignore' });
      return 'python';
    } catch {
      throw new Error('Python is not installed.');
    }
  }
}

import { safeJsonParse } from '@/lib/utils';
import { NOT_FOUND } from '@/lib/messages';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // --- Access control: share token OR authenticated owner/admin ---
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    const expStr = url.searchParams.get('exp') || '0';
    const expiresAt = parseInt(expStr, 10);
    const tokenOk = token && verifyShareToken('inspection-pdf', id, token, expiresAt);

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true, nickname: true, manufacturer: true, model: true,
            year: true, licensePlate: true, color: true, vin: true,
            userId: true, mileage: true,
          },
        },
        garage: {
          select: {
            id: true, name: true, city: true, address: true, phone: true, email: true,
          },
        },
        items: true,
      },
    });

    if (!inspection) {
      return errorResponse(NOT_FOUND.INSPECTION, 404);
    }

    if (!tokenOk) {
      let payload;
      try {
        payload = requireAuth(req);
      } catch {
        return errorResponse('אין הרשאה לצפות בבדיקה', 403);
      }
      if (payload.role !== 'admin' && inspection.vehicle.userId !== payload.userId) {
        return errorResponse('אין הרשאה לצפות בבדיקה', 403);
      }
    }

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

    const scriptPath = path.join(process.cwd(), 'scripts/generate-inspection-pdf.py');

    let pdfBuffer: Buffer;
    try {
      const pythonCmd = getPythonCommand();
      const jsonInput = JSON.stringify(pdfData);
      // IMPORTANT: Pass input as UTF-8 Buffer so Hebrew chars survive,
      // and use encoding:'buffer' so output comes back as raw bytes
      const result = execSync(`${pythonCmd} "${scriptPath}"`, {
        input: Buffer.from(jsonInput, 'utf-8'),
        encoding: 'buffer',
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
      });
      pdfBuffer = result;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      const stderr = (error as { stderr?: Buffer })?.stderr?.toString();
      logger.error('PDF generation error', { error: stderr || errMsg });
      return errorResponse('שגיאה בייצור דוח PDF', 500);
    }

    const licensePlate = inspection.vehicle?.licensePlate || inspection.id.slice(0, 8);
    const filename = `AutoLog-${licensePlate}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
