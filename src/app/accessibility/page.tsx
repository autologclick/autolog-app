'use client';

import Link from 'next/link';
import { ArrowRight, Accessibility, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#1e3a5f] hover:opacity-80 transition">
            <ArrowRight size={20} />
            <span className="text-sm font-medium">חזרה לדף הבית</span>
          </Link>
          <Link href="/" className="text-xl font-bold text-[#1e3a5f]">
            Auto<span className="text-[#0d9488]">Log</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4">
            <Accessibility className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">הצהרת נגישות</h1>
          <p className="text-gray-500 text-sm">עדכון אחרון: פברואר 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-8 text-gray-700 leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              AutoLog בע&quot;מ פועלת להנגשת האפליקציה והשירותים הדיגיטליים שלה לאנשים עם מוגבלות,
              מתוך אמונה שלכל אדם מגיעה גישה שוויונית למידע ולשירותים. הנגשת האפליקציה
              נעשית בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות),
              התשע&quot;ג-2013, ובהתאם למסמך ההנחיות הבינלאומי WCAG 2.1 ברמה AA.
            </p>
          </section>

          {/* What we did */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">1. פעולות הנגשה שבוצעו</h2>
            <p className="mb-3">במסגרת מחויבותנו לנגישות, ביצענו את ההתאמות הבאות:</p>
            <ul className="space-y-3">
              {[
                'התאמה לקוראי מסך (Screen Readers) — שימוש בתגיות ARIA ובמבנה סמנטי תקין',
                'ניווט מלא באמצעות מקלדת — כל האזורים והפונקציות נגישים ללא עכבר',
                'ניגודיות צבעים — עמידה ביחסי ניגודיות מינימליים לקריאות טקסט',
                'טקסט חלופי לתמונות — כל התמונות כוללות תיאורים מילוליים',
                'מבנה כותרות היררכי — שימוש תקין בכותרות (H1-H6) לניווט קל',
                'התאמה למכשירים ניידים — עיצוב רספונסיבי המתאים לגדלי מסך שונים',
                'שפה ברורה — שימוש בעברית פשוטה ומובנת',
                'טפסים נגישים — תוויות (labels) מקושרות לשדות, הודעות שגיאה ברורות',
                'דילוג לתוכן הראשי — אפשרות לדלג ישירות לתוכן המרכזי',
                'תמיכה בהגדלת טקסט — האפליקציה תומכת בהגדלה עד 200% ללא אובדן תוכן',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#0d9488] mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Assistive tech */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">2. טכנולוגיות מסייעות</h2>
            <p className="mb-3">האפליקציה נבדקה ותומכת בטכנולוגיות המסייעות הבאות:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>קוראי מסך: NVDA, JAWS, VoiceOver (iOS/Mac), TalkBack (Android)</li>
              <li>דפדפנים: Chrome, Firefox, Safari, Edge (גרסאות עדכניות)</li>
              <li>מערכות הפעלה: Windows, macOS, iOS, Android</li>
              <li>ניווט מקלדת מלא בכל הדפדפנים הנתמכים</li>
            </ul>
          </section>

          {/* Keyboard nav */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">3. ניווט באמצעות מקלדת</h2>
            <p className="mb-3">ניתן לנווט באפליקציה באמצעות המקלדת:</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span>מעבר בין אלמנטים</span>
                <kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">Tab</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span>מעבר אחורה</span>
                <span><kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">Shift</kbd> + <kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">Tab</kbd></span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span>הפעלת כפתור / קישור</span>
                <kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">Enter</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span>סגירת חלון קופץ</span>
                <kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">Esc</kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>ניווט בתפריטים</span>
                <span><kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">↑</kbd> <kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">↓</kbd></span>
              </div>
            </div>
          </section>

          {/* Known limitations */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">4. מגבלות ידועות</h2>
            <p className="mb-3">
              אנו עושים מאמצים רבים להנגיש את כלל התכנים באפליקציה. עם זאת, ייתכנו רכיבים
              שטרם הונגשו באופן מלא. אנו ממשיכים לעבוד על שיפור הנגישות בכל עת.
              להלן מגבלות ידועות:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>חלק מהגרפים והתרשימים עשויים שלא להיות נגישים באופן מלא לקוראי מסך</li>
              <li>תוכן שנוצר על ידי משתמשים (כגון ביקורות) עשוי שלא לעמוד בתקני הנגישות</li>
              <li>מסמכי PDF שהועלו על ידי מוסכים שותפים עשויים שלא להיות מונגשים</li>
            </ul>
          </section>

          {/* Legal framework */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">5. מסגרת חוקית</h2>
            <p>
              הנגשת האפליקציה נעשית בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ&quot;ח-1998,
              ותקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע&quot;ג-2013.
              התקן הבינלאומי שאומץ הוא WCAG 2.1 ברמת AA (Web Content Accessibility Guidelines).
            </p>
          </section>

          {/* Browser zoom */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">6. שינוי גודל תצוגה</h2>
            <p>ניתן לשנות את גודל התצוגה בדפדפן באמצעות:</p>
            <div className="bg-gray-50 rounded-xl p-4 mt-3 space-y-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span>הגדלה</span>
                <span><kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">Ctrl</kbd> + <kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">+</kbd></span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span>הקטנה</span>
                <span><kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">Ctrl</kbd> + <kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">-</kbd></span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>איפוס</span>
                <span><kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">Ctrl</kbd> + <kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono">0</kbd></span>
              </div>
            </div>
          </section>

          {/* Feedback */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">7. משוב ופניות בנושא נגישות</h2>
            <p className="mb-4">
              נתקלתם בבעיית נגישות? אנחנו כאן לעזור. נשמח לקבל פניות ומשוב
              כדי לשפר את חוויית השימוש עבור כולם.
            </p>
            <div className="bg-blue-50 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-[#1e3a5f]">רכז/ת נגישות:</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-[#0d9488]" />
                  <span>דוא&quot;ל: </span>
                  <a href="mailto:info@autolog.click" className="text-[#0d9488] hover:underline">info@autolog.click</a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-[#0d9488]" />
                  <span>דוא&quot;ל כללי: </span>
                  <a href="mailto:info@autolog.click" className="text-[#0d9488] hover:underline">info@autolog.click</a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-[#0d9488]" />
                  <span>טלפון: 050-1234567</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-[#0d9488]" />
                  <span>כתובת: משה בקר 29, ראשון לציון</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              אנו מתחייבים להגיב לפניות נגישות תוך 14 ימי עסקים ולפעול לתיקון הליקוי בהקדם האפשרי.
            </p>
          </section>

          {/* Accessibility statement update */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">8. עדכון הצהרת הנגישות</h2>
            <p>
              הצהרת נגישות זו מתעדכנת מעת לעת בהתאם לשינויים באפליקציה ולשיפורי נגישות שמבוצעים.
              תאריך העדכון האחרון מופיע בראש העמוד.
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="flex justify-center gap-6 mt-8 text-sm">
          <Link href="/terms" className="text-[#0d9488] hover:underline font-medium">תנאי שימוש</Link>
          <span className="text-gray-300">|</span>
          <Link href="/privacy" className="text-[#0d9488] hover:underline font-medium">מדיניות פרטיות</Link>
        </div>
      </main>
    </div>
  );
}
