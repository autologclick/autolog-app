/**
 * Expense Service - Aggregation logic for expense analytics.
 * Extracts monthly summary, category totals, and validation from the route.
 */

// =============================================
// Constants
// =============================================

export const VALID_EXPENSE_CATEGORIES = [
  'fuel',
  'maintenance',
  'insurance',
  'test',
  'parking',
  'fines',
  'other',
] as const;

export type ExpenseCategory = (typeof VALID_EXPENSE_CATEGORIES)[number];

export function isValidExpenseCategory(value: string): value is ExpenseCategory {
  return (VALID_EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

// =============================================
// Types
// =============================================

export interface ExpenseAggregationRow {
  amount: number;
  date: Date;
  category: string;
}

export interface MonthlySummaryEntry {
  month: string;
  total: number;
}

export interface ExpenseAggregation {
  monthlySummary: MonthlySummaryEntry[];
  categoryTotals: Record<string, number>;
}

// =============================================
// Aggregation
// =============================================

/**
 * Compute monthly summary and per-category totals from a list of expenses.
 * Monthly summary is sorted descending (newest first).
 */
export function aggregateExpenses(expenses: ExpenseAggregationRow[]): ExpenseAggregation {
  const monthlyMap: Record<string, number> = {};
  const categoryTotals: Record<string, number> = {};

  for (const exp of expenses) {
    // Monthly bucket (YYYY-MM)
    const monthKey = new Date(exp.date).toISOString().substring(0, 7);
    monthlyMap[monthKey] = (monthlyMap[monthKey] ?? 0) + exp.amount;

    // Category bucket
    categoryTotals[exp.category] = (categoryTotals[exp.category] ?? 0) + exp.amount;
  }

  const monthlySummary = Object.entries(monthlyMap)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => b.month.localeCompare(a.month));

  return { monthlySummary, categoryTotals };
}
