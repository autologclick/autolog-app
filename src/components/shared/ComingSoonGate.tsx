'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import ComingSoonBanner from '@/components/shared/ComingSoonBanner';

interface ComingSoonGateProps {
  /** Page title shown in the header while the feature is gated */
  title: string;
  /** Banner heading, e.g. "פחחות — בקרוב!" */
  bannerTitle?: string;
  /** Banner body copy */
  description?: string;
  variant?: 'navy' | 'teal' | 'green';
  /** Where "back" should land. Defaults to the "עוד" menu, which is where these
   *  features are launched from. */
  backUrl?: string;
}

/**
 * Gate shown instead of an unreleased feature page.
 *
 * Two navigation problems this solves:
 *
 * 1. **Back must not reach the real service page.** The gated pages used
 *    `backUrl="/user/service"`, and PageHeader's backUrl does `router.push` —
 *    so "back" pushed the *service hub* (an unreleased screen) onto the stack
 *    instead of returning. Back now goes to `/user/more`.
 *
 * 2. **Android's system back must behave too.** Arriving at a gated URL pushes
 *    a history entry; the OS back button would return the user right into it
 *    (or deeper into unreleased screens). On mount we replace that entry with
 *    the back target, then push the current URL — so the entry *underneath* this
 *    page is always `/user/more`, and system-back leaves the gated area.
 */
export default function ComingSoonGate({
  title,
  bannerTitle,
  description,
  variant = 'navy',
  backUrl = '/user/more',
}: ComingSoonGateProps) {
  const router = useRouter();
  const fixedHistory = useRef(false);

  useEffect(() => {
    // Rewrite the history entry beneath this page exactly once, so both the
    // in-app back button and Android's system back land on `backUrl`.
    if (fixedHistory.current) return;
    fixedHistory.current = true;
    try {
      const here = window.location.pathname + window.location.search;
      window.history.replaceState(window.history.state, '', backUrl);
      window.history.pushState(window.history.state, '', here);
    } catch {
      /* history API unavailable — the in-app back button still works */
    }
  }, [backUrl]);

  // Android/browser back: leave the gated page for `backUrl` rather than
  // letting the browser restore a deeper unreleased screen.
  useEffect(() => {
    const onPop = () => router.replace(backUrl);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [router, backUrl]);

  return (
    <div className="min-h-screen bg-[#F3F6FA] pb-24" dir="rtl">
      <PageHeader title={title} variant={variant} backUrl={backUrl} />
      <div className="px-4 py-6">
        <ComingSoonBanner title={bannerTitle} description={description} />
      </div>
    </div>
  );
}
