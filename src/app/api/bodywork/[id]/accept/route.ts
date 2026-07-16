import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  requireAuth,
  jsonResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import { createNotification } from '@/lib/services/notification-service';
import { sendPushToGarageOwner } from '@/lib/push-sender';
import { sendEmail, buildBodyworkAcceptedGarageEmailHtml, buildBodyworkAcceptedAdminEmailHtml } from '@/lib/email';
import { notifyTelegram } from '@/lib/telegram';

/**
 * PUT /api/bodywork/[id]/accept — User accepts a quote
 * Body: { quoteId: string }
 *
 * After acceptance:
 * - Notify accepted garage (push + email + in-app) with customer contact info
 * - Notify admin (email + in-app) with full details for record-keeping
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { quoteId } = body;

    if (!quoteId) return errorResponse('חסר מזהה הצעה', 400);

    // Verify request belongs to user — include vehicle & user details for notifications
    const request = await prisma.bodyworkRequest.findUnique({
      where: { id },
      include: {
        vehicle: { select: { manufacturer: true, model: true, year: true, licensePlate: true } },
        user: { select: { fullName: true, phone: true, email: true } },
      },
    });
    if (!request) return errorResponse('בקשה לא נמצאה', 404);
    if (request.userId !== payload.userId && payload.role !== 'admin') {
      return errorResponse('אין הרשאה', 403);
    }
    if (request.status === 'accepted' || request.status === 'completed') {
      return errorResponse('כבר נבחרה הצעה לבקשה זו', 400);
    }

    // Verify quote exists — include garage details for notifications
    const quote = await prisma.bodyworkQuote.findFirst({
      where: { id: quoteId, requestId: id },
      include: {
        garage: { select: { id: true, ownerId: true, name: true, email: true, phone: true } },
      },
    });
    if (!quote) return errorResponse('הצעה לא נמצאה', 404);

    // Accept the quote, reject all others
    await prisma.$transaction([
      prisma.bodyworkQuote.update({
        where: { id: quoteId },
        data: { status: 'accepted' },
      }),
      prisma.bodyworkQuote.updateMany({
        where: { requestId: id, id: { not: quoteId } },
        data: { status: 'rejected' },
      }),
      prisma.bodyworkRequest.update({
        where: { id },
        data: { status: 'accepted', acceptedQuoteId: quoteId },
      }),
    ]);

    // ── Notify accepted garage (async, non-blocking) ──
    const vehicleLabel = `${request.vehicle.manufacturer} ${request.vehicle.model} (${request.vehicle.year})`;
    const customerName = request.user.fullName || 'לקוח';
    const shortDesc = request.description.length > 60 ? request.description.slice(0, 60) + '...' : request.description;

    notifyAcceptedGarage({
      garage: quote.garage,
      customerName,
      customerPhone: request.user.phone,
      customerEmail: request.user.email,
      vehicleLabel,
      description: request.description,
      price: quote.price,
      estimatedDays: quote.estimatedDays,
    }).catch(err => console.error('Garage acceptance notification failed:', err));

    // ── Notify admin (async, non-blocking) ──
    notifyAdmin({
      customerName,
      customerPhone: request.user.phone,
      customerEmail: request.user.email,
      garageName: quote.garage.name,
      garageEmail: quote.garage.email,
      garagePhone: quote.garage.phone,
      vehicleLabel,
      licensePlate: request.vehicle.licensePlate,
      description: request.description,
      price: quote.price,
      estimatedDays: quote.estimatedDays,
      requestId: id,
    }).catch(err => console.error('Admin acceptance notification failed:', err));

    return jsonResponse({ success: true, acceptedQuoteId: quoteId });
  } catch (err) {
    return handleApiError(err);
  }
}

// ── Notification helpers ──

async function notifyAcceptedGarage(params: {
  garage: { id: string; ownerId: string | null; name: string; email: string | null; phone: string | null };
  customerName: string;
  customerPhone: string | null;
  customerEmail: string;
  vehicleLabel: string;
  description: string;
  price: number;
  estimatedDays: number | null;
}) {
  const { garage, customerName, customerPhone, customerEmail, vehicleLabel, description, price, estimatedDays } = params;

  if (!garage.ownerId) return;

  // 1) In-app notification
  createNotification({
    userId: garage.ownerId,
    type: 'bodywork_request',
    title: '🎉 הצעת הפחחות שלך אושרה!',
    message: `${customerName} אישר/ה את ההצעה — ₪${price.toLocaleString('he-IL')} — ${vehicleLabel}`,
    link: '/garage/bodywork',
  }).catch(() => {});

  // 2) Push notification (with sound/vibration)
  sendPushToGarageOwner(garage.id, {
    title: '🎉 הצעת הפחחות שלך אושרה!',
    body: `${customerName} בחר/ה בהצעה שלך — ₪${price.toLocaleString('he-IL')}. צור קשר עכשיו!`,
    data: { url: '/garage/bodywork' },
    requireInteraction: true,
  }).catch(() => {});

  // 3) Email with full customer contact details
  if (garage.email) {
    sendEmail({
      to: garage.email,
      subject: `🎉 הצעת הפחחות שלך אושרה — ${vehicleLabel}`,
      html: buildBodyworkAcceptedGarageEmailHtml({
        garageName: garage.name,
        customerName,
        customerPhone,
        customerEmail,
        vehicleLabel,
        description,
        price,
        estimatedDays,
      }),
    }).catch(() => {});
  }
}

async function notifyAdmin(params: {
  customerName: string;
  customerPhone: string | null;
  customerEmail: string;
  garageName: string;
  garageEmail: string | null;
  garagePhone: string | null;
  vehicleLabel: string;
  licensePlate: string;
  description: string;
  price: number;
  estimatedDays: number | null;
  requestId: string;
}) {
  notifyTelegram(
    '✅ הצעת פחחות אושרה',
    `לקוח: ${params.customerName}\nמוסך: ${params.garageName}\nרכב: ${params.vehicleLabel} (${params.licensePlate})\nמחיר: ₪${params.price.toLocaleString('he-IL')}`,
  );

  // Find admin users
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, email: true },
  });

  for (const admin of admins) {
    // In-app notification
    createNotification({
      userId: admin.id,
      type: 'system',
      title: 'הצעת פחחות אושרה',
      message: `${params.customerName} אישר/ה הצעה מ${params.garageName} — ₪${params.price.toLocaleString('he-IL')}`,
      link: '/admin/bodywork',
    }).catch(() => {});

    // Email with complete details
    if (admin.email) {
      sendEmail({
        to: admin.email,
        subject: `📋 הצעת פחחות אושרה — ${params.customerName} ↔ ${params.garageName}`,
        html: buildBodyworkAcceptedAdminEmailHtml({
          customerName: params.customerName,
          customerPhone: params.customerPhone,
          customerEmail: params.customerEmail,
          garageName: params.garageName,
          garageEmail: params.garageEmail,
          garagePhone: params.garagePhone,
          vehicleLabel: params.vehicleLabel,
          licensePlate: params.licensePlate,
          description: params.description,
          price: params.price,
          estimatedDays: params.estimatedDays,
          requestId: params.requestId,
        }),
      }).catch(() => {});
    }
  }
}
