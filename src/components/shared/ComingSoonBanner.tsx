'use client';

import { Rocket } from 'lucide-react';

interface ComingSoonBannerProps {
  /** Title text — defaults to "בקרוב באפליקציה!" */
  title?: string;
  /** Description text */
  description?: string;
  /** Whether to render as a full-page overlay (with backdrop) or an inline banner */
  variant?: 'overlay' | 'inline';
}

/**
 * "בקרוב" (Coming Soon) banner for garage-dependent features.
 *
 * - **overlay**: Covers the page content with a centered message.
 * - **inline**: Shows a compact banner inside a section.
 *
 * Controlled by `GARAGES_ENABLED` feature flag in the parent page.
 * When garages join, the parent simply stops rendering this component.
 */
export default function ComingSoonBanner({
  title = 'בקרוב באפליקציה!',
  description = 'אנחנו עובדים על חיבור מוסכים שותפים לפלטפורמה. השירות הזה יהיה זמין בקרוב.',
  variant = 'overlay',
}: ComingSoonBannerProps) {
  if (variant === 'inline') {
    return (
      <div className="bg-gradient-to-l from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Rocket size={20} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-amber-800 text-sm">{title}</div>
          <div className="text-xs text-amber-600 mt-0.5 leading-relaxed">{description}</div>
        </div>
        <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
          בקרוב
        </span>
      </div>
    );
  }

  // overlay variant — full-page overlay
  return (
    <div className="bg-gradient-to-b from-amber-50/90 to-orange-50/90 backdrop-blur-sm rounded-3xl p-8 text-center border-2 border-amber-200/60 shadow-lg">
      <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Rocket size={32} className="text-amber-600" />
      </div>
      <h2 className="text-xl font-bold text-amber-800 mb-2">{title}</h2>
      <p className="text-amber-600 text-sm leading-relaxed max-w-sm mx-auto mb-4">
        {description}
      </p>
      <div className="inline-flex items-center gap-2 bg-amber-200/60 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        בפיתוח פעיל
      </div>
    </div>
  );
}

/**
 * Small "בקרוב" badge for nav items and buttons.
 */
export function ComingSoonBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${className}`}>
      בקרוב
    </span>
  );
}
