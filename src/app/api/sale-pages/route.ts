import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { z } from 'zod';
import { execFile } from 'node:child_process';
import { friendlyModel } from '@/lib/vehicle-names';

const createSchema = z.object({
  vehicleId: z.string().min(1),
  sections: z
    .object({
      details: z.boolean().optional(),
      carCheck: z.boolean().optional(),
      treatments: z.boolean().optional(),
      contact: z.boolean().optional(),
    })
    .optional(),
  sellerPhone: z.string().max(20).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();
    const data = createSchema.parse(body);

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, userId: payload.userId },
    });
    if (!vehicle) return errorResponse('הרכב לא נמצא', 404);

    await prisma.salePage.updateMany({
      where: { vehicleId: vehicle.id, revoked: false },
      data: { revoked: true },
    });

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const page = await prisma.salePage.create({
      data: {
        token,
        vehicleId: vehicle.id,
        userId: payload.userId,
        sections: JSON.stringify(
          data.sections ?? { details: true, carCheck: true, treatments: true, contact: false }
        ),
        sellerPhone: data.sellerPhone,
        expiresAt,
      },
    });
    try {
      const nice = friendlyModel(vehicle.model, vehicle.manufacturer) || vehicle.model;
      const ogTitle = `${vehicle.manufacturer} ${nice} ${vehicle.year}`.trim();
      execFile('python3', [
        '/opt/autolog/og/gen_sale_og.py',
        `${process.cwd()}/public/og-sale/${token}.png`,
        ogTitle,
        'הרכב הזה למכירה — כל המידע, במקום אחד',
      ], () => {});
    } catch {}

    return jsonResponse({ token: page.token, url: `/sale/${page.token}`, expiresAt: page.expiresAt }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const vehicleId = req.nextUrl.searchParams.get('vehicleId') || undefined;
    const pages = await prisma.salePage.findMany({
      where: {
        userId: payload.userId,
        revoked: false,
        expiresAt: { gt: new Date() },
        ...(vehicleId ? { vehicleId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, token: true, vehicleId: true, expiresAt: true, viewCount: true, infocarName: true, createdAt: true },
    });
    return jsonResponse({ pages });
  } catch (e) {
    return handleApiError(e);
  }
}
