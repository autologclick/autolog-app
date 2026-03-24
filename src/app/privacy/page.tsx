'use client';

import Link from 'next/link';
import { ArrowRight, Shield, FileText } from 'lucide-react';

export default function PrivacyPage() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0d9488]/10 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-[#0d9488]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">מדיניות פרטיות</h1>
          <p className="text-gray-500 text-sm">עדכון אחרון: פברואר 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-8 text-gray-700 leading-relaxed">

          <p className="text-gray-600">
            AutoLog בע&quot;מ (&quot;אנחנו&quot;, &quot;שלנו&quot;, &quot;AutoLog&quot;) מחויבת להגנה על פרטיות המשתמשים.
            מדיניות פרטיות זו מתארת כיצד אנו אוספים, משתמשים, ומגנים על המידע האישי שלך.
          </p>

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">1. מידע שאנו אוספים</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">מידע שנמסר על ידך:</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>פרטים אישיים: שם מלא, כתובת דוא&quot;ל, מספר טלפון</li>
                  <li>פרטי רכב: מספר רכב, יצרן, דגם, שנת ייצור</li>
                  <li>פרטי מוסך (למוסכים שותפים): שם העסק, כתובת, שירותים</li>
                  <li>מידע על תשלומים (מעובד על ידי צד שלישי מאובטח)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">מידע שנאסף אוטומטית:</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>כתובת IP ומידע על הדפדפן</li>
                  <li>נתוני שימוש באפליקציה</li>
                  <li>מידע על המכשיר</li>
                  <li>קובצי Cookie ומזהים דומים</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">2. שימוש במידע</h2>
            <p className="mb-3">אנו משתמשים במידע שנאסף למטרות הבאות:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>הפעלה ושיפור שירותי האפליקציה</li>
              <li>ניהול חשבון המשתמש</li>
              <li>עיבוד הזמנות ותשלומים</li>
              <li>שליחת עדכונים, תזכורות ומידע רלוונטי</li>
              <li>שיפור חוויית המשתמש</li>
              <li>מניעת הונאות ושמירה על אבטחת המערכת</li>
              <li>עמידה בדרישות חוקיות</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">3. שיתוף מידע</h2>
            <p className="mb-3">אנו עשויים לשתף מידע עם:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>מוסכים שותפים</strong> — מידע הכרחי לביצוע שירותים שהוזמנו</li>
              <li><strong>ספקי שירות</strong> — חברות המסייעות לנו בהפעלת השירות (אחסון, תשלומים, אנליטיקה)</li>
              <li><strong>רשויות חוק</strong> — במקרים הנדרשים על פי חוק</li>
            </ul>
            <p className="mt-3 font-medium text-gray-800">אנו לא מוכרים מידע אישי לצדדים שלישיים.</p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">4. אבטחת מידע</h2>
            <p className="mb-3">אנו נוקטים באמצעים מתקדמים להגנה על המידע שלך:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>הצפנת נתונים בהעברה ובאחסון</li>
              <li>בקרות גישה מחמירות</li>
              <li>ניטור ובקרת אבטחה שוטפים</li>
              <li>גיבויים מאובטחים</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">5. זכויות המשתמש</h2>
            <p className="mb-3">בהתאם לחוק הגנת הפרטיות, עומדות לך הזכויות הבאות:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>זכות עיון</strong> — לצפות במידע האישי שלך</li>
              <li><strong>זכות תיקון</strong> — לעדכן מידע לא מדויק</li>
              <li><strong>זכות מחיקה</strong> — לבקש מחיקת המידע שלך</li>
              <li><strong>זכות הגבלה</strong> — להגביל את עיבוד המידע</li>
              <li><strong>זכות התנגדות</strong> — להתנגד לעיבוד מסוים של המידע</li>
            </ul>
            <p className="mt-3">לממוש זכויותיך, ניתן לפנות אלינו בכתובת: <a href="mailto:info@autolog.click" className="text-[#0d9488] hover:underline">info@autolog.click</a></p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">6. שמירת מידע</h2>
            <p>
              אנו שומרים מידע אישי כל עוד החשבון פעיל או כנדרש לצורך מתן השירותים.
              מידע עשוי להישמר לתקופה נוספת בהתאם לדרישות חוקיות, חשבונאיות, או לצורך יישוב מחלוקות.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">7. העברת מידע בינלאומית</h2>
            <p>
              מידע עשוי להיות מאוחסן ומעובד בשרתים מחוץ לישראל. במקרים כאלה, אנו מוודאים
              שרמת ההגנה על הפרטיות תהיה בהתאם לדרישות החוק הישראלי.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">8. קובצי Cookie</h2>
            <p className="mb-3">אנו משתמשים בקובצי Cookie ובטכנולוגיות דומות לצורך:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>שמירת העדפות המשתמש</li>
              <li>אימות וזיהוי משתמשים</li>
              <li>ניתוח שימוש ושיפור השירות</li>
              <li>אבטחת המערכת</li>
            </ul>
            <p className="mt-3">ניתן לנהל את העדפות ה-Cookie דרך הגדרות הדפדפן.</p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">9. קטינים</h2>
            <p>
              שירותי AutoLog מיועדים למשתמשים מעל גיל 18. איננו אוספים ביודעין מידע מקטינים.
              אם נגלה כי נאסף מידע של קטין, נפעל למחיקתו לאלתר.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">10. שינויים במדיניות</h2>
            <p>
              אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באפליקציה
              ו/או ישלחו בהתראה למשתמשים. המשך השימוש לאחר העדכון מהווה הסכמה למדיניות המעודכנת.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">11. יצירת קשר</h2>
            <p className="mb-2">לשאלות או בקשות בנושא פרטיות:</p>
            <ul className="space-y-1">
              <li><strong>דוא&quot;ל לענייני פרטיות:</strong> <a href="mailto:info@autolog.click" className="text-[#0d9488] hover:underline">info@autolog.click</a></li>
              <li><strong>דוא&quot;ל כללי:</strong> <a href="mailto:info@autolog.click" className="text-[#0d9488] hover:underline">info@autolog.click</a></li>
              <li><strong>כתובת:</strong> משה בקר 29, ראשון לציון</li>
            </ul>
          </section>
        </div>

        {/* Footer link to terms */}
        <div className="text-center mt-8">
          <Link href="/terms" className="inline-flex items-center gap-2 text-[#0d9488] hover:underline font-medium">
            <FileText size={16} />
            תנאי שימוש
          </Link>
        </div>
      </main>
    </div>
  );
}
