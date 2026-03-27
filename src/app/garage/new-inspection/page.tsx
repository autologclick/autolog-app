'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import VoiceInput from '@/components/ui/VoiceInput';
import {
  Shield, Search, Check, AlertTriangle, X, Save, ArrowRight, ArrowLeft,
  Loader2, Camera, Video, Car, Wrench, Droplets, Gauge, Lightbulb,
  CircleDot, Settings, Wind, Eye, PenLine, ScanLine, Plus, Keyboard, FileText, Info, Send
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

// ====== Types ======
type ItemStatus = 'ok' | 'warning' | 'critical' | '';
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface TireStatus { frontLeft: string; frontRight: string; rearLeft: string; rearRight: string; }
interface LightStatus { brakes: string; reverse: string; fog: string; headlights: string; frontSignal: string; rearSignal: string; highBeam: string; plate: string; }
interface ShockStatus { frontLeft: string; frontRight: string; rearLeft: string; rearRight: string; notes: string; }
interface FluidStatus { brakeFluid: string; engineOil: string; coolant: string; }
interface WindowStatus { frontLeft: string; frontRight: string; rearLeft: string; rearRight: string; }
interface BrakeSystem { frontDiscs: number; rearDiscs: number; frontPads: number; rearPads: number; }
interface Recommendation { text: string; urgency: string; estimatedCost: string; }
interface GarageVehicle {
  id: string;
  licensePlate: string;
  manufacturer: string;
  model: string;
  year?: number;
  nickname?: string;
}


const statusOptions = [
  { value: 'ok', label: 'תקין', color: 'bg-green-500', icon: Check },
  { value: 'warning', label: 'דורש תשומת לב', color: 'bg-amber-500', icon: AlertTriangle },
  { value: 'critical', label: 'קריטי', color: 'bg-red-500', icon: X },
];

const inspectionTypes = [
  { value: 'full', label: 'בדיקת AutoLog' },
  { value: 'pre_test', label: 'הכנה לטסט' },
  { value: 'troubleshoot', label: 'תיקון/אבחון תקלה' },
  { value: 'periodic', label: 'טיפול תקופתי' },
];

// ====== Status Selector Component ======
function StatusSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 rounded-lg">
      <span className="flex-1 font-medium text-sm">{label}</span>
      <div className="flex gap-1">
        {statusOptions.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(value === opt.value ? '' : opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                value === opt.value ? `${opt.color} text-white` : 'bg-white border border-gray-200 hover:border-gray-400 text-gray-600'
              }`}
            >
              <Icon size={12} />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ====== Light Status Options (Binary: Pass/Fail) ======
const lightStatusOptions = [
  { value: 'ok', label: 'תקין', color: 'bg-green-500', emoji: '✓' },
  { value: 'not_ok', label: 'לא תקין', color: 'bg-red-500', emoji: '✕' },
];

function LightStatusSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex gap-1.5">
        {lightStatusOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1 ${
              value === opt.value
                ? `${opt.color} text-white shadow-sm`
                : 'bg-white border border-gray-200 hover:border-gray-400 text-gray-600'
            }`}
          >
            <span className="text-xs">{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>
      <span className="font-medium text-xs sm:text-sm text-gray-700 me-2">{label}</span>
    </div>
  );
}

// ====== Tire Status Options ======
const tireStatusOptions = [
  { value: 'new', label: 'חדש', color: 'bg-blue-500' },
  { value: 'ok', label: 'תקין', color: 'bg-green-500' },
  { value: 'worn', label: 'שחוק', color: 'bg-amber-500' },
  { value: 'dry', label: 'יבש', color: 'bg-orange-500' },
  { value: 'failed', label: 'פסול', color: 'bg-red-500' },
];

function TireStatusSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const selected = tireStatusOptions.find(o => o.value === value);
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {selected && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${selected.color}`}>
              {selected.label}
            </span>
          )}
        </div>
        <span className="font-medium text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex gap-1.5 flex-wrap justify-end">
        {tireStatusOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              value === opt.value
                ? `${opt.color} text-white shadow-sm`
                : 'bg-white border border-gray-200 hover:border-gray-400 text-gray-600'
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${opt.color} inline-block`} />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ====== Shock Absorber Status Options ======
const shockStatusOptions = [
  { value: 'ok', label: 'תקין', color: 'bg-green-500' },
  { value: 'sweating', label: 'הזעה', color: 'bg-amber-500' },
  { value: 'leaking', label: 'נוזל', color: 'bg-orange-500' },
  { value: 'replace', label: 'להחלפה', color: 'bg-red-500' },
];

function ShockStatusSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <span className="font-medium text-xs sm:text-sm text-gray-700 block text-right mb-2">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {shockStatusOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              value === opt.value
                ? `${opt.color} text-white shadow-sm`
                : 'bg-white border border-gray-200 hover:border-gray-400 text-gray-600'
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${opt.color} inline-block`} />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ====== Fluid Status Options ======
const fluidStatusOptions = [
  { value: 'ok', label: 'תקין', color: 'bg-green-500' },
  { value: 'low', label: 'חסר', color: 'bg-amber-500' },
  { value: 'dirty', label: 'מלוכלך', color: 'bg-orange-500' },
  { value: 'replace', label: 'להחלפה', color: 'bg-red-500' },
];

function FluidStatusSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <span className="font-medium text-xs sm:text-sm text-gray-700 block text-right mb-2">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {fluidStatusOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              value === opt.value
                ? `${opt.color} text-white shadow-sm`
                : 'bg-white border border-gray-200 hover:border-gray-400 text-gray-600'
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${opt.color} inline-block`} />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ====== Main Component ======
export default function NewInspectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId') || '';
  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successModal, setSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [successId, setSuccessId] = useState('');

  // Step 1: Vehicle & Type
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [inspectionType, setInspectionType] = useState('full');
  const [mechanicName, setMechanicName] = useState('');
  const [mileage, setMileage] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [engineVerified, setEngineVerified] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // Manual vehicle entry
  const [vehicleMode, setVehicleMode] = useState<'select' | 'manual' | 'scan'>('select');
  const [manualPlate, setManualPlate] = useState('');
  const [manualManufacturer, setManualManufacturer] = useState('');
  const [manualModel, setManualModel] = useState('');
  const [manualYear, setManualYear] = useState('');
  const [manualColor, setManualColor] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanPreview, setScanPreview] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Step 2: Exterior Photos
  const [exteriorPhotos, setExteriorPhotos] = useState<Record<string, string>>({});

  // Step 3: Interior Photos
  const [interiorPhotos, setInteriorPhotos] = useState<Record<string, string>>({});

  // Step 4: Tires & Lights
  const [tires, setTires] = useState<TireStatus>({ frontLeft: '', frontRight: '', rearLeft: '', rearRight: '' });
  const [tiresNotes, setTiresNotes] = useState('');
  const [lights, setLights] = useState<LightStatus>({ brakes: '', reverse: '', fog: '', headlights: '', frontSignal: '', rearSignal: '', highBeam: '', plate: '' });
  const [lightsNotes, setLightsNotes] = useState('');

  // Step 5: Mechanical Systems
  const [frontAxleItems, setFrontAxleItems] = useState<Record<string, string>>({
    stabilizerBars: '', controlArms: '', bushings: '', wheelBearings: '',
  });
  const [frontAxleNotes, setFrontAxleNotes] = useState('');
  const [steeringItems, setSteeringItems] = useState<Record<string, string>>({
    steeringWheel: '', pump: '', rack: '', column: '', alignment: '',
  });
  const [steeringNotes, setSteeringNotes] = useState('');
  const [shocksData, setShocksData] = useState<Record<string, string>>({
    frontLeft: '', frontRight: '', rearLeft: '', rearRight: '',
  });
  const [shocksNotes, setShocksNotes] = useState('');
  const [bodyNotes, setBodyNotes] = useState('');
  const [bodyTags, setBodyTags] = useState<string[]>([]);
  const [batteryStatus, setBatteryStatus] = useState('original');
  const [batteryDate, setBatteryDate] = useState('');

  // Step 6: Fluids, Interior, Windows
  const [fluids, setFluids] = useState<FluidStatus>({ brakeFluid: '', engineOil: '', coolant: '' });
  const [fluidsNotes, setFluidsNotes] = useState('');
  const [interiorAcCold, setInteriorAcCold] = useState('');
  const [interiorAcHot, setInteriorAcHot] = useState('');
  const [interiorAudio, setInteriorAudio] = useState('');
  const [interiorNotes, setInteriorNotes] = useState('');
  const [windows, setWindows] = useState<WindowStatus>({ frontLeft: '', frontRight: '', rearLeft: '', rearRight: '' });
  const [windowsNotes, setWindowsNotes] = useState('');

  // Step 7: Engine, Gearbox, Brakes, Undercar
  const [engineIssuesList, setEngineIssuesList] = useState<string[]>([]);
  const [engineNotes, setEngineNotes] = useState('');
  const [gearboxIssuesList, setGearboxIssuesList] = useState<string[]>([]);
  const [gearboxNotes, setGearboxNotes] = useState('');
  const [brakeSystem, setBrakeSystem] = useState<BrakeSystem>({ frontDiscs: 90, rearDiscs: 90, frontPads: 50, rearPads: 50 });
  const [brakeNotes, setBrakeNotes] = useState('');
  const [undercarNotes, setUndercarNotes] = useState('');
  const [undercarMedia, setUndercarMedia] = useState<Array<{ type: 'video' | 'image'; name: string; url: string }>>([]);

  // Step 8: Summary, Recommendations, Signature
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([{ text: '', urgency: 'בשבועות הקרובים', estimatedCost: '' }]);
  const [notesUndercar, setNotesUndercar] = useState('');
  const [notesEngine, setNotesEngine] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerIdNumber, setCustomerIdNumber] = useState('');

  // Common for non-full types: vehicle photo + invoice
  const [vehiclePhoto, setVehiclePhoto] = useState('');
  const [invoicePhoto, setInvoicePhoto] = useState('');

  // Pre-test checklist (הכנה לטסט) - each item has checked + notes
  const [preTestChecklist, setPreTestChecklist] = useState<Record<string, boolean>>({
    tires: false, lights: false, brakes: false, mirrors: false, wipers: false,
    horn: false, seatbelts: false, exhaust: false, steering: false, suspension: false,
    fluids: false, battery: false, handbrake: false, speedometer: false, windows: false,
  });
  const [preTestItemNotes, setPreTestItemNotes] = useState<Record<string, string>>({});
  const [expandedChecklistItem, setExpandedChecklistItem] = useState<string | null>(null);
  const [preTestNotes, setPreTestNotes] = useState('');
  const [preTestWorkItems, setPreTestWorkItems] = useState<Array<{item: string; action: string; notes: string; cost: number | string}>>([]);

  // Service form (טיפול תקופתי)
  const [serviceItems, setServiceItems] = useState<string[]>([]);
  const [serviceNotes, setServiceNotes] = useState('');
  const [serviceRecommendations, setServiceRecommendations] = useState('');
  const [servicePhotos, setServicePhotos] = useState<string[]>([]);

  // Troubleshoot form (תיקון/אבחון תקלה)
  const [troubleshootProblem, setTroubleshootProblem] = useState('');
  const [troubleshootDiagnosis, setTroubleshootDiagnosis] = useState('');
  const [troubleshootFix, setTroubleshootFix] = useState('');
  const [troubleshootParts, setTroubleshootParts] = useState('');
  const [troubleshootNotes, setTroubleshootNotes] = useState('');

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  useEffect(() => { loadVehicles(); }, []);

  // Auto-load appointment data when coming from an appointment
  useEffect(() => {
    if (!appointmentId) return;
    const loadAppointmentData = async () => {
      try {
        const res = await fetch(`/api/garage/appointments/${appointmentId}`);
        if (res.ok) {
          const data = await res.json();
          const apt = data.appointment;
          if (apt) {
            // Auto-fill customer name
            if (apt.user?.fullName) setCustomerName(apt.user.fullName);
            // Auto-select vehicle if possible
            if (apt.vehicle?.id) setSelectedVehicleId(apt.vehicle.id);
            // Map service type to inspection type
            const serviceToInspection: Record<string, string> = {
              inspection: 'full',
              test_prep: 'pre_test',
              repair: 'troubleshoot',
              maintenance: 'periodic',
            };
            if (apt.serviceType && serviceToInspection[apt.serviceType]) {
              setInspectionType(serviceToInspection[apt.serviceType]);
            }
            // Auto-fill mileage if available
            if (apt.vehicle?.mileage) setMileage(String(apt.vehicle.mileage));
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load appointment data:', err);
        }
      }
    };
    loadAppointmentData();
  }, [appointmentId]);

  const loadVehicles = async () => {
    try {
      setVehiclesLoading(true);
      // Try garage vehicles endpoint first, fallback to regular
      const res = await fetch('/api/garage/vehicles');
      if (res.ok) {
        const data = await res.json();
        const vList = data.vehicles || [];
        setVehicles(vList);

        // Auto-select from URL params
        const urlVehicleId = searchParams.get('vehicleId');
        if (urlVehicleId && vList.length > 0) {
          // Try to match by ID or license plate
          const match = vList.find((v: GarageVehicle) =>
            v.id === urlVehicleId || v.licensePlate === urlVehicleId
          );
          if (match) setSelectedVehicleId(match.id);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
    }
    finally { setVehiclesLoading(false); }
  };

  // Handle camera scan for license plate / registration
  const handleScanPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setScanPreview(base64);
        setScanLoading(true);
        try {
          // Send to AI OCR endpoint
          const res = await fetch('/api/garage/scan-vehicle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.licensePlate) setManualPlate(data.licensePlate);
            if (data.manufacturer) setManualManufacturer(data.manufacturer);
            if (data.model) setManualModel(data.model);
            if (data.year) setManualYear(data.year);
            if (data.color) setManualColor(data.color);
            setVehicleMode('manual');
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Scan error:', err);
          }
        } finally {
          setScanLoading(false);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Check if manual entry is valid
  const isManualVehicleValid = manualPlate.trim().length >= 5;

  // Lookup vehicle from Ministry of Transport
  const lookupVehicle = async (plate: string) => {
    const clean = plate.replace(/[-\s]/g, '');
    if (clean.length < 5) return;
    setLookupLoading(true);
    setLookupError('');
    setLookupDone(false);
    try {
      const res = await fetch(`/api/vehicles/lookup?plate=${clean}`);
      if (res.ok) {
        const data = await res.json();
        const v = data.vehicle;
        if (v) {
          if (v.manufacturer) setManualManufacturer(v.manufacturer);
          if (v.model) setManualModel(v.model);
          if (v.year) setManualYear(String(v.year));
          if (v.color) setManualColor(v.color);
          if (v.engineModel) setEngineNumber(v.engineModel);
          setLookupDone(true);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setLookupError(err.error || 'רכב לא נמצא');
      }
    } catch {
      setLookupError('שגיאה בחיפוש. נסה שוב.');
    } finally {
      setLookupLoading(false);
    }
  };

  // Debounced auto-lookup when plate changes
  useEffect(() => {
    const clean = manualPlate.replace(/[-\s]/g, '');
    if (clean.length >= 7 && vehicleMode === 'manual' && !lookupDone) {
      const timer = setTimeout(() => lookupVehicle(clean), 600);
      return () => clearTimeout(timer);
    }
  }, [manualPlate, vehicleMode]);

  // Photo upload handler
  const handlePhotoUpload = (collection: 'exterior' | 'interior', key: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (collection === 'exterior') {
          setExteriorPhotos(prev => ({ ...prev, [key]: base64 }));
        } else {
          setInteriorPhotos(prev => ({ ...prev, [key]: base64 }));
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Signature: resize canvas to match displayed size
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const displayWidth = parent.clientWidth;
      const displayHeight = Math.round(displayWidth * 0.25);
      // Set both the CSS size and the internal canvas size to the SAME value
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Get correct coordinates from canvas events
  const getCanvasPos = (canvas: HTMLCanvasElement, e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Signature handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPos(canvas, e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setSignatureData('');
    }
  };

  // Calculate overall score
  const calculateOverallScore = (): number => {
    const allStatuses: string[] = [];

    // Tires
    Object.values(tires).forEach(s => { if (s) allStatuses.push(s); });
    // Lights
    Object.values(lights).forEach(s => { if (s) allStatuses.push(s); });
    // Shocks
    Object.values(shocksData).forEach(s => { if (s) allStatuses.push(s); });
    // Fluids
    Object.values(fluids).forEach(s => { if (s) allStatuses.push(s); });
    // Windows
    Object.values(windows).forEach(s => { if (s) allStatuses.push(s); });
    // Front Axle
    Object.values(frontAxleItems).forEach(s => { if (s) allStatuses.push(s); });
    // Steering
    Object.values(steeringItems).forEach(s => { if (s) allStatuses.push(s); });
    // Others
    [interiorAcCold, interiorAcHot, interiorAudio].forEach(s => { if (s) allStatuses.push(s); });

    if (allStatuses.length === 0) return 0;

    const scoreMap: Record<string, number> = { 'new': 100, 'ok': 100, 'worn': 60, 'warning': 60, 'low': 50, 'sweating': 50, 'dirty': 40, 'leaking': 40, 'dry': 30, 'not_ok': 20, 'replace': 20, 'critical': 20, 'failed': 20 };
    const score = allStatuses.reduce((sum, s) => sum + (scoreMap[s] ?? 50), 0);
    return Math.round(score / allStatuses.length);
  };

  // Build summary data for quick view
  const getSectionSummary = () => {
    const sections = [
      { label: 'צמיגים', status: getMajorityStatus(Object.values(tires)) },
      { label: 'אורות', status: getMajorityStatus(Object.values(lights)) },
      { label: 'סרן קדמי', status: getMajorityStatus(Object.values(frontAxleItems)) },
      { label: 'היגוי', status: getMajorityStatus(Object.values(steeringItems)) },
      { label: 'בולמים', status: getMajorityStatus(Object.values(shocksData)) },
      { label: 'מרכב', status: bodyTags.length > 0 ? (bodyTags.some(t => t.includes('תאונה') || t.includes('מעוך') || t.includes('חלודה')) ? 'critical' : 'warning') : 'ok' },
      { label: 'נוזלים', status: getMajorityStatus(Object.values(fluids)) },
      { label: 'חלונות', status: getMajorityStatus(Object.values(windows)) },
    ];
    return sections;
  };

  const getMajorityStatus = (statuses: string[]) => {
    const filtered = statuses.filter(s => s);
    if (filtered.length === 0) return '';
    // Map tire-specific statuses to severity levels for summary
    if (filtered.some(s => s === 'critical' || s === 'failed' || s === 'not_ok' || s === 'replace')) return 'critical';
    if (filtered.some(s => s === 'warning' || s === 'dry' || s === 'worn' || s === 'sweating' || s === 'leaking' || s === 'low' || s === 'dirty')) return 'warning';
    return 'ok';
  };

  // Submit
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      if (!selectedVehicleId && !isManualVehicleValid) { setError('יש לבחור רכב או להזין מספר רישוי'); return; }

      // Base payload (common to all types)
      const basePayload: Record<string, unknown> = {
        vehicleId: selectedVehicleId || undefined,
        appointmentId: appointmentId || undefined,
        manualVehicle: !selectedVehicleId && isManualVehicleValid ? {
          licensePlate: manualPlate.trim(),
          manufacturer: manualManufacturer.trim() || undefined,
          model: manualModel.trim() || undefined,
          year: manualYear ? parseInt(manualYear) : undefined,
          color: manualColor.trim() || undefined,
        } : undefined,
        inspectionType,
        mechanicName: mechanicName || undefined,
        mileage: mileage ? parseInt(mileage) : undefined,
      };

      let payload: Record<string, unknown>;

      if (inspectionType === 'full') {
        payload = {
          ...basePayload,
          engineNumber: engineNumber || undefined,
          engineVerified,
          overallScore: calculateOverallScore(),
          exteriorPhotos: Object.keys(exteriorPhotos).length > 0 ? exteriorPhotos : undefined,
          interiorPhotos: Object.keys(interiorPhotos).length > 0 ? interiorPhotos : undefined,
          tiresData: tires,
          tiresNotes: tiresNotes || undefined,
          lightsData: lights,
          lightsNotes: lightsNotes || undefined,
          frontAxle: { items: frontAxleItems, notes: frontAxleNotes },
          steeringData: { items: steeringItems, notes: steeringNotes },
          shocksData: { items: shocksData, notes: shocksNotes },
          bodyData: { tags: bodyTags, notes: bodyNotes },
          batteryData: { status: batteryStatus, date: batteryDate || undefined },
          fluidsData: fluids,
          fluidsNotes: fluidsNotes || undefined,
          interiorSystems: { acCold: interiorAcCold, acHot: interiorAcHot, audio: interiorAudio, notes: interiorNotes },
          windowsData: windows,
          windowsNotes: windowsNotes || undefined,
          engineIssues: { issues: engineIssuesList, notes: engineNotes },
          gearboxIssues: { issues: gearboxIssuesList, notes: gearboxNotes },
          brakingSystem: brakeSystem,
          brakeNotes: brakeNotes || undefined,
          summary: summary || undefined,
          recommendations: recommendations.filter(r => r.text.trim()),
          notes: { undercarriage: notesUndercar || undercarNotes, engine: notesEngine, general: summary },
          // Customer signature removed - customer signs via app after receiving the report
        };
      } else if (inspectionType === 'pre_test') {
        const passedCount = Object.values(preTestChecklist).filter(v => v).length;
        const totalCount = Object.keys(preTestChecklist).length;
        const workCount = preTestWorkItems.filter(w => w.item.trim()).length;
        payload = {
          ...basePayload,
          vehiclePhoto: vehiclePhoto || undefined,
          invoicePhoto: invoicePhoto || undefined,
          preTestChecklist,
          preTestItemNotes: Object.keys(preTestItemNotes).filter(k => preTestItemNotes[k]?.trim()).length > 0 ? preTestItemNotes : undefined,
          preTestNotes: preTestNotes || undefined,
          workPerformed: preTestWorkItems.filter(w => w.item.trim()).map(w => ({
            item: w.item,
            action: w.action,
            notes: w.notes || undefined,
            cost: w.cost ? Number(w.cost) : undefined,
          })),
          summary: `הכנה לטסט - ${passedCount}/${totalCount} תקין${workCount > 0 ? ` | ${workCount} עבודות בוצעו` : ''}`,
          overallScore: Math.round((passedCount / totalCount) * 100),
        };
      } else if (inspectionType === 'periodic') {
        payload = {
          ...basePayload,
          vehiclePhoto: vehiclePhoto || undefined,
          invoicePhoto: invoicePhoto || undefined,
          serviceItems,
          serviceNotes: serviceNotes || undefined,
          serviceRecommendations: serviceRecommendations || undefined,
          servicePhotos: servicePhotos.length > 0 ? servicePhotos : undefined,
          summary: `טיפול תקופתי - ${serviceItems.length} פעולות בוצעו`,
        };
      } else if (inspectionType === 'troubleshoot') {
        payload = {
          ...basePayload,
          vehiclePhoto: vehiclePhoto || undefined,
          invoicePhoto: invoicePhoto || undefined,
          troubleshootData: {
            problem: troubleshootProblem || undefined,
            diagnosis: troubleshootDiagnosis || undefined,
            fix: troubleshootFix || undefined,
            parts: troubleshootParts || undefined,
            notes: troubleshootNotes || undefined,
          },
          summary: troubleshootProblem ? `תיקון/אבחון: ${troubleshootProblem.substring(0, 100)}` : 'תיקון/אבחון תקלה',
        };
      } else {
        payload = basePayload;
      }

      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'שגיאה בשמירת הבדיקה');
        return;
      }

      const data = await res.json();
      setSuccessId(data.inspection.id);
      setSuccessModal(true);
    } catch (err) {
      setError('שגיאה בשמירת הבדיקה');
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
    } finally { setLoading(false); }
  };


  // Send inspection link to customer for remote signature via WhatsApp
  const handleSendForSignature = async () => {
    if (!successId) return;
    try {
      // Update status to awaiting_signature
      await fetch(`/api/inspections/${successId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'awaiting_signature' }),
      });
      // Open WhatsApp with inspection link
      const url = `${window.location.origin}/inspection/${successId}`;
      const text = `שלום, דוח הבדיקה שלך מוכן. אנא חתום לאישור קבלת הדוח:\n${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } catch {}
  };

  const steps = [
    { num: 1, label: 'רכב', icon: Car },
    { num: 2, label: 'חוץ', icon: Camera },
    { num: 3, label: 'פנים', icon: Eye },
    { num: 4, label: 'צמיגים ואורות', icon: Lightbulb },
    { num: 5, label: 'מכני', icon: Wrench },
    { num: 6, label: 'נוזלים ופנים', icon: Droplets },
    { num: 7, label: 'מנוע ובלמים', icon: Settings },
    { num: 8, label: 'סיכום וחתימה', icon: PenLine },
  ];

  const overallScore = calculateOverallScore();
  const scoreLabel = overallScore >= 80 ? 'תקין' : overallScore >= 50 ? 'דורש תשומת לב' : overallScore > 0 ? 'לא תקין' : '';
  const scoreColor = overallScore >= 80 ? 'text-green-600' : overallScore >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-6 pt-12 lg:pt-0 pb-24 px-2 sm:px-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#fef7ed] rounded-lg border-2 border-[#1e3a5f] flex items-center justify-center shadow-sm">
          <Shield size={20} className="text-[#1e3a5f]" />
        </div>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-[#1e3a5f]">
            {step === 0 ? 'פעולה חדשה' : inspectionTypes.find(t => t.value === inspectionType)?.label || 'בדיקה חדשה'}
          </h1>
          <p className="text-sm text-gray-500">ביצוע בדיקה ומילוי ממצאים</p>
        </div>
      </div>

      {/* Regulatory Disclaimer Banner */}
      {inspectionType === 'full' && step > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5">
          <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>\u05EA\u05D6\u05DB\u05D5\u05E8\u05EA:</strong> \u05D1\u05D3\u05D9\u05E7\u05D4 \u05D6\u05D5 \u05DE\u05D4\u05D5\u05D5\u05D4 \u05D7\u05D5\u05D5\u05EA \u05D3\u05E2\u05EA \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9\u05EA \u05D1\u05DC\u05D1\u05D3 \u05D5\u05D0\u05D9\u05E0\u05D4 \u05DE\u05D4\u05D5\u05D5\u05D4 \u05D1\u05D3\u05D9\u05E7\u05EA \u05DE\u05DB\u05D5\u05DF \u05E8\u05D9\u05E9\u05D5\u05D9 \u05DE\u05D5\u05E8\u05E9\u05D4. \u05D0\u05D9\u05DF \u05DC\u05D4 \u05EA\u05D5\u05E7\u05E3 \u05DE\u05E9\u05E4\u05D8\u05D9 \u05DE\u05D7\u05D9\u05D9\u05D1 \u05D5\u05D4\u05D9\u05D0 \u05D0\u05D9\u05E0\u05D4 \u05DE\u05D7\u05DC\u05D9\u05E4\u05D4 \u05D1\u05D3\u05D9\u05E7\u05D4 \u05D4\u05E0\u05D3\u05E8\u05E9\u05EA \u05E2\u05DC \u05E4\u05D9 \u05D7\u05D5\u05E7. \u05D9\u05E9 \u05DC\u05D4\u05D1\u05D4\u05D9\u05E8 \u05D6\u05D0\u05EA \u05DC\u05DC\u05E7\u05D5\u05D7.
          </p>
        </div>
      )}

      {/* Score Bar - only for full inspection */}
      {inspectionType === 'full' && overallScore > 0 && step > 0 && (
        <div className="bg-slate-800 rounded-xl p-3 sm:p-4 text-center text-white">
          <div className="text-xs sm:text-sm opacity-80">ציון כללי</div>
          <div className={`text-3xl sm:text-4xl font-bold ${overallScore >= 80 ? 'text-green-400' : overallScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{overallScore}</div>
          <div className="text-xs sm:text-sm opacity-80">{scoreLabel}</div>
        </div>
      )}

      {/* Progress - only for full inspection after type selection */}
      {inspectionType === 'full' && step > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={s.num}
                onClick={() => setStep(s.num as Step)}
                className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0 ${
                  step === s.num ? 'bg-teal-600 text-white shadow-md' : step > s.num ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}

      {/* ====== STEP 0: Choose Action Type ====== */}
      {step === 0 && (
        <Card>
          <CardTitle icon={<Shield className="text-teal-600" />}>בחר סוג פעולה</CardTitle>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4">
            {inspectionTypes.map(t => (
              <button key={t.value} onClick={() => { setInspectionType(t.value); setStep(1); }}
                className="p-4 sm:p-5 rounded-xl border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50 active:bg-teal-50 text-xs sm:text-sm font-bold text-center transition">
                {t.value === 'full' && <Car size={24} className="mx-auto mb-1.5 sm:mb-2 text-teal-600" />}
                {t.value === 'pre_test' && <Search size={24} className="mx-auto mb-1.5 sm:mb-2 text-blue-600" />}
                {t.value === 'troubleshoot' && <Wrench size={24} className="mx-auto mb-1.5 sm:mb-2 text-orange-600" />}
                {t.value === 'periodic' && <Settings size={24} className="mx-auto mb-1.5 sm:mb-2 text-teal-600" />}
                {t.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ====== STEP 1: Vehicle & Type ====== */}
      {step === 1 && (
        <>
          <Card>
            <CardTitle icon={<Car className="text-teal-600" />}>פרטי רכב ובדיקה</CardTitle>
            <div className="space-y-4 mt-4">

              {/* Vehicle Mode Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">בחר רכב</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button onClick={() => setVehicleMode('select')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium transition border-2 ${
                      vehicleMode === 'select' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    <Search size={14} /> בחר מרשימה
                  </button>
                  <button onClick={() => setVehicleMode('manual')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium transition border-2 ${
                      vehicleMode === 'manual' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    <Keyboard size={14} /> הזנה ידנית
                  </button>
                </div>

                {/* Mode: Select from list */}
                {vehicleMode === 'select' && (
                  <>
                    {vehiclesLoading ? (
                      <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-teal-600" /></div>
                    ) : vehicles.length > 0 ? (
                      <select value={selectedVehicleId} onChange={e => { setSelectedVehicleId(e.target.value); setManualPlate(''); }}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-400">
                        <option value="">-- בחר רכב --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.nickname || `${v.manufacturer || ''} ${v.model || ''}`} ({v.licensePlate})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-2">אין רכבים ברשימה</p>
                        <button onClick={() => setVehicleMode('manual')}
                          className="text-teal-600 text-sm font-medium hover:underline">הזן מספר רכב ידנית</button>
                      </div>
                    )}
                    {vehicles.length > 0 && (
                      <button onClick={() => setVehicleMode('manual')}
                        className="text-sm text-teal-600 hover:underline mt-2 flex items-center gap-1">
                        <Plus size={12} /> רכב לא ברשימה? הזן ידנית
                      </button>
                    )}
                  </>
                )}

                {/* Mode: Manual entry */}
                {vehicleMode === 'manual' && (
                  <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl border border-blue-200">
                    {scanPreview && (
                      <div className="flex items-center gap-3 mb-2">
                        <img src={scanPreview} alt="סריקה" className="w-16 h-12 object-cover rounded-lg border" />
                        <div className="flex-1">
                          {scanLoading ? (
                            <div className="flex items-center gap-2 text-sm text-teal-600">
                              <Loader2 size={14} className="animate-spin" /> מזהה פרטי רכב...
                            </div>
                          ) : (
                            <p className="text-xs text-green-600 font-medium">✓ זוהו פרטים מהתמונה</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">מספר רישוי *</label>
                      <div className="relative">
                        <input type="text" value={manualPlate}
                          onChange={e => { setManualPlate(e.target.value); setLookupDone(false); setLookupError(''); }}
                          placeholder="למשל: 7198738"
                          className={`w-full rounded-xl border px-3 py-2.5 text-lg font-mono text-center tracking-widest focus:ring-2 focus:ring-teal-400 ${
                            lookupDone ? 'border-green-400 bg-green-50/50' : lookupError ? 'border-red-300' : 'border-gray-300'
                          }`}
                          dir="ltr" />
                        <div className="absolute start-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {lookupLoading ? (
                            <Loader2 size={18} className="animate-spin text-teal-600" />
                          ) : manualPlate.replace(/[-\s]/g, '').length >= 5 && !lookupDone ? (
                            <button type="button" onClick={() => lookupVehicle(manualPlate)}
                              className="flex items-center gap-1 px-2 py-1 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition">
                              <Search size={12} /> שלוף
                            </button>
                          ) : lookupDone ? (
                            <Check size={18} className="text-green-500" />
                          ) : null}
                        </div>
                      </div>
                      {lookupLoading && (
                        <p className="text-xs text-teal-600 mt-1 text-center animate-pulse">שולף נתונים ממשרד התחבורה...</p>
                      )}
                      {lookupDone && (
                        <p className="text-xs text-green-600 mt-1 text-center font-medium">✓ פרטי הרכב נשלפו בהצלחה ממשרד התחבורה</p>
                      )}
                      {lookupError && (
                        <p className="text-xs text-red-500 mt-1 text-center">{lookupError}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">יצרן</label>
                        <input type="text" value={manualManufacturer} onChange={e => setManualManufacturer(e.target.value)}
                          placeholder="למשל: KIA" className={`w-full rounded-lg border px-3 py-2 text-sm ${lookupDone && manualManufacturer ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`} dir="rtl" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">דגם</label>
                        <input type="text" value={manualModel} onChange={e => setManualModel(e.target.value)}
                          placeholder="למשל: SPORTAGE" className={`w-full rounded-lg border px-3 py-2 text-sm ${lookupDone && manualModel ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`} dir="rtl" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">שנה</label>
                        <input type="text" value={manualYear} onChange={e => setManualYear(e.target.value)}
                          placeholder="2024" className={`w-full rounded-lg border px-3 py-2 text-sm ${lookupDone && manualYear ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`} dir="ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">צבע</label>
                        <input type="text" value={manualColor} onChange={e => setManualColor(e.target.value)}
                          placeholder="לבן" className={`w-full rounded-lg border px-3 py-2 text-sm ${lookupDone && manualColor ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`} dir="rtl" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setVehicleMode('scan'); handleScanPhoto(); }}
                        className="flex items-center gap-1 px-3 py-2 bg-white rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-[#fef7ed]/50 transition">
                        <Camera size={14} /> צלם רישיון רכב
                      </button>
                      <button onClick={() => { setVehicleMode('select'); setManualPlate(''); setScanPreview(''); }}
                        className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:underline">
                        חזור לבחירה מרשימה
                      </button>
                    </div>
                  </div>
                )}

                {/* Mode: Scan */}
                {vehicleMode === 'scan' && (
                  <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl">
                    {scanLoading ? (
                      <>
                        <Loader2 size={32} className="animate-spin text-teal-600 mb-3" />
                        <p className="text-sm text-gray-600">מזהה פרטי רכב מהתמונה...</p>
                        <p className="text-xs text-gray-400 mt-1">עיבוד AI</p>
                      </>
                    ) : scanPreview ? (
                      <>
                        <img src={scanPreview} alt="scan" className="w-40 h-28 object-cover rounded-lg mb-3 border" />
                        <p className="text-sm text-gray-600 mb-2">לא זוהו פרטים. הזן ידנית:</p>
                        <button onClick={() => setVehicleMode('manual')}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition">
                          הזנה ידנית
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-4">
                          <Camera size={28} className="text-teal-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">צלם לוחית רישוי או רישיון רכב</p>
                        <p className="text-xs text-gray-400 mb-4">הפרטים ימולאו אוטומטית באמצעות AI</p>
                        <div className="flex gap-3">
                          <button onClick={handleScanPhoto}
                            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition">
                            <Camera size={16} /> צלם תמונה
                          </button>
                          <button onClick={() => setVehicleMode('manual')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-[#fef7ed]/50 transition">
                            <Keyboard size={16} /> הזנה ידנית
                          </button>
                        </div>
                        <button onClick={() => setVehicleMode('select')}
                          className="text-xs text-gray-400 hover:underline mt-3">חזור לבחירה מרשימה</button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="קילומטראז'" placeholder="140,000" value={mileage} onChange={e => setMileage(e.target.value)} />
                <Input label="שם מכניק" placeholder="שם המכניק" value={mechanicName} onChange={e => setMechanicName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="מספר מנוע" placeholder="Hw523h" value={engineNumber} onChange={e => setEngineNumber(e.target.value)} />
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={engineVerified} onChange={e => setEngineVerified(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded" />
                    <span>אומת ע"י מכונאי</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ====== STEP 2: Exterior Photos ====== */}
      {inspectionType === 'full' && step === 2 && (
        <Card>
          <CardTitle icon={<Camera className="text-teal-600" />}>תמונות חוץ</CardTitle>
          <p className="text-sm text-gray-500 mt-1 mb-4">צלם את הרכב מכל הצדדים</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'front', label: 'חזית' },
              { key: 'rear', label: 'אחורי' },
              { key: 'right', label: 'ימין' },
              { key: 'left', label: 'שמאל' },
              { key: 'roof', label: 'גג' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => handlePhotoUpload('exterior', key)}
                className="relative aspect-[4/3] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-400 transition flex flex-col items-center justify-center overflow-hidden">
                {exteriorPhotos[key] ? (
                  <img src={exteriorPhotos[key]} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                ) : (
                  <Camera size={20} className="text-gray-400 mb-1" />
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">{label}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ====== STEP 3: Interior Photos ====== */}
      {inspectionType === 'full' && step === 3 && (
        <Card>
          <CardTitle icon={<Eye className="text-teal-600" />}>תמונות פנים</CardTitle>
          <p className="text-sm text-gray-500 mt-1 mb-4">צלם את פנים הרכב</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'frontSeats', label: 'מושבים קדמיים' },
              { key: 'rearSeats', label: 'מושבים אחוריים' },
              { key: 'dashboard', label: 'לוח מחוונים' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => handlePhotoUpload('interior', key)}
                className="relative aspect-[4/3] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-400 transition flex flex-col items-center justify-center overflow-hidden">
                {interiorPhotos[key] ? (
                  <img src={interiorPhotos[key]} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                ) : (
                  <Camera size={20} className="text-gray-400 mb-1" />
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">{label}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ====== STEP 4: Tires & Lights ====== */}
      {inspectionType === 'full' && step === 4 && (
        <>
          <Card>
            <CardTitle icon={<CircleDot className="text-teal-600" />}>מצב צמיגים</CardTitle>
            <div className="space-y-2 mt-3">
              <TireStatusSelect label="קדמי שמאל" value={tires.frontLeft} onChange={v => setTires(p => ({ ...p, frontLeft: v }))} />
              <TireStatusSelect label="קדמי ימין" value={tires.frontRight} onChange={v => setTires(p => ({ ...p, frontRight: v }))} />
              <TireStatusSelect label="אחורי שמאל" value={tires.rearLeft} onChange={v => setTires(p => ({ ...p, rearLeft: v }))} />
              <TireStatusSelect label="אחורי ימין" value={tires.rearRight} onChange={v => setTires(p => ({ ...p, rearRight: v }))} />
              <VoiceInput value={tiresNotes} onChange={setTiresNotes} placeholder="הערות צמיגים..." rows={2} />
            </div>
          </Card>
          <Card>
            <CardTitle icon={<Lightbulb className="text-teal-600" />}>בדיקת אורות ומחוונים</CardTitle>
            <div className="space-y-2 mt-3">
              {[
                { key: 'brakes', label: 'בלמים' },
                { key: 'reverse', label: 'אור רוורס' },
                { key: 'fog', label: 'ערפל' },
                { key: 'headlights', label: 'אור דרך' },
                { key: 'frontSignal', label: 'איתות קדמי' },
                { key: 'rearSignal', label: 'איתות אחורי' },
                { key: 'highBeam', label: 'אור גבוה' },
                { key: 'plate', label: 'לוחית' },
              ].map(({ key, label }) => (
                <LightStatusSelect key={key} label={label}
                  value={(lights as any)[key]}
                  onChange={v => setLights(p => ({ ...p, [key]: v }))} />
              ))}
              <VoiceInput value={lightsNotes} onChange={setLightsNotes} placeholder="הערות אורות..." rows={2} />
            </div>
          </Card>
        </>
      )}

      {/* ====== STEP 5: Mechanical Systems ====== */}
      {inspectionType === 'full' && step === 5 && (
        <>
          <Card>
            <CardTitle icon={<Settings className="text-teal-600" />}>סרן קדמי</CardTitle>
            <div className="space-y-2 mt-3">
              {[
                { key: 'stabilizerBars', label: 'מוטות מייצב' },
                { key: 'controlArms', label: 'זרועות' },
                { key: 'bushings', label: 'גומיות' },
                { key: 'wheelBearings', label: 'מיסבי גלגל' },
              ].map(({ key, label }) => (
                <LightStatusSelect key={key} label={label}
                  value={frontAxleItems[key] || ''}
                  onChange={v => setFrontAxleItems(p => ({ ...p, [key]: v }))} />
              ))}
              <VoiceInput value={frontAxleNotes} onChange={setFrontAxleNotes} placeholder="הערות סרן..." rows={2} />
            </div>
          </Card>
          <Card>
            <CardTitle icon={<Gauge className="text-teal-600" />}>מערכת היגוי</CardTitle>
            <div className="space-y-2 mt-3">
              {[
                { key: 'steeringWheel', label: 'הגה (משחק)' },
                { key: 'pump', label: 'משאבת הגה' },
                { key: 'rack', label: 'תיבת הגה' },
                { key: 'column', label: 'עמוד הגה' },
                { key: 'alignment', label: 'כיוון (אלינמנט)' },
              ].map(({ key, label }) => (
                <LightStatusSelect key={key} label={label}
                  value={steeringItems[key] || ''}
                  onChange={v => setSteeringItems(p => ({ ...p, [key]: v }))} />
              ))}
              <VoiceInput value={steeringNotes} onChange={setSteeringNotes} placeholder="הערות היגוי..." rows={2} />
            </div>
          </Card>
          <Card>
            <CardTitle>מצב בולמים</CardTitle>
            <div className="space-y-2 mt-3">
              <ShockStatusSelect label="קדמי שמאל" value={shocksData.frontLeft} onChange={v => setShocksData(p => ({ ...p, frontLeft: v }))} />
              <ShockStatusSelect label="קדמי ימין" value={shocksData.frontRight} onChange={v => setShocksData(p => ({ ...p, frontRight: v }))} />
              <ShockStatusSelect label="אחורי שמאל" value={shocksData.rearLeft} onChange={v => setShocksData(p => ({ ...p, rearLeft: v }))} />
              <ShockStatusSelect label="אחורי ימין" value={shocksData.rearRight} onChange={v => setShocksData(p => ({ ...p, rearRight: v }))} />
              <VoiceInput value={shocksNotes} onChange={setShocksNotes} placeholder="הערות בולמים..." rows={2} />
            </div>
          </Card>
          <Card>
            <CardTitle>שילדה ומרכב</CardTitle>
            <div className="space-y-3 mt-3">
              <p className="text-xs text-gray-500 text-right">סמן את כל הממצאים הרלוונטיים:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'תקין - ללא ממצאים',
                  'תאונה מלפנים',
                  'תאונה מאחור',
                  'תאונה צד ימין',
                  'תאונה צד שמאל',
                  'פח קדמי מתוקן',
                  'פח קדמי מעוך',
                  'פח אחורי מתוקן',
                  'פח אחורי מעוך',
                  'תיקוני פח וצבע',
                  'הוחלפו חלקי מרכב',
                  'כנף ימין מוחלפת',
                  'כנף שמאל מוחלפת',
                  'דלת מוחלפת',
                  'מכסה מנוע מוחלף',
                  'תא מטען מתוקן',
                  'חלודה בשילדה',
                  'חלודה בתחתית',
                  'ריתוכים',
                  'פגוש קדמי פגום',
                  'פגוש אחורי פגום',
                  'סדק בשמשה',
                  'שלדה עקומה',
                ].map(tag => (
                  <button key={tag} onClick={() => setBodyTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      bodyTags.includes(tag)
                        ? tag === 'תקין - ללא ממצאים' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>{tag}</button>
                ))}
              </div>
              <VoiceInput value={bodyNotes} onChange={setBodyNotes} placeholder="הערות מרכב..." rows={2} />
            </div>
          </Card>
          <Card>
            <CardTitle>מצבר</CardTitle>
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'original', label: 'מקורי' },
                  { value: 'not_visible', label: 'לא ניתן לראות' },
                  { value: 'replaced', label: 'הוחלף' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setBatteryStatus(opt.value)}
                    className={`p-2.5 rounded-xl border-2 text-xs sm:text-sm font-medium text-center transition ${
                      batteryStatus === opt.value ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600'
                    }`}>{opt.label}</button>
                ))}
              </div>
              <div>
                <label className="block text-sm text-gray-600 text-right mb-1">תאריך מצבר</label>
                <input type="date" value={batteryDate} onChange={e => setBatteryDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm" dir="ltr" />
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ====== STEP 6: Fluids, Interior, Windows ====== */}
      {inspectionType === 'full' && step === 6 && (
        <>
          <Card>
            <CardTitle icon={<Droplets className="text-teal-600" />}>נוזלי מנוע</CardTitle>
            <div className="space-y-2 mt-3">
              <FluidStatusSelect label="נוזל בלמים" value={fluids.brakeFluid} onChange={v => setFluids(p => ({ ...p, brakeFluid: v }))} />
              <FluidStatusSelect label="שמן מנוע" value={fluids.engineOil} onChange={v => setFluids(p => ({ ...p, engineOil: v }))} />
              <FluidStatusSelect label="נוזל קירור" value={fluids.coolant} onChange={v => setFluids(p => ({ ...p, coolant: v }))} />
              <VoiceInput value={fluidsNotes} onChange={setFluidsNotes} placeholder="הערות נוזלים..." rows={2} />
            </div>
          </Card>
          <Card>
            <CardTitle icon={<Wind className="text-teal-600" />}>מערכות פנימיות</CardTitle>
            <div className="space-y-2 mt-3">
              <LightStatusSelect label="מזגן - קור" value={interiorAcCold} onChange={setInteriorAcCold} />
              <LightStatusSelect label="מזגן - חום" value={interiorAcHot} onChange={setInteriorAcHot} />
              <LightStatusSelect label="מערכת שמע" value={interiorAudio} onChange={setInteriorAudio} />
              <VoiceInput value={interiorNotes} onChange={setInteriorNotes} placeholder="הערות מערכות פנימיות..." rows={2} />
            </div>
          </Card>
          <Card>
            <CardTitle>חלונות חשמל</CardTitle>
            <div className="space-y-2 mt-3">
              <LightStatusSelect label="אחורי שמאל" value={windows.rearLeft} onChange={v => setWindows(p => ({ ...p, rearLeft: v }))} />
              <LightStatusSelect label="אחורי ימין" value={windows.rearRight} onChange={v => setWindows(p => ({ ...p, rearRight: v }))} />
              <LightStatusSelect label="קדמי שמאל" value={windows.frontLeft} onChange={v => setWindows(p => ({ ...p, frontLeft: v }))} />
              <LightStatusSelect label="קדמי ימין" value={windows.frontRight} onChange={v => setWindows(p => ({ ...p, frontRight: v }))} />
              <VoiceInput value={windowsNotes} onChange={setWindowsNotes} placeholder="הערות חלונות..." rows={2} />
            </div>
          </Card>
        </>
      )}

      {/* ====== STEP 7: Engine, Gearbox, Brakes ====== */}
      {inspectionType === 'full' && step === 7 && (
        <>
          <Card>
            <CardTitle className="text-red-600">בעיות מנוע</CardTitle>
            <div className="space-y-3 mt-3">
              <div className="flex flex-wrap gap-2">
                {[
                  'רעש רצועות', 'דליפת שמן', 'רעש מנוע', 'חימום יתר', 'עשן',
                  'רעידות', 'ירידת כוח', 'נורית CHECK ENGINE', 'בעיית התנעה',
                  'צריכת דלק גבוהה',
                ].map(issue => (
                  <button key={issue} onClick={() => setEngineIssuesList(prev => prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      engineIssuesList.includes(issue) ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>● {issue}</button>
                ))}
              </div>
              <VoiceInput value={engineNotes} onChange={setEngineNotes} placeholder="הערות מנוע..." rows={2} />
            </div>
          </Card>
          <Card>
            <CardTitle className="text-amber-600">בעיות תיבת הילוכים</CardTitle>
            <div className="space-y-3 mt-3">
              <div className="flex flex-wrap gap-2">
                {[
                  'רעש בהעברת הילוכים', 'קושי בהעברת הילוכים', 'הילוך קופץ',
                  'החלקת מצמד', 'מצמד שחוק', 'דליפת שמן תיבה',
                  'רעש דיפרנציאל', 'רעידות', 'נורית תיבת הילוכים',
                  'מצב חירום (Limp Mode)',
                ].map(issue => (
                  <button key={issue} onClick={() => setGearboxIssuesList(prev => prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      gearboxIssuesList.includes(issue) ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>● {issue}</button>
                ))}
              </div>
              <VoiceInput value={gearboxNotes} onChange={setGearboxNotes} placeholder="הערות תיבת הילוכים..." rows={2} />
            </div>
          </Card>
          <Card>
            <CardTitle>מערכת בלימה</CardTitle>
            <div className="space-y-4 mt-3">
              {[
                { key: 'frontDiscs', label: 'צלחות קדמיות' },
                { key: 'rearDiscs', label: 'צלחות אחוריות' },
                { key: 'frontPads', label: 'רפידות קדמיות' },
                { key: 'rearPads', label: 'רפידות אחוריות' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={`font-bold ${(brakeSystem as any)[key] >= 70 ? 'text-green-600' : (brakeSystem as any)[key] >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {(brakeSystem as any)[key]}%
                    </span>
                    <span className="text-gray-600">{label}</span>
                  </div>
                  <input type="range" min="0" max="100" step="5" value={(brakeSystem as any)[key]}
                    onChange={e => setBrakeSystem(p => ({ ...p, [key]: parseInt(e.target.value) }))}
                    className="w-full accent-teal-600" />
                </div>
              ))}
              <VoiceInput value={brakeNotes} onChange={setBrakeNotes} placeholder="הערות בלמים..." rows={2} />
            </div>
          </Card>
          <Card>
            <CardTitle>סרטון / הערות תחתית הרכב</CardTitle>
            <div className="space-y-3 mt-3">
              {/* Upload buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/*';
                    input.capture = 'environment';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      setUndercarMedia(prev => [...prev, { type: 'video', name: file.name, url }]);
                    };
                    input.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition text-sm font-medium"
                >
                  <Video size={18} /> צלם סרטון
                </button>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/*,image/*';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (!files) return;
                      Array.from(files).forEach(file => {
                        const url = URL.createObjectURL(file);
                        const type = file.type.startsWith('video') ? 'video' : 'image';
                        setUndercarMedia(prev => [...prev, { type, name: file.name, url }]);
                      });
                    };
                    input.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 transition text-sm font-medium"
                >
                  <Plus size={18} /> העלה קובץ
                </button>
              </div>

              {/* Media preview */}
              {undercarMedia.length > 0 && (
                <div className="space-y-2">
                  {undercarMedia.map((media, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      {media.type === 'video' ? (
                        <video src={media.url} controls className="w-full max-h-48 object-contain bg-black" />
                      ) : (
                        <img src={media.url} alt={media.name} className="w-full max-h-48 object-contain" />
                      )}
                      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-t border-gray-100">
                        <span className="text-xs text-gray-500 truncate">{media.name}</span>
                        <button
                          onClick={() => setUndercarMedia(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-600 transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <VoiceInput value={undercarNotes} onChange={setUndercarNotes} placeholder="תחתית הרכב נקיה, אין נזילות..." rows={3} />
            </div>
          </Card>
        </>
      )}

      {/* ====== STEP 8: Summary, Recommendations, Signature ====== */}
      {inspectionType === 'full' && step === 8 && (
        <>
          {/* Quick Summary */}
          <Card>
            <CardTitle>סיכום מהיר</CardTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {getSectionSummary().map(s => (
                <div key={s.label} className={`p-2 rounded-lg text-center text-xs font-medium ${
                  s.status === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' :
                  s.status === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  s.status === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  {s.status === 'ok' ? '✓' : s.status === 'warning' ? '!' : s.status === 'critical' ? '✕' : '—'} {s.label}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>הערות</CardTitle>
            <div className="space-y-3 mt-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">תחתית הרכב</label>
                <VoiceInput value={notesUndercar} onChange={setNotesUndercar} placeholder="תחתית הרכב..." rows={2} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">מנוע</label>
                <VoiceInput value={notesEngine} onChange={setNotesEngine} placeholder="הערות מנוע..." rows={2} />
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>המלצות לתיקון</CardTitle>
            <div className="space-y-3 mt-3">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 bg-yellow-50 rounded-xl space-y-2 border border-yellow-200">
                  <input type="text" value={rec.text} onChange={e => { const n = [...recommendations]; n[idx].text = e.target.value; setRecommendations(n); }}
                    placeholder="למשל: בלמים בלויים - דורש החלפה" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" dir="rtl" />
                  <div className="flex flex-wrap gap-2">
                    <select value={rec.urgency} onChange={e => { const n = [...recommendations]; n[idx].urgency = e.target.value; setRecommendations(n); }}
                      className="flex-1 min-w-[140px] rounded-lg border border-gray-300 px-2 py-1.5 text-xs">
                      <option>בשבועות הקרובים</option>
                      <option>דחוף - מיידי</option>
                      <option>תוך חודש</option>
                      <option>במהלך הטיפול הבא</option>
                    </select>
                    <input type="text" value={rec.estimatedCost} onChange={e => { const n = [...recommendations]; n[idx].estimatedCost = e.target.value; setRecommendations(n); }}
                      placeholder="עלות: ₪800" className="w-24 sm:w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-xs" dir="rtl" />
                    {recommendations.length > 1 && (
                      <button onClick={() => setRecommendations(recommendations.filter((_, i) => i !== idx))} className="text-red-500 px-2"><X size={14} /></button>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={() => setRecommendations([...recommendations, { text: '', urgency: 'בשבועות הקרובים', estimatedCost: '' }])}
                className="w-full p-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm hover:border-teal-400 transition">+ הוסף המלצה</button>
            </div>
          </Card>

          {/* Regulatory Acknowledgment */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-red-800 font-bold mb-1">הצהרה רגולטורית — יש להקריא ללקוח:</p>
                <p className="text-xs text-red-700 leading-relaxed">
                  &quot;בדיקה זו מהווה חוות דעת מקצועית של המוסך בלבד. היא אינה מהווה בדיקת מכון רישוי מורשה מטעם משרד התחבורה ואין לה תוקף משפטי מחייב. מומלץ לבצע גם בדיקה במכון רישוי מורשה, במיוחד לפני רכישת רכב.&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Customer Signature */}
          <Card>
            <CardTitle icon={<PenLine className="text-teal-600" />}>חתימת לקוח</CardTitle>
            <p className="text-sm text-gray-500 mt-1 mb-3">אשר קבלת הדוח בחתימה דיגיטלית</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="שם מלא" placeholder="שם הלקוח" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                <Input label='מספר ת"ז' placeholder="012345678" value={customerIdNumber} onChange={e => setCustomerIdNumber(e.target.value)} />
              </div>
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                <canvas ref={canvasRef} className="touch-none cursor-crosshair block"
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
              </div>
              <div className="flex gap-2">
                <button onClick={clearSignature} className="text-sm text-red-500 hover:underline">נקה חתימה</button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ====== VEHICLE PHOTO + INVOICE (shared for non-full types) ====== */}
      {inspectionType !== 'full' && step === 2 && (
        <Card>
          <CardTitle icon={<Camera className="text-teal-600" />}>תמונות</CardTitle>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {/* Vehicle front photo */}
            <div>
              <p className="text-xs text-gray-500 text-right mb-2">תמונת רכב מקדימה</p>
              {vehiclePhoto ? (
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                  <img src={vehiclePhoto} alt="רכב" className="w-full h-full object-cover" />
                  <button onClick={() => setVehiclePhoto('')}
                    className="absolute top-1 start-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">✕</button>
                </div>
              ) : (
                <button onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setVehiclePhoto(reader.result as string);
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }} className="aspect-[4/3] w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-teal-400 transition">
                  <Car size={28} className="text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">צלם רכב</span>
                </button>
              )}
            </div>
            {/* Invoice/receipt photo */}
            <div>
              <p className="text-xs text-gray-500 text-right mb-2">חשבונית / קבלה</p>
              {invoicePhoto ? (
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                  <img src={invoicePhoto} alt="חשבונית" className="w-full h-full object-cover" />
                  <button onClick={() => setInvoicePhoto('')}
                    className="absolute top-1 start-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">✕</button>
                </div>
              ) : (
                <button onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file'; input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setInvoicePhoto(reader.result as string);
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }} className="aspect-[4/3] w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-teal-400 transition">
                  <PenLine size={28} className="text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">צלם חשבונית</span>
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ====== PRE-TEST CHECKLIST (הכנה לטסט) ====== */}
      {inspectionType === 'pre_test' && step === 2 && (
        <Card>
          <CardTitle icon={<Search className="text-blue-600" />}>צ'קליסט הכנה לטסט</CardTitle>
          <p className="text-xs text-gray-500 mt-1 mb-3 text-right">סמן V לכל פריט שנבדק ותקין. לחץ על הפריט להוספת הערה.</p>
          <div className="space-y-2 mt-3">
            {[
              { key: 'tires', label: 'צמיגים (מצב + לחץ)' },
              { key: 'lights', label: 'אורות ומחוונים' },
              { key: 'brakes', label: 'בלמים' },
              { key: 'mirrors', label: 'מראות' },
              { key: 'wipers', label: 'מגבים + נוזל' },
              { key: 'horn', label: 'צופר' },
              { key: 'seatbelts', label: 'חגורות בטיחות' },
              { key: 'exhaust', label: 'מערכת פליטה' },
              { key: 'steering', label: 'היגוי (משחק)' },
              { key: 'suspension', label: 'מתלים ובולמים' },
              { key: 'fluids', label: 'נוזלים (שמן, מים, בלמים)' },
              { key: 'battery', label: 'מצבר' },
              { key: 'handbrake', label: 'בלם יד' },
              { key: 'speedometer', label: 'מד מהירות' },
              { key: 'windows', label: 'חלונות ושמשות' },
            ].map(item => (
              <div key={item.key} className="rounded-xl border border-gray-200 overflow-hidden transition-all">
                <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={preTestChecklist[item.key] || false}
                      onChange={e => {
                        e.stopPropagation();
                        setPreTestChecklist(p => ({ ...p, [item.key]: e.target.checked }));
                      }}
                      className="w-5 h-5 text-teal-600 rounded cursor-pointer" />
                    <button
                      type="button"
                      onClick={() => setExpandedChecklistItem(expandedChecklistItem === item.key ? null : item.key)}
                      className={`p-1.5 rounded-lg transition ${
                        expandedChecklistItem === item.key ? 'bg-teal-100 text-teal-600' :
                        preTestItemNotes[item.key] ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-200 text-gray-400 hover:bg-gray-300 hover:text-gray-600'
                      }`}
                      title="הוסף הערה"
                    >
                      <FileText size={14} />
                    </button>
                    {preTestItemNotes[item.key] && expandedChecklistItem !== item.key && (
                      <span className="text-xs text-blue-500 truncate max-w-[120px]">{preTestItemNotes[item.key]}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedChecklistItem(expandedChecklistItem === item.key ? null : item.key)}
                    className="text-sm font-medium text-gray-800 cursor-pointer text-right flex-1 mr-2"
                  >
                    {item.label}
                  </button>
                </div>
                {expandedChecklistItem === item.key && (
                  <div className="p-3 bg-white border-t border-gray-100">
                    <VoiceInput
                      value={preTestItemNotes[item.key] || ''}
                      onChange={(val) => setPreTestItemNotes(prev => ({ ...prev, [item.key]: val }))}
                      placeholder={`הערה ל${item.label}...`}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-600 mb-1 text-right">הערות כלליות</p>
            <VoiceInput value={preTestNotes} onChange={setPreTestNotes} placeholder="הערות נוספות..." rows={3} />
          </div>

          {/* Work performed section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-800 text-right mb-2">עבודות שבוצעו</h3>
            <p className="text-xs text-gray-500 mb-3 text-right">פרט מה תוקן, הוחלף או כוון</p>

            {preTestWorkItems.map((work, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <button onClick={() => setPreTestWorkItems(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  <input value={work.item} onChange={e => {
                    const updated = [...preTestWorkItems];
                    updated[idx].item = e.target.value;
                    setPreTestWorkItems(updated);
                  }} placeholder="שם הפריט / עבודה" className="flex-1 text-sm border-b border-gray-200 pb-1 text-right focus:outline-none focus:border-teal-400" dir="rtl" />
                </div>
                <div className="flex gap-1 flex-wrap mb-2 justify-end">
                  {[
                    { value: 'replaced', label: 'הוחלף' },
                    { value: 'fixed', label: 'תוקן' },
                    { value: 'adjusted', label: 'כוון' },
                    { value: 'cleaned', label: 'נוקה' },
                    { value: 'checked', label: 'נבדק' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => {
                      const updated = [...preTestWorkItems];
                      updated[idx].action = opt.value;
                      setPreTestWorkItems(updated);
                    }} className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                      work.action === opt.value ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>{opt.label}</button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <input value={work.cost} onChange={e => {
                    const updated = [...preTestWorkItems];
                    updated[idx].cost = e.target.value;
                    setPreTestWorkItems(updated);
                  }} placeholder="עלות ₪" type="number" className="w-20 text-xs border border-gray-200 rounded px-2 py-1 text-center" />
                  <input value={work.notes} onChange={e => {
                    const updated = [...preTestWorkItems];
                    updated[idx].notes = e.target.value;
                    setPreTestWorkItems(updated);
                  }} placeholder="הערות" className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 text-right" dir="rtl" />
                </div>
              </div>
            ))}

            <button onClick={() => setPreTestWorkItems(prev => [...prev, { item: '', action: 'replaced', notes: '', cost: '' }])}
              className="w-full py-2 mt-1 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-teal-400 hover:text-teal-600 transition">
              + הוסף פריט עבודה
            </button>

            {/* Quick-add common pre-test work items */}
            <div className="mt-3">
              <p className="text-xs text-gray-400 text-right mb-2">פריטים נפוצים:</p>
              <div className="flex flex-wrap gap-1 justify-end">
                {[
                  'החלפת נורה', 'כיוון אורות', 'החלפת מגבים', 'מילוי נוזלים',
                  'החלפת צמיג', 'ניפוח צמיגים', 'תיקון בלם יד', 'החלפת נוזל בלמים',
                  'תיקון פליטה', 'כיוון מראות', 'החלפת חגורה', 'תיקון צופר',
                ].map(item => (
                  <button key={item} onClick={() => {
                    if (!preTestWorkItems.find(w => w.item === item)) {
                      setPreTestWorkItems(prev => [...prev, { item, action: 'replaced', notes: '', cost: '' }]);
                    }
                  }} className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-700 transition">
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ====== PERIODIC SERVICE (טיפול תקופתי) ====== */}
      {inspectionType === 'periodic' && step === 2 && (
        <>
          <Card>
            <CardTitle icon={<Settings className="text-teal-600" />}>פירוט טיפול</CardTitle>
            <p className="text-xs text-gray-500 mt-1 mb-3 text-right">סמן את כל הפעולות שבוצעו בטיפול</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                'החלפת שמן מנוע',
                'החלפת פילטר שמן',
                'החלפת פילטר אוויר',
                'החלפת פילטר דלק',
                'החלפת פילטר מזגן',
                'החלפת נוזל בלמים',
                'החלפת נוזל קירור',
                'החלפת רצועות',
                'החלפת מצת',
                'החלפת צמיגים',
                'איזון גלגלים',
                'כיוון פרונט',
                'החלפת בלמים קדמיים',
                'החלפת בלמים אחוריים',
                'החלפת דיסקים',
                'החלפת מצבר',
                'שטיפת מנוע',
                'טיפול מזגן',
                'החלפת בולמים',
                'החלפת מוטות מייצב',
              ].map(item => (
                <button key={item} onClick={() => setServiceItems(prev =>
                  prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
                )} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  serviceItems.includes(item) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{item}</button>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle>הערות טיפול</CardTitle>
            <VoiceInput value={serviceNotes} onChange={setServiceNotes} placeholder="פירוט נוסף על הטיפול..." rows={3} />
          </Card>
          <Card>
            <CardTitle>המלצות המשך</CardTitle>
            <VoiceInput value={serviceRecommendations} onChange={setServiceRecommendations} placeholder="המלצות לטיפולים עתידיים, חלקים שצריך להחליף בקרוב..." rows={3} />
          </Card>
          <Card>
            <CardTitle icon={<Camera className="text-teal-600" />}>תמונות חלקים שהוחלפו</CardTitle>
            <p className="text-xs text-gray-500 mt-1 mb-3 text-right">צלם את החלקים שהוחלפו לתיעוד</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {servicePhotos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={photo} alt={`חלק ${idx + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => setServicePhotos(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 start-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">✕</button>
                </div>
              ))}
              <button onClick={() => {
                const input = document.createElement('input');
                input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setServicePhotos(prev => [...prev, reader.result as string]);
                  reader.readAsDataURL(file);
                };
                input.click();
              }} className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-teal-400 transition">
                <Camera size={24} className="text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">הוסף תמונה</span>
              </button>
            </div>
          </Card>
        </>
      )}

      {/* ====== TROUBLESHOOT (תיקון/אבחון תקלה) ====== */}
      {inspectionType === 'troubleshoot' && step === 2 && (
        <>
          <Card>
            <CardTitle icon={<Wrench className="text-orange-600" />}>תיאור התקלה</CardTitle>
            <VoiceInput value={troubleshootProblem} onChange={setTroubleshootProblem} placeholder="תאר את התקלה כפי שדווחה על ידי הלקוח..." rows={3} />
          </Card>
          <Card>
            <CardTitle>אבחון</CardTitle>
            <VoiceInput value={troubleshootDiagnosis} onChange={setTroubleshootDiagnosis} placeholder="ממצאי האבחון - מה נמצא..." rows={3} />
          </Card>
          <Card>
            <CardTitle>תיקון שבוצע</CardTitle>
            <VoiceInput value={troubleshootFix} onChange={setTroubleshootFix} placeholder="פירוט התיקון שבוצע..." rows={3} />
          </Card>
          <Card>
            <CardTitle>חלקים שהוחלפו</CardTitle>
            <VoiceInput value={troubleshootParts} onChange={setTroubleshootParts} placeholder="רשימת חלקים שהוחלפו..." rows={2} />
          </Card>
          <Card>
            <CardTitle>הערות נוספות</CardTitle>
            <VoiceInput value={troubleshootNotes} onChange={setTroubleshootNotes} placeholder="הערות נוספות, המלצות ללקוח..." rows={2} />
          </Card>
        </>
      )}

      {/* Navigation */}
      {step > 0 && (
        <div className="flex gap-2 sticky bottom-20 lg:bottom-4 px-1 z-30">
          {step > 1 && (
            <Button variant="outline" className="flex-1" icon={<ArrowRight size={16} />}
              onClick={() => setStep((step - 1) as Step)}>חזור</Button>
          )}
          {step === 1 && (
            <Button variant="outline" className="flex-1" icon={<ArrowRight size={16} />}
              onClick={() => setStep(0 as Step)}>שנה סוג פעולה</Button>
          )}
          {/* Full inspection: continue through 8 steps */}
          {inspectionType === 'full' && step < 8 && (
            <Button className="flex-1" icon={<ArrowLeft size={16} />}
              onClick={() => setStep((step + 1) as Step)}
              disabled={step === 1 && !selectedVehicleId && !isManualVehicleValid}>הבא</Button>
          )}
          {inspectionType === 'full' && step === 8 && (
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700" icon={<Save size={16} />}
              loading={loading} onClick={handleSubmit}>שלח בדיקה</Button>
          )}
          {/* Non-full types: step 1 → step 2 (form), step 2 → submit */}
          {inspectionType !== 'full' && step === 1 && (
            <Button className="flex-1" icon={<ArrowLeft size={16} />}
              onClick={() => setStep(2 as Step)}
              disabled={!selectedVehicleId && !isManualVehicleValid}>הבא</Button>
          )}
          {inspectionType !== 'full' && step === 2 && (
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700" icon={<Save size={16} />}
              loading={loading} onClick={handleSubmit}>שמור</Button>
          )}
          {/* Cancel button */}
          <Button variant="outline" className="px-3 text-red-500 border-red-200 hover:bg-red-50" icon={<X size={16} />}
            onClick={() => setShowCancelModal(true)} />
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="לצאת מהטופס?">
        <div className="text-center space-y-4">
          <p className="text-gray-600">המידע שהזנת לא יישמר. האם אתה בטוח שברצונך לצאת?</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)}>המשך למלא</Button>
            <Button className="flex-1 bg-red-500 hover:bg-red-600" onClick={() => router.push('/garage')}>צא בלי לשמור</Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={successModal} onClose={() => {}} title={inspectionType === 'full' ? 'בדיקה נוצרה בהצלחה!' : 'נשמר בהצלחה!'}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <Check size={32} className="text-green-600" />
          </div>
          <p className="text-gray-600">{inspectionTypes.find(t => t.value === inspectionType)?.label} נשמר בהצלחה</p>
          {inspectionType === 'full' && overallScore > 0 && (
            <div className="bg-teal-50 p-4 rounded-xl">
              <div className="text-3xl font-bold text-teal-600">{overallScore}</div>
              <div className="text-sm text-teal-700">{scoreLabel}</div>
            </div>
          )}
          {/* Send for remote signature */}
          {inspectionType === 'full' && !signatureData && (
            <button
              onClick={handleSendForSignature}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition mb-2"
            >
              <Send size={18} />
              שלח ללקוח לחתימה בוואצאפ
            </button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setSuccessModal(false); router.push('/garage/inspections'); }}>
              חזור לבדיקות
            </Button>
            <Button className="flex-1" onClick={() => { setSuccessModal(false); router.push(`/inspection/${successId}`); }}>
              צפה בדוח
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
