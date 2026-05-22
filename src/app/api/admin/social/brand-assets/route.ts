/**
 * GET    /api/admin/social/brand-assets         → list (including defaults)
 * POST   /api/admin/social/brand-assets         → add / update by id
 * DELETE /api/admin/social/brand-assets?id=...  → deactivate
 *
 * Used by the graphic editor to pull logos, colors, fonts the admin uploaded.
 * Default brand colors / logo from /lib/social/brand-voice.ts are returned
 * inline when no DB row exists yet — so the editor always has something to
 * render even on a fresh install.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import {
  requireAdmin,
  jsonResponse,
  handleApiError,
  validationErrorResponse,
  errorResponse,
} from '@/lib/api-helpers';
import { BRAND } from '@/lib/social/brand-voice';

const schema = z.object({
  id: z.string().optional(),
  type: z.enum(['logo', 'logo_dark', 'color', 'font', 'tagline', 'voice_sample']),
  name: z.string().min(1).max(80),
  value: z.string().min(1).max(2000),
  metadata: z.any().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const assets = await prisma.brandAsset.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    });
    return jsonResponse({
      assets,
      defaults: {
        logo: BRAND.logo,
        colors: BRAND.colors,
        fonts: BRAND.fontFamilies,
        tagline: BRAND.tagline,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return validationErrorResponse(parsed.error);
    const d = parsed.data;

    if (d.id) {
      const asset = await prisma.brandAsset.update({
        where: { id: d.id },
        data: {
          type: d.type,
          name: d.name,
          value: d.value,
          metadata: d.metadata ?? undefined,
          sortOrder: d.sortOrder ?? 0,
          isActive: true,
        },
      });
      return jsonResponse({ asset });
    }

    const asset = await prisma.brandAsset.create({
      data: {
        type: d.type,
        name: d.name,
        value: d.value,
        metadata: d.metadata ?? undefined,
        sortOrder: d.sortOrder ?? 0,
      },
    });
    return jsonResponse({ asset }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    requireAdmin(req);
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return errorResponse('id חסר', 400);
    await prisma.brandAsset.update({ where: { id }, data: { isActive: false } });
    return jsonResponse({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
