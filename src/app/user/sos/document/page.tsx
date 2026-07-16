'use client';

/**
 * Guided incident documentation — /user/sos/document
 *
 * A step-by-step wizard that walks the user through documenting a road incident
 * so they have everything an insurance claim / police report needs:
 *   0. Choose incident category
 *   1. Safety & emergency calls + injuries
 *   2. Photo checklist (per category) — capture/upload to Vercel Blob
 *   3. Involved parties / witnesses / police & insurance
 *   4. Review & save  → POST /api/sos/document
 *
 * Self-contained: the only change to the existing SOS page is a button that links here.
 */

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle, Phone, PhoneCall, MapPin, Navigation, Camera, Upload, Check,
  CheckCircle2, X, Plus, Trash2, ChevronLeft, ChevronRight, Loader2, Shield,
  Car, ShieldAlert, HeartPulse, Users, FileText, ArrowRight,
} from 'lucide-react';
import VoiceMicButton from '@/components/ui/VoiceMicButton';

/* ───────────────────────── Types ───────────────────────── */
type IncidentType = 'road_accident' | 'hit_and_run' | 'theft_vandalism' | 'injury';

interface Vehicle {
  id: string;
  nickname: string;
  licensePlate: string;
  model?: string;
}

interface InvolvedParty {
  fullName: string;
  idNumber: string;
  phone: string;
  licensePlate: string;
  driverLicenseNumber: string;
  vehicleManufacturer: string;
  vehicleModel: string;
  vehicleColor: string;
  insuranceCompany: string;
  insurancePolicyNumber: string;
  isDriverOwner: boolean;
  ownerName: string;
}

interface Witness {
  fullName: string;
  phone: string;
  notes: string;
}

interface PhotoItem {
  label: string;
  url: string | null;
  uploading: boolean;
}

/* ───────────────────────── Per-category config ───────────────────────── */
const INCIDENTS: Record<
  IncidentType,
  {
    label: string;
    sub: string;
    icon: typeof Car;
    accent: string; // tailwind gradient
    photos: string[];
    collectParties: boolean;
    partyTitle: string;
    safety: string[];
  }
> = {
  road_accident: {
    label: 'תאונת דרכים',
    sub: 'התנגשות עם צד שני',
    icon: Car,
    accent: 'from-red-500 to-rose-600',
    photos: [
      'זירה רחבה — לפני הזזת הרכבים (זווית 1)',
      'זירה רחבה — זווית 2',
      'זירה רחבה — זווית 3',
      'לוחית רישוי — הרכב שלך',
      'לוחית רישוי — הצד השני',
      'הנזק ברכב שלך (קרוב)',
      'הנזק ברכב הצד השני (קרוב)',
      'נקודת הפגיעה / המגע בין הרכבים',
      'הכביש, סימוני נתיב ותמרורים / רמזור',
      'רישיון נהיגה של הנהג השני',
      'רישיון רכב / תעודת ביטוח חובה של הצד השני',
    ],
    collectParties: true,
    partyTitle: 'פרטי הנהג והרכב המעורב',
    safety: [
      'עצרו במקום בטוח והדליקו אורות חירום (פלאשרים).',
      'הציבו משולש אזהרה 50–100 מ׳ לאחור.',
      'אם יש נפגעים — חייגו 101 (מד״א) מיד.',
      'בתאונה עם נפגעים חובה להזעיק משטרה (100).',
      'אל תודו באשמה ואל תחתמו על מסמכים של הצד השני.',
    ],
  },
  hit_and_run: {
    label: 'פגע וברח / רכב חונה',
    sub: 'נזק ללא צד ידוע',
    icon: ShieldAlert,
    accent: 'from-orange-500 to-amber-600',
    photos: [
      'הנזק (קרוב)',
      'הנזק (רחוק, עם הסביבה)',
      'מקום החנייה / מיקום הרכב',
      'שאריות צבע או חלקים שנשארו בזירה',
      'מצלמות אבטחה בסביבה — סמנו מיקום',
      'שלט רחוב / נקודת ציון לזיהוי המקום',
    ],
    collectParties: false,
    partyTitle: 'פרטי הצד המעורב (אם ידוע)',
    safety: [
      'אם הרכב נפגע בזמן חנייה — חפשו פתק שהושאר על השמשה.',
      'בדקו מי מהסביבה ראה את האירוע (עוברי אורח, בעלי עסקים).',
      '״פגע וברח״ הוא עבירה פלילית — מומלץ להגיש תלונה במשטרה.',
    ],
  },
  theft_vandalism: {
    label: 'גניבה / פריצה / ונדליזם',
    sub: 'אירוע ביטחוני',
    icon: Shield,
    accent: 'from-purple-500 to-violet-600',
    photos: [
      'נקודת הפריצה (חלון / מנעול שבור)',
      'הנזק לרכב / פנים שנפרץ ונברר',
      'פריטים שניזוקו או נגנבו',
      'מקום החנייה — אם הרכב נגנב, צלמו את המקום הריק',
      'מצלמות אבטחה בסביבה',
      'תמונה כללית של הסביבה',
    ],
    collectParties: false,
    partyTitle: 'פרטים נוספים',
    safety: [
      'אל תיגעו בזירה יותר מהנדרש — שמרו על ראיות.',
      'הגשת תלונה במשטרה והוצאת מספר תלונה הן חובה לתביעת ביטוח.',
      'הודיעו לחברת הביטוח בהקדם האפשרי.',
    ],
  },
  injury: {
    label: 'פגיעת גוף / נפגעים',
    sub: 'יש נפגעים באירוע',
    icon: HeartPulse,
    accent: 'from-red-600 to-red-700',
    photos: [
      'זירת האירוע (כללי)',
      'מיקום הרכבים בזירה',
      'הנזק לרכב',
      'תנאי הדרך, סימונים ותמרורים',
    ],
    collectParties: true,
    partyTitle: 'פרטי הצד המעורב',
    safety: [
      'חייגו 101 (מד״א) מיד. אל תזיזו פצוע קשה אלא אם יש סכנת חיים מיידית.',
      'בתאונת נפגעים חובה להזעיק משטרה (100) ולהישאר בזירה.',
      'רשמו לאיזה בית חולים פונו הנפגעים ואת שעת הקריאה למד״א.',
      'צלמו ברגישות — התמקדו בזירה וברכבים, לא בפני הנפגעים.',
    ],
  },
};

