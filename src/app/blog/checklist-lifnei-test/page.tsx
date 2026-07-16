import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';
import { ogImageForPost } from '@/lib/blog/og';

const post = getPostBySlug('checklist-lifnei-test')!;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  keywords: post.keywords,
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    title: post.title,
    description: post.description,
    url: `https://autolog.click/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.publishedAt,
    authors: [post.author],
    locale: 'he_IL',
    siteName: 'אוטולוג',
    images: ogImageForPost(post.slug),
  },
};

const checklistItems = [
  {
    title: 'תאורה',
    items: [
      'פנסים קדמיים (גבוה + נמוך) — בודקים שניהם דולקים',
      'פנסים אחוריים — בלימה, חנייה, איתות',
      'תאורת לוחית רישוי — חייבת להאיר',
      'מגבים — ניקוי ופעולה תקינה',
    ],
  },
  {
    title: 'בלמים וצמיגים',
    items: [
      'רפידות בלמים — לא שחוקות (מינימום 2 מ"מ)',
      'דיסקים — ללא סדקים או עיוותים',
      'צמיגים — עומק חריצים מינימלי 1.6 מ"מ',
      'לחץ אוויר — לפי המלצת היצרן',
      'גלגל חילוף — קיים ותקין + מפתח גלגלים',
    ],
  },
  {
    title: 'מנוע ונוזלים',
    items: [
      'שמן מנוע — ברמה תקינה',
      'מים למצנן — ברמה מלאה',
      'נוזל בלמים — ברמה תקינה',
      'נוזל מגבים — מלא',
      'אין נזילות שמן מתחת לרכב',
    ],
  },
  {
    title: 'בטיחות',
    items: [
      'חגורות בטיחות — כל החגורות פועלות ונסגרות',
      'משולש אזהרה — קיים ונגיש',
      'אפוד זוהר — קיים ברכב',
      'מטף כיבוי — בתוקף (לא חובה אבל מומלץ)',
      'מראות — ללא סדקים, מתכווננות',
    ],
  },
  {
    title: 'כללי',
    items: [
      'שמשות — ללא סדקים בשדה הראייה',
      'צופר — פועל',
      'מנעולים — כל הדלתות נפתחות ונסגרות',
      'פליטה — ללא רעשים חריגים או עשן שחור',
      'ניקיון הרכב — רכב נקי מבפנים ומבחוץ (מומלץ)',
    ],
  },
];

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FA]" dir="rtl">
      <header className="bg-gradient-to-l from-[#1B4E8A] to-[#1D5FAF] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition"><Logo size="sm" /></Link>
          <Link href="/blog" className="text-sm text-white/70 hover:text-white transition flex items-center gap-1">
            <ChevronRight size={14} />חזרה לבלוג
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full mb-4">{post.category}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B4E8A] leading-tight mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
          <span className="flex items-center gap-1"><Calendar size={14} />{new Date(post.publishedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><Clock size={14} />{post.readingTime}</span>
        </div>

        <div className="prose-rtl space-y-6 text-gray-700 leading-relaxed text-[15px]">
          <p className="text-lg text-gray-600 font-medium">
            הטסט מתקרב ואתם לא בטוחים שהרכב מוכן? הנה רשימת בדיקות מלאה שתעזור לכם לעבור את הטסט בפעם הראשונה — בלי הפתעות.
          </p>

          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 my-4">
            <p className="font-bold text-teal-800 mb-1">למה זה חשוב?</p>
            <p className="text-teal-700 text-sm">
              כ-30% מהרכבים נכשלים בטסט בפעם הראשונה. רובם על דברים קטנים שאפשר היה לתקן מראש — נורה שרופה, צמיג שחוק, או מגב קרוע. בדיקה של 15 דקות לפני הטסט יכולה לחסוך לכם מאות שקלים ויום עבודה.
            </p>
          </div>

          {checklistItems.map((section, i) => (
            <div key={section.title}>
              <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 font-bold text-sm">{i + 1}</span>
                {section.title}
              </h2>
              <div className="space-y-2 mt-3">
                {section.items.map((item) => (
                  <div key={item} className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-100">
                    <CheckCircle2 size={18} className="text-gray-300 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 my-6">
            <p className="font-bold text-amber-800 mb-2">טיפ חשוב</p>
            <p className="text-amber-700 text-sm">
              אם מצאתם תקלה — תקנו אותה לפני הטסט. עלות תיקון נורה שרופה: 40-80 ש&quot;ח.
              עלות כישלון בטסט + בדיקה חוזרת: 130-180 ש&quot;ח + עוד יום חופש מהעבודה.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">מה AutoLog עושה בשבילכם?</h2>
          <p>
            ב-AutoLog, המערכת שולחת תזכורת 30 יום לפני הטסט — מספיק זמן לבדוק את הרכב, לתקן מה שצריך, ולקבוע תור למכון רישוי.
            ככה מגיעים לטסט מוכנים, בלי לחץ, ועוברים בפעם הראשונה.
          </p>

          <div className="bg-[#1B4E8A] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">אל תפספסו את הטסט הבא</h3>
            <p className="text-white/80 mb-5 text-sm">הצטרפו ל-AutoLog וקבלו תזכורת חודש לפני — עם מספיק זמן להתכונן.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-cream-500 text-white font-bold rounded-xl hover:bg-cream-600 transition shadow-lg">
              הרשמה בחינם
              <ArrowLeft size={16} />
            </Link>
          </div>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Article',
          headline: post.title, description: post.description,
          datePublished: post.publishedAt,
          author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
          publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` },
        })}} />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog/kama-ole-rechev-bachodesh" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            <ChevronRight size={14} />כמה עולה רכב בחודש?
          </Link>
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            כל המאמרים
          </Link>
        </div>
      </article>

      <footer className="bg-[#1B4E8A] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
