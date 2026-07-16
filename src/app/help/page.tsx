import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Calendar, ChevronLeft, ChevronRight, BookOpen, Car, Wrench, Scan,
  Bell, MapPin, FileText, Gauge, Share2, Lightbulb, ChevronDown,
  Phone, MessageCircle, Mail,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

export const metadata: Metadata = {
  title: 'מדריך משתמש — AutoLog | איך להשתמש באפליקציה',
  description: '8 מדריכים קצרים שיעזרו לך להתחיל לנהל את הרכב שלך באמצעות AutoLog — הוספת רכב, תיעוד טיפול, סריקת קבלה, תזכורות אוטומטיות וקביעת תור למוסך.',
  keywords: ['מדריך AutoLog', 'איך להשתמש באוטולוג', 'מדריך משתמש', 'איך לנהל רכב', 'הוספת רכב לאפליקציה'],
  alternates: { canonical: '/help' },
  openGraph: {
    title: 'מדריך משתמש — AutoLog',
    description: '8 מדריכים שיעזרו לך להתחיל לנהל את הרכב שלך באמצעות AutoLog.',
    url: 'https://autolog.click/help',
    type: 'article',
    locale: 'he_IL',
    siteName: 'AutoLog',
    images: [{ url: '/og/help.png', width: 1200, height: 630, alt: 'מרכז העזרה של אוטולוג' }],
  },
};

interface Guide {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  estimatedTime: string;
  steps: Array<{ title: string; body: string }>;
  tip?: string;
  ctaUrl?: string;
  ctaLabel?: string;
}

