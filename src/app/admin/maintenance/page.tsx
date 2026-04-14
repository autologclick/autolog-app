'use client';

import { useEffect, useState } from 'react';

export default function AdminMaintenancePage() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/maintenance');
        if (res.ok) {
          const j = await res.json();
          setEnabled(Boolean(j.enabled));
          setMessage(j.message || '');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, message }),
      });
      if (res.ok) {
        setStatus('נשמר בהצלחה');
      } else {
        const j = await res.json().catch(() => ({}));
        setStatus(j.error || 'שגיאה בשמירה');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div dir="rtl" className="p-6">טוען…</div>;

  return (
    <div dir="rtl" className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">מצב תחזוקה</h1>
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-5 h-5"
        />
        <span>הפעל מצב תחזוקה (משתמשים יראו דף תחזוקה)</span>
      </label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="הודעה למשתמשים (אופציונלי)"
        className="w-full border rounded-lg p-3 min-h-[100px]"
      />
      <button
        onClick={save}
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
      >
        {saving ? 'שומר…' : 'שמור'}
      </button>
      {status && <p className="text-sm text-gray-600">{status}</p>}
    </div>
  );
}
