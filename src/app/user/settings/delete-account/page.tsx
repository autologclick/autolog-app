'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Loader2, Trash2 } from 'lucide-react';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError('');
    if (!email.trim()) {
      setError('יש להזין את כתובת הדוא"ל של החשבון');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        setTimeout(() => { window.location.href = '/'; }, 4000);
      } else {
        setError(data?.error || 'שגיאה במחיקת החשבון');
      }
    } catch {
      setError('שגיאת תקשורת. נסה שוב.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex flex-col items-center justify-center gap-4 px-6 text-center" dir="rtl">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
          <Trash2 className="text-green-600" size={30} />
        </div>
        <h1 className="text-2xl font-bold text-[#1B4E8A]">החשבון נמחק</h1>
        <p className="text-gray-600 max-w-md">
          החשבון והמידע האישי שלך נמחקו מהמערכת. מעבירים אותך לדף הבית...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] pb-16" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Link href="/user/settings" className="inline-flex items-center gap-2 text-[#1B4E8A] text-sm font-medium mb-6 hover:opacity-80">
          <ArrowRight size={18} />חזרה להגדרות
        </Link>

        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-center gap-3">
            <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-red-600" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-red-800">מחיקת חשבון</h1>
              <p className="text-sm text-red-600">פעולה זו אינה הפיכה</p>
            </div>
          </div>

          <div className="p-6 space-y-5 text-gray-700">
            <div>
              <p className="font-semibold text-gray-800 mb-2">מחיקת החשבון תמחק לצמיתות:</p>
              <ul className="space-y-1 list-disc list-inside text-sm">
                <li>את פרטי החשבון שלך</li>
                <li>את כל הרכבים שהוספת</li>
                <li>את היסטוריית הטיפולים, ההוצאות והמסמכים</li>
                <li>את כל <strong>תיעוד התאונות</strong>, לרבות התמונות והדוחות</li>
                <li>קישורי שיתוף שיצרת — יפסיקו לפעול מיידית</li>
              </ul>
            </div>

            <div className="bg-amber-50 border-r-4 border-amber-400 rounded-lg p-4 text-sm">
              <p className="font-semibold text-amber-900 mb-1">לפני שתמשיך</p>
              <p className="text-amber-800">
                אם יש לך תביעת ביטוח או הליך משפטי פתוח — ייצא והורד את דוח התאונה לפני המחיקה.
                לאחר המחיקה לא נוכל לשחזר אותו עבורך.
              </p>
            </div>

            <p className="text-sm text-gray-500">
              יומני אבטחה נשמרים בנפרד ללא פרטיך האישיים, כנדרש בתקנות הגנת הפרטיות (אבטחת מידע).
              עותקים בגיבויים המוצפנים נמחקים בתוך 30 יום.
            </p>

            <div className="pt-2 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                לאישור, הקלד את כתובת הדוא&quot;ל של החשבון שלך:
              </label>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 text-left"
                autoComplete="off"
              />
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={submit}
                disabled={busy || !email.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {busy ? <><Loader2 className="animate-spin" size={18} />מוחק...</> : <><Trash2 size={18} />מחק את החשבון לצמיתות</>}
              </button>
              <button
                onClick={() => router.push('/user/settings')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          שאלות? <a href="mailto:info@autolog.click" className="text-[#2E77D0] hover:underline">info@autolog.click</a>
        </p>
      </div>
    </div>
  );
}
