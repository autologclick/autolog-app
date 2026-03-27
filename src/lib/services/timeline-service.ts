/**
 * Timeline Service - Builds unified timeline events from various data sources.
 * Extracts event building logic from the history route into typed, reusable functions.
 */

import {
  HISTORY_EVENT_TITLES,
  INSPECTION_TYPE_HEB,
  EXPENSE_CATEGORY_HEB,
  SOS_TYPE_HEB,
} from '@/lib/constants/translations';

// =============================================
// Types
// =============================================

export type TimelineEventType = 'inspection' | 'appointment' | 'expense' | 'sos';

export interface TimelineEventMetadata {
  /** Original entity ID */
  entityId: string;
  /** Sub-type within the event category */
  subType?: string;
  /** Associated garage name */
  garageName?: string | null;
  /** Score or amount depending on type */
  numericValue?: number | null;
  /** Extra notes */
  notes?: string | null;
  /** Priority level for SOS events */
  priority?: string | null;
}

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: Date;
  title: string;
  description: string;
  vehicleId: string;
  vehicleName: string;
  status: string;
  metadata: TimelineEventMetadata;
}

// =============================================
// Vehicle map helper
// =============================================

interface VehicleInfo {
  id: string;
  nickname: string | null;
  licensePlate: string;
  manufacturer: string;
  model: string;
}

export function buildVehicleMap(vehicles: VehicleInfo[]): Map<string, VehicleInfo> {
  return new Map(vehicles.map(v => [v.id, v]));
}

function getVehicleLabel(vehicle: VehicleInfo): string {
  return `${vehicle.manufacturer} ${vehicle.model}`;
}

// =============================================
// Event builders
// =============================================

interface InspectionRow {
  id: string;
  vehicleId: string;
  date: Date;
  inspectionType: string;
  status: string;
  overallScore: number | null;
  garage?: { name: string } | null;
}

export function buildInspectionEvents(
  inspections: InspectionRow[],
  vehicleMap: Map<string, VehicleInfo>,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const inspection of inspections) {
    const vehicle = vehicleMap.get(inspection.vehicleId);
    if (!vehicle) continue;
    events.push({
      id: `inspection_${inspection.id}`,
      type: 'inspection',
      date: inspection.date,
      title: HISTORY_EVENT_TITLES.inspection,
      description: `בדיקה ${INSPECTION_TYPE_HEB[inspection.inspectionType] || inspection.inspectionType} ב${inspection.garage?.name || 'סדנה'}`,
      vehicleId: inspection.vehicleId,
      vehicleName: getVehicleLabel(vehicle),
      status: inspection.status,
      metadata: {
        entityId: inspection.id,
        subType: inspection.inspectionType,
        garageName: inspection.garage?.name,
        numericValue: inspection.overallScore,
      },
    });
  }
  return events;
}

interface AppointmentRow {
  id: string;
  vehicleId: string;
  date: Date;
  serviceType: string;
  status: string;
  garage?: { name: string } | null;
  notes: string | null;
}

export function buildAppointmentEvents(
  appointments: AppointmentRow[],
  vehicleMap: Map<string, VehicleInfo>,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const appointment of appointments) {
    const vehicle = vehicleMap.get(appointment.vehicleId);
    if (!vehicle) continue;
    events.push({
      id: `appointment_${appointment.id}`,
      type: 'appointment',
      date: appointment.date,
      title: HISTORY_EVENT_TITLES.appointment,
      description: `תור ל${INSPECTION_TYPE_HEB[appointment.serviceType] || appointment.serviceType} ב${appointment.garage?.name || 'סדנה'}`,
      vehicleId: appointment.vehicleId,
      vehicleName: getVehicleLabel(vehicle),
      status: appointment.status,
      metadata: {
        entityId: appointment.id,
        subType: appointment.serviceType,
        garageName: appointment.garage?.name,
        notes: appointment.notes,
      },
    });
  }
  return events;
}

interface ExpenseRow {
  id: string;
  vehicleId: string;
  date: Date;
  category: string;
  amount: number;
  description: string | null;
}

export function buildExpenseEvents(
  expenses: ExpenseRow[],
  vehicleMap: Map<string, VehicleInfo>,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const expense of expenses) {
    const vehicle = vehicleMap.get(expense.vehicleId);
    if (!vehicle) continue;
    events.push({
      id: `expense_${expense.id}`,
      type: 'expense',
      date: expense.date,
      title: HISTORY_EVENT_TITLES.expense,
      description: `${EXPENSE_CATEGORY_HEB[expense.category] || expense.category}${expense.description ? `: ${expense.description}` : ''}`,
      vehicleId: expense.vehicleId,
      vehicleName: getVehicleLabel(vehicle),
      status: 'completed',
      metadata: {
        entityId: expense.id,
        subType: expense.category,
        numericValue: expense.amount,
      },
    });
  }
  return events;
}

interface SosEventRow {
  id: string;
  vehicleId: string;
  createdAt: Date;
  eventType: string;
  status: string;
  description: string | null;
  priority: string | null;
}

export function buildSosEvents(
  sosEvents: SosEventRow[],
  vehicleMap: Map<string, VehicleInfo>,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const sosEvent of sosEvents) {
    const vehicle = vehicleMap.get(sosEvent.vehicleId);
    if (!vehicle) continue;
    events.push({
      id: `sos_${sosEvent.id}`,
      type: 'sos',
      date: sosEvent.createdAt,
      title: HISTORY_EVENT_TITLES.sos,
      description: `${SOS_TYPE_HEB[sosEvent.eventType] || sosEvent.eventType}${sosEvent.description ? `: ${sosEvent.description}` : ''}`,
      vehicleId: sosEvent.vehicleId,
      vehicleName: getVehicleLabel(vehicle),
      status: sosEvent.status,
      metadata: {
        entityId: sosEvent.id,
        subType: sosEvent.eventType,
        priority: sosEvent.priority,
      },
    });
  }
  return events;
}

// =============================================
// Sort and paginate
// =============================================

export function sortEventsByDateDesc(events: TimelineEvent[]): TimelineEvent[] {
  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}
