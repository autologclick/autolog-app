'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Shield, Car, Wrench, Droplets, Gauge, Lightbulb, Eye, PenLine,
  Check, AlertTriangle, X, ChevronDown, ChevronUp, Share2, Download, Lock,
  Phone, MapPin, Calendar, Clock, Camera, CircleDot, Settings,
  Wind, Zap, ArrowRight, FileText, Star, MessageCircle, Loader2
} from 'lucide-react';
import Logo, { LogoIcon } from '@/components/ui/Logo';

// ====== Types ======
interface Inspection {
  id: string;
  date: string;
  inspectionType: string;
  status: string;
  overallScore: number | null;
  mechanicName: string | null;
  mileage: number | null;
  engineNumber: string | null;
  engineVerified: boolean;
  summary: string | null;
  aiSummary: string | null;
  customerName: string | null;
  customerIdNumber: string | null;
  customerSignature: string | null;
  signedAt: string | null;
  exteriorPhotos: Record<string, string> | null;
  interiorPhotos: Record<string, string> | null;
  tiresData: Record<string, string> | null;
  lightsData: Record<string, string> | null;
  frontAxle: { status?: string; ballBearings?: string; items?: Record<string, string>; notes?: string } | null;
  steeringData: { status?: string; alignment?: string; items?: Record<string, string>; notes?: string } | null;
  shocksData: { items?: Record<string, string>; notes?: string } | Record<string, string> | null;
  bodyData: { condition?: string; tags?: string[]; notes?: string } | null;
  batteryData: { isOriginal?: boolean; status?: string; date?: string } | null;
  fluidsData: Record<string, string> | null;
  interiorSystems: { acCold?: string; acHot?: string; audio?: string } | null;
  windowsData: Record<string, string> | null;
  engineIssues: { issues?: string[]; notes?: string } | null;
  gearboxIssues: { notes?: string } | null;
  brakingSystem: { frontDiscs?: number; rearDiscs?: number; frontPads?: number; rearPads?: number } | null;
  recommendations: Array<{ text: string; urgency?: string; estimatedCost?: string }> | null;
  notes: { undercarriage?: string; engine?: string; general?: string } | null;
  vehicle: {
    id: string; nickname: string | null; manufacturer: string | null;
    model: string; year: number | null; licensePlate: string;
    color: string | null; vin: string | null; mileage: number | null;
  };
  garage: {
    id: string; name: string; city: string | null;
    address: string | null; phone: string | null; email: string | null;
  };
  items: Array<{
    id: string; category: string; itemName: string;
    status: string; notes: string | null; score: number | null;
  }>;
  preTestChecklist: Record<string, boolean> | null;
  preTestNotes: string | null;
  workPerformed: Array<{ item: string; action: string; notes?: string; cost?: number }> | null;
  cost: number | null;
}

// ====== Helpers ======
const statusIcon = (s: string) => {
  if (s === 'new') return <span className="w-3.5 h-3.5 rounded-full bg-blue-500 inline-block" />;
  if (s === 'ok') return <Check size={14} className="text-green-600" />;
  if (s === 'not_ok') return <X size={14} className="text-red-600" />;
  if (s === 'worn') return <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block" />;
  if (s === 'sweating') return <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block" />;
  if (s === 'warning') return <AlertTriangle size={14} className="text-amber-500" />;
  if (s === 'leaking') return <span className="w-3.5 h-3.5 rounded-full bg-orange-500 inline-block" />;
  if (s === 'dry') return <span className="w-3.5 h-3.5 rounded-full bg-orange-500 inline-block" />;
  if (s === 'replace') return <X size={14} className="text-red-600" />;
  if (s === 'failed') return <X size={14} className="text-red-600" />;
  if (s === 'critical') return <X size={14} className="text-red-500" />;
  return <span className="w-3.5 h-3.5 rounded-full bg-gray-300 inline-block" />;
};

const statusBg = (s: string) => {
  if (s === 'new') return 'bg-blue-50 border-blue-200 text-blue-700';
  if (s === 'ok') return 'bg-green-50 border-green-200 text-green-700';
  if (s === 'not_ok') return 'bg-red-50 border-red-200 text-red-700';
  if (s === 'worn') return 'bg-amber-50 border-amber-200 text-amber-700';
  if (s === 'sweating') return 'bg-amber-50 border-amber-200 text-amber-700';
  if (s === 'warning') return 'bg-amber-50 border-amber-200 text-amber-700';
  if (s === 'low') return 'bg-amber-50 border-amber-200 text-amber-700';
  if (s === 'dirty') return 'bg-orange-50 border-orange-200 text-orange-700';
  if (s === 'leaking') return 'bg-orange-50 border-orange-200 text-orange-700';
  if (s === 'dry') return 'bg-orange-50 border-orange-200 text-orange-700';
  if (s === 'replace') return 'bg-red-50 border-red-200 text-red-700';
  if (s === 'failed') return 'bg-red-50 border-red-200 text-red-700';
  if (s === 'critical') return 'bg-red-50 border-red-200 text-red-700';
  return 'bg-gray-50 border-gray-200 text-gray-500';
};

