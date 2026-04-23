import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';
import * as Sentry from '@sentry/nextjs';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import PWAInstallPrompt from '@/components/shared/PWAInstallPrompt';
import MaintenanceGate from '@/components/shared/MaintenanceGate';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-heebo',
});

export function generateMetadata(): Metadata {
  return {
    ...baseMetadata,
    other: { ...Sentry.getTraceData() },
  };
}

const baseMetadata: Metadata = {
  title: {
    default: 'AutoLog - ניהול רכבים חכם',
    template: '%s | AutoLog',
  },
  description: 'מערכת ניהול רכבים מקצועית - בדיקות, ביטוח, טסט, מוסכים, תזכורות חכמות ועוד. הצטרפו ל-2,500+ משתמשים שכבר מנהלים את הרכב בצורה חכמה.',
  keywords: ['ניהול רכבים', 'טסט', 'ביטוח רכב', 'מוסך', 'אבחון רכב', 'AutoLog', 'תזכורות רכב', 'SOS חירום'],
  authors: [{ name: 'AutoLog' }],
  creator: 'AutoLog',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  manifest: '/manifest.json',
  themeColor: '#1e3a5f',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AutoLog',
  },
  // Note: mobile-web-app-capable is handled by Next.js manifest integration
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: 'https://autolog.click',
    siteName: 'AutoLog',
    title: 'AutoLog - ניהול רכבים חכם ויעיל',
    description: 'מערכת ניהול רכבים מקצועית - בדיקות, ביטוח, טסט, מוסכים, תזכורות חכמות ועוד',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoLog - ניהול רכבים חכם',
    description: 'נהל את הרכב שלך בצורה חכמה - תזכורות, מסמכים, מוסכים ועוד',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Allow users to zoom up to 5x for accessibility (WCAG 1.4.4).
  // Blocking zoom fails Lighthouse accessibility and is hostile to users
  // who rely on pinch-zoom to read text.
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1e3a5f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className={`${heebo.className} bg-[#fef7ed] text-gray-800 min-h-screen`}>
        {children}
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              direction: 'rtl',
              fontFamily: 'var(--font-heebo), sans-serif',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
              maxWidth: '420px',
            },
            success: {
              style: {
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #6ee7b7',
              },
              iconTheme: {
                primary: '#059669',
                secondary: '#ecfdf5',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fca5a5',
              },
              iconTheme: {
                primary: '#dc2626',
                secondary: '#fef2f2',
              },
            },
          }}
        />
              <PWAInstallPrompt />
              <MaintenanceGate />
        </body>
    </html>
  );
}
