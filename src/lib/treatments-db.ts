import prisma from '@/lib/db';
import { Treatment } from '@prisma/client';
import { getAccessibleVehicleIds } from '@/lib/vehicle-access';

export type { Treatment };

// Create a treatment (user self-report)
export async function createTreatment(data: {
  vehicleId: string;
  userId: string;
  garageId?: string;
  garageName?: string;
  mechanicName?: string;
  type: string;
  title: string;
  description?: string;
  items?: string;
  mileage?: number;
  cost?: number;
  date: string;
  notes?: string;
}): Promise<Treatment> {
  return prisma.treatment.create({
    data: {
      vehicleId: data.vehicleId,
      userId: data.userId,
      garageId: data.garageId || null,
      garageName: data.garageName || null,
      mechanicName: data.mechanicName || null,
      type: data.type,
      title: data.title,
      description: data.description || null,
      items: data.items || null,
      mileage: data.mileage || null,
      cost: data.cost || null,
      date: data.date,
      status: 'approved',
      sentByGarage: false,
      notes: data.notes || null,
    },
  });
}

// Create treatment from garage (pending approval)
export async function createGarageTreatment(data: {
  vehicleId: string;
  userId: string;
  garageId: string;
  garageName: string;
  mechanicName?: string;
  type: string;
  title: string;
  description?: string;
  items?: string;
  mileage?: number;
  cost?: number;
  date: string;
  notes?: string;
}): Promise<Treatment> {
  return prisma.treatment.create({
    data: {
      vehicleId: data.vehicleId,
      userId: data.userId,
      garageId: data.garageId,
      garageName: data.garageName,
      mechanicName: data.mechanicName || null,
      type: data.type,
      title: data.title,
      description: data.description || null,
      items: data.items || null,
      mileage: data.mileage || null,
      cost: data.cost || null,
      date: data.date,
      status: 'pending_approval',
      sentByGarage: true,
      notes: data.notes || null,
    },
  });
}

// Get treatment by ID
export async function getTreatmentById(id: string): Promise<Treatment | null> {
  return prisma.treatment.findUnique({ where: { id } });
}

// Get treatments for a user (optionally filter by vehicle)
/**
 * Treatments visible to a user = every treatment on a vehicle they can manage
 * (owned OR shared with them), regardless of who recorded it. Scoping by
 * `Treatment.userId` would hide a co-manager's treatments from the owner and
 * vice versa — shared vehicles are co-managed, so scope by vehicle.
 * Callers must verify access when they pass an explicit vehicleId.
 */
export async function getUserTreatments(userId: string, vehicleId?: string): Promise<Treatment[]> {
  const accessibleIds = await getAccessibleVehicleIds(userId);
  if (accessibleIds.length === 0) return [];
  return prisma.treatment.findMany({
    where: {
      vehicleId: vehicleId ? vehicleId : { in: accessibleIds },
    },
    orderBy: { date: 'desc' },
  });
}

// Get pending treatments for a user
export async function getPendingTreatments(userId: string): Promise<Treatment[]> {
  return prisma.treatment.findMany({
    where: {
      userId,
      status: 'pending_approval',
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Get treatments sent by a garage
export async function getGarageTreatments(garageId: string): Promise<Treatment[]> {
  return prisma.treatment.findMany({
    where: { garageId },
    orderBy: { date: 'desc' },
  });
}

/**
 * Treatments the user may mutate: any treatment on a vehicle they can manage
 * (owned or shared). Returns a Prisma filter fragment used by the mutations
 * below so a co-manager can edit/delete treatments recorded by the owner and
 * vice versa.
 */
async function accessibleTreatmentWhere(id: string, userId: string) {
  const accessibleIds = await getAccessibleVehicleIds(userId);
  return { id, vehicleId: { in: accessibleIds } };
}

// Approve a treatment
export async function approveTreatment(id: string, userId: string): Promise<boolean> {
  try {
    await prisma.treatment.updateMany({
      where: { ...(await accessibleTreatmentWhere(id, userId)), status: 'pending_approval' },
      data: { status: 'approved', approvedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

// Reject a treatment
export async function rejectTreatment(id: string, userId: string, reason?: string): Promise<boolean> {
  try {
    await prisma.treatment.updateMany({
      where: { ...(await accessibleTreatmentWhere(id, userId)), status: 'pending_approval' },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: reason || null,
      },
    });
    return true;
  } catch {
    return false;
  }
}

// Update a treatment (only user's own)
export async function updateTreatment(id: string, userId: string, data: Partial<{
  title: string;
  description: string;
  type: string;
  items: string;
  mileage: number;
  cost: number;
  date: string;
  garageName: string;
  mechanicName: string;
  notes: string;
}>): Promise<boolean> {
  try {
    const result = await prisma.treatment.updateMany({
      where: await accessibleTreatmentWhere(id, userId),
      data,
    });
    return result.count > 0;
  } catch {
    return false;
  }
}

// Delete a treatment
export async function deleteTreatment(id: string, userId: string): Promise<boolean> {
  try {
    const result = await prisma.treatment.deleteMany({
      where: await accessibleTreatmentWhere(id, userId),
    });
    return result.count > 0;
  } catch {
    return false;
  }
}
