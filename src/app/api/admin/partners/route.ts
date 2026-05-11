/**
 * Admin Partners API
 *
 * GET  /api/admin/partners  → list all partners (with running totals)
 * POST /api/admin/partners  → create a new affiliate partner
 *
 * Auth: admin-only via requireAdmin().
 */

import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  requireAdmin,
  jsonResponse,
  handleApiError,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-helpers';
import { partnerCreateSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');

    const where: Prisma.PartnerWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status && ['active', 'paused', 'archived'].includes(status)) {
      where.status = status as 'active' | 'paused' | 'archived';
    }

    const partners = await prisma.partner.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    // Annotate each with computed unpaid balance for the dashboard
    const annotated = partners.map((p) => ({
      ...p,
      unpaidBalance: Math.max(0, p.totalEarned - p.totalPaid),
    }));

    return jsonResponse({ partners: annotated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    const body = await req.json();
    const validation = partnerCreateSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }
    const data = validation.data;

    // Code uniqueness check (also enforced by DB, but this gives a friendlier error)
    const existing = await prisma.partner.findUnique({
      where: { code: data.code.toLowerCase() },
    });
    if (existing) {
      return errorResponse('הקוד הזה כבר קיים — בחר קוד אחר', 409);
    }

    const partner = await prisma.partner.create({
      data: {
        name: data.name.trim(),
        code: data.code.toLowerCase().trim(),
        contactName: data.contactName || null,
        contactPhone: data.contactPhone || null,
        contactEmail: data.contactEmail || null,
        commissionPerSignup: data.commissionPerSignup ?? 1,
        notes: data.notes || null,
      },
    });

    return jsonResponse({ partner }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
