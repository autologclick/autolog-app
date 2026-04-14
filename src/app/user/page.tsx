'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car, ChevronDown, ChevronLeft, Loader2, Plus, Flag,
  Wrench, FileText, Receipt, Calendar, Shield, Clock,
  Camera, Image as ImageIcon, AlertTriangle, CheckCircle,
  Gauge, Fuel, X, MapPin, Upload, Trash2, ClipboardCheck
} from 'lucide-react';
import OnboardingWizard from '@/components/shared/OnboardingWizard';
import GlobalSearch from '@/components/ui/GlobalSearch';
// Tesseract loaded dynamically in handleScanReceipt to avoid SSR issues

// ── Types ──────────────────────────────────────────
interface Vehicle {
  id: string;
  nickname: string;
  model: string;
  manufacturer: string;
  licensePlate: string;
  year: number;
  testStatus: string;
  testExpiryDate?: string;
  insuranceStatus: string;
  insuranceExpiry?: string;
  isPrimary: boolean;
  imageUrl?: string;
  mileage?: number;
  fuelType?: string;
  color?: string;
}

interface Treatment {
  id: string;
  type: string;
  title: string;
  date: string;
  cost?: number;
  mileage?: number;
  garageName?: string;
  status: string;
}

interface Document {
  id: string;
  type: string;
  title: string;
  name?: string;
  expiryDate?: string;
  fileUrl?: string;
  uploadedAt?: string;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
}

interface MaintenanceItem {
  category: string;
  item: string;
  intervalKm: number;
  intervalMonths: number;
  nextAtKm: number;
  priority: 'high' | 'medium' | 'low';
  estimatedCost: string;
  description: string;
}

interface MaintenanceSchedule {
  nextServiceKm: number;
  nextServiceDate: string;
  summary: string;
  items: MaintenanceItem[];
  generatedAt: string;
  basedOnMileage: number;
}

