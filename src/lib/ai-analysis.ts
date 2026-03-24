/**
 * AutoLog AI Analysis Engine
 *
 * Smart vehicle analysis using algorithmic intelligence.
 * Analyzes inspection data, maintenance history, expenses, and documents
 * to provide actionable insights and predictions.
 */

// ====== Types ======

export interface VehicleHealthReport {
  overallScore: number; // 0-100
  status: 'excellent' | 'good' | 'attention' | 'warning' | 'critical';
  statusLabel: string;
  insights: AIInsight[];
  predictions: AIPrediction[];
  savingsTips: SavingsTip[];
  nextActions: NextAction[];
}

export interface AIInsight {
  id: string;
  type: 'positive' | 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  category: string;
}

export interface AIPrediction {
  id: string;
  title: string;
  description: string;
  estimatedDate: string;
  confidence: 'high' | 'medium' | 'low';
  estimatedCost?: string;
}

export interface SavingsTip {
  id: string;
  title: string;
  description: string;
  potentialSaving: string;
}

export interface NextAction {
  id: string;
  title: string;
  urgency: 'immediate' | 'soon' | 'planned';
  description: string;
}

export interface InspectionAnalysis {
  summary: string;
  keyFindings: string[];
  urgentItems: string[];
  positiveItems: string[];
  estimatedRepairCost: string;
  overallAssessment: string;
}

export interface ExpenseAnalysis {
  monthlyAverage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  trendLabel: string;
  topCategory: string;
  insights: string[];
  forecast: string;
}

// ====== Helpers ======

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

// ====== Vehicle Health Analysis ======

interface VehicleData {
  id: string;
  nickname: string;
  manufacturer?: string;
  model: string;
  year?: number;
  mileage?: number;
  fuelType?: string;
  testExpiryDate?: string;
  testStatus?: string;
  insuranceExpiry?: string;
  insuranceStatus?: string;
  inspections: Array<{
    id: string;
    date: string;
    overallScore?: number;
    status: string;
    inspectionType: string;
    items?: Array<{ status: string; category: string; itemName: string }>;
  }>;
  appointments: Array<{
    id: string;
    date: string;
    serviceType: string;
    status: string;
  }>;
  expenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: string;
  }>;
}

