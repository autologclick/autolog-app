import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';
import { ogImageForPost } from '@/lib/blog/og';

const post = getPostBySlug('matzber-rechev-simanim')!;

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
            המצבר הוא החלק שהכי קל לשכוח — עד הבוקר שבו הרכב פשוט לא מתניע. הוא כמעט תמיד שולח סימני אזהרה לפני שהוא מת, ומי שמזהה אותם בזמן חוסך גרירה, איחור לעבודה ותשלום מנופח לשירות חירום. הנה מה שצריך לחפש.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">5 סימנים שהמצבר בדרך החוצה</h2>

          <h3 className="text-xl font-bold text-[#1B4E8A]">1. התנעה איטית ומאומצת</h3>
          <p>
            הסימן הקלאסי: המנוע מסתובב לאט יותר מהרגיל לפני שהוא נתפס, במיוחד בהתנעה ראשונה של הבוקר. אם זה קורה יותר מפעם-פעמיים בשבוע — המצבר מאבד כושר.
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">2. אורות נחלשים בהילוך סרק</h3>
          <p>
            פנסים או תאורת לוח מחוונים שמתעמעמים בעמידה וחוזרים להאיר חזק בהוספת גז — סימן שהמצבר לא מחזיק מתח.
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">3. נורית מצבר או תקלות חשמל אקראיות</h3>
          <p>
            נורית מצבר דולקת, חלונות חשמל איטיים, מולטימדיה שמתאתחלת — מערכות הרכב מרגישות את ירידת המתח לפניכם.
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">4. גיל 4-5 שנים</h3>
          <p>
            מצבר ממוצע בישראל מחזיק 4-6 שנים (פחות ברכב שעומד הרבה בשמש או נוסע נסיעות קצרות). לא זוכרים מתי הוחלף? כנראה שהגיע הזמן. תאריך הייצור מוטבע על המצבר עצמו.
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">5. קורוזיה על הקטבים</h3>
          <p>
            אבקה לבנה-ירקרקת על הקטבים פוגעת במעבר הזרם. ניקוי עוזר זמנית, אבל קורוזיה חוזרת היא לרוב סימן למצבר או לאלטרנטור בסוף הדרך.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">למה דווקא הקיץ הורג מצברים?</h2>
          <p>
            רוב האנשים מקשרים מצבר מת לחורף, אבל דווקא החום הישראלי הוא הרוצח האמיתי: טמפרטורות גבוהות מאדות את הנוזל בתוך המצבר ומאיצות קורוזיה פנימית. הנזק נעשה באוגוסט — והמצבר קורס בנובמבר, בבוקר הקר הראשון. מצבר בן 4+ שעבר קיץ קשה שווה בדיקה לפני החורף.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">כמה עולה מצבר חדש? מחירי 2026</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 my-6">
            <p className="font-bold text-amber-800 mb-2">טווחי מחירים כולל התקנה:</p>
            <div className="text-amber-700 text-sm space-y-1">
              <p>מצבר רגיל 60-72 אמפר: 350-650 ש"ח | מצבר קטן 44-50 אמפר: 300-450 ש"ח</p>
              <p>מצבר AGM/EFB לרכבי סטארט-סטופ: 900-1,800 ש"ח | קריאת שירות עד הבית: תוספת 100-200 ש"ח</p>
              <p className="font-bold pt-2">חשוב: ברכב עם מערכת סטארט-סטופ חובה מצבר AGM/EFB — מצבר רגיל יקרוס תוך חודשים.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">איך מאריכים את חיי המצבר?</h2>
          <ul className="list-disc pr-5 space-y-2">
            <li>נסיעות קצרות בלבד? עשו פעם בשבוע נסיעה רצופה של 20-30 דקות לטעינה מלאה.</li>
            <li>רכב שעומד שבועות? שקלו מטען שימור או ניתוק קוטב.</li>
            <li>ודאו שאורות ומולטימדיה כבויים כשהמנוע דומם.</li>
            <li>חנו בצל כשאפשר — חום הוא האויב מספר אחת.</li>
          </ul>

          <div className="bg-[#1B4E8A] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">מתי הוחלף המצבר שלכם?</h3>
            <p className="text-white/80 mb-5 text-sm">באוטולוג כל החלפה מתועדת עם תאריך ומחיר, ותקבלו תזכורת לפני שהמצבר הבא מזדקן — בחינם.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-cream-500 text-white font-bold rounded-xl hover:bg-cream-600 transition shadow-lg">
              התחילו לתעד בחינם
              <ArrowLeft size={16} />
            </Link>
          </div>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Article',
          headline: post.title, description: post.description,
          datePublished: post.publishedAt, dateModified: post.updatedAt || post.publishedAt,
          author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
          publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` },
        })}} />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog/mazgan-rechev-lo-mekarer" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            <ChevronRight size={14} />המזגן לא מקרר?
          </Link>
          <Link href="/blog/12-tipim-lechisachon-bedelek" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            חיסכון בדלק
            <ChevronLeft size={14} />
          </Link>
        </div>
      </article>

      <footer className="bg-[#1B4E8A] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
