import { prisma } from '@/lib/db';

/**
 * Expense ↔ Document bidirectional sync service.
 *
 * - When a user uploads an expense with a receipt image → auto-create a linked Document.
 * - When a user uploads a document and AI scan detects a price → auto-create a linked Expense.
 * - Auto-categorizes expenses based on AI scan results (document type, description keywords).
 */

// ── Auto-categorization: document type / keywords → expense category ──

const EXPENSE_CATEGORIES = ['fuel', 'charging', 'maintenance', 'insurance', 'test', 'parking', 'fines', 'other'] as const;
type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

/** Map AI document type to expense category */
const DOC_TYPE_TO_EXPENSE: Record<string, ExpenseCategory> = {
  insurance: 'insurance',
  test_certificate: 'test',
  maintenance_record: 'maintenance',
  receipt: 'other',       // receipts need keyword-based refinement
  invoice: 'other',       // invoices need keyword-based refinement
  registration: 'other',
  other: 'other',
};

/** Hebrew keyword patterns → expense category (checked in order, first match wins).
 *  IMPORTANT: charging is checked BEFORE fuel because EV charging stations sometimes
 *  contain words like "תחנה" that overlap with fuel keywords. */
const KEYWORD_RULES: Array<{ keywords: RegExp; category: ExpenseCategory }> = [
  { keywords: /טעינה|מטען|מטעין|מטעני|עמדת טעינה|תחנת טעינה|טעינת רכב|charging|EVgo|Electra|אלקטרה|Better Place|פז Power|חשמל לרכב/i, category: 'charging' },
  { keywords: /דלק|תדלוק|בנזין|סולר|גז|תחנת דלק|פז|דור אלון|סונול|אלון/i, category: 'fuel' },
  { keywords: /ביטוח|פוליסה|כלל|הראל|מגדל|הפניקס|ביטוח חובה|ביטוח מקיף/i, category: 'insurance' },
  { keywords: /טסט|מכון בדיקה|בדיקת שנתית|רישוי|test/i, category: 'test' },
  { keywords: /חניה|חנייה|חניון|אחוזת חוף|parking/i, category: 'parking' },
  { keywords: /קנס|דוח|עבירה|fine|דו"ח/i, category: 'fines' },
  { keywords: /טיפול|שמן|בלמים|צמיגים|תיקון|מוסך|פילטר|רפידות|maintenance|repair|service/i, category: 'maintenance' },
];

/**
 * Determine expense category from AI scan results.
 * Priority: document type → keyword matching on description/summary → fallback to 'other'
 */
export function categorizeExpense(params: {
  documentType?: string;
  description?: string;
  summary?: string;
  businessName?: string;
  suggestedCategory?: string;
}): ExpenseCategory {
  const { documentType, description, summary, businessName, suggestedCategory } = params;

  // 1) If AI suggested a specific category that maps directly
  if (suggestedCategory && suggestedCategory in DOC_TYPE_TO_EXPENSE) {
    const mapped = DOC_TYPE_TO_EXPENSE[suggestedCategory];
    // 'other' means we should try harder with keywords
    if (mapped !== 'other') return mapped;
  }

  // 2) Map document type (if not receipt/invoice which are generic)
  if (documentType && documentType in DOC_TYPE_TO_EXPENSE) {
    const mapped = DOC_TYPE_TO_EXPENSE[documentType];
    if (mapped !== 'other') return mapped;
  }

  // 3) Keyword search across all text fields
  const searchText = [description, summary, businessName].filter(Boolean).join(' ');
  if (searchText) {
    for (const rule of KEYWORD_RULES) {
      if (rule.keywords.test(searchText)) {
        return rule.category;
      }
    }
  }

  return 'other';
}

/** Hebrew labels for expense categories */
const CATEGORY_LABELS: Record<string, string> = {
  fuel: 'דלק',
  charging: 'טעינה',
  maintenance: 'תחזוקה',
  insurance: 'ביטוח',
  test: 'טסט',
  parking: 'חנייה',
  fines: 'קנסות',
  other: 'אחר',
};

/** Map document type to a document "type" field value */
function docTypeForExpenseCategory(category: string): string {
  switch (category) {
    case 'insurance': return 'insurance';
    case 'test': return 'test_certificate';
    default: return 'receipt';
  }
}

// ── Sync: Expense → Document ──

/**
 * When an expense is created with a receipt image, auto-create a linked Document.
 * Called from POST /api/expenses after the expense is created.
 */
export async function createDocumentFromExpense(params: {
  expenseId: string;
  vehicleId: string;
  category: string;
  amount: number;
  description?: string | null;
  date: Date;
  receiptUrl: string;
}): Promise<string | null> {
  try {
    const { expenseId, vehicleId, category, amount, description, date, receiptUrl } = params;

    const categoryLabel = CATEGORY_LABELS[category] || category;
    const title = `קבלה — ${categoryLabel} ₪${amount.toLocaleString('he-IL')}`;
    const docType = docTypeForExpenseCategory(category);

    const document = await prisma.document.create({
      data: {
        vehicleId,
        type: docType,
        title,
        description: description || `הוצאה שנוספה אוטומטית — ${categoryLabel}`,
        fileUrl: receiptUrl,
        fileType: receiptUrl.startsWith('data:image/') ? 'image/jpeg' : undefined,
        isActive: true,
      },
    });

    // Link expense to document
    await prisma.expense.update({
      where: { id: expenseId },
      data: { documentId: document.id },
    });

    return document.id;
  } catch (error) {
    console.error('Auto-create document from expense failed:', error);
    return null;
  }
}

// ── Sync: Document → Expense ──

/**
 * When a document is uploaded and AI scan detected a price, auto-create a linked Expense.
 * Called from POST /api/documents after the document is created.
 */
export async function createExpenseFromDocument(params: {
  documentId: string;
  vehicleId: string;
  totalAmount: number;
  date?: string | null;
  description?: string | null;
  documentType?: string;
  summary?: string;
  businessName?: string;
  suggestedCategory?: string;
  fileUrl?: string | null;
}): Promise<string | null> {
  try {
    const {
      documentId, vehicleId, totalAmount, date,
      description, documentType, summary, businessName, suggestedCategory, fileUrl,
    } = params;

    // Auto-categorize
    const category = categorizeExpense({
      documentType,
      description: description || undefined,
      summary: summary || undefined,
      businessName: businessName || undefined,
      suggestedCategory: suggestedCategory || undefined,
    });

    const expenseDate = date ? new Date(date) : new Date();
    if (isNaN(expenseDate.getTime())) {
      return null;
    }

    const expense = await prisma.expense.create({
      data: {
        vehicleId,
        category,
        amount: totalAmount,
        description: description || summary || null,
        date: expenseDate,
        receiptUrl: fileUrl || null,
        documentId,
      },
    });

    return expense.id;
  } catch (error) {
    console.error('Auto-create expense from document failed:', error);
    return null;
  }
}