const statusLabel = (s: string) => {
  if (s === 'new') return '×××©';
  if (s === 'ok') return '×ª×§××';
  if (s === 'not_ok') return '×× ×ª×§××';
  if (s === 'worn') return '×©×××§';
  if (s === 'sweating') return '×××¢×';
  if (s === 'warning') return '×××¨×© ×ª×©×××ª ××';
  if (s === 'low') return '××¡×¨';
  if (s === 'dirty') return '××××××';
  if (s === 'leaking') return '× ×××';
  if (s === 'dry') return '×××©';
  if (s === 'replace') return '×××××¤×';
  if (s === 'failed') return '×¤×¡××';
  if (s === 'critical') return '×§×¨×××';
  return '×× × ×××§';
};

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
};

const scoreBg = (score: number) => {
  if (score >= 80) return 'from-green-500 to-emerald-600';
  if (score >= 50) return 'from-amber-500 to-orange-600';
  return 'from-red-500 to-rose-600';
};

const scoreLabel = (score: number) => {
  if (score >= 80) return '××¦× ×ª×§××';
  if (score >= 50) return '×××¨×© ×ª×©×××ª ××';
  return '×× ×ª×§××';
};

const inspectionTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    full: '××××§× ×××× (AutoLog)',
    rot: '××××§×ª ×¨×§×',
    engine: '××××§×ª ×× ××¢',
    pre_test: '××× × ×××¡×',
    tires: '××××§×ª ×¦×××××',
    brakes: '××××§×ª ×××××',
    periodic: '×××¤×× ×ª×§××¤×ª×',
    troubleshoot: '××××× ×ª×§××',
  };
  return map[t] || t;
};

