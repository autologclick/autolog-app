import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';
import Script from 'next/script';
import CookieBanner from '@/components/shared/CookieBanner';
import * as Sentry from '@sentry/nextjs';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import PWAInstallPrompt from '@/components/shared/PWAInstallPrompt';
import MaintenanceGate from '@/components/shared/MaintenanceGate';
import ReferralCapture from '@/components/shared/ReferralCapture';

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
    default: 'אוטולוג (AutoLog) — ניהול רכב חכם | תזכורות טסט, מעקב הוצאות ו-AI בחינם',
    template: '%s | אוטולוג',
  },
  description: 'אוטולוג — הפלטפורמה הישראלית המובילה לניהול רכב חכם. תזכורות טסט וביטוח, מעקב הוצאות, סריקת מסמכים עם AI. חינם לחלוטין, ללא הורדה. הצטרפו לאוטולוג עכשיו.',
  applicationName: 'אוטולוג',
  keywords: [
    'אוטולוג', 'אוטולוג ישראל', 'אוטולוג רכב', 'אוטולוג אפליקציה',
    'AutoLog', 'ניהול רכב', 'אפליקציה לניהול רכב',
    'תזכורת טסט', 'תזכורת ביטוח רכב', 'מעקב הוצאות רכב',
    'אפליקציה לרכב', 'ניהול רכב פרטי', 'אפליקציית רכב ישראל',
    'ביטוח רכב', 'טסט רכב', 'מוסך', 'אבחון רכב',
    'תזכורות רכב', 'הוצאות רכב חודשיות', 'חידוש רישיון רכב',
    'טיפול רכב תקופתי', 'סריקת מסמכים רכב AI',
  ],
  authors: [{ name: 'אוטולוג', url: 'https://autolog.click' }],
  creator: 'אוטולוג',
  publisher: 'אוטולוג',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  manifest: '/manifest.json',
  themeColor: '#1B4E8A',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'אוטולוג',
  },
  metadataBase: new URL('https://autolog.click'),
  alternates: {
    canonical: '/',
    languages: {
      'he-IL': 'https://autolog.click',
      'x-default': 'https://autolog.click',
    },
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: 'https://autolog.click',
    siteName: 'אוטולוג',
    title: 'אוטולוג — ניהול רכב חכם | תזכורות טסט, מעקב הוצאות ו-AI',
    description: 'אוטולוג — הפלטפורמה הישראלית לניהול רכב חכם. תזכורות, מעקב הוצאות, סריקת מסמכים עם AI. חינם וללא הורדה.',
    images: [
      {
        url: '/og/og-default-v3.png',
        width: 1200,
        height: 630,
        alt: 'אוטולוג - ניהול רכבים חכם',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'אוטולוג — ניהול רכב חכם בחינם',
    description: 'תזכורות טסט וביטוח, מעקב הוצאות, סריקת מסמכים עם AI. אוטולוג — חינם וללא הורדה.',
    images: ['/og/og-default-v3.png'],
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
  category: 'automotive',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Allow users to zoom up to 5x for accessibility (WCAG 1.4.4).
  // Blocking zoom fails Lighthouse accessibility and is hostile to users
  // who rely on pinch-zoom to read text.
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1B4E8A',
};

// ─── Schema.org JSON-LD ──────────────────────────────────────────────────
// Site-wide entity reference. The PRIMARY name is in Hebrew ("אוטולוג")
// because the SEO goal is to rank for the Hebrew brand keyword.
// English variants live in alternateName.
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://autolog.click/#organization',
  name: 'אוטולוג',
  alternateName: [
    'AutoLog',
    'Autolog',
    'אוטולוג ישראל',
    'אוטולוג רכב',
    'אוטולוג אפליקציה',
    'autolog.click',
  ],
  url: 'https://autolog.click',
  logo: {
    '@type': 'ImageObject',
    url: 'https://autolog.click/logo.png',
    width: 512,
    height: 512,
  },
  image: 'https://autolog.click/og/og-default-v3.png',
  description:
    'אוטולוג היא הפלטפורמה הישראלית המובילה לניהול רכב חכם — תזכורות טסט וביטוח, מעקב הוצאות, סריקת מסמכים עם AI, היסטוריית טיפולים ושירות חירום. חינם לחלוטין.',
  inLanguage: 'he-IL',
  areaServed: { '@type': 'Country', name: 'Israel', alternateName: 'ישראל' },
  knowsLanguage: ['he', 'Hebrew', 'en', 'English'],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'info@autolog.click',
    contactType: 'customer support',
    areaServed: 'IL',
    availableLanguage: ['Hebrew', 'English'],
  },
  foundingDate: '2026',
  slogan: 'כל מה שצריך לרכב שלך במקום אחד',
  sameAs: ['https://autolog.click'],
};

// WebSite schema with SearchAction → eligible for sitelinks search box in SERPs.
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://autolog.click/#website',
  name: 'אוטולוג',
  alternateName: ['AutoLog', 'autolog.click'],
  url: 'https://autolog.click',
  inLanguage: 'he-IL',
  description:
    'אוטולוג — הפלטפורמה הישראלית לניהול רכב חכם. תזכורות, מעקב הוצאות, סריקת מסמכים עם AI.',
  publisher: { '@id': 'https://autolog.click/#organization' },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://autolog.click/blog?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className={`${heebo.className} bg-[#F3F6FA] text-gray-800 min-h-screen`}>
        {/* Schema.org structured data — Organization + WebSite (site-wide) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/*
          Google Analytics (gtag.js) — loaded with strategy="afterInteractive"
          per Next.js + Google recommendation: runs after page is interactive
          so it doesn't block first paint, but still captures the initial page view.
          Production-only to keep dev/preview traffic out of analytics.
        */}
        {/*
          Google Consent Mode v2 — denied by default.
          This must execute BEFORE gtag.js loads, so analytics collects nothing
          until CookieBanner sends an explicit 'consent update' after the visitor
          accepts. Loading GA first and asking later is what we are avoiding.
        */}
        {process.env.NODE_ENV === 'production' && GA_MEASUREMENT_ID && (
          <Script
            id="google-consent-default"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('consent', 'default', {
                  ad_storage: 'denied',
                  ad_user_data: 'denied',
                  ad_personalization: 'denied',
                  analytics_storage: 'denied',
                  wait_for_update: 500
                });
              `,
            }}
          />
        )}
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
        <CookieBanner />
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
              <ReferralCapture />
        </body>
    </html>
  );
}
