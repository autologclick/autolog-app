/**
 * Dashboard Service - Transforms raw DB data into admin dashboard view models.
 * Extracts mapping, trend calculation, and activity feed logic from the route.
 */

// =============================================
// Raw data types (matching Prisma query shapes)
// =============================================

export interface TopGarageRow {
  id: string;
  name: string;
  city: string | null;
  isActive: boolean;
  _count: { inspections: number; reviews: number };
  reviews: { rating: number }[];
}

export interface RecentUserRow {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
  _count: { vehicles: number };
}

export interface RecentInspectionRow {
  id: string;
  createdAt: Date;
  overallScore: number | null;
  status: string;
  vehicle: { nickname: string; licensePlate: string } | null;
  garage: { name: string } | null;
}

export interface RecentAppointmentRow {
  id: string;
  createdAt: Date;
  date: Date;
  status: string;
  user: { fullName: string } | null;
  garage: { name: string } | null;
}

export interface RecentSosEventRow {
  id: string;
  createdAt: Date;
  status: string;
  user: { fullName: string } | null;
  vehicle: { nickname: string; licensePlate: string } | null;
}

// =============================================
// View models (API response shapes)
// =============================================

export interface GarageViewModel {
  id: string;
  name: string;
  city: string;
  isActive: boolean;
  inspectionCount: number;
  reviewCount: number;
  avgRating: number;
}

export interface ActivityItem {
  id: string;
  type: 'user' | 'inspection' | 'appointment' | 'sos';
  title: string;
  description: string;
  timestamp: Date;
  meta: Record<string, unknown>;
}

// =============================================
// Trend calculations
// =============================================

export function calculateTrend(current: number, previous: number): number {
  if (previous <= 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

// =============================================
// Data transformers
// =============================================

export function mapTopGarages(garages: TopGarageRow[]): GarageViewModel[] {
  return garages.map(g => ({
    id: g.id,
    name: g.name,
    city: g.city || '',
    isActive: g.isActive,
    inspectionCount: g._count.inspections,
    reviewCount: g._count.reviews,
    avgRating: g.reviews.length > 0
      ? Number((g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length).toFixed(1))
      : 0,
  }));
}

export function mapRecentUsers(users: RecentUserRow[]) {
  return users.map(u => ({
    id: u.id,
    name: u.fullName,
    email: u.email,
    vehicleCount: u._count.vehicles,
    createdAt: u.createdAt,
  }));
}

export function mapRecentInspections(inspections: RecentInspectionRow[]) {
  return inspections.map(i => ({
    id: i.id,
    vehicle: `${i.vehicle?.nickname || ''} (${i.vehicle?.licensePlate || ''})`,
    garage: i.garage?.name || '',
    score: i.overallScore,
    status: i.status,
    date: i.createdAt,
  }));
}

export function buildRecentActivity(
  users: RecentUserRow[],
  inspections: RecentInspectionRow[],
  appointments: RecentAppointmentRow[],
  sosEvents: RecentSosEventRow[],
  limit: number = 10,
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...users.map(u => ({
      id: u.id,
      type: 'user' as const,
      title: u.fullName,
      description: 'משתמש חדש',
      timestamp: u.createdAt,
      meta: { email: u.email, vehicles: u._count.vehicles } as Record<string, unknown>,
    })),
    ...inspections.map(i => ({
      id: i.id,
      type: 'inspection' as const,
      title: i.vehicle?.nickname || i.vehicle?.licensePlate || 'רכב',
      description: 'בדיקה חדשה',
      timestamp: i.createdAt,
      meta: { garage: i.garage?.name, score: i.overallScore, status: i.status } as Record<string, unknown>,
    })),
    ...appointments.map(a => ({
      id: a.id,
      type: 'appointment' as const,
      title: a.user?.fullName || 'משתמש',
      description: 'תור חדש',
      timestamp: a.createdAt,
      meta: { garage: a.garage?.name, date: a.date, status: a.status } as Record<string, unknown>,
    })),
    ...sosEvents.map(s => ({
      id: s.id,
      type: 'sos' as const,
      title: s.user?.fullName || 'משתמש',
      description: 'אירוע SOS',
      timestamp: s.createdAt,
      meta: { vehicle: `${s.vehicle?.nickname || ''} (${s.vehicle?.licensePlate || ''})`, status: s.status } as Record<string, unknown>,
    })),
  ];

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
