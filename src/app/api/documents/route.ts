import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  handleApiError,
  AuthError,
} from '@/lib/api-helpers';
import { documentSchema } from '@/lib/validations';
import { checkApiRateLimit } from '@/lib/rate-limit';

// GET /api/documents - List documents for user's vehicles
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit general API calls
    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוב מאוחר יותר.', 429);
    }

    // Get query params
    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId');

    // Build query filters
    const whereClause: any = {
      vehicle: {
        userId: payload.userId, // Ensure user owns the vehicle
      },
    };

    if (vehicleId) {
      whereClause.vehicleId = vehicleId;
    }

    // Fetch documents sorted by createdAt descending
    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        vehicle: {
          select: {
            id: true,
            nickname: true,
            licensePlate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jsonResponse({ documents });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/documents - Create a new document
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    // Rate limit API calls
    const rateLimit = checkApiRateLimit(payload.userId);
    if (!rateLimit.allowed) {
      return errorResponse('יותר מדי בקשות. אנא נסה שוב מאוחר יותר.', 429);
    }

    const body = await req.json();

    // Validate input
    const validation = documentSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const {
      vehicleId,
      type,
      title,
      description,
      fileUrl,
      fileName,
      fileType,
      expiryDate,
      isActive,
    } = validation.data;

    // Verify user owns the vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { userId: true },
    });

    if (!vehicle) {
      return errorResponse('רכב לא נמצא', 404);
    }

    if (vehicle.userId !== payload.userId) {
      throw new AuthError('אינך רשאי ליצור מסמך לרכב זה', 403);
    }

    // Parse expiry date if provided
    let parsedExpiryDate: Date | null = null;
    if (expiryDate) {
      const expiryDate_parsed = new Date(expiryDate);
      if (!isNaN(expiryDate_parsed.getTime())) {
        parsedExpiryDate = expiryDate_parsed;
      }
    }

    // Create document
    const document = await prisma.document.create({
      data: {
        vehicleId,
        type,
        title,
        description: description || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        expiryDate: parsedExpiryDate,
        isActive: isActive !== false, // Default to true
      },
      include: {
        vehicle: {
          select: {
            id: true,
            nickname: true,
            licensePlate: true,
          },
        },
      },
    });

    return jsonResponse({ document, message: 'המסמך נוסף בהצלחה!' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
