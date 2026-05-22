'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Bug, X, Send, CheckCircle2, Loader2, Camera } from 'lucide-react';

/**
 * Floating "report a bug" button — sits in the bottom-left corner across
 * all /user pages. One click opens a modal where the user describes what
 * went wrong; submission goes to Sentry as a manual capture with full
 * context (page URL, browser, user agent, and the description text).
 *
 * Why not just open Sentry's built-in showReportDialog? Because that
 * dialog only works when an error already exists. This button is for
 * the case where nothing CRASHED but the user is confused or annoyed —
 * e.g. "the upload button does nothing", "I can't see my expenses".
 * Those are the bugs we'd never know about otherwise.
 */
export default function ReportBugButton() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (description.trim().length < 10) {
      setError('נא לכתוב לפחות 10 תווים שמתארים את הבעיה');
      return;
    }
    setSending(true);
    setError('');

    try {
      // 1. Capture to Sentry for long-term tracking + dedup analysis.
      //    This is fire-and-forget; even if blocked we still proceed.
      const eventId = Sentry.captureMessage(`[Bug Report] ${description.slice(0, 80)}`, {
        level: 'info',
        tags: {
          source: 'user-report',
          page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        },
        contexts: {
          report: { description, email: email || 'not-provided' },
        },
      });

      // 2. PRIMARY channel: direct email to ops inbox via our /api/bug-report.
      //    This is what guarantees the team sees this within minutes,
      //    independent of whether anyone is watching the Sentry dashboard.
      await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'user-report',
          userDescription: description,
          userEmail: email || undefined,
          pageUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
          sentryEventId: eventId || undefined,
        }),
      });

      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setDescription('');
        setEmail('');
      }, 2500);
    } catch {
      setError('לא הצלחנו לשלוח את הדיווח. נסה שוב או פנה לתמיכה.');
    }
    setSending(false);
  };

  return (
    <>
      {/* Floating button — bottom-left so it doesn't conflict with the
          mobile bottom-nav or the existing add-treatment floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="דווח על באג"
        className="fixed bottom-20 start-4 lg:bottom-6 lg:start-6 z-30
                   w-12 h-12 bg-gray-800 hover:bg-gray-700 text-white
                   rounded-full shadow-lg hover:shadow-xl
                   flex items-center justify-center transition-all active:scale-95
                   group"
      >
        <Bug size={18} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute start-full ms-3 px-2 py-1 bg-gray-800 text-white text-xs rounded-md
                       opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none
                       hidden lg:block">
          דווח על באג
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => !sending && setOpen(false)}
          dir="rtl"
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gray-800 text-white rounded-lg flex items-center justify-center">
                  <Bug size={16} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">דווח על באג</h2>
              </div>
              <button
                onClick={() => !sending && setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
                disabled={sending}
                aria-label="סגור"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            {sent ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">תודה!</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  הדיווח התקבל וכבר בדרך לצוות הפיתוח. ככל שיש יותר פרטים — מהר יותר נתקן.
                </p>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  נתקלת בבעיה? משהו לא עובד כמו שצריך? ספר/י לנו מה ניסית לעשות ומה קרה. הצוות יקבל
                  גם פרטים טכניים אוטומטיים (דפדפן, עמוד נוכחי) שעוזרים לאתר מהר.
                </p>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    מה קרה? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="לדוגמה: ניסיתי לסרוק קבלה, המצלמה לא נפתחה והאפליקציה תקועה על מסך טעינה..."
                    rows={5}
                    maxLength={2000}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm resize-none"
                    dir="rtl"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1 text-end">{description.length}/2000</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    אימייל לחזרה <span className="text-gray-400 font-normal">(אופציונלי)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="אם אתה רוצה שנחזור אליך כשיתוקן"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
                    dir="ltr"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setOpen(false)}
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={sending || description.trim().length < 10}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        שולח...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        שלח דיווח
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
