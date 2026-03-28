'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  Car, Plus, Edit, Trash2, Shield, Calendar, Fuel,
  Gauge, Users, ChevronDown, Eye, FileText, Loader2, Search, AlertCircle,
  Camera, Upload, X, Image as ImageIcon, Brain, TrendingUp, AlertTriangle as AlertTriangleIcon
} from 'lucide-react';
import LicenseScanButton, { type ScanResult } from '@/components/ui/LicenseScanButton';
import { useRouter } from 'next/navigation';

interface Vehicle {
  id: string;
  nickname: string;
  manufacturer: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  mileage?: number;
  fuelType?: string;
  testStatus: string;
  testExpiryDate?: string;
  insuranceStatus: string;
  insuranceExpiry?: string;
  isPrimary: boolean;
  imageUrl?: string;
  _count?: { inspections: number; sosEvents: number; expenses: number };
  drivers?: { id: string; driverName: string }[];
}

// Vehicle image component with fallback
function VehicleImage({ vehicleId, imageUrl, size = 'md', className = '' }: { vehicleId: string; imageUrl?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  if (!imageUrl || hasError) {
    return (
      <div className={`${sizeClasses[size]} bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0 ${className}`}>
        <Car size={size === 'sm' ? 20 : size === 'md' ? 28 : 36} className="text-teal-600" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="\u05EA\u05DE\u05D5\u05E0\u05EA \u05E8\u05DB\u05D1"
      className={`${sizeClasses[size]} rounded-xl object-cover flex-shrink-0 ${className}`}
      onError={() => setHasError(true)}
    />
  );
}

// Image upload section component
function ImageUploadSection({ imagePreview, onImageSelect, onImageRemove, onCameraCapture }: {
  imagePreview: string | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  onCameraCapture: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">תמונת הרכב</label>
      {imagePreview ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200">
          <img src={imagePreview} alt="תצוגה מקדימה" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onImageRemove}
            className="absolute top-2 end-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCameraCapture}
            className="flex-1 flex flex-col items-center gap-2 p-4 border-2 border-dashed border-teal-300 rounded-xl hover:bg-teal-50 transition text-teal-600"
          >
            <Camera size={24} />
            <span className="text-xs font-medium">צלם תמונה</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:bg-[#fef7ed]/50 transition text-gray-500"
          >
            <Upload size={24} />
            <span className="text-xs font-medium">העלה מהגלריה</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onImageSelect}
          />
        </div>
      )}
    </div>
  );
}

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null);
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const emptyForm = { nickname: '', licensePlate: '', manufacturer: '', model: '', year: '', testExpiryDate: '', insuranceExpiry: '', mileage: '', fuelType: '', color: '' };

  // Restore draft from sessionStorage if exists
  const [formData, setFormData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const draft = sessionStorage.getItem('autolog_vehicle_draft');
        if (draft) {
          const parsed = JSON.parse(draft);
          return { ...emptyForm, ...parsed };
        }
      } catch {}
    }
    return emptyForm;
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);


  // Auto-save form draft to sessionStorage
  useEffect(() => {
    const hasData = Object.values(formData).some(v => v !== '');
    if (hasData) {
      sessionStorage.setItem('autolog_vehicle_draft', JSON.stringify(formData));
    }
  }, [formData]);

  // Auto-open modal if draft exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draft = sessionStorage.getItem('autolog_vehicle_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (Object.values(parsed).some((v) => v !== '')) {
            setShowAddModal(true);
          }
        } catch {}
      }
    }
  }, []);  const [imageVersion, setImageVersion] = useState(0); // for forcing re-render of vehicle images
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (res.status === 401) { window.location.href = '/auth/login'; return; }
      const data = await res.json();
      if (res.ok && data.vehicles) {
        setVehicles(data.vehicles);
      } else {
        setError(data.error || 'שגיאה בטעינת הרכבים');
      }
    } catch {
      setError('שגיאת חיבור. אנא נסה שוב.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleLookup = async () => {
    if (!formData.licensePlate || formData.licensePlate.length < 5) {
      setLookupMessage('נא להזין מספר רישוי תקין');
      return;
    }
    setLookingUp(true);
    setLookupMessage('');
    try {
      const res = await fetch(`/api/vehicles/lookup?plate=${formData.licensePlate}`);
      const data = await res.json();
      if (res.ok && data.vehicle) {
        const v = data.vehicle;
        setFormData(prev => ({
          ...prev,
          manufacturer: v.manufacturer || prev.manufacturer,
          model: v.model || prev.model,
          year: v.year ? String(v.year) : prev.year,
          fuelType: v.fuelType || prev.fuelType,
          color: v.color || prev.color,
          testExpiryDate: v.testExpiryDate ? v.testExpiryDate.split('T')[0] : prev.testExpiryDate,
          nickname: prev.nickname || `${v.manufacturer} ${v.model}`.trim(),
        }));
        setLookupMessage('הנתונים נטענו ממשרד התחבורה!');
      } else {
        setLookupMessage(data.error || 'לא נמצאו נתונים לרכב זה');
      }
    } catch {
      setLookupMessage('שגיאה בחיפוש - נסה שוב');
    }
    setLookingUp(false);
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setError('');
    setLookupMessage('');
    setImagePreview(null);
    setImageData(null);
    sessionStorage.removeItem('autolog_vehicle_draft');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('נא לבחור קובץ תמונה בלבד');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('התמונה גדולה מדי (מקסימום 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageData(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setImageData(null);
  };

  const handleScanResult = (result: ScanResult) => {
    setFormData(prev => ({
      ...prev,
      licensePlate: result.licensePlate || prev.licensePlate,
      manufacturer: result.manufacturer || prev.manufacturer,
      model: result.model || prev.model,
      year: result.year || prev.year,
      color: result.color || prev.color,
      fuelType: result.fuelType || prev.fuelType,
      nickname: prev.nickname || `${result.manufacturer || ''} ${result.model || ''}`.trim(),
    }));
    if (result.licensePlate) {
      setLookupMessage('');
    }
  };

  const uploadImage = async (vehicleId: string) => {
    if (!imageData) return;
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });
      const respData = await res.json();
      if (respData.imageUrl) {
        setVehicles(prev => prev.map(vh => vh.id === vehicleId ? { ...vh, imageUrl: respData.imageUrl } : vh));
      }
    } catch {
      console.error('Failed to upload vehicle image');
    }
  };

  const openEditModal = (v: Vehicle) => {
    setEditVehicleId(v.id);
    setFormData({
      nickname: v.nickname || '', licensePlate: v.licensePlate || '',
      manufacturer: v.manufacturer || '', model: v.model || '',
      year: v.year ? String(v.year) : '', testExpiryDate: v.testExpiryDate ? v.testExpiryDate.split('T')[0] : '',
      insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.split('T')[0] : '',
      mileage: v.mileage ? String(v.mileage) : '', fuelType: v.fuelType || '', color: v.color || '',
    });
    setError('');
    setImagePreview(null);
    setImageData(null);
    setShowEditModal(true);
  };

  const handleEditVehicle = async () => {
    if (!editVehicleId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/vehicles/${editVehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה בעדכון רכב'); setSaving(false); return; }
      // Upload image if selected
      if (imageData) {
        await uploadImage(editVehicleId);
      }
      setShowEditModal(false);
      setEditVehicleId(null);
      resetForm();
      fetchVehicles();
    } catch { setError('שגיאת חיבור'); }
    setSaving(false);
  };

  const handleAddVehicle = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בהוספת רכב');
        setSaving(false);
        return;
      }
      // Upload image if selected
      if (imageData && data.vehicle?.id) {
        await uploadImage(data.vehicle.id);
      }
      setShowAddModal(false);
      resetForm();
      fetchVehicles();
    } catch {
      setError('שגיאת חיבור');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Hidden camera input for capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageSelect}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] rounded-lg border-2 border-[#1e3a5f] flex items-center justify-center">
            <Car size={20} className="text-[#1e3a5f]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">הרכבים שלי</h1>
        </div>
        {vehicles.length > 0 && (
          <Button icon={<Plus size={16} />} onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
            הוסף רכב
          </Button>
        )}
      </div>

      {error && !showAddModal && !showEditModal && (
        <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* AI Insights */}
      {!loading && vehicles.length > 0 && (
        <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-teal-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">תובנות AI לרכבים</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Test Status Card */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangleIcon size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-gray-700">סטטוס טסט</span>
              </div>
              <p className="text-xs text-gray-600">
                {vehicles.filter(v => v.testStatus === 'expired' || v.testStatus === 'expiring').length === 0
                  ? '✓ כל הרכבים בתוקף'
                  : `⚠️ ${vehicles.filter(v => v.testStatus === 'expired' || v.testStatus === 'expiring').length} רכבים בעיה טסט`}
              </p>
            </div>

            {/* Insurance Status Card */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-blue-500" />
                <span className="text-xs font-bold text-gray-700">סטטוס ביטוח</span>
              </div>
              <p className="text-xs text-gray-600">
                {vehicles.filter(v => v.insuranceStatus === 'expired' || v.insuranceStatus === 'expiring').length === 0
                  ? '✓ כל הביטוחים בתוקף'
                  : `⚠️ ${vehicles.filter(v => v.insuranceStatus === 'expired' || v.insuranceStatus === 'expiring').length} ביטוחים בעיה`}
              </p>
            </div>

            {/* Activity Summary Card */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-green-500" />
                <span className="text-xs font-bold text-gray-700">סיכום פעילות</span>
              </div>
              <p className="text-xs text-gray-600">
                📊 {vehicles.reduce((sum, v) => sum + (v._count?.inspections || 0), 0)} בדיקות • {vehicles.reduce((sum, v) => sum + (v._count?.expenses || 0), 0)} הוצאות
              </p>
            </div>
          </div>
        </div>
      )}

      {vehicles.length === 0 && !error ? (
        <Card className="text-center py-12">
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Car size={24} className="text-teal-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">אין רכבים עדיין</h3>
          <p className="text-gray-400 mb-4">הוסף את הרכב הראשון שלך!</p>
          <Button icon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>הוסף רכב</Button>
        </Card>
      ) : vehicles.length > 0 ? (
        <div className="space-y-4">
          {vehicles.map(v => (
            <Card key={v.id} className="overflow-hidden">
              {/* Vehicle Header */}
              <div className="flex items-center gap-4">
                <VehicleImage vehicleId={v.id} imageUrl={v.imageUrl} size="md" key={v.id} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#1e3a5f]">{v.nickname}</h3>
                    {v.isPrimary && <Badge variant="info">ראשי</Badge>}
                  </div>
                  <p className="text-sm text-gray-500">
                    {v.manufacturer} {v.model} • {v.year} • {v.licensePlate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => openEditModal(v)} />
                  <Button variant="ghost" size="sm"
                    icon={<ChevronDown size={14} className={expandedVehicle === v.id ? 'rotate-180 transition' : 'transition'} />}
                    onClick={() => setExpandedVehicle(expandedVehicle === v.id ? null : v.id)}
                  />
                </div>
              </div>

              {/* Status Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-4">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Shield size={16} className="text-teal-600" />
                  <div>
                    <div className="text-xs text-gray-500">טסט</div>
                    <StatusBadge status={v.testStatus} />
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <FileText size={16} className="text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-500">ביטוח</div>
                    <StatusBadge status={v.insuranceStatus} />
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Gauge size={16} className="text-[#1e3a5f]" />
                  <div>
                    <div className="text-xs text-gray-500">ק&quot;מ</div>
                    <span className="text-sm font-bold">{v.mileage?.toLocaleString() || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Fuel size={16} className="text-orange-500" />
                  <div>
                    <div className="text-xs text-gray-500">דלק</div>
                    <span className="text-sm font-bold">{v.fuelType || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedVehicle === v.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div><span className="text-gray-500">תוקף טסט:</span> <span className="font-medium">{v.testExpiryDate ? new Date(v.testExpiryDate).toLocaleDateString('he-IL') : '—'}</span></div>
                    <div><span className="text-gray-500">תוקף ביטוח:</span> <span className="font-medium">{v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString('he-IL') : '—'}</span></div>
                    <div><span className="text-gray-500">צבע:</span> <span className="font-medium">{v.color || '—'}</span></div>
                    <div><span className="text-gray-500">בדיקות:</span> <span className="font-medium">{v._count?.inspections || 0} בדיקות</span></div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="sm" icon={<Eye size={14} />} className="flex-1" onClick={() => router.push(`/user/vehicles/${v.id}`)}>צפה בדוחות</Button>
                    <Button variant="outline" size="sm" icon={<Calendar size={14} />} className="flex-1" onClick={() => router.push('/user/book-garage')}>קבע תור</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : null}

      {/* Edit Vehicle Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditVehicleId(null); resetForm(); }} title="עריכת רכב" size="lg">
        <div className="space-y-4">
          {/* License Scan */}
          <LicenseScanButton onScanResult={handleScanResult} />

          {/* Image Upload */}
          <ImageUploadSection
            imagePreview={imagePreview}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            onCameraCapture={handleCameraCapture}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label="כינוי" value={formData.nickname}
              onChange={e => setFormData({ ...formData, nickname: e.target.value })} />
            <Input label="מספר רישוי" value={formData.licensePlate} disabled />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Input label="יצרן" value={formData.manufacturer}
              onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} />
            <Input label="דגם" value={formData.model}
              onChange={e => setFormData({ ...formData, model: e.target.value })} />
            <Input label="שנת ייצור" type="number" value={formData.year}
              onChange={e => setFormData({ ...formData, year: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label="תוקף טסט" type="date" value={formData.testExpiryDate}
              onChange={e => setFormData({ ...formData, testExpiryDate: e.target.value })} />
            <Input label="תוקף ביטוח" type="date" value={formData.insuranceExpiry}
              onChange={e => setFormData({ ...formData, insuranceExpiry: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Input label="ק״מ" type="number" value={formData.mileage}
              onChange={e => setFormData({ ...formData, mileage: e.target.value })} />
            <Input label="סוג דלק" value={formData.fuelType}
              onChange={e => setFormData({ ...formData, fuelType: e.target.value })} />
            <Input label="צבע" value={formData.color}
              onChange={e => setFormData({ ...formData, color: e.target.value })} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="ghost" onClick={() => { setShowEditModal(false); resetForm(); }} className="w-full sm:w-auto">ביטול</Button>
            <Button loading={saving} onClick={handleEditVehicle} className="w-full sm:w-auto">שמור שינויים</Button>
          </div>
        </div>
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="הוספת רכב חדש" size="lg">
        <div className="space-y-4">
          {/* MOT Lookup Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Search size={16} className="text-blue-600" />
              <h4 className="font-bold text-blue-800 text-sm">חיפוש אוטומטי ממשרד התחבורה</h4>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input placeholder="הכנס מספר רישוי..." value={formData.licensePlate}
                  onChange={e => setFormData({ ...formData, licensePlate: e.target.value })} />
              </div>
              <Button variant="primary" size="md" loading={lookingUp} onClick={handleLookup}
                icon={<Search size={16} />}>
                חפש
              </Button>
            </div>
            {lookupMessage && (
              <p className={`text-sm mt-2 ${lookupMessage.includes('הנתונים נטענו') ? 'text-green-600' : 'text-amber-600'}`}>
                {lookupMessage}
              </p>
            )}
          </div>

          {/* License Scan */}
          <LicenseScanButton onScanResult={handleScanResult} />

          {/* Image Upload */}
          <ImageUploadSection
            imagePreview={imagePreview}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            onCameraCapture={handleCameraCapture}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label="כינוי" placeholder="למשל: ספורטז' לבנה" value={formData.nickname}
              onChange={e => setFormData({ ...formData, nickname: e.target.value })} />
            <Input label="מספר רישוי" placeholder="1234567" value={formData.licensePlate}
              onChange={e => setFormData({ ...formData, licensePlate: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Input label="יצרן" placeholder="KIA" value={formData.manufacturer}
              onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} />
            <Input label="דגם" placeholder="SPORTAGE" value={formData.model}
              onChange={e => setFormData({ ...formData, model: e.target.value })} />
            <Input label="שנת ייצור" placeholder="2020" type="number" value={formData.year}
              onChange={e => setFormData({ ...formData, year: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label="תוקף טסט" type="date" value={formData.testExpiryDate}
              onChange={e => setFormData({ ...formData, testExpiryDate: e.target.value })} />
            <Input label="תוקף ביטוח" type="date" value={formData.insuranceExpiry}
              onChange={e => setFormData({ ...formData, insuranceExpiry: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label="ק״מ" placeholder="45000" type="number" value={formData.mileage}
              onChange={e => setFormData({ ...formData, mileage: e.target.value })} />
            <Input label="סוג דלק" placeholder="בנזין / דיזל / חשמלי" value={formData.fuelType}
              onChange={e => setFormData({ ...formData, fuelType: e.target.value })} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowAddModal(false)} className="w-full sm:w-auto">ביטול</Button>
            <Button icon={<Plus size={16} />} loading={saving} onClick={handleAddVehicle} className="w-full sm:w-auto">הוסף רכב</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
