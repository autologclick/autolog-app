'use client';

import { AlertTriangle, X, FileSearch, ShieldCheck } from 'lucide-react';
import type { CriticalConflict } from '@/lib/scan-conflict';

interface Props {
  conflict: CriticalConflict | null;
  /** Document type the scan came from — controls the helpful copy. */
  source: 'insurance' | 'test' | 'license';
  /** User chose to keep what's already saved (ignore the scan). */
  onKeepExisting: () => void;
  /** User chose to overwrite with the scanned value. */
  onUseScanned: () => void;
  /** User dismissed without choosing — treat as cancel. */
  onCancel: () => void;
}

const SOURCE_LABELS: Record<Props['source'], string> = {
  insurance: 'בפוליסת הביטוח',
  test: 'בתעודת הטסט',
  license: 'ברישיון הרכב',
};

/**
 * Hard-stop modal that fires when a scan returned a license plate that
 * doesn't match the one already saved on the vehicle. We refuse to
 * silently overwrite something this important — the user has to actively
 * choose. The three buttons are intentionally weighted (keep, replace,
 * cancel) so the "safe" option is the default.
 */
export default function ConflictResolutionModal({
  conflict,
  source,
  onKeepExisting,
  onUseScanned,
  onCancel,
}: Props) {
  if (!conflict) return null;

  const sourceLabel = SOURCE_LABELS[source];

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onCancel}
      dir="rtl"
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — bold red so user notices */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 relative">
          <button
            onClick={onCancel}
            className="absolute top-4 start-4 text-gray-400 hover:text-gray-600"
            aria-label="סגור"
          >
            <X size={20} />
          </button>
          <div className="flex items-start gap-3 pe-8">
            <div className="w-11 h-11 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={22} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">אי התאמה ב{conflict.fieldLabelHe}!</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {conflict.fieldLabelHe} ששמור במערכת לא תואם למה שזוהה {sourceLabel}.
              </p>
            </div>
          </div>
        </div>

        {/* Value comparison */}
        <div className="px-6 py-5 space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-2">
              <ShieldCheck size={14} />
              שמור במערכת
            </div>
            <div className="text-xl font-bold text-blue-900" dir="ltr">{conflict.existing}</div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-2">
              <FileSearch size={14} />
              זוהה במסמך שהעלית
            </div>
            <div className="text-xl font-bold text-amber-900" dir="ltr">{conflict.scanned}</div>
          </div>

          {/* Quick guidance — helps user decide without thinking too hard */}
          <p className="text-xs text-gray-500 leading-relaxed pt-1">
            💡 אם המסמך באמת של הרכב הזה — לחץ/י <strong>&quot;החלף&quot;</strong>. אם העלית בטעות
            מסמך של רכב אחר, או שה-AI לא קרא נכון — <strong>&quot;השאר את הקיים&quot;</strong>.
          </p>
        </div>

        {/* Three weighted buttons */}
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          <button
            onClick={onKeepExisting}
            className="col-span-2 sm:col-span-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
          >
            השאר את הקיים
          </button>
          <button
            onClick={onUseScanned}
            className="col-span-2 sm:col-span-1 px-4 py-3 bg-amber-100 text-amber-900 rounded-xl font-bold hover:bg-amber-200 transition border border-amber-300"
          >
            החלף ל-{conflict.scanned}
          </button>
          <button
            onClick={onCancel}
            className="col-span-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100 transition"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
