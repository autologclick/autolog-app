/**
 * Inspection Service - Helpers for building inspection data and auto-generating items.
 * Extracted from the inspections route to keep route handlers thin.
 */

import { Prisma } from '@prisma/client';
import {
  TIRE_NAMES_HEB,
  LIGHT_NAMES_HEB,
  FLUID_NAMES_HEB,
  PRE_TEST_NAMES_HEB,
} from '@/lib/constants/translations';

// =============================================
// Types
// =============================================

/** Shape returned by comprehensiveInspectionSchema after validation. */
export interface ValidatedInspectionInput {
  vehicleId?: string;
  manualVehicle?: {
    licensePlate: string;
    manufacturer?: string;
    model?: string;
    year?: number;
    color?: string;
  };
  appointmentId?: string;
  inspectionType: string;
  mechanicName?: string;
  overallScore?: number;
  mileage?: number;
  engineNumber?: string;
  engineVerified?: boolean;
  exteriorPhotos?: string[];
  interiorPhotos?: string[];
  tiresData?: Record<string, string>;
  lightsData?: Record<string, string>;
  frontAxle?: unknown;
  steeringData?: unknown;
  shocksData?: unknown;
  bodyData?: unknown;
  batteryData?: unknown;
  fluidsData?: Record<string, string>;
  interiorSystems?: unknown;
  windowsData?: unknown;
  engineIssues?: unknown;
  gearboxIssues?: unknown;
  brakingSystem?: unknown;
  summary?: string;
  recommendations?: unknown;
  notes?: unknown;
  detailedScores?: unknown;
  customerName?: string;
  customerIdNumber?: string;
  customerSignature?: string;
  preTestChecklist?: Record<string, boolean>;
  preTestNotes?: string;
  serviceItems?: unknown;
  workPerformed?: Array<{ item: string; action: string; notes?: string }>;
  items?: Array<{ category: string; itemName: string; status: string; notes?: string; score?: number }>;
}

export interface InspectionItemInput {
  inspectionId: string;
  category: string;
  itemName: string;
  status: string;
  notes: string | null;
  score: number | null;
}

// =============================================
// Helpers
// =============================================

/** Safely stringify a value to JSON, returning null if falsy. */
function jsonOrNull(value: unknown): string | null {
  return value ? JSON.stringify(value) : null;
}

/**
 * Build the Prisma create-input for an Inspection record from validated form data.
 */
export function buildInspectionData(
  data: ValidatedInspectionInput,
  vehicleId: string,
  garageId: string,
): Prisma.InspectionUncheckedCreateInput {
  return {
    vehicleId,
    garageId,
    appointmentId: data.appointmentId || null,
    inspectionType: data.inspectionType,
    mechanicName: data.mechanicName || null,
    date: new Date(),
    status: 'completed',
    overallScore: data.overallScore ?? null,
    mileage: data.mileage ?? null,
    engineNumber: data.engineNumber || null,
    engineVerified: data.engineVerified ?? false,

    // Photos as JSON strings
    exteriorPhotos: jsonOrNull(data.exteriorPhotos),
    interiorPhotos: jsonOrNull(data.interiorPhotos),

    // System checks as JSON strings
    tiresData: jsonOrNull(data.tiresData),
    lightsData: jsonOrNull(data.lightsData),
    frontAxle: jsonOrNull(data.frontAxle),
    steeringData: jsonOrNull(data.steeringData),
    shocksData: jsonOrNull(data.shocksData),
    bodyData: jsonOrNull(data.bodyData),
    batteryData: jsonOrNull(data.batteryData),
    fluidsData: jsonOrNull(data.fluidsData),
    interiorSystems: jsonOrNull(data.interiorSystems),
    windowsData: jsonOrNull(data.windowsData),
    engineIssues: jsonOrNull(data.engineIssues),
    gearboxIssues: jsonOrNull(data.gearboxIssues),
    brakingSystem: jsonOrNull(data.brakingSystem),

    // Summary & results
    summary: data.summary || null,
    recommendations: jsonOrNull(data.recommendations),
    notes: jsonOrNull(data.notes),
    detailedScores: jsonOrNull(data.detailedScores),

    // Customer signature
    customerName: data.customerName || null,
    customerIdNumber: data.customerIdNumber || null,
    customerSignature: data.customerSignature || null,
    signedAt: data.customerSignature ? new Date() : null,

    // Pre-test fields
    preTestChecklist: jsonOrNull(data.preTestChecklist),
    preTestNotes: data.preTestNotes || null,
    serviceItems: jsonOrNull(data.serviceItems),
    workPerformed: jsonOrNull(data.workPerformed),
  };
}

/**
 * Auto-generate InspectionItem rows from the structured system-check data
 * (tires, lights, fluids, pre-test checklist, work performed).
 */
export function generateAutoInspectionItems(
  inspectionId: string,
  data: ValidatedInspectionInput,
): InspectionItemInput[] {
  const items: InspectionItemInput[] = [];

  // Tires
  if (data.tiresData) {
    for (const [key, val] of Object.entries(data.tiresData)) {
      if (val) {
        items.push({ inspectionId, category: 'tires', itemName: TIRE_NAMES_HEB[key] || key, status: val, notes: null, score: null });
      }
    }
  }

  // Lights
  if (data.lightsData) {
    for (const [key, val] of Object.entries(data.lightsData)) {
      if (val) {
        items.push({ inspectionId, category: 'electrical', itemName: LIGHT_NAMES_HEB[key] || key, status: val, notes: null, score: null });
      }
    }
  }

  // Fluids
  if (data.fluidsData) {
    for (const [key, val] of Object.entries(data.fluidsData)) {
      if (val) {
        items.push({ inspectionId, category: 'fluids', itemName: FLUID_NAMES_HEB[key] || key, status: val, notes: null, score: null });
      }
    }
  }

  // Pre-test checklist
  if (data.preTestChecklist) {
    for (const [key, passed] of Object.entries(data.preTestChecklist)) {
      items.push({
        inspectionId,
        category: 'pre_test',
        itemName: PRE_TEST_NAMES_HEB[key] || key,
        status: passed ? 'ok' : 'critical',
        notes: null,
        score: passed ? 100 : 0,
      });
    }
  }

  // Work performed
  if (data.workPerformed && data.workPerformed.length > 0) {
    for (const work of data.workPerformed) {
      items.push({
        inspectionId,
        category: 'work_performed',
        itemName: work.item,
        status: work.action,
        notes: work.notes || null,
        score: null,
      });
    }
  }

  return items;
}
