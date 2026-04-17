import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'תנאי אחריות',
  description: 'תנאי האחריות של AutoLog - מידע על אחריות השירות, הגבלות אחריות, תנאי שימוש וזכויות המשתמש בנוגע לשירותי ניהול הרכב.',
  alternates: {
    canonical: '/warranty',
  },
  openGraph: {
    title: 'תנאי אחריות | AutoLog',
    description: 'מידע על אחריות השירות, הגבלות וזכויות המשתמש.',
    url: 'https://autolog.click/warranty',
    type: 'website',
    locale: 'he_IL',
    siteName: 'AutoLog',
  },
};

export default function WarrantyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
