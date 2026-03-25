import { Suspense } from 'react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'התחברות',
  description: 'התחברו לחשבון AutoLog שלכם - ניהול רכבים חכם עם תזכורות, מסמכים, מוסכים ועוד.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" /></div>}>
      {children}
    </Suspense>
  );
}