// ── Helpers ────────────────────────────────────────
const formatPlate = (p: string) => {
  const clean = p.replace(/[^0-9]/g, '');
  if (clean.length === 7) return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
  if (clean.length === 8) return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5)}`;
  return p;
};

const daysUntil = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const treatmentTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    maintenance: 'טיפול תקופתי', repair: 'תיקון', oil_change: 'החלפת שמן',
    tires: 'צמיגים', brakes: 'בלמים', electrical: 'חשמל', ac: 'מיזוג',
    bodywork: 'פחחות', other: 'אחר',
  };
  return map[t] || t;
};

const treatmentIcon = (t: string) => {
  const map: Record<string, string> = {
    maintenance: '🔧', repair: '🛠️', oil_change: '🛢️', tires: '🔄',
    brakes: '🛑', electrical: '⚡', ac: '❄️', bodywork: '🚗', other: '📋',
  };
  return map[t] || '🔧';
};

const docTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    vehicle_license: 'רישיון רכב', driving_license: 'רשיון נהיגה',
    insurance: 'ביטוח', receipt: 'קבלה', license: 'רישיון רכב',
    registration: 'רישום רכב',
  };
  return map[t] || t;
};

const docIcon = (t: string) => {
  const map: Record<string, string> = {
    vehicle_license: '🪪', driving_license: '📋', insurance: '🛡️',
    receipt: '🧾', license: '🪪', registration: '📄',
  };
  return map[t] || '📄';
};

const expenseCatLabel = (c: string) => {
  const map: Record<string, string> = {
    fuel: 'דלק', maintenance: 'טיפול', repairs: 'תיקון', insurance: 'ביטוח',
    parking: 'חניה', fines: 'קנסות', registration: 'רישוי', other: 'אחר',
  };
  return map[c] || c;
};

// ── Components ─────────────────────────────────────
const LicensePlate = ({ plate }: { plate: string }) => (
  <div className="inline-flex items-center rounded-lg overflow-hidden border-2 border-gray-700 shadow-sm">
    <div className="bg-blue-700 text-white px-2.5 py-2 flex flex-col items-center gap-0.5">
      <Flag size={10} className="fill-white" />
      <span className="text-[9px] font-bold leading-none">IL</span>
    </div>
    <div className="bg-yellow-300 px-4 py-2">
      <span className="text-lg font-black text-gray-900 tracking-[3px] font-mono">{formatPlate(plate)}</span>
    </div>
  </div>
);

const ReminderCard = ({ title, icon, value, subtitle, status }: {
  title: string; icon: string; value: string; subtitle?: string;
  status: 'danger' | 'warning' | 'success';
}) => {
  const borderColor = status === 'danger' ? 'border-r-red-500' : status === 'warning' ? 'border-r-amber-400' : 'border-r-green-500';
  const valueColor = status === 'danger' ? 'text-red-600' : status === 'warning' ? 'text-amber-600' : 'text-green-600';
  return (
    <div className={`bg-white rounded-xl p-2.5 shadow-sm border-r-4 ${borderColor}`}>
      <div className="text-[11px] text-gray-500 mb-1">{icon} {title}</div>
      <div className={`text-lg font-bold leading-tight ${valueColor}`}>{value}</div>
      {subtitle && <div className="text-[10px] text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────
export default function UserHomePage() {
  const router = useRouter();

  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showVehicleList, setShowVehicleList] = useState(false);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Maintenance schedule
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceSchedule | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  // Fetch maintenance schedule (reusable)
  const fetchMaintenanceSchedule = async (vehicleId: string, forceRefresh = false) => {
    setMaintenanceLoading(true);
    setMaintenanceError(false);
    try {
      const url = forceRefresh
        ? `/api/vehicles/${vehicleId}/maintenance-schedule`
        : `/api/vehicles/${vehicleId}/maintenance-schedule`;
      const options = forceRefresh ? { method: 'POST' } : { method: 'GET' };
      const r = await fetch(url, options);
      const data = await r.json();
      if (data.schedule) {
        setMaintenanceSchedule(data.schedule);
      } else {
        setMaintenanceError(true);
      }
    } catch {
      setMaintenanceError(true);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // Treatment modal
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [showTreatmentsMenu, setShowTreatmentsMenu] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    type: 'maintenance', title: '', date: new Date().toISOString().slice(0, 10),
    cost: '', mileage: '', garageName: '', description: '',
  });
  const [treatmentImage, setTreatmentImage] = useState<string | null>(null);
  const [submittingTreatment, setSubmittingTreatment] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState(false);
  const treatmentImageRef = useRef<HTMLInputElement>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  const vehicle = vehicles[selectedIdx] || null;

  // ── Data Fetching ──
  useEffect(() => {
    fetch('/api/vehicles').then(r => r.json())
      .then(data => {
        if (data.vehicles?.length > 0) {
          setVehicles(data.vehicles);
          // Auto-select primary vehicle
          const primaryIdx = data.vehicles.findIndex((v: Vehicle) => v.isPrimary);
          if (primaryIdx >= 0) setSelectedIdx(primaryIdx);
        } else {
          setShowOnboarding(true);
        }
      })
      .catch(() => setShowOnboarding(true))
      .finally(() => setLoading(false));
  }, []);

  // Fetch vehicle-specific data when selected vehicle changes
  useEffect(() => {
    if (!vehicle) return;
    const id = vehicle.id;
    Promise.all([
      fetch(`/api/treatments?vehicleId=${id}`).then(r => r.json()).catch(() => ({ treatments: [] })),
      fetch(`/api/documents?vehicleId=${id}`).then(r => r.json()).catch(() => ({ documents: [] })),
      fetch(`/api/expenses?vehicleId=${id}&limit=10`).then(r => r.json()).catch(() => ({ expenses: [] })),
    ]).then(([tData, dData, eData]) => {
      setTreatments(tData.treatments || []);
      setDocuments(dData.documents || []);
      setExpenses(eData.expenses || []);
    });
    // Fetch maintenance schedule automatically
    // Always try - the API will fallback to treatment mileage if vehicle.mileage is null
    fetchMaintenanceSchedule(id);
  }, [vehicle?.id]);

  // ── Computed values ──
  const testDays = daysUntil(vehicle?.testExpiryDate);
  const insuranceDays = daysUntil(vehicle?.insuranceExpiry);
  const thisMonthExpenses = expenses
    .filter(e => new Date(e.date).getMonth() === new Date().getMonth() && new Date(e.date).getFullYear() === new Date().getFullYear())
    .reduce((sum, e) => sum + e.amount, 0);

  // ── Delete Vehicle ──
  const handleDeleteVehicle = async () => {
    if (!vehicle) return;
    setDeletingVehicle(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setShowDeleteModal(false);
      setVehicles(prev => prev.filter(v => v.id !== vehicle.id));
      setSelectedIdx(0);
      if (vehicles.length <= 1) {
        router.push('/user/vehicles/add');
      }
    } catch {
      alert('שגיאה במחיקת הרכב');
    } finally {
      setDeletingVehicle(false);
    }
  };

  // ── Image compression ──
  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas error')); return; }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(reader.result as string);
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  };

  // ── OCR Scan ──
  const handleScanReceipt = async (file: File) => {
    setScanning(true);
    try {
      const dataUrl = await compressImage(file, 1200, 0.85);
      setTreatmentImage(dataUrl);
      const Tesseract = (await import('tesseract.js')).default;
      const { data } = await Tesseract.recognize(dataUrl, 'heb+eng');
      const text = data.text;
      // Try extracting cost
      const costMatch = text.match(/סה[״"]?כ[^0-9]*([0-9,.]+)/i) || text.match(/total[^0-9]*([0-9,.]+)/i) || text.match(/₪\s*([0-9,.]+)/);
      if (costMatch) setTreatmentForm(f => ({ ...f, cost: costMatch[1].replace(',', '') }));
      // Try extracting date
      const dateMatch = text.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
      if (dateMatch) {
        const y = dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
        setTreatmentForm(f => ({ ...f, date: `${y}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}` }));
      }
    } catch { /* silently fail */ }
    setScanning(false);
  };

  // ── Submit Treatment ──
  const submitTreatment = async () => {
    if (!vehicle || !treatmentForm.title) return;
    setSubmittingTreatment(true);
    try {
      const body: Record<string, unknown> = {
        vehicleId: vehicle.id,
        type: treatmentForm.type,
        title: treatmentForm.title,
        date: new Date(treatmentForm.date).toISOString(),
      };
      if (treatmentForm.cost) body.cost = parseFloat(treatmentForm.cost);
      if (treatmentForm.mileage) body.mileage = parseInt(treatmentForm.mileage);
      if (treatmentForm.garageName) body.garageName = treatmentForm.garageName;
      if (treatmentForm.description) body.description = treatmentForm.description;

      const res = await fetch('/api/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setTreatments(prev => [data.treatment, ...prev]);
        setShowAddTreatment(false);
        setTreatmentForm({ type: 'maintenance', title: '', date: new Date().toISOString().slice(0, 10), cost: '', mileage: '', garageName: '', description: '' });
        setTreatmentImage(null);
      }
    } catch { /* silently fail */ }
    setSubmittingTreatment(false);
  };

  // ── Loading & Onboarding ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fef7ed] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">טוען את הרכב שלך...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingWizard isOpen={true} onComplete={() => window.location.reload()} />;
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#fef7ed] flex items-center justify-center px-4">
        <div className="text-center">
          <Car size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">לא נמצאו רכבים</p>
          <button
            onClick={() => router.push('/user/vehicles')}
            className="bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            הוסף רכב ראשון
          </button>
        </div>
      </div>
    );
  }

  // ── Treatment type chips ──
  const treatmentTypes = ['maintenance', 'tires', 'electrical', 'oil_change', 'brakes', 'repair', 'other'];

  return (
    <div className="min-h-screen bg-[#fef7ed] pb-24">

      {/* ═══ Header ═══ */}
      <div className="bg-gradient-to-l from-[#1e3a5f] to-[#2a5a8f] text-white px-4 pt-5 pb-6 rounded-b-3xl">
        {/* Search & Delete */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="מחק רכב"
          >
            <Trash2 size={20} className="text-red-300" />
          </button>
          <GlobalSearch />
        </div>
        {/* Vehicle Selector — always visible, so "Add Vehicle" is always reachable */}
        <div className="relative mb-3">
          <button
            onClick={() => setShowVehicleList(!showVehicleList)}
            className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 w-full"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            <span className="font-semibold flex-1 text-right">{vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`}</span>
            <ChevronDown size={16} className={`transition-transform ${showVehicleList ? 'rotate-180' : ''}`} />
          </button>
          {showVehicleList && (
            <div className="absolute top-full right-0 left-0 mt-1 bg-white rounded-xl shadow-xl z-50 overflow-hidden">
              {vehicles.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => { setSelectedIdx(i); setShowVehicleList(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-50 transition-colors ${i === selectedIdx ? 'bg-teal-50' : ''}`}
                >
                  <Car size={18} className={i === selectedIdx ? 'text-teal-600' : 'text-gray-400'} />
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${i === selectedIdx ? 'text-teal-700' : 'text-gray-700'}`}>
                      {v.nickname || `${v.manufacturer} ${v.model}`}
                    </div>
                    <div className="text-xs text-gray-400">{formatPlate(v.licensePlate)}</div>
                  </div>
                  {i === selectedIdx && <CheckCircle size={16} className="text-teal-600" />}
                </button>
              ))}
              <button
                onClick={() => router.push('/user/vehicles')}
                className="w-full flex items-center gap-3 px-4 py-3 text-right border-t hover:bg-gray-50"
              >
                <Plus size={18} className="text-teal-600" />
                <span className="text-sm font-semibold text-teal-600">הוסף רכב</span>
              </button>
            </div>
          )}
        </div>

        {/* License Plate */}
        <div className="flex justify-center mb-3">
          <LicensePlate plate={vehicle.licensePlate} />
        </div>

        {/* Vehicle Info */}
        <div className="flex items-center justify-center gap-3 text-sm text-white/70">
          <span>{vehicle.manufacturer} {vehicle.model}</span>
          <span className="text-white/30">•</span>
          <span>{vehicle.year}</span>
          {vehicle.mileage && (
            <>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1"><Gauge size={12} /> {vehicle.mileage.toLocaleString()} ק&quot;מ</span>
            </>
          )}
        </div>
      </div>

      {/* ═══ Content ═══ */}
      <div className="px-4 -mt-3 space-y-4">

        {/* Smart Reminders */}
        <div className="grid grid-cols-3 gap-2">
          <ReminderCard
            icon="🧪" title="טסט"
            value={testDays !== null ? (testDays < 0 ? 'פג תוקף!' : `${testDays} יום`) : 'ללא טסט'}
            subtitle={vehicle.testExpiryDate ? new Date(vehicle.testExpiryDate).toLocaleDateString('he-IL') : 'לא בתוקף'}
            status={testDays !== null ? (testDays < 0 ? 'danger' : testDays < 30 ? 'warning' : 'success') : 'danger'}
          />
          <ReminderCard
            icon="🛡️" title="ביטוח"
            value={insuranceDays !== null ? (insuranceDays < 0 ? 'פג תוקף!' : `${insuranceDays} יום`) : 'לא הוגדר'}
            subtitle={vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toLocaleDateString('he-IL') : undefined}
            status={insuranceDays !== null ? (insuranceDays < 0 ? 'danger' : insuranceDays < 30 ? 'warning' : 'success') : 'warning'}
          />
          <div
            onClick={() => {
              if (maintenanceLoading) return;
              if (maintenanceSchedule) {
                setShowMaintenanceModal(true);
              } else if (vehicle) {
                fetchMaintenanceSchedule(vehicle.id);
              }
            }}
            className="cursor-pointer"
          >
            <ReminderCard
              icon="🔧" title="טיפול הבא"
              value={maintenanceLoading ? 'מחשב...' : maintenanceSchedule ? `${(maintenanceSchedule.nextServiceKm / 1000).toFixed(0)}K ק"מ` : maintenanceError ? 'נסה שוב' : 'חשב עכשיו'}
              subtitle={maintenanceLoading ? 'AI מחשב לפי יצרן...' : maintenanceSchedule ? maintenanceSchedule.summary : maintenanceError ? 'לחץ לניסיון נוסף' : 'לחץ לחישוב AI'}
              status={maintenanceSchedule ? (maintenanceSchedule.items.some(i => i.priority === 'high') ? 'danger' : 'success') : maintenanceError ? 'danger' : 'warning'}
            />
          </div>
        </div>

        {/* Vehicle Inspection Booking CTA */}
        {vehicle && (
          <button
            onClick={() => router.push('/user/book-garage?service=inspection')}
            className="w-full relative overflow-hidden rounded-2xl py-5 px-6 shadow-lg active:scale-[0.98] transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #115e59 100%)',
            }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-8 -left-8 w-32 h-32 bg-white rounded-full" />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white rounded-full" />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <ClipboardCheck size={24} className="text-white" />
                </div>
                <div className="text-right">
                  <h3 className="text-white font-bold text-base">הזמן בדיקה מקצועית לרכב</h3>
                  <p className="text-teal-100 text-xs mt-0.5 leading-relaxed">
                    בדיקת AutoLog מקיפה ע&quot;י טכנאי מוסמך — כוללת מנוע, בלמים, שלדה, חשמל ועוד.
                    קבל דוח מפורט עם ציון בריאות הרכב והמלצות לטיפול
                  </p>
                </div>
              </div>
              <ChevronLeft size={22} className="text-white/70 flex-shrink-0" />
            </div>
          </button>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowTreatmentsMenu(true)}
            className="flex-1 bg-teal-600 text-white rounded-xl py-3 flex flex-col items-center gap-1 shadow-md active:scale-[0.97] transition-transform"
          >
            <Wrench size={20} />
            <span className="text-xs font-semibold">טיפולים</span>
          </button>
          <button
            onClick={() => router.push('/user/documents')}
            className="flex-1 bg-teal-600 text-white rounded-xl py-3 flex flex-col items-center gap-1 shadow-md active:scale-[0.97] transition-transform"
          >
            <FileText size={20} />
            <span className="text-xs font-semibold">+ מסמך</span>
          </button>
          <button
            onClick={() => router.push('/user/vehicles')}
            className="flex-1 bg-teal-600 text-white rounded-xl py-3 flex flex-col items-center gap-1 shadow-md active:scale-[0.97] transition-transform"
          >
            <Car size={20} />
            <span className="text-xs font-semibold">הרכבים שלי</span>
          </button>
        </div>

        {/* Recent Treatments */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-[#1e3a5f] flex items-center gap-2">
              <Wrench size={16} className="text-teal-600" />
              טיפולים אחרונים
            </h3>
            <button onClick={() => router.push('/user/treatments')} className="text-sm text-teal-600 font-semibold">
              הכל ←
            </button>
          </div>
          {treatments.length === 0 ? (
            <div className="text-center py-4">
              <Wrench size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">עדיין אין טיפולים</p>
              <button onClick={() => setShowAddTreatment(true)} className="text-sm text-teal-600 font-semibold mt-2">
                הוסף טיפול ראשון ←
              </button>
            </div>
          ) : (
            <div className="space-y-0">
              {treatments.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-b-0">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    {treatmentIcon(t.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1e3a5f] truncate">{t.title}</div>
                    <div className="text-xs text-gray-400">
                      {t.garageName && `${t.garageName} • `}
                      {new Date(t.date).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                  {t.cost && (
                    <div className="text-sm font-bold text-[#1e3a5f] flex-shrink-0">₪{t.cost.toLocaleString()}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-[#1e3a5f] flex items-center gap-2">
              <FileText size={16} className="text-teal-600" />
              מסמכים
            </h3>
            <button onClick={() => router.push('/user/documents')} className="text-sm text-teal-600 font-semibold">
              הכל ←
            </button>
          </div>
          {/* Document slots */}
          {['vehicle_license', 'insurance', 'driving_license'].map(docType => {
            const doc = documents.find(d => {
              const t = d.type;
              // Normalize legacy types for matching
              if (docType === 'vehicle_license') {
                return t === 'vehicle_license' || t === 'license' || t === 'registration' || t === 'test_certificate';
              }
              if (docType === 'insurance') {
                return t === 'insurance' || t.startsWith('insurance');
              }
              return t === docType;
            });
            const hasExpiry = doc?.expiryDate;
            const days = hasExpiry ? daysUntil(doc.expiryDate) : null;
            const isExpired = days !== null && days < 0;
            const isExpiring = days !== null && days >= 0 && days <= 30;
            return (
              <div key={docType} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-b-0">
                <span className="text-xl">{docIcon(docType)}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#1e3a5f]">{docTypeLabel(docType)}</div>
                  {doc ? (
                    <div className={`text-xs ${isExpired ? 'text-red-500' : isExpiring ? 'text-amber-500' : 'text-green-500'}`}>
                      {isExpired ? '⚠️ פג תוקף' : isExpiring ? `⏳ פוקע בעוד ${days} יום` : hasExpiry ? `✅ בתוקף עד ${new Date(doc.expiryDate!).toLocaleDateString('he-IL')}` : '✅ הועלה'}
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push('/user/documents')}
                      className="text-xs text-gray-400 hover:text-teal-600"
                    >
                      ➕ העלה מסמך
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Monthly Expenses Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-[#1e3a5f] flex items-center gap-2">
              <Receipt size={16} className="text-teal-600" />
              הוצאות {new Date().toLocaleDateString('he-IL', { month: 'long' })}
            </h3>
            <button onClick={() => router.push('/user/expenses')} className="text-sm text-teal-600 font-semibold">
              הכל ←
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-[#1e3a5f]">₪{thisMonthExpenses.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">
                {expenses.length > 0
                  ? `${expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length} רשומות החודש`
                  : 'אין הוצאות החודש'}
              </div>
            </div>
            <button
              onClick={() => router.push('/user/expenses')}
              className="bg-teal-50 text-teal-700 px-4 py-2 rounded-lg text-sm font-semibold active:scale-[0.97] transition-transform"
            >
              + הוסף
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          <button
            onClick={() => router.push(`/user/vehicles/${vehicle.id}/report`)}
            className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-purple-600" />
            </div>
            <div className="text-sm font-semibold text-[#1e3a5f]">דוח מלא</div>
          </button>
          <button
            onClick={() => router.push('/user/history')}
            className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Clock size={18} className="text-blue-600" />
            </div>
            <div className="text-sm font-semibold text-[#1e3a5f]">היסטוריה</div>
          </button>
        </div>
      </div>

      {/* ═══ Treatments Menu Modal ═══ */}
      {showTreatmentsMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowTreatmentsMenu(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-[#1e3a5f]">טיפולים</h3>
              <button onClick={() => setShowTreatmentsMenu(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => { setShowTreatmentsMenu(false); setShowAddTreatment(true); }}
                className="w-full flex items-center gap-3 p-4 bg-teal-50 hover:bg-teal-100 rounded-xl text-right transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                  <Wrench size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[#1e3a5f]">הוסף טיפול חדש</div>
                  <div className="text-xs text-gray-500">רישום טיפול שבוצע ברכב</div>
                </div>
                <ChevronLeft size={20} className="text-gray-400" />
              </button>
              <button
                onClick={() => { setShowTreatmentsMenu(false); router.push('/user/treatments'); }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-right transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[#1e3a5f]">היסטוריית טיפולים</div>
                  <div className="text-xs text-gray-500">כל הטיפולים שבוצעו ברכב</div>
                </div>
                <ChevronLeft size={20} className="text-gray-400" />
              </button>
              <button
                onClick={() => { setShowTreatmentsMenu(false); setShowMaintenanceModal(true); }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-right transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                  <Wrench size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[#1e3a5f]">הטיפול הבא</div>
                  <div className="text-xs text-gray-500">מתי מומלץ הטיפול הבא לרכב</div>
                </div>
                <ChevronLeft size={20} className="text-gray-400" />
              </button>
              <button
                onClick={() => { setShowTreatmentsMenu(false); router.push('/user/book-garage'); }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-right transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                  <Car size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[#1e3a5f]">הזמן תור למוסך</div>
                  <div className="text-xs text-gray-500">קבע מועד לטיפול הבא</div>
                </div>
                <ChevronLeft size={20} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Add Treatment Modal ═══ */}
      {showAddTreatment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="text-lg font-bold text-[#1e3a5f]">הוסף טיפול</h3>
              <button onClick={() => setShowAddTreatment(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Treatment type chips */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">סוג טיפול</label>
                <div className="flex flex-wrap gap-2">
                  {treatmentTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setTreatmentForm(f => ({ ...f, type }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        treatmentForm.type === type
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {treatmentTypeLabel(type)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Receipt scan */}
              <div className="flex gap-2">
                <button
                  onClick={() => scanRef.current?.click()}
                  disabled={scanning}
                  className="flex-1 bg-gradient-to-l from-purple-500 to-purple-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {scanning ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                  <span className="text-sm font-semibold">{scanning ? 'סורק...' : '✨ סרוק קבלה'}</span>
                </button>
                <input ref={scanRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleScanReceipt(e.target.files[0]); }} />
              </div>

              {treatmentImage && (
                <div className="relative rounded-xl overflow-hidden border">
                  <img src={treatmentImage} alt="קבלה" className="w-full max-h-40 object-cover" />
                  <button onClick={() => setTreatmentImage(null)} className="absolute top-2 left-2 bg-black/50 text-white rounded-full p-1">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Form fields */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">כותרת *</label>
                <input
                  value={treatmentForm.title} onChange={e => setTreatmentForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="למשל: טיפול 50,000 ק״מ"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">תאריך</label>
                  <input type="date" value={treatmentForm.date}
                    onChange={e => setTreatmentForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">עלות (₪)</label>
                  <input value={treatmentForm.cost}
                    onChange={e => setTreatmentForm(f => ({ ...f, cost: e.target.value }))}
                    placeholder="0" type="number"
                    className="w-full border rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">ק&quot;מ</label>
                  <input value={treatmentForm.mileage}
                    onChange={e => setTreatmentForm(f => ({ ...f, mileage: e.target.value }))}
                    placeholder="0" type="number"
                    className="w-full border rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">מוסך</label>
                  <input value={treatmentForm.garageName}
                    onChange={e => setTreatmentForm(f => ({ ...f, garageName: e.target.value }))}
                    placeholder="שם המוסך"
                    className="w-full border rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">תיאור</label>
                <textarea value={treatmentForm.description}
                  onChange={e => setTreatmentForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="פרטים נוספים..." rows={2}
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                />
              </div>

              {/* Image upload */}
              {!treatmentImage && (
                <div>
                  <button onClick={() => treatmentImageRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-2 text-gray-400 hover:border-teal-300 hover:text-teal-500 transition-colors">
                    <Upload size={20} />
                    <span className="text-sm">צרף תמונה</span>
                  </button>
                  <input ref={treatmentImageRef} type="file" accept="image/*" className="hidden"
                    onChange={async e => { if (e.target.files?.[0]) setTreatmentImage(await compressImage(e.target.files[0])); }} />
                </div>
              )}

              {/* Submit */}
              <button
                onClick={submitTreatment}
                disabled={!treatmentForm.title || submittingTreatment}
                className="w-full bg-teal-600 text-white rounded-xl py-3.5 font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {submittingTreatment ? <Loader2 size={18} className="animate-spin" /> : null}
                {submittingTreatment ? 'שומר...' : 'שמור טיפול'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Maintenance Schedule Modal ═══ */}
      {showMaintenanceModal && maintenanceSchedule && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end lg:items-center justify-center" onClick={() => setShowMaintenanceModal(false)}>
          <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900">הטיפול הבא</h3>
              <button onClick={() => setShowMaintenanceModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Summary - simple */}
            <div className="p-5 bg-teal-50 border-b border-teal-100 text-center">
              <div className="text-xs text-teal-700 mb-1">הטיפול הבא ברכב</div>
              <div className="text-2xl font-bold text-teal-800">
                {maintenanceSchedule.nextServiceKm.toLocaleString()} ק&quot;מ
              </div>
              <div className="text-sm text-gray-600 mt-1">
                נותרו {Math.max(0, maintenanceSchedule.nextServiceKm - maintenanceSchedule.basedOnMileage).toLocaleString()} ק&quot;מ
              </div>
            </div>

            {/* What to replace - simple list */}
            <div className="p-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3">מה צריך להחליף?</h4>
              <div className="space-y-2">
                {maintenanceSchedule.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      item.priority === 'high' ? 'bg-red-500' :
                      item.priority === 'medium' ? 'bg-amber-500' :
                      'bg-gray-400'
                    }`} />
                    <div className="flex-1 text-sm font-medium text-gray-800">{item.item}</div>
                    <div className="text-xs text-gray-500">{item.estimatedCost}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
              <p className="text-[10px] text-gray-400 text-center mb-2">
                הערכה בלבד • מומלץ להתייעץ עם מוסך
              </p>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="w-full bg-teal-600 text-white rounded-xl py-3 font-semibold text-sm"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Delete Vehicle Modal ═══ */}
      {showDeleteModal && vehicle && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">מחיקת רכב</h3>
              <p className="text-sm text-gray-500">
                האם אתה בטוח שברצונך למחוק את{' '}
                <span className="font-semibold text-gray-700">{vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`}</span>?
              </p>
              <p className="text-xs text-red-500 mt-2">פעולה זו תמחק את כל הטיפולים, המסמכים וההוצאות של הרכב ולא ניתן לשחזר אותם.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 font-semibold text-sm"
              >
                ביטול
              </button>
              <button
                onClick={handleDeleteVehicle}
                disabled={deletingVehicle}
                className="flex-1 bg-red-500 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingVehicle ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deletingVehicle ? 'מוחק...' : 'מחק'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
