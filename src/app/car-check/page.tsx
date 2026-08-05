import type { Metadata } from 'next';
import CarCheckClient from './CarCheckClient';

export const metadata: Metadata = {
  title: 'בדיקת רכב לפני קנייה לפי מספר רישוי — חינם | אוטולוג',
  description: 'הזינו מספר רכב וקבלו בחינם דגלים אדומים מנתוני משרד התחבורה: עבר ליסינג והשכרה, ריקולים פתוחים, קילומטראז׳ בטסט האחרון, החלפות בעלות ועוד.',
  keywords: ['בדיקת רכב לפני קנייה', 'בדיקת עבר רכב', 'בדיקת רכב לפי מספר רישוי', 'היסטוריית רכב', 'רכב יד שנייה'],
  alternates: { canonical: '/car-check' },
  openGraph: {
    title: 'בדיקת רכב לפני קנייה לפי מספר רישוי — חינם',
    description: 'דגלים אדומים מנתוני משרד התחבורה, תוך שניות ובחינם.',
    url: 'https://autolog.click/car-check',
    locale: 'he_IL',
    siteName: 'אוטולוג',
  },
};

export default function CarCheckPage() {
  return <CarCheckClient />;
}
