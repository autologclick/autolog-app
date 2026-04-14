import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin, jsonResponse, handleApiError } from '@/lib/api-helpers';

// POST /api/admin/cleanup-orphan-notifications
// Deletes notifications referencing vehicles (by license plate in message
// or by /vehicles/{id} in link) that no longer exist in the DB.
export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);

    // Load all existing vehicle plates + ids once
    const vehicles = await prisma.vehicle.findMany({
      select: { id: true, licensePlate: true },
    });
    const existingPlates = new Set(vehicles.map(v => v.licensePlate));
    const existingIds = new Set(vehicles.map(v => v.id));

    // Only look at vehicle-scoped notification types
    const candidates = await prisma.notification.findMany({
      where: {
        type: { in: ['test_expiry', 'insurance_expiry', 'appointment', 'sos'] },
      },
      select: { id: true, message: true, link: true },
    });

    const toDelete: string[] = [];
    // Match Israeli license plates (7-8 digits, optionally with hyphens/dots)
    const plateRegex = /\d[\d\-\u00B7]{5,9}\d/g;
    const linkIdRegex = /\/vehicles\/([a-z0-9]+)/i;

    for (const n of candidates) {
      let referencesLivingVehicle = false;

      // Check link first (more precise)
      if (n.link) {
        const m = n.link.match(linkIdRegex);
        if (m && existingIds.has(m[1])) {
          referencesLivingVehicle = true;
        }
      }

      // Fall back to plate match in message
      if (!referencesLivingVehicle && n.message) {
        const plates = (n.message.match(plateRegex) || []).map(p =>
          p.replace(/[\-\u00B7]/g, '')
        );
        if (plates.some(p => existingPlates.has(p))) {
          referencesLivingVehicle = true;
        }
      }

      // If message contains a plate-looking token but no existing vehicle matches → orphan
      if (!referencesLivingVehicle) {
        const hasPlateLike = n.message && plateRegex.test(n.message);
        const hasVehicleLink = n.link && linkIdRegex.test(n.link);
        if (hasPlateLike || hasVehicleLink) {
          toDelete.push(n.id);
        }
      }
    }

    if (toDelete.length === 0) {
      return jsonResponse({ message: 'לא נמצאו התראות יתומות', deleted: 0 });
    }

    const result = await prisma.notification.deleteMany({
      where: { id: { in: toDelete } },
    });

    return jsonResponse({
      message: result.count + ' התראות יתומות נמחקו',
      deleted: result.count,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
