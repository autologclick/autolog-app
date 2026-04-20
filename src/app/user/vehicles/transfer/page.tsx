'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  Loader2,
  Car,
  Mail,
  Check,
  X,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Wrench,
  Receipt,
  FolderOpen,
  Send,
  Ban,
} from 'lucide-react';

interface Vehicle {
  id: string;
  nickname: string;
  licensePlate: string;
  manufacturer: string;
  model: string;
  year: number;
  imageUrl?: string;
}

interface Transfer {
  id: string;
  vehicleId: string;
  fromUserId: string;
  toEmail: string;
  toUserId: string | null;
  status: string;
  expiresAt: string;
  includeInspections: boolean;
  includeTreatments: boolean;
  includeExpenses: boolean;
  includeDocuments: boolean;
  cancelRequestedBy: string | null;
  completedAt: string | null;
  createdAt: string;
  vehicle: Vehicle | null;
  fromUser: { id: string; fullName: string; email: string } | null;
  isSender: boolean;
  isExpired: boolean;
}

export default function TransferPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New transfer form
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [includeInspections, setIncludeInspections] = useState(true);
  const [includeTreatments, setIncludeTreatments] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(true);

  // Expanded detail
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, tRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/vehicles/transfer?type=all'),
      ]);
      const vData = await vRes.json();
      const tData = await tRes.json();
      setVehicles(vData.vehicles || []);
      setTransfers(tData.transfers || []);
    } catch {
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedVehicle) { setError('יש לבחור רכב'); return; }
    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      setError('יש להזין כתובת מייל תקינה');
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/vehicles/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicle,
          toEmail,
          includeInspections,
          includeTreatments,
          includeExpenses,
          includeDocuments,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה');
        return;
      }
      setSuccess(data.message);
      setShowForm(false);
      setSelectedVehicle('');
      setToEmail('');
      fetchData();
    } catch {
      setError('שגיאת רשת');
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async (transferId: string) => {
    if (!confirm('האם אתה בטוח שברצונך להשלים את ההעברה? פעולה זו אינה הפיכה.')) return;

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/vehicles/transfer/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה');
        return;
      }
      setSuccess(data.message);
      fetchData();
    } catch {
      setError('שגיאת רשת');
    } finally {
      setBusy(false);
    }
  };

  const handleAction = async (transferId: string, action: string) => {
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/vehicles/transfer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה');
        return;
      }
      setSuccess(data.message);
      fetchData();
    } catch {
      setError('שגיאת רשת');
    } finally {
      setBusy(false);
    }
  };

  const statusBadge = (t: Transfer) => {
    if (t.isExpired && t.status === 'pending') {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">פג תוקף</span>;
    }
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'ממתין לאישור' },
      accepted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'מאושר — ממתין להשלמה' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'הושלם' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'בוטל' },
    };
    const s = map[t.status] || map.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Filter vehicles that don't have active transfers
  const activeTransferVehicleIds = transfers
    .filter((t) => ['pending', 'accepted'].includes(t.status) && t.isSender)
    .map((t) => t.vehicleId);
  const availableVehicles = vehicles.filter((v) => !activeTransferVehicleIds.includes(v.id));

  return (
    <div dir="rtl" className="max-w-2xl mx-auto p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/user/vehicles')} className="text-sm text-blue-600">
          ← חזור לרכבים
        </button>
      </div>

      <div className="flex items-center gap-3">
        <ArrowLeftRight className="text-blue-600" size={28} />
        <h1 className="text-2xl font-bold">העברת בעלות</h1>
      </div>

      {/* Messages */}
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

      {/* New Transfer Button */}
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <Send size={18} />
          העבר רכב לבעלים חדש
        </button>
      )}

      {/* New Transfer Form */}
      {showForm && (
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-lg">יצירת בקשת העברה</h2>

          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">בחר רכב</label>
            {availableVehicles.length === 0 ? (
              <p className="text-sm text-gray-500">אין רכבים זמינים להעברה</p>
            ) : (
              <div className="space-y-2">
                {availableVehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v.id)}
                    className={`w-full text-right p-3 rounded-xl border-2 transition-colors flex items-center gap-3 ${
                      selectedVehicle === v.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Car size={20} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">{v.nickname || `${v.manufacturer} ${v.model}`}</div>
                      <div className="text-sm text-gray-500" dir="ltr">{v.licensePlate} • {v.year}</div>
                    </div>
                    {selectedVehicle === v.id && <Check size={20} className="text-blue-600 mr-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buyer Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מייל הקונה</label>
            <div className="relative">
              <Mail size={18} className="absolute right-3 top-3.5 text-gray-400" />
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="buyer@example.com"
                className="w-full border-2 rounded-xl p-3 pr-10 text-sm"
                dir="ltr"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              אם הקונה לא רשום ב-AutoLog, הוא יקבל לינק הרשמה במייל.
            </p>
          </div>

          {/* Selective Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מה להעביר לקונה?</label>
            <div className="space-y-2">
              {[
                { key: 'inspections', label: 'בדיקות', icon: FileText, state: includeInspections, setter: setIncludeInspections },
                { key: 'treatments', label: 'טיפולים', icon: Wrench, state: includeTreatments, setter: setIncludeTreatments },
                { key: 'expenses', label: 'הוצאות', icon: Receipt, state: includeExpenses, setter: setIncludeExpenses },
                { key: 'documents', label: 'מסמכים', icon: FolderOpen, state: includeDocuments, setter: setIncludeDocuments },
              ].map(({ key, label, icon: Icon, state, setter }) => (
                <button
                  key={key}
                  onClick={() => setter(!state)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                    state ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <Icon size={18} className={state ? 'text-green-600' : 'text-gray-400'} />
                  <span className="font-medium flex-1 text-right">{label}</span>
                  <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${
                    state ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                  }`}>
                    <div className="w-5 h-5 rounded-full bg-white mx-0.5 shadow" />
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              נתונים שלא תעביר — יימחקו מהמערכת לאחר השלמת ההעברה.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 border-2 border-gray-300 rounded-xl py-3 font-semibold"
            >
              ביטול
            </button>
            <button
              onClick={handleCreate}
              disabled={busy || !selectedVehicle || !toEmail}
              className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {busy ? 'שולח…' : 'שלח בקשת העברה'}
            </button>
          </div>
        </div>
      )}

      {/* Transfer List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="animate-spin ml-2" size={20} /> טוען…
        </div>
      ) : transfers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ArrowLeftRight size={48} className="mx-auto mb-3 text-gray-300" />
          <p>אין העברות בעלות עדיין</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-bold text-lg">היסטוריית העברות</h2>
          {transfers.map((t) => (
            <div key={t.id} className="bg-white border rounded-2xl overflow-hidden">
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                className="w-full p-4 flex items-center gap-3 text-right"
              >
                <Car size={20} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {t.vehicle ? `${t.vehicle.nickname || t.vehicle.manufacturer + ' ' + t.vehicle.model}` : 'רכב'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t.isSender ? `→ ${t.toEmail}` : `← ${t.fromUser?.fullName || 'מוכר'}`}
                    {' • '}
                    {formatDate(t.createdAt)}
                  </div>
                </div>
                {statusBadge(t)}
                {expandedId === t.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* Expanded details */}
              {expandedId === t.id && (
                <div className="border-t p-4 space-y-3 bg-gray-50">
                  {/* What's included */}
                  <div className="flex flex-wrap gap-2">
                    {t.includeInspections && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <FileText size={12} /> בדיקות
                      </span>
                    )}
                    {t.includeTreatments && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Wrench size={12} /> טיפולים
                      </span>
                    )}
                    {t.includeExpenses && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Receipt size={12} /> הוצאות
                      </span>
                    )}
                    {t.includeDocuments && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <FolderOpen size={12} /> מסמכים
                      </span>
                    )}
                  </div>

                  {/* Vehicle info */}
                  {t.vehicle && (
                    <div className="text-sm text-gray-600">
                      <span dir="ltr">{t.vehicle.licensePlate}</span>
                      {' • '}{t.vehicle.manufacturer} {t.vehicle.model} {t.vehicle.year}
                    </div>
                  )}

                  {/* Expiry */}
                  {t.status === 'pending' && !t.isExpired && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> תפוגה: {formatDate(t.expiresAt)}
                    </div>
                  )}

                  {/* Cancel requested notice */}
                  {t.cancelRequestedBy && t.status !== 'cancelled' && (
                    <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded-lg flex items-center gap-2">
                      <AlertTriangle size={14} />
                      בקשת ביטול הוגשה — ממתינה לאישור הצד השני
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {/* Seller: Complete transfer (after buyer accepted) */}
                    {t.isSender && t.status === 'accepted' && (
                      <button
                        onClick={() => handleComplete(t.id)}
                        disabled={busy}
                        className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Check size={16} /> השלם העברה
                      </button>
                    )}

                    {/* Seller: Cancel pending (direct) */}
                    {t.isSender && t.status === 'pending' && (
                      <button
                        onClick={() => handleAction(t.id, 'cancel_request')}
                        disabled={busy}
                        className="flex-1 border border-red-300 text-red-700 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <X size={16} /> בטל העברה
                      </button>
                    )}

                    {/* Either side: Request cancel on accepted */}
                    {t.status === 'accepted' && !t.cancelRequestedBy && (
                      <button
                        onClick={() => handleAction(t.id, 'cancel_request')}
                        disabled={busy}
                        className="flex-1 border border-red-300 text-red-700 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Ban size={16} /> בקש ביטול
                      </button>
                    )}

                    {/* Confirm cancel from other party */}
                    {t.cancelRequestedBy && t.cancelRequestedBy !== '' && t.status === 'accepted' && (
                      <button
                        onClick={() => handleAction(t.id, 'cancel_request')}
                        disabled={busy}
                        className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Ban size={16} /> אשר ביטול
                      </button>
                    )}

                    {/* Download report before completing */}
                    {t.isSender && t.status === 'accepted' && (
                      <button
                        onClick={() => router.push(`/user/vehicles/${t.vehicleId}/report`)}
                        className="border border-gray-300 text-gray-700 rounded-xl py-2.5 px-4 text-sm font-semibold flex items-center gap-1"
                      >
                        <FileText size={16} /> הורד עותק
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
