'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wrench, Clock, CheckCircle, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Car, MapPin, User, Calendar,
  FileText, DollarSign, Eye, Loader2, Plus
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';

interface Treatment {
  id: string;
  vehicleId: string;
  userId: string;
  garageId: string | null;
  garageName: string | null;
  mechanicName: string | null;
  type: string;
  title: string;
  description: string | null;
  items: string | null;
  mileage: number | null;
  cost: number | null;
  date: string;
  status: string;
  sentByGarage: boolean;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  pending_approval: {
    label: 'ממתין לאישור',
    color: 'text-amber-600',
    icon: <Clock size={16} className="text-amber-600" />,
    bg: 'bg-amber-50 border-amber-200',
  },
  approved: {
    label: 'אושר',
    color: 'text-green-600',
    icon: <CheckCircle size={16} className="text-green-600" />,
    bg: 'bg-green-50 border-green-200',
  },
  rejected: {
    label: 'נדחה',
    color: 'text-red-600',
    icon: <XCircle size={16} className="text-red-600" />,
    bg: 'bg-red-50 border-red-200',
  },
  draft: {
    label: 'טיוטה',
    color: 'text-gray-500',
    icon: <FileText size={16} className="text-gray-500" />,
    bg: 'bg-gray-50 border-gray-200',
  },
};

const TYPE_LABELS: Record<string, string> = {
  maintenance: 'תחזוקה',
  repair: 'תיקון',
  inspection: 'בדיקה',
  other: 'אחר',
};

const TYPE_ICONS: Record<string, string> = {
  maintenance: '🔧',
  repair: '🛠️',
  oil_change: '🛢️',
  tires: '🔄',
  brakes: '🛑',
  electrical: '⚡',
  ac: '❄️',
  bodywork: '🚗',
  other: '📋',
};

