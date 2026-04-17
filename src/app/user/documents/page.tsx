'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import {
  FileText, Trash2, AlertTriangle, Calendar, ChevronDown,
  Loader2, Upload, X, Camera, Eye, Car,
  CheckCircle, AlertCircle, Scan
} from 'lucide-react';

// =============================================
// Types & Constants
// =============================================

interface Vehicle {
  id: string;
  nickname: string;
  manufacturer: string;
  model: string;
  licensePlate: string;
}

interface Document {
  id: string;
  vehicleId: string;
  type: string;
  title: string;
  description?: string;
  fileUrl?: string;
  expiryDate?: string;
  uploadedAt: string;
}

const CATEGORIES = [
  { id: 'all', label: 'הכל', icon: '📋' },
  { id: 'vehicle_license', label: 'רישיון רכב', icon: '🚗' },
  { id: 'driving_license', label: 'רישיון נהיגה', icon: '🪪' },
  { id: 'insurance', label: 'ביטוח', icon: '🛡️' },
  { id: 'receipt', label: 'קבלה', icon: '🧾' },
];

const CATEGORY_MAP: Record<string, { label: string; color: string; icon: string }> = {
  vehicle_license: { label: 'רישיון רכב', color: 'bg-blue-100 text-blue-700', icon: '🪪' },
  driving_license: { label: 'רישיון נהיגה', color: 'bg-green-100 text-green-700', icon: '📋' },
  insurance: { label: 'ביטוח', color: 'bg-purple-100 text-purple-700', icon: '🛡️' },
  receipt: { label: 'קבלה', color: 'bg-orange-100 text-orange-700', icon: '🧾' },
};

function mapOldType(type: string): string {
  if (type.startsWith('insurance')) return 'insurance';
  if (['license', 'registration'].includes(type)) return 'vehicle_license';
  if (type === 'vehicle_license') return 'vehicle_license';
  if (type === 'driving_license') return 'driving_license';
  if (type === 'receipt') return 'receipt';
  if (type === 'test_certificate') return 'vehicle_license';
  return 'receipt';
}

// =============================================
// Helpers
// =============================================

function classifyByFilename(fileName: string): string {
  const name = fileName.toLowerCase();
  if ((name.includes('רישיון') && name.includes('נהיגה')) || (name.includes('driving') && name.includes('license'))) return 'driving_license';
  if (name.includes('רישיון') || name.includes('רכב') || name.includes('vehicle') || name.includes('license')) return 'vehicle_license';
  if (name.includes('ביטוח') || name.includes('insurance') || name.includes('פוליס')) return 'insurance';
  if (name.includes('קבלה') || name.includes('receipt') || name.includes('חשבונית')) return 'receipt';
  return '';
}

// =============================================
// Main Page Component
// =============================================