export function analyzeVehicleHealth(vehicle: VehicleData): VehicleHealthReport {
  const insights: AIInsight[] = [];
  const predictions: AIPrediction[] = [];
  const savingsTips: SavingsTip[] = [];
  const nextActions: NextAction[] = [];
  let scoreDeductions = 0;

  // 1. Document validity analysis
  const testDays = daysUntil(vehicle.testExpiryDate);
  const insuranceDays = daysUntil(vehicle.insuranceExpiry);

  if (testDays !== null) {
    if (testDays < 0) {
      scoreDeductions += 25;
      insights.push({
        id: 'test-expired',
        type: 'critical',
        title: 'הטסט פג תוקף',
        description: `הטסט פג לפני ${Math.abs(testDays)} ימים. יש לחדש בהקדם כדי לנסוע בחוקיות.`,
        category: 'מסמכים',
      });
      nextActions.push({
        id: 'renew-test',
        title: 'חידוש טסט',
        urgency: 'immediate',
        description: 'קבע תור לטסט בהקדם האפשרי',
      });
    } else if (testDays <= 30) {
      scoreDeductions += 10;
      insights.push({
        id: 'test-expiring',
        type: 'warning',
        title: 'הטסט עומד לפוג',
        description: `נותרו ${testDays} ימים לתוקף הטסט. מומלץ לקבוע תור מוקדם.`,
        category: 'מסמכים',
      });
      nextActions.push({
        id: 'schedule-test',
        title: 'קביעת תור לטסט',
        urgency: 'soon',
        description: `הטסט יפוג בעוד ${testDays} ימים`,
      });
    } else {
      insights.push({
        id: 'test-valid',
        type: 'positive',
        title: 'הטסט בתוקף',
        description: `הטסט תקף לעוד ${testDays} ימים.`,
        category: 'מסמכים',
      });
    }
  }

  if (insuranceDays !== null) {
    if (insuranceDays < 0) {
      scoreDeductions += 25;
      insights.push({
        id: 'insurance-expired',
        type: 'critical',
        title: 'הביטוח פג תוקף',
        description: `הביטוח פג לפני ${Math.abs(insuranceDays)} ימים. נסיעה ללא ביטוח היא עבירה חמורה.`,
        category: 'מסמכים',
      });
      nextActions.push({
        id: 'renew-insurance',
        title: 'חידוש ביטוח',
        urgency: 'immediate',
        description: 'חדש את הביטוח מיידית',
      });
    } else if (insuranceDays <= 30) {
      scoreDeductions += 10;
      insights.push({
        id: 'insurance-expiring',
        type: 'warning',
        title: 'הביטוח עומד לפוג',
        description: `נותרו ${insuranceDays} ימים לביטוח. השווה הצעות מחיר לחיסכון.`,
        category: 'מסמכים',
      });
      savingsTips.push({
        id: 'compare-insurance',
        title: 'השוואת ביטוחים',
        description: 'השווה הצעות מחיר מ-3 חברות ביטוח לפחות לפני החידוש',
        potentialSaving: '₪500-2,000 בשנה',
      });
    }
  }

  // 2. Inspection history analysis
  const lastInspection = vehicle.inspections[0];
  if (lastInspection) {
    const daysSinceInspection = daysSince(lastInspection.date);
    const score = lastInspection.overallScore || 0;

    if (score < 50) {
      scoreDeductions += 20;
      insights.push({
        id: 'low-inspection-score',
        type: 'critical',
        title: 'ציון בדיקה נמוך',
        description: `הבדיקה האחרונה קיבלה ציון ${score}/100. נדרש טיפול בממצאים.`,
        category: 'בדיקות',
      });
    } else if (score >= 80) {
      insights.push({
        id: 'good-inspection',
        type: 'positive',
        title: 'הרכב במצב טוב',
        description: `הבדיקה האחרונה קיבלה ציון ${score}/100. הרכב במצב תקין.`,
        category: 'בדיקות',
      });
    }

    if (daysSinceInspection && daysSinceInspection > 180) {
      scoreDeductions += 10;
      insights.push({
        id: 'old-inspection',
        type: 'warning',
        title: 'לא בוצעה בדיקה זמן רב',
        description: `עברו ${daysSinceInspection} ימים מהבדיקה האחרונה. מומלץ לבצע בדיקה כל 6 חודשים.`,
        category: 'בדיקות',
      });
      nextActions.push({
        id: 'schedule-inspection',
        title: 'קביעת בדיקה',
        urgency: 'soon',
        description: 'מומלץ לבצע בדיקה שנתית/חצי שנתית',
      });
    }

    // Check inspection items for problem patterns
    if (lastInspection.items) {
      const criticalItems = lastInspection.items.filter(i =>
        ['critical', 'not_ok', 'failed', 'replace'].includes(i.status)
      );
      const wornItems = lastInspection.items.filter(i =>
        ['worn', 'warning', 'leaking', 'dry'].includes(i.status)
      );

      if (criticalItems.length > 0) {
        insights.push({
          id: 'critical-items',
          type: 'critical',
          title: `${criticalItems.length} פריטים קריטיים`,
          description: `נמצאו ${criticalItems.length} פריטים שדורשים טיפול מיידי: ${criticalItems.map(i => i.itemName).join(', ')}`,
          category: 'בדיקות',
        });
      }

      if (wornItems.length > 0) {
        insights.push({
          id: 'worn-items',
          type: 'warning',
          title: `${wornItems.length} פריטים בשחיקה`,
          description: `${wornItems.length} פריטים נמצאים במצב של שחיקה ויש לטפל בהם בקרוב.`,
          category: 'בדיקות',
        });
      }
    }
  } else {
    scoreDeductions += 15;
    insights.push({
      id: 'no-inspection',
      type: 'warning',
      title: 'לא בוצעה בדיקה',
      description: 'לא נמצאו בדיקות לרכב זה. מומלץ לבצע בדיקה מקיפה.',
      category: 'בדיקות',
    });
    nextActions.push({
      id: 'first-inspection',
      title: 'בדיקה ראשונה',
      urgency: 'soon',
      description: 'קבע בדיקה מקיפה לרכב',
    });
  }

  // 3. Mileage-based predictions
  if (vehicle.mileage && vehicle.year) {
    const age = new Date().getFullYear() - vehicle.year;
    const avgKmPerYear = age > 0 ? vehicle.mileage / age : vehicle.mileage;

    // Oil change prediction (every ~15,000 km)
    const kmSinceOilChange = vehicle.mileage % 15000;
    const kmToOilChange = 15000 - kmSinceOilChange;
    const monthsToOilChange = Math.round((kmToOilChange / avgKmPerYear) * 12);

    if (kmToOilChange < 2000) {
      predictions.push({
        id: 'oil-change',
        title: 'החלפת שמן קרובה',
        description: `בעוד כ-${kmToOilChange.toLocaleString()} ק"מ מומלץ להחליף שמן.`,
        estimatedDate: `בעוד ${monthsToOilChange > 0 ? monthsToOilChange : 1} חודשים`,
        confidence: 'medium',
        estimatedCost: '₪250-450',
      });
    }

    // Tire change prediction (every ~50,000 km)
    const kmSinceTires = vehicle.mileage % 50000;
    const kmToTires = 50000 - kmSinceTires;

    if (kmToTires < 10000) {
      predictions.push({
        id: 'tire-change',
        title: 'החלפת צמיגים צפויה',
        description: `בהתבסס על הקילומטראז׳, ייתכן שצריך להחליף צמיגים בקרוב.`,
        estimatedDate: `בעוד כ-${Math.round((kmToTires / avgKmPerYear) * 12)} חודשים`,
        confidence: 'low',
        estimatedCost: '₪1,500-3,000',
      });
    }

    // Test prediction based on kilometers
    if (avgKmPerYear > 20000) {
      savingsTips.push({
        id: 'high-mileage',
        title: 'נסיעה רבה בשנה',
        description: `הרכב עובר כ-${Math.round(avgKmPerYear / 1000) * 1000} ק"מ בשנה. מומלץ לשקול ביטוח קילומטראז' ולעשות טיפולים בתדירות גבוהה יותר.`,
        potentialSaving: '₪200-500 בשנה',
      });
    }
  }

  // 4. Expense analysis
  if (vehicle.expenses.length > 0) {
    const totalExpenses = vehicle.expenses.reduce((sum, e) => sum + e.amount, 0);
    const avgMonthly = totalExpenses / Math.max(1, getMonthSpan(vehicle.expenses));

    if (avgMonthly > 1500) {
      savingsTips.push({
        id: 'high-expenses',
        title: 'הוצאות גבוהות',
        description: `ממוצע הוצאות חודשי של ₪${Math.round(avgMonthly)} הוא מעל הממוצע. בדוק אפשרויות חיסכון.`,
        potentialSaving: '₪300-800 בחודש',
      });
    }

    // Find top expense category
    const categoryTotals: Record<string, number> = {};
    vehicle.expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    if (topCategory && topCategory[0] === 'fuel') {
      savingsTips.push({
        id: 'fuel-savings',
        title: 'חיסכון בדלק',
        description: 'דלק הוא ההוצאה הגדולה ביותר. שקול נהיגה חסכונית, בדיקת לחץ אוויר בצמיגים, וניקוי פילטר אוויר.',
        potentialSaving: '₪200-400 בחודש',
      });
    }
  }

  // 5. Upcoming appointments
  const upcomingAppointments = vehicle.appointments.filter(a =>
    a.status === 'pending' || a.status === 'confirmed'
  );
  if (upcomingAppointments.length > 0) {
    insights.push({
      id: 'upcoming-appointments',
      type: 'info',
      title: `${upcomingAppointments.length} תורים קרובים`,
      description: `יש לך ${upcomingAppointments.length} תורים קבועים. אל תשכח להגיע!`,
      category: 'תורים',
    });
  }

  // Calculate final score
  const baseScore = lastInspection?.overallScore || 70;
  const overallScore = Math.max(0, Math.min(100, baseScore - scoreDeductions));

  // Determine status
  let status: VehicleHealthReport['status'];
  let statusLabel: string;
  if (overallScore >= 85) { status = 'excellent'; statusLabel = 'מצוין'; }
  else if (overallScore >= 70) { status = 'good'; statusLabel = 'טוב'; }
  else if (overallScore >= 55) { status = 'attention'; statusLabel = 'דורש תשומת לב'; }
  else if (overallScore >= 35) { status = 'warning'; statusLabel = 'אזהרה'; }
  else { status = 'critical'; statusLabel = 'קריטי'; }

  return {
    overallScore,
    status,
    statusLabel,
    insights: insights.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2, positive: 3 };
      return (order[a.type] || 3) - (order[b.type] || 3);
    }),
    predictions,
    savingsTips,
    nextActions: nextActions.sort((a, b) => {
      const order = { immediate: 0, soon: 1, planned: 2 };
      return (order[a.urgency] || 2) - (order[b.urgency] || 2);
    }),
  };
}

