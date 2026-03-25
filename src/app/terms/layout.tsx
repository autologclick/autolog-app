import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'תנאי שימוש',
  description: 'תנאי השימוש של AutoLog - הסכם בין המשתמש לבין AutoLog הכולל את כללי השימוש באפליקציה, אחריות, זכויות יוצרים ותנאים נוספים.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
