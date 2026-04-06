'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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
  vehicle_license: { label: 'רישיון רכב', color: 'bg-blue-100 text-blue-700', icon: '🚗' },
  driving_license: { label: 'רישיון נהיגה', color: 'bg-green-100 text-green-700', icon: '🪪' },
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
// OCR Helpers
// =============================================

function parseDocumentText(text: string) {
  const result: { expiryDate?: string; category?: string; licensePlate?: string } = {};
  const lower = text.toLowerCase();

  // Labeled dates
  const labeledDatePatterns = [
    /תוקף[\s:]*(?:עד)?[\s:]*(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})/,
    /בתוקף[\s:]*(?:עד)?[\s:]*(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})/,
    /valid[\s]*(?:until|to|thru)?[\s:]*(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})/i,
  ];
  for (const pattern of labeledDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      let [, day, month, year] = match;
      if (year.length === 2) year = '20' + year;
      result.expiryDate = year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0');
      break;
    }
  }

  // Latest future date fallback
  if (!result.expiryDate) {
    const allDates = [...text.matchAll(/(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})/g)];
    const today = new Date();
    let latestFuture = '';
    for (const match of allDates) {
      let [, day, month, year] = match;
      if (year.length === 2) year = '20' + year;
      const y = parseInt(year), m = parseInt(month), d = parseInt(day);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2024 && y <= 2035) {
        const dateStr = year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0');
        const date = new Date(dateStr);
        if (date > today && (!latestFuture || dateStr > latestFuture)) latestFuture = dateStr;
      }
    }
    if (latestFuture) result.expiryDate = latestFuture;
  }

  // Category
  if (lower.includes('רישיון נהיגה') || lower.includes('driving license') || lower.includes('driver')) {
    result.category = 'driving_license';
  } else if (lower.includes('ביטוח') || lower.includes('פוליס') || lower.includes('insurance') || lower.includes('חובה') || lower.includes('מקיף')) {
    result.category = 'insurance';
  } else if (lower.includes('קבלה') || lower.includes('חשבונית') || lower.includes('receipt') || lower.includes('invoice')) {
    result.category = 'receipt';
  } else if (lower.includes('רישיון') || lower.includes('רכב') || lower.includes('vehicle') || lower.includes('license') || lower.includes('רישום')) {
    result.category = 'vehicle_license';
  }

  const plateMatch = text.match(/(\d{2,3}[-\s]?\d{2,3}[-\s]?\d{2,3})/);
  if (plateMatch) {
    const plate = plateMatch[1].replace(/[-\s]/g, '');
    if (plate.length >= 7 && plate.length <= 8) result.licensePlate = plate;
  }

  return result;
}

function classifyByFilename(fileName: string): string {
  const name = fileName.toLowerCase();
  if ((name.includes('רישיון') && name.includes('נהיגה')) || (name.includes('driving') && name.includes('license'))) return 'driving_license';
  if (name.includes('רישיון') || name.includes('רכב') || name.includes('vehicle') || name.includes('license')) return 'vehicle_license';
  if (name.includes('ביטוח') || name.includes('insurance') || name.includes('פוליס')) return 'insurance';
  if (name.includes('קבלה') || name.includes('receipt') || name.includes('חשבונית')) return 'receipt';
  return '';
}

