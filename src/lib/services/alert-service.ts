/**
 * Alert Service - Builds admin dashboard alerts from various data sources.
 * Replaces inline alert construction with typed, centralized logic.
 */

import { SOS_TYPE_HEB, USER_ROLE_HEB } from '@/lib/constants/translations';

// =============================================
// Types
// =============================================

export type AlertPriority = 'high' | 'medium' | 'low';

export type AlertType = 'sos' | 'expiry' | 'application' | 'inspection' | 'user' | 'appointment';

export interface AdminAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
}

// =============================================
// Priority sorting
// =============================================

const PRIORITY_ORDER: Record<AlertPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function sortAlertsByPriorityAndTime(alerts: AdminAlert[]): AdminAlert[] {
  return alerts.sort((a, b) => {
    const pDiff = (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
    if (pDiff !== 0) return pDiff;
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });
}

// =============================================
// Alert builders
// =============================================

interface SosEventData {
  id: string;
  eventType: string;
  location?: string | null;
  createdAt: Date;
  user?: { fullName: string | null } | null;
}

export function buildSosAlerts(events: SosEventData[]): AdminAlert[] {
  return events.map(sos => ({
    id: `sos-${sos.id}`,
    type: 'sos' as const,
    priority: 'high' as const,
    title: `אירוע SOS - ${SOS_TYPE_HEB[sos.eventType] || sos.eventType}`,
    message: `${sos.user?.fullName || 'משתמש'} דיווח${sos.location ? ` ב${sos.location}` : ''}`,
    time: sos.createdAt.toISOString(),
    read: false,
    link: '/admin/sos',
  }));
}

interface ExpiringVehicleData {
  id: string;
  licensePlate: string;
}

export function buildTestExpiryAlert(vehicles: ExpiringVehicleData[], now: Date): AdminAlert | null {
  if (vehicles.length === 0) return null;
  return {
    id: 'test-expiry-batch',
    type: 'expiry',
    priority: vehicles.length >= 5 ? 'high' : 'medium',
    title: `טסט עומד לפוג - ${vehicles.length} רכבים`,
    message: `${vehicles.length} רכבים עם טסט שפג תוקף בשבוע הקרוב`,
    time: now.toISOString(),
    read: false,
    link: '/admin/documents',
  };
}

export function buildInsuranceExpiryAlert(vehicles: ExpiringVehicleData[], now: Date): AdminAlert | null {
  if (vehicles.length === 0) return null;
  return {
    id: 'insurance-expiry-batch',
    type: 'expiry',
    priority: vehicles.length >= 5 ? 'high' : 'medium',
    title: `ביטוח עומד לפוג - ${vehicles.length} רכבים`,
    message: `${vehicles.length} רכבים עם ביטוח שפג תוקף בשבוע הקרוב`,
    time: now.toISOString(),
    read: false,
    link: '/admin/documents',
  };
}

interface GarageApplicationData {
  id: string;
  garageName: string;
  ownerName: string;
  createdAt: Date;
}

export function buildApplicationAlerts(applications: GarageApplicationData[]): AdminAlert[] {
  return applications.map(app => ({
    id: `app-${app.id}`,
    type: 'application' as const,
    priority: 'medium' as const,
    title: `בקשת הצטרפות חדשה - ${app.garageName}`,
    message: `${app.ownerName} הגיש בקשה לצירוף מוסך`,
    time: app.createdAt.toISOString(),
    read: false,
    link: '/admin/applications',
  }));
}

interface InspectionData {
  id: string;
  date: Date;
  garage?: { name: string } | null;
  vehicle?: { manufacturer: string; model: string; licensePlate: string } | null;
}

export function buildInspectionAlerts(inspections: InspectionData[]): AdminAlert[] {
  return inspections.map(insp => ({
    id: `insp-${insp.id}`,
    type: 'inspection' as const,
    priority: 'low' as const,
    title: 'בדיקה הושלמה',
    message: `${insp.garage?.name || 'מוסך'} סיים בדיקה ל-${insp.vehicle?.manufacturer} ${insp.vehicle?.model} (${insp.vehicle?.licensePlate})`,
    time: insp.date.toISOString(),
    read: true,
    link: `/admin/inspections/${insp.id}`,
  }));
}

interface UserData {
  id: string;
  fullName: string;
  role: string;
  createdAt: Date;
}

export function buildUserAlerts(users: UserData[]): AdminAlert[] {
  return users.map(user => ({
    id: `user-${user.id}`,
    type: 'user' as const,
    priority: 'low' as const,
    title: `${USER_ROLE_HEB[user.role] || 'משתמש'} חדש נרשם`,
    message: `${user.fullName} נרשם/ה למערכת`,
    time: user.createdAt.toISOString(),
    read: true,
    link: '/admin/users',
  }));
}

interface PendingAppointmentData {
  id: string;
}

export function buildPendingAppointmentsAlert(appointments: PendingAppointmentData[], now: Date): AdminAlert | null {
  if (appointments.length === 0) return null;
  return {
    id: 'pending-appt-batch',
    type: 'appointment',
    priority: 'medium',
    title: `${appointments.length} תורים ממתינים לאישור`,
    message: `ישנם ${appointments.length} תורים שעדיין לא אושרו`,
    time: now.toISOString(),
    read: false,
    link: '/admin/appointments',
  };
}
