/**
 * Vehicle access control — shared vehicles are CO-MANAGED.
 *
 * A user with an approved VehicleShare on a vehicle is treated exactly like the
 * owner for that vehicle's RECORDS: expenses (incl. fuel), treatments, documents
 * and mileage — read, create, update, delete.
 *
 * Owner-only actions are NOT covered here and must keep an explicit owner check:
 *   - deleting the vehicle
 *   - editing the vehicle's details (nickname/plate/year/…) — mileage excepted
 *   - managing shares (invite / revoke)
 *
 * Use `assertVehicleRecordAccess` on a single vehicle, and
 * `getAccessibleVehicleIds` when listing records across the user's vehicles.
 */

import prisma from '@/lib/db';
import { AuthError } from '@/lib/api-helpers';
import { AUTH_ERRORS, NOT_FOUND } from '@/lib/messages';

export interface VehicleAccess {
  isOwner: boolean;
  isSharedUser: boolean;
}

/**
 * Every vehicle id the user may manage records for: owned + approved shares.
 * Use this instead of `vehicle.findMany({ where: { userId } })` in list routes,
 * so records of shared vehicles show up for both sides.
 */
export async function getAccessibleVehicleIds(userId: string): Promise<string[]> {
  const [owned, shared] = await Promise.all([
    prisma.vehicle.findMany({ where: { userId }, select: { id: true } }),
    prisma.vehicleShare.findMany({
      where: { sharedWithUserId: userId, status: 'approved' },
      select: { vehicleId: true },
    }),
  ]);
  return [...new Set([...owned.map((v) => v.id), ...shared.map((s) => s.vehicleId)])];
}

/**
 * Assert the user may read/write this vehicle's records.
 * Throws 404 when the vehicle doesn't exist, 403 when the user has no access.
 * Returns whether they are the owner (callers can gate owner-only extras).
 */
export async function assertVehicleRecordAccess(userId: string, vehicleId: string): Promise<VehicleAccess> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { userId: true },
  });
  if (!vehicle) throw new AuthError(NOT_FOUND.VEHICLE, 404);

  if (vehicle.userId === userId) return { isOwner: true, isSharedUser: false };

  const share = await prisma.vehicleShare.findFirst({
    where: { vehicleId, sharedWithUserId: userId, status: 'approved' },
    select: { id: true },
  });
  if (share) return { isOwner: false, isSharedUser: true };

  throw new AuthError(AUTH_ERRORS.FORBIDDEN_RESOURCE, 403);
}

/** Owner-only gate: delete vehicle, edit vehicle details, manage shares. */
export async function assertVehicleOwner(userId: string, vehicleId: string): Promise<void> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { userId: true },
  });
  if (!vehicle) throw new AuthError(NOT_FOUND.VEHICLE, 404);
  if (vehicle.userId !== userId) throw new AuthError(AUTH_ERRORS.FORBIDDEN_RESOURCE, 403);
}
