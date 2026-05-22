/**
 * GET  /api/admin/social/whatsapp-templates  → list templates
 * POST /api/admin/social/whatsapp-templates  → create / update template (upsert by name)
 *
 * NOTE: This stores templates *locally* so the admin can draft them.
 * Actual approval is done in WhatsApp Business Manager; once Meta approves,
 * paste the metaTemplateId here so the system can send via WA Cloud API.
 *
 * Auth: admin-only.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import {
  requireAdmin,
  jsonResponse,
  handleApiError,
  validationErrorResponse,
} from '@/lib/api-helpers';

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(60).regex(/^[a-z0-9_]+$/, 'באנגלית קטנה, מקפים תחתונים בלבד'),
  language: z.string().min(2).max(8).default('he'),
  category: z.enum(['marketing', 'utility', 'authentication']),
  body: z.string().min(1).max(2000),
  variables: z.array(z.string()).default([]),
  header: z.string().max(200).optional().nullable(),
  footer: z.string().max(200).optional().nullable(),
  buttons: z.any().optional().nullable(),
  metaTemplateId: z.string().max(200).optional().nullable(),
  approvalStatus: z.enum(['draft', 'submitted', 'approved', 'rejected']).default('draft'),
});

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const templates = await prisma.whatsAppTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ approvalStatus: 'asc' }, { createdAt: 'desc' }],
    });
    return jsonResponse({ templates });
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
    const template = await prisma.whatsAppTemplate.upsert({
      where: { name: d.name },
      create: {
        name: d.name,
        language: d.language,
        category: d.category,
        body: d.body,
        variables: d.variables,
        header: d.header ?? null,
        footer: d.footer ?? null,
        buttons: d.buttons ?? undefined,
        metaTemplateId: d.metaTemplateId ?? null,
        approvalStatus: d.approvalStatus,
      },
      update: {
        language: d.language,
        category: d.category,
        body: d.body,
        variables: d.variables,
        header: d.header ?? null,
        footer: d.footer ?? null,
        buttons: d.buttons ?? undefined,
        metaTemplateId: d.metaTemplateId ?? null,
        approvalStatus: d.approvalStatus,
      },
    });
    return jsonResponse({ template });
  } catch (err) {
    return handleApiError(err);
  }
}
