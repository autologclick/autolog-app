'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import {
  Car, Plus, Edit, Trash2, Shield, Calendar, Fuel,
  Gauge, Users, ChevronDown, Eye, FileText, Loader2, Search, AlertCircle,
  Camera, Upload, X, Image as ImageIcon, Brain, TrendingUp, AlertTriangle as AlertTriangleIcon,
  Send, Mail, CheckCircle2, XCircle, Clock, UserPlus
} from 'lucide-react';
import LicenseScanButton, { type ScanResult } from '@/components/ui/LicenseScanButton';
import VoiceMicButton from '@/components/ui/VoiceMicButton';
import { getManufacturerNames, getModelNames } from '@/lib/vehicle-data';
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
  isShared?: boolean;
  ownerName?: string | null;
}

interface ShareRequest {
  id: string;
  vehicleId: string;
  status: string;
  createdAt: string;
  sharedWithEmail?: string;
  vehicle: { id: string; nickname: string; licensePlate: string; manufacturer: string; model: string };
  sharedUser?: { fullName: string; email: string; phone?: string };
  owner?: { fullName: string };
}

// Vehicle image component with fallback
function VehicleImage({ vehicleId, imageUrl, size = 'md', className = '' }: { vehicleId: string; imageUrl?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const pixelSize = size === 'sm' ? 48 : size === 'md' ? 64 : 80;

  if (!imageUrl || hasError) {
    return (
      <div className={`${sizeClasses[size]} bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0 ${className}`}>
        <Car size={size === 'sm' ? 20 : size === 'md' ? 28 : 36} className="text-teal-600" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative rounded-xl overflow-hidden flex-shrink-0 ${className}`}>
      <Image
        src={imageUrl}
        alt="תמונת רכב"
        width={pixelSize}
        height={pixelSize}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

// Image upload section component
function ImageUploadSection({ imagePreview, imageProcessing, onImageSelect, onImageRemove, onCameraCapture }: {
  imagePreview: string | null;
  imageProcessing?: boolean;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  onCameraCapture: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">תמונת הרכב</label>
      {imageProcessing ? (
        <div className="flex items-center justify-center gap-2 w-full h-40 rounded-xl border border-gray-200 bg-[#F3F6FA] text-gray-500 text-sm">
          <Loader2 size={18} className="animate-spin" /> מעבד את התמונה...
        </div>
      ) : imagePreview ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200">
          <img src={imagePreview} alt="תצוגה מקדימה" loading="lazy" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onImageRemove}
            className="absolute top-2 end-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition"
            aria-label="הסר תמונה"
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
            className="flex-1 flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:bg-[#F3F6FA]/50 transition text-gray-500"
          >
            <Upload size={24} />
            <span className="text-xs font-medium">העלה מהגלריה</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
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
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null);
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null);
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const lookupDoneRef = useRef<string>(''); // tracks last plate that was looked up
  const detailsStartRef = useRef<HTMLDivElement>(null); // scroll target after successful MOT lookup
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
  const [imageProcessing, setImageProcessing] = useState(false);

  // Share request state
  const [shareRequests, setShareRequests] = useState<ShareRequest[]>([]);
  const [shareState, setShareState] = useState<'idle' | 'can_request' | 'requesting' | 'sent'>('idle');
  const [sharePlate, setSharePlate] = useState('');
  const [processingShareId, setProcessingShareId] = useState<string | null>(null);

  // Owner-initiated sharing ("שתף רכב" modal)
  const [shareVehicle, setShareVehicle] = useState<Vehicle | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Auto-save form draft to sessionStorage — only while the ADD modal is open,
  // so editing an existing vehicle never pollutes the new-vehicle draft.
  useEffect(() => {
    if (!showAddModal) return;
    const hasData = Object.values(formData).some(v => v !== '');
    if (hasData) {
      sessionStorage.setItem('autolog_vehicle_draft', JSON.stringify(formData));
    }
  }, [formData, showAddModal]);

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
  }, []);
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

  const fetchShareRequests = async () => {
    try {
      const res = await fetch('/api/vehicles/share?type=received');
      const data = await res.json();
      if (res.ok && data.requests) {
        setShareRequests(data.requests);
      }
    } catch {
      // Silent fail — share requests are secondary
    }
  };

  // Owner invites someone (family / employee) to a vehicle they own
  const handleInvite = async () => {
    if (!shareVehicle || !inviteEmail.trim()) return;
    setInviteBusy(true);
    setInviteMsg(null);
    try {
      const res = await fetch('/api/vehicles/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: shareVehicle.id, sharedWithEmail: inviteEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInviteMsg({ type: 'ok', text: data.message || 'הרכב שותף בהצלחה' });
        setInviteEmail('');
        fetchShareRequests();
      } else {
        setInviteMsg({ type: 'err', text: data.error || 'השיתוף נכשל' });
      }
    } catch {
      setInviteMsg({ type: 'err', text: 'שגיאת רשת — נסה שוב' });
    }
    setInviteBusy(false);
  };

  // Owner revokes an existing share / removes a member
  const handleRevokeShare = async (shareId: string) => {
    setProcessingShareId(shareId);
    try {
      const res = await fetch('/api/vehicles/share', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId }),
      });
      if (res.ok) fetchShareRequests();
    } catch {
      // Silent fail
    }
    setProcessingShareId(null);
  };

  const handleShareAction = async (shareId: string, action: 'approve' | 'reject') => {
    setProcessingShareId(shareId);
    try {
      const res = await fetch('/api/vehicles/share', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId, action }),
      });
      if (res.ok) {
        fetchShareRequests();
        if (action === 'approve') fetchVehicles();
      }
    } catch {
      // Silent fail
    }
    setProcessingShareId(null);
  };

  const handleSendShareRequest = async () => {
    setShareState('requesting');
    try {
      const res = await fetch('/api/vehicles/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licensePlate: sharePlate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בשליחת הבקשה');
        setShareState('can_request');
        return;
      }
      setShareState('sent');
    } catch {
      setError('שגיאת חיבור');
      setShareState('can_request');
    }
  };

  useEffect(() => { fetchVehicles(); fetchShareRequests(); }, []);

  const handleLookup = async () => {
    const requested = formData.licensePlate.replace(/[-\s]/g, '');
    if (!requested || requested.length < 5) {
      setLookupMessage('נא להזין מספר רישוי תקין');
      return;
    }
    // Mark this plate as the active lookup so a stale response can be ignored
    lookupDoneRef.current = requested;
    setLookingUp(true);
    setLookupMessage('');
    try {
      const res = await fetch(`/api/vehicles/lookup?plate=${encodeURIComponent(formData.licensePlate)}`);
      const data = await res.json();
      // User changed the plate while fetching — drop this outdated result
      if (lookupDoneRef.current !== requested) { setLookingUp(false); return; }
      if (res.ok && data.vehicle) {
        const v = data.vehicle;
        setFormData(prev => ({
          ...prev,
          manufacturer: v.manufacturer || '',
          model: v.model || '',
          year: v.year ? String(v.year) : '',
          fuelType: v.fuelType || '',
          color: v.color || '',
          testExpiryDate: v.testExpiryDate ? v.testExpiryDate.split('T')[0] : '',
          nickname: `${v.manufacturer || ''} ${v.model || ''}`.trim() || prev.nickname,
        }));
        setLookupMessage('הנתונים נטענו ממשרד התחבורה!');
        // Guide first-time users: reveal the remaining fields (mileage etc.)
        setTimeout(() => {
          detailsStartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 700);
      } else {
        setLookupMessage('לא נמצא במאגר משרד התחבורה - ייתכן שזה רכב מיובא או שתוקף הטסט פג. אנא מלא את הפרטים ידנית או צלם את רישיון הרכב לחילוץ אוטומטי של הפרטים.');
      }
    } catch {
      setLookupMessage('שגיאה בחיפוש - נסה שוב');
    }
    setLookingUp(false);
  };

  // React to plate edits: clear stale auto-filled data immediately, then
  // (re)lookup live. Runs whether it's the first entry or a correction.
  useEffect(() => {
    const plate = formData.licensePlate.replace(/[-\s]/g, '');
    // Plate moved away from the last looked-up value → wipe stale MOT fields
    if (lookupDoneRef.current && plate !== lookupDoneRef.current) {
      lookupDoneRef.current = '';
      setLookupMessage('');
      setFormData(prev => (
        !prev.manufacturer && !prev.model && !prev.year && !prev.fuelType && !prev.color && !prev.testExpiryDate
          ? prev
          : { ...prev, manufacturer: '', model: '', year: '', fuelType: '', color: '', testExpiryDate: '', nickname: '' }
      ));
    }
    if (plate.length >= 7 && plate !== lookupDoneRef.current) {
      const timer = setTimeout(() => {
        lookupDoneRef.current = plate;
        handleLookup();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [formData.licensePlate]);

  const resetForm = () => {
    setFormData(emptyForm);
    setError('');
    setLookupMessage('');
    lookupDoneRef.current = '';
    setImagePreview(null);
    setImageData(null);
    setShareState('idle');
    setSharePlate('');
    sessionStorage.removeItem('autolog_vehicle_draft');
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isHeic = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    if (!file.type.startsWith('image/') && !isHeic) {
      setError('נא לבחור קובץ תמונה בלבד');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('התמונה גדולה מדי (מקסימום 20MB)');
      return;
    }
    setError('');
    setImagePreview(null);
    setImageProcessing(true);
    try {
      let source: Blob = file;
      // HEIC/HEIF (iPhone/Samsung gallery) — convert to JPEG first,
      // browsers can't render it in <img> and canvas can't decode it
      if (isHeic) {
        const heic2any = (await import('heic2any')).default;
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
        source = Array.isArray(converted) ? converted[0] : converted;
      }
      const compressed = await compressImage(source, 1600, 0.85);
      setImageData(compressed);
      // Preview shows EXACTLY what will be uploaded — no more broken previews
      setImagePreview(compressed);
    } catch {
      // Fallback: raw data URL, but only for formats browsers can actually display
      if (!isHeic) {
        try {
          const raw = await fileToDataUrl(file);
          setImageData(raw);
          setImagePreview(raw);
        } catch {
          setError('לא ניתן לטעון את התמונה. נסו תמונה אחרת או צלמו עם המצלמה.');
        }
      } else {
        setError('לא ניתן להמיר את התמונה. נסו תמונה אחרת או צלמו עם המצלמה.');
      }
    } finally {
      setImageProcessing(false);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.onerror = () => reject(new Error('file read failed'));
      reader.readAsDataURL(file);
    });

  // Resize + recompress image to a safe data URL for upload
  // Supports HEIC/HEIF via createImageBitmap fallback
  const compressImage = async (file: Blob, maxEdge: number, quality: number): Promise<string> => {
    const drawToCanvas = (source: ImageBitmap | HTMLImageElement, w: number, h: number): string => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas context unavailable');
      ctx.drawImage(source, 0, 0, w, h);
      return canvas.toDataURL('image/jpeg', quality);
    };

    // Method 1: createImageBitmap (supports HEIC on modern browsers)
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
        const w = Math.round(bitmap.width * scale);
        const h = Math.round(bitmap.height * scale);
        const result = drawToCanvas(bitmap, w, h);
        bitmap.close();
        return result;
      } catch { /* fall through to Image element */ }
    }

    // Method 2: Image element fallback
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        try { resolve(drawToCanvas(img, w, h)); } catch (e) { reject(e); }
      };
      img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('image load failed')); };
      img.src = objUrl;
    });
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
    if (!formData.mileage || Number(formData.mileage) < 0) {
      setError('יש להזין קילומטראז׳');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.canRequestShare) {
          setShareState('can_request');
          setSharePlate(data.vehiclePlate);
          setError('');
          setSaving(false);
          return;
        }
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
    return <PageSkeleton cards={3} />;
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVehicles();
      } else {
        setError('שגיאה במחיקת רכב');
      }
    } catch {
      setError('שגיאת חיבור');
    }
  };

  const handleSetPrimary = async (vehicleId: string) => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/set-primary`, { method: 'POST' });
      if (res.ok) {
        fetchVehicles();
      } else {
        setError('שגיאה בעדכון רכב ראשי');
      }
    } catch {
      setError('שגיאת חיבור');
    }
  };

  return (
    <div className="bg-[#F3F6FA] min-h-screen pb-24" dir="rtl">
      {/* Hidden camera input for capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Page Header */}
      <PageHeader title="הרכבים שלי" showBack={false} />

      {/* Main content */}
      <div className="px-4 pt-6 space-y-6">
        {/* Add Vehicle Button (compact, top-left) */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg py-1.5 px-3 font-semibold text-xs shadow-sm hover:from-teal-600 hover:to-teal-700 transition-all active:scale-95"
          >
            <Plus size={14} />
            הוסף רכב
          </button>
        </div>

        {/* Error message */}
        {error && !showAddModal && !showEditModal && (
          <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* AI Insights - hidden for cleaner layout */}
        {false && !loading && vehicles.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center">
                <Brain size={18} className="text-teal-600" />
              </div>
              <h2 className="text-base font-bold text-[#1B4E8A]">תובנות AI לרכבים</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Test Status Card */}
              <div className="bg-[#F3F6FA] rounded-xl p-3 border border-amber-100">
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
              <div className="bg-[#F3F6FA] rounded-xl p-3 border border-blue-100">
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
              <div className="bg-[#F3F6FA] rounded-xl p-3 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-xs font-bold text-gray-700">סיכום פעילות</span>
                </div>
                <p className="text-xs text-gray-600">
                  📊 {vehicles.reduce((sum, v) => sum + (v._count?.inspections || 0), 0)} אבחונים • {vehicles.reduce((sum, v) => sum + (v._count?.expenses || 0), 0)} הוצאות
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Share Requests (for vehicle owners) */}
        {shareRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <UserPlus size={18} className="text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-[#1B4E8A]">בקשות שיתוף ממתינות</h2>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {shareRequests.filter(r => r.status === 'pending').length}
              </span>
            </div>
            {shareRequests.filter(r => r.status === 'pending').map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{req.sharedUser?.fullName}</p>
                  <p className="text-xs text-gray-500">{req.sharedUser?.email}</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    מבקש גישה ל-{req.vehicle.nickname || `${req.vehicle.manufacturer} ${req.vehicle.model}`} ({req.vehicle.licensePlate})
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleShareAction(req.id, 'approve')}
                    disabled={processingShareId === req.id}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {processingShareId === req.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    אשר
                  </button>
                  <button
                    onClick={() => handleShareAction(req.id, 'reject')}
                    disabled={processingShareId === req.id}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    <XCircle size={12} />
                    דחה
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {vehicles.length === 0 && !error && (
          <div className="bg-white rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto">
              <Car size={32} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1B4E8A] mb-2">הוסף את הרכב הראשון שלך</h3>
              <p className="text-sm text-gray-500 mb-4">התחל לעקוב אחר הרכבים שלך עם AutoLog</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:from-teal-600 hover:to-teal-700 transition-all active:scale-95"
            >
              <Plus size={16} />
              הוסף רכב חדש
            </button>
          </div>
        )}

        {/* Vehicles List */}
        {vehicles.length > 0 && (
          <div className="space-y-4">
            {vehicles.map(v => (
              <div
                key={v.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all ${
                  v.isPrimary ? 'border-teal-400' : 'border-transparent'
                }`}
              >
                {/* Vehicle Header */}
                <div className="flex items-start gap-4">
                  <VehicleImage vehicleId={v.id} imageUrl={v.imageUrl} size="md" key={`img-${v.id}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-[#1B4E8A]">{v.nickname}</h3>
                      {v.isPrimary && (
                        <Badge variant="info" className="text-xs">ראשי</Badge>
                      )}
                      {v.isShared && (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-200">
                          <Users size={10} />
                          משותף
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {v.manufacturer} {v.model} • {v.year}
                    </p>
                    {v.isShared && v.ownerName && (
                      <p className="text-xs text-blue-600 mt-0.5">בבעלות {v.ownerName}</p>
                    )}
                    {/* Israeli License Plate */}
                    <div className="mt-2 inline-flex items-center gap-1 bg-yellow-300 text-black rounded px-2 py-1 text-xs font-bold border border-yellow-500">
                      <span>🇮🇱</span>
                      <span>{v.licensePlate}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit size={14} />}
                      onClick={() => openEditModal(v)}
                      className="text-gray-600 hover:text-teal-600"
                    />
                    {/* Share — only for vehicles I own (not ones shared with me) */}
                    {!v.isShared && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<UserPlus size={14} />}
                        onClick={() => { setShareVehicle(v); setInviteEmail(''); setInviteMsg(null); }}
                        className="text-gray-600 hover:text-blue-600"
                        title="שתף רכב"
                        aria-label="שתף רכב"
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      onClick={() => setDeleteVehicleId(v.id)}
                      className="text-gray-600 hover:text-red-600"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<ChevronDown size={14} className={expandedVehicle === v.id ? 'rotate-180 transition' : 'transition'} />}
                      onClick={() => setExpandedVehicle(expandedVehicle === v.id ? null : v.id)}
                      className="text-gray-600 hover:text-teal-600"
                    />
                  </div>
                </div>

                {/* Status Badges Row */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {v.testStatus === 'valid' && (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
                      🧪 טסט תקין
                    </span>
                  )}
                  {v.testStatus === 'expiring' && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium border border-amber-200">
                      ⚠️ טסט פוקע
                    </span>
                  )}
                  {v.testStatus === 'expired' && (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-medium border border-red-200">
                      ❌ טסט פג תוקף
                    </span>
                  )}

                  {v.insuranceStatus === 'valid' && (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
                      🛡️ ביטוח תקין
                    </span>
                  )}
                  {v.insuranceStatus === 'expiring' && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium border border-amber-200">
                      ⚠️ ביטוח פוקע
                    </span>
                  )}
                  {v.insuranceStatus === 'expired' && (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-medium border border-red-200">
                      ❌ ביטוח פג תוקף
                    </span>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedVehicle === v.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">תוקף טסט</div>
                        <div className="font-medium text-[#1B4E8A]">
                          {v.testExpiryDate ? new Date(v.testExpiryDate).toLocaleDateString('he-IL') : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">תוקף ביטוח</div>
                        <div className="font-medium text-[#1B4E8A]">
                          {v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString('he-IL') : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">ק״מ</div>
                        <div className="font-medium text-[#1B4E8A]">
                          {v.mileage?.toLocaleString() || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">דלק</div>
                        <div className="font-medium text-[#1B4E8A]">
                          {v.fuelType || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">צבע</div>
                        <div className="font-medium text-[#1B4E8A]">
                          {v.color || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">אבחונים</div>
                        <div className="font-medium text-[#1B4E8A]">
                          {v._count?.inspections || 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {!v.isPrimary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetPrimary(v.id)}
                          className="w-full border border-teal-200 text-teal-600 hover:bg-teal-50"
                        >
                          הגדר כרכב ראשי
                        </Button>
                      )}
                      <button
                        onClick={() => router.push(`/user/vehicles/${v.id}`)}
                        className="w-full text-center bg-[#F3F6FA] hover:bg-gray-100 text-[#1B4E8A] rounded-xl py-2 px-3 font-medium text-sm transition-colors"
                      >
                        צפה בדוחות
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Vehicle Modal */}
      {/* Share vehicle (owner-initiated) — invite by email + manage who it's shared with */}
      <Modal
        isOpen={!!shareVehicle}
        onClose={() => { setShareVehicle(null); setInviteEmail(''); setInviteMsg(null); }}
        title={shareVehicle ? `שיתוף רכב — ${shareVehicle.nickname}` : 'שיתוף רכב'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            שתף את הרכב עם בן משפחה או עובד. לאחר השיתוף הרכב יופיע ברשימת הרכבים שלו.
            אם הוא עדיין לא רשום — הרכב יופיע אצלו אוטומטית מיד לאחר ההרשמה עם אותו מייל.
          </p>

          <div className="flex gap-2 items-start">
            <Input
              type="email"
              inputMode="email"
              placeholder="כתובת מייל לשיתוף"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleInvite}
              loading={inviteBusy}
              disabled={!inviteEmail.trim() || inviteBusy}
              icon={<Send size={14} />}
            >
              שתף
            </Button>
          </div>

          {inviteMsg && (
            <p className={`text-sm ${inviteMsg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
              {inviteMsg.text}
            </p>
          )}

          <div>
            <h4 className="text-sm font-bold text-[#1B4E8A] mb-2">משותף עם</h4>
            {(() => {
              const list = shareRequests.filter(r => r.vehicleId === shareVehicle?.id);
              if (!list.length) {
                return <p className="text-sm text-gray-400">הרכב עדיין לא משותף עם אף אחד.</p>;
              }
              return (
                <div className="space-y-2">
                  {list.map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {s.sharedUser?.fullName || s.sharedWithEmail}
                        </p>
                        {s.sharedUser?.fullName && (
                          <p className="text-xs text-gray-500 truncate">{s.sharedWithEmail}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {s.status === 'approved' && <Badge variant="success" className="text-[10px]">משותף</Badge>}
                        {s.status === 'pending' && <Badge variant="warning" className="text-[10px]">ממתין לאישורך</Badge>}
                        {s.status === 'rejected' && <Badge variant="danger" className="text-[10px]">נדחה</Badge>}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<X size={14} />}
                          onClick={() => handleRevokeShare(s.id)}
                          loading={processingShareId === s.id}
                          className="text-gray-500 hover:text-red-600"
                          title="הסר שיתוף"
                          aria-label="הסר שיתוף"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditVehicleId(null); resetForm(); }} title="עריכת רכב" size="lg">
        <div className="space-y-4">
          {/* License Scan */}
          <LicenseScanButton onScanResult={handleScanResult} />

          {/* Image Upload */}
          <ImageUploadSection
            imagePreview={imagePreview}
            imageProcessing={imageProcessing}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            onCameraCapture={handleCameraCapture}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-end gap-2">
              <div className="flex-1"><Input label="כינוי" value={formData.nickname}
                onChange={e => setFormData({ ...formData, nickname: e.target.value })} /></div>
              <VoiceMicButton value={formData.nickname} onResult={v => setFormData({ ...formData, nickname: v })} className="mb-1" />
            </div>
            <Input label="מספר רישוי" value={formData.licensePlate} disabled />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">יצרן</label>
              <input
                type="text"
                list="mfr-options"
                value={formData.manufacturer}
                onChange={e => setFormData({ ...formData, manufacturer: e.target.value, model: '' })}
                placeholder="בחר או הקלד יצרן"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-sm"
              />
              <datalist id="mfr-options">
                {getManufacturerNames().map(m => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">דגם</label>
              <input
                type="text"
                list="model-options"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder="בחר או הקלד דגם"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-sm"
              />
              <datalist id="model-options">
                {getModelNames(formData.manufacturer).map(m => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
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
            <Input label="ק״מ *" type="number" value={formData.mileage} required
              onChange={e => setFormData({ ...formData, mileage: e.target.value })} />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">סוג דלק</label>
              <select
                value={formData.fuelType}
                onChange={e => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-sm"
              >
                <option value="">בחר סוג דלק</option>
                <option value="בנזין">בנזין</option>
                <option value="דיזל">דיזל</option>
                <option value="היברידי">היברידי</option>
                <option value="חשמלי">חשמלי</option>
                <option value="גז">גז</option>
              </select>
            </div>
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
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="הוספת רכב חדש" size="lg">
        <div className="space-y-4">
          {/* MOT Lookup Section */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Search size={16} className="text-blue-600" />
              <h4 className="font-bold text-blue-800 text-sm">חיפוש אוטומטי ממשרד התחבורה</h4>
            </div>
            <p className="text-xs text-blue-600 mb-3">הזן מספר רישוי והפרטים ימולאו אוטומטית</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input placeholder="הכנס מספר רישוי..." value={formData.licensePlate}
                  onChange={e => setFormData({ ...formData, licensePlate: e.target.value })} />
              </div>
              <Button variant="primary" size="md" loading={lookingUp} onClick={handleLookup}
                icon={<Search size={16} />}
                className={formData.licensePlate.length >= 5 && !lookupMessage ? 'animate-pulse' : ''}>
                חפש
              </Button>
            </div>
            {lookingUp && (
              <p className="text-sm mt-2 text-blue-600 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                מחפש נתוני רכב ממשרד התחבורה...
              </p>
            )}
            {lookupMessage && lookupMessage === 'NOT_FOUND' && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-sm font-bold text-amber-800 mb-1">משרד התחבורה לא מזהה את הרכב</p>
                <p className="text-xs text-amber-700 mb-2">הסיבה יכולה להיות:</p>
                <ul className="text-xs text-amber-700 space-y-0.5 mr-3 list-disc">
                  <li>הרכב ללא טסט בתוקף</li>
                  <li>הרכב יבוא אישי שעדיין לא נרשם</li>
                  <li>מספר הרישוי שגוי</li>
                </ul>
                <p className="text-xs text-amber-800 font-semibold mt-2">אפשר למלא את הפרטים ידנית למטה ↓</p>
              </div>
            )}
            {lookupMessage && lookupMessage !== 'NOT_FOUND' && (
              <>
                <p className="text-sm mt-2 text-green-600 font-medium">
                  ✓ {lookupMessage}
                </p>
                <p className="text-xs mt-1.5 text-[#1B4E8A] font-bold flex items-center gap-1.5 animate-bounce">
                  <span>המשיכו למלא את שאר הפרטים למטה</span>
                  <span className="text-base leading-none">↓</span>
                </p>
              </>
            )}
          </div>

          {/* License Scan */}
          <LicenseScanButton onScanResult={handleScanResult} />

          {/* Image Upload */}
          <ImageUploadSection
            imagePreview={imagePreview}
            imageProcessing={imageProcessing}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            onCameraCapture={handleCameraCapture}
          />

          <div ref={detailsStartRef} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-end gap-2">
              <div className="flex-1"><Input label="כינוי" placeholder="למשל: ספורטז' לבנה" value={formData.nickname}
                onChange={e => setFormData({ ...formData, nickname: e.target.value })} /></div>
              <VoiceMicButton value={formData.nickname} onResult={v => setFormData({ ...formData, nickname: v })} className="mb-1" />
            </div>
            <Input label="מספר רישוי" placeholder="1234567" value={formData.licensePlate}
              onChange={e => setFormData({ ...formData, licensePlate: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">יצרן</label>
              <input
                type="text"
                list="mfr-options"
                value={formData.manufacturer}
                onChange={e => setFormData({ ...formData, manufacturer: e.target.value, model: '' })}
                placeholder="בחר או הקלד יצרן"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-sm"
              />
              <datalist id="mfr-options">
                {getManufacturerNames().map(m => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">דגם</label>
              <input
                type="text"
                list="model-options"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder="בחר או הקלד דגם"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-sm"
              />
              <datalist id="model-options">
                {getModelNames(formData.manufacturer).map(m => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
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
            <Input label="ק״מ *" placeholder="45000" type="number" value={formData.mileage} required
              onChange={e => setFormData({ ...formData, mileage: e.target.value })} />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">סוג דלק</label>
              <select
                value={formData.fuelType}
                onChange={e => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-sm"
              >
                <option value="">בחר סוג דלק</option>
                <option value="בנזין">בנזין</option>
                <option value="דיזל">דיזל</option>
                <option value="היברידי">היברידי</option>
                <option value="חשמלי">חשמלי</option>
                <option value="גז">גז</option>
              </select>
            </div>
          </div>
          {error && shareState === 'idle' && <p className="text-red-500 text-sm">{error}</p>}

          {/* Share Request Panel — when vehicle belongs to another user */}
          {shareState !== 'idle' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
              {shareState === 'can_request' && (
                <>
                  <div className="flex items-start gap-2">
                    <Mail size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-800 text-sm">רכב זה כבר רשום במערכת</p>
                      <p className="text-blue-700 text-xs mt-1">
                        ניתן לשלוח בקשת שיתוף לבעל הרכב. לאחר אישורו, הרכב יופיע גם אצלך.
                      </p>
                    </div>
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button
                    type="button"
                    onClick={handleSendShareRequest}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    שלח בקשת שיתוף
                  </button>
                </>
              )}
              {shareState === 'requesting' && (
                <div className="flex items-center justify-center gap-2 py-2 text-blue-700 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  שולח בקשת שיתוף...
                </div>
              )}
              {shareState === 'sent' && (
                <div className="text-center space-y-2 py-1">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle2 size={18} />
                    <span className="font-semibold text-sm">הבקשה נשלחה בהצלחה!</span>
                  </div>
                  <p className="text-xs text-green-600">בעל הרכב יקבל הודעה במייל ויוכל לאשר את השיתוף</p>
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="mt-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition"
                  >
                    סגור
                  </button>
                </div>
              )}
            </div>
          )}

          {shareState === 'idle' && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button variant="ghost" onClick={() => { setShowAddModal(false); resetForm(); }} className="w-full sm:w-auto">ביטול</Button>
              <Button loading={saving} onClick={handleAddVehicle} className="w-full sm:w-auto">המשך</Button>
            </div>
          )}
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={deleteVehicleId !== null}
        title="מחיקת רכב"
        message="האם אתה בטוח שברצונך למחוק רכב זה?"
        confirmLabel="מחק"
        danger
        onConfirm={() => { const id = deleteVehicleId; setDeleteVehicleId(null); if (id) handleDeleteVehicle(id); }}
        onCancel={() => setDeleteVehicleId(null)}
      />
    </div>
  );
}
