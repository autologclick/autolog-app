import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'הצהרת נגישות',
  description: 'הצהרת הנגישות של AutoLog - מחויבות להנגשת האפליקציה לאנשים עם מוגבלות בהתאם לתקן WCAG 2.1 AA ולחוק שוויון זכויות.',
  alternates: {
    canonical: '/accessibility',
  },
};

export default function AccessibilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
