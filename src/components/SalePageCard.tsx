'use client';

import { useEffect, useRef, useState } from 'react';

type ActivePage = {
  id: string;
  token: string;
  expiresAt: string;
  viewCount: number;
  infocarName: string | null;
};

export default function SalePageCard({ vehicleId, label }: { vehicleId: string; label?: string }) {
  const [page, setPage] = useState<ActivePage | null>(null);
  const [includeTreatments, setIncludeTreatments] = useState(true);
  const [includeContact, setIncludeContact] = useState(false);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedAd, setCopiedAd] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function refresh() {
    fetch(`/api/sale-pages?vehicleId=${vehicleId}`)
      .then((r) => (r.ok ? r.json() : { pages: [] }))
      .then((d) => setPage(d.pages?.[0] ?? null))
      .catch(() => {});
  }

  useEffect(refresh, [vehicleId]);

  const shareUrl = page ? `${window.location.origin}/sale/${page.token}` : '';

  async function createPage() {
    setBusy(true);
    try {
      const res = await fetch('/api/sale-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          sections: {
            details: true,
            carCheck: true,
            treatments: includeTreatments,
            contact: includeContact,
          },
          sellerPhone: includeContact && phone ? phone : undefined,
        }),
      });
      if (res.ok) refresh();
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!page?.id) return;
    setBusy(true);
    try {
      await fetch(`/api/sale-pages/${page.id}`, { method: 'DELETE' });
      setPage(null);
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const adText = `🚗 למכירה${label ? `: ${label}` : ''}
כל המידע על הרכב במקום אחד — נתונים רשמיים ממשרד התחבורה, היסטוריית טיפולים מתועדת ויצירת קשר ישירה. שקיפות מלאה:
${shareUrl}`;

  function copyAd() {
    navigator.clipboard.writeText(adText).then(() => {
      setCopiedAd(true);
      setTimeout(() => setCopiedAd(false), 2000);
    });
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !page) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) {
      setUploadMsg('אפשר להעלות PDF או תמונה (JPG/PNG) בלבד');
      return;
    }
    if (f.size > 4_500_000) {
      setUploadMsg('הקובץ גדול מדי (עד 4.5MB)');
      return;
    }
    setUploadMsg('מעלה…');
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await fetch(`/api/sale-pages/${page.id}/infocar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: reader.result, fileName: f.name }),
      });
      setUploadMsg(res.ok ? null : 'ההעלאה נכשלה, נסו שוב');
      if (res.ok) refresh();
    };
    reader.readAsDataURL(f);
  }

  async function removeInfocar() {
    if (!page?.id) return;
    await fetch(`/api/sale-pages/${page.id}/infocar`, { method: 'DELETE' });
    refresh();
  }

  const waText = encodeURIComponent(
    `היי! אני מוכר/ת את הרכב — הנה תעודת הזהות המלאה שלו מאוטולוג, כולל נתונים רשמיים והיסטוריית טיפולים: ${shareUrl}`
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
      <h3 className="text-lg font-bold text-[#1B4E8A] mb-1">מוכרים את הרכב?</h3>
      <p className="text-sm text-gray-500 mb-4">
        צרו דף מכירה משותף: נתונים רשמיים ממשרד התחבורה + היסטוריית הטיפולים שתיעדתם. שקיפות שמוכרת.
      </p>

      {!page ? (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeTreatments}
              onChange={(e) => setIncludeTreatments(e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            לכלול את היסטוריית הטיפולים המאושרים
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeContact}
              onChange={(e) => setIncludeContact(e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            להציג כפתור יצירת קשר בוואטסאפ
          </label>
          {includeContact && (
            <input
              type="tel"
              dir="ltr"
              placeholder="05X-XXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full max-w-xs border border-gray-200 rounded-xl px-4 py-2 text-sm"
            />
          )}
          <button
            onClick={createPage}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition disabled:opacity-50"
          >
            {busy ? 'יוצר…' : 'צרו דף מכירה'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
              👁 {page.viewCount} צפיות בדף
            </span>
            <span className="text-xs text-gray-400">
              פעיל עד {new Date(page.expiresAt).toLocaleDateString('he-IL')}
            </span>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-800 break-all" dir="ltr">
            {shareUrl}
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition text-sm"
            >
              שיתוף בוואטסאפ
            </a>
            <button
              onClick={copyLink}
              className="px-4 py-2 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition text-sm"
            >
              {copied ? 'הועתק ✓' : 'העתקת קישור'}
            </button>
            <button
              onClick={copyAd}
              className="px-4 py-2 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition text-sm"
            >
              {copiedAd ? 'הועתק ✓' : 'נוסח מודעה ליד2/פייסבוק'}
            </button>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-sm font-bold text-gray-700 mb-1">דוח היסטוריית תביעות (INFOCAR)</p>
            {page.infocarName ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-teal-700">מצורף לדף: {page.infocarName} ✓</span>
                <button onClick={removeInfocar} className="text-red-600 text-xs underline">
                  הסרה
                </button>
              </div>
            ) : (
              <div className="text-sm">
                <p className="text-xs text-gray-500 mb-2">
                  הפיקו דוח ב-INFOCAR (12 ₪) והעלו אותו לדף — קונים סומכים על מוכר שמראה הכל.
                </p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition text-sm"
                >
                  העלאת הדוח (PDF או תמונה)
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={onFilePicked}
                />
                {uploadMsg && <p className="text-xs text-amber-700 mt-1">{uploadMsg}</p>}
              </div>
            )}
          </div>

          <button
            onClick={revoke}
            disabled={busy}
            className="px-4 py-2 text-red-600 font-bold rounded-xl hover:bg-red-50 transition text-sm disabled:opacity-50"
          >
            ביטול הדף
          </button>
        </div>
      )}
    </div>
  );
}
