import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import {
  requireAuth, jsonResponse, errorResponse, handleApiError, validationErrorResponse,
} from '@/lib/api-helpers';
import { NOT_FOUND } from '@/lib/messages';
import { updateVehicleMileage, MileageError } from '@/lib/mileage';

// ─────────────────────────────────────────────────────────────────────
// "Mark reminder done" — single endpoint that handles all 7 reminder types
//
// Date-based (renewals every year):
//   test, compulsory_insurance, comprehensive_insurance
//   → new expiry = completedDate + 365 days
//
// Mileage-based (every N kilometers):
//   oil_change, tires, brakes, timing_belt
//   → store as a Treatment record; next reminder is computed from
//     (latest treatment mileage + interval)
//
// In all cases we ALSO:
//   - Create a Treatment record so the history is preserved
//   - Optionally create an Expense if cost > 0 (auto-linked to Treatment)
//   - Mark related in-app notifications as read so they vanish from the bell
// ─────────────────────────────────────────────────────────────────────

const reminderTypes = [
  'test',
  'compulsory_insurance',
  'comprehensive_insurance',
  'oil_change',
  'tires',
  'brakes',
  'timing_belt',
] as const;

type ReminderType = (typeof reminderTypes)[number];

const schema = z.object({
  reminderType: z.enum(reminderTypes),
  completedDate: z.string().min(1, 'נדרש תאריך ביצוע'),
  cost: z.number().min(0).max(1_000_000).optional(),
  garageName: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  mileage: z.number().int().min(0).optional(),
  // Optional: company name for insurance renewals
  insuranceCompany: z.string().max(100).optional(),
  policyNumber: z.string().max(100).optional(),
});

// Human-readable labels for notifications/messages
const TYPE_LABEL: Record<ReminderType, string> = {
  test: 'טסט שנתי',
  compulsory_insurance: 'ביטוח חובה',
  comprehensive_insurance: 'ביטוח מקיף',
  oil_change: 'החלפת שמן',
  tires: 'החלפת צמיגים',
  brakes: 'החלפת בלמים',
  timing_belt: 'רצועת תזמון',
};

// Default km intervals for mileage-based reminders (used to compute next due km)
const KM_INTERVAL: Record<string, number> = {
  oil_change: 12_000,
  tires: 20_000,
  brakes: 60_000,
  timing_belt: 80_000,
};

// Treatment type mapping — the existing Treatment.type enum uses these strings
const TREATMENT_TYPE_MAP: Record<ReminderType, string> = {
  test: 'inspection',
  compulsory_insurance: 'other',
  comprehensive_insurance: 'other',
  oil_change: 'oil_change',
  tires: 'tires',
  brakes: 'brakes',
  timing_belt: 'maintenance',
};

// Notification dedup type (matches the cron-reminders sender)
const NOTIFICATION_TYPE_MAP: Record<ReminderType, string | null> = {
  test: 'test_expiry',
  compulsory_insurance: 'compulsory_insurance_expiry',
  comprehensive_insurance: 'insurance_expiry',
  oil_change: null, // mileage-based — no cron reminders yet
  tires: null,
  brakes: null,
  timing_belt: null,
};