function resizeImageForOCR(file: File, maxWidth = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width <= maxWidth && img.height <= maxWidth) {
        resolve(URL.createObjectURL(file));
        return;
      }
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Failed to resize')); return; }
        resolve(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
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
  const [scanResults, setScanResults] = useState<{ licensePlate?: string; expiryDate?: string } | null>(null);

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

    // OCR for images
    if (file.type.startsWith('image/')) {
      setScanning(true);
      setScanProgress('מכין תמונה לסריקה...');
      let imageUrl = '';
      try {
        imageUrl = await resizeImageForOCR(file);
        setScanProgress('טוען מנוע סריקה...');
        const { createWorker } = await import('tesseract.js');
        setScanProgress('מאתחל סריקה...');
        const worker = await createWorker('heb+eng', undefined, {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === 'recognizing text') setScanProgress(`סורק... ${Math.round(m.progress * 100)}%`);
            else if (m.status === 'loading language traineddata') setScanProgress(`טוען נתוני שפה... ${Math.round(m.progress * 100)}%`);
          },
        });
        setScanProgress('סורק את המסמך...');
        const ocrResult = await worker.recognize(imageUrl);
        await worker.terminate();
        URL.revokeObjectURL(imageUrl);
        const ocrText = ocrResult.data.text;

        if (ocrText && ocrText.trim().length >= 5) {
          const parsed = parseDocumentText(ocrText);
          if (parsed.category) {
            setDetectedCategory(parsed.category);
            setSelectedCategory(parsed.category);
            if (CATEGORY_MAP[parsed.category]) setUploadTitle(CATEGORY_MAP[parsed.category].label);
          } else {
            const byName = classifyByFilename(file.name);
            if (byName) { setDetectedCategory(byName); setSelectedCategory(byName); if (CATEGORY_MAP[byName]) setUploadTitle(CATEGORY_MAP[byName].label); }
          }
          if (parsed.expiryDate) setUploadExpiry(parsed.expiryDate);
          setScanResults({ licensePlate: parsed.licensePlate, expiryDate: parsed.expiryDate });
          setScanProgress('הסריקה הושלמה!');
        } else {
          const byName = classifyByFilename(file.name);
          if (byName) { setDetectedCategory(byName); setSelectedCategory(byName); if (CATEGORY_MAP[byName]) setUploadTitle(CATEGORY_MAP[byName].label); }
          setScanProgress('לא זוהה טקסט, נא לבחור קטגוריה ידנית');
        }
      } catch (err) {
        console.error('OCR Error:', err);
        if (imageUrl) URL.revokeObjectURL(imageUrl);
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
        const reader = new FileReader();
        fileData = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(uploadFile);
        });
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
      const fetchRes = await fetch(`/api/documents?vehicleId=${selectedVehicle}`);
      const fetchData = await fetchRes.json();
      setDocuments(fetchData.documents || []);
    } catch {
      setError('שגיאת חיבור');
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
    if (daysLeft < 0) return { status: 'expired', label: 'פג תוקף', color: 'bg-red-50 border-red-200', textColor: 'text-red-600', barColor: 'bg-red-500' };
    if (daysLeft < 30) return { status: 'expiring', label: daysLeft + ' ימים', color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-600', barColor: 'bg-amber-500' };
    return { status: 'valid', label: 'בתוקף', color: 'bg-green-50 border-green-200', textColor: 'text-green-600', barColor: 'bg-green-500' };
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

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-12 lg:pt-0 pb-24" dir="rtl">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={(e) => { if (e.target.files?.[0]) handleFileSelected(e.target.files[0]); e.target.value = ''; }} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
        onChange={(e) => { if (e.target.files?.[0]) handleFileSelected(e.target.files[0]); e.target.value = ''; }} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <FileText size={20} className="text-[#1e3a5f]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">מסמכים</h1>
        </div>
      </div>

      {/* Vehicle Selector */}
      {vehicles.length > 0 && (
        <div className="px-3 sm:px-0">
          <div className="text-right mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-500">בחר רכב</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-teal-300 transition bg-white shadow-sm"
            >
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${showVehicleDropdown ? 'rotate-180' : ''}`} />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold text-gray-800 text-sm">{currentVehicle?.nickname || (currentVehicle?.manufacturer + ' ' + currentVehicle?.model)}</div>
                  <div className="text-xs text-gray-400">{currentVehicle?.licensePlate}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Car size={18} className="text-gray-300" />
                </div>
              </div>
            </button>
            {showVehicleDropdown && vehicles.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVehicle(v.id); setShowVehicleDropdown(false); }}
                    className={`w-full flex items-center gap-3 p-3 text-right hover:bg-[#fef7ed]/50 transition ${v.id === selectedVehicle ? 'bg-teal-50' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="font-bold text-sm text-gray-800">{v.nickname || v.manufacturer + ' ' + v.model}</div>
                      <div className="text-xs text-gray-400">{v.licensePlate}</div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Car size={14} className="text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================ */}
      {/* UPLOAD SECTION - always visible, expands on file  */}
      {/* ================================================ */}
      <div ref={formRef} className="px-3 sm:px-0">
        <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
          isUploading
            ? 'border-teal-400 bg-white shadow-lg shadow-teal-100/50'
            : 'border-dashed border-teal-300 bg-teal-50/30'
        }`}>

          {/* Upload trigger area - always visible */}
          {!isUploading && (
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 hover:shadow-md transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition">
                    <Camera size={24} className="text-teal-600" />
                  </div>
                  <span className="text-sm font-bold text-teal-800">צלם מסמך</span>
                  <span className="text-xs text-teal-500">צלם והמערכת תזהה</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 hover:shadow-md transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition">
                    <Upload size={24} className="text-teal-600" />
                  </div>
                  <span className="text-sm font-bold text-teal-800">העלה קובץ</span>
                  <span className="text-xs text-teal-500">PDF, תמונה, מסמך</span>
                </button>
              </div>
            </div>
          )}

          {/* Scanning progress */}
          {scanning && (
            <div className="p-5">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Loader2 size={24} className="text-teal-600 animate-spin" />
                <span className="text-sm font-bold text-teal-800">סורק את המסמך...</span>
              </div>
              <div className="w-full bg-teal-200 rounded-full h-1.5 overflow-hidden mb-2">
                <div className="bg-teal-600 h-full rounded-full animate-pulse" style={{ width: '100%' }} />
              </div>
              <p className="text-xs text-teal-600 text-center">{scanProgress}</p>
            </div>
          )}

          {/* Inline upload form - appears when file is selected */}
          {uploadFile && !scanning && (
            <div className="p-5 space-y-4">
              {/* File preview + cancel */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                {uploadPreview ? (
                  <img src={uploadPreview} alt="תצוגה מקדימה" className="w-14 h-14 object-cover rounded-lg border" />
                ) : (
                  <div className="w-14 h-14 bg-white rounded-lg border flex items-center justify-center">
                    <FileText size={22} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{uploadFile.name}</p>
                  <p className="text-xs text-gray-400">{(uploadFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={resetUploadForm}
                  className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 transition">
                  <X size={18} />
                </button>
              </div>

              {/* Scan results banner */}
              {(detectedCategory || scanResults?.expiryDate) && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-teal-600" />
                    <span className="text-sm font-bold text-teal-800">תוצאות סריקה:</span>
                  </div>
                  {detectedCategory && (
                    <p className="text-sm text-teal-700 mr-6">
                      סוג מסמך: <strong>{CATEGORY_MAP[detectedCategory]?.label}</strong>
                    </p>
                  )}
                  {scanResults?.expiryDate && (
                    <p className="text-sm text-teal-700 mr-6">
                      תוקף: <strong>{new Date(scanResults.expiryDate).toLocaleDateString('he-IL')}</strong>
                    </p>
                  )}
                  {scanResults?.licensePlate && (
                    <p className="text-sm text-teal-700 mr-6">
                      מספר רכב: <strong>{scanResults.licensePlate}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Category selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">קטגוריה</label>
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
                          ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-100'
                          : 'border-gray-200 hover:border-teal-300 bg-white'
                      }`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className={`text-sm font-bold ${selectedCategory === key ? 'text-teal-700' : 'text-gray-700'}`}>{cat.label}</span>
                      {detectedCategory === key && (
                        <span className="text-[10px] text-teal-500 flex items-center gap-0.5"><Scan size={10} /> זוהה</span>
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
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  תאריך תוקף
                  {scanResults?.expiryDate && (
                    <span className="text-teal-600 text-xs mr-2">(זוהה אוטומטית)</span>
                  )}
                </label>
                <Input type="date" value={uploadExpiry} onChange={(e) => setUploadExpiry(e.target.value)} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">הערות (אופציונלי)</label>
                <textarea placeholder="הערות נוספות..."
                  value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-right text-sm"
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
              <div className="flex gap-3 pt-1">
                <Button variant="ghost" onClick={resetUploadForm} className="flex-1">ביטול</Button>
                <Button loading={saving} onClick={handleUploadSubmit} className="flex-1">
                  שמור מסמך
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================ */}
      {/* DOCUMENTS LIST                                    */}
      {/* ================================================ */}

      {/* Filter Tabs */}
      {documents.length > 0 && (
        <div className="px-3 sm:px-0">
          <div className="flex flex-wrap justify-center gap-2 py-3 px-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            {CATEGORIES.map(cat => {
              const count = getCategoryCount(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-200 text-sm flex items-center gap-1.5 ${
                    activeFilter === cat.id
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-teal-50 hover:text-teal-700 border border-gray-200'
                  }`}
                >
                  <span className="text-xs">{cat.icon}</span>
                  {cat.label}
                  {count > 0 && cat.id !== 'all' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeFilter === cat.id ? 'bg-white/20' : 'bg-gray-200 text-gray-500'
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Documents */}
      <div className="px-3 sm:px-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-500 mb-2">
              {documents.length === 0 ? 'אין מסמכים' : 'אין מסמכים בקטגוריה זו'}
            </h3>
            <p className="text-gray-400 text-sm">
              {documents.length === 0 ? 'העלה או צלם מסמך והמערכת תמיין אותו אוטומטית' : 'נסה קטגוריה אחרת'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocs.map(doc => {
              const catKey = mapOldType(doc.type);
              const cat = CATEGORY_MAP[catKey] || CATEGORY_MAP.receipt;
              const status = getDocumentStatus(doc.expiryDate);

              return (
                <div key={doc.id} className={`relative bg-white rounded-xl border overflow-hidden shadow-sm transition ${status?.color || 'border-gray-100'}`}>
                  {doc.expiryDate && status && (
                    <div className={`absolute top-0 right-0 left-0 h-1 ${status.barColor}`} />
                  )}
                  <div className="p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${cat.color}`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-800 text-sm truncate">{doc.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
                      </div>
                      {doc.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        {doc.expiryDate && (
                          <span className={`flex items-center gap-1 font-medium ${status?.textColor}`}>
                            <Calendar size={12} />
                            {status?.status === 'expired' ? 'פג תוקף' : status?.status === 'expiring' ? 'פוקע בקרוב' : 'בתוקף'}
                            {' עד '}
                            {new Date(doc.expiryDate).toLocaleDateString('he-IL')}
                            {status?.status === 'expired' && <AlertCircle size={12} />}
                            {status?.status === 'expiring' && <AlertTriangle size={12} />}
                          </span>
                        )}
                        <span>הועלה: {new Date(doc.uploadedAt).toLocaleDateString('he-IL')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-teal-50 text-gray-400 hover:text-teal-600 transition">
                          <Eye size={16} />
                        </a>
                      )}
                      <button onClick={() => setShowDeleteConfirm(doc.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Delete confirm overlay */}
                  {showDeleteConfirm === doc.id && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 z-10">
                      <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                        <AlertTriangle size={24} className="text-red-600 mx-auto mb-2" />
                        <p className="font-medium text-gray-800 text-sm mb-3">למחוק מסמך זה?</p>
                        <div className="flex gap-2">
                          <button onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-xs font-medium">ביטול</button>
                          <button onClick={() => handleDeleteDocument(doc.id)} disabled={deleting === doc.id}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-xs font-medium disabled:opacity-50">
                            {deleting === doc.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'מחק'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
