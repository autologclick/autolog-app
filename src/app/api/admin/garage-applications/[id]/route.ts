import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, handleApiError, requireAdmin } from '@/lib/api-helpers';
import { getApplicationById, updateApplicationStatus } from '@/lib/garage-applications-db';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { GARAGE_APP_ERRORS } from '@/lib/messages';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req);
    const application = await getApplicationById(params.id);
    if (!application) {
      return errorResponse(GARAGE_APP_ERRORS.NOT_FOUND, 404);
    }
    return jsonResponse(application);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = requireAdmin(req);
    const body = await req.json();
    const { status, adminNotes } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return errorResponse(GARAGE_APP_ERRORS.INVALID_STATUS, 400);
    }

    const application = await getApplicationById(params.id);
    if (!application) {
      return errorResponse(GARAGE_APP_ERRORS.NOT_FOUND, 404);
    }

    if (application.status !== 'pending') {
      return errorResponse(GARAGE_APP_ERRORS.ALREADY_PROCESSED, 400);
    }

    // Update application status
    await updateApplicationStatus(params.id, status, adminNotes || null, admin.userId);

    // If approved, create the garage owner user and garage
    if (status === 'approved') {
      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: application.email },
      });

      let userId: string;

      if (existingUser) {
        // Update existing user role to garage_owner
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'garage_owner' },
        });
        userId = existingUser.id;
      } else {
        // Create new user with garage_owner role
        const tempPassword = await hashPassword('AutoLog2026!');
        const newUser = await prisma.user.create({
          data: {
            email: application.email,
            fullName: application.ownerName,
            phone: application.phone,
            passwordHash: tempPassword,
            role: 'garage_owner',
          },
        });
        userId = newUser.id;
      }

      // Check if garage already exists for this owner
      const existingGarage = await prisma.garage.findUnique({
        where: { ownerId: userId },
      });

      if (!existingGarage) {
        // Create the garage
        await prisma.garage.create({
          data: {
            ownerId: userId,
            name: application.garageName,
            city: application.city,
            address: application.address || undefined,
            phone: application.phone,
            email: application.email,
            description: application.description || undefined,
            services: application.services || '[]',
            isActive: true,
            isPartner: true,
          },
        });
      }

      return jsonResponse({
        message: 'הבקשה אושרה! המוסך נוסף למערכת בהצלחה.',
        userCreated: !existingUser,
        passwordInfo: !existingUser ? 'סיסמה נשלחה למייל' : undefined,
      });
    }

    return jsonResponse({
      message: status === 'rejected' ? 'הבקשה נדחתה.' : 'הסטטוס עודכן.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
