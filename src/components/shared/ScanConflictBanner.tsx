'use client';

import { Sparkles, X } from 'lucide-react';
import type { SoftConflict } from '@/lib/scan-conflict';

interface Props {
  conflict: SoftConflict | null;
  onAccept: () => void;
  onDismiss: () => void;
}

/**
 * Soft conflict banner — shown inline above the affected form field
 * (insurance company, test station, etc) when the AI scan found a
 * different value than what the user previously saved.
 *
 * The default action is to KEEP the existing value (we already left it
 * in the form). Clicking "החלף" actively replaces it. Clicking × just
 * dismisses the banner so it stops nagging.
 *
 * Tone is friendly, not alarming — this is "FYI" territory.
 */
export default function ScanConflictBanner({ conflict, onAccept, onDismiss }: Props) {
  if (!conflict) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2 flex items-start gap-2">
      <Sparkles size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-amber-900 leading-relaxed mb-2">
          <strong>AI זיהה {conflict.fieldLabelHe} שונה:</strong>{' '}
          &quot;{conflict.scanned}&quot; במקום &quot;{conflict.existing}&quot; הקיים.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="px-3 py-1 text-xs font-semibold bg-amber-600 text-white rounded-md hover:bg-amber-700 transition"
          >
            החלף ל-&quot;{conflict.scanned}&quot;
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1 text-xs font-medium text-amber-800 hover:text-amber-900 transition"
          >
            השאר את הקיים
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-amber-500 hover:text-amber-700 flex-shrink-0"
        aria-label="סגור התראה"
      >
        <X size={16} />
      </button>
    </div>
  );
}
