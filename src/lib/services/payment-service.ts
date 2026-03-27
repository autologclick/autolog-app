import prisma from '@/lib/db';

// =============================================
// Payment aggregation types
// =============================================

export interface Payment {
  id: string;
  date: string;
  garageName: string;
  serviceType: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue';
  source: 'inspection' | 'appointment' | 'expense';
  vehicleNickname?: string;
  description?: string;
}

export interface PaymentSummary {
  totalThisMonth: number;
  totalThisYear: number;
  averageMonthlySpend: number;
  payments: Payment[];
}

// =============================================
// Cost estimation
// =============================================

const DEFAULT_SERVICE_COSTS: Record<string, number> = {
  inspection: 350,
  maintenance: 450,
  repair: 600,
  test_prep: 280,
};

const DEFAULT_COST = 400;

export function estimateAppointmentCost(serviceType: string): number {
  return DEFAULT_SERVICE_COSTS[serviceType] || DEFAULT_COST;
}

// =============================================
// Data transformers
// =============================================

interface InspectionRow {
  id: string;
  date: Date;
  cost: number | null;
  vehicleId: string;
  garage: { name: string };
  inspectionType: string | null;
}

interface AppointmentRow {
  id: string;
  date: Date;
  vehicleId: string;
  serviceType: string;
  status: string;
  notes: string | null;
  completionNotes: string | null;
  completedAt: Date | null;
  garage: { name: string };
}

interface ExpenseRow {
  id: string;
  date: Date;
  amount: number;
  category: string;
  description: string | null;
  vehicleId: string;
}

function inspectionsToPayments(
  inspections: InspectionRow[],
  vehicleNicknameMap: Record<string, string>,
): Payment[] {
  return inspections
    .filter((i) => i.cost !== null && i.cost > 0)
    .map((inspection) => ({
      id: `inspection-${inspection.id}`,
      date: inspection.date.toISOString().split('T')[0],
      garageName: inspection.garage.name,
      serviceType: inspection.inspectionType || 'inspection',
      amount: inspection.cost as number,
      currency: '₪',
      status: 'paid' as const,
      source: 'inspection' as const,
      vehicleNickname: vehicleNicknameMap[inspection.vehicleId],
      description: `בדיקה ${inspection.inspectionType || 'מלאה'}`,
    }));
}

function appointmentsToPayments(
  appointments: AppointmentRow[],
  vehicleNicknameMap: Record<string, string>,
): Payment[] {
  return appointments.map((appointment) => ({
    id: `appointment-${appointment.id}`,
    date: (appointment.completedAt || appointment.date).toISOString().split('T')[0],
    garageName: appointment.garage.name,
    serviceType: appointment.serviceType,
    amount: estimateAppointmentCost(appointment.serviceType),
    currency: '₪',
    status: appointment.status === 'completed' ? ('paid' as const) : ('pending' as const),
    source: 'appointment' as const,
    vehicleNickname: vehicleNicknameMap[appointment.vehicleId],
    description: appointment.completionNotes || appointment.notes || 'שירות מוסך',
  }));
}

function expensesToPayments(
  expenses: ExpenseRow[],
  vehicleNicknameMap: Record<string, string>,
): Payment[] {
  return expenses.map((expense) => ({
    id: `expense-${expense.id}`,
    date: expense.date.toISOString().split('T')[0],
    garageName: 'הוצאה כללית',
    serviceType: expense.category,
    amount: expense.amount,
    currency: '₪',
    status: 'paid' as const,
    source: 'expense' as const,
    vehicleNickname: vehicleNicknameMap[expense.vehicleId],
    description: expense.description || undefined,
  }));
}

// =============================================
// Summary calculations
// =============================================

function calculateMonthlySummary(
  payments: Payment[],
  currentYear: number,
  currentMonth: number,
): { totalThisMonth: number; totalThisYear: number; averageMonthlySpend: number } {
  const totalThisMonth = payments
    .filter((p) => {
      const d = new Date(p.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const totalThisYear = payments
    .filter((p) => new Date(p.date).getFullYear() === currentYear)
    .reduce((sum, p) => sum + p.amount, 0);

  // Average monthly spend over the last 12 months
  const monthlySpends: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlySpends[monthKey] = payments
      .filter((p) => p.date.startsWith(monthKey))
      .reduce((sum, payment) => sum + payment.amount, 0);
  }

  const monthsWithData = Object.values(monthlySpends).filter((v) => v > 0).length || 1;
  const averageMonthlySpend =
    Object.values(monthlySpends).reduce((a, b) => a + b, 0) / Math.max(monthsWithData, 1);

  return { totalThisMonth, totalThisYear, averageMonthlySpend };
}

// =============================================
// Main service function
// =============================================

export async function aggregateUserPayments(userId: string): Promise<PaymentSummary> {
  // Get all user vehicles
  const userVehicles = await prisma.vehicle.findMany({
    where: { userId },
    select: { id: true, nickname: true },
  });

  if (userVehicles.length === 0) {
    return { totalThisMonth: 0, totalThisYear: 0, averageMonthlySpend: 0, payments: [] };
  }

  const vehicleIds = userVehicles.map((v) => v.id);
  const vehicleNicknameMap = Object.fromEntries(userVehicles.map((v) => [v.id, v.nickname]));

  // Fetch all data sources in parallel
  const [inspections, appointments, expenses] = await Promise.all([
    prisma.inspection.findMany({
      where: { vehicleId: { in: vehicleIds }, cost: { not: null } },
      select: {
        id: true, date: true, cost: true, vehicleId: true,
        garage: { select: { name: true } },
        inspectionType: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        userId,
        vehicleId: { in: vehicleIds },
        status: { in: ['completed', 'in_progress'] },
      },
      select: {
        id: true, date: true, vehicleId: true, serviceType: true,
        status: true, notes: true, completionNotes: true, completedAt: true,
        garage: { select: { name: true } },
      },
    }),
    prisma.expense.findMany({
      where: { vehicleId: { in: vehicleIds } },
      select: {
        id: true, date: true, amount: true, category: true,
        description: true, vehicleId: true,
      },
    }),
  ]);

  // Transform all sources into unified Payment[]
  const payments: Payment[] = [
    ...inspectionsToPayments(inspections as InspectionRow[], vehicleNicknameMap),
    ...appointmentsToPayments(appointments as AppointmentRow[], vehicleNicknameMap),
    ...expensesToPayments(expenses as ExpenseRow[], vehicleNicknameMap),
  ];

  // Sort by date descending
  payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate summaries
  const now = new Date();
  const summary = calculateMonthlySummary(payments, now.getFullYear(), now.getMonth());

  return { ...summary, payments };
}
