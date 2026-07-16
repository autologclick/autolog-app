import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';
import { ogImageForPost } from '@/lib/blog/og';

const post = getPostBySlug('bituach-rechev-makif-eich-bocharim')!;

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
  twitter: { card: 'summary_large_image', title: post.title, description: post.description },
};

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FA]" dir="rtl">
      <header className="bg-gradient-to-l from-[#1B4E8A] to-[#1D5FAF] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition"><Logo size="sm" /></Link>
          <Link href="/blog" className="text-sm text-white/70 hover:text-white transition flex items-center gap-1"><ChevronRight size={14} />חזרה לבלוג</Link>
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
            ביטוח רכב מקיף הוא לרוב ההוצאה הביטוחית הגדולה ביותר על הרכב — בין 3,000 ל-9,000 ש&quot;ח לשנה לרכב משפחתי, ועד 15,000 ש&quot;ח לרכבי יוקרה. בחירה נכונה יכולה לחסוך לכם אלפי שקלים ולהבטיח כיסוי מלא במקרה תאונה. במאמר נסביר את כל מה שצריך לדעת לבחור פוליסה חכם.
          </p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">מה זה ביטוח רכב מקיף?</h2>
          <p>
            ביטוח מקיף הוא ביטוח רשות (לא חובה) שמכסה <strong>נזק לרכב שלכם</strong> + <strong>נזק לצד שלישי</strong> + לרוב גם שירותים נלווים (גרירה, רכב חלופי, שבר זכוכית).
          </p>
          <p>בניגוד ל<Link href="/blog/bituach-rechev-chova-madrich-male-2026" className="text-teal-600 hover:text-teal-700 underline">ביטוח חובה</Link> שמכסה רק נזק גוף, מקיף מכסה גם:</p>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>תאונות שאתם גרמתם או נגרמתם</li>
            <li>גנבה (גם של חלקי רכב)</li>
            <li>שריפה</li>
            <li>נזקי טבע (סופה, שיטפון)</li>
            <li>נזקי ונדליזם</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">סוגי ביטוח רכב — קצר וברור</h2>
          <ol className="list-decimal list-inside space-y-2 mr-4">
            <li><strong>חובה</strong> — חובה חוקית, מכסה נזק גוף בלבד</li>
            <li><strong>צד ג&apos;</strong> — מכסה רק נזק לצד שלישי. מתאים לרכבים ישנים</li>
            <li><strong>צד ג&apos; מורחב</strong> — מוסיף שבר זכוכית וגנבה</li>
            <li><strong>מקיף</strong> — מכסה הכל. הכי מומלץ לרכבים חדשים יחסית (עד 10 שנים)</li>
          </ol>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">על מה לשים לב בפוליסה</h2>

          <h3 className="text-xl font-bold text-[#1B4E8A]">1. השתתפות עצמית</h3>
          <p>הסכום שאתם משלמים מכיסכם בכל מקרה. בדרך כלל 1,500-3,000 ש&quot;ח. פוליסה זולה לרוב = השתתפות גבוהה.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">2. ערך הרכב</h3>
          <p>במקרה אובדן מוחלט (טוטל לוס), כמה תקבלו? וודאו שזה ערך השוק (מחירון יד2 / לוי יצחק) ולא נמוך יותר.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">3. מי יכול לנהוג ברכב?</h3>
          <p>פוליסה לנהג יחיד = זול. רחב יותר (כל בני המשפחה / כל נהג) = יקר יותר. בחרו לפי השימוש בפועל.</p>

          <h3 className="text-xl font-bold text-[#1B4E8A]">4. שירותים נלווים</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>גרירה</strong> — חיוני! בלי זה תתעצבנו בעת תקלה</li>
            <li><strong>רכב חלופי</strong> — חשוב אם אין לכם איך להגיע לעבודה בלי רכב</li>
            <li><strong>שבר זכוכית</strong> — נפוץ. שווה לכלול</li>
            <li><strong>הגנה משפטית</strong> — אם תיכנסו להליך משפטי</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1B4E8A]">5. מנגנון התביעה</h3>
          <p>קראו ביקורות על החברה. חברה זולה אבל קמצנית בתביעות = כאב ראש. חברות גדולות (הראל, מגדל, כלל, הפניקס, ביטוח ישיר) לרוב מהירות יותר.</p>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">כמה עולה ביטוח מקיף 2026?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>רכב משפחתי בן 5-10 שנים:</strong> 3,500-6,000 ש&quot;ח</li>
            <li><strong>רכב חדש משפחתי:</strong> 5,000-9,000 ש&quot;ח</li>
            <li><strong>רכב יוקרה:</strong> 6,000-15,000 ש&quot;ח</li>
            <li><strong>רכב היברידי/חשמלי:</strong> 4,500-9,000 ש&quot;ח</li>
            <li><strong>רכב ישן (מעל 12 שנים):</strong> לרוב לא משתלם — שקלו צד ג&apos;</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">איך לחסוך אלפי שקלים</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>השוו כל שנה</strong> — Wobi, ביטוח ישיר, וכל סוכן יציג מחירים שונים</li>
            <li><strong>הגדילו השתתפות עצמית</strong> ב-1,000 ש&quot;ח = חיסכון של 300-600 ש&quot;ח לשנה</li>
            <li><strong>אל תכללו נהגים שלא נוהגים</strong></li>
            <li><strong>הוסיפו אמצעי מיגון</strong> (מולטי-לוק, איתוראן) → הנחה</li>
            <li><strong>שלמו שנתי</strong> — הנחה של 3-5% לעומת חודשי</li>
            <li><strong>הצהירו על קילומטראז&apos; נמוך</strong> אם רלוונטי</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">סימני אזהרה — איזה ביטוח לא לקנות</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>חברה לא מוכרת או חדשה — חכו לראות ביקורות</li>
            <li>מחיר שמדהים מדי בזול — לרוב יש &quot;חורים&quot; בכיסוי</li>
            <li>ללא שירותים נלווים בסיסיים</li>
            <li>השתתפות עצמית מעל 4,000 ש&quot;ח</li>
            <li>תקופת המתנה ארוכה לפני שהפוליסה תקפה</li>
          </ul>

          <div className="bg-[#1B4E8A] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">אל תשכחו לחדש את הביטוח</h3>
            <p className="text-white/80 mb-5 text-sm">AutoLog שולחת תזכורת חודש לפני שהביטוח פג. צילום אחד של הפוליסה — והכל אוטומטי.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-cream-500 text-white font-bold rounded-xl hover:bg-cream-600 transition shadow-lg">הרשמה בחינם<ArrowLeft size={16} /></Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1B4E8A] pt-4">שאלות נפוצות</h2>
          <h3 className="text-lg font-bold text-[#1B4E8A]">לרכב חדש — חובה לקחת מקיף?</h3>
          <p>חובה לא, אבל חכם כן. רכב חדש בשווי 100,000+ ש&quot;ח ראוי שיהיה מבוטח מקיף.</p>

          <h3 className="text-lg font-bold text-[#1B4E8A]">לרכב ישן (15+) — מקיף שווה?</h3>
          <p>בדרך כלל לא. ערך הרכב נמוך, ועלות הביטוח לא משתלמת. צד ג&apos; עדיף.</p>

          <h3 className="text-lg font-bold text-[#1B4E8A]">איך מוכיחים מקרה ביטוח?</h3>
          <p>תיעוד! צלם הכל בזירת התאונה, אסוף פרטי הצד השני, פנה למשטרה במקרה הצורך, ותעדו ב-AutoLog.</p>

          <h3 className="text-lg font-bold text-[#1B4E8A]">מה זה השתתפות עצמית?</h3>
          <p>הסכום שאתם משלמים מכיסכם לפני שהביטוח מתחיל לכסות. אם השתתפות 2,000 ש&quot;ח ונזק 5,000 ש&quot;ח — אתם משלמים 2,000, הביטוח 3,000.</p>

          <h3 className="text-lg font-bold text-[#1B4E8A]">תאונה ראשונה — תמיד מעלה את הביטוח?</h3>
          <p>לא תמיד. חלק מהחברות מציעות &quot;תאונה ראשונה ללא קנס&quot; — בדקו אם יש לכם.</p>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Article', headline: post.title, description: post.description, datePublished: post.publishedAt, author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` } },
            { '@type': 'FAQPage', mainEntity: [
              { '@type': 'Question', name: 'מה זה השתתפות עצמית בביטוח?', acceptedAnswer: { '@type': 'Answer', text: 'הסכום שאתם משלמים מכיסכם לפני שהביטוח מתחיל לכסות. בדרך כלל 1,500-3,000 ש"ח.' } },
              { '@type': 'Question', name: 'לרכב חדש חובה ביטוח מקיף?', acceptedAnswer: { '@type': 'Answer', text: 'לא חובה חוקית, אבל חכם — רכב חדש בשווי 100,000+ ש"ח ראוי לכיסוי מקיף.' } },
              { '@type': 'Question', name: 'איך לחסוך על ביטוח רכב?', acceptedAnswer: { '@type': 'Answer', text: 'השוו מחירים כל שנה, הגדילו השתתפות עצמית, הוסיפו מיגון, ושלמו שנתי במקום חודשי.' } },
            ] },
          ],
        }) }} />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition"><ChevronRight size={14} />כל המאמרים</Link>
          <Link href="/blog/rechev-chashmali-o-hibridi-2026" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">חשמלי או היברידי — מה לבחור<ChevronLeft size={14} /></Link>
        </div>
      </article>

      <footer className="bg-[#1B4E8A] text-white/60 py-6 text-center text-sm"><p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p></footer>
    </div>
  );
}
