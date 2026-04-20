'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeftRight,
  Car,
  FileText,
  Wrench,
  Receipt,
  FolderOpen,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Shield,
} from 'lucide-react';

interface Transfer {
  id: string;
  vehicleId: string;
  toEmail: string;
  status: string;
  expiresAt: string;
  includeInspections: boolean;
  includeTreatments: boolean;
  includeExpenses: boolean;
  includeDocuments: boolean;
  createdAt: string;
  vehicle: {
    nickname: string;
    licensePlate: string;
    manufacturer: string;
    model: string;
    year: number;
    imageUrl?: string;
  } | null;
  fromUser: {
    fullName: string;
    email: string;
  } | null;
  isSender: boolean;
  isExpired: boolean;
}

export default function AcceptTransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code') || '';

  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [code, setCode] = useState(codeParam);
  const [step, setStep] = useState<'find' | 'confirm' | 'done'>('find');

  useEffect(() => {
    if (codeParam) {
      findTransfer(codeParam);
    } else {
      setLoading(false);
    }
  }, [codeParam]);

  const findTransfer = async (searchCode?: string) => {
    const c = searchCode || code;
    if (!c || c.length < 6) {
      setError('יש להזין קוד אימות בן 6 תווים');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/vehicles/transfer?type=received');
      const data = await res.json();
      if (!res.ok) {
        setError('שגיאה בטעינת הנתונים');
        setLoading(false);
        return;
      }

      // Find the matching pending transfer
      const found = (data.transfers || []).find(
        (t: Transfer) => t.status === 'pending' && !t.isExpired
      );

      if (!found) {
        setError('לא נמצאה בקשת העברה פעילה. ייתכן שהבקשה פגה או בוטלה.');
        setLoading(false);
        return;
      }

      setTransfer(found);
      setStep('confirm');
    } catch {
      setError('שגיאת רשת');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!transfer) return;
    if (!code || code.length < 6) {
      setError('יש להזין את קוד האימות');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/vehicles/transfer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId: transfer.id,
          action: 'accept',
          code: code.toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה');
        setBusy(false);
        return;
      }
      setSuccess(data.message);
      setStep('done');
    } catch {
      setError('שגיאת רשת');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!transfer) return;
    if (!confirm('האם אתה בטוח שברצונך לדחות את ההעברה?')) return;

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/vehicles/transfer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId: transfer.id, action: 'reject' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה');
        return;
      }
      setSuccess('ההעברה נדחתה.');
      setStep('done');
    } catch {
      setError('שגיאת רשת');
    } finally {
      setBusy(false);
    }
  };

  const dataCategories = transfer
    ? [
        { included: transfer.includeInspections, label: 'בדיקות', icon: FileText },
        { included: transfer.includeTreatments, label: 'טיפולים', icon: Wrench },
        { included: transfer.includeExpenses, label: 'הוצאות', icon: Receipt },
        { included: transfer.includeDocuments, label: 'מסמכים', icon: FolderOpen },
      ]
    : [];

  return (
    <div dir="rtl" className="max-w-xl mx-auto p-4 pb-24 space-y-6">
      <button onClick={() => router.push('/user/vehicles')} className="text-sm text-blue-600">
        ← חזור
      </button>

      <div className="flex items-center gap-3">
        <ArrowLeftRight className="text-blue-600" size={28} />
        <h1 className="text-2xl font-bold">אישור העברת בעלות</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
          <Check size={16} /> {success}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="animate-spin ml-2" size={20} /> טוען…
        </div>
      )}

      {/* Step: Find — enter code if not provided */}
      {!loading && step === 'find' && (
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 space-y-4 text-center">
          <Shield size={48} className="mx-auto text-blue-600" />
          <h2 className="font-bold text-lg">הזן קוד אימות</h2>
          <p className="text-sm text-gray-600">
            הקוד נשלח אליך במייל מהמוכר.
          </p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={6}
            placeholder="A3F1B9"
            className="w-full border-2 rounded-xl p-4 text-center text-2xl font-mono tracking-widest"
            dir="ltr"
          />
          <button
            onClick={() => findTransfer()}
            disabled={busy || code.length < 6}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {busy ? 'מחפש…' : 'אימות'}
          </button>
        </div>
      )}

      {/* Step: Confirm — show transfer details */}
      {!loading && step === 'confirm' && transfer && (
        <div className="space-y-4">
          {/* Vehicle Card */}
          <div className="bg-white border-2 border-blue-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Car size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg">
                  {transfer.vehicle?.nickname || `${transfer.vehicle?.manufacturer} ${transfer.vehicle?.model}`}
                </h2>
                <p className="text-sm text-gray-500" dir="ltr">
                  {transfer.vehicle?.licensePlate} • {transfer.vehicle?.year}
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <strong>מוכר:</strong> {transfer.fromUser?.fullName || 'לא ידוע'}
            </div>

            {/* What's included */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">נתונים שיועברו אליך:</p>
              {dataCategories.map(({ included, label, icon: Icon }) => (
                <div key={label} className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                  included ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400 line-through'
                }`}>
                  <Icon size={16} />
                  <span>{label}</span>
                  {included && <Check size={14} className="mr-auto" />}
                </div>
              ))}
            </div>
          </div>

          {/* Code Input */}
          {!codeParam && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">קוד אימות</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={6}
                placeholder="A3F1B9"
                className="w-full border-2 rounded-xl p-3 text-center font-mono text-lg tracking-widest"
                dir="ltr"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={busy}
              className="flex-1 border-2 border-red-300 text-red-700 rounded-xl py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <X size={18} /> דחה
            </button>
            <button
              onClick={handleAccept}
              disabled={busy || code.length < 6}
              className="flex-1 bg-green-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {busy ? 'מאשר…' : 'אשר העברה'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            לאחר אישור, המוכר יצטרך להשלים את ההעברה כדי שהרכב יועבר אליך.
          </p>
        </div>
      )}

      {/* Step: Done */}
      {!loading && step === 'done' && (
        <div className="text-center space-y-4 py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold">{success || 'הפעולה בוצעה'}</h2>
          <button
            onClick={() => router.push('/user/vehicles')}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold"
          >
            חזור לרכבים שלי
          </button>
        </div>
      )}
    </div>
  );
}