export default function DocumentsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [detectedCategory, setDetectedCategory] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadExpiry, setUploadExpiry] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [scanResults, setScanResults] = useState<{
    licensePlate?: string; expiryDate?: string; totalAmount?: number;
    businessName?: string; mileage?: number; date?: string;
    invoiceNumber?: string; description?: string;
  } | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ fileUrl: string; title: string } | null>(null);

  // Derived: is upload form visible?
  const isUploading = !!uploadFile || scanning;

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch('/api/vehicles');
        if (res.status === 401) { window.location.href = '/auth/login'; return; }
        const data = await res.json();
        if (data.vehicles?.length > 0) {
          setVehicles(data.vehicles);
          setSelectedVehicle(data.vehicles[0].id);
        }
      } catch { setVehicles([]); }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const url = selectedVehicle ? `/api/documents?vehicleId=${selectedVehicle}` : '/api/documents';
        const res = await fetch(url);
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch { setDocuments([]); }
      setLoading(false);
    };
    if (selectedVehicle) fetchDocuments();
  }, [selectedVehicle]);

  // Scroll to form when file selected
  useEffect(() => {
    if (isUploading && formRef.current) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [isUploading]);

  // Compress image for upload (max 1200px, quality 0.7) to stay under API body limit
  const compressForUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load')); };
      img.src = url;
    });
  };

  const handleFileSelected = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('גודל הקובץ חייב להיות קטן מ-10MB');
      return;
    }
    setUploadFile(file);
    setError('');
    setScanResults(null);
    setDetectedCategory('');
    setSelectedCategory('');
    setUploadTitle('');
    setUploadExpiry('');
    setUploadDescription('');

    // Preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setUploadPreview('');
    }

    // AI scan for images
    if (file.type.startsWith('image/')) {
      setScanning(true);
      setScanProgress('מכין תמונה לסריקה...');
      try {
        const imageDataUrl = await compressForUpload(file);
        setScanProgress('סורק מסמך עם AI...');

        const res = await fetch('/api/ai/scan-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageDataUrl, context: 'uploading document' }),
          signal: AbortSignal.timeout(35000),
        });

        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            // Map AI category to documents page categories
            const categoryMap: Record<string, string> = {
              insurance: 'insurance', receipt: 'receipt',
              test: 'vehicle_license', registration: 'vehicle_license', other: 'receipt',
            };
            const mapped = categoryMap[data.suggestedCategory] || 'receipt';
            setDetectedCategory(mapped);
            setSelectedCategory(mapped);

            // Auto-fill title from document type or description
            if (data.documentTypeHebrew) {
              setUploadTitle(data.documentTypeHebrew);
            } else if (CATEGORY_MAP[mapped]) {
              setUploadTitle(CATEGORY_MAP[mapped].label);
            }

            // Auto-fill expiry date
            if (data.expiryDate) setUploadExpiry(data.expiryDate);

            // Auto-fill description from summary
            if (data.summary) setUploadDescription(data.summary);

            // Store all scan results for display
            setScanResults({
              licensePlate: data.licensePlate || undefined,
              expiryDate: data.expiryDate || undefined,
              totalAmount: data.totalAmount || undefined,
              businessName: data.businessName || undefined,
              mileage: data.mileage || undefined,
              date: data.date || undefined,
              invoiceNumber: data.invoiceNumber || undefined,
              description: data.description || undefined,
            });
            setScanProgress('הסריקה הושלמה!');
          } else {
            const byName = classifyByFilename(file.name);
            if (byName) { setDetectedCategory(byName); setSelectedCategory(byName); if (CATEGORY_MAP[byName]) setUploadTitle(CATEGORY_MAP[byName].label); }
            setScanProgress('לא זוהו פרטים, נא לבחור קטגוריה ידנית');
          }
        } else {
          // API error — fall back to filename classification
          const byName = classifyByFilename(file.name);
          if (byName) { setDetectedCategory(byName); setSelectedCategory(byName); if (CATEGORY_MAP[byName]) setUploadTitle(CATEGORY_MAP[byName].label); }
          setScanProgress('שגיאה בסריקה, נא לבחור קטגוריה ידנית');
        }
      } catch (err) {
        console.error('AI Scan Error:', err);
        const byName = classifyByFilename(file.name);
        if (byName) { setDetectedCategory(byName); setSelectedCategory(byName); if (CATEGORY_MAP[byName]) setUploadTitle(CATEGORY_MAP[byName].label); }
        setScanProgress('שגיאה בסריקה, נא לבחור קטגוריה ידנית');
      }
      setScanning(false);
    } else {
      const byName = classifyByFilename(file.name);
      if (byName) { setDetectedCategory(byName); setSelectedCategory(byName); if (CATEGORY_MAP[byName]) setUploadTitle(CATEGORY_MAP[byName].label); }
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedCategory || !selectedVehicle) {
      setError('נא לבחור קטגוריה');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let fileData = null;
      if (uploadFile) {
        fileData = await compressForUpload(uploadFile);
      }
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicle,
          type: selectedCategory,
          title: uploadTitle || CATEGORY_MAP[selectedCategory]?.label || 'מסמך',
          description: uploadDescription || undefined,
          fileData,
          expiryDate: uploadExpiry || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה בהעלאת מסמך'); setSaving(false); return; }
      resetUploadForm();
      // Refresh documents list
      try {
        const fetchRes = await fetch(`/api/documents?vehicleId=${selectedVehicle}`);
        if (fetchRes.ok) {
          const fetchData = await fetchRes.json();
          setDocuments(fetchData.documents || []);
        }
      } catch { /* refresh failed — document was saved successfully */ }
    } catch (err) {
      console.error('Upload error:', err);
      setError('שגיאת חיבור — נסה שוב או צלם מחדש בפורמט קטן יותר');
    }
    setSaving(false);
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadPreview('');
    setDetectedCategory('');
    setSelectedCategory('');
    setUploadTitle('');
    setUploadExpiry('');
    setUploadDescription('');
    setScanResults(null);
    setScanProgress('');
    setError('');
  };

  const handleDeleteDocument = async (docId: string) => {
    setDeleting(docId);
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) { setError('שגיאה בהסרת מסמך'); setDeleting(null); return; }
      setDocuments(documents.filter(d => d.id !== docId));
      setShowDeleteConfirm(null);
    } catch { setError('שגיאת חיבור'); }
    setDeleting(null);
  };

  const getDocumentStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { status: 'expired', label: 'פג תוקף', color: 'border-red-200 bg-red-50', textColor: 'text-red-600', barColor: 'bg-red-500' };
    if (daysLeft < 30) return { status: 'expiring', label: daysLeft + ' ימים', color: 'border-amber-200 bg-amber-50', textColor: 'text-amber-600', barColor: 'bg-amber-500' };
    return { status: 'valid', label: 'בתוקף', color: 'border-green-200 bg-green-50', textColor: 'text-green-600', barColor: 'bg-green-500' };
  };

  const getFilteredDocuments = () => {
    if (activeFilter === 'all') return documents;
    return documents.filter(doc => {
      const mapped = mapOldType(doc.type);
      return mapped === activeFilter || doc.type === activeFilter;
    });
  };

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return documents.length;
    return documents.filter(doc => {
      const mapped = mapOldType(doc.type);
      return mapped === catId || doc.type === catId;
    }).length;
  };

  const currentVehicle = vehicles.find(v => v.id === selectedVehicle);
  const filteredDocs = getFilteredDocuments();
  const vehicleName = currentVehicle ? (currentVehicle.nickname || `${currentVehicle.manufacturer} ${currentVehicle.model}`) : '';

  if (loading && vehicles.length === 0) {
    return <PageSkeleton />;
  }

  // Organize documents by section
  const vehicleDocTypes = ['vehicle_license', 'driving_license', 'insurance'];
  const receiptDocTypes = ['receipt'];

  const vehicleDocuments = filteredDocs.filter(doc => {
    const mapped = mapOldType(doc.type);
    return vehicleDocTypes.includes(mapped);
  });

  const receiptDocuments = filteredDocs.filter(doc => {
    const mapped = mapOldType(doc.type);
    return receiptDocTypes.includes(mapped);
  });

  return (
    <div className="bg-[#fef7ed] min-h-screen pb-24" dir="rtl">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={(e) => { if (e.target.files?.[0]) handleFileSelected(e.target.files[0]); e.target.value = ''; }} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
        onChange={(e) => { if (e.target.files?.[0]) handleFileSelected(e.target.files[0]); e.target.value = ''; }} className="hidden" />

      {/* Page Header */}
      <PageHeader title="מסמכים" subtitle={vehicleName} />

      <div className="px-4 space-y-6 pt-6" style={{ maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>

        {/* Vehicle Selector - compact, only if multiple vehicles */}
        {vehicles.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-teal-300 transition shadow-sm"
            >
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showVehicleDropdown ? 'rotate-180' : ''}`} />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 text-sm">
                  {currentVehicle?.nickname || (currentVehicle?.manufacturer + ' ' + currentVehicle?.model)}
                </span>
                <span className="text-xs text-gray-400">· {currentVehicle?.licensePlate}</span>
                <Car size={16} className="text-gray-500" />
              </div>
            </button>
            {showVehicleDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVehicle(v.id); setShowVehicleDropdown(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-right hover:bg-teal-50 transition ${v.id === selectedVehicle ? 'bg-teal-50' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-800">{v.nickname || v.manufacturer + ' ' + v.model}</div>
                      <div className="text-[11px] text-gray-400">{v.licensePlate}</div>
                    </div>
                    <Car size={14} className="text-gray-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload / Scan - compact unified buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm shadow-sm hover:bg-teal-700 active:scale-[0.98] transition"
          >
            <Camera size={18} />
            <span>סרוק מסמך</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-teal-700 font-semibold text-sm border-2 border-teal-600 hover:bg-teal-50 active:scale-[0.98] transition"
          >
            <Upload size={18} />
            <span>העלה קובץ</span>
          </button>
        </div>

        {/* ================================================ */}
        {/* UPLOAD FORM - Inline, expands on file selection  */}
        {/* ================================================ */}
        {isUploading && (
          <div ref={formRef} className="bg-white rounded-2xl p-4 shadow-sm space-y-4 border-2 border-purple-200">

            {/* Scanning progress */}
            {scanning && (
              <div>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Loader2 size={20} className="text-purple-600 animate-spin" />
                  <span className="text-sm font-semibold text-purple-800">סורק את המסמך...</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-1.5 overflow-hidden mb-2">
                  <div className="bg-purple-600 h-full rounded-full animate-pulse" style={{ width: '100%' }} />
                </div>
                <p className="text-xs text-purple-600 text-center">{scanProgress}</p>
              </div>
            )}

            {/* File selection form */}
            {uploadFile && !scanning && (
              <div className="space-y-4">
                {/* File preview + cancel */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  {uploadPreview ? (
                    <img src={uploadPreview} alt="תצוגה מקדימה" loading="lazy" className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                  ) : (
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{uploadFile.name}</p>
                    <p className="text-xs text-gray-400">{(uploadFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={resetUploadForm} aria-label="הסר קובץ"
                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 transition flex-shrink-0">
                    <X size={18} />
                  </button>
                </div>

                {/* Scan results banner */}
                {(detectedCategory || scanResults?.expiryDate || scanResults?.totalAmount) && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-purple-600" />
                      <span className="text-sm font-semibold text-purple-800">
                        תוצאות סריקת AI:
                      </span>
                    </div>
                    {detectedCategory && (
                      <p className="text-sm text-purple-700 mr-6">
                        סוג מסמך: <strong>{CATEGORY_MAP[detectedCategory]?.label}</strong>
                      </p>
                    )}
                    {scanResults?.date && (
                      <p className="text-sm text-purple-700 mr-6">
                        תאריך: <strong>{new Date(scanResults.date).toLocaleDateString('he-IL')}</strong>
                      </p>
                    )}
                    {scanResults?.expiryDate && (
                      <p className="text-sm text-purple-700 mr-6">
                        תוקף: <strong>{new Date(scanResults.expiryDate).toLocaleDateString('he-IL')}</strong>
                      </p>
                    )}
                    {scanResults?.totalAmount != null && (
                      <p className="text-sm text-purple-700 mr-6">
                        סכום: <strong>₪{scanResults.totalAmount.toLocaleString('he-IL')}</strong>
                      </p>
                    )}
                    {scanResults?.businessName && (
                      <p className="text-sm text-purple-700 mr-6">
                        עסק: <strong>{scanResults.businessName}</strong>
                      </p>
                    )}
                    {scanResults?.mileage && (
                      <p className="text-sm text-purple-700 mr-6">
                        קילומטראז׳: <strong>{scanResults.mileage.toLocaleString('he-IL')} ק״מ</strong>
                      </p>
                    )}
                    {scanResults?.invoiceNumber && (
                      <p className="text-sm text-purple-700 mr-6">
                        מס׳ חשבונית: <strong>{scanResults.invoiceNumber}</strong>
                      </p>
                    )}
                    {scanResults?.licensePlate && (
                      <p className="text-sm text-purple-700 mr-6">
                        מספר רכב: <strong>{scanResults.licensePlate}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Category selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">סוג מסמך</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedCategory(key);
                          if (!uploadTitle || uploadTitle === CATEGORY_MAP[selectedCategory]?.label) setUploadTitle(cat.label);
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition min-h-[80px] justify-center ${
                          selectedCategory === key
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                        }`}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className={`text-xs font-semibold ${selectedCategory === key ? 'text-purple-700' : 'text-gray-700'}`}>{cat.label}</span>
                        {detectedCategory === key && (
                          <span className="text-[10px] text-purple-500 flex items-center gap-0.5"><Scan size={10} /> זוהה</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <Input label="כותרת" placeholder="למשל: רישיון רכב 2026"
                  value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} dir="rtl" />

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">
                    תאריך תוקף
                    {scanResults?.expiryDate && (
                      <span className="text-purple-600 text-xs mr-2">(זוהה אוטומטית)</span>
                    )}
                  </label>
                  <Input type="date" value={uploadExpiry} onChange={(e) => setUploadExpiry(e.target.value)} />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">הערות (אופציונלי)</label>
                  <textarea placeholder="הערות נוספות..."
                    value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-right text-sm"
                    rows={2} dir="rtl" />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={resetUploadForm} className="flex-1">ביטול</Button>
                  <Button loading={saving} onClick={handleUploadSubmit} className="flex-1">
                    שמור מסמך
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================ */}
        {/* DOCUMENTS SECTIONS                               */}
        {/* ================================================ */}

        {/* Filter - unified dropdown */}
        {documents.length > 0 && (
          <div className="flex items-center justify-end">
            <label className="relative inline-flex items-center bg-white rounded-xl border border-gray-200 shadow-sm px-3 py-2 gap-2 text-sm font-semibold text-gray-700">
              <span className="text-gray-500 text-xs">סנן לפי:</span>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="bg-transparent border-0 outline-none font-semibold text-[#1e3a5f] pr-1"
              >
                {CATEGORIES.map(cat => {
                  const count = getCategoryCount(cat.id);
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}{count > 0 && cat.id !== 'all' ? ` (${count})` : ''}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredDocs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-bold text-gray-600 mb-2">
              {documents.length === 0 ? 'אין מסמכים' : 'אין מסמכים בקטגוריה זו'}
            </h3>
            <p className="text-gray-500 text-sm">
              {documents.length === 0 ? 'העלה או צלם מסמך והמערכת תמיין אותו אוטומטית' : 'נסה קטגוריה אחרת'}
            </p>
          </div>
        )}

        {/* Vehicle Documents Section */}
        {!loading && activeFilter === 'all' && vehicleDocuments.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-700">מסמכי רכב</h2>
            {vehicleDocuments.map(doc => renderDocumentCard(doc))}
          </div>
        )}

        {/* Vehicle Documents (filtered) */}
        {!loading && activeFilter !== 'all' && vehicleDocTypes.includes(activeFilter) && vehicleDocuments.length > 0 && (
          <div className="space-y-3">
            {vehicleDocuments.map(doc => renderDocumentCard(doc))}
          </div>
        )}

        {/* Receipts Section */}
        {!loading && activeFilter === 'all' && receiptDocuments.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-700">קבלות</h2>
            {receiptDocuments.map(doc => renderDocumentCard(doc))}
          </div>
        )}

        {/* Receipts (filtered) */}
        {!loading && activeFilter === 'receipt' && receiptDocuments.length > 0 && (
          <div className="space-y-3">
            {receiptDocuments.map(doc => renderDocumentCard(doc))}
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingDoc(null)}>
          <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between bg-white rounded-t-2xl px-4 py-3">
              <button onClick={() => setViewingDoc(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={20} />
              </button>
              <h3 className="font-bold text-gray-800 text-sm">{viewingDoc.title}</h3>
              <div className="w-8" />
            </div>
            <div className="bg-white rounded-b-2xl overflow-auto flex-1 flex items-center justify-center p-2">
              {viewingDoc.fileUrl.startsWith('data:image') || viewingDoc.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={viewingDoc.fileUrl} alt={viewingDoc.title} loading="lazy"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              ) : viewingDoc.fileUrl.startsWith('data:application/pdf') || viewingDoc.fileUrl.endsWith('.pdf') ? (
                <iframe src={viewingDoc.fileUrl} className="w-full h-[70vh] rounded-lg" />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">לא ניתן להציג קובץ מסוג זה</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render a document card
  function renderDocumentCard(doc: Document) {
    const catKey = mapOldType(doc.type);
    const cat = CATEGORY_MAP[catKey] || CATEGORY_MAP.receipt;
    const status = getDocumentStatus(doc.expiryDate);

    return (
      <div key={doc.id} className={`relative bg-white rounded-2xl overflow-hidden shadow-sm transition border-2 ${status?.color || 'border-gray-200'}`}>
        {doc.expiryDate && status && (
          <div className={`absolute top-0 right-0 left-0 h-1.5 ${status.barColor}`} />
        )}
        <div className="p-4 flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">
            {catKey === 'vehicle_license' && '🪪'}
            {catKey === 'driving_license' && '📋'}
            {catKey === 'insurance' && '🛡️'}
            {catKey === 'receipt' && '🧾'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-gray-800 text-sm truncate">{doc.title}</h4>
              <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${cat.color}`}>{cat.label}</span>
            </div>
            {doc.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{doc.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
              {doc.expiryDate && status && (
                <span className={`flex items-center gap-1 font-semibold ${status.textColor}`}>
                  {status.status === 'expired' && '❌ פג תוקף'}
                  {status.status === 'expiring' && '⚠️ פוקע בקרוב'}
                  {status.status === 'valid' && '✓ בתוקף'}
                  {' עד '}
                  {new Date(doc.expiryDate).toLocaleDateString('he-IL')}
                </span>
              )}
              {doc.uploadedAt && (
                <span>הועלה: {new Date(doc.uploadedAt).toLocaleDateString('he-IL')}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {doc.fileUrl && (
              <button onClick={() => setViewingDoc({ fileUrl: doc.fileUrl!, title: doc.title })}
                className="p-2 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition">
                <Eye size={16} />
              </button>
            )}
            <button onClick={() => setShowDeleteConfirm(doc.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Delete confirm overlay */}
        {showDeleteConfirm === doc.id && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 z-10 rounded-2xl">
            <div className="bg-white rounded-xl p-4 text-center shadow-lg">
              <AlertTriangle size={24} className="text-red-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-800 text-sm mb-3">למחוק מסמך זה?</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-xs font-medium">ביטול</button>
                <button onClick={() => handleDeleteDocument(doc.id)} disabled={deleting === doc.id}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-xs font-medium disabled:opacity-50">
                  {deleting === doc.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'מחק'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
