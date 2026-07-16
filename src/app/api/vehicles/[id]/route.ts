import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  requireAuth,
  jsonResponse,
  validationErrorResponse,
  handleApiError,
  AuthError,
  requireOwnership,
} from '@/lib/api-helpers';
import { assertVehicleRecordAccess } from '@/lib/vehicle-access';
import { NOT_FOUND } from '@/lib/messages';
import { getExpiryStatus } from '@/lib/utils';
import { normalizeManufacturer, friendlyModel } from '@/lib/vehicle-names';

const updateVehicleSchema = z.object({
  nickname: z.string().min(1).optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  year: z.union([z.number(), z.string()]).optional(),
  licensePlate: z.string().optional(),
  mileage: z.union([z.number(), z.string()]).optional(),
  fuelType: z.string().optional(),
  color: z.string().optional(),
  testExpiryDate: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

// getExpiryStatus imported from @/lib/utils

// GET /api/vehicles/[id] - Get single vehicle with details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        inspections: {
          select: {
            id: true,
            inspectionType: true,
            date: true,
            status: true,
            overallScore: true,
            garage: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
        appointments: {
          select: {
            id: true,
            serviceType: true,
            date: true,
            time: true,
            status: true,
            garage: { select: { id: true, name: true } },
          },
          orderBy: { date: 'asc' },
          where: { date: { gte: new Date() } },
          take: 10,
        },
        expenses: {
          select: {
            id: true,
            category: true,
            amount: true,
            date: true,
            description: true,
          },
          orderBy: { date: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            inspections: true,
            appointments: true,
            sosEvents: true,
            expenses: true,
          },
        },
      },
    });

    if (!vehicle) {
      return jsonResponse({ error: NOT_FOUND.VEHICLE }, 404);
    }

    // Owner or approved-share user — a co-manager needs to see the vehicle and
    // its records; only mutating the vehicle itself is owner-only.
    await assertVehicleRecordAccess(payload.userId, id);

    // Translate MOT codes to commercial names ("XTA03" → "ספייס סטאר",
    // "מיצובישי תאילנד" → "מיצובישי") — see /api/vehicles for full rationale.
    // friendlyModel returns '' for unmapped codes rather than showing
    // raw "XTA03" — the manufacturer + year already identifies the vehicle.
    // Auto-generated nicknames ("מיצובישי XTA03") are also rebuilt with
    // friendly names; user-customized nicknames stay as-is.
    const rawMfr = vehicle.manufacturer || '';
    const rawModel = vehicle.model || '';
    const friendlyMfr = rawMfr ? normalizeManufacturer(rawMfr) : rawMfr;
    const friendlyModelName = rawModel && rawMfr ? friendlyModel(rawModel, rawMfr) : rawModel;

    let nickname = vehicle.nickname;
    if (nickname) {
      const trimmed = nickname.trim();
      const autoCandidates = [
        `${rawMfr} ${rawModel}`.trim(),
        `${friendlyMfr} ${rawModel}`.trim(),
        `${rawMfr} ${friendlyModelName}`.trim(),
      ];
      if (autoCandidates.includes(trimmed)) {
        nickname = `${friendlyMfr} ${friendlyModelName}`.trim() || friendlyMfr || rawMfr;
      }
    }

    const friendly = {
      ...vehicle,
      manufacturer: friendlyMfr,
      model: friendlyModelName,
      nickname,
    };

    return jsonResponse({ vehicle: friendly });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/vehicles/[id] - Update vehicle
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;
    const body = await req.json();

    // Validate input
    const validation = updateVehicleSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    // Verify ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { userId: true, mileage: true },
    });

    if (!vehicle) {
      return jsonResponse({ error: NOT_FOUND.VEHICLE }, 404);
    }

    // Editing the vehicle's DETAILS stays owner-only. A co-manager (approved
    // share) may still keep the odometer up to date, so allow a non-owner with
    // access through only when the update touches nothing but `mileage`.
    if (vehicle.userId !== payload.userId) {
      const touchedFields = Object.keys(validation.data).filter(
        (k) => (validation.data as Record<string, unknown>)[k] !== undefined,
      );
      const mileageOnly = touchedFields.length > 0 && touchedFields.every((k) => k === 'mileage');
      if (!mileageOnly) {
        requireOwnership(payload.userId, vehicle.userId); // throws 403
      }
      await assertVehicleRecordAccess(payload.userId, id); // throws 403 if not shared
    }

    const updateData: Prisma.VehicleUpdateInput = {};
    const d = validation.data;

    if (d.nickname !== undefined) updateData.nickname = d.nickname;
    if (d.manufacturer !== undefined) updateData.manufacturer = d.manufacturer;
    if (d.model !== undefined) updateData.model = d.model;
    if (d.year !== undefined) {
      const y = typeof d.year === 'string' ? parseInt(d.year) : d.year;
      if (!isNaN(y) && y > 1900) updateData.year = y;
    }
    if (d.mileage !== undefined) {
      const m = typeof d.mileage === 'string' ? parseInt(d.mileage) : d.mileage;
      if (!isNaN(m) && m >= 0) {
        const current = vehicle.mileage || 0;
        if (m < current) {
          return jsonResponse(
            {
              error:
                'לא ניתן לעדכן קילומטראז׳ נמוך יותר מהקיים (' +
                current.toLocaleString() +
                ' ק"מ). הזן ערך גבוה או שווה לזה.',
            },
            400
          );
        }
        updateData.mileage = m;
      }
    }
    if (d.fuelType !== undefined) updateData.fuelType = d.fuelType;
    if (d.color !== undefined) updateData.color = d.color;

    if (d.testExpiryDate !== undefined && d.testExpiryDate) {
      const testDate = new Date(d.testExpiryDate);
      if (!isNaN(testDate.getTime())) {
        updateData.testExpiryDate = testDate;
        updateData.testStatus = getExpiryStatus(testDate);
      }
    }

    if (d.insuranceExpiry !== undefined && d.insuranceExpiry) {
      const insDate = new Date(d.insuranceExpiry);
      if (!isNaN(insDate.getTime())) {
        updateData.insuranceExpiry = insDate;
        updateData.insuranceStatus = getExpiryStatus(insDate);
      }
    }

    if (validation.data.isPrimary !== undefined) {
      if (validation.data.isPrimary) {
        // Set all other vehicles to non-primary
        await prisma.vehicle.updateMany({
          where: { userId: payload.userId, id: { not: id } },
          data: { isPrimary: false },
        });
      }
      updateData.isPrimary = validation.data.isPrimary;
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            inspections: true,
            appointments: true,
            sosEvents: true,
            expenses: true,
          },
        },
      },
    });

    return jsonResponse({
      vehicle: updated,
      message: 'הרכב עודכן בהצלחה',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/vehicles/[id] - Delete/soft delete vehicle
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;

    // Verify ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { userId: true, licensePlate: true },
    });

    if (!vehicle) {
      return jsonResponse({ error: NOT_FOUND.VEHICLE }, 404);
    }

    requireOwnership(payload.userId, vehicle.userId);

    // Full cleanup in a transaction:
    // 1. Non-cascading relations (Appointment, SosEvent) — explicit delete
    // 2. Notifications — no FK, match by licensePlate in message OR vehicle id in link
    // 3. The vehicle itself — cascades handle the rest (Treatment, Expense,
    //    Document, Inspection, VehicleDriver, VehicleShare)
    await prisma.$transaction([
      prisma.appointment.deleteMany({ where: { vehicleId: id } }),
      prisma.sosEvent.deleteMany({ where: { vehicleId: id } }),
      prisma.notification.deleteMany({
        where: {
          userId: vehicle.userId,
          OR: [
            { message: { contains: vehicle.licensePlate } },
            { link: { contains: '/vehicles/' + id } },
          ],
        },
      }),
      prisma.vehicle.delete({ where: { id } }),
    ]);

    return jsonResponse({ message: 'הרכב וכל הנתונים הקשורים אליו נמחקו בהצלחה' });
  } catch (error) {
    return handleApiError(error);
  }
}
