'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

/**
 * Cookie consent banner + Google Consent Mode v2.
 *
 * Analytics storage defaults to "denied" (set in layout.tsx before gtag runs),
 * so Google Analytics collects nothing until the visitor actively accepts.
 * That is the point: consent has to precede the tracking, not follow it.
 *
 * The choice is remembered in localStorage. Essential cookies (auth/session)
 * are not covered here — without them the service cannot function, so they are
 * not offered as a choice.
 */
const KEY = 'autolog-cookie-consent';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

function updateConsent(granted: boolean) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) { window.dataLayer!.push(args); }
  gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch { /* private mode */ }

    if (saved === 'granted') {
      updateConsent(true);
    } else if (saved === 'denied') {
      updateConsent(false);
    } else {
      setShow(true);
    }
  }, []);

  const decide = (granted: boolean) => {
    try { localStorage.setItem(KEY, granted ? 'granted' : 'denied'); } catch { /* ignore */ }
    updateConsent(granted);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-label="הסכמה לשימוש בעוגיות"
      className="fixed bottom-0 inset-x-0 z-[100] p-3 sm:p-4"
    >
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-[#2E77D0]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Cookie className="text-[#2E77D0]" size={20} />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              אנו משתמשים בעוגיות הכרחיות להתחברות, וברשותך גם בעוגיות אנליטיות
              (Google Analytics) כדי להבין איך משפרים את השירות.{' '}
              <Link href="/privacy" className="text-[#2E77D0] font-medium hover:underline">
                מדיניות הפרטיות
              </Link>
            </p>
          </div>
          <div className="flex gap-2 sm:flex-shrink-0">
            <button
              onClick={() => decide(false)}
              className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition whitespace-nowrap"
            >
              רק הכרחיות
            </button>
            <button
              onClick={() => decide(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold text-white bg-[#2E77D0] hover:bg-[#1D4F8F] rounded-xl transition whitespace-nowrap"
            >
              אישור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
