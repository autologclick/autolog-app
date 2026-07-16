'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>קישור איפוס לא תקין</h1>
        <p style={{ color: '#555', marginBottom: 16 }}>הקישור שהגעת דרכו אינו תקין. אנא בקשו קישור איפוס חדש.</p>
        <Link href="/auth/forgot-password" style={{ color: '#2563eb' }}>שליחת קישור חדש</Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים.');
      return;
    }
    if (password !== confirm) {
      setError('הסיסמאות אינן תואמות.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || data?.message || 'שגיאה באיפוס הסיסמה. הקישור תקף ל-30 דקות בלבד.');
        return;
      }
      setDone(true);
    } catch {
      setError('תקלה בתקשורת. אנא נסו שוב.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>הסיסמה עודכנה בהצלחה</h1>
        <p style={{ color: '#555', marginBottom: 16 }}>ניתן להתחבר כעת עם הסיסמה החדשה.</p>
        <Link href="/auth/login" style={{ color: '#2563eb', fontWeight: 600 }}>מעבר להתחברות</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>איפוס סיסמה</h1>
      <p style={{ color: '#555', textAlign: 'center', marginBottom: 8 }}>בחרו סיסמה חדשה לחשבון.</p>
      <label style={{ fontSize: 14, fontWeight: 600 }}>סיסמה חדשה</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 16, direction: 'ltr', textAlign: 'right' }} />
      <label style={{ fontSize: 14, fontWeight: 600 }}>אימות סיסמה</label>
      <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 16, direction: 'ltr', textAlign: 'right' }} />
      {error && <div style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, fontSize: 14 }}>{error}</div>}
      <button type="submit" disabled={submitting} style={{ background: '#2563eb', color: 'white', padding: '12px 16px', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>{submitting ? 'מעדכן...' : 'עדכן סיסמה'}</button>
      <Link href="/auth/login" style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 4 }}>חזרה להתחברות</Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.08)', padding: 28 }}>
        <Suspense fallback={<div style={{ textAlign: 'center' }}>טוען...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
