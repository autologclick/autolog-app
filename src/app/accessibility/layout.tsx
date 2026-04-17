import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'הצהרת נגישות',
  description: 'הצהרת הנגישות של AutoLog - מחויבות להנגשת האפליקציה לאנשים עם מוגבלות בהתאם לתקן WCAG 2.1 AA ולחוק שוויון זכויות.',
  alternates: {
    canonical: '/accessibility',
  },
  openGraph: {
    title: 'הצהרת נגישות | AutoLog',
    description: 'מחויבות להנגשת האפליקציה בהתאם לתקן WCAG 2.1 AA.',
    url: 'https://autolog.click/accessibility',
    type: 'website',
    locale: 'he_IL',
    siteName: 'AutoLog',
  },
};

export default function AccessibilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
