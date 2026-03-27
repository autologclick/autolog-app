/**
 * Garage Customer Service - Aggregates customer data from appointments and inspections.
 */

// =============================================
// Types
// =============================================

export interface CustomerVehicle {
  id: string;
  nickname: string | null;
  licensePlate: string;
  manufacturer: string | null;
  model: string | null;
  year: number | null;
}

export interface CustomerEntry {
  id: string;
  fullName: string;
  phone: string | null;
  email: string;
  lastVisit: Date;
  totalVisits: number;
  vehicles: CustomerVehicle[];
}

interface UserInfo {
  id: string;
  fullName: string;
  phone: string | null;
  email: string;
}

interface VehicleInfo {
  id: string;
  nickname: string | null;
  licensePlate: string;
  manufacturer: string | null;
  model: string | null;
  year: number | null;
}

export interface AppointmentRow {
  user: UserInfo;
  vehicle: VehicleInfo;
  date: Date;
}

export interface InspectionRow {
  vehicle: VehicleInfo & {
    userId: string;
    user: UserInfo;
  };
  date: Date;
}

// =============================================
// Internal state
// =============================================

interface CustomerAccumulator {
  id: string;
  fullName: string;
  phone: string | null;
  email: string;
  lastVisit: Date;
  totalVisits: number;
}

// =============================================
// Aggregation
// =============================================

/**
 * Aggregate appointments and inspections into a unified customer list.
 * Each customer includes all vehicles seen at the garage, sorted by last visit (newest first).
 */
export function aggregateGarageCustomers(
  appointments: AppointmentRow[],
  inspections: InspectionRow[],
): CustomerEntry[] {
  const customerMap = new Map<string, CustomerAccumulator>();
  const vehicleMap = new Map<string, Map<string, CustomerVehicle>>();

  function ensureCustomer(userId: string, user: UserInfo, visitDate: Date): void {
    const existing = customerMap.get(userId);
    if (!existing) {
      customerMap.set(userId, {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        lastVisit: visitDate,
        totalVisits: 0,
      });
      vehicleMap.set(userId, new Map());
    }
  }

  function recordVisit(userId: string, visitDate: Date, vehicle: VehicleInfo): void {
    const entry = customerMap.get(userId)!;
    entry.totalVisits++;
    if (visitDate > entry.lastVisit) {
      entry.lastVisit = visitDate;
    }

    const vehicles = vehicleMap.get(userId)!;
    if (!vehicles.has(vehicle.id)) {
      vehicles.set(vehicle.id, {
        id: vehicle.id,
        nickname: vehicle.nickname,
        licensePlate: vehicle.licensePlate,
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        year: vehicle.year,
      });
    }
  }

  // Process appointments
  for (const apt of appointments) {
    ensureCustomer(apt.user.id, apt.user, apt.date);
    recordVisit(apt.user.id, apt.date, apt.vehicle);
  }

  // Process inspections
  for (const insp of inspections) {
    ensureCustomer(insp.vehicle.userId, insp.vehicle.user, insp.date);
    recordVisit(insp.vehicle.userId, insp.date, insp.vehicle);
  }

  // Build final array sorted by last visit (newest first)
  return Array.from(customerMap.entries())
    .map(([userId, entry]) => ({
      ...entry,
      vehicles: Array.from(vehicleMap.get(userId)?.values() ?? []),
    }))
    .sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());
}
