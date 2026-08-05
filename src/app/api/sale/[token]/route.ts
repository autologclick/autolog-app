import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token || '';
    if (!/^[a-f0-9]{32}$/.test(token)) return errorResponse('כתובת לא תקינה', 400);

    const page = await prisma.salePage.findUnique({ where: { token } });
    if (!page || page.revoked || page.expiresAt < new Date()) {
      return errorResponse('דף המכירה אינו זמין עוד', 404);
    }
    const vehicle = await prisma.vehicle.findUnique({ where: { id: page.vehicleId } });
    if (!vehicle) return errorResponse('דף המכירה אינו זמין עוד', 404);

    const sections = JSON.parse(page.sections || '{}');
    prisma.salePage
      .update({ where: { id: page.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});

    let treatments: unknown[] = [];
    if (sections.treatments) {
      treatments = await prisma.treatment.findMany({
        where: { vehicleId: vehicle.id, status: 'approved' },
        orderBy: { date: 'desc' },
        take: 50,
        select: { title: true, type: true, date: true, mileage: true, garageName: true },
      });
    }

    return jsonResponse({
      vehicle: {
        licensePlate: vehicle.licensePlate,
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        testExpiryDate: vehicle.testExpiryDate,
        previousOwners: vehicle.previousOwners,
      },
      sections,
      treatments,
      sellerPhone: sections.contact ? page.sellerPhone : null,
      hasInfocar: !!page.infocarData,
      createdAt: page.createdAt,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
