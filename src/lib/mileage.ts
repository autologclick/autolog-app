import prisma from './db';

export class MileageError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = 'MileageError';
    this.status = status;
  }
}

/**
 * Update a vehicle's mileage with validation.
 * - Rejects values lower than the current mileage.
 * - No-op if newMileage is null/undefined/0.
 * Returns true if updated, false if unchanged, throws MileageError if rejected.
 */
export async function updateVehicleMileage(
  vehicleId: string,
  newMileage: number | null | undefined
): Promise<boolean> {
  if (!newMileage || newMileage <= 0) return false;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { mileage: true },
  });
  if (!vehicle) throw new MileageError('הרכב לא נמצא', 404);

  const current = vehicle.mileage || 0;

  if (newMileage < current) {
    throw new MileageError(
      'לא ניתן לעדכן קילומטראז׳ נמוך יותר מהקיים (' +
        current.toLocaleString() +
        ' ק"מ). הזן ערך גבוה או שווה לזה.',
      400
    );
  }

  if (newMileage === current) return false;

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { mileage: newMileage },
  });
  return true;
}
