import type { Metadata } from 'next';
import prisma from '@/lib/db';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const inspection = await prisma.inspection.findUnique({
      where: { id },
      select: {
        date: true,
        inspectionType: true,
        overallScore: true,
        vehicle: {
          select: {
            manufacturer: true,
            model: true,
            year: true,
            licensePlate: true,
          },
        },
        garage: {
          select: { name: true },
        },
      },
    });

    if (!inspection) {
      return {
        title: 'דוח בדיקה לא נמצא',
        robots: { index: false, follow: false },
      };
    }

    const vehicleLabel = [
      inspection.vehicle.manufacturer,
      inspection.vehicle.model,
      inspection.vehicle.year,
    ].filter(Boolean).join(' ');

    const typeLabels: Record<string, string> = {
      pre_test: 'בדיקה לפני טסט',
      full: 'בדיקה מקיפה',
      basic: 'בדיקה בסיסית',
      pre_purchase: 'בדיקה לפני קנייה',
    };

    const typeLabel = typeLabels[inspection.inspectionType] || 'בדיקת רכב';
    const dateStr = new Date(inspection.date).toLocaleDateString('he-IL');
    const scoreStr = inspection.overallScore != null ? ` - ציון ${inspection.overallScore}` : '';

    const title = `${typeLabel} — ${vehicleLabel}`;
    const description = `דוח ${typeLabel} לרכב ${vehicleLabel}${scoreStr}. בוצע ב-${dateStr} ע"י ${inspection.garage.name}. צפו בתוצאות הבדיקה המלאות באפליקציית AutoLog.`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | AutoLog`,
        description,
        type: 'article',
        locale: 'he_IL',
        siteName: 'AutoLog',
        url: `https://autolog.click/inspection/${id}`,
      },
      twitter: {
        card: 'summary',
        title: `${title} | AutoLog`,
        description,
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  } catch {
    return {
      title: 'דוח בדיקת רכב',
      description: 'צפו בדוח בדיקת רכב מפורט באפליקציית AutoLog.',
    };
  }
}

export default function InspectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
