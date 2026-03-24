// ============================================================
// User & Auth Types
// ============================================================
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'user' | 'admin' | 'garage_owner';
  avatarUrl?: string;
  licenseNumber?: string;
  idNumber?: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================================
// Vehicle Types
// ============================================================
export interface Vehicle {
  id: string;
  userId: string;
  nickname: string;
  manufacturer: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  vin?: string;
  testExpiryDate?: string;
  testStatus: 'valid' | 'expiring' | 'expired';
  insuranceExpiry?: string;
  insuranceStatus: 'valid' | 'expiring' | 'expired';
  registrationDate?: string;
  isPrimary: boolean;
  mileage?: number;
  fuelType?: string;
  _count?: { inspections: number; sosEvents: number; expenses: number };
  drivers?: VehicleDriver[];
}

export interface VehicleDriver {
  id: string;
  driverName: string;
  driverPhone?: string;
  driverLicense?: string;
  relationship?: string;
  isActive: boolean;
}

// ============================================================
// Garage Types
// ============================================================
export interface Garage {
  id: string;
  name: string;
  address?: string;
  city: string;
  phone?: string;
  email?: string;
  description?: string;
  rating: number;
  reviewCount: number;
  services?: string;
  isPartner: boolean;
  _count?: { inspections: number; reviews: number; appointments: number };
}

// ============================================================
// Inspection Types
// ============================================================
export interface Inspection {
  id: string;
  vehicleId: string;
  garageId: string;
  mechanicName?: string;
  inspectionType: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  overallScore?: number;
  summary?: string;
  recommendations?: string;
  cost?: number;
  vehicle?: { nickname: string; model: string; licensePlate: string };
  garage?: { name: string; city: string };
  items?: InspectionItem[];
}

export interface InspectionItem {
  id: string;
  category: string;
  itemName: string;
  status: 'ok' | 'warning' | 'critical';
  notes?: string;
  score?: number;
}

// ============================================================
// Appointment Types
// ============================================================
export interface Appointment {
  id: string;
  userId: string;
  vehicleId: string;
  garageId: string;
  serviceType: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  vehicle?: Vehicle;
  garage?: Garage;
}

// ============================================================
// SOS Types
// ============================================================
export interface SosEvent {
  id: string;
  userId: string;
  vehicleId: string;
  eventType: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  resolvedAt?: string;
  createdAt: string;
  vehicle?: { nickname: string; licensePlate: string };
  user?: { fullName: string; phone: string };
}

// ============================================================
// Club Benefits
// ============================================================
export interface ClubBenefit {
  id: string;
  name: string;
  category: string;
  discount: string;
  description?: string;
  partnerName?: string;
  icon?: string;
  expiryDate?: string;
  isActive: boolean;
}

// ============================================================
// Notification
// ============================================================
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ============================================================
// Admin Stats
// ============================================================
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalVehicles: number;
  totalGarages: number;
  activeGarages: number;
  totalInspections: number;
  inspectionsThisMonth: number;
  openSosEvents: number;
  totalSosEvents: number;
  pendingAppointments: number;
  expiredTests: number;
  expiringTests: number;
}