// ====== Inspection Analysis ======

interface InspectionData {
  inspectionType: string;
  overallScore: number;
  items: Array<{
    category: string;
    itemName: string;
    status: string;
    notes?: string;
    score?: number;
  }>;
  recommendations?: Array<{ text: string; urgency?: string; estimatedCost?: string }>;
  vehicle: { manufacturer?: string; model: string; year?: number; mileage?: number };
  workPerformed?: Array<{ item: string; action: string; cost?: number }>;
}

export function analyzeInspection(inspection: InspectionData): InspectionAnalysis {
  const items = inspection.items || [];

  const okItems = items.filter(i => i.status === 'ok');
  const criticalItems = items.filter(i => ['critical', 'not_ok', 'failed', 'replace'].includes(i.status));
  const warnItems = items.filter(i => ['worn', 'warning', 'leaking', 'dry', 'low', 'dirty'].includes(i.status));

  const score = inspection.overallScore;
  const totalChecked = items.length;
  const passRate = totalChecked > 0 ? Math.round((okItems.length / totalChecked) * 100) : 0;

  // Generate key findings
  const keyFindings: string[] = [];

  if (totalChecked > 0) {
    keyFindings.push(`נבדקו ${totalChecked} פריטים, ${okItems.length} תקינים (${passRate}%)`);
  }

  if (criticalItems.length > 0) {
    keyFindings.push(`${criticalItems.length} פריטים קריטיים שדורשים טיפול מיידי`);
  }

  if (warnItems.length > 0) {
    keyFindings.push(`${warnItems.length} פריטים במצב אזהרה שיש לעקוב אחריהם`);
  }

  if (inspection.workPerformed && inspection.workPerformed.length > 0) {
    const totalWorkCost = inspection.workPerformed.reduce((sum, w) => sum + (w.cost || 0), 0);
    keyFindings.push(`בוצעו ${inspection.workPerformed.length} עבודות${totalWorkCost > 0 ? ` בעלות כוללת של ₪${totalWorkCost.toLocaleString()}` : ''}`);
  }

  // Urgent items
  const urgentItems = criticalItems.map(i => i.itemName);

  // Positive items
  const positiveItems: string[] = [];
  if (okItems.length > totalChecked * 0.8) {
    positiveItems.push('רוב הפריטים נמצאו תקינים');
  }
  if (items.some(i => i.category === 'brakes' && i.status === 'ok')) {
    positiveItems.push('מערכת הבלימה תקינה');
  }
  if (items.some(i => i.category === 'tires' && i.status === 'ok')) {
    positiveItems.push('הצמיגים במצב טוב');
  }
  if (items.some(i => i.category === 'lights' && i.status === 'ok')) {
    positiveItems.push('מערכת התאורה תקינה');
  }

  // Estimated repair cost
  let estimatedCost = '₪0';
  if (inspection.recommendations) {
    const costs = inspection.recommendations
      .map(r => parseInt(r.estimatedCost?.replace(/[^\d]/g, '') || '0'))
      .filter(c => c > 0);
    if (costs.length > 0) {
      const total = costs.reduce((a, b) => a + b, 0);
      estimatedCost = `₪${total.toLocaleString()}`;
    }
  } else if (criticalItems.length > 0) {
    estimatedCost = `₪${(criticalItems.length * 500).toLocaleString()} (הערכה)`;
  }

  // Overall assessment
  let overallAssessment: string;
  if (score >= 85) {
    overallAssessment = `הרכב ${inspection.vehicle.manufacturer || ''} ${inspection.vehicle.model} במצב מצוין. ציון ${score}/100 מעיד על תחזוקה טובה. המשך לשמור על לוח זמנים קבוע לטיפולים.`;
  } else if (score >= 65) {
    overallAssessment = `הרכב במצב סביר עם ציון ${score}/100. ישנם מספר נושאים שדורשים תשומת לב${warnItems.length > 0 ? `, כולל ${warnItems.length} פריטים במצב אזהרה` : ''}. מומלץ לטפל בממצאים בהקדם.`;
  } else if (score >= 40) {
    overallAssessment = `הרכב דורש תשומת לב עם ציון ${score}/100. נמצאו ${criticalItems.length} בעיות קריטיות ו-${warnItems.length} אזהרות. מומלץ מאוד לתקן את הפריטים הקריטיים לפני המשך נסיעה.`;
  } else {
    overallAssessment = `הרכב במצב מדאיג עם ציון ${score}/100. נמצאו ${criticalItems.length} בעיות חמורות. יש לטפל בכל הממצאים הקריטיים מיידית ולא לנסוע עד לתיקון.`;
  }

  // Generate summary
  const summaryParts: string[] = [];
  summaryParts.push(overallAssessment);

  if (urgentItems.length > 0) {
    summaryParts.push(`פריטים דחופים: ${urgentItems.slice(0, 3).join(', ')}${urgentItems.length > 3 ? ` ועוד ${urgentItems.length - 3}` : ''}.`);
  }

  if (positiveItems.length > 0) {
    summaryParts.push(`נקודות חיוביות: ${positiveItems.slice(0, 3).join(', ')}.`);
  }

  return {
    summary: summaryParts.join('\n\n'),
    keyFindings,
    urgentItems,
    positiveItems,
    estimatedRepairCost: estimatedCost,
    overallAssessment,
  };
}