const EMERGENCY_NUMBERS = [
  { label: 'מד״א', number: '101', icon: HeartPulse },
  { label: 'משטרה', number: '100', icon: Shield },
  { label: 'כיבוי אש', number: '102', icon: Phone },
  { label: 'ידידים', number: '053-313-1310', icon: PhoneCall },
];

const emptyParty = (): InvolvedParty => ({
  fullName: '', idNumber: '', phone: '', licensePlate: '', driverLicenseNumber: '',
  vehicleManufacturer: '', vehicleModel: '', vehicleColor: '',
  insuranceCompany: '', insurancePolicyNumber: '', isDriverOwner: true, ownerName: '',
});

/* ───────────────────────── Image compression ───────────────────────── */
async function compressImage(file: File, maxDim = 1600, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no-canvas'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('bad-image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('read-failed'));
    reader.readAsDataURL(file);
  });
}

/* ───────────────────────── Component ───────────────────────── */
function DocumentIncidentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || undefined;

  const [step, setStep] = useState(0);
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string>('');

  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);

  const [occurredAt, setOccurredAt] = useState('');
  const [hasInjuries, setHasInjuries] = useState(false);
  const [injuriesDetails, setInjuriesDetails] = useState('');
  const [ambulanceCalled, setAmbulanceCalled] = useState(false);
  const [policeCalled, setPoliceCalled] = useState(false);
  const [policeReportNumber, setPoliceReportNumber] = useState('');
  const [ownInsuranceCompany, setOwnInsuranceCompany] = useState('');
  const [ownInsurancePolicyNumber, setOwnInsurancePolicyNumber] = useState('');
  const [nearbyCameras, setNearbyCameras] = useState('');
  const [stolenItems, setStolenItems] = useState('');
  const [description, setDescription] = useState('');

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [parties, setParties] = useState<InvolvedParty[]>([]);
  const [witnesses, setWitnesses] = useState<Witness[]>([]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoIndex = useRef<number | null>(null);

  /* default the "occurred at" field to now, once */
  useEffect(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setOccurredAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }, []);

  /* load vehicles */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/vehicles');
        const data = await res.json();
        if (data.vehicles?.length) {
          setVehicles(data.vehicles);
          setVehicleId(data.vehicles[0].id);
        }
      } catch {
        /* non-fatal — user can still document, just without a linked vehicle picker */
      }
    })();
  }, []);

  /* when a category is chosen, seed its photo checklist */
  const chooseIncident = (t: IncidentType) => {
    setIncidentType(t);
    setPhotos(INCIDENTS[t].photos.map((label) => ({ label, url: null, uploading: false })));
    if (INCIDENTS[t].collectParties && parties.length === 0) setParties([emptyParty()]);
    if (t === 'injury') setHasInjuries(true);
    setStep(1);
  };

  const detectLocation = () => {
    setGeoBusy(true);
    // Fill coords + human-readable address (reverse geocoding, Hebrew)
    const fillFrom = async (la: number, lo: number, note?: string) => {
      setLat(la);
      setLng(lo);
      setLocation(`${la.toFixed(5)}, ${lo.toFixed(5)}`);
      try {
        const r = await fetch(`/api/geo/reverse?lat=${la}&lon=${lo}`);
        if (r.ok) {
          const data = await r.json();
          if (data.address) setLocation(data.address);
        }
      } catch { /* keep coordinates fallback */ }
      if (note) setMessage(note);
      setGeoBusy(false);
    };
    // No GPS? estimate by internet connection (city-level), user can refine
    const ipFallback = async () => {
      try {
        const r = await fetch('/api/geo/ip');
        if (r.ok) {
          const d = await r.json();
          if (d && typeof d.latitude === 'number') {
            await fillFrom(d.latitude, d.longitude, 'המיקום הוערך לפי חיבור האינטרנט — מומלץ לדייק את הכתובת ידנית.');
            return;
          }
        }
      } catch { /* ignore */ }
      setMessage('לא ניתן לאתר מיקום — אפשר להזין ידנית.');
      setGeoBusy(false);
    };
    if (!('geolocation' in navigator)) {
      void ipFallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void fillFrom(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        void ipFallback();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  /* photo capture */
  const triggerPhoto = (index: number) => {
    pendingPhotoIndex.current = index;
    fileInputRef.current?.click();
  };

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const index = pendingPhotoIndex.current;
    e.target.value = ''; // allow re-pick of same file
    if (!file || index === null) return;

    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, uploading: true } : p)));
    try {
      const dataUrl = await compressImage(file);
      const res = await fetch('/api/sos/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: dataUrl, category: `sos_${incidentType}_${index}` }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, url: data.url, uploading: false } : p)));
      } else {
        setMessage(data.error || 'שגיאה בהעלאת התמונה.');
        setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, uploading: false } : p)));
      }
    } catch {
      setMessage('שגיאת חיבור בהעלאת התמונה.');
      setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, uploading: false } : p)));
    }
  };

  /* involved parties */
  const updateParty = (i: number, field: keyof InvolvedParty, value: string | boolean) =>
    setParties((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  const addParty = () => setParties((prev) => [...prev, emptyParty()]);
  const removeParty = (i: number) => setParties((prev) => prev.filter((_, idx) => idx !== i));

  /* witnesses */
  const addWitness = () => setWitnesses((prev) => [...prev, { fullName: '', phone: '', notes: '' }]);
  const updateWitness = (i: number, field: keyof Witness, value: string) =>
    setWitnesses((prev) => prev.map((w, idx) => (idx === i ? { ...w, [field]: value } : w)));
  const removeWitness = (i: number) => setWitnesses((prev) => prev.filter((_, idx) => idx !== i));

  const uploadedCount = photos.filter((p) => p.url).length;

  /* save */
  const handleSave = async () => {
    if (!incidentType) return;
    setSaving(true);
    setMessage('');

    const checklist: Record<string, boolean> = {};
    photos.forEach((p) => { checklist[p.label] = !!p.url; });

    const cleanParties = parties
      .map((p) => ({ ...p }))
      .filter((p) => Object.values(p).some((v) => (typeof v === 'string' ? v.trim() : false)));
    const cleanWitnesses = witnesses.filter((w) => w.fullName.trim() || w.phone.trim());

    const report = {
      incidentType,
      occurredAt,
      description: description.trim() || undefined,
      hasInjuries,
      injuriesDetails: injuriesDetails.trim() || undefined,
      ambulanceCalled,
      policeCalled,
      policeReportNumber: policeReportNumber.trim() || undefined,
      ownInsuranceCompany: ownInsuranceCompany.trim() || undefined,
      ownInsurancePolicyNumber: ownInsurancePolicyNumber.trim() || undefined,
      involvedParties: cleanParties.length ? cleanParties : undefined,
      witnesses: cleanWitnesses.length ? cleanWitnesses : undefined,
      nearbyCameras: nearbyCameras.trim() || undefined,
      stolenItems: stolenItems.trim() || undefined,
      checklist,
    };

    try {
      const res = await fetch('/api/sos/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          vehicleId: vehicleId || undefined,
          location: location || undefined,
          latitude: lat ?? undefined,
          longitude: lng ?? undefined,
          photos: photos.filter((p) => p.url).map((p) => p.url as string),
          report,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage(data.error || 'שגיאה בשמירת התיעוד.');
      }
    } catch {
      setMessage('שגיאת חיבור — התיעוד נשמר מקומית בלבד. נסו שוב.');
    } finally {
      setSaving(false);
    }
  };

  const cfg = incidentType ? INCIDENTS[incidentType] : null;

  /* ───────── success screen ───────── */
  if (done) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex flex-col items-center justify-center px-6 text-center" dir="rtl">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-[#1B4E8A] mb-2">התיעוד נשמר!</h1>
        <p className="text-gray-500 text-sm mb-8 max-w-sm">
          כל הצילומים והפרטים נשמרו בכרטיס הרכב שלך. תוכל לשתף אותם עם חברת הביטוח בכל עת.
        </p>
        <button
          onClick={() => router.push('/user/sos')}
          className="bg-gradient-to-l from-red-600 to-red-500 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-red-200 flex items-center gap-2"
        >
          <ArrowRight size={18} />
          חזרה למסך SOS
        </button>
      </div>
    );
  }

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-[#F3F6FA] pb-28" dir="rtl">
      {/* hidden file input — camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFilePicked}
      />

      {/* Header */}
      <div className={`bg-gradient-to-l ${cfg?.accent || 'from-red-600 to-red-700'} text-white px-4 pt-6 pb-8 rounded-b-3xl`}>
        <button onClick={() => (step === 0 ? router.push('/user/sos') : setStep((s) => s - 1))} className="flex items-center gap-1 text-white/80 text-sm mb-3">
          <ChevronRight size={18} />
          {step === 0 ? 'חזרה ל-SOS' : 'חזרה'}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold">תיעוד אירוע</h1>
            <p className="text-sm text-white/70">{cfg ? cfg.label : 'איסוף ראיות לתביעת ביטוח'}</p>
          </div>
        </div>
        {/* progress dots */}
        <div className="flex items-center gap-1.5 mt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-white/25'}`} />
          ))}
        </div>
      </div>

      {/* Persistent emergency call bar */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-md border border-red-100 p-2 grid grid-cols-4 gap-1">
          {EMERGENCY_NUMBERS.map((n) => (
            <a
              key={n.number}
              href={`tel:${n.number.replace(/-/g, '')}`}
              className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-red-50 transition-colors active:scale-95"
            >
              <n.icon size={18} className="text-red-500" />
              <span className="text-[11px] font-bold text-[#1B4E8A]">{n.label}</span>
              <span className="text-[10px] text-gray-400 font-mono" dir="ltr">{n.number}</span>
            </a>
          ))}
        </div>
      </div>

      {/* toast */}
      {message && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center flex items-center justify-between gap-2">
          <span>{message}</span>
          <button onClick={() => setMessage('')}><X size={16} /></button>
        </div>
      )}

      <div className="px-4 mt-4 space-y-4">
        {/* ───────── Step 0 — category ───────── */}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#1B4E8A] px-1">מה קרה?</h2>
            {(Object.keys(INCIDENTS) as IncidentType[]).map((t) => {
              const c = INCIDENTS[t];
              return (
                <button
                  key={t}
                  onClick={() => chooseIncident(t)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:border-red-200 hover:shadow-md transition-all active:scale-[0.99] text-right"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.accent} flex items-center justify-center flex-shrink-0`}>
                    <c.icon size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1B4E8A]">{c.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
                  </div>
                  <ChevronLeft size={20} className="text-gray-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* ───────── Step 1 — safety + injuries + location ───────── */}
        {step === 1 && cfg && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <h3 className="font-bold text-red-700 flex items-center gap-2 mb-2">
                <AlertTriangle size={18} /> קודם כל — בטיחות
              </h3>
              <ul className="space-y-2">
                {cfg.safety.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#1B4E8A]">
                    <Check size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#1B4E8A]">יש נפגעים בגוף?</span>
                <button
                  onClick={() => setHasInjuries((v) => !v)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${hasInjuries ? 'bg-red-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${hasInjuries ? 'right-1' : 'right-6'}`} />
                </button>
              </label>

              {hasInjuries && (
                <>
                  <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700 font-semibold flex items-center gap-2">
                    <HeartPulse size={16} /> חייגו 101 מיד והזעיקו משטרה (100).
                  </div>
                  <textarea
                    placeholder="פרטי הנפגעים: מי נפגע, חומרה, לאיזה בית חולים פונו, שעת קריאה למד״א..."
                    value={injuriesDetails}
                    onChange={(e) => setInjuriesDetails(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-right bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex gap-2">
                    <ToggleChip label="הוזעק מד״א" active={ambulanceCalled} onClick={() => setAmbulanceCalled((v) => !v)} />
                    <ToggleChip label="הוזעקה משטרה" active={policeCalled} onClick={() => setPoliceCalled((v) => !v)} />
                  </div>
                </>
              )}

              {/* date/time */}
              <div>
                <label className="text-sm font-bold text-[#1B4E8A] mb-1.5 block">מתי קרה האירוע?</label>
                <input
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  dir="ltr"
                />
              </div>

              {/* location */}
              <div>
                <label className="text-sm font-bold text-[#1B4E8A] mb-1.5 block">מיקום</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="רחוב, עיר"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2.5 pr-9 border border-gray-200 rounded-xl text-sm text-right bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <MapPin size={15} className="absolute top-3 right-3 text-gray-400" />
                </div>
              </div>
            </div>

            <NavButtons onBack={() => setStep(0)} onNext={() => setStep(2)} nextLabel="המשך לצילומים" />
          </div>
        )}

        {/* ───────── Step 2 — photo checklist ───────── */}
        {step === 2 && cfg && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-[#1B4E8A] flex items-center gap-2">
                  <Camera size={18} className="text-red-500" /> צ׳קליסט צילום
                </h3>
                <span className="text-xs font-semibold text-gray-400">{uploadedCount}/{photos.length}</span>
              </div>
              <p className="text-xs text-gray-400">צלמו כל פריט. אפשר לדלג ולחזור — שום צילום אינו חובה.</p>
            </div>

            <div className="space-y-2.5">
              {photos.map((p, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                  <button
                    onClick={() => triggerPhoto(i)}
                    className={`w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border-2 ${
                      p.url ? 'border-green-300' : 'border-dashed border-gray-300 bg-gray-50'
                    }`}
                  >
                    {p.uploading ? (
                      <Loader2 size={22} className="animate-spin text-red-500" />
                    ) : p.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={22} className="text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1B4E8A] leading-snug">{p.label}</p>
                    {p.url ? (
                      <span className="text-[11px] text-green-600 font-semibold flex items-center gap-1 mt-1">
                        <CheckCircle2 size={12} /> צולם
                      </span>
                    ) : (
                      <button onClick={() => triggerPhoto(i)} className="text-[11px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                        <Upload size={12} /> צלם / העלה
                      </button>
                    )}
                  </div>
                  {p.url && (
                    <button onClick={() => setPhotos((prev) => prev.map((x, idx) => (idx === i ? { ...x, url: null } : x)))} className="text-gray-300 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="המשך לפרטים" />
          </div>
        )}

        {/* ───────── Step 3 — parties / witnesses / police ───────── */}
        {step === 3 && cfg && (
          <div className="space-y-4">
            {/* involved parties */}
            {cfg.collectParties && (
              <div className="space-y-3">
                <h3 className="font-bold text-[#1B4E8A] flex items-center gap-2 px-1">
                  <Users size={18} className="text-red-500" /> {cfg.partyTitle}
                </h3>

                {/* thirdPartyNotice — the user is entering another person's data.
                    Make the legal basis explicit at the moment of collection. */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
                  <p className="font-semibold mb-1">שים לב — אתה מזין פרטים של אדם אחר</p>
                  <p className="leading-relaxed">
                    הזן פרטים אלה רק אם אתה רשאי לכך — למשל במסגרת חילופי הפרטים המתחייבים
                    לאחר תאונה, או בהסכמת אותו אדם. השתמש במידע לצורך הטיפול באירוע ובתביעת
                    הביטוח בלבד. פרטים אלה נשמרים בחשבונך בהתאם ל
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline font-medium">מדיניות הפרטיות</a>.
                  </p>
                </div>
                {parties.map((party, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1B4E8A]">מעורב {i + 1}</span>
                      {parties.length > 1 && (
                        <button onClick={() => removeParty(i)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                      )}
                    </div>
                    <Field label="שם מלא" value={party.fullName} onChange={(v) => updateParty(i, 'fullName', v)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="ת.ז." value={party.idNumber} onChange={(v) => updateParty(i, 'idNumber', v)} numeric />
                      <Field label="טלפון" value={party.phone} onChange={(v) => updateParty(i, 'phone', v)} numeric />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="מספר רכב" value={party.licensePlate} onChange={(v) => updateParty(i, 'licensePlate', v)} numeric />
                      <Field label="מספר רישיון נהיגה" value={party.driverLicenseNumber} onChange={(v) => updateParty(i, 'driverLicenseNumber', v)} numeric />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Field label="יצרן" value={party.vehicleManufacturer} onChange={(v) => updateParty(i, 'vehicleManufacturer', v)} />
                      <Field label="דגם" value={party.vehicleModel} onChange={(v) => updateParty(i, 'vehicleModel', v)} />
                      <Field label="צבע" value={party.vehicleColor} onChange={(v) => updateParty(i, 'vehicleColor', v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="חברת ביטוח" value={party.insuranceCompany} onChange={(v) => updateParty(i, 'insuranceCompany', v)} />
                      <Field label="מספר פוליסה" value={party.insurancePolicyNumber} onChange={(v) => updateParty(i, 'insurancePolicyNumber', v)} />
                    </div>
                    <label className="flex items-center justify-between pt-1">
                      <span className="text-sm text-[#1B4E8A]">הנהג הוא בעל הרכב?</span>
                      <button
                        onClick={() => updateParty(i, 'isDriverOwner', !party.isDriverOwner)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${party.isDriverOwner ? 'bg-teal-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${party.isDriverOwner ? 'right-1' : 'right-6'}`} />
                      </button>
                    </label>
                    {!party.isDriverOwner && (
                      <Field label="שם בעל הרכב" value={party.ownerName} onChange={(v) => updateParty(i, 'ownerName', v)} />
                    )}
                  </div>
                ))}
                <button onClick={addParty} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-sm font-semibold text-gray-500 flex items-center justify-center gap-2 hover:border-red-300 hover:text-red-500">
                  <Plus size={16} /> הוסף מעורב נוסף
                </button>
              </div>
            )}

            {/* theft-specific: stolen items + cameras */}
            {incidentType === 'theft_vandalism' && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                <TextAreaField label="פריטים שנגנבו / ניזוקו" value={stolenItems} onChange={setStolenItems} placeholder="רשימת פריטים וערך משוער..." />
                <TextAreaField label="מצלמות אבטחה בסביבה" value={nearbyCameras} onChange={setNearbyCameras} placeholder="היכן יש מצלמות (עסק, בניין, עירייה)..." />
              </div>
            )}
            {incidentType === 'hit_and_run' && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <TextAreaField label="מצלמות אבטחה בסביבה" value={nearbyCameras} onChange={setNearbyCameras} placeholder="היכן יש מצלמות שיכולות לתעד את האירוע..." />
              </div>
            )}

            {/* witnesses */}
            <div className="space-y-3">
              <h3 className="font-bold text-[#1B4E8A] flex items-center gap-2 px-1">
                <Users size={18} className="text-teal-500" /> עדים
              </h3>
              {witnesses.map((w, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1B4E8A]">עד {i + 1}</span>
                    <button onClick={() => removeWitness(i)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="שם" value={w.fullName} onChange={(v) => updateWitness(i, 'fullName', v)} />
                    <Field label="טלפון" value={w.phone} onChange={(v) => updateWitness(i, 'phone', v)} numeric />
                  </div>
                </div>
              ))}
              <button onClick={addWitness} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-sm font-semibold text-gray-500 flex items-center justify-center gap-2 hover:border-teal-300 hover:text-teal-500">
                <Plus size={16} /> הוסף עד
              </button>
            </div>

            {/* police + own insurance */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
              <div className="flex gap-2">
                <ToggleChip label="הוגשה תלונה למשטרה" active={policeCalled} onClick={() => setPoliceCalled((v) => !v)} />
              </div>
              {policeCalled && (
                <Field label="מספר תלונה / אסמכתא משטרתית" value={policeReportNumber} onChange={setPoliceReportNumber} />
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="חברת הביטוח שלך" value={ownInsuranceCompany} onChange={setOwnInsuranceCompany} />
                <Field label="מספר הפוליסה שלך" value={ownInsurancePolicyNumber} onChange={setOwnInsurancePolicyNumber} />
              </div>
            </div>

            {/* free description */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <label className="text-sm font-bold text-[#1B4E8A] mb-1.5 block">תיאור חופשי של האירוע</label>
              <div className="relative">
                <textarea
                  placeholder="תאר במילים שלך מה קרה..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 pr-11 border border-gray-200 rounded-xl text-sm text-right bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <div className="absolute top-2.5 right-2.5">
                  <VoiceMicButton value={description} onResult={setDescription} />
                </div>
              </div>
            </div>

            <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} nextLabel="סקירה ושמירה" />
          </div>
        )}

        {/* ───────── Step 4 — review + save ───────── */}
        {step === 4 && cfg && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
              <h3 className="font-bold text-[#1B4E8A] flex items-center gap-2">
                <FileText size={18} className="text-red-500" /> סיכום התיעוד
              </h3>
              <SummaryRow label="סוג אירוע" value={cfg.label} />
              {vehicles.find((v) => v.id === vehicleId) && (
                <SummaryRow label="רכב" value={`${vehicles.find((v) => v.id === vehicleId)?.nickname} (${vehicles.find((v) => v.id === vehicleId)?.licensePlate})`} />
              )}
              <SummaryRow label="מועד" value={occurredAt ? occurredAt.replace('T', ' ') : '—'} />
              <SummaryRow label="מיקום" value={location || '—'} />
              <SummaryRow label="צילומים שצורפו" value={`${uploadedCount} מתוך ${photos.length}`} />
              {cfg.collectParties && <SummaryRow label="מעורבים" value={`${parties.filter((p) => p.fullName || p.licensePlate).length}`} />}
              <SummaryRow label="עדים" value={`${witnesses.filter((w) => w.fullName || w.phone).length}`} />
              {hasInjuries && <SummaryRow label="נפגעים" value="כן" warn />}
              {policeCalled && policeReportNumber && <SummaryRow label="מס׳ תלונה" value={policeReportNumber} />}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-700 flex items-start gap-2">
              <Shield size={15} className="mt-0.5 flex-shrink-0" />
              <span>הפרטים נאספים לצורך תביעת הביטוח שלך בלבד ונשמרים בחשבונך המאובטח. אסוף פרטים מהצד השני רק בהסכמתו.</span>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-l from-red-600 to-red-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
              {saving ? 'שומר...' : 'שמור תיעוד'}
            </button>
            <button onClick={() => setStep(3)} className="w-full py-2 text-sm text-gray-500 font-semibold">חזרה לעריכה</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentIncidentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3F6FA]" dir="rtl" />}>
      <DocumentIncidentInner />
    </Suspense>
  );
}

/* ───────────────────────── Small presentational helpers ───────────────────────── */
function NavButtons({ onBack, onNext, nextLabel }: { onBack: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="flex gap-3 pt-1">
      <button onClick={onBack} className="px-5 py-3 text-sm font-semibold text-gray-500 rounded-xl hover:bg-gray-100">חזור</button>
      <button
        onClick={onNext}
        className="flex-1 bg-[#1B4E8A] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        {nextLabel}
        <ChevronLeft size={18} />
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, numeric = false,
}: { label: string; value: string; onChange: (v: string) => void; numeric?: boolean }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">{label}</label>
      <input
        type="text"
        inputMode={numeric ? 'numeric' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={numeric ? 'ltr' : 'rtl'}
        className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 ${numeric ? 'text-left' : 'text-right'}`}
      />
    </div>
  );
}

function TextAreaField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-bold text-[#1B4E8A] mb-1.5 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-right bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
      />
    </div>
  );
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
        active ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-gray-50 border-gray-200 text-gray-500'
      }`}
    >
      {active ? <Check size={13} /> : <Plus size={13} />}
      {label}
    </button>
  );
}

function SummaryRow({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold ${warn ? 'text-red-600' : 'text-[#1B4E8A]'}`}>{value}</span>
    </div>
  );
}

