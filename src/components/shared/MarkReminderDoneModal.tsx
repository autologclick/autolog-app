'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, X, Loader2, AlertCircle, Calendar } from 'lucide-react';
import ShekelSign from '@/components/ui/ShekelSign';

export type ReminderType =
  | 'test'
  | 'compulsory_insurance'
  | 'comprehensive_insurance'
  | 'oil_change'
  | 'tires'
  | 'brakes'
  | 'timing_belt';

interface Props {
  isOpen: boolean;
  vehicleId: string;
  reminderType: ReminderType;
  /** Pre-fill the mileage input from the vehicle's current odometer */
  defaultMileage?: number | null;
  onClose: () => void;
  /** Fires after a successful save — parent should refetch vehicle data */
  onSuccess?: (result: { newExpiryDate: string | null; nextDueMileage: number | null }) => void;
}

const CONFIG: Record<ReminderType, {
  label: string;
  icon: string;
  intro: string;
  /** Date-based reminders show a date+cost flow; mileage-based show km+cost */
  dateBased: boolean;
  needsCompany?: boolean;
}> = {
  test: {
    label: 'טסט שנתי',
    icon: '🔧',
    intro: 'מעולה! נעדכן את התאריך של הטסט הבא ונפסיק לשלוח לך תזכורות עד אז.',
    dateBased: true,
  },
  compulsory_insurance: {
    label: 'ביטוח חובה',
    icon: '🛡️',
    intro: 'נעדכן את תאריך הפקיעה לעוד שנה ונפסיק את התזכורות.',
    dateBased: true,
    needsCompany: true,
  },
  comprehensive_insurance: {
    label: 'ביטוח מקיף',
    icon: '🛡️',
    intro: 'נעדכן את תאריך הפקיעה לעוד שנה ונפסיק את התזכורות.',
    dateBased: true,
    needsCompany: true,
  },
  oil_change: {
    label: 'החלפת שמן',
    icon: '🛢️',
    intro: 'נתעד את הטיפול בהיסטוריה. התזכורת הבאה תחושב לפי הק"מ.',
    dateBased: false,
  },
  tires: {
    label: 'החלפת צמיגים',
    icon: '🔄',
    intro: 'נתעד את ההחלפה. הצמיגים החדשים יבטיחו לך כ-20,000 ק"מ של נסיעה בטוחה.',
    dateBased: false,
  },
  brakes: {
    label: 'החלפת בלמים',
    icon: '🛑',
    intro: 'נתעד את ההחלפה. נמתין שוב כשתגיע לכ-60,000 ק"מ של נסיעה.',
    dateBased: false,
  },
  timing_belt: {
    label: 'החלפת רצועת תזמון',
    icon: '⚙️',
    intro: 'הוצאה גדולה אבל חיונית — נתעד את ההחלפה לשמירה על המנוע.',
    dateBased: false,
  },
};

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function MarkReminderDoneModal({
  isOpen,
  vehicleId,
  reminderType,
  defaultMileage,
  onClose,
  onSuccess,
}: Props) {
  const cfg = CONFIG[reminderType];

  const [completedDate, setCompletedDate] = useState(todayISO());
  const [cost, setCost] = useState('');
  const [garageName, setGarageName] = useState('');
  const [mileage, setMileage] = useState(defaultMileage ? String(defaultMileage) : '');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when reopened
  useEffect(() => {
    if (isOpen) {
      setCompletedDate(todayISO());
      setCost('');
      setGarageName('');
      setMileage(defaultMileage ? String(defaultMileage) : '');
      setInsuranceCompany('');
      setPolicyNumber('');
      setNotes('');
      setError('');
    }
  }, [isOpen, defaultMileage]);

  const handleSubmit = async () => {
    setError('');
    if (!completedDate) {
      setError('נא לבחור תאריך');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/mark-reminder-done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderType,
          completedDate,
          cost: cost ? Number(cost) : undefined,
          garageName: garageName || undefined,
          mileage: mileage ? Number(mileage) : undefined,
          insuranceCompany: insuranceCompany || undefined,
          policyNumber: policyNumber || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בעדכון');
        setSaving(false);
        return;
      }
      toast.success(data.message || 'עודכן בהצלחה!');
      onSuccess?.({
        newExpiryDate: data.newExpiryDate,
        nextDueMileage: data.nextDueMileage,
      });
      onClose();
    } catch {
      setError('שגיאת חיבור. נסה שוב.');
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => !saving && onClose()}
      dir="rtl"
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl">
              {cfg.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">סמן: ביצעתי {cfg.label}</h2>
              <p className="text-xs text-gray-500">{cfg.intro}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Date — always required */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <Calendar size={14} className="inline ms-1" />
              מתי ביצעת? <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={completedDate}
              onChange={(e) => setCompletedDate(e.target.value)}
              max={todayISO()}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
              dir="ltr"
            />
          </div>

          {/* Mileage — important for vehicle tracking */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              ק&quot;מ נוכחי <span className="text-gray-400 font-normal">(אופציונלי — עוזר לחישוב הטיפול הבא)</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="לדוגמה: 45000"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
              dir="ltr"
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <ShekelSign size={14} className="inline ms-1" />
              עלות (₪) <span className="text-gray-400 font-normal">— אם תזין, נוסיף אוטומטית להוצאות</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
              dir="ltr"
            />
          </div>

          {/* Garage / company name */}
          {cfg.needsCompany ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  חברת ביטוח
                </label>
                <input
                  type="text"
                  value={insuranceCompany}
                  onChange={(e) => setInsuranceCompany(e.target.value)}
                  placeholder="הראל / מגדל / כלל..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  מספר פוליסה <span className="text-gray-400 font-normal">(אופציונלי)</span>
                </label>
                <input
                  type="text"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
                  dir="ltr"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                איפה? <span className="text-gray-400 font-normal">(שם המוסך / מכון — אופציונלי)</span>
              </label>
              <input
                type="text"
                value={garageName}
                onChange={(e) => setGarageName(e.target.value)}
                placeholder="לדוגמה: מוסך יוסי / מבדק תל אביב"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              הערות <span className="text-gray-400 font-normal">(אופציונלי)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="למשל: הוחלפו פילטר אוויר ופילטר שמן..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition disabled:opacity-50"
            >
              ביטול
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !completedDate}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  שמור והפסק תזכורות
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
