import type { Metadata } from 'next';
import { existsSync } from 'node:fs';
import path from 'node:path';
import prisma from '@/lib/db';
import { friendlyModel } from '@/lib/vehicle-names';
import SaleClient from './SaleClient';

const FALLBACK: Metadata = {
  title: 'תעודת זהות לרכב | אוטולוג',
  robots: { index: false, follow: false },
};

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  try {
    if (!/^[a-f0-9]{32}$/.test(params.token)) return FALLBACK;
    const page = await prisma.salePage.findUnique({ where: { token: params.token } });
    if (!page || page.revoked || page.expiresAt < new Date()) return FALLBACK;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: page.vehicleId } });
    if (!vehicle) return FALLBACK;

    const nice = friendlyModel(vehicle.model, vehicle.manufacturer) || vehicle.model;
    const name = `${vehicle.manufacturer} ${nice} ${vehicle.year}`.trim();
    const title = `${name} למכירה | תעודת זהות לרכב — אוטולוג`;
    const description =
      'כל המידע על הרכב במקום אחד: נתונים רשמיים ממשרד התחבורה, היסטוריית טיפולים מתועדת ויצירת קשר ישירה עם המוכר.';
    const ogFile = path.join(process.cwd(), 'public', 'og-sale', `${params.token}.png`);
    const images = existsSync(ogFile)
      ? [{ url: `/og-sale/${params.token}.png`, width: 1200, height: 630 }]
      : undefined;

    return {
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: {
        title,
        description,
        url: `https://autolog.click/sale/${params.token}`,
        type: 'website',
        ...(images ? { images } : {}),
      },
    };
  } catch {
    return FALLBACK;
  }
}

export default function SalePage({ params }: { params: { token: string } }) {
  return <SaleClient token={params.token} />;
}
