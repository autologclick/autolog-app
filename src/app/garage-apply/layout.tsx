import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'הצטרפות כמוסך שותף',
  description: 'הצטרפו לרשת המוסכים של AutoLog - הגדילו את החשיפה שלכם, קבלו לקוחות חדשים ונהלו את המוסך בצורה חכמה ודיגיטלית.',
  alternates: {
    canonical: '/garage-apply',
  },
};

export default function GarageApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
