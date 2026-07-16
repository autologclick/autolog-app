import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, jsonResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { getUserTreatments, createTreatment, getPendingTreatments } from '@/lib/treatments-db';
import { assertVehicleRecordAccess } from '@/lib/vehicle-access';
import { z } from 'zod';
import { updateVehicleMileage, MileageError } from '@/lib/mileage';

const createTreatmentSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum(['maintenance', 'repair', 'oil_change', 'tires', 'brakes', 'electrical', 'ac', 'bodywork', 'other']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  items: z.string().optional(), // JSON array
  mileage: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
  date: z.string().min(1),
  garageName: z.string().max(200).optional(),
  mechanicName: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  // Optional: when the user scanned a receipt to create this treatment,
  // the frontend passes the image + AI extraction so we can also save
  // the receipt as a Document and link it to the auto-created Expense.
  receiptImage: z.string().optional(),  // base64 data URL
  scanData: z.object({
    totalAmount: z.number().optional(),
    date: z.string().optional(),
    documentType: z.string().optional(),
    description: z.string().optional(),
    summary: z.string().optional(),
    businessName: z.string().optional(),
    suggestedCategory: z.string().optional(),
    invoiceNumber: z.string().optional(),
  }).optional(),
});

// GET /api/treatments - Get user's treatments
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const vehicleId = req.nextUrl.searchParams.get('vehicleId') || undefined;
    const pending = req.nextUrl.searchParams.get('pending');

    if (pending === 'true') {
      const treatments = await getPendingTreatments(payload.userId);
      return jsonResponse({ treatments });
    }

    // Explicit vehicle → must have access to it (owner or approved share)
    if (vehicleId) await assertVehicleRecordAccess(payload.userId, vehicleId);

    const treatments = await getUserTreatments(payload.userId, vehicleId);
    return jsonResponse({ treatments });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/treatments - Create a treatment (user self-report)
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const validation = createTreatmentSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0]?.message || 'נתונים לא תקינים', 400);
    }

    const data = validation.data;

    // Owner or approved-share user may record a treatment on this vehicle
    await assertVehicleRecordAccess(payload.userId, data.vehicleId);

    // Validate mileage BEFORE creating the treatment so we can reject it cleanly
    if (data.mileage && data.mileage > 0) {
      try {
        await updateVehicleMileage(data.vehicleId, data.mileage);
      } catch (e) {
        if (e instanceof MileageError) return errorResponse(e.message, e.status);
        throw e;
      }
    }

    const treatment = await createTreatment({
      ...data,
      userId: payload.userId,
    });

    // Auto-create expense so it shows in monthly expenses summary
    let createdExpenseId: string | null = null;
    if (data.cost && data.cost > 0) {
      // Map treatment type -> expense category
      const categoryMap: Record<string, string> = {
        maintenance: 'maintenance',
        repair: 'maintenance',
        oil_change: 'maintenance',
        tires: 'maintenance',
        brakes: 'maintenance',
        electrical: 'maintenance',
        ac: 'maintenance',
        bodywork: 'maintenance',
        other: 'other',
      };
      try {
        const expense = await prisma.expense.create({
          data: {
            vehicleId: data.vehicleId,
            category: categoryMap[data.type] || 'maintenance',
            amount: data.cost,
            description: data.title + (data.garageName ? ' (' + data.garageName + ')' : ''),
            date: new Date(data.date),
            treatmentId: treatment.id,
          },
        });
        createdExpenseId = expense.id;
      } catch (e) {
        // Expense creation is non-blocking — treatment was already saved
        console.warn('[treatments] failed to auto-create expense', e);
      }
    }

    // If the treatment was created by scanning a receipt, also save the
    // receipt image as a Document so it lives in the user's documents library.
    // We link the Document to the same Expense via Expense.documentId, so the
    // three records (Treatment ↔ Expense ↔ Document) form a clean triangle.
    let createdDocumentId: string | null = null;
    if (data.receiptImage && data.receiptImage.startsWith('data:image/')) {
      try {
        const doc = await prisma.document.create({
          data: {
            vehicleId: data.vehicleId,
            type: 'receipt',
            title: data.scanData?.businessName || data.title,
            description: data.scanData?.summary || null,
            fileUrl: data.receiptImage,
            fileType: 'image/jpeg',
            // Receipts are archival — DO NOT set expiryDate, that would
            // make the documents page show a false "expired" status later.
          },
        });
        createdDocumentId = doc.id;

        // Link the document to the auto-created expense (if one exists)
        if (createdExpenseId) {
          await prisma.expense.update({
            where: { id: createdExpenseId },
            data: { documentId: createdDocumentId },
          });
        }
      } catch (e) {
        // Document creation is non-blocking — treatment and expense still saved
        console.warn('[treatments] failed to auto-create receipt document', e);
      }
    }

    return jsonResponse({
      treatment,
      expenseId: createdExpenseId,
      documentId: createdDocumentId,
      message: 'הטיפול נוסף בהצלחה!',
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