function addYears(dateStr: string, years: number): Date {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }
    const data = validation.data;

    // Verify the user owns the vehicle (or is admin)
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      select: {
        id: true, userId: true, nickname: true,
        manufacturer: true, model: true, licensePlate: true, mileage: true,
      },
    });
    if (!vehicle) return errorResponse(NOT_FOUND.VEHICLE, 404);
    if (vehicle.userId !== payload.userId && payload.role !== 'admin') {
      return errorResponse('אין לך הרשאה לעדכן רכב זה', 403);
    }

    const vehicleLabel = vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`;
    const typeLabel = TYPE_LABEL[data.reminderType];

    // Step 1: For date-based reminders, compute the new expiry and update vehicle.
    // Also update related secondary fields (cost, company, etc.) when provided.
    const vehicleUpdate: Record<string, unknown> = {};
    let newExpiryDate: Date | null = null;

    if (data.reminderType === 'test') {
      newExpiryDate = addYears(data.completedDate, 1);
      vehicleUpdate.testExpiryDate = newExpiryDate;
      vehicleUpdate.testDate = new Date(data.completedDate);
      vehicleUpdate.testStatus = 'valid';
      if (data.cost) vehicleUpdate.testCost = data.cost;
      if (data.garageName) vehicleUpdate.testStation = data.garageName;
      if (data.mileage) vehicleUpdate.testMileageAtTest = data.mileage;
    } else if (data.reminderType === 'compulsory_insurance') {
      newExpiryDate = addYears(data.completedDate, 1);
      vehicleUpdate.compulsoryInsuranceExpiry = newExpiryDate;
      vehicleUpdate.compulsoryInsuranceStart = new Date(data.completedDate);
      vehicleUpdate.compulsoryInsuranceStatus = 'valid';
      if (data.cost) vehicleUpdate.compulsoryInsuranceCost = data.cost;
      if (data.insuranceCompany) vehicleUpdate.compulsoryInsuranceCompany = data.insuranceCompany;
      if (data.policyNumber) vehicleUpdate.compulsoryInsurancePolicyNumber = data.policyNumber;
    } else if (data.reminderType === 'comprehensive_insurance') {
      newExpiryDate = addYears(data.completedDate, 1);
      vehicleUpdate.insuranceExpiry = newExpiryDate;
      vehicleUpdate.insuranceStart = new Date(data.completedDate);
      vehicleUpdate.insuranceStatus = 'valid';
      if (data.cost) vehicleUpdate.insuranceCost = data.cost;
      if (data.insuranceCompany) vehicleUpdate.insuranceCompany = data.insuranceCompany;
      if (data.policyNumber) vehicleUpdate.insurancePolicyNumber = data.policyNumber;
    }

    // Step 2: Update vehicle mileage if higher (kilometer never goes backwards)
    if (data.mileage && data.mileage > 0) {
      try {
        await updateVehicleMileage(vehicle.id, data.mileage);
      } catch (e) {
        if (e instanceof MileageError) return errorResponse(e.message, e.status);
        throw e;
      }
    }

    // Step 3: Apply the vehicle field updates
    if (Object.keys(vehicleUpdate).length > 0) {
      await prisma.vehicle.update({ where: { id: vehicle.id }, data: vehicleUpdate });
    }

    // Step 4: Always create a Treatment record so the history is preserved.
    // This is what powers the timeline + lets us compute "next km due" for
    // mileage-based reminders.
    const treatmentTitle = data.reminderType === 'test'
      ? `טסט שנתי — ${vehicleLabel}`
      : data.reminderType === 'compulsory_insurance'
      ? `חידוש ביטוח חובה — ${vehicleLabel}`
      : data.reminderType === 'comprehensive_insurance'
      ? `חידוש ביטוח מקיף — ${vehicleLabel}`
      : `${typeLabel} — ${vehicleLabel}`;

    const treatment = await prisma.treatment.create({
      data: {
        vehicleId: vehicle.id,
        userId: vehicle.userId,
        garageId: null,
        garageName: data.garageName || null,
        type: TREATMENT_TYPE_MAP[data.reminderType],
        title: treatmentTitle,
        description: data.notes || null,
        mileage: data.mileage || null,
        cost: data.cost || null,
        date: data.completedDate,
        status: 'approved',
        sentByGarage: false,
        notes: data.notes || null,
      },
    });

    // Step 5: If a cost was provided, create an Expense (skip if already exists)
    if (data.cost && data.cost > 0) {
      try {
        const expenseCategory = data.reminderType === 'test' ? 'test'
          : data.reminderType.includes('insurance') ? 'insurance'
          : 'maintenance';
        await prisma.expense.create({
          data: {
            vehicleId: vehicle.id,
            category: expenseCategory,
            amount: data.cost,
            description: treatmentTitle,
            date: new Date(data.completedDate),
            treatmentId: treatment.id,
          },
        });
      } catch {
        // Expense creation is non-critical — silently skip on dupe / error
      }
    }

    // Step 6: Mark related notifications as READ so they vanish from the bell.
    // The cron's per-threshold dedup uses these notifications, so leaving them
    // marked-but-unread would still suppress the next legitimate reminder
    // wave a year from now. We only mark as read, NOT delete — so the next
    // cron cycle still sees the dedup record but the user's bell is clean.
    const notifType = NOTIFICATION_TYPE_MAP[data.reminderType];
    if (notifType) {
      await prisma.notification.updateMany({
        where: {
          userId: vehicle.userId,
          type: notifType,
          message: { contains: vehicle.licensePlate },
          isRead: false,
        },
        data: { isRead: true },
      });
    }

    return jsonResponse({
      success: true,
      treatmentId: treatment.id,
      newExpiryDate: newExpiryDate?.toISOString() || null,
      nextDueMileage: !newExpiryDate && data.mileage
        ? data.mileage + (KM_INTERVAL[data.reminderType] || 10_000)
        : null,
      message: newExpiryDate
        ? `מעולה! ה${typeLabel} עודכן. התזכורת הבאה תישלח ב-${newExpiryDate.toLocaleDateString('he-IL')}.`
        : `מעולה! ה${typeLabel} תועד בהיסטוריה.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
