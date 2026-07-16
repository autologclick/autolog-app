'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wrench, Clock, CheckCircle, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Car, MapPin, User, Calendar,
  FileText, Eye, Loader2, Plus, Camera, Upload, Scan, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import VoiceMicButton from '@/components/ui/VoiceMicButton';

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
  completed: {
    label: 'הושלם',
    color: 'text-blue-600',
    icon: <CheckCircle size={16} className="text-blue-600" />,
    bg: 'bg-blue-50 border-blue-200',
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
  inspection: 'אבחון',
  other: 'אחר',
};

const TYPE_ICONS: Record<string, string> = {
  maintenance: '🔧',
  repair: '🛠️',
  inspection: '📋',
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
  const [vehicleFilter, setVehicleFilter] = useState<string | null>(
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('vehicleId') : null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<{ id: string; nickname: string; licensePlate: string }[]>([]);
  const [addForm, setAddForm] = useState({
    vehicleId: '',
    type: 'maintenance' as string,
    title: '',
    description: '',
    garageName: '',
    mileage: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
  });

  // ─── Receipt scan state ───
  // When the user takes a photo / uploads a receipt, we:
  //   1) compress it to base64
  //   2) send it to /api/ai/scan-document
  //   3) auto-fill the form fields from the AI response
  //   4) keep the image in state so it's POSTed alongside the treatment,
  //      which lets the backend save it as a Document and link it to the Expense.
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [scanData, setScanData] = useState<{
    totalAmount?: number;
    date?: string;
    documentType?: string;
    description?: string;
    summary?: string;
    businessName?: string;
    suggestedCategory?: string;
    invoiceNumber?: string;
    licensePlate?: string | null;
  } | null>(null);
  // Plate-mismatch confirmation: set when the scanned receipt's plate differs
  // from the selected vehicle — the user must explicitly choose how to proceed.
  const [plateWarning, setPlateWarning] = useState<{
    scanned: string;
    matchId?: string;
    matchLabel?: string;
  } | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTreatments = useCallback(async () => {
    try {
      const res = await fetch('/api/treatments');
      if (!res.ok) throw new Error('שגיאה בטעינת הטיפולים');
      const data = await res.json();
      setTreatments((data.treatments || []).filter((t: Treatment) => t.type !== 'inspection'));
    } catch (err) {
      setError('שגיאה בטעינת הטיפולים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreatments();
    fetch('/api/vehicles').then(r => r.json()).then(data => {
      if (data.vehicles) {
        setVehicles(data.vehicles);
        if (data.vehicles.length === 1) {
          setAddForm(prev => ({ ...prev, vehicleId: data.vehicles[0].id }));
        }
      }
    }).catch(() => {});
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

  /**
   * Compress a user-supplied image to a base64 JPEG.
   * Mirrors the approach used by the document/license scanners so the
   * AI gets a manageable payload while preserving Hebrew receipt detail.
   */
  const compressReceiptImage = async (file: File): Promise<string> => {
    const maxDim = 1400;
    const quality = 0.9;
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        let w = bitmap.width, h = bitmap.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close();
        return canvas.toDataURL('image/jpeg', quality);
      } catch { /* fall through */ }
    }
    return new Promise<string>((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  };

  /**
   * Best-effort mapping from the AI's free-form receipt categorization
   * to one of our 9 treatment types. We look at suggestedCategory first,
   * then scan the description/summary for Hebrew keywords as a fallback.
   * If nothing matches we leave the user's current selection alone.
   */
  const mapToTreatmentType = (sd: { suggestedCategory?: string; description?: string; summary?: string }): string | null => {
    const cat = (sd.suggestedCategory || '').toLowerCase();
    const text = `${sd.description || ''} ${sd.summary || ''}`.toLowerCase();
    if (cat === 'tires' || text.includes('צמיג') || text.includes('גלגל')) return 'tires';
    if (cat === 'brakes' || text.includes('בלמ') || text.includes('בלם')) return 'brakes';
    if (cat === 'electrical' || text.includes('חשמל') || text.includes('מצבר')) return 'electrical';
    if (cat === 'ac' || text.includes('מיזוג') || text.includes('מזגן')) return 'ac';
    if (cat === 'bodywork' || text.includes('פחחות') || text.includes('צבע') || text.includes('פגוש')) return 'bodywork';
    if (text.includes('שמן') || text.includes('פילטר')) return 'oil_change';
    if (cat === 'maintenance' || text.includes('טיפול') || text.includes('תחזוקה')) return 'maintenance';
    if (cat === 'repair' || text.includes('תיקון')) return 'repair';
    return null;
  };

  /** Handle a chosen file: compress, send to AI, populate form. */
  const handleReceiptFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanStatus('error');
      setScanMessage('נא לבחור תמונה בלבד');
      return;
    }
    setScanStatus('scanning');
    setScanMessage('מעבד תמונה...');
    try {
      const imageDataUrl = await compressReceiptImage(file);
      setReceiptImage(imageDataUrl);
      setScanMessage('מזהה פרטים עם AI...');

      const res = await fetch('/api/ai/scan-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl, context: 'treatment receipt' }),
      });
      if (!res.ok) throw new Error('scan failed');
      // The endpoint wraps the ScanResult in { success: true, data: {...} } —
      // unwrap it here, otherwise every field is undefined and the count is 0.
      const json = await res.json();
      const sd = json.data || json;

      // Count what the AI actually extracted. Don't trust the request succeeding —
      // OpenAI/Anthropic can return an empty/null response when the image is
      // unreadable, off-topic, or doesn't contain receipt-like data.
      const meaningfulFields = [
        sd.businessName,
        sd.totalAmount,
        sd.date,
        sd.summary,
        sd.description,
      ].filter((v) => v !== null && v !== undefined && v !== '');
      const filledCount = meaningfulFields.length;

      if (filledCount === 0) {
        // The AI returned a response but found nothing useful.
        // Keep the image (still saves as Document) but warn the user clearly
        // so they know to fill the form manually.
        setScanData(null);
        setScanStatus('error');
        setScanMessage('לא זוהו פרטים בתמונה. ודא שצולמה קבלה ברורה באור טוב — או המשך במילוי ידני.');
        return;
      }

      // We have at least one meaningful field — populate the form.
      setScanData(sd);
      const inferredType = mapToTreatmentType(sd);
      setAddForm(prev => ({
        ...prev,
        title: prev.title || sd.businessName || sd.description?.slice(0, 60) || prev.title,
        description: prev.description || sd.summary || sd.description || prev.description,
        garageName: prev.garageName || sd.businessName || prev.garageName,
        cost: prev.cost || (sd.totalAmount ? String(sd.totalAmount) : prev.cost),
        // Mileage (a.k.a. ספידומטר on Israeli receipts). The AI prompt
        // normalizes "99.882" to 99882 etc., so we trust whatever number we get.
        mileage: prev.mileage || (sd.mileage ? String(sd.mileage) : prev.mileage),
        date: sd.date || prev.date,
        type: inferredType && !prev.title ? inferredType : prev.type,
      }));

      setScanStatus('success');
      setScanMessage(`זוהו ${filledCount} פרטים מהקבלה. בדוק ועדכן אם צריך.`);
    } catch {
      setScanStatus('error');
      setScanMessage('סריקה נכשלה — המשך במילוי ידני.');
      setReceiptImage(null);
      setScanData(null);
    }
  };

  const handleReceiptInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleReceiptFile(file);
    e.target.value = '';
  };

  /** Wipe the scan so the user can take a different photo. */
  const clearReceiptScan = () => {
    setReceiptImage(null);
    setScanData(null);
    setScanStatus('idle');
    setScanMessage('');
  };

  const handleAddTreatment = async (skipPlateCheck = false, overrideVehicleId?: string) => {
    if (!addForm.vehicleId || !addForm.title || !addForm.type || !addForm.date) {
      setError('נא למלא רכב, סוג טיפול, כותרת ותאריך');
      return;
    }
    // Receipt plate vs. selected vehicle — ask before saving on mismatch
    if (!skipPlateCheck && scanData?.licensePlate) {
      const scannedPlate = String(scanData.licensePlate).replace(/\D/g, '');
      const selected = vehicles.find(v => v.id === addForm.vehicleId);
      const selectedPlate = (selected?.licensePlate || '').replace(/\D/g, '');
      if (scannedPlate && selectedPlate && scannedPlate !== selectedPlate) {
        const match = vehicles.find(v => v.licensePlate.replace(/\D/g, '') === scannedPlate);
        setPlateWarning({
          scanned: scannedPlate,
          matchId: match?.id,
          matchLabel: match ? `${match.nickname} (${match.licensePlate})` : undefined,
        });
        return;
      }
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: overrideVehicleId || addForm.vehicleId,
          type: addForm.type,
          title: addForm.title,
          description: addForm.description || undefined,
          garageName: addForm.garageName || undefined,
          mileage: addForm.mileage ? Number(addForm.mileage) : undefined,
          cost: addForm.cost ? Number(addForm.cost) : undefined,
          date: addForm.date,
          // When the user scanned a receipt, send the image + AI data along —
          // the backend will save it as a Document and link to the Expense.
          ...(receiptImage ? { receiptImage } : {}),
          ...(scanData ? { scanData } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בהוספת טיפול');
        setSaving(false);
        return;
      }
      // Tailor the success message so the user knows what got created
      if (receiptImage && data.documentId) {
        toast.success('הטיפול נוסף, הקבלה נשמרה במסמכים, וההוצאה עודכנה');
      } else if (data.expenseId) {
        toast.success('הטיפול נוסף וההוצאה עודכנה');
      } else {
        toast.success('הטיפול נוסף בהצלחה!');
      }
      setShowAddModal(false);
      setAddForm({
        vehicleId: vehicles.length === 1 ? vehicles[0].id : '',
        type: 'maintenance', title: '', description: '',
        garageName: '', mileage: '', cost: '',
        date: new Date().toISOString().split('T')[0],
      });
      clearReceiptScan();
      fetchTreatments();
    } catch {
      setError('שגיאת חיבור');
    }
    setSaving(false);
  };

  const scopedTreatments = vehicleFilter ? treatments.filter(t => t.vehicleId === vehicleFilter) : treatments;
  const pendingTreatments = scopedTreatments.filter(t => t.status === 'pending_approval');
  const otherTreatments = scopedTreatments.filter(t => t.status !== 'pending_approval');

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
                <h3 className="font-bold text-[#1B4E8A] truncate">{treatment.title}</h3>
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
                    <span className="font-medium text-[#1B4E8A]">
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
                <h4 className="text-sm font-semibold text-[#1B4E8A] mb-1">תיאור</h4>
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
                <h4 className="text-sm font-semibold text-[#1B4E8A] mb-2">פירוט עבודות</h4>
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
                צפה בדוח האבחון המלא
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
                    <div className="flex items-start gap-2">
                      <VoiceMicButton value={rejectReason} onResult={setRejectReason} className="mt-1.5" />
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="סיבת הדחייה (אופציונלי)..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                        rows={2}
                        dir="rtl"
                      />
                    </div>
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
      <div className="min-h-screen bg-[#F3F6FA] pb-24" dir="rtl">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] pb-24" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Page Header */}
        <PageHeader title="טיפולים" />
        {vehicleFilter && (
          <div className="mb-4 flex items-center justify-between gap-2 bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5">
            <span className="text-sm text-teal-800 font-medium">
              מציג טיפולים לרכב {vehicles.find(v => v.id === vehicleFilter)?.nickname || vehicles.find(v => v.id === vehicleFilter)?.licensePlate || 'נבחר'}
            </span>
            <button
              onClick={() => { setVehicleFilter(null); window.history.replaceState(null, '', '/user/treatments'); }}
              className="text-sm text-teal-700 font-semibold hover:text-teal-900 whitespace-nowrap"
            >
              הצג הכל
            </button>
          </div>
        )}

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
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2E77D0] text-white rounded-2xl font-bold hover:bg-[#2563B0] transition-all shadow-md"
            >
              <Plus size={20} />
              הוסף טיפול חדש
            </button>
          </div>
        )}

        {/* Stats Row - Only show if there are treatments */}
        {treatments.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-xl p-3 shadow-sm text-center">
              <div className="text-2xl font-bold text-[#1B4E8A]">{treatments.length}</div>
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
              <h2 className="text-lg font-bold text-[#1B4E8A]">
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
            <h2 className="text-lg font-bold text-[#1B4E8A] mb-4">
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
            <h3 className="text-lg font-bold text-[#1B4E8A] mb-2">אין טיפולים עדיין</h3>
            <p className="text-sm text-gray-400 mb-6">כאשר מוסך ישלח טיפול, הוא יופיע כאן לאישור</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2E77D0] text-white rounded-2xl font-bold hover:bg-[#2563B0] transition-all shadow-md"
            >
              <Plus size={18} />
              הוסף טיפול חדש
            </button>
          </div>
        )}
      </div>

      {/* Add Treatment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); clearReceiptScan(); }}
        title="הוספת טיפול"
        size="lg"
      >
        <div className="space-y-4">
          {/* ─── Receipt scan section ───
              Hidden file inputs trigger native camera / file picker.
              The card changes color based on scan state to give clear feedback. */}
          <div className={`rounded-xl border-2 border-dashed p-3 transition-all ${
            scanStatus === 'scanning' ? 'border-teal-400 bg-teal-50' :
            scanStatus === 'success' ? 'border-green-400 bg-green-50' :
            scanStatus === 'error' ? 'border-red-300 bg-red-50' :
            'border-blue-300 bg-gradient-to-l from-blue-50 to-indigo-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {scanStatus === 'scanning' ? (
                <Loader2 size={16} className="text-teal-600 animate-spin" />
              ) : scanStatus === 'success' ? (
                <CheckCircle size={16} className="text-green-600" />
              ) : scanStatus === 'error' ? (
                <AlertTriangle size={16} className="text-red-500" />
              ) : (
                <Scan size={16} className="text-blue-600" />
              )}
              <span className={`text-xs font-medium ${
                scanStatus === 'success' ? 'text-green-700' :
                scanStatus === 'error' ? 'text-red-700' :
                scanStatus === 'scanning' ? 'text-teal-700' :
                'text-blue-700'
              }`}>
                {scanMessage || 'יש קבלה? צלם אותה והפרטים יתמלאו אוטומטית'}
              </span>
            </div>

            {/* Show thumbnail when we have a scanned image */}
            {receiptImage && (
              <div className="mb-2 flex items-center gap-2">
                <img
                  src={receiptImage}
                  alt="קבלה שנסרקה"
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={clearReceiptScan}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-600"
                >
                  <X size={12} />
                  הסר קבלה
                </button>
                <span className="text-xs text-gray-500">תישמר כקבלה במסמכים</span>
              </div>
            )}

            {scanStatus !== 'scanning' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                >
                  <Camera size={14} /> צלם קבלה
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-white text-blue-700 border border-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-50 transition"
                >
                  <Upload size={14} /> העלה תמונה
                </button>
              </div>
            )}

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleReceiptInputChange}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReceiptInputChange}
            />
          </div>

          {/* Vehicle selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">רכב *</label>
            <select
              value={addForm.vehicleId}
              onChange={e => setAddForm({ ...addForm, vehicleId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
            >
              <option value="">בחר רכב</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.nickname} ({v.licensePlate})</option>
              ))}
            </select>
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">סוג טיפול *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'maintenance', label: 'תחזוקה', icon: '🔧' },
                { value: 'repair', label: 'תיקון', icon: '🛠️' },
                { value: 'oil_change', label: 'החלפת שמן', icon: '🛢️' },
                { value: 'tires', label: 'צמיגים', icon: '🔄' },
                { value: 'brakes', label: 'בלמים', icon: '🛑' },
                { value: 'electrical', label: 'חשמל', icon: '⚡' },
                { value: 'ac', label: 'מיזוג', icon: '❄️' },
                { value: 'bodywork', label: 'פחחות', icon: '🚗' },
                { value: 'other', label: 'אחר', icon: '📋' },
              ].map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setAddForm({ ...addForm, type: t.value, title: addForm.title || t.label })}
                  className={`p-2 rounded-xl border-2 text-center transition text-xs font-medium ${
                    addForm.type === t.value
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <span className="text-lg block mb-0.5">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="כותרת *"
                placeholder="למשל: החלפת שמן + פילטר"
                value={addForm.title}
                onChange={e => setAddForm({ ...addForm, title: e.target.value })}
              />
            </div>
            <VoiceMicButton value={addForm.title} onResult={v => setAddForm({ ...addForm, title: v })} className="mb-1" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">תיאור (אופציונלי)</label>
            <div className="flex items-start gap-2">
              <VoiceMicButton value={addForm.description} onResult={v => setAddForm({ ...addForm, description: v })} className="mt-1.5" />
              <textarea
                placeholder="פרטים נוספים על הטיפול..."
                value={addForm.description}
                onChange={e => setAddForm({ ...addForm, description: e.target.value })}
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm resize-none"
                rows={2}
                dir="rtl"
              />
            </div>
          </div>

          {/* Garage, Mileage, Cost, Date */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="שם מוסך"
              placeholder="למשל: מוסך יוסי"
              value={addForm.garageName}
              onChange={e => setAddForm({ ...addForm, garageName: e.target.value })}
            />
            <Input
              label="תאריך *"
              type="date"
              value={addForm.date}
              onChange={e => setAddForm({ ...addForm, date: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="ק״מ"
              type="number"
              placeholder="45000"
              value={addForm.mileage}
              onChange={e => setAddForm({ ...addForm, mileage: e.target.value })}
            />
            <Input
              label="עלות (₪)"
              type="number"
              placeholder="350"
              value={addForm.cost}
              onChange={e => setAddForm({ ...addForm, cost: e.target.value })}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1">ביטול</Button>
            <Button
              loading={saving}
              onClick={() => handleAddTreatment()}
              className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600"
              disabled={!addForm.vehicleId || !addForm.title || !addForm.type}
            >
              הוסף טיפול
            </Button>
          </div>
        </div>
      </Modal>

      {/* Plate mismatch confirmation */}
      <Modal
        isOpen={!!plateWarning}
        onClose={() => setPlateWarning(null)}
        title="מספר הרכב לא תואם"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <p>
              על הקבלה מופיע מספר רכב <b dir="ltr">{plateWarning?.scanned}</b>,{' '}
              {plateWarning?.matchLabel ? (
                <>שתואם רכב אחר שלך: <b>{plateWarning.matchLabel}</b>.</>
              ) : (
                <>שלא תואם אף רכב שלך — ייתכן שהמספר נרשם שגוי בקבלה.</>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {plateWarning?.matchLabel && (
              <Button
                loading={saving}
                onClick={() => {
                  const id = plateWarning?.matchId;
                  if (!id) return;
                  setAddForm(prev => ({ ...prev, vehicleId: id }));
                  setPlateWarning(null);
                  handleAddTreatment(true, id);
                }}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600"
              >
                שמור לרכב {plateWarning.matchLabel}
              </Button>
            )}
            <Button
              loading={saving}
              onClick={() => { setPlateWarning(null); handleAddTreatment(true); }}
              className="w-full"
            >
              שמור בכל זאת לרכב שנבחר
            </Button>
            <Button variant="ghost" onClick={() => setPlateWarning(null)} className="w-full">
              ביטול
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
