import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-heebo',
});
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  metadataBase: new URL('https://autolog.click'),
  title: {
    default: 'AutoLog - × ×××× ×¨×××× ×××',
    template: '%s | AutoLog',
  },
  description: '××¢×¨××ª × ×××× ×¨×××× ××§×¦××¢××ª - ××××§××ª, ×××××, ××¡×, ×××¡×××, ×ª××××¨××ª ×××××ª ××¢××. ××¦××¨×¤× ×-2,500+ ××©×ª××©×× ×©×××¨ ×× ×××× ××ª ××¨×× ××¦××¨× ××××.',
  keywords: ['× ×××× ×¨××××', '××¡×', '××××× ×¨××', '×××¡×', '××××§×ª ×¨××', 'AutoLog', '×ª××××¨××ª ×¨××', 'SOS ×××¨××'],
  authors: [{ name: 'AutoLog' }],
  creator: 'AutoLog',
  icons: { icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' }], apple: '/apple-touch-icon.png' },
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
    title: 'AutoLog - × ×××× ×¨×××× ××× ×××¢××',
    description: '××¢×¨××ª × ×××× ×¨×××× ××§×¦××¢××ª - ××××§××ª, ×××××, ××¡×, ×××¡×××, ×ª××××¨××ª ×××××ª ××¢××',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'AutoLog - Smart Vehicle Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoLog - × ×××× ×¨×××× ×××',
    description: '× ×× ××ª ××¨×× ×©×× ××¦××¨× ×××× - ×ª××××¨××ª, ××¡××××, ×××¡××× ××¢××',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e3a5f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.className} bg-[#fef7ed] text-gray-800 min-h-screen`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              direction: 'rtl',
              fontFamily: 'Heebo, sans-serif',
              borderRadius: '12px',
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
      </body>
    </html>
  );
}
