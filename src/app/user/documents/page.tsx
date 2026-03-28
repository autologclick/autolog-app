'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  Plus, FileText, Trash2, AlertTriangle, Calendar, ChevronDown,
  Loader2, Shield, AlertCircle, Upload, X, CheckCircle, Wrench,
  Check, XCircle, Clock, Send, DollarSign, ClipboardList, CheckCircle2,
  Receipt, Camera, Brain, TrendingUp, Target
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

interface Treatment {
  id: string;
  vehicleId: string;
  userId: string;
  garageId?: string;
  garageName?: string;
  mechanicName?: string;
  type: string;
  title: string;
  description?: string;
  items?: string;
  mileage?: number;
  cost?: number;
  date: string;
  status: string;
  sentByGarage: number;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const TREATMENT_TYPES: Record<string, { label: string; color: string }> = {
  maintenance: { label: 'טיפול תקופתי', color: 'bg-teal-100 text-teal-700' },
  repair: { label: 'תיקון', color: 'bg-red-100 text-red-700' },
  oil_change: { label: 'החלפת שמן', color: 'bg-amber-100 text-amber-700' },
  tires: { label: 'צמיגים', color: 'bg-blue-100 text-blue-700' },
  brakes: { label: 'בלמים', color: 'bg-orange-100 text-orange-700' },
  electrical: { label: 'חשמל', color: 'bg-yellow-100 text-yellow-700' },
  ac: { label: 'מיזוג', color: 'bg-cyan-100 text-cyan-700' },
  bodywork: { label: 'פחחות/צבע', color: 'bg-purple-100 text-purple-700' },
  other: { label: 'אחר', color: 'bg-gray-100 text-gray-700' },
};

const DOCUMENT_TYPES = {
  insurance_compulsory: { label: 'ביטוח חובה', color: 'bg-blue-100 text-blue-700', icon: Shield },
  insurance_comprehensive: { label: 'ביטוח מקיף', color: 'bg-blue-100 text-blue-700', icon: Shield },
  insurance_third_party: { label: 'ביטוח צד ג\'', color: 'bg-blue-100 text-blue-700', icon: Shield },
  license: { label: 'רישיון רכב', color: 'bg-green-100 text-green-700', icon: ClipboardList },
  registration: { label: 'רישום רכב', color: 'bg-green-100 text-green-700', icon: ClipboardList },
  test_certificate: { label: 'תעודת טסט', color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
  receipt: { label: 'קבלה', color: 'bg-orange-100 text-orange-700', icon: Receipt },
  photo: { label: 'תמונה', color: 'bg-gray-100 text-gray-700', icon: Camera },
  other: { label: 'אחר', color: 'bg-gray-100 text-gray-700', icon: FileText },
};

const FILTER_TABS = [
  { id: 'all', label: 'הכל' },
  { id: 'treatments', label: 'טיפולים' },
  { id: 'insurance', label: 'ביטוח' },
  { id: 'license', label: 'רישיונות' },
  { id: 'other', label: 'אחר' },
];

export default function DocumentsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [treatmentSaving, setTreatmentSaving] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [treatmentForm, setTreatmentForm] = useState({
    type: 'maintenance',
    title: '',
    description: '',
    garageName: '',
    mechanicName: '',
    mileage: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [formData, setFormData] = useState({
    vehicleId: '',
    type: 'other',
    title: '',
    description: '',
    file: null as File | null,
    expiryDate: '',
  });

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch('/api/vehicles');
        const data = await res.json();
        if (data.vehicles?.length > 0) {
          setVehicles(data.vehicles);
          setSelectedVehicle(data.vehicles[0].id);
        }
      } catch {
        // Demo data fallback
        const demoVehicles = [
          {
            id: '1',
            nickname: 'ספורטז\' לבנה',
            manufacturer: 'KIA',
            model: 'SPORTAGE',
            licensePlate: '7198738',
          },
          {
            id: '2',
            nickname: 'פורד פוקוס',
            manufacturer: 'FORD',
            model: 'FOCUS',
            licensePlate: '8746868',
          },
        ];
        setVehicles(demoVehicles);
        setSelectedVehicle(demoVehicles[0].id);
      }
    };

    fetchVehicles();
  }, []);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const url = selectedVehicle
          ? `/api/documents?vehicleId=${selectedVehicle}`
          : '/api/documents';
        const res = await fetch(url);
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch {
        // Demo data fallback
        setDocuments([
          {
            id: '1',
            vehicleId: '1',
            type: 'insurance_compulsory',
            title: 'ביטוח חובה 2026',
            description: 'ביטוח חובה לרכב הרישוי 7198738',
            fileUrl: '#',
            expiryDate: '2026-06-15',
            uploadedAt: '2026-01-15',
          },
          {
            id: '2',
            vehicleId: '1',
            type: 'test_certificate',
            title: 'תעודת טסט',
            description: 'תעודת טסט תקפה עד 2026',
            fileUrl: '#',
            expiryDate: '2026-12-20',
            uploadedAt: '2025-12-01',
          },
          {
            id: '3',
            vehicleId: '1',
            type: 'receipt',
            title: 'קבלה תיקון מוסך',
            description: 'קבלה לתיקון בלמים',
            fileUrl: '#',
            uploadedAt: '2026-03-10',
          },
        ]);
      }
      setLoading(false);
    };

    if (selectedVehicle) {
      fetchDocuments();
    }
  }, [selectedVehicle]);

  // Fetch treatments
  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const url = selectedVehicle
          ? `/api/treatments?vehicleId=${selectedVehicle}`
          : '/api/treatments';
        const res = await fetch(url);
        const data = await res.json();
        setTreatments(data.treatments || []);
      } catch {
        setTreatments([]);
      }
    };
    if (selectedVehicle) {
      fetchTreatments();
    }
  }, [selectedVehicle]);

  const handleAddTreatment = async () => {
    if (!treatmentForm.title || !selectedVehicle) {
      setError('נא למלא כותרת');
      return;
    }
    setTreatmentSaving(true);
    setError('');
    try {
      const res = await fetch('/api/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicle,
          type: treatmentForm.type,
          title: treatmentForm.title,
          description: treatmentForm.description || undefined,
          garageName: treatmentForm.garageName || undefined,
          mechanicName: treatmentForm.mechanicName || undefined,
          mileage: treatmentForm.mileage ? Number(treatmentForm.mileage) : undefined,
          cost: treatmentForm.cost ? Number(treatmentForm.cost) : undefined,
          date: treatmentForm.date,
          notes: treatmentForm.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה בהוספת טיפול'); setTreatmentSaving(false); return; }
      setShowAddTreatment(false);
      setTreatmentForm({ type: 'maintenance', title: '', description: '', garageName: '', mechanicName: '', mileage: '', cost: '', date: new Date().toISOString().split('T')[0], notes: '' });
      // Refresh
      const fetchRes = await fetch(`/api/treatments?vehicleId=${selectedVehicle}`);
      const fetchData = await fetchRes.json();
      setTreatments(fetchData.treatments || []);
    } catch { setError('שגיאת חיבור'); }
    setTreatmentSaving(false);
  };

  const handleApproveTreatment = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/treatments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (res.ok) {
        setTreatments(prev => prev.map(t => t.id === id ? { ...t, status: 'approved', approvedAt: new Date().toISOString() } : t));
      }
    } catch {}
    setApprovingId(null);
  };

  const handleRejectTreatment = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/treatments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });
      if (res.ok) {
        setTreatments(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected', rejectedAt: new Date().toISOString() } : t));
      }
    } catch {}
    setApprovingId(null);
  };

  const handleDeleteTreatment = async (id: string) => {
    try {
      const res = await fetch(`/api/treatments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTreatments(prev => prev.filter(t => t.id !== id));
      }
    } catch {}
  };

  const getFilteredDocuments = () => {
    let filtered = documents;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(doc => {
        if (activeFilter === 'insurance') {
          return doc.type.startsWith('insurance');
        }
        if (activeFilter === 'license') {
          return ['license', 'registration', 'test', 'test_certificate'].includes(doc.type);
        }
        if (activeFilter === 'other') {
          return !['insurance_compulsory', 'insurance_comprehensive', 'insurance_third_party', 'license', 'registration', 'test_certificate'].includes(doc.type);
        }
        return true;
      });
    }

    return filtered;
  };

  const getDocumentStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { status: 'expired', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' };
    if (daysLeft < 30) return { status: 'expiring', color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' };
    return { status: 'valid', color: 'bg-green-50 border-green-200', textColor: 'text-green-700' };
  };

  const getAIInsights = () => {
    const docsWithExpiry = documents.filter(d => d.expiryDate);
    const today = new Date();

    const expired = docsWithExpiry.filter(d => {
      const expiry = new Date(d.expiryDate!);
      const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft < 0;
    }).length;

    const expiring = docsWithExpiry.filter(d => {
      const expiry = new Date(d.expiryDate!);
      const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft < 30;
    }).length;

    const valid = docsWithExpiry.filter(d => {
      const expiry = new Date(d.expiryDate!);
      const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft >= 30;
    }).length;

    return { expired, expiring, valid, total: docsWithExpiry.length };
  };

  const handleAddDocument = async () => {
    const missingFields = [];
      if (!formData.vehicleId) missingFields.push('רכב');
      if (!formData.type) missingFields.push('סוג מסמך');
      if (!formData.title) missingFields.push('כותרת');
      if (missingFields.length > 0) {
      setError('נא למלא: ' + missingFields.join(', '));
      return;
    }

    setSaving(true);
    setError('');

    try {
      let fileData = null;
      if (formData.file) {
        const reader = new FileReader();
        fileData = await new Promise((resolve) => {
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(formData.file!);
        });
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: formData.vehicleId,
          type: formData.type,
          title: formData.title,
          description: formData.description,
          fileData,
          expiryDate: formData.expiryDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בהוספת מסמך');
        return;
      }

      setShowAddModal(false);
      setFormData({
        vehicleId: selectedVehicle,
        type: 'other',
        title: '',
        description: '',
        file: null,
        expiryDate: '',
      });

      // Refresh documents
      const fetchRes = await fetch(`/api/documents?vehicleId=${selectedVehicle}`);
      const fetchData = await fetchRes.json();
      setDocuments(fetchData.documents || []);
    } catch (err) {
      setError('שגיאת חיבור');
    }
    setSaving(false);
  };

  const handleDeleteDocument = async (docId: string) => {
    setDeleting(docId);
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('שגיאה בהסרת מסמך');
        setDeleting(null);
        return;
      }

      setDocuments(documents.filter(d => d.id !== docId));
      setShowDeleteConfirm(null);
    } catch {
      setError('שגיאת חיבור');
    }
    setDeleting(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('גודל הקובץ חייב להיות קטן מ-10MB');
        return;
      }
      setFormData({ ...formData, file });
      setError('');
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-3 sm:px-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <FileText size={20} className="text-[#1e3a5f]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">מסמכים</h1>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          הוסף מסמך
        </Button>
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
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-teal-300 transition bg-white"
            >
              <ChevronDown size={18} className="text-gray-400" />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold text-gray-800 text-sm">{currentVehicle?.nickname || currentVehicle?.manufacturer + ' ' + currentVehicle?.model}</div>
                  <div className="text-xs text-gray-400">{currentVehicle?.licensePlate}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-gray-300" />
                </div>
              </div>
            </button>
            {showVehicleDropdown && vehicles.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVehicle(v.id); setShowVehicleDropdown(false); }}
                    className={`w-full flex items-center gap-3 p-3 text-right hover:bg-[#fef7ed]/50 transition ${
                      v.id === selectedVehicle ? 'bg-teal-50' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-bold text-sm text-gray-800">{v.nickname || v.manufacturer + ' ' + v.model}</div>
                      <div className="text-xs text-gray-400">{v.licensePlate}</div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <FileText size={14} className="text-gray-300" />
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
        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                activeFilter === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      {!loading && documents.length > 0 && (
        <div className="px-3 sm:px-0">
          <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-teal-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center">
                <Brain size={18} className="text-teal-600" />
              </div>
              <h2 className="text-lg font-bold text-[#1e3a5f]">תובנות AI למסמכים</h2>
            </div>
            {(() => {
              const insights = getAIInsights();
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Expired Documents */}
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-xs font-bold text-gray-700">מסמכים שפגו תוקף</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {insights.expired > 0 ? `⚠️ ${insights.expired} מסמך${insights.expired > 1 ? 'ים' : ''} דורש${insights.expired > 1 ? 'ים' : ''} עדכון` : '✅ כל המסמכים תקפים'}
                    </p>
                  </div>

                  {/* Expiring Soon */}
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={14} className="text-amber-500" />
                      <span className="text-xs font-bold text-gray-700">פקיעה קרובה</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {insights.expiring > 0 ? `📅 ${insights.expiring} מסמך${insights.expiring > 1 ? 'ים' : ''} תוך 30 יום` : '✅ לא קיימת פקיעה קרובה'}
                    </p>
                  </div>

                  {/* Overall Status */}
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={14} className="text-teal-600" />
                      <span className="text-xs font-bold text-gray-700">סטטוס כללי</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {insights.valid > 0 ? `📊 ${insights.valid} מ-${insights.total} מסמכים תקפים` : `📊 ${insights.total} מסמכים סה״כ`}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Treatments Section - Show in 'all' AND 'treatments' tabs */}
      {(activeFilter === 'all' || activeFilter === 'treatments') && treatments.length > 0 && (
        <div className="px-3 sm:px-0 space-y-4">
          {activeFilter === 'all' && (
            <div className="flex items-center gap-2 text-right">
              <Wrench size={16} className="text-teal-600" />
              <h3 className="font-bold text-gray-700 text-sm">טיפולים ({treatments.length})</h3>
            </div>
          )}
          {/* Pending approvals banner */}
          {treatments.filter(t => t.status === 'pending_approval').length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-amber-600" />
                <h4 className="font-bold text-amber-800 text-sm">ממתינים לאישורך</h4>
              </div>
              <div className="space-y-3">
                {treatments.filter(t => t.status === 'pending_approval').map(t => (
                  <div key={t.id} className="bg-white rounded-lg border border-amber-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApproveTreatment(t.id)}
                          disabled={approvingId === t.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition text-xs font-medium disabled:opacity-50"
                        >
                          <Check size={14} />
                          אשר
                        </button>
                        <button
                          onClick={() => handleRejectTreatment(t.id)}
                          disabled={approvingId === t.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition text-xs font-medium disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          דחה
                        </button>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <h4 className="font-bold text-gray-800 text-sm">{t.title}</h4>
                          <Send size={14} className="text-amber-600" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          נשלח מ: <span className="font-medium">{t.garageName}</span>
                          {t.mechanicName && ` • מכונאי: ${t.mechanicName}`}
                        </p>
                        {t.description && <p className="text-xs text-gray-600 mt-1">{t.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{new Date(t.date).toLocaleDateString('he-IL')}</span>
                          {t.cost && <span>₪{t.cost.toLocaleString()}</span>}
                          {t.mileage && <span>{t.mileage.toLocaleString()} ק״מ</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add treatment button - only in treatments-only mode */}
          {activeFilter === 'treatments' && (
            <div className="flex justify-end">
              <Button icon={<Plus size={16} />} onClick={() => setShowAddTreatment(true)} size="sm">
                הוסף טיפול
              </Button>
            </div>
          )}

          {/* Approved treatments list */}
          {treatments.filter(t => t.status === 'approved').length === 0 && treatments.filter(t => t.status === 'pending_approval').length === 0 && activeFilter === 'treatments' ? (
            <Card className="text-center py-12">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Wrench size={24} className="text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-600 mb-2">אין טיפולים</h3>
              <p className="text-gray-400 text-sm mb-4">הוסף טיפולים באופן עצמאי או קבל טיפולים מהמוסך</p>
              <Button icon={<Plus size={16} />} onClick={() => setShowAddTreatment(true)} size="sm">
                הוסף טיפול
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {treatments.filter(t => t.status === 'approved').map(t => {
                const treatType = TREATMENT_TYPES[t.type] || TREATMENT_TYPES.other;
                return (
                  <Card key={t.id} className="overflow-hidden">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          <Badge variant="info" size="sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${treatType.color}`}>{treatType.label}</span>
                          </Badge>
                          <h4 className="font-bold text-gray-800">{t.title}</h4>
                          <Wrench size={16} className="text-teal-600" />
                        </div>
                        {t.description && <p className="text-sm text-gray-600 mt-1 text-right">{t.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap justify-end">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(t.date).toLocaleDateString('he-IL')}
                          </span>
                          {t.cost != null && t.cost > 0 && (
                            <span className="flex items-center gap-1">
                              <DollarSign size={12} />
                              ₪{t.cost.toLocaleString()}
                            </span>
                          )}
                          {t.mileage && <span>{t.mileage.toLocaleString()} ק״מ</span>}
                          {t.garageName && <span>מוסך: {t.garageName}</span>}
                          {t.sentByGarage === 1 && (
                            <span className="flex items-center gap-1 text-teal-600">
                              <Send size={10} />
                              נשלח מהמוסך
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTreatment(t.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition text-gray-400 hover:text-red-600 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Rejected treatments */}
          {treatments.filter(t => t.status === 'rejected').length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">טיפולים שנדחו</h4>
              <div className="space-y-2">
                {treatments.filter(t => t.status === 'rejected').map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-60">
                    <button onClick={() => handleDeleteTreatment(t.id)} className="text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={14} />
                    </button>
                    <div className="text-right">
                      <span className="text-sm text-gray-500 line-through">{t.title}</span>
                      <span className="text-xs text-gray-400 me-2">
                        {t.garageName && `מ: ${t.garageName}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Documents Grid - Show in all tabs EXCEPT 'treatments' */}
      {activeFilter !== 'treatments' && (
      <div className="px-3 sm:px-0">
        {activeFilter === 'all' && documents.length > 0 && (
          <div className="flex items-center gap-2 text-right mb-3">
            <FileText size={16} className="text-teal-600" />
            <h3 className="font-bold text-gray-700 text-sm">מסמכים ({filteredDocs.length})</h3>
          </div>
        )}
        {filteredDocs.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-600 mb-2">אין מסמכים</h3>
            <p className="text-gray-400 text-sm mb-4">
              {documents.length === 0 ? 'התחל בהוספת מסמכי הרכב שלך' : 'לא נמצאו מסמכים בקטגוריה זו'}
            </p>
            <Button icon={<Plus size={16} />} onClick={() => setShowAddModal(true)} size="sm">
              הוסף מסמך
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredDocs.map(doc => {
              const docType = DOCUMENT_TYPES[doc.type as keyof typeof DOCUMENT_TYPES] || DOCUMENT_TYPES.other;
              const status = getDocumentStatus(doc.expiryDate);

              return (
                <Card key={doc.id} className={`relative overflow-hidden transition ${status?.color || 'border-gray-200'}`}>
                  {/* Status Badge */}
                  {doc.expiryDate && (
                    <div className={`absolute top-0 right-0 left-0 h-1 ${
                      status?.status === 'expired' ? 'bg-red-500' : status?.status === 'expiring' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                  )}

                  {/* Type Icon */}
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${docType.color}`}>
                    <docType.icon size={18} />
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-1 pe-6 line-clamp-2">
                    {doc.title}
                  </h3>

                  {/* Description */}
                  {doc.description && (
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  {/* Type Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="info" size="sm">
                      {docType.label}
                    </Badge>
                  </div>

                  {/* Expiry Date */}
                  {doc.expiryDate && (
                    <div className={`flex items-center gap-2 mb-3 text-xs sm:text-sm ${status?.textColor || 'text-gray-700'}`}>
                      <Calendar size={14} />
                      <span>
                        {new Date(doc.expiryDate).toLocaleDateString('he-IL')}
                      </span>
                      {status?.status === 'expired' && <AlertCircle size={14} />}
                      {status?.status === 'expiring' && <AlertTriangle size={14} />}
                    </div>
                  )}

                  {/* Upload Date */}
                  <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
                    <span>
                      הועלה: {new Date(doc.uploadedAt).toLocaleDateString('he-IL')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition text-xs sm:text-sm font-medium text-center"
                      >
                        צפה
                      </a>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm(doc.id)}
                      className="px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition text-xs sm:text-sm font-medium"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Delete Confirmation */}
                  {showDeleteConfirm === doc.id && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center p-3">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <AlertTriangle size={24} className="text-red-600 mx-auto mb-2" />
                        <p className="font-medium text-gray-800 text-sm mb-3">
                          מחיקת המסמך לא יכולה להתבטל
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-xs font-medium"
                          >
                            ביטול
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            disabled={deleting === doc.id}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-xs font-medium disabled:opacity-50"
                          >
                            {deleting === doc.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'מחק'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Add Treatment Modal */}
      <Modal
        isOpen={showAddTreatment}
        onClose={() => { setShowAddTreatment(false); setError(''); }}
        title="הוספת טיפול"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">סוג טיפול</label>
            <select
              value={treatmentForm.type}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, type: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-right text-sm"
            >
              {Object.entries(TREATMENT_TYPES).map(([key, t]) => (
                <option key={key} value={key}>{t.label}</option>
              ))}
            </select>
          </div>
          <Input label="כותרת" placeholder="למשל: החלפת שמן ופילטרים" value={treatmentForm.title}
            onChange={(e) => setTreatmentForm({ ...treatmentForm, title: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">תיאור (אופציונלי)</label>
            <textarea
              placeholder="פירוט העבודה שבוצעה..."
              value={treatmentForm.description}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, description: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-right text-sm"
              rows={3} dir="rtl"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="שם מוסך" placeholder="אופציונלי" value={treatmentForm.garageName}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, garageName: e.target.value })} />
            <Input label="שם מכונאי" placeholder="אופציונלי" value={treatmentForm.mechanicName}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, mechanicName: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="תאריך" type="date" value={treatmentForm.date}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, date: e.target.value })} />
            <Input label="עלות (₪)" type="number" placeholder="0" value={treatmentForm.cost}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, cost: e.target.value })} />
            <Input label="ק״מ" type="number" placeholder="45000" value={treatmentForm.mileage}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, mileage: e.target.value })} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowAddTreatment(false)} className="w-full sm:w-auto">ביטול</Button>
            <Button icon={<Plus size={16} />} loading={treatmentSaving} onClick={handleAddTreatment} className="w-full sm:w-auto">
              הוסף טיפול
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Document Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData({
            vehicleId: selectedVehicle,
            type: 'other',
            title: '',
            description: '',
            file: null,
            expiryDate: '',
          });
          setError('');
        }}
        title="הוספת מסמך חדש"
        size="lg"
      >
        <div className="space-y-4">
          {/* Vehicle Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">רכב</label>
            <select
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-right text-sm"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.nickname || v.manufacturer + ' ' + v.model} • {v.licensePlate}
                </option>
              ))}
            </select>
          </div>

          {/* Type Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">סוג המסמך</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-right text-sm"
            >
              {Object.entries(DOCUMENT_TYPES).map(([key, doc]) => (
                <option key={key} value={key}>
                  {doc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">כותרת</label>
            <Input
              placeholder="למשל: ביטוח חובה 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              dir="rtl"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">תיאור (אופציונלי)</label>
            <textarea
              placeholder="הערות נוספות על המסמך..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-right text-sm"
              rows={3}
              dir="rtl"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">תאריך תוקף (אופציונלי)</label>
            <Input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">קובץ או צילום (אופציונלי)</label>
            <div className="relative">
              <input
                id="fileUpload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                id="cameraCapture"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => document.getElementById("fileUpload")?.click()}
                  className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-teal-400 transition cursor-pointer"
                >
                  <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">העלאת קובץ</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, תמונה או מסמך עד 10MB</p>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("cameraCapture")?.click()}
                  className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-teal-400 transition cursor-pointer"
                >
                  <Camera size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">צילום מצלמה</p>
                  <p className="text-xs text-gray-400 mt-1">צלם מסמך ישירות</p>
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddModal(false);
                setFormData({
                  vehicleId: selectedVehicle,
                  type: 'other',
                  title: '',
                  description: '',
                  file: null,
                  expiryDate: '',
                });
                setError('');
              }}
              className="w-full sm:w-auto"
            >
              ביטול
            </Button>
            <Button
              loading={saving}
              onClick={handleAddDocument}
              className="w-full sm:w-auto"
            >
              הוסף מסמך
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
