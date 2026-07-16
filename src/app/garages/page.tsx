import { prisma } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מוסכים מומלצים | אוטולוג',
  description: 'מצא את המוסך הטוב ביותר לרכב שלך. מוסכים שותפי אוטולוג בכל הארץ — דירוגים אמיתיים, שירותים, וקביעת תור אונליין.',
  alternates: { canonical: 'https://autolog.click/garages' },
};
export const revalidate = 300;

function parseServices(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a.filter((s) => typeof s === 'string') : []; }
  catch { return []; }
}

export default async function GaragesPage() {
  const garages = await prisma.garage.findMany({
    where: { isActive: true, isPartner: true },
    orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
    select: { id: true, name: true, city: true, phone: true, rating: true, reviewCount: true, services: true, description: true, imageUrl: true },
  });

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1B4E8A] mb-3">מוסכים מומלצים</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            כל המוסכים שותפי אוטולוג — דירוגים אמיתיים, שירותים, וקביעת תור אונליין
          </p>
        </header>

        {garages.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-xl mb-4">בקרוב — מוסכים נוספים בכל הארץ</p>
            <Link href="/garage-apply" className="inline-block mt-4 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition">
              בעל מוסך? הצטרף אלינו
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {garages.map((g) => {
              const services = parseServices(g.services as string | null);
              return (
                <Link key={g.id} href={`/garages/${g.id}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100 overflow-hidden block">
                  {g.imageUrl ? (
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.imageUrl} alt={g.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-[#1B4E8A] to-teal-600 flex items-center justify-center text-white text-6xl">🔧</div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h2 className="text-xl font-bold text-[#1B4E8A] group-hover:text-teal-600 transition">{g.name}</h2>
                      {g.rating ? (
                        <div className="flex items-center gap-1 text-sm shrink-0 mt-1">
                          <span className="text-amber-500">★</span>
                          <span className="font-semibold">{g.rating.toFixed(1)}</span>
                          <span className="text-gray-400">({g.reviewCount || 0})</span>
                        </div>
                      ) : null}
                    </div>
                    {g.city ? <p className="text-sm text-gray-600 mb-1">📍 {g.city}</p> : null}
                    {g.phone ? <p className="text-sm text-gray-600">📞 {g.phone}</p> : null}
                    {services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {services.slice(0, 4).map((s, i) => (
                          <span key={i} className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                      <span className="text-teal-600 font-semibold group-hover:underline">צפה בפרטים</span>
                      <span className="text-gray-400">←</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center bg-gradient-to-r from-[#1B4E8A] to-teal-700 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">בעל מוסך?</h2>
          <p className="mb-4 text-white/90">הצטרף לאוטולוג והגיע ללקוחות חדשים</p>
          <Link href="/garage-apply" className="inline-block bg-white text-[#1B4E8A] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition">
            הגש בקשה
          </Link>
        </div>
      </div>
    </div>
  );
}
