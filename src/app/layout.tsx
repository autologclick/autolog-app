import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';
import Script from 'next/script';
import * as Sentry from '@sentry/nextjs';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import PWAInstallPrompt from '@/components/shared/PWAInstallPrompt';
import MaintenanceGate from '@/components/shared/MaintenanceGate';

// Google Analytics 4 — Measurement ID
// Override via NEXT_PUBLIC_GA_ID env var without code changes.
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID || 'G-S8258ZT72Q';

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
    default: 'AutoLog — ניהול רכב חכם | תזכורות טסט, מעקב הוצאות ו-AI בחינם',
    template: '%s | AutoLog',
  },
  description: 'נמאס לפספס טסט וביטוח? AutoLog שולחת תזכורות, עוקבת אחרי הוצאות הרכב וסורקת מסמכים עם AI. חינם לחלוטין, ללא הורדה. הצטרפו עכשיו.',
  keywords: [
    'ניהול רכב', 'תזכורת טסט', 'מעקב הוצאות רכב', 'אפליקציה לרכב',
    'ביטוח רכב', 'טסט רכב', 'מוסך', 'אבחון רכב', 'AutoLog',
    'תזכורות רכב', 'הוצאות רכב חודשיות', 'חידוש רישיון רכב',
    'טיפול רכב תקופתי', 'ניהול רכב פרטי', 'אפליקציית רכב ישראל',
  ],
  authors: [{ name: 'AutoLog' }],
  creator: 'AutoLog',
  publisher: 'AutoLog',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  manifest: '/manifest.json',
  themeColor: '#1e3a5f',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AutoLog',
  },
  metadataBase: new URL('https://autolog.click'),
  alternates: {
    canonical: '/',
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: 'https://autolog.click',
    siteName: 'AutoLog',
    title: 'AutoLog — ניהול רכב חכם | תזכורות טסט, מעקב הוצאות ו-AI',
    description: 'נמאס לפספס טסט וביטוח? AutoLog שולחת תזכורות, עוקבת אחרי הוצאות הרכב וסורקת מסמכים עם AI. חינם לחלוטין.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoLog — ניהול רכב חכם | תזכורות, הוצאות ו-AI',
    description: 'תזכורות טסט וביטוח, מעקב הוצאות, סריקת מסמכים עם AI, ועוזר רכב חכם. חינם וללא הורדה.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        {/*
          Google Analytics (gtag.js) — loaded with strategy="afterInteractive"
          per Next.js + Google recommendation: runs after page is interactive
          so it doesn't block first paint, but still captures the initial page view.
          Production-only to keep dev/preview traffic out of analytics.
        */}
        {process.env.NODE_ENV === 'production' && GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  anonymize_ip: true,
                  send_page_view: true
                });
              `}
            </Script>
          </>
        )}
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
