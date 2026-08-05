import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = requireAuth(req);
    const page = await prisma.salePage.findFirst({
      where: { id: params.id, userId: payload.userId },
    });
    if (!page) return errorResponse('הדף לא נמצא', 404);
    await prisma.salePage.update({ where: { id: page.id }, data: { revoked: true } });
    const { unlink } = await import('node:fs/promises');
    unlink(`${process.cwd()}/public/og-sale/${page.token}.png`).catch(() => {});
    return jsonResponse({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
