import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מדיניות פרטיות',
  description: 'מדיניות הפרטיות של AutoLog - כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלך. שקיפות מלאה בנוגע לנתוני המשתמשים.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'מדיניות פרטיות | AutoLog',
    description: 'כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלך.',
    url: 'https://autolog.click/privacy',
    type: 'website',
    locale: 'he_IL',
    siteName: 'AutoLog',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
