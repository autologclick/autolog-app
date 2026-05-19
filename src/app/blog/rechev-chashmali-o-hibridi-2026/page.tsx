import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getPostBySlug } from '@/lib/blog/posts';

const post = getPostBySlug('rechev-chashmali-o-hibridi-2026')!;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  keywords: post.keywords,
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: { title: post.title, description: post.description, url: `https://autolog.click/blog/${post.slug}`, type: 'article', publishedTime: post.publishedAt, authors: [post.author], locale: 'he_IL', siteName: 'AutoLog' },
  twitter: { card: 'summary_large_image', title: post.title, description: post.description },
};

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-[#fef7ed]" dir="rtl">
      <header className="bg-gradient-to-l from-[#1e3a5f] to-[#2a5a8f] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition"><Logo size="sm" /></Link>
          <Link href="/blog" className="text-sm text-white/70 hover:text-white transition flex items-center gap-1"><ChevronRight size={14} />חזרה לבלוג</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full mb-4">{post.category}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e3a5f] leading-tight mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
          <span className="flex items-center gap-1"><Calendar size={14} />{new Date(post.publishedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><Clock size={14} />{post.readingTime}</span>
          <span>מאת {post.author}</span>
        </div>

        <div className="prose-rtl space-y-6 text-gray-700 leading-relaxed text-[15px]">
          <p className="text-lg text-gray-600 font-medium">
            רכב חשמלי או היברידי? זו השאלה הכי נפוצה ב-2026 בקרב קוני רכבים בישראל. שתי הטכנולוגיות מציעות חיסכון בדלק, אבל הן מאוד שונות. במאמר תמצאו השוואה מלאה — עלויות, נסיעה, תחזוקה, ומה הכי מתאים לכם.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מה ההבדל בין רכב חשמלי להיברידי?</h2>
          <p>
            <strong>רכב חשמלי (BEV)</strong> — מונע 100% ע&quot;י סוללה. אין מנוע בנזין/דיזל. נטענים מחשמל. לדוגמה: Tesla, Nissan Leaf, Hyundai Ioniq 5, BYD.
          </p>
          <p>
            <strong>רכב היברידי (HEV)</strong> — משלב מנוע בנזין + מנוע חשמלי קטן + סוללה קטנה. מתדלקים בדלק רגיל. לדוגמה: Toyota Prius, Toyota Corolla Hybrid, Honda CR-V.
          </p>
          <p>
            <strong>היברידי נטען (PHEV)</strong> — סוג ביניים: סוללה גדולה יותר שאפשר לטעון, אבל גם מנוע בנזין לגיבוי. לדוגמה: BMW 530e, Mitsubishi Outlander PHEV.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">השוואה: מה עדיף?</h2>

          <h3 className="text-xl font-bold text-[#1e3a5f]">💰 עלות רכישה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>חשמלי:</strong> 130,000-300,000 ש&quot;ח. אבל זוכים להטבת מס משמעותית</li>
            <li><strong>היברידי:</strong> 110,000-220,000 ש&quot;ח. מס דומה לבנזין</li>
            <li><strong>מנצח:</strong> היברידי (זול יותר ברוב המקרים)</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">⛽ עלות נסיעה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>חשמלי:</strong> ~5-15 אגורות לק&quot;מ (טעינה ביתית)</li>
            <li><strong>היברידי:</strong> ~30-45 אגורות לק&quot;מ</li>
            <li><strong>בנזין רגיל (להשוואה):</strong> ~50-70 אגורות לק&quot;מ</li>
            <li><strong>מנצח:</strong> חשמלי (חיסכון של 70-80% לעומת בנזין)</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">🔧 עלות תחזוקה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>חשמלי:</strong> נמוכה מאוד. אין שמן מנוע, אין מסנני אוויר רבים, פחות חלקים נעים</li>
            <li><strong>היברידי:</strong> דומה לבנזין רגיל. תחזוקה רגילה</li>
            <li><strong>מנצח:</strong> חשמלי (חיסכון של 30-50%)</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">🚗 טווח נסיעה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>חשמלי:</strong> 250-500 ק&quot;מ בטעינה (תלוי בדגם)</li>
            <li><strong>היברידי:</strong> 800-1,200 ק&quot;מ בטנק (כמו בנזין)</li>
            <li><strong>מנצח:</strong> היברידי לטיולים ארוכים</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">⚡ זמן תדלוק/טעינה</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>חשמלי:</strong> 30 דקות (מטען מהיר) או 6-8 שעות (טעינה ביתית)</li>
            <li><strong>היברידי:</strong> 5 דקות בתחנת דלק</li>
            <li><strong>מנצח:</strong> היברידי</li>
          </ul>

          <h3 className="text-xl font-bold text-[#1e3a5f]">🌱 השפעה סביבתית</h3>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li><strong>חשמלי:</strong> אפס פליטות בנהיגה. אם החשמל ממקור ירוק — אקולוגי לחלוטין</li>
            <li><strong>היברידי:</strong> פולט פחות פחמן מבנזין רגיל ב-30-40%</li>
            <li><strong>מנצח:</strong> חשמלי</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">למי מתאים חשמלי?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>נוסעים בעיקר בעיר (מתחת ל-200 ק&quot;מ ביום)</li>
            <li>יש להם חניה פרטית עם אפשרות להתקין מטען ביתי</li>
            <li>נוסעים הרבה (מעל 20,000 ק&quot;מ בשנה) — החיסכון בדלק מצדיק</li>
            <li>אכפת להם מהסביבה</li>
            <li>יכולים להרשות לעצמם השקעה ראשונית גבוהה</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">למי מתאים היברידי?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>נוסעים גם בעיר וגם בכבישים בין-עירוניים</li>
            <li>אין חניה פרטית/לא רוצים להתעסק עם טעינה</li>
            <li>רוצים גמישות מלאה לטיולים ארוכים</li>
            <li>רוצים חיסכון בדלק אבל בלי לעבור 100% חשמלי</li>
            <li>תקציב מוגבל יותר</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">חישוב כדאיות אישי</h2>
          <p>חשבון פשוט: כמה אתם נוסעים בחודש?</p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>פחות מ-1,000 ק&quot;מ בחודש:</strong> היברידי משתלם יותר (חיסכון בעלות הרכישה מצדיק)</li>
            <li><strong>1,000-1,500 ק&quot;מ:</strong> שווה (תלוי במחיר)</li>
            <li><strong>מעל 1,500 ק&quot;מ:</strong> חשמלי משתלם משמעותית</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">מצב הטעינה בישראל 2026</h2>
          <p>
            <strong>בית:</strong> אם יש לכם חניה פרטית — מטען ביתי עולה 4,000-7,000 ש&quot;ח כולל התקנה. טוען בכל לילה ועולה 30-50 ש&quot;ח לטעינה מלאה.
          </p>
          <p>
            <strong>ציבורי:</strong> רשת EVgo, אלקטרה, פז Power מתפרסות. עלות 1.5-2.5 ש&quot;ח לקוט&quot;ש (יקר יותר מהבית). מטענים מהירים בכבישים מהירים.
          </p>
          <p>
            <strong>חיסרון:</strong> בלי חניה פרטית — חשמלי פחות נוח. תהיו תלויים במטענים ציבוריים.
          </p>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">דברים שצריך לזכור על סוללה</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>סוללה של רכב חשמלי <strong>מתבלה עם השנים</strong>. אחרי 8-10 שנים — לרוב 70-80% מהקיבולת המקורית</li>
            <li>החלפת סוללה — 30,000-80,000 ש&quot;ח (יקר!)</li>
            <li>אחריות יצרן על סוללה: לרוב 8 שנים / 160,000 ק&quot;מ</li>
            <li>בהיברידי — סוללה קטנה יותר, קל וזול יותר להחליף (5,000-15,000 ש&quot;ח)</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">המסקנה — למי לבחור מה?</h2>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>אם יש לכם חניה פרטית + הרבה נסיעות עירוניות:</strong> חשמלי</li>
            <li><strong>אם אין חניה פרטית:</strong> היברידי</li>
            <li><strong>אם נוסעים הרבה בכבישים בין-עירוניים:</strong> היברידי או PHEV</li>
            <li><strong>אם תקציב מוגבל:</strong> היברידי</li>
            <li><strong>אם אכפת מהסביבה ויש תקציב:</strong> חשמלי</li>
          </ul>

          <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 my-8 text-center">
            <h3 className="text-xl font-bold mb-3">ניהול רכב חשמלי או היברידי</h3>
            <p className="text-white/80 mb-5 text-sm">AutoLog תומכת בקטגוריית &quot;טעינה&quot; להוצאות, ועוקבת אחרי תזכורות תחזוקה ספציפיות לחשמליים. חינם.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition shadow-lg">הרשמה בחינם<ArrowLeft size={16} /></Link>
          </div>

          <h2 className="text-2xl font-bold text-[#1e3a5f] pt-4">שאלות נפוצות</h2>
          <h3 className="text-lg font-bold text-[#1e3a5f]">אפשר לטעון רכב חשמלי משקע ביתי רגיל?</h3>
          <p>אפשר אבל איטי מאוד (12-24 שעות). מומלץ להתקין מטען Wallbox.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">מה קורה אם הסוללה נגמרה באמצע נסיעה?</h3>
          <p>גרירה לתחנת טעינה הקרובה. רוב הביטוחים המקיפים כוללים גרירה.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">האם משלמים אגרת רכב פחות על חשמלי?</h3>
          <p>כן. אגרת רישוי נמוכה משמעותית, ופטור ממס קנייה (חלקית) עד 2026.</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">כמה זה עולה לטעון רכב מלא בבית?</h3>
          <p>30-60 ש&quot;ח (תלוי בקיבולת הסוללה ובמחיר החשמל המקומי).</p>

          <h3 className="text-lg font-bold text-[#1e3a5f]">היברידי או היברידי נטען?</h3>
          <p>נטען (PHEV) יקר יותר ב-30-50 אלף ש&quot;ח אבל חוסך בדלק יותר. רק אם יש מטען ביתי שווה.</p>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Article', headline: post.title, description: post.description, datePublished: post.publishedAt, author: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, publisher: { '@type': 'Organization', name: 'AutoLog', url: 'https://autolog.click' }, mainEntityOfPage: { '@type': 'WebPage', '@id': `https://autolog.click/blog/${post.slug}` } },
            { '@type': 'FAQPage', mainEntity: [
              { '@type': 'Question', name: 'מה ההבדל בין רכב חשמלי להיברידי?', acceptedAnswer: { '@type': 'Answer', text: 'חשמלי מונע 100% ע"י סוללה ונטען מחשמל. היברידי משלב מנוע בנזין עם מנוע חשמלי קטן ומתדלק בדלק רגיל.' } },
              { '@type': 'Question', name: 'כמה עולה לטעון רכב חשמלי בבית?', acceptedAnswer: { '@type': 'Answer', text: '30-60 ש"ח לטעינה מלאה, בהתאם לקיבולת הסוללה ולמחיר החשמל.' } },
              { '@type': 'Question', name: 'למי מתאים חשמלי?', acceptedAnswer: { '@type': 'Answer', text: 'נוסעים בעיר, יש חניה פרטית למטען ביתי, ונוסעים הרבה (מעל 1,500 ק"מ בחודש).' } },
            ] },
          ],
        }) }} />

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition"><ChevronRight size={14} />כל המאמרים</Link>
          <Link href="/blog/hachlafat-shemen-rechev-mechir-2026" className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 transition">החלפת שמן רכב — מחירים<ChevronLeft size={14} /></Link>
        </div>
      </article>

      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm"><p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p></footer>
    </div>
  );
}
