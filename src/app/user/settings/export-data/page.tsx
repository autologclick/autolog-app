'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, Loader2, FileJson } from 'lucide-react';

export default function ExportDataPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/user/export');
      if (!res.ok) {
        setError('שגיאה בייצוא המידע. נסה שוב או פנה אלינו.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autolog-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('שגיאת תקשורת. נסה שוב.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] pb-16" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Link href="/user/settings" className="inline-flex items-center gap-2 text-[#1B4E8A] text-sm font-medium mb-6 hover:opacity-80">
          <ArrowRight size={18} />חזרה להגדרות
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-5 flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileJson className="text-[#2E77D0]" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1B4E8A]">ייצוא המידע שלי</h1>
              <p className="text-sm text-gray-500">זכות עיון לפי חוק הגנת הפרטיות</p>
            </div>
          </div>

          <div className="p-6 space-y-5 text-gray-700">
            <p>הורדת קובץ עם כל המידע שנשמר עליך במערכת:</p>
            <ul className="space-y-1 list-disc list-inside text-sm">
              <li>פרטי החשבון שלך</li>
              <li>הרכבים, נתוני הטסט והביטוח</li>
              <li>היסטוריית טיפולים, הוצאות ומסמכים</li>
              <li>תיעוד תאונות ואירועי חירום</li>
              <li>תורים, התראות ויומן הפעולות שלך</li>
            </ul>

            <p className="text-sm text-gray-500">
              הקובץ בפורמט JSON. סיסמאות וסודות אימות אינם נכללים, מטעמי אבטחה.
            </p>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={download}
              disabled={busy}
              className="w-full bg-[#2E77D0] hover:bg-[#1D4F8F] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {busy ? <><Loader2 className="animate-spin" size={18} />מייצא...</> : <><Download size={18} />הורד את המידע שלי</>}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          שאלות? <a href="mailto:info@autolog.click" className="text-[#2E77D0] hover:underline">info@autolog.click</a>
        </p>
      </div>
    </div>
  );
}
