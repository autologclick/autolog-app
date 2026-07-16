import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';
import { ogImageForPost } from '@/lib/blog/og';

const post = getPostBySlug('matai-hatest-shel-harechev-sheli')!;

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
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
};

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FA]" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-l from-[#1B4E8A] to-[#1D5FAF] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition">
            <Logo size="sm" />
          </Link>
          <Link href="/blog" className="text-sm text-white/70 hover:text-white transition flex items-center gap-1">
            <ChevronRight size={14} />
            חזרה לבלוג
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Category */}
        <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full mb-4">
          {post.category}
        </span>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B4E8A] leading-tight mb-4">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {new Date(post.publishedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {post.readingTime}
          </span>
          <span>מאת {post.author}</span>
        </div>

        {/* Content */}
        <div className="prose-rtl space-y-6 text-gray-700 leading-relaxed text-[15px]">
          <p className="text-lg text-gray-600 font-medium">
            כל בעל רכב בישראל מכיר את הרגע הזה — פתאום נזכרים שהטסט עומד לפוג, ואין מושג מתי בדיוק התאריך.
            במדריך הזה נסביר בדיוק איך לבדוק מתי הטסט של הרכב שלך, כמה זה עולה, ואיך להימנע מלפספס את המועד.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">מה זה בכלל טסט?</h2>
          <p>
            הטסט (מבחן שנתי לרכב) הוא בדיקה חובה שכל רכב בישראל חייב לעבור בכל שנה כדי לחדש את רישיון הרכב.
            הבדיקה כוללת בדיקת בלמים, תאורה, פליטות, מערכת היגוי, צמיגים, ועוד. ללא טסט בתוקף, הרכב לא מורשה לנסוע על הכביש ואתם חשופים לקנסות ולביטול ביטוח.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">איך בודקים מתי הטסט של הרכב שלי?</h2>
          <p>
            יש כמה דרכים לבדוק את תאריך הטסט:
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">1. רישיון הרכב</h3>
          <p>
            הדרך הפשוטה ביותר — הסתכלו על רישיון הרכב (הכרטיסייה). תאריך התוקף מופיע בצד הקדמי.
            אם הרישיון פג — הרכב צריך טסט לפני חידוש.
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">2. אתר משרד התחבורה</h3>
          <p>
            באתר gov.il אפשר להזין מספר רישוי ולקבל את תאריך הטסט הבא. השירות חינמי ופתוח לכולם.
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">3. AutoLog — תזכורת אוטומטית</h3>
          <p>
            ב-AutoLog אתם מוסיפים את הרכב פעם אחת — והמערכת מתזכרת אתכם אוטומטית לפני שהטסט פג.
            גם על ביטוח, גם על טיפול תקופתי. בלי לזכור כלום בעצמכם.
          </p>

          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 my-6">
            <p className="font-bold text-teal-800 mb-2">טיפ מ-AutoLog</p>
            <p className="text-teal-700 text-sm">
              ניתן לבצע את הטסט עד 30 יום לפני תאריך התפוגה ללא אובדן ימים. כלומר, אם הטסט פג ב-1 בספטמבר, אפשר לעשות אותו כבר ב-2 באוגוסט והטסט הבא עדיין יהיה ב-1 בספטמבר של השנה הבאה.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">כמה עולה טסט לרכב?</h2>
          <p>
            עלות הטסט הבסיסי לרכב פרטי ב-2026 נעה בין <strong>220-300 שקלים</strong>, תלוי במכון הרישוי ובאזור הגיאוגרפי (במכונים פרטיים בגוש דן עד 360 ש&quot;ח). אם הרכב נכשל ודורש בדיקה חוזרת, העלות סביב 130-180 שקלים.
            לרכבי 4x4 / SUV — 320-420 ש&quot;ח. למסחרי קל — 300-400 ש&quot;ח. שווה להשוות בין מכונים.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">מה קורה אם הטסט פג ואני ממשיך לנסוע?</h2>
          <p>
            נהיגה ללא טסט בתוקף היא עבירה. הקנס על נהיגה ללא טסט הוא מאות שקלים, וזה עלול לגרום לביטול כיסוי ביטוחי.
            במקרה של תאונה ללא טסט בתוקף, חברת הביטוח עלולה לסרב לכסות את הנזקים. פשוט לא שווה את הסיכון.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">איך לא לפספס את הטסט — אף פעם?</h2>
          <p>
            הדרך הכי בטוחה היא להשתמש בתזכורות אוטומטיות. ב-AutoLog, ברגע שמוסיפים את הרכב, המערכת:
          </p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>מזהה אוטומטית את תאריך הטסט הבא</li>
            <li>שולחת תזכורת 30 יום לפני — כדי שתספיקו לקבוע תור</li>
            <li>שולחת תזכורת נוספת 7 ימים לפני — תזכורת אחרונה</li>
            <li>עוקבת גם אחרי ביטוח, טיפולים תקופתיים, ורישיון נהיגה</li>
          </ul>

          <div className="bg-[#1B4E8A] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">לעולם לא תפספסו טסט שוב</h3>
            <p className="text-white/80 mb-5 text-sm">הצטרפו בחינם ל-AutoLog וקבלו תזכורות אוטומטיות על טסט, ביטוח וטיפולים.</p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg"
            >
              הרשמה בחינם
              <ArrowLeft size={16} />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">שאלות נפוצות</h2>

          <h3 className="text-lg font-bold text-[#1B4E8A]">האם אפשר לעשות טסט בכל מכון רישוי?</h3>
          <p>כן, אפשר לעשות טסט בכל מכון רישוי מורשה בארץ, לא חייבים ללכת לאחד ספציפי.</p>

          <h3 className="text-lg font-bold text-[#1B4E8A]">כמה זמן לוקח הטסט?</h3>
          <p>הבדיקה עצמה לוקחת בין 20-40 דקות. עם זמן המתנה, כדאי לתכנן כשעה-שעתיים.</p>

          <h3 className="text-lg font-bold text-[#1B4E8A]">מה לקחת איתי לטסט?</h3>
          <p>רישיון רכב, תעודת ביטוח חובה בתוקף, ואישור על תשלום אגרת רישוי. את הרכב כדאי להביא נקי.</p>
        </div>

        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: post.title,
              description: post.description,
              datePublished: post.publishedAt,
              dateModified: post.updatedAt || post.publishedAt,
              author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
              publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
              mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` },
            }),
          }}
        />

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            <ChevronRight size={14} />
            כל המאמרים
          </Link>
          <Link href="/blog/kama-ole-rechev-bachodesh" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            כמה עולה הרכב בחודש?
            <ChevronLeft size={14} />
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-[#1B4E8A] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
