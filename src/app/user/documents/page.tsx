'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  FileText, Trash2, AlertTriangle, Calendar, ChevronDown,
  Loader2, Shield, Upload, X, Camera, Eye, Car, CreditCard,
  ScanLine, CheckCircle, AlertCircle
} from 'lucide-react';

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
// Map old document types to new categories
function mapOldType(type: string): string {
  if (type.startsWith('insurance')) return 'insurance';
  if (['license', 'registration'].includes(type)) return 'vehicle_license';
  if (type === 'vehicle_license') return 'vehicle_license';
  if (type === 'driving_license') return 'driving_license';
  if (type === 'receipt') return 'receipt';
  if (type === 'test_certificate') return 'vehicle_license';
  return 'receipt';
}

// Smart document classifier based on filename
function classifyDocument(fileName: string): string {
  const name = fileName.toLowerCase();
  if ((name.includes('רישיון') && name.includes('נהיגה')) || (name.includes('driving') && name.includes('license'))) return 'driving_license';
  if (name.includes('רישיון') || name.includes('רכב') || name.includes('vehicle') || name.includes('license') || name.includes('registration') || name.includes('רישום')) return 'vehicle_license';
  if (name.includes('ביטוח') || name.includes('insurance') || name.includes('פוליסה') || name.includes('חובה') || name.includes('מקיף')) return 'insurance';
  if (name.includes('קבלה') || name.includes('receipt') || name.includes('חשבונית') || name.includes('invoice')) return 'receipt';
  return '';
}

export default function DocumentsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [detectedCategory, setDetectedCategory] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadExpiry, setUploadExpiry] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState<string>('');

  // Fetch vehicles
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
      } catch {
        setVehicles([]);
      }
    };
    fetchVehicles();
  }, []);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const url = selectedVehicle ? `/api/documents?vehicleId=${selectedVehicle}` : '/api/documents';
        const res = await fetch(url);
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch {
        setDocuments([]);
      }
      setLoading(false);
    };
    if (selectedVehicle) fetchDocuments();
  }, [selectedVehicle]);

  const handleFileSelected = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('גודל הקובץ חייב להיות קטן מ-10MB');
      return;
    }
    setUploadFile(file);
    setError('');

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setUploadPreview('');
    }

    // Smart classify with scan animation
    setScanning(true);
    setTimeout(() => {
      const detected = classifyDocument(file.name);
      setDetectedCategory(detected);
      setSelectedCategory(detected);
      if (detected && CATEGORY_MAP[detected]) {
        setUploadTitle(CATEGORY_MAP[detected].label);
      }
      setScanning(false);
      setShowUploadModal(true);
    }, 800);
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
      const fetchRes = await fetch(`/api/documents?vehicleId=${selectedVehicle}`);
      const fetchData = await fetchRes.json();
      setDocuments(fetchData.documents || []);
    } catch {
      setError('שגיאת חיבור');
    }
    setSaving(false);
  };

  const resetUploadForm = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadPreview('');
    setDetectedCategory('');
    setSelectedCategory('');
    setUploadTitle('');
    setUploadExpiry('');
    setUploadDescription('');
    setError('');
  };

  const handleDeleteDocument = async (docId: string) => {
    setDeleting(docId);
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) { setError('שגיאה בהסרת מסמך'); setDeleting(null); return; }
      setDocuments(documents.filter(d => d.id !== docId));
      setShowDeleteConfirm(null);
    } catch {
      setError('שגיאת חיבור');
    }
    setDeleting(null);
  };

  const getDocumentStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { status: 'expired', label: 'פג תוקף', color: 'bg-red-50 border-red-200', textColor: 'text-red-600', barColor: 'bg-red-500' };
    if (daysLeft < 30) return { status: 'expiring', label: `${daysLeft} ימים`, color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-600', barColor: 'bg-amber-500' };
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
    <div className="space-y-4 pt-12 lg:pt-0" dir="rtl">
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

      {/* Filter Tabs */}
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

      {/* Upload Buttons */}
      <div className="px-3 sm:px-0">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-400 transition"
          >
            <Upload size={24} className="text-teal-600" />
            <span className="text-sm font-medium text-teal-700">העלה קובץ</span>
            <span className="text-xs text-teal-500">PDF, תמונה, מסמך</span>
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-400 transition"
          >
            <Camera size={24} className="text-teal-600" />
            <span className="text-sm font-medium text-teal-700">צלם מסמך</span>
            <span className="text-xs text-teal-500">צלם והמערכת תזהה</span>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])} className="hidden" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
          onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])} className="hidden" />
      </div>

      {/* Scanning Animation */}
      {scanning && (
        <div className="px-3 sm:px-0">
          <div className="flex items-center justify-center gap-3 p-6 bg-teal-50 rounded-xl border border-teal-200">
            <div className="animate-pulse">
              <ScanLine size={24} className="text-teal-600" />
            </div>
            <span className="text-sm font-medium text-teal-700">סורק את המסמך...</span>
          </div>
        </div>
      )}

      {/* Documents List */}
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
            <p className="text-gray-400 text-sm mb-4">
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
                          <span className={`flex items-center gap-1 ${status?.textColor}`}>
                            <Calendar size={12} />
                            {status?.status === 'expired' && 'פג תוקף: '}
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

                  {/* Delete Confirmation */}
                  {showDeleteConfirm === doc.id && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 z-10">
                      <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                        <AlertTriangle size={24} className="text-red-600 mx-auto mb-2" />
                        <p className="font-medium text-gray-800 text-sm mb-3">למחוק מסמך זה?</p>
                        <div className="flex gap-2">
                          <button onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-xs font-medium">ביטול</button>
                          <button onClick={() => handleDeleteDocument(doc.id)}
                            disabled={deleting === doc.id}
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

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={resetUploadForm}
        title="העלאת מסמך"
        size="lg"
      >
        <div className="space-y-4">
          {/* File Preview */}
          {uploadFile && (
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
              {uploadPreview ? (
                <img src={uploadPreview} alt="תצוגה מקדימה" className="w-16 h-16 object-cover rounded-lg border" />
              ) : (
                <div className="w-16 h-16 bg-white rounded-lg border flex items-center justify-center">
                  <FileText size={24} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{uploadFile.name}</p>
                <p className="text-xs text-gray-400">{(uploadFile.size / 1024).toFixed(0)} KB</p>
              </div>
              <button onClick={() => { setUploadFile(null); setUploadPreview(''); }}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Detected category */}
          {detectedCategory && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-teal-600" />
              <span className="text-sm text-teal-700">
                המערכת זיהתה: <strong>{CATEGORY_MAP[detectedCategory]?.label}</strong>
              </span>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">קטגוריה</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedCategory(key);
                    if (!uploadTitle) setUploadTitle(cat.label);
                  }}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition text-right ${
                    selectedCategory === key
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <Input
            label="כותרת"
            placeholder="למשל: רישיון רכב 2026"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            dir="rtl"
          />

          {/* Expiry Date */}
          <Input
            label="תאריך תוקף (אופציונלי)"
            type="date"
            value={uploadExpiry}
            onChange={(e) => setUploadExpiry(e.target.value)}
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">הערות (אופציונלי)</label>
            <textarea
              placeholder="הערות נוספות..."
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-right text-sm"
              rows={2} dir="rtl"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="ghost" onClick={resetUploadForm} className="w-full sm:w-auto">ביטול</Button>
            <Button loading={saving} onClick={handleUploadSubmit} className="w-full sm:w-auto">
              שמור מסמך
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
