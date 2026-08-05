import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { z } from 'zod';

const uploadSchema = z.object({
  fileData: z
    .string()
    .regex(/^data:(application\/pdf|image\/jpeg|image\/png);base64,/)
    .max(7_000_000),
  fileName: z.string().min(1).max(120),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = requireAuth(req);
    const data = uploadSchema.parse(await req.json());
    const page = await prisma.salePage.findFirst({
      where: { id: params.id, userId: payload.userId },
    });
    if (!page) return errorResponse('הדף לא נמצא', 404);
    await prisma.salePage.update({
      where: { id: page.id },
      data: { infocarData: data.fileData, infocarName: data.fileName },
    });
    return jsonResponse({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = requireAuth(req);
    const page = await prisma.salePage.findFirst({
      where: { id: params.id, userId: payload.userId },
    });
    if (!page) return errorResponse('הדף לא נמצא', 404);
    await prisma.salePage.update({
      where: { id: page.id },
      data: { infocarData: null, infocarName: null },
    });
    return jsonResponse({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
