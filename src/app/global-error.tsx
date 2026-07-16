'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect, useState } from 'react';

/**
 * Top-level error boundary that React falls back to when something throws
 * outside any other ErrorBoundary. Reports to Sentry, then offers the user
 * a chance to attach context via Sentry's Report Dialog — "what were you
 * trying to do when this crashed?"
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    const id = Sentry.captureException(error);
    setEventId(id);

    // Fire a direct email to ops — this is the most severe error class,
    // we want to know immediately even if Sentry is somehow not delivering.
    if (typeof window !== 'undefined') {
      fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'global-error',
          errorMessage: error.message || 'Unknown global error',
          errorStack: error.stack || '',
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          sentryEventId: id || undefined,
        }),
        keepalive: true,
      }).catch(() => { /* never block the error UI */ });
    }
  }, [error]);

  const openReportDialog = () => {
    if (!eventId) return;
    Sentry.showReportDialog({
      eventId,
      lang: 'he',
      title: 'ספר/י לנו מה ניסית לעשות',
      subtitle: 'הצוות יקבל את הדיווח יחד עם השגיאה הטכנית — זה יעזור לנו לתקן מהר.',
      subtitle2: '',
      labelName: 'שם',
      labelEmail: 'אימייל',
      labelComments: 'מה ניסית לעשות?',
      labelClose: 'סגור',
      labelSubmit: 'שלח דיווח',
      errorGeneric: 'אירעה שגיאה בשליחת הדיווח. נסה שוב.',
      errorFormEntry: 'יש שדות שלא מולאו כראוי. תקנ/י ונסה/י שוב.',
      successMessage: 'תודה! הדיווח התקבל. נטפל בזה בהקדם.',
    });
  };

  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#F3F6FA' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ color: '#1B4E8A', margin: '0 0 12px', fontSize: '22px' }}>
              אופס, משהו השתבש
            </h1>
            <p style={{ color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
              אירעה שגיאה לא צפויה. הצוות שלנו קיבל את הדיווח אוטומטית — נטפל בזה בהקדם.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/"
                style={{
                  display: 'inline-block',
                  background: '#1B4E8A',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  fontWeight: 700,
                }}
              >
                חזרה לדף הבית
              </a>
              {eventId && (
                <button
                  onClick={openReportDialog}
                  style={{
                    background: '#f0fdfa',
                    color: '#2E77D0',
                    border: '1px solid #99f6e4',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ספר/י לנו מה קרה
                </button>
              )}
            </div>

            {eventId && (
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '20px' }}>
                קוד שגיאה: {eventId.slice(0, 8)}
              </p>
            )}
          </div>
        </div>

        {/* Hidden but rendered — keeps Next.js happy about the required NextError */}
        <div style={{ display: 'none' }}>
          <NextError statusCode={0} />
        </div>
      </body>
    </html>
  );
}
