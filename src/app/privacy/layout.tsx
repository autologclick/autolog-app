import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מדיניות פרטיות',
  description: 'מדיניות הפרטיות של AutoLog - כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלך. שקיפות מלאה בנוגע לנתוני המשתמשים.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