const formatDate = (d: string) => {
  return new Date(d).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

// ====== Collapsible Section ======
function Section({ title, icon, children, defaultOpen = true, badge }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  defaultOpen?: boolean; badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-0 text-right">
        <div className="flex items-center gap-2">
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          {badge}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm sm:text-base text-[#1e3a5f]">{title}</span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-teal-50 rounded-lg flex items-center justify-center">{icon}</div>
        </div>
      </button>
      {open && <div className="mt-4 border-t border-gray-100 pt-4">{children}</div>}
    </Card>
  );
}

// ====== Status Row ======
function StatusRow({ label, status }: { label: string; status: string }) {
  return (
    <div className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border ${statusBg(status)}`}>
      <div className="flex items-center gap-1.5">
        {statusIcon(status)}
        <span className="text-[10px] sm:text-xs font-medium">{statusLabel(status)}</span>
      </div>
      <span className="text-xs sm:text-sm font-medium">{label}</span>
    </div>
  );
}

// ====== Brake Bar ======
function BrakeBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = value >= 70 ? 'text-green-600' : value >= 40 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-xs sm:text-sm font-bold ${textColor}`}>{value}%</span>
        <span className="text-xs sm:text-sm text-gray-600">{label}</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden" dir="ltr">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ====== Photo Grid ======
function PhotoGrid({ photos, labels }: { photos: Record<string, string>; labels: Record<string, string> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const entries = Object.entries(photos).filter(([, v]) => v);
  if (entries.length === 0) return null;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {entries.map(([key, src]) => (
          <div key={key} className="relative cursor-pointer group" onClick={() => setSelected(src)}>
            <img src={src} alt={labels[key] || key} className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200 group-hover:border-teal-400 transition" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg p-2">
              <span className="text-white text-xs font-medium">{labels[key] || key}</span>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <img src={selected} alt="×ª××× × ××××××ª" className="max-w-full max-h-[90vh] rounded-xl" />
        </div>
      )}
    </>
  );
}

// ====== Main Page ======
export default function InspectionReportPage() {
  const params = useParams();
  const router = useRouter();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Signature gate state
  const [signName, setSignName] = useState('');
  const [signId, setSignId] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState('');
  const signCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Canvas drawing handlers
  const initCanvas = useCallback(() => {
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = signCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const drawMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
    const canvas = signCanvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL('image/png'));
    }
  };

  const clearSign = () => {
    setSignatureData('');
    initCanvas();
  };

  const handleSign = async () => {
    setSignError('');
    if (!signName || signName.length < 2) {
      setSignError('נא להזין שם מלא');
      return;
    }
    if (!signId || !/^\d{5,9}$/.test(signId)) {
      setSignError('\u05E0\u05D0 \u05DC\u05D4\u05D6\u05D9\u05DF \u05DE\u05E1\u05E4\u05E8 \u05EA"\u05D6 \u05EA\u05E7\u05D9\u05DF (5-9 \u05E1\u05E4\u05E8\u05D5\u05EA)');
      return;
    }
    if (!signatureData || signatureData.length < 100) {
      setSignError('נא לחתום בשדה החתימה');
      return;
    }
    setSigning(true);
    try {
      const res = await fetch(`/api/inspections/${params.id}/sign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: signName,
          customerIdNumber: signId,
          customerSignature: signatureData,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSignError(data.error || 'שגיאה בחתימה');
        return;
      }
      // Reload inspection to show the full report
      const freshRes = await fetch(`/api/inspections/${params.id}`);
      if (freshRes.ok) {
        const freshData = await freshRes.json();
        setInspection(freshData.inspection);
      }
    } catch {
      setSignError('שגיאה בחתימה, נסה שוב');
    } finally {
      setSigning(false);
    }
  };

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        const res = await fetch(`/api/inspections/${params.id}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'שגיאה בטעינת הבדיקה');
          return;
        }
        const data = await res.json();
        setInspection(data.inspection);
      } catch {
        setError('שגיאה בטעינת הבדיקה');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchInspection();
  }, [params.id]);

  // Fetch AI analysis when inspection loads
  useEffect(() => {
    if (!inspection) return;
    setAiLoading(true);
    fetch(`/api/ai/inspection-analysis?inspectionId=${inspection.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.analysis) setAiAnalysis(data.analysis);
        setAiLoading(false);
      })
      .catch(() => setAiLoading(false));
  }, [inspection?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield size={48} className="text-gray-300" />
        <p className="text-gray-500 text-lg">{error || 'הבדיקה לא נמצאה'}</p>
        <Button variant="outline" onClick={() => router.back()}>חזור</Button>
      </div>
    );
  }

  // ====== SIGNATURE GATE ======
  if (inspection.status === 'awaiting_signature') {
    const gateScore = inspection.overallScore ?? 0;
    const gateVehicle = inspection.vehicle;
    const gateGarage = inspection.garage;
    return (
      <div className="space-y-4 pt-12 lg:pt-0 pb-20 max-w-lg mx-auto px-3" dir="rtl">
        {/* Blurred preview header */}
        <div className={`rounded-2xl bg-gradient-to-br ${scoreBg(gateScore)} text-white p-6 text-center`}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <LogoIcon className="h-6 w-6 text-white" />
            <span className="text-white/80 text-sm">AutoLog</span>
          </div>
          <div className="text-5xl font-bold mb-2">{gateScore}</div>
          <div className="text-white/80">ציון כללי</div>
        </div>

        {/* Vehicle info */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Car size={20} className="text-teal-600" />
            <div>
              <div className="font-medium">{gateVehicle.nickname || `${gateVehicle.manufacturer || ''} ${gateVehicle.model}`.trim()}</div>
              <div className="text-sm text-gray-500">{gateVehicle.licensePlate}</div>
            </div>
          </div>
        </Card>

        {/* Garage info */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Wrench size={20} className="text-teal-600" />
            <div>
              <div className="font-medium">{gateGarage.name}</div>
              <div className="text-sm text-gray-500">{gateGarage.city}</div>
            </div>
          </div>
        </Card>

        {/* Lock message */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <Lock size={32} className="mx-auto text-amber-500 mb-2" />
          <h3 className="font-bold text-lg mb-1">הדוח ממתין לחתימתך</h3>
          <p className="text-sm text-gray-600">יש למלא פרטים ולחתום כדי לצפות בדוח המלא</p>
        </div>

        {/* Signature form */}
        <Card className="p-4 space-y-4">
          <CardTitle className="text-lg">חתימה דיגיטלית</CardTitle>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">שם מלא</label>
            <input
              type="text"
              value={signName}
              onChange={(e) => setSignName(e.target.value)}
              placeholder="הזן שם מלא"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{"\u05DE\u05E1\u05E4\u05E8 \u05EA\"\u05D6"}</label>
            <input
              type="text"
              value={signId}
              onChange={(e) => setSignId(e.target.value)}
              placeholder="הזן מספר תעודת זהות"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">חתימה</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              <canvas
                ref={signCanvasRef}
                width={350}
                height={150}
                className="w-full touch-none bg-white cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={drawMove}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={drawMove}
                onTouchEnd={stopDraw}
              />
            </div>
            <button
              type="button"
              onClick={clearSign}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              נקה חתימה
            </button>
          </div>

          {signError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {signError}
            </div>
          )}

          <Button
            onClick={handleSign}
            disabled={signing}
            className="w-full"
          >
            {signing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                שולח...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <PenLine size={18} />
                חתום וצפה בדוח
              </span>
            )}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            בלחיצה על &quot;חתום וצפה בדוח&quot; אני מאשר/ת שהפרטים נכונים ומסכים/ה לתנאי השימוש
          </p>
        </Card>
      </div>
    );
  }
  const score = inspection.overallScore ?? 0;
  const v = inspection.vehicle;
  const g = inspection.garage;
  const vehicleLabel = v.nickname || `${v.manufacturer || ''} ${v.model}`.trim();

  // Count statuses for quick overview
  const allStatuses = inspection.items.map(i => i.status);
  const okCount = allStatuses.filter(s => s === 'ok').length;
  const warnCount = allStatuses.filter(s => s === 'warning').length;
  const critCount = allStatuses.filter(s => s === 'critical').length;

  // Photo labels
  const exteriorLabels: Record<string, string> = {
    front: '××××ª', rear: '××××¨×', right: '×¦× ××××', left: '×¦× ×©×××', roof: '××',
  };
  const interiorLabels: Record<string, string> = {
    frontSeats: '×××©××× ×§×××××', rearSeats: '×××©××× ××××¨×××', dashboard: '××©×××¨×',
  };

  // Tire labels
  const tireLabels: Record<string, string> = {
    frontLeft: '×§××× ×©×××', frontRight: '×§××× ××××', rearLeft: '××××¨× ×©×××', rearRight: '××××¨× ××××',
  };
  // Light labels
  const lightLabels: Record<string, string> = {
    brakes: '×××¨××ª ×××', reverse: '×¨××××¨×¡', fog: '×¢×¨×¤×', headlights: '×¤× ×¡××',
    frontSignal: '×××ª××ª ×§×××', rearSignal: '×××ª××ª ××××¨×', highBeam: '×××¨ ××××', plate: '×ª×××¨×ª ×××××ª',
  };
  // Fluid labels
  const fluidLabels: Record<string, string> = {
    brakeFluid: '× ××× ×××××', engineOil: '×©×× ×× ××¢', coolant: '× ××× ×§××¨××¨',
  };
  // Window labels
  const windowLabels: Record<string, string> = {
    frontLeft: '×§××× ×©×××', frontRight: '×§××× ××××', rearLeft: '××××¨× ×©×××', rearRight: '××××¨× ××××',
  };
  // Shock labels
  const shockLabels: Record<string, string> = {
    frontLeft: '×§××× ×©×××', frontRight: '×§××× ××××', rearLeft: '××××¨× ×©×××', rearRight: '××××¨× ××××',
  };

  // Pre-test checklist labels
  const preTestLabels: Record<string, string> = {
    tires: '×¦××××× (××¦× + ×××¥)', lights: '×××¨××ª ×××××× ××', brakes: '×××××',
    mirrors: '××¨×××ª', wipers: '××××× + × ×××', horn: '×¦××¤×¨',
    seatbelts: '××××¨××ª ××××××ª', exhaust: '××¢×¨××ª ×¤××××', steering: '××××× (××©××§)',
    suspension: '××ª××× ×××××××', fluids: '× ××××× (×©××, ×××, ×××××)', battery: '××¦××¨',
    handbrake: '××× ××', speedometer: '×× ××××¨××ª', windows: '×××× ××ª ××©××©××ª',
  };
  const actionLabels: Record<string, string> = {
    replaced: '×××××£', fixed: '×ª××§×', adjusted: '××××', cleaned: '× ××§×', checked: '× ×××§',
  };
  const actionColors: Record<string, string> = {
    replaced: 'bg-blue-100 text-blue-700 border-blue-200',
    fixed: 'bg-green-100 text-green-700 border-green-200',
    adjusted: 'bg-purple-100 text-purple-700 border-purple-200',
    cleaned: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    checked: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  // Pre-test data
  const preTestItems = inspection.items.filter(i => i.category === 'pre_test');
  const workItems = inspection.items.filter(i => i.category === 'work_performed');
  const preTestPassed = preTestItems.filter(i => i.status === 'ok').length;
  const preTestTotal = preTestItems.length;
  const totalWorkCost = inspection.workPerformed?.reduce((sum, w) => sum + (w.cost || 0), 0) || 0;

  const pdfUrl = `/api/public/inspections/${inspection.id}/pdf`;

  const handleShare = async () => {
    const text = `××× ××××§×ª AutoLog - ${vehicleLabel} (${v.licensePlate}) - ×¦×××: ${score}/100`;

    try {
      // Try to fetch PDF and share as file
      const res = await fetch(pdfUrl);
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], `AutoLog-${v.licensePlate}.pdf`, { type: 'application/pdf' });

        // Use Web Share API with PDF file if supported
        if (navigator.share && navigator.canShare) {
          const shareData = { title: '××× ××××§×ª AutoLog', text, files: [file] };
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        }
      }

      // Fallback: share link to PDF
      const fullPdfUrl = `${window.location.origin}${pdfUrl}`;
      if (navigator.share) {
        await navigator.share({
          title: '××× ××××§×ª AutoLog',
          text: text + '\n\n ×¦×¤× ×××× PDF:',
          url: fullPdfUrl,
        });
      } else {
        // Desktop fallback: WhatsApp with direct PDF link
        const waText = `${text}\n\n ××× PDF:\n${fullPdfUrl}`;
        const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
        window.open(waUrl, '_blank');
      }
    } catch {
      // If share failed/cancelled, try WhatsApp with PDF link
      const fullPdfUrl = `${window.location.origin}${pdfUrl}`;
      const waText = `${text}\n\n ××× PDF:\n${fullPdfUrl}`;
      const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
      window.open(waUrl, '_blank');
    }
  };

  const handleDownload = () => {
    // Direct PDF download
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `AutoLog-${v.licensePlate}.pdf`;
    link.click();
  };

  return (
    <div className="space-y-3 sm:space-y-4 pt-12 lg:pt-0 pb-20 max-w-3xl mx-auto px-2 sm:px-0" dir="rtl">

      {/* ===== HEADER WITH SCORE ===== */}
      <div className={`rounded-2xl bg-gradient-to-br ${scoreBg(score)} text-white p-4 sm:p-6 shadow-lg`}>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex gap-2">
            <button onClick={handleDownload} className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition">
              <Download size={16} />
            </button>
            <button onClick={handleShare} className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition">
              <Share2 size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm opacity-90">××× ××××§×</span>
            <LogoIcon size={24} />
          </div>
        </div>

        <div className="text-center mb-3 sm:mb-4">
          <div className="text-5xl sm:text-6xl font-black mb-1">{score}</div>
          <div className="text-base sm:text-lg font-medium opacity-90">{scoreLabel(score)}</div>
          <div className="text-xs sm:text-sm opacity-75 mt-1">{inspectionTypeLabel(inspection.inspectionType)}</div>
        </div>

        {/* Quick stat pills */}
        <div className="flex justify-center gap-3">
          {okCount > 0 && (
            <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1">
              <Check size={12} /> {okCount} ×ª×§××
            </div>
          )}
          {warnCount > 0 && (
            <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1">
              <AlertTriangle size={12} /> {warnCount} ××××¨×
            </div>
          )}
          {critCount > 0 && (
            <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1">
              <X size={12} /> {critCount} ×§×¨×××
            </div>
          )}
        </div>
      </div>

      {/* ===== VEHICLE & GARAGE INFO ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-2 mb-3">
            <Car size={18} className="text-teal-600" />
            <span className="font-bold text-[#1e3a5f]">×¤×¨×× ×¨××</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-800 font-medium">{vehicleLabel}</span>
              <span className="text-gray-500">×¨××</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-800 font-mono">{v.licensePlate}</span>
              <span className="text-gray-500">×××××ª</span>
            </div>
            {v.year && (
              <div className="flex justify-between">
                <span className="text-gray-800">{v.year}</span>
                <span className="text-gray-500">×©× ×</span>
              </div>
            )}
            {inspection.mileage && (
              <div className="flex justify-between">
                <span className="text-gray-800">{inspection.mileage.toLocaleString()} ×§×´×</span>
                <span className="text-gray-500">×§××××××¨×××³</span>
              </div>
            )}
            {inspection.engineNumber && (
              <div className="flex justify-between">
                <span className="text-gray-800 font-mono text-xs">{inspection.engineNumber}</span>
                <span className="text-gray-500">××¡×³ ×× ××¢</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wrench size={18} className="text-teal-600" />
            <span className="font-bold text-[#1e3a5f]">×¤×¨×× ×××¡×</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-800 font-medium">{g.name}</span>
              <span className="text-gray-500">×××¡×</span>
            </div>
            {g.city && (
              <div className="flex justify-between">
                <span className="text-gray-800">{g.city}</span>
                <span className="text-gray-500">×¢××¨</span>
              </div>
            )}
            {inspection.mechanicName && (
              <div className="flex justify-between">
                <span className="text-gray-800">{inspection.mechanicName}</span>
                <span className="text-gray-500">×××× ××</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-800">{formatDate(inspection.date)}</span>
              <span className="text-gray-500">×ª××¨××</span>
            </div>
            {g.phone && (
              <a href={`tel:${g.phone}`} className="flex justify-between items-center text-teal-600 hover:text-teal-700">
                <span className="flex items-center gap-1"><Phone size={12} /> {g.phone}</span>
                <span className="text-gray-500">×××¤××</span>
              </a>
            )}
          </div>
        </Card>
      </div>

      {/* ===== PRE-TEST CHECKLIST ===== */}
      {inspection.inspectionType === 'pre_test' && preTestItems.length > 0 && (
        <Section title="×¦'×§×××¡× ××× × ×××¡×" icon={<Shield size={18} className="text-blue-600" />}
          badge={
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              preTestPassed === preTestTotal ? 'bg-green-100 text-green-700' :
              preTestPassed >= preTestTotal * 0.7 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {preTestPassed}/{preTestTotal}
            </span>
          }>
          <div className="space-y-1.5">
            {preTestItems.map((item) => (
              <div key={item.id} className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border ${
                item.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {item.status === 'ok'
                    ? <Check size={16} className="text-green-600" />
                    : <X size={16} className="text-red-600" />
                  }
                  <span className={`text-xs font-medium ${item.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                    {item.status === 'ok' ? '×ª×§××' : '×× ×ª×§××'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-800">{item.itemName}</span>
              </div>
            ))}
          </div>
          {inspection.preTestNotes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">××¢×¨××ª</p>
              <p className="text-sm text-gray-700">{inspection.preTestNotes}</p>
            </div>
          )}
        </Section>
      )}

      {/* ===== WORK PERFORMED ===== */}
      {inspection.inspectionType === 'pre_test' && (workItems.length > 0 || (inspection.workPerformed && inspection.workPerformed.length > 0)) && (
        <Section title="×¢×××××ª ×©×××¦×¢×" icon={<Wrench size={18} className="text-emerald-600" />}
          badge={
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {inspection.workPerformed?.length || workItems.length} ×¤×¨××××
            </span>
          }>
          <div className="space-y-2">
            {(inspection.workPerformed || []).map((work, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${actionColors[work.action] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {actionLabels[work.action] || work.action}
                  </span>
                  <span className="text-sm font-bold text-gray-800">{work.item}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  {work.cost ? (
                    <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {work.cost.toLocaleString()} âª
                    </span>
                  ) : <span />}
                  {work.notes && (
                    <span className="text-xs text-gray-500">{work.notes}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {totalWorkCost > 0 && (
            <div className="mt-3 p-3 bg-teal-50 rounded-lg border border-teal-200 flex items-center justify-between">
              <span className="text-base font-bold text-teal-800">{totalWorkCost.toLocaleString()} âª</span>
              <span className="text-sm font-medium text-teal-700">×¡××´× ×¢×××ª ×¢×××××ª</span>
            </div>
          )}
        </Section>
      )}

      {/* ===== EXTERIOR PHOTOS ===== */}
      {inspection.exteriorPhotos && Object.keys(inspection.exteriorPhotos).length > 0 && (
        <Section title="×ª××× ××ª ×××¥" icon={<Camera size={18} className="text-teal-600" />}>
          <PhotoGrid photos={inspection.exteriorPhotos} labels={exteriorLabels} />
        </Section>
      )}

      {/* ===== INTERIOR PHOTOS ===== */}
      {inspection.interiorPhotos && Object.keys(inspection.interiorPhotos).length > 0 && (
        <Section title="×ª××× ××ª ×¤× ××" icon={<Eye size={18} className="text-teal-600" />}>
          <PhotoGrid photos={inspection.interiorPhotos} labels={interiorLabels} />
        </Section>
      )}

      {/* ===== TIRES ===== */}
      {inspection.tiresData && (
        <Section title="×¦×××××" icon={<CircleDot size={18} className="text-teal-600" />}
          badge={
            <div className="flex gap-1">
              {Object.values(inspection.tiresData).some(v => v === 'critical' || v === 'failed') && <span className="w-2 h-2 rounded-full bg-red-500" />}
              {Object.values(inspection.tiresData).some(v => v === 'warning' || v === 'dry') && <span className="w-2 h-2 rounded-full bg-orange-500" />}
              {Object.values(inspection.tiresData).some(v => v === 'worn') && <span className="w-2 h-2 rounded-full bg-amber-500" />}
            </div>
          }>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(inspection.tiresData).filter(([, v]) => v).map(([key, val]) => (
              <StatusRow key={key} label={tireLabels[key] || key} status={val} />
            ))}
          </div>
        </Section>
      )}

      {/* ===== LIGHTS ===== */}
      {inspection.lightsData && (
        <Section title="×ª×××¨×" icon={<Lightbulb size={18} className="text-teal-600" />}>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(inspection.lightsData).filter(([, v]) => v).map(([key, val]) => (
              <StatusRow key={key} label={lightLabels[key] || key} status={val} />
            ))}
          </div>
        </Section>
      )}

      {/* ===== MECHANICAL SYSTEMS ===== */}
      {(inspection.frontAxle || inspection.steeringData || inspection.shocksData || inspection.batteryData) && (
        <Section title="××¢×¨×××ª ××× ×××ª" icon={<Settings size={18} className="text-teal-600" />}>
          <div className="space-y-3">
            {/* Front Axle */}
            {inspection.frontAxle && (inspection.frontAxle.status || inspection.frontAxle.items) && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-700 px-1">×¡×¨× ×§×××</p>
                {inspection.frontAxle.items && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(inspection.frontAxle.items).filter(([, v]) => v).map(([key, val]) => {
                      const labels: Record<string, string> = {
                        stabilizerBars: '×××××ª ××××¦×', controlArms: '××¨××¢××ª',
                        bushings: '××××××ª', wheelBearings: '×××¡×× ××××',
                      };
                      return <StatusRow key={key} label={labels[key] || key} status={val} />;
                    })}
                  </div>
                )}
                {!inspection.frontAxle.items && inspection.frontAxle.status && (
                  <StatusRow label="×¡×¨× ×§×××" status={inspection.frontAxle.status} />
                )}
                {inspection.frontAxle.notes && (
                  <p className="text-xs text-gray-500 px-3">{inspection.frontAxle.notes}</p>
                )}
              </div>
            )}

            {/* Steering */}
            {inspection.steeringData && (inspection.steeringData.status || inspection.steeringData.items) && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-700 px-1">××¢×¨××ª ×××××</p>
                {inspection.steeringData.items && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(inspection.steeringData.items).filter(([, v]) => v).map(([key, val]) => {
                      const labels: Record<string, string> = {
                        steeringWheel: '××× (××©××§)', pump: '××©×××ª ×××',
                        rack: '×ª×××ª ×××', column: '×¢××× ×××', alignment: '××××× (×××× ×× ×)',
                      };
                      return <StatusRow key={key} label={labels[key] || key} status={val} />;
                    })}
                  </div>
                )}
                {!inspection.steeringData.items && inspection.steeringData.status && (
                  <StatusRow label="×××" status={inspection.steeringData.status} />
                )}
                {inspection.steeringData.notes && (
                  <p className="text-xs text-gray-500 px-3">{inspection.steeringData.notes}</p>
                )}
              </div>
            )}

            {/* Shocks */}
            {inspection.shocksData && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-700 px-1">××××××</p>
                <div className="grid grid-cols-2 gap-2">
                  {(() => {
                    const data = (inspection.shocksData as any);
                    const items = data.items || data;
                    return Object.entries(items).filter(([k, v]) => k !== 'notes' && v && typeof v === 'string').map(([key, val]) => (
                      <StatusRow key={key} label={shockLabels[key] || key} status={val as string} />
                    ));
                  })()}
                </div>
                {((inspection.shocksData as any).notes) && (
                  <p className="text-xs text-gray-500 px-3">{(inspection.shocksData as any).notes}</p>
                )}
              </div>
            )}

            {/* Battery */}
            {inspection.batteryData && (
              <div className="space-y-1">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 border-gray-200">
                  <span className="text-xs text-gray-600">
                    {inspection.batteryData.status === 'original' || inspection.batteryData.isOriginal === true ? '××§××¨×' :
                     inspection.batteryData.status === 'not_visible' ? '×× × ××ª× ××¨×××ª' :
                     inspection.batteryData.status === 'replaced' || inspection.batteryData.isOriginal === false ? '×××××£' : 'â'}
                  </span>
                  <span className="text-sm font-medium">××¦××¨</span>
                </div>
                {inspection.batteryData.date && (
                  <p className="text-xs text-gray-500 px-3 text-right">×ª××¨×× ××¦××¨: {inspection.batteryData.date}</p>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ===== BODY & CHASSIS ===== */}
      {inspection.bodyData && (
        <Section title="×©××× ×××¨××" icon={<Car size={18} className="text-teal-600" />}>
          <div className="space-y-2">
            {inspection.bodyData.condition && (
              <StatusRow label="××¦× ×©××× / ×¤×" status={inspection.bodyData.condition} />
            )}
            {inspection.bodyData.tags && inspection.bodyData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 px-3">
                {inspection.bodyData.tags.map(tag => (
                  <span key={tag} className={`px-2 py-0.5 rounded-full text-xs border ${
                    tag === '×ª×§×× - ××× ×××¦×××' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                  }`}>{tag}</span>
                ))}
              </div>
            )}
            {inspection.bodyData.notes && (
              <p className="text-xs text-gray-500 px-3">{inspection.bodyData.notes}</p>
            )}
          </div>
        </Section>
      )}

      {/* ===== FLUIDS ===== */}
      {inspection.fluidsData && (
        <Section title="× ×××××" icon={<Droplets size={18} className="text-teal-600" />}>
          <div className="space-y-2">
            {Object.entries(inspection.fluidsData).filter(([, v]) => v).map(([key, val]) => (
              <StatusRow key={key} label={fluidLabels[key] || key} status={val} />
            ))}
          </div>
        </Section>
      )}

      {/* ===== INTERIOR SYSTEMS ===== */}
      {(inspection.interiorSystems || inspection.windowsData) && (
        <Section title="××¢×¨×××ª ×¤× ××" icon={<Wind size={18} className="text-teal-600" />}>
          <div className="space-y-3">
            {inspection.interiorSystems && (
              <div className="space-y-2">
                {inspection.interiorSystems.acCold && <StatusRow label="×××× - ×§××¨" status={inspection.interiorSystems.acCold} />}
                {inspection.interiorSystems.acHot && <StatusRow label="×××× - ×××" status={inspection.interiorSystems.acHot} />}
                {inspection.interiorSystems.audio && <StatusRow label="××¢×¨××ª ×©××¢" status={inspection.interiorSystems.audio} />}
              </div>
            )}
            {inspection.windowsData && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 px-1">×××× ××ª ××©×××××</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(inspection.windowsData).filter(([, v]) => v).map(([key, val]) => (
                    <StatusRow key={key} label={windowLabels[key] || key} status={val} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ===== ENGINE & GEARBOX ===== */}
      {(inspection.engineIssues || inspection.gearboxIssues) && (
        <Section title="×× ××¢ ××ª×××ª ×××××××" icon={<Gauge size={18} className="text-teal-600" />}
          badge={
            inspection.engineIssues?.issues && inspection.engineIssues.issues.length > 0
              ? <span className="w-2 h-2 rounded-full bg-red-500" /> : undefined
          }>
          <div className="space-y-3">
            {inspection.engineIssues && (
              <div>
                {inspection.engineIssues.issues && inspection.engineIssues.issues.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600">××¢×××ª ×©××××:</p>
                    <div className="flex flex-wrap gap-2">
                      {inspection.engineIssues.issues.map(issue => (
                        <span key={issue} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-200">
                          â {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-green-700 text-sm flex items-center gap-2">
                    <Check size={16} /> ×× ×××× ××¢×××ª ×× ××¢
                  </div>
                )}
                {inspection.engineIssues.notes && (
                  <p className="text-xs text-gray-500 mt-2">{inspection.engineIssues.notes}</p>
                )}
              </div>
            )}
            {inspection.gearboxIssues?.notes && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-amber-700 mb-1">×ª×××ª ×××××××</p>
                <p className="text-xs text-amber-600">{inspection.gearboxIssues.notes}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ===== BRAKING SYSTEM ===== */}
      {inspection.brakingSystem && (
        <Section title="××¢×¨××ª ×××××" icon={<Zap size={18} className="text-teal-600" />}>
          <div className="space-y-4">
            {inspection.brakingSystem.frontDiscs !== undefined && (
              <BrakeBar label="×¦××××ª ×§×××××ª" value={inspection.brakingSystem.frontDiscs} />
            )}
            {inspection.brakingSystem.rearDiscs !== undefined && (
              <BrakeBar label="×¦××××ª ××××¨×××ª" value={inspection.brakingSystem.rearDiscs} />
            )}
            {inspection.brakingSystem.frontPads !== undefined && (
              <BrakeBar label="×¨×¤××××ª ×§×××××ª" value={inspection.brakingSystem.frontPads} />
            )}
            {inspection.brakingSystem.rearPads !== undefined && (
              <BrakeBar label="×¨×¤××××ª ××××¨×××ª" value={inspection.brakingSystem.rearPads} />
            )}
          </div>
        </Section>
      )}

      {/* ===== NOTES ===== */}
      {inspection.notes && (inspection.notes.undercarriage || inspection.notes.engine || inspection.notes.general) && (
        <Section title="××¢×¨××ª" icon={<FileText size={18} className="text-teal-600" />} defaultOpen={false}>
          <div className="space-y-3">
            {inspection.notes.undercarriage && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">×ª××ª××ª ××¨××</p>
                <p className="text-sm text-gray-700">{inspection.notes.undercarriage}</p>
              </div>
            )}
            {inspection.notes.engine && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">×× ××¢</p>
                <p className="text-sm text-gray-700">{inspection.notes.engine}</p>
              </div>
            )}
            {inspection.notes.general && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">××¢×¨××ª ××××××ª</p>
                <p className="text-sm text-gray-700">{inspection.notes.general}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ===== RECOMMENDATIONS ===== */}
      {inspection.recommendations && inspection.recommendations.length > 0 && (
        <Section title="××××¦××ª ××ª××§××" icon={<AlertTriangle size={18} className="text-amber-500" />} defaultOpen={true}>
          <div className="space-y-3">
            {inspection.recommendations.map((rec, idx) => (
              <div key={idx} className="p-3 sm:p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-800">{rec.text}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                      {rec.urgency && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          rec.urgency.includes('××××£') || rec.urgency.includes('×××××')
                            ? 'bg-red-100 text-red-700'
                            : rec.urgency.includes('××××©')
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {rec.urgency}
                        </span>
                      )}
                      {rec.estimatedCost && (
                        <span className="text-xs text-gray-500">{rec.estimatedCost}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">#{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ===== DIGITAL SIGNATURE ===== */}
      {inspection.customerSignature && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <PenLine size={18} className="text-teal-600" />
            <span className="font-bold text-[#1e3a5f]">××ª××× ××××××××ª</span>
          </div>
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              {inspection.customerName && (
                <div><span className="text-gray-500">×©×: </span><span className="font-medium">{inspection.customerName}</span></div>
              )}
              {inspection.customerIdNumber && (
                <div><span className="text-gray-500">×ª×´×: </span><span className="font-medium font-mono">{inspection.customerIdNumber}</span></div>
              )}
            </div>
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white p-2">
              <img src={inspection.customerSignature} alt="××ª×××ª ××§××" className="max-h-24 mx-auto" />
            </div>
            {inspection.signedAt && (
              <p className="text-xs text-gray-400 text-center">
                × ××ª× ××ª××¨×× {formatDate(inspection.signedAt)}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* ===== AI ANALYSIS ===== */}
      <Card className="border-teal-200 bg-gradient-to-l from-[#1e3a5f]/5 to-teal-50/80">
        <div className="flex items-center gap-2 mb-4">
          <Star size={18} className="text-teal-600" />
          <span className="font-bold text-[#1e3a5f]">× ××ª×× ××× AutoLog AI</span>
        </div>

        {aiLoading ? (
          <div className="flex items-center justify-center py-6 gap-2">
            <span className="text-sm text-gray-400">×× ×ª× ××ª ×ª××¦×××ª ×××××§×...</span>
            <Loader2 size={18} className="animate-spin text-teal-500" />
          </div>
        ) : aiAnalysis ? (
          <div className="space-y-4">
            {/* Overall Assessment */}
            <div className="bg-white/70 rounded-xl p-3.5 text-right">
              <p className="text-sm text-[#1e3a5f] leading-relaxed">{aiAnalysis.overallAssessment}</p>
            </div>

            {/* Key Findings */}
            {aiAnalysis.keyFindings?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-[#1e3a5f] text-right mb-2 flex items-center gap-1.5 justify-end">
                  ×××¦××× ×¢××§×¨×××
                  <FileText size={14} className="text-teal-500" />
                </h4>
                <div className="space-y-1.5">
                  {aiAnalysis.keyFindings.map((finding: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-right bg-white/50 rounded-lg p-2.5">
                      <span className="text-xs text-gray-600 leading-relaxed">{finding}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Urgent Items */}
            {aiAnalysis.urgentItems?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-red-700 text-right mb-2 flex items-center gap-1.5 justify-end">
                  ×¤×¨×××× ××××¤××
                  <AlertTriangle size={14} className="text-red-500" />
                </h4>
                <div className="space-y-1.5">
                  {aiAnalysis.urgentItems.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-right bg-red-50 border border-red-200 rounded-lg p-2.5">
                      <span className="text-xs text-red-700 font-medium">{item}</span>
                      <X size={12} className="text-red-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Positive Items */}
            {aiAnalysis.positiveItems?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-green-700 text-right mb-2 flex items-center gap-1.5 justify-end">
                  × ×§××××ª ×××××××ª
                  <Check size={14} className="text-green-500" />
                </h4>
                <div className="space-y-1.5">
                  {aiAnalysis.positiveItems.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-right bg-green-50 border border-green-200 rounded-lg p-2.5">
                      <span className="text-xs text-green-700">{item}</span>
                      <Check size={12} className="text-green-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated Repair Cost */}
            {aiAnalysis.estimatedRepairCost && aiAnalysis.estimatedRepairCost !== 'âª0' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-right flex items-center justify-between">
                <span className="text-sm font-bold text-amber-800">{aiAnalysis.estimatedRepairCost}</span>
                <span className="text-xs font-medium text-amber-700">×¢×××ª ×ª××§×× ××©××¢×¨×ª</span>
              </div>
            )}
          </div>
        ) : inspection.aiSummary ? (
          <p className="text-sm text-teal-700 leading-relaxed text-right">{inspection.aiSummary}</p>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">×× ××ª×× ××× × ×××× ××¨××¢</p>
        )}
      </Card>

      {/* ===== SHARE ACTIONS ===== */}
      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button className="flex-1" icon={<Share2 size={16} />} onClick={handleShare}>
              ×©×ª×£ ×××
            </Button>
            <Button variant="outline" className="flex-1" icon={<Download size={16} />} onClick={handleDownload}>
              ×©×××¨ PDF
            </Button>
          </div>
          <Button variant="outline" className="w-full" icon={<MessageCircle size={16} />}
            onClick={() => {
              const text = `××× ××××§×ª AutoLog\n${vehicleLabel} (${v.licensePlate})\n×¦×××: ${score}/100\n${window.location.href}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }}>
            ×©×× ××××××¡××¤
          </Button>
        </div>
      </Card>

      {/* ===== FOOTER ===== */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <LogoIcon size={20} />
          <span className="text-xs">××× × ××¦×¨ ××××¦×¢××ª AutoLog</span>
        </div>
        <p className="text-xs text-gray-300 mt-1">×××× ×××: {inspection.id.slice(0, 8)}</p>
      </div>
    </div>
  );
}
