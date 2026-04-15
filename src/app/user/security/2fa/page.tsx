'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Copy, Check, AlertTriangle, Loader2 } from 'lucide-react';

type Step = 'loading' | 'status' | 'setup' | 'verify' | 'done' | 'disable';

export default function TwoFactorPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState('');
  const [otpauthUri, setOtpauthUri] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Disable form
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const j = await res.json();
        const is2fa = Boolean(j.user?.twoFactorEnabled);
        setEnabled(is2fa);
        setStep('status');
      } catch {
        setStep('status');
      }
    })();
  }, []);

  const startSetup = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || 'שגיאה');
        setBusy(false);
        return;
      }
      setSecret(j.secret);
      setOtpauthUri(j.otpauthUri);
      setStep('setup');
    } catch {
      setError('שגיאת רשת');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!code || code.length !== 6) {
      setError('הזן קוד בן 6 ספרות');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || 'קוד שגוי');
        setBusy(false);
        return;
      }
      setBackupCodes(j.backupCodes || []);
      setEnabled(true);
      setStep('done');
    } catch {
      setError('שגיאת רשת');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!disablePassword) {
      setError('נא להזין סיסמה');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword, code: disableCode }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || 'שגיאה');
        setBusy(false);
        return;
      }
      setEnabled(false);
      setStep('status');
      setDisablePassword('');
      setDisableCode('');
    } catch {
      setError('שגיאת רשת');
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = otpauthUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauthUri)}`
    : '';

  return (
    <div dir="rtl" className="max-w-xl mx-auto p-6 space-y-6">
      <button onClick={() => router.back()} className="text-sm text-blue-600">
        ← חזור
      </button>

      <div className="flex items-center gap-3">
        <Shield className="text-blue-600" size={32} />
        <h1 className="text-2xl font-bold">אימות דו-שלבי (2FA)</h1>
      </div>

      {step === 'loading' && (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="animate-spin" size={16} /> טוען…
        </div>
      )}

      {step === 'status' && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border ${
              enabled
                ? 'bg-green-50 border-green-200 text-green-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="font-semibold">
              סטטוס: {enabled ? '2FA מופעל ✓' : '2FA כבוי'}
            </div>
            <p className="text-sm mt-1">
              {enabled
                ? 'החשבון מוגן באימות דו-שלבי.'
                : 'מומלץ להפעיל 2FA כדי להגן על החשבון. חובה עבור חשבונות מנהל.'}
            </p>
          </div>

          {!enabled ? (
            <button
              onClick={startSetup}
              disabled={busy}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold w-full disabled:opacity-50"
            >
              {busy ? 'טוען…' : 'הפעל 2FA'}
            </button>
          ) : (
            <button
              onClick={() => setStep('disable')}
              className="border border-red-300 text-red-700 px-6 py-3 rounded-xl font-semibold w-full"
            >
              בטל 2FA
            </button>
          )}
        </div>
      )}

      {step === 'setup' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            1. סרוק את ה-QR באפליקציית אימות (Google Authenticator, Authy, 1Password):
          </p>
          <div className="flex justify-center">
            {qrUrl && (
              <img src={qrUrl} alt="QR Code" className="border rounded-lg" />
            )}
          </div>
          <p className="text-sm text-gray-700">
            או הזן ידנית את הקוד הסודי:
          </p>
          <div className="flex items-center gap-2 bg-gray-50 border rounded-lg p-3 font-mono text-sm">
            <span className="flex-1 break-all" dir="ltr">{secret}</span>
            <button onClick={copySecret} className="p-2 hover:bg-gray-200 rounded">
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>
          </div>

          <p className="text-sm text-gray-700 pt-2">
            2. הזן את הקוד בן 6 הספרות שמופיע באפליקציה:
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full border-2 rounded-xl p-4 text-center text-2xl font-mono tracking-widest"
            dir="ltr"
          />
          {error && (
            <div className="text-red-600 text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          <button
            onClick={verify}
            disabled={busy || code.length !== 6}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold w-full disabled:opacity-50"
          >
            {busy ? 'מאמת…' : 'אמת והפעל'}
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-900">
            <div className="font-semibold">2FA הופעל בהצלחה! 🎉</div>
            <p className="text-sm mt-1">
              מעכשיו תידרש להזין קוד אימות בכל התחברות.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300">
            <div className="font-semibold text-amber-900 mb-2">
              ⚠️ שמור את קודי הגיבוי במקום בטוח
            </div>
            <p className="text-sm text-amber-900 mb-3">
              כל קוד חד-פעמי. ניתן להשתמש בהם אם אבד לך הטלפון.
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-white rounded-lg p-3">
              {backupCodes.map((c) => (
                <div key={c} dir="ltr" className="text-center py-1">
                  {c}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const text = backupCodes.join('\n');
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="mt-3 text-sm text-blue-700 underline"
            >
              {copied ? 'הועתק!' : 'העתק קודי גיבוי'}
            </button>
          </div>

          <button
            onClick={() => {
              setStep('status');
              setCode('');
              setBackupCodes([]);
            }}
            className="bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold w-full"
          >
            סיים
          </button>
        </div>
      )}

      {step === 'disable' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900">
            <div className="font-semibold">⚠️ ביטול 2FA יחליש את אבטחת החשבון</div>
          </div>
          <input
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="הסיסמה שלך"
            className="w-full border rounded-lg p-3"
          />
          <input
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            placeholder="קוד 2FA (או קוד גיבוי)"
            className="w-full border rounded-lg p-3 font-mono"
            dir="ltr"
          />
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setStep('status')}
              className="flex-1 border rounded-xl py-3 font-semibold"
            >
              ביטול
            </button>
            <button
              onClick={disable}
              disabled={busy}
              className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
            >
              {busy ? 'מעבד…' : 'אשר ביטול'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
