import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'הצטרפות כמוסך שותף',
  description: 'הצטרפו לרשת המוסכים של AutoLog - הגדילו את החשיפה שלכם, קבלו לקוחות חדשים ונהלו את המוסך בצורה חכמה ודיגיטלית.',
  alternates: {
    canonical: '/garage-apply',
  },
  openGraph: {
    title: 'הצטרפו כמוסך שותף ל-AutoLog',
    description: 'הגדילו את החשיפה שלכם, קבלו לקוחות חדשים ונהלו את המוסך בצורה חכמה ודיגיטלית.',
    url: 'https://autolog.click/garage-apply',
    type: 'website',
    locale: 'he_IL',
    siteName: 'AutoLog',
  },
};

export default function GarageApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