// ====== Expense Analysis ======

interface ExpenseData {
  amount: number;
  category: string;
  date: string;
  description?: string;
}

export function analyzeExpenses(expenses: ExpenseData[]): ExpenseAnalysis {
  if (expenses.length === 0) {
    return {
      monthlyAverage: 0,
      trend: 'stable',
      trendLabel: 'אין מספיק נתונים',
      topCategory: '',
      insights: ['אין הוצאות מתועדות עדיין. התחל לתעד הוצאות כדי לקבל תובנות חכמות.'],
      forecast: 'אין מספיק נתונים לתחזית',
    };
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthSpan = Math.max(1, getMonthSpan(expenses));
  const monthlyAverage = Math.round(total / monthSpan);

  // Trend analysis
  const sortedByDate = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const midpoint = Math.floor(sortedByDate.length / 2);
  const firstHalf = sortedByDate.slice(0, midpoint);
  const secondHalf = sortedByDate.slice(midpoint);

  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, e) => s + e.amount, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, e) => s + e.amount, 0) / secondHalf.length : 0;

  let trend: ExpenseAnalysis['trend'];
  let trendLabel: string;
  if (secondAvg > firstAvg * 1.15) { trend = 'increasing'; trendLabel = 'מגמת עלייה'; }
  else if (secondAvg < firstAvg * 0.85) { trend = 'decreasing'; trendLabel = 'מגמת ירידה'; }
  else { trend = 'stable'; trendLabel = 'יציב'; }

  // Top category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const topCategory = topCat ? categoryLabelHe(topCat[0]) : '';

  // Generate insights
  const insights: string[] = [];

  insights.push(`סה"כ הוצאות: ₪${total.toLocaleString()} על פני ${monthSpan} חודשים`);

  if (topCat) {
    const topPercent = Math.round((topCat[1] / total) * 100);
    insights.push(`הקטגוריה הגדולה ביותר: ${categoryLabelHe(topCat[0])} (${topPercent}% מההוצאות)`);
  }

  if (trend === 'increasing') {
    insights.push('ההוצאות במגמת עלייה. מומלץ לבדוק מה גורם לעלייה.');
  } else if (trend === 'decreasing') {
    insights.push('כל הכבוד! ההוצאות במגמת ירידה.');
  }

  // Forecast
  const forecast = `בהתבסס על ההיסטוריה, ההוצאה הצפויה ל-3 חודשים הקרובים: ₪${(monthlyAverage * 3).toLocaleString()}`;

  return {
    monthlyAverage,
    trend,
    trendLabel,
    topCategory,
    insights,
    forecast,
  };
}

// ====== Utility Functions ======

function getMonthSpan(items: Array<{ date: string }>): number {
  if (items.length === 0) return 1;
  const dates = items.map(i => new Date(i.date).getTime());
  const min = Math.min(...dates);
  const max = Math.max(...dates);
  return Math.max(1, Math.round((max - min) / (1000 * 60 * 60 * 24 * 30)));
}

function categoryLabelHe(c: string): string {
  const map: Record<string, string> = {
    fuel: 'דלק', insurance: 'ביטוח', maintenance: 'תחזוקה', repair: 'תיקון',
    parking: 'חניה', toll: 'אגרה', test: 'טסט', fine: 'קנס', wash: 'שטיפה',
    other: 'אחר', tires: 'צמיגים', lights: 'תאורה', brakes: 'בלמים',
    engine: 'מנוע', steering: 'היגוי', suspension: 'מתלים', body: 'מרכב',
    fluids: 'נוזלים', electrical: 'חשמל', interior: 'פנים', exterior: 'חיצוני',
  };
  return map[c] || c;
}
