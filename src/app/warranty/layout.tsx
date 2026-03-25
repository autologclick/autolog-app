import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'תנאי אחריות',
  description: 'תנאי האחריות של AutoLog - מידע על אחריות השירות, הגבלות אחריות, תנאי שימוש וזכויות המשתמש בנוגע לשירותי ניהול הרכב.',
  alternates: {
    canonical: '/warranty',
  },
};

export default function WarrantyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
