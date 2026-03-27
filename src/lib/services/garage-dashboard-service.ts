/**
 * Garage Dashboard Service - Calculations and view-model mapping
 * for the garage owner dashboard.
 */

// =============================================
// Types
// =============================================

export interface GarageInfo {
  name: string;
  city: string | null;
  isActive: boolean;
}

export interface GarageInfoViewModel {
  name: string;
  city: string | null;
  status: string;
}

export interface ScoreRow {
  overallScore: number | null;
}

export interface CostRow {
  cost: number | null;
}

interface AppointmentVehicle {
  nickname: string | null;
  licensePlate: string;
  manufacturer: string | null;
  model: string | null;
}

interface AppointmentUser {
  fullName: string;
  phone: string | null;
}

export interface TodayAppointmentRow {
  id: string;
  date: Date;
  serviceType: string;
  status: string;
  vehicle: AppointmentVehicle | null;
  user: AppointmentUser;
}

export interface TodayAppointmentViewModel {
  id: string;
  time: string;
  customer: string;
  phone: string | null;
  vehicle: string;
  service: string;
  status: string;
}

interface InspectionVehicle {
  nickname: string | null;
  licensePlate: string;
  manufacturer: string | null;
  model: string | null;
  user: { fullName: string } | null;
}

export interface RecentInspectionRow {
  id: string;
  date: Date;
  overallScore: number | null;
  status: string;
  inspectionType: string;
  customerName: string | null;
  vehicle: InspectionVehicle | null;
}

export interface RecentInspectionViewModel {
  id: string;
  vehicle: string;
  customer: string;
  date: string;
  score: number | null;
  status: string;
  type: string;
}

// =============================================
// Calculations
// =============================================

/**
 * Calculate month-over-month trend percentage.
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous > 0) {
    return Math.round(((current - previous) / previous) * 100);
  }
  return current > 0 ? 100 : 0;
}

/**
 * Sum costs from inspection rows.
 */
export function sumRevenue(rows: CostRow[]): number {
  return rows.reduce((sum, row) => sum + (row.cost ?? 0), 0);
}

/**
 * Average score from inspection rows (returns null if no data).
 */
export function averageInspectionScore(rows: ScoreRow[]): number | null {
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, row) => sum + (row.overallScore ?? 0), 0);
  return Number((total / rows.length).toFixed(1));
}

// =============================================
// View-model mappers
// =============================================

export function mapGarageInfo(garage: GarageInfo): GarageInfoViewModel {
  return {
    name: garage.name,
    city: garage.city,
    status: garage.isActive ? 'פעיל' : 'לא פעיל',
  };
}

function formatVehicleLabel(vehicle: AppointmentVehicle | InspectionVehicle | null): string {
  if (!vehicle) return 'לא ידוע';
  const label = vehicle.nickname || `${vehicle.manufacturer ?? ''} ${vehicle.model ?? ''}`.trim();
  return `${label} (${vehicle.licensePlate})`;
}

export function mapTodayAppointments(rows: TodayAppointmentRow[]): TodayAppointmentViewModel[] {
  return rows.map((a) => ({
    id: a.id,
    time: a.date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    customer: a.user.fullName,
    phone: a.user.phone,
    vehicle: formatVehicleLabel(a.vehicle),
    service: a.serviceType,
    status: a.status,
  }));
}

export function mapRecentInspections(rows: RecentInspectionRow[]): RecentInspectionViewModel[] {
  return rows.map((i) => ({
    id: i.id,
    vehicle: formatVehicleLabel(i.vehicle),
    customer: i.vehicle?.user?.fullName || i.customerName || 'לא ידוע',
    date: i.date.toISOString().split('T')[0],
    score: i.overallScore,
    status: i.status,
    type: i.inspectionType,
  }));
}