export default function UserTreatmentsPage() {
  const router = useRouter();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchTreatments = useCallback(async () => {
    try {
      const res = await fetch('/api/treatments');
      if (!res.ok) throw new Error('שגיאה בטעינת הטיפולים');
      const data = await res.json();
      setTreatments(data.treatments || []);
    } catch (err) {
      setError('שגיאה בטעינת הטיפולים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/treatments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!res.ok) throw new Error('שגיאה באישור הטיפול');
      await fetchTreatments();
    } catch {
      setError('שגיאה באישור הטיפול');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/treatments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectReason || undefined }),
      });
      if (!res.ok) throw new Error('שגיאה בדחיית הטיפול');
      setRejectingId(null);
      setRejectReason('');
      await fetchTreatments();
    } catch {
      setError('שגיאה בדחיית הטיפול');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingTreatments = treatments.filter(t => t.status === 'pending_approval');
  const otherTreatments = treatments.filter(t => t.status !== 'pending_approval');

  const parseItems = (itemsStr: string | null): Array<{ item?: string; action?: string; notes?: string; cost?: number; name?: string }> => {
    if (!itemsStr) return [];
    try {
      const parsed = JSON.parse(itemsStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getInspectionId = (notes: string | null): string | null => {
    if (!notes) return null;
    try {
      const parsed = JSON.parse(notes);
      return parsed.inspectionId || null;
    } catch {
      return null;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const TreatmentCard = ({ treatment }: { treatment: Treatment }) => {
    const statusConfig = STATUS_CONFIG[treatment.status] || STATUS_CONFIG.draft;
    const isExpanded = expandedId === treatment.id;
    const isPending = treatment.status === 'pending_approval';
    const isRejecting = rejectingId === treatment.id;
    const items = parseItems(treatment.items);
    const inspectionId = getInspectionId(treatment.notes);
    const icon = TYPE_ICONS[treatment.type] || '📋';

    return (
      <div className={`bg-white rounded-2xl overflow-hidden transition-all duration-200 ${isPending ? 'shadow-md border-l-4 border-amber-500' : 'shadow-sm'}`}>
        {/* Header */}
        <div
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedId(isExpanded ? null : treatment.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 text-lg">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#1e3a5f] truncate">{treatment.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1.5">
                  {treatment.garageName && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {treatment.garageName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(treatment.date)}
                  </span>
                  {treatment.cost != null && treatment.cost > 0 && (
                    <span className="font-medium text-[#1e3a5f]">
                      {treatment.cost.toLocaleString()} ₪
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg}`}>
                {statusConfig.icon}
                {statusConfig.label}
              </span>
              {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-100 bg-white p-4 space-y-4">
            {/* Description */}
            {treatment.description && (
              <div>
                <h4 className="text-sm font-semibold text-[#1e3a5f] mb-1">תיאור</h4>
                <p className="text-sm text-gray-600">{treatment.description}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Car size={14} className="text-gray-400" />
                <span>סוג: {TYPE_LABELS[treatment.type] || treatment.type}</span>
              </div>
              {treatment.mechanicName && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User size={14} className="text-gray-400" />
                  <span>מכונאי: {treatment.mechanicName}</span>
                </div>
              )}
              {treatment.mileage != null && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span>ק"מ: {treatment.mileage.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#1e3a5f] mb-2">פירוט עבודות</h4>
                <div className="space-y-1.5">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-800">{item.item || item.name || `פריט ${i + 1}`}</span>
                      <div className="flex items-center gap-3 text-gray-500">
                        {item.action && <span>{item.action}</span>}
                        {item.cost != null && item.cost > 0 && (
                          <span className="font-medium text-gray-700">{item.cost} ₪</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View Inspection Link */}
            {inspectionId && (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/inspection/${inspectionId}`); }}
                className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                <Eye size={16} />
                צפה בדוח הבדיקה המלא
              </button>
            )}

            {/* Rejection Reason */}
            {treatment.status === 'rejected' && treatment.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  <span className="font-semibold">סיבת דחייה:</span> {treatment.rejectionReason}
                </p>
              </div>
            )}

            {/* Approval Actions */}
            {isPending && (
              <div className="pt-2 border-t border-gray-100">
                {!isRejecting ? (
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApprove(treatment.id); }}
                      disabled={actionLoading === treatment.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === treatment.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      אשר טיפול
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setRejectingId(treatment.id); }}
                      disabled={actionLoading === treatment.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={18} />
                      דחה טיפול
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="סיבת הדחייה (אופציונלי)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                      rows={2}
                      dir="rtl"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReject(treatment.id); }}
                        disabled={actionLoading === treatment.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === treatment.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <XCircle size={16} />
                        )}
                        אשר דחייה
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRejectingId(null); setRejectReason(''); }}
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fef7ed] pb-24" dir="rtl">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fef7ed] pb-24" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Page Header */}
        <PageHeader title="טיפולים" subtitle="הסיטרואן שלי" />

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle size={16} />
            {error}
            <button onClick={() => setError('')} className="mr-auto text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* CTA Button */}
        {treatments.length > 0 && (
          <div className="mb-6">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-bold hover:from-teal-600 hover:to-teal-700 transition-all shadow-md">
              <Plus size={20} />
              הוסף טיפול חדש
            </button>
          </div>
        )}

        {/* Stats Row - Only show if there are treatments */}
        {treatments.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-xl p-3 shadow-sm text-center">
              <div className="text-2xl font-bold text-[#1e3a5f]">{treatments.length}</div>
              <div className="text-xs text-gray-400 mt-1">סך הכל טיפולים</div>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm text-center">
              <div className="text-2xl font-bold text-amber-600">{pendingTreatments.length}</div>
              <div className="text-xs text-gray-400 mt-1">ממתינים לאישור</div>
            </div>
          </div>
        )}

        {/* Pending Approvals Section */}
        {pendingTreatments.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <h2 className="text-lg font-bold text-[#1e3a5f]">
                ממתינים לאישור
              </h2>
              <span className="ml-2 text-sm text-gray-400">({pendingTreatments.length})</span>
            </div>
            <div className="space-y-3">
              {pendingTreatments.map(t => (
                <TreatmentCard key={t.id} treatment={t} />
              ))}
            </div>
          </div>
        )}

        {/* Other Treatments */}
        {otherTreatments.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">
              היסטוריית טיפולים
              <span className="text-sm text-gray-400 font-normal mr-2">({otherTreatments.length})</span>
            </h2>
            <div className="space-y-3">
              {otherTreatments.map(t => (
                <TreatmentCard key={t.id} treatment={t} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {treatments.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wrench size={32} className="text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">אין טיפולים עדיין</h3>
            <p className="text-sm text-gray-400 mb-6">כאשר מוסך ישלח טיפול, הוא יופיע כאן לאישור</p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-bold hover:from-teal-600 hover:to-teal-700 transition-all shadow-md">
              <Plus size={18} />
              הוסף טיפול חדש
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
