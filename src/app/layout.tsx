import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'AutoLog - ניהול רכבים חכם',
    template: '%s | AutoLog',
  },
  description: 'מערכת ניהול רכבים מקצועית - בדיקות, ביטוח, טסט, מוסכים, תזכורות חכמות ועוד. הצטרפו ל-2,500+ משתמשים שכבר מנהלים את הרכב בצורה חכמה.',
  keywords: ['ניהול רכבים', 'טסט', 'ביטוח רכב', 'מוסך', 'בדיקת רכב', 'AutoLog', 'תזכורות רכב', 'SOS חירום'],
  authors: [{ name: 'AutoLog' }],
  creator: 'AutoLog',
  icons: { icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' }], apple: '/favicon-32.png' },
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
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e3a5f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-[#fef7ed] text-gray-800 min-h-screen">
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
