import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';
import { ogImageForPost } from '@/lib/blog/og';

const post = getPostBySlug('mazgan-rechev-lo-mekarer')!;

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
            בשיא הקיץ הישראלי, מזגן שלא מקרר הוא לא רק עניין של נוחות — בפקק של אוגוסט עם ילדים מאחור זה עניין של בריאות. החדשות הטובות: ברוב המקרים מדובר בתקלה זולה יחסית. הנה כל מה שכדאי לדעת לפני שנוסעים למוסך.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">למה המזגן לא מקרר? הסיבות הנפוצות</h2>

          <h3 className="text-xl font-bold text-[#1B4E8A]">חוסר גז קירור — הסיבה הנפוצה ביותר</h3>
          <p>
            מערכת מיזוג מאבדת באופן טבעי 10-15% מגז הקירור בשנה, גם בלי שום תקלה. אחרי 3-4 שנים בלי מילוי, הקירור נחלש משמעותית. אם המזגן מקרר קצת אבל לא כמו פעם — זה החשוד הראשון. מילוי גז עולה 250-450 ש"ח, אבל חשוב: אם הגז נגמר תוך חודשים ספורים ממילוי קודם — יש דליפה, ומילוי חוזר בלי איתור הדליפה הוא זריקת כסף.
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">פילטר מזגן סתום</h3>
          <p>
            פילטר תא הנוסעים אוסף אבק, עלים ופיח. כשהוא סתום, זרימת האוויר נחלשת גם כשהקירור תקין — מרגישים אוויר קר אבל חלש. החלפה עולה 80-150 ש"ח, וברוב הרכבים אפשר אפילו להחליף לבד (הפילטר יושב מאחורי תא הכפפות). מומלץ להחליף פעם בשנה, רצוי לפני הקיץ.
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">קונדנסר מלוכלך</h3>
          <p>
            הקונדנסר (המעבה) יושב מקדימה ליד הרדיאטור וסופג אבק, חול וזבובים. כשהוא מלוכלך, פיזור החום נפגע והקירור נחלש — במיוחד בעמידה בפקק. ניקוי בלחץ מים עדין עולה 150-300 ש"ח ולפעמים מחזיר את המזגן לחיים.
          </p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">תקלת קומפרסור — התרחיש היקר</h3>
          <p>
            אם המזגן מפסיק לקרר לגמרי, נשמעים רעשים חריגים בהפעלה, או שהמצמד לא נתפס — ייתכן שהקומפרסור בדרך החוצה. זו התקלה היקרה: החלפה עולה 1,500-4,000 ש"ח תלוי בדגם. לפני שמאשרים החלפה, שווה לוודא שהאבחון כלל בדיקת לחצים ולא רק ניחוש.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">מה אפשר לבדוק לבד לפני המוסך?</h2>
          <ul className="list-disc pr-5 space-y-2">
            <li>הפעילו מנוע ומזגן על עוצמה מלאה ל-5 דקות — אם האוויר קר בנסיעה אבל נחלש בעמידה, כנראה קונדנסר או מאוורר.</li>
            <li>בדקו את פילטר המזגן (מאחורי תא הכפפות ברוב הדגמים) — אם הוא אפור-שחור, החליפו.</li>
            <li>הקשיבו לקליק של מצמד הקומפרסור בהפעלת ה-AC — אין קליק? ייתכן חוסר גז או תקלה חשמלית.</li>
            <li>ריח עובש בהפעלה? זה אידוי (מאייד) שצריך חיטוי — 150-250 ש"ח.</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">כמה זה עולה? מחירי 2026</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 my-6">
            <p className="font-bold text-amber-800 mb-2">טווחי מחירים מקובלים:</p>
            <div className="text-amber-700 text-sm space-y-1">
              <p>מילוי גז: 250-450 ש"ח | פילטר מזגן: 80-150 ש"ח | חיטוי מערכת: 150-250 ש"ח</p>
              <p>ניקוי קונדנסר: 150-300 ש"ח | איתור דליפה: 200-400 ש"ח | קומפרסור: 1,500-4,000 ש"ח</p>
              <p className="font-bold pt-2">טיפ: מילוי גז שני תוך שנה = לדרוש בדיקת דליפות לפני שמשלמים שוב.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">איך שומרים על המזגן?</h2>
          <ul className="list-disc pr-5 space-y-2">
            <li>הפעילו את המזגן 10 דקות גם בחורף — זה משמן את האטמים ומונע דליפות.</li>
            <li>החליפו פילטר מזגן פעם בשנה, רצוי באביב.</li>
            <li>דקה לפני סוף הנסיעה כבו את הקירור והשאירו מאוורר — זה מייבש את המאייד ומונע ריחות.</li>
          </ul>

          <div className="bg-[#1B4E8A] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">כל הטיפולים של הרכב במקום אחד</h3>
            <p className="text-white/80 mb-5 text-sm">אוטולוג שומרת את היסטוריית הטיפולים, מזכירה מתי הטיפול הבא ועוקבת אחרי כל ההוצאות — בחינם.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-cream-500 text-white font-bold rounded-xl hover:bg-cream-600 transition shadow-lg">
              התחילו בחינם
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
          <Link href="/blog/matzber-rechev-simanim" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            <ChevronRight size={14} />סימנים למצבר חלש
          </Link>
          <Link href="/blog/kama-ole-rechev-bachodesh" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">
            כמה עולה הרכב בחודש?
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