const GUIDES: Guide[] = [
  {
    id: 'add-vehicle',
    title: '1. הוספת הרכב הראשון',
    description: 'הצעד הראשון אחרי ההרשמה — תוך 2 דקות הרכב שלך כבר במערכת עם כל הפרטים.',
    icon: Car,
    estimatedTime: '2 דקות',
    steps: [
      {
        title: 'היכנס לדף "הרכבים שלי"',
        body: 'אחרי ההרשמה, לחץ/י על "הרכבים שלי" בתפריט הצדדי, או על כפתור "הוסף רכב" שמופיע בעמוד הבית של האפליקציה.',
      },
      {
        title: 'בחר/י איך להוסיף',
        body: 'יש 2 דרכים: (א) סריקת רישיון רכב עם המצלמה — האפליקציה ממלאת את הפרטים אוטומטית; (ב) מילוי ידני של מספר רישוי, יצרן, דגם ושנה.',
      },
      {
        title: 'הוסף/הוסיפי תאריכי טסט וביטוח',
        body: 'אלה השדות הכי חשובים — מהם המערכת תדע לשלוח לך תזכורות לפני פקיעה. אם אתה לא יודע, אפשר לדלג ולהוסיף בהמשך.',
      },
      {
        title: 'שמור/שמרי',
        body: 'הרכב יופיע בדף "הרכבים שלי" עם תגית "פעיל". מכאן תוכל לראות את כל הפרטים, ההיסטוריה והתזכורות.',
      },
    ],
    tip: 'אם יש לך כמה רכבים, ניתן להוסיף את כולם. הראשון יסומן כ"רכב ראשי" — אפשר לשנות זאת בהגדרות הרכב.',
    ctaUrl: '/user/vehicles',
    ctaLabel: 'הוסף/הוסיפי רכב עכשיו',
  },
  {
    id: 'log-treatment',
    title: '2. תיעוד טיפול ידני',
    description: 'תיעוד כל טיפול שהרכב מקבל — חשוב להיסטוריה ולשמירת ערך הרכב.',
    icon: Wrench,
    estimatedTime: '1 דקה',
    steps: [
      {
        title: 'גש/י לדף "טיפולים"',
        body: 'בתפריט הצדדי לחץ/י על "טיפולים". תראה את כל ההיסטוריה של הרכב.',
      },
      {
        title: 'לחץ/י "הוסף טיפול חדש"',
        body: 'הכפתור הירוק בראש הדף. אם אין עדיין טיפולים, הוא מוצג במרכז הדף.',
      },
      {
        title: 'בחר/י סוג טיפול',
        body: 'יש 9 קטגוריות (תחזוקה, תיקון, החלפת שמן, צמיגים, בלמים, חשמל, מיזוג, פחחות, אחר). זה עוזר לחפש בהיסטוריה ולקבל תובנות AI.',
      },
      {
        title: 'מלא/מלאי את הפרטים',
        body: 'כותרת (לדוגמה: "טיפול 30K"), תיאור העבודה, שם המוסך (אופציונלי), עלות, ק״מ ברכב, תאריך.',
      },
      {
        title: 'שמור/שמרי',
        body: 'הטיפול יופיע ברשימה. בנוסף תיווצר אוטומטית הוצאה במעקב ההוצאות.',
      },
    ],
    tip: 'אם יש לך קבלה — דלג/י על המילוי הידני והשתמש/י בסריקת קבלה (המדריך הבא). חוסך 90% מהזמן.',
    ctaUrl: '/user/treatments',
    ctaLabel: 'גש/י לטיפולים',
  },
  {
    id: 'scan-receipt',
    title: '3. סריקת קבלה — AI ממלא הכל',
    description: 'צלם/צלמי קבלה מהמוסך — האפליקציה מזהה אוטומטית עלות, תאריך, סוג טיפול ויוצרת רשומה.',
    icon: Scan,
    estimatedTime: '30 שניות',
    steps: [
      {
        title: 'פתח/י "טיפולים" → "הוסף טיפול חדש"',
        body: 'בראש המודל תראה אזור כחול עם כפתורים "צלם קבלה" ו"העלה תמונה".',
      },
      {
        title: 'צלם/צלמי או העלה/העלי',
        body: 'בנייד — לחץ/י "צלם קבלה" כדי לצלם ישירות. במחשב — "העלה תמונה" כדי לבחור קובץ. ה-AI עובד הכי טוב על קבלות בעברית ברורות באור טוב.',
      },
      {
        title: 'בדוק/בדקי את הפרטים שהאפליקציה מילאה',
        body: 'תוך 5-10 שניות, השדות יתמלאו אוטומטית: שם המוסך, עלות, תאריך, סוג טיפול, ק״מ. עבור/עברי על הפרטים ותקן/י במידת הצורך.',
      },
      {
        title: 'שמור/שמרי',
        body: 'הקבלה נשמרת אוטומטית במסמכי הרכב, מקושרת להוצאה ולטיפול. גישה אליה מ"המסמכים שלי" בכל עת.',
      },
    ],
    tip: 'אם הסריקה לא הצליחה — אל תכעס/י על ה-AI. צלם/צלמי שוב מקרוב יותר, באור טוב, ועם הקבלה ישרה (לא מקופלת).',
    ctaUrl: '/user/treatments',
    ctaLabel: 'נסה/י לסרוק קבלה',
  },
  {
    id: 'reminders',
    title: '4. תזכורות אוטומטיות',
    description: 'איך עובדות התזכורות לפני פקיעת טסט/ביטוח — והאם אפשר לכבות.',
    icon: Bell,
    estimatedTime: '1 דקה לקריאה',
    steps: [
      {
        title: 'מתי תזכורות נשלחות',
        body: 'אוטומטית, 4 פעמים לכל אירוע: 30 ימים לפני הפקיעה, 14 ימים, 7 ימים, ויום לפני. ככה לא תפספס/י אף מועד.',
      },
      {
        title: 'באילו ערוצים',
        body: 'בכל פעם — מייל לכתובת הרשומה, התראה בתוך האפליקציה (NotificationBell), והתראת push לנייד (אם אישרת בכניסה הראשונה).',
      },
      {
        title: 'אילו אירועים מנוטרים',
        body: 'טסט שנתי (כולל חידוש רישיון רכב), ביטוח חובה, וביטוח מקיף. שלושתם בנפרד — אם רק אחד מתקרב לפקיעה, רק הוא יישלח.',
      },
      {
        title: 'איך לכבות תזכורות',
        body: 'הגדרות → העדפות התראות. אפשר לכבות סוג מסוים (למשל "תזכורת ביטוח") אם אתה מעדיף שלא תקבל. לא ניתן לכבות תזכורות יום לפני פקיעה — אלה קריטיות מדי.',
      },
    ],
    tip: 'הוסיפו את AutoLog לרשימת השולחים המאושרים במייל שלכם, כדי שהתזכורות לא יגיעו לספאם.',
    ctaUrl: '/user/settings',
    ctaLabel: 'נהל/נהלי העדפות',
  },
  {
    id: 'book-garage',
    title: '5. קביעת תור למוסך',
    description: 'איך לקבוע תור לאבחון/טיפול במוסך שותף — תוך פחות מ-2 דקות.',
    icon: MapPin,
    estimatedTime: '2 דקות',
    steps: [
      {
        title: 'גש/י ל"קבע תור"',
        body: 'בתפריט הצדדי, או דרך כפתור ה-CTA בדף הרכב. תראה רשימה של מוסכים שותפים באזור שלך.',
      },
      {
        title: 'סנן/סנני לפי מה שאתה צריך',
        body: 'אזור גיאוגרפי, סוג שירות (טסט, החלפת שמן, פחחות וכו׳), דירוג, מחיר ממוצע. החיפוש מציג את המוסכים הכי מתאימים בראש הרשימה.',
      },
      {
        title: 'בחר/י מוסך וצפה/צפי בזמנים פנויים',
        body: 'לוח שנה שמציג רק שעות שהמוסך באמת זמין. בחר/י תאריך + שעה שמתאים/ה לך.',
      },
      {
        title: 'אישר/י את התור',
        body: 'הטופס יבקש לוודא את הרכב, סוג השירות וכל הערה למוסך. אחרי שליחה — המוסך מקבל הודעה תוך 15 דקות לאשר.',
      },
      {
        title: 'קבל/י אישור',
        body: 'תקבל/י התראה (אפליקציה + מייל + push) ברגע שהמוסך מאשר. אם המוסך לא אישר תוך 15 דקות, התור מתבטל אוטומטית ואפשר לנסות אחר.',
      },
    ],
    tip: 'אם זה תור דחוף — חפש/י מוסך עם סימן "פנוי היום". אלה מוסכים שהתחייבו לאישור מהיר.',
    ctaUrl: '/user/book-garage',
    ctaLabel: 'קבע/קבעי תור',
  },
  {
    id: 'inspection-report',
    title: '6. דוח אבחון מקצועי',
    description: 'כשמוסך משלים אבחון — איך לקרוא את הדוח ומה לעשות עם הממצאים.',
    icon: FileText,
    estimatedTime: '2 דקות לקריאה',
    steps: [
      {
        title: 'מה זה אבחון מקצועי',
        body: 'בדיקה רחבה של הרכב שמוסך שותף מבצע — 30-50 פריטים נבדקים: מנוע, בלמים, מיזוג, פנסים ועוד. כל פריט מקבל ציון "תקין", "בעייתי" או "דורש החלפה". בסוף — ציון כללי מ-0 עד 100.',
      },
      {
        title: 'איפה לראות את הדוח',
        body: 'אחרי שהמוסך משלים את האבחון — תקבל/י התראה. לחיצה עליה (או דרך "האבחונים שלי") תפתח את הדוח המלא.',
      },
      {
        title: 'איך לקרוא',
        body: 'בראש הדף — ציון כללי וסיכום שכתוב AI. למטה — רשימת ממצאים מסודרת לפי קטגוריה. הדגשות אדומות = דורש טיפול דחוף. צהובות = מומלץ. ירוקות = תקין.',
      },
      {
        title: 'הורד/הורידי PDF',
        body: 'כפתור "הורדה" — מייצר PDF מקצועי שמתאים לשליחה לסוכן ביטוח, או למכירה של הרכב (קונים פוטנציאליים מעריכים את זה).',
      },
      {
        title: 'שתפ/י עם בני משפחה',
        body: 'כפתור "שתף" יוצר לינק קצר שאפשר לשלוח בוואטסאפ. הקישור פעיל למשך 14 ימים.',
      },
    ],
    tip: 'דוח אבחון מקצועי מ-AutoLog יכול להוסיף 5-10% לערך הרכב במכירה — קונים אוהבים שקיפות.',
    ctaUrl: '/user/reports',
    ctaLabel: 'צפה/צפי באבחונים שלך',
  },
  {
    id: 'mileage-update',
    title: '7. עדכון קילומטראז׳',
    description: 'למה חשוב לעדכן ק״מ באופן קבוע — ומה האפליקציה עושה עם זה.',
    icon: Gauge,
    estimatedTime: '30 שניות',
    steps: [
      {
        title: 'איפה לעדכן',
        body: 'בדף הרכב, ליד שדה "ק״מ נוכחי" — לחץ/י על העיפרון. או דרך טיפול חדש — שדה ק״מ יעדכן את הרכב אוטומטית.',
      },
      {
        title: 'תדירות מומלצת',
        body: 'פעם בחודש מספיק. אם אתה מתעד טיפולים — זה קורה אוטומטית בכל פעם.',
      },
      {
        title: 'מה האפליקציה עושה עם המידע',
        body: '(א) שמירת היסטוריה לערך הרכב במכירה. (ב) חישוב כמה נסעת בחודש/שנה. (ג) צפי לטיפול הבא (10K/20K/30K) — בעתיד יישלחו תזכורות מבוססות ק״מ.',
      },
    ],
    tip: 'לא ניתן להזין ק״מ נמוך מהקריאה הקודמת — זו הגנה מטעויות. אם הקריאה האחרונה שגויה, פנה/י לתמיכה.',
    ctaUrl: '/user/vehicles',
    ctaLabel: 'עדכן/עדכני ק״מ',
  },
  {
    id: 'share-vehicle',
    title: '8. שיתוף רכב עם בן/בת משפחה',
    description: 'איך לתת לבן זוג, ילד או הורה גישה לנהל את הרכב יחד איתך.',
    icon: Share2,
    estimatedTime: '1 דקה',
    steps: [
      {
        title: 'גש/י לדף הרכב',
        body: 'הרכבים שלי → הרכב הספציפי → גלול/גללי למטה לאזור "שיתוף".',
      },
      {
        title: 'הזן/הזיני אימייל',
        body: 'הקלד/י את כתובת המייל של מי שאתה רוצה לשתף איתו. הוא חייב להיות רשום ב-AutoLog (או יקבל מייל הזמנה).',
      },
      {
        title: 'בחר/י הרשאות',
        body: '"צפייה בלבד" — יכול לראות פרטים, היסטוריה ותזכורות. "ניהול מלא" — יכול להוסיף טיפולים, לעדכן ק״מ ולקבוע תורים.',
      },
      {
        title: 'שלח/י',
        body: 'המקבל יקבל הודעת מייל + התראה באפליקציה (אם כבר רשום). הוא יוכל לאשר או לדחות. עד לאישור — אין לו גישה.',
      },
    ],
    tip: 'אתה תמיד נשאר הבעלים הראשי. אפשר להסיר גישה בכל עת מאותו אזור שיתוף.',
    ctaUrl: '/user/vehicles',
    ctaLabel: 'שתף/שתפי רכב',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FA]" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-l from-[#1B4E8A] to-[#1D5FAF] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition">
            <Logo size="sm" />
          </Link>
          <Link href="/" className="text-sm text-white/70 hover:text-white transition flex items-center gap-1">
            <ChevronRight size={14} />
            חזרה לאתר
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-l from-[#1B4E8A] to-[#1D5FAF] text-white pb-16 pt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">מדריך משתמש</h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
            8 מדריכים קצרים שיעזרו לך להתחיל לנהל את הרכב שלך עם AutoLog. כל מדריך תוך 1-2 דקות.
          </p>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8 mb-12">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#1B4E8A] mb-4">
            <BookOpen size={18} />
            במדריך הזה
          </h2>
          <ol className="grid sm:grid-cols-2 gap-2 text-sm">
            {GUIDES.map((g) => (
              <li key={g.id}>
                <a
                  href={`#${g.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F3F6FA] transition group"
                >
                  <g.icon size={14} className="text-teal-600 flex-shrink-0" />
                  <span className="text-gray-700 group-hover:text-teal-700 truncate">{g.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Guides */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 space-y-8">
        {GUIDES.map((guide, idx) => (
          <article
            key={guide.id}
            id={guide.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-20"
          >
            {/* Guide Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <guide.icon size={24} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#1B4E8A] mb-1 leading-tight">
                    {guide.title}
                  </h2>
                  <p className="text-sm text-gray-500 mb-2 leading-relaxed">{guide.description}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={12} />
                    {guide.estimatedTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Steps */}
            <ol className="px-6 py-6 space-y-5">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 bg-[#F3F6FA] border-2 border-teal-600 rounded-full flex items-center justify-center text-sm font-bold text-teal-700">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Tip */}
            {guide.tip && (
              <div className="mx-6 mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Lightbulb size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-relaxed">
                  <span className="font-semibold">טיפ:</span> {guide.tip}
                </p>
              </div>
            )}

            {/* CTA */}
            {guide.ctaUrl && guide.ctaLabel && (
              <div className="mx-6 mb-6">
                <Link
                  href={guide.ctaUrl}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition shadow-sm"
                >
                  {guide.ctaLabel}
                  <ChevronLeft size={16} />
                </Link>
              </div>
            )}
          </article>
        ))}

        {/* Final CTA — Direct contact methods (works for both logged-in
            and anonymous visitors — no auth required) */}
        <div className="bg-gradient-to-l from-[#1B4E8A] to-[#1D5FAF] rounded-3xl p-6 sm:p-10 text-white">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold mb-3">לא מצאת תשובה?</h2>
            <p className="text-white/80 max-w-md mx-auto leading-relaxed">
              הצוות שלנו כאן בשבילך. בחר/י איך נוח לך לפנות אלינו.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Phone */}
            <a
              href="tel:0535266741"
              className="bg-white/10 hover:bg-white/15 transition rounded-2xl p-4 text-center border border-white/15"
            >
              <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Phone size={20} className="text-white" />
              </div>
              <div className="font-bold mb-0.5">טלפון</div>
              <div className="text-xs text-white/70 mb-2">א׳-ה׳ 08:00-18:00</div>
              <div className="text-sm font-semibold" dir="ltr">053-526-6741</div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/972535266741"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500/20 hover:bg-green-500/30 transition rounded-2xl p-4 text-center border border-green-400/30"
            >
              <div className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <MessageCircle size={20} className="text-white" />
              </div>
              <div className="font-bold mb-0.5">וואטסאפ</div>
              <div className="text-xs text-white/70 mb-2">מענה מהיר בצ׳אט</div>
              <div className="text-sm font-semibold" dir="ltr">053-526-6741</div>
            </a>

            {/* Email */}
            <a
              href="mailto:info@autolog.click"
              className="bg-white/10 hover:bg-white/15 transition rounded-2xl p-4 text-center border border-white/15"
            >
              <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Mail size={20} className="text-white" />
              </div>
              <div className="font-bold mb-0.5">אימייל</div>
              <div className="text-xs text-white/70 mb-2">מענה תוך 24 שעות</div>
              <div className="text-sm font-semibold break-all">info@autolog.click</div>
            </a>
          </div>
        </div>
      </section>

      {/* HowTo Schema.org markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': GUIDES.map((g) => ({
              '@type': 'HowTo',
              '@id': `https://autolog.click/help#${g.id}`,
              name: g.title,
              description: g.description,
              totalTime: g.estimatedTime,
              step: g.steps.map((s, i) => ({
                '@type': 'HowToStep',
                position: i + 1,
                name: s.title,
                text: s.body,
              })),
            })),
          }),
        }}
      />

      {/* Footer */}
      <footer className="bg-[#1B4E8A] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
