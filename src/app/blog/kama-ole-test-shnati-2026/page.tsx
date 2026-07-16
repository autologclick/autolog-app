import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';
import { ogImageForPost } from '@/lib/blog/og';

const post = getPostBySlug('kama-ole-test-shnati-2026')!;

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
          <span>מאת {post.author}</span>
        </div>

        <div className="prose-rtl space-y-6 text-gray-700 leading-relaxed text-[15px]">
          <p className="text-lg text-gray-600 font-medium">
            מבחן הרישוי השנתי, או בעברית פשוטה — &quot;טסט&quot;, הוא חובה חוקית לכל רכב בישראל. אבל המחיר הסופי שתשלם משתנה משמעותית
            לפי סוג הרכב, גילו, מיקום מכון הבדיקה, ואפילו לפי השעה שבה תגיע. במאמר הזה תמצא את כל המחירים המעודכנים ל-2026,
            את אגרת הרישוי, ואת הדרכים החוקיות לחסוך.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">מחיר טסט לרכב פרטי 2026</h2>
          <p>
            לרכב פרטי שמשקלו עד 3,500 ק&quot;ג, המחיר הממוצע בטסט במכוני בדיקה ברחבי הארץ נע בין <strong>220 ל-300 שקלים</strong>
            (ללא אגרת הרישוי). ההבדלים נובעים מאזור גיאוגרפי, רמת השירות במכון, ושעות העבודה.
            המחיר עלה משמעותית בשנים האחרונות, ובמכונים פרטיים גדולים בגוש דן הוא יכול להגיע ל-320-360 ש&quot;ח.
          </p>
          <p>
            <strong>טיפ לחיסכון:</strong> מכוני בדיקה בפריפריה (באר שבע, חיפה, אזור הצפון) מציעים בדרך כלל מחירים נמוכים יותר ב-10-20% ממכונים בגוש דן.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">מחיר טסט לסוגי רכב שונים</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>רכב פרטי:</strong> 220-300 ש&quot;ח (במרכז עד 360)</li>
            <li><strong>רכב מסחרי קל (עד 3,500 ק&quot;ג):</strong> 300-400 ש&quot;ח</li>
            <li><strong>רכב מסחרי בינוני וכבד:</strong> 550-850 ש&quot;ח</li>
            <li><strong>ג&apos;יפ ורכב 4x4:</strong> 320-420 ש&quot;ח</li>
            <li><strong>אופנוע:</strong> 180-240 ש&quot;ח</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">אגרת רישוי 2026 — הסכום שמתחבר לטסט</h2>
          <p>
            בנוסף למחיר הטסט במכון, חובה לשלם את <strong>אגרת הרישוי השנתית</strong> למשרד התחבורה.
            הסכום מחושב לפי דירוג זיהום, מנוע ומחיר הרכב. טווחים נפוצים:
          </p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>רכב פרטי קטן (עד 1,300 סמ&quot;ק): 1,300-1,800 ש&quot;ח</li>
            <li>רכב משפחתי (1,400-2,000 סמ&quot;ק): 1,800-2,800 ש&quot;ח</li>
            <li>רכב יוקרה / SUV: 3,000-7,000 ש&quot;ח</li>
            <li>רכב היברידי / חשמלי: זכאים להנחה באגרה (השיעור מתעדכן משנה לשנה — מומלץ לבדוק את הסכום העדכני באתר משרד התחבורה)</li>
          </ul>

          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 my-6">
            <p className="font-bold text-teal-800 mb-2">חשוב לדעת</p>
            <p className="text-teal-700 text-sm">
              האגרה משתנה כל שנה. אפשר לבדוק את הסכום המדויק לרכב באתר משרד התחבורה לפני התשלום.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">4 טיפים לחיסכון אמיתי</h2>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li><strong>הזמן תור מראש</strong> — מכונים רבים מציעים הנחות של 10-15% להזמנות אונליין מראש</li>
            <li><strong>בדוק את הרכב בעצמך לפני</strong> — תיקון מנורת בלם שבורה (50-80 ש&quot;ח) במקום בדיקה חוזרת בטסט (120-180 ש&quot;ח)</li>
            <li><strong>אל תדחה</strong> — איחור בחידוש הרישיון גורר קנסות שמתחילים בכ-450 ש&quot;ח</li>
            <li><strong>שמור את כל הקבלות</strong> — תזדקק להן לטיפול בתביעות ביטוח עתידיות</li>
          </ol>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">איך תזכור מתי הטסט הבא?</h2>
          <p>
            הסכנה האמיתית בטסט היא לא המחיר — אלא לשכוח אותו. רישיון רכב פג גורר עיקול הרכב, קנס של מאות שקלים,
            ואחריות פלילית במקרה של תאונה. במקום להסתמך על הזיכרון או על מכתב מהדואר שיגיע (או שלא),
            הדרך החכמה היא להגדיר תזכורת אוטומטית.
          </p>

          <div className="bg-[#1B4E8A] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">לא לפספס שוב — תזכורת אוטומטית</h3>
            <p className="text-white/80 mb-5 text-sm">
              AutoLog שולחת לך תזכורת חודש לפני, שבוע לפני, ויום לפני שהטסט פג. רישום פעם אחת — והכל פועל לבד.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-cream-500 text-white font-bold rounded-xl hover:bg-cream-600 transition shadow-lg">
              הרשמה בחינם<ArrowLeft size={16} />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">שאלות נפוצות</h2>

          <h3 className="text-lg font-bold text-[#1B4E8A]">האם אפשר לעשות טסט באיחור?</h3>
          <p>
            לא — לאחר תפוגת תוקף הרישיון, הרכב אינו רשאי לנסוע על הכביש. במצב כזה צריך להוביל את הרכב בגרירה למכון הבדיקה. בנוסף ייגבו קנסות איחור על חידוש הרישיון, שמתחילים בכ-450 ש&quot;ח.
          </p>

          <h3 className="text-lg font-bold text-[#1B4E8A]">מי פטור מטסט שנתי?</h3>
          <p>רכב חדש פטור מטסט בשלוש השנים הראשונות. לאחר מכן הטסט הופך לחובה שנתית.</p>

          <h3 className="text-lg font-bold text-[#1B4E8A]">מה קורה אם לא עוברים את הטסט?</h3>
          <p>
            תקבלו &quot;תיקון מותנה&quot; — תצטרכו לתקן את הליקוי תוך 30 יום ולחזור לטסט (חיוב של כמחצית המחיר).
            אם לא תחזרו, הרישיון יבוטל.
          </p>

          <h3 className="text-lg font-bold text-[#1B4E8A]">האם אפשר לשלם את האגרה בתשלומים?</h3>
          <p>כן, ניתן לשלם בכרטיס אשראי בתשלומים דרך אתר משרד התחבורה, ללא ריבית.</p>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Article',
                  headline: post.title,
                  description: post.description,
                  datePublished: post.publishedAt,
                  dateModified: post.updatedAt || post.publishedAt,
                  author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
                  publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
                  mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` },
                },
                {
                  '@type': 'FAQPage',
                  mainEntity: [
                    { '@type': 'Question', name: 'האם אפשר לעשות טסט באיחור?', acceptedAnswer: { '@type': 'Answer', text: 'כן, לאחר תפוגת תוקף הרישיון, הרכב אינו רשאי לנסוע על הכביש. צריך להוביל אותו בגרירה למכון הבדיקה. ייגבו קנסות איחור על חידוש הרישיון, שמתחילים בכ-450 ש"ח.' } },
                    { '@type': 'Question', name: 'מי פטור מטסט שנתי?', acceptedAnswer: { '@type': 'Answer', text: 'רכב חדש פטור מטסט בשלוש השנים הראשונות.' } },
                    { '@type': 'Question', name: 'מה קורה אם לא עוברים את הטסט?', acceptedAnswer: { '@type': 'Answer', text: 'תקבלו תיקון מותנה - תצטרכו לתקן את הליקוי תוך 30 יום ולחזור לטסט.' } },
                  ],
                },
              ],
            }),
          }}
        />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            <ChevronRight size={14} />כל המאמרים
          </Link>
          <Link href="/blog/checklist-lifnei-test" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            צ&apos;קליסט לפני הטסט<ChevronLeft size={14} />
          </Link>
        </div>
      </article>

      <footer className="bg-[#1B4E8A] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
