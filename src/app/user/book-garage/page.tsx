'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import {
  MapPin, Star, Phone, Search, Calendar, ChevronRight,
  Loader2, Check, AlertCircle, CheckCircle2, Building2,
  ArrowUpDown, SlidersHorizontal, X, MessageSquare,
  Wrench, ClipboardCheck, Car, Settings2, ArrowRight,
  Clock, MapIcon, FileText, Coffee, Wifi, Monitor, Heart, Armchair, ChevronDown
} from 'lucide-react';
import VoiceMicButton from '@/components/ui/VoiceMicButton';

interface GarageReview {
  id: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface WorkingHoursDay {
  open: string;
  close: string;
  closed?: boolean;
}

interface Garage {
  id: string;
  name: string;
  city: string;
  address?: string;
  rating: number;
  reviewCount: number;
  services: string[];
  phone: string;
  isPartner: boolean;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null;
  amenities?: string[];
  reviews?: GarageReview[];
  workingHours?: string | Record<string, WorkingHoursDay> | null;
}

const amenityLabels: Record<string, { label: string; icon: typeof Coffee }> = {
  coffee: { label: 'קפה', icon: Coffee },
  shuttle: { label: 'הסעות', icon: Car },
  wifi: { label: 'WiFi', icon: Wifi },
  waiting_room: { label: 'חדר המתנה', icon: Armchair },
  tv: { label: 'טלויזיה', icon: Monitor },
  children_area: { label: 'פינת ילדים', icon: Heart },
};

interface Vehicle {
  id: string;
  nickname: string;
  manufacturer: string;
  model: string;
  year: number;
  licensePlate: string;
}

// Service types with Hebrew labels, English values, emojis, and pricing
const serviceOptions = [
  { value: 'inspection', label: 'בדיקת AutoLog', emoji: '🔍', description: 'בדיקה מקיפה של 200+ פרמטרים עם דוח AI', price: '₪350', addon: '+ ₪100 בדיקת מחשב' },
  { value: 'test_prep', label: 'הכנה לטסט', emoji: '🧪', description: 'הכנת הרכב לטסט שנתי', price: '₪250' },
  { value: 'repair', label: 'אבחון תקלות', emoji: '🛠️', description: 'אבחון ואיתור תקלות ברכב', price: '₪150' },
  { value: 'maintenance', label: 'טיפול תקופתי', emoji: '🔧', description: 'טיפול שוטף ותחזוקה מונעת', price: 'החל מ-₪550' },
];

const serviceValueToLabel: Record<string, string> = {
  inspection: 'בדיקה', maintenance: 'טיפול', repair: 'תיקון', test_prep: 'הכנה לטסט',
  oil_change: 'החלפת שמן', tires: 'צמיגים', brakes: 'בלמים', diagnostics: 'אבחון',
  bodywork: 'פחחות', electrical: 'חשמל', ac: 'מיזוג', lights_mirrors: 'פנסים ומראות',
  spare_parts: 'חלקי חילוף',
};

const ALL_TIME_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

/** Map JS getDay() (0=Sun) to Hebrew day keys used in garage workingHours */
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Filter time slots based on the selected garage's working hours for a given date.
 * Returns only slots that fall within the garage's open–close range.
 * If no working hours data is available, returns all slots (backward compatible).
 */
function getAvailableTimeSlots(garage: Garage | undefined, dateStr: string): { slots: string[]; closed: boolean; hours?: { open: string; close: string } } {
  if (!garage || !dateStr) return { slots: ALL_TIME_SLOTS, closed: false };

  // Parse workingHours — could be a JSON string or already an object
  let wh: Record<string, WorkingHoursDay> | null = null;
  if (typeof garage.workingHours === 'string') {
    try { wh = JSON.parse(garage.workingHours); } catch { /* ignore */ }
  } else if (garage.workingHours && typeof garage.workingHours === 'object') {
    wh = garage.workingHours as Record<string, WorkingHoursDay>;
  }

  if (!wh) return { slots: ALL_TIME_SLOTS, closed: false };

  // Determine day of week from the selected date
  const date = new Date(dateStr + 'T00:00:00');
  const dayIndex = date.getDay(); // 0 = Sunday
  const dayKey = DAY_KEYS[dayIndex];
  const dayData = wh[dayKey];

  if (!dayData) return { slots: ALL_TIME_SLOTS, closed: false };

  // Check if closed
  if (dayData.closed || (dayData.open === '00:00' && dayData.close === '00:00')) {
    return { slots: [], closed: true };
  }

  const open = dayData.open || '08:00';
  const close = dayData.close || '18:00';

  const filtered = ALL_TIME_SLOTS.filter(slot => slot >= open && slot < close);
  return { slots: filtered, closed: false, hours: { open, close } };
}

type SortOption = 'nearest' | 'rating' | 'reviewCount' | 'name';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface GarageListItem {
  id: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  specialties?: string[];
  rating?: number;
  isAutoLog?: boolean;
  [key: string]: unknown;
}

// Progress Bar Component - Mini dots showing steps
const ProgressBar = ({ currentStep }: { currentStep: number }) => {
  const steps = [1, 2, 3, 4];
  return (
    <div className="flex justify-center gap-2 mb-6">
      {steps.map(step => (
        <div
          key={step}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            step <= currentStep ? 'bg-teal-600' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

export default function BookGaragePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('nearest');
  const [filterCity, setFilterCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'idle'>('idle');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviewGarage, setReviewGarage] = useState<Garage | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [garageReviews, setGarageReviews] = useState<GarageReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Flow state: service → garages → booking details → success
  // Auto-select service from URL params (e.g., ?service=inspection)
  const [selectedService, setSelectedService] = useState<string>(searchParams.get('service') || '');
  const [selectedGarageId, setSelectedGarageId] = useState<string>('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState<'details' | 'success'>('details');
  const [bookingData, setBookingData] = useState({ vehicleId: '', date: '', time: '', notes: '' });
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Inline vehicle add for users with no vehicles (inspect flow)
  const [inlinePlate, setInlinePlate] = useState('');
  const [inlineLookingUp, setInlineLookingUp] = useState(false);
  const [inlineAdding, setInlineAdding] = useState(false);
  const [inlineLookupData, setInlineLookupData] = useState<{
    manufacturer: string; model: string; year: number; color?: string;
  } | null>(null);
  const [inlineError, setInlineError] = useState('');

  const selectedGarage = garages.find(g => g.id === selectedGarageId);

  // Fetch booked slots when garage + date are selected
  useEffect(() => {
    if (!selectedGarageId || !bookingData.date) {
      setBookedSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    fetch(`/api/garages/${selectedGarageId}/slots?date=${bookingData.date}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.bookedSlots) setBookedSlots(data.bookedSlots);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [selectedGarageId, bookingData.date]);
  const selectedVehicle = vehicles.find(v => v.id === bookingData.vehicleId);

  // Geolocation
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLocationStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLocationStatus('granted'); },
        () => { setLocationStatus('denied'); setUserLocation({ lat: 32.0853, lon: 34.7818 }); },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    } else {
      setLocationStatus('denied');
      setUserLocation({ lat: 32.0853, lon: 34.7818 });
    }
  }, []);

  // Sorted & filtered garages
  const sortedGarages = (() => {
    let list = [...garages];
    if (userLocation) {
      const cityDefaults: Record<string, { lat: number; lon: number }> = {
        'תל אביב': { lat: 32.0853, lon: 34.7818 }, 'חיפה': { lat: 32.7940, lon: 34.9896 },
        'ירושלים': { lat: 31.7683, lon: 35.2137 }, 'באר שבע': { lat: 31.2530, lon: 34.7915 },
        'רמת גן': { lat: 32.0680, lon: 34.8241 }, 'פתח תקווה': { lat: 32.0841, lon: 34.8878 },
      };
      list = list.map(g => {
        if (g.latitude && g.longitude) return { ...g, distance: haversineKm(userLocation.lat, userLocation.lon, g.latitude, g.longitude) };
        const cc = cityDefaults[g.city];
        if (cc) return { ...g, distance: haversineKm(userLocation.lat, userLocation.lon, cc.lat, cc.lon) };
        return { ...g, distance: 999 };
      });
    }
    if (filterCity) list = list.filter(g => g.city === filterCity);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(g => g.name.toLowerCase().includes(s) || g.city.toLowerCase().includes(s));
    }
    if (sortBy === 'nearest') list.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'reviewCount') list.sort((a, b) => b.reviewCount - a.reviewCount);
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    return list;
  })();

  const fetchGarages = async () => {
    try {
      const res = await fetch(`/api/garages?limit=50`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.garages) {
        setGarages(data.garages.map((g: GarageListItem) => ({
          ...g,
          reviewCount: g.reviewCount || g._count?.reviews || 0,
          services: typeof g.services === 'string' ? (() => { try { return JSON.parse(g.services); } catch { return ['בדיקה']; } })() : g.services || ['בדיקה'],
          amenities: typeof g.amenities === 'string' ? (() => { try { return JSON.parse(g.amenities); } catch { return []; } })() : g.amenities || [],
        })));
      }
      if (data.cities) setCities(data.cities);
    } catch {}
  };

  useEffect(() => {
    Promise.all([
      fetchGarages(),
      fetch('/api/vehicles').then(r => r.json()).then(d => { if (d.vehicles?.length > 0) setVehicles(d.vehicles); }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const openBooking = (garage: Garage) => {
    setSelectedGarageId(garage.id);
    // Auto-select vehicle if user has exactly one
    const autoVehicleId = vehicles.length === 1 ? vehicles[0].id : '';
    setBookingData({ vehicleId: autoVehicleId, date: '', time: '', notes: '' });
    setShowNotesInput(false);
    setError('');
    setBookingStep('details');
    setShowBookingModal(true);
    // Reset inline vehicle add state
    setInlinePlate('');
    setInlineLookupData(null);
    setInlineError('');
  };

  // Inline lookup for users without vehicles
  const handleInlineLookup = async () => {
    const plate = inlinePlate.replace(/[-\s]/g, '');
    if (plate.length < 7) { setInlineError('יש להזין מספר רישוי תקין'); return; }
    setInlineLookingUp(true);
    setInlineError('');
    setInlineLookupData(null);
    try {
      const res = await fetch(`/api/vehicles/lookup?plate=${plate}`);
      const data = await res.json();
      if (res.ok && data.manufacturer) {
        setInlineLookupData({ manufacturer: data.manufacturer, model: data.model, year: data.year, color: data.color });
      } else {
        setInlineError(data.error || 'לא נמצאו נתונים לרכב זה');
      }
    } catch {
      setInlineError('שגיאת חיבור');
    } finally {
      setInlineLookingUp(false);
    }
  };

  // Auto-trigger inline lookup when plate is long enough
  useEffect(() => {
    const plate = inlinePlate.replace(/[-\s]/g, '');
    if (plate.length >= 7 && !inlineLookingUp && !inlineLookupData) {
      const timer = setTimeout(() => handleInlineLookup(), 600);
      return () => clearTimeout(timer);
    }
  }, [inlinePlate]);

  // Add vehicle inline and select it
  const handleInlineAddVehicle = async () => {
    if (!inlineLookupData) return;
    setInlineAdding(true);
    setInlineError('');
    try {
      const plate = inlinePlate.replace(/[-\s]/g, '');
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: `${inlineLookupData.manufacturer} ${inlineLookupData.model}`,
          licensePlate: plate,
          manufacturer: inlineLookupData.manufacturer,
          model: inlineLookupData.model,
          year: inlineLookupData.year,
          color: inlineLookupData.color || '',
          mileage: 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data.vehicle) {
        const newVehicle: Vehicle = {
          id: data.vehicle.id,
          nickname: data.vehicle.nickname,
          manufacturer: data.vehicle.manufacturer,
          model: data.vehicle.model,
          year: data.vehicle.year,
          licensePlate: data.vehicle.licensePlate,
        };
        setVehicles(prev => [...prev, newVehicle]);
        setBookingData(prev => ({ ...prev, vehicleId: data.vehicle.id }));
        // Clear inspect intent since they now have a vehicle
        try { localStorage.removeItem('autolog_user_intent'); } catch {}
      } else {
        setInlineError(data.error || 'שגיאה בהוספת הרכב');
      }
    } catch {
      setInlineError('שגיאת חיבור');
    } finally {
      setInlineAdding(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedGarageId || !selectedService || !bookingData.vehicleId || !bookingData.date || !bookingData.time) {
      setError('נא להשלים את כל השדות');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const appointmentDate = new Date(`${bookingData.date}T${bookingData.time}:00`);
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garageId: selectedGarageId,
          vehicleId: bookingData.vehicleId,
          serviceType: selectedService,
          date: appointmentDate.toISOString(),
          time: bookingData.time,
          notes: bookingData.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בהזמנת התור');
        setSubmitting(false);
        // Scroll to top of modal so error is visible
        modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setSubmitting(false);
      setShowBookingModal(false);
      toast.success('התור נקבע בהצלחה! המוסך יאשר בקרוב');
      router.push('/user');
    } catch {
      setError('שגיאת חיבור');
      setSubmitting(false);
      modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Review handlers
  const openReviewModal = (garage: Garage) => { setReviewGarage(garage); setReviewRating(0); setReviewComment(''); setShowReviewModal(true); };
  const openReviewsList = async (garage: Garage) => {
    setReviewGarage(garage); setGarageReviews([]); setShowReviewsModal(true);
    try { const res = await fetch(`/api/garages/${garage.id}/reviews`); const data = await res.json(); setGarageReviews(data.reviews || []); } catch {}
  };
  const handleSubmitReview = async () => {
    if (!reviewGarage || reviewRating < 1) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/garages/${reviewGarage.id}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating: reviewRating, comment: reviewComment }) });
      if (res.ok) { setShowReviewModal(false); fetchGarages(); }
    } catch {}
    setReviewSubmitting(false);
  };

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const sortLabels: Record<SortOption, string> = { nearest: 'הקרוב ביותר', rating: 'דירוג גבוה', reviewCount: 'הכי מדורגים', name: 'שם (א-ת)' };

  const StarRating = ({ rating, size = 16, interactive = false, onChange }: {
    rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void;
  }) => (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} disabled={!interactive} onClick={() => interactive && onChange?.(i)}
          className={interactive ? 'cursor-pointer hover:scale-110 transition' : ''}>
          <Star size={size} className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  );

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="bg-[#fef7ed] min-h-screen pb-24" dir="rtl">
      <PageHeader title="הזמן שירות" variant="teal" backUrl="/user/service" />

      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">

        {/* === STEP 1: Service Selection === */}
        {!selectedService && (
          <>
            <ProgressBar currentStep={1} />

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">באיזה שירות אתה מעוניין?</h2>
              <p className="text-sm text-gray-500 mb-5">בחר את סוג השירות ונציג לך מוסכים מתאימים</p>

              <div className="grid grid-cols-2 gap-4">
                {serviceOptions.map(service => (
                  <button
                    key={service.value}
                    onClick={() => setSelectedService(service.value)}
                    className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-200 hover:border-teal-600 transition-all text-center group relative overflow-hidden"
                  >
                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform inline-block">
                      {service.emoji}
                    </div>
                    <div className="font-bold text-gray-800 text-sm">{service.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{service.description}</div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-teal-600 font-bold text-sm">{service.price}</span>
                      {service.addon && (
                        <div className="text-[10px] text-gray-400 mt-0.5">{service.addon}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* === STEP 2: Garage Selection === */}
        {selectedService && !selectedGarageId && (
          <>
            <ProgressBar currentStep={2} />

            {/* Header with service context */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">בחר מוסך</h2>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">
                  שירות: <span className="font-semibold text-teal-600">{serviceValueToLabel[selectedService]}</span>
                </p>
                <button
                  onClick={() => setSelectedService('')}
                  className="text-xs text-gray-400 hover:text-teal-600 transition"
                >
                  (שנה)
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3 items-start">
              <div className="w-8 h-8 bg-[#1e3a5f]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText size={16} className="text-[#1e3a5f]" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs text-gray-600 leading-relaxed">
                  הבדיקה מציגה את מצב הרכב בפועל במועד ביצועה.
                  <span className="font-semibold text-gray-700"> AutoLog והמוסכים השותפים אינם נותנים אחריות על ממצאי הבדיקה או על מצב הרכב לאחריה.</span>
                </p>
              </div>
            </div>

            {/* Search */}
            <Input placeholder="חפש מוסך לפי שם או עיר..." icon={<Search size={16} />}
              value={search} onChange={e => setSearch(e.target.value)} />

            {/* Sort options */}
            <div className="flex gap-2 justify-end">
              {(['nearest', 'rating'] as SortOption[]).map(opt => (
                <button key={opt} onClick={() => setSortBy(opt)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                    sortBy === opt ? 'bg-teal-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
                  }`}>
                  {sortLabels[opt]}
                </button>
              ))}
            </div>

            {/* Garage List */}
            {sortedGarages.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-bold">לא נמצאו מוסכים</p>
                <p className="text-gray-400 text-sm mt-1">נסה לשנות את החיפוש או לבחור עיר אחרת</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedGarages.map(g => (
                  <div key={g.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                    {/* Garage info */}
                    <div className="p-4 pb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Building2 size={22} className="text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-gray-800 text-sm">{g.name}</h3>
                            {g.isPartner && <Badge variant="success" size="sm">שותף</Badge>}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={12} />
                            <span>{g.city}</span>
                            {g.distance != null && g.distance < 900 && (
                              <span className="text-teal-600 font-semibold">
                                • {g.distance < 1 ? `${Math.round(g.distance * 1000)} מ׳` : `${g.distance.toFixed(1)} ק״מ`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <StarRating rating={Math.round(g.rating)} size={13} />
                            <span className="text-xs font-bold text-gray-700">{g.rating > 0 ? g.rating.toFixed(1) : '—'}</span>
                            <button onClick={() => openReviewsList(g)} className="text-xs text-gray-400 hover:text-teal-600">
                              ({g.reviewCount})
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/70 border-t border-gray-100">
                      <button
                        onClick={() => openBooking(g)}
                        className="flex-1 bg-teal-600 text-white h-10 rounded-xl text-sm font-bold hover:bg-teal-700 transition flex items-center justify-center gap-1.5"
                      >
                        <Calendar size={14} />
                        הזמן תור
                      </button>
                      <button onClick={() => openReviewModal(g)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-teal-600 hover:border-teal-200 transition">
                        <MessageSquare size={15} />
                      </button>
                      {g.phone && (
                        <a href={`tel:${g.phone}`}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-teal-600 hover:border-teal-200 transition">
                          <Phone size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* === BOOKING MODAL === */}
      <Modal isOpen={showBookingModal} onClose={() => { setShowBookingModal(false); setBookingStep('details'); }}
        title={bookingStep === 'success' ? 'התור נקבע בהצלחה!' : `הזמנת תור`} size="lg">

        {bookingStep === 'success' ? (
          <div className="text-center py-8">
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse" />
                <CheckCircle2 size={80} className="text-green-600 relative" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">התור נקבע בהצלחה!</h3>
            <p className="text-gray-500 text-sm mb-6">המוסך יאשר את התור בקרוב ותקבל התראה</p>

            <div className="bg-[#fef7ed] rounded-2xl p-4 space-y-3 text-sm text-right mb-6">
              <div className="flex justify-between">
                <span className="font-bold text-gray-800">{selectedGarage?.name}</span>
                <span className="text-gray-600">מוסך:</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-800">{serviceOptions.find(s => s.value === selectedService)?.label || serviceValueToLabel[selectedService]}</span>
                <span className="text-gray-600">שירות:</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-teal-600">{serviceOptions.find(s => s.value === selectedService)?.price || ''}</span>
                <span className="text-gray-600">מחיר:</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-800">{selectedVehicle?.nickname}</span>
                <span className="text-gray-600">רכב:</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-800">{bookingData.date ? new Date(bookingData.date).toLocaleDateString('he-IL') : ''}</span>
                <span className="text-gray-600">תאריך:</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-800">{bookingData.time}</span>
                <span className="text-gray-600">שעה:</span>
              </div>
            </div>

            <Button onClick={() => { setShowBookingModal(false); setBookingStep('details'); setSelectedService(''); setSelectedGarageId(''); }} className="w-full">
              חזור לעמוד הבית
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
              </div>
            )}

            {/* Info Banner: Garage + Service */}
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 size={16} className="text-teal-600 flex-shrink-0" />
                <span className="text-gray-600">מוסך:</span>
                <span className="font-bold text-gray-800">{selectedGarage?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ClipboardCheck size={16} className="text-teal-600 flex-shrink-0" />
                <span className="text-gray-600">שירות:</span>
                <span className="font-bold text-gray-800">{serviceOptions.find(s => s.value === selectedService)?.label || serviceValueToLabel[selectedService]}</span>
                <span className="font-bold text-teal-600 mr-auto">{serviceOptions.find(s => s.value === selectedService)?.price}</span>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                {vehicles.length === 1 ? 'הרכב שלך' : 'בחר את הרכב שלך'}
              </label>
              {vehicles.length === 0 ? (
                <div className="bg-[#fef7ed] rounded-2xl border-2 border-dashed border-teal-300 p-4">
                  <p className="text-sm font-bold text-gray-800 mb-2">הזן מספר רכב לבדיקה</p>
                  <p className="text-xs text-gray-500 mb-3">נמצא את פרטי הרכב אוטומטית ממשרד התחבורה</p>
                  <div className="flex gap-2" dir="ltr">
                    <Input
                      placeholder="מספר רישוי"
                      value={inlinePlate}
                      onChange={e => { setInlinePlate(e.target.value); setInlineLookupData(null); setInlineError(''); }}
                      className="flex-1 text-center font-bold text-lg tracking-wider"
                      maxLength={10}
                    />
                  </div>
                  {inlineLookingUp && (
                    <div className="flex items-center gap-2 justify-center mt-3 text-teal-600">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-xs">מחפש נתוני רכב...</span>
                    </div>
                  )}
                  {inlineError && (
                    <div className="flex items-center gap-1.5 mt-3 text-red-600">
                      <AlertCircle size={14} />
                      <span className="text-xs">{inlineError}</span>
                    </div>
                  )}
                  {inlineLookupData && !bookingData.vehicleId && (
                    <div className="mt-3 bg-white rounded-xl p-3 border border-teal-200">
                      <div className="flex items-center gap-2 mb-2" dir="rtl">
                        <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                        <span className="text-sm font-bold text-gray-800">נמצא!</span>
                      </div>
                      <div className="text-sm text-gray-700" dir="rtl">
                        {inlineLookupData.manufacturer} {inlineLookupData.model} ({inlineLookupData.year})
                        {inlineLookupData.color && <span className="text-gray-500"> · {inlineLookupData.color}</span>}
                      </div>
                      <button
                        onClick={handleInlineAddVehicle}
                        disabled={inlineAdding}
                        className="mt-3 w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {inlineAdding ? (
                          <><Loader2 size={16} className="animate-spin" /> מוסיף...</>
                        ) : (
                          <><Check size={16} /> אשר והמשך</>
                        )}
                      </button>
                    </div>
                  )}
                  {bookingData.vehicleId && vehicles.length > 0 && (
                    <div className="mt-3 bg-teal-50 border-2 border-teal-600 rounded-xl p-3 flex items-center gap-3" dir="rtl">
                      <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check size={16} className="text-white" />
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-bold text-gray-800 text-sm">{vehicles[vehicles.length - 1]?.nickname}</div>
                        <div className="text-xs text-gray-500">{vehicles[vehicles.length - 1]?.manufacturer} {vehicles[vehicles.length - 1]?.model}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : vehicles.length === 1 ? (
                /* Single vehicle — shown as selected, no tap needed */
                <div className="bg-teal-50 border-2 border-teal-600 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check size={18} className="text-white" />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="font-bold text-gray-800 text-sm">{vehicles[0].nickname}</div>
                    <div className="text-xs text-gray-500">{vehicles[0].manufacturer} {vehicles[0].model}</div>
                  </div>
                  <Car size={18} className="text-teal-600" />
                </div>
              ) : (
                /* Multiple vehicles — tap to select */
                <div className="space-y-2">
                  {!bookingData.vehicleId && (
                    <p className="text-xs text-amber-600 font-medium mb-1">לחץ על הרכב הרצוי כדי להמשיך</p>
                  )}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {vehicles.map(v => {
                      const isSelected = bookingData.vehicleId === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setBookingData({ ...bookingData, vehicleId: v.id })}
                          className={`flex-shrink-0 w-36 p-3 rounded-xl border-2 transition text-center flex flex-col items-center gap-2 relative ${
                            isSelected
                              ? 'border-teal-600 bg-teal-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-teal-400 hover:bg-teal-50/30'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-teal-600' : 'bg-teal-50'}`}>
                            <Car size={16} className={isSelected ? 'text-white' : 'text-teal-600'} />
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-800 text-xs">{v.nickname}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{v.manufacturer} {v.model}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                בחר תאריך
              </label>
              <Input type="date" min={minDate} value={bookingData.date}
                onChange={e => setBookingData({ ...bookingData, date: e.target.value, time: '' })} />
            </div>

            {/* Time Selection - Filtered by garage working hours */}
            {bookingData.date && (() => {
              const selectedGarage = garages.find(g => g.id === selectedGarageId);
              const { slots, closed, hours } = getAvailableTimeSlots(selectedGarage, bookingData.date);
              const dayName = bookingData.date ? new Date(bookingData.date + 'T00:00:00').toLocaleDateString('he-IL', { weekday: 'long' }) : '';

              if (closed) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <p className="text-amber-800 font-bold text-sm">🚫 המוסך סגור ביום {dayName}</p>
                    <p className="text-amber-600 text-xs mt-1">אנא בחר תאריך אחר</p>
                  </div>
                );
              }

              return (
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    בחר שעה
                  </label>
                  {hours && (
                    <p className="text-xs text-gray-500 mb-3">שעות פעילות ביום {dayName}: {hours.open}–{hours.close}</p>
                  )}
                  {loadingSlots && <p className="text-xs text-gray-400 mb-2">בודק זמינות...</p>}
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(time => {
                      const isBooked = bookedSlots.includes(time);
                      return (
                        <button key={time}
                          disabled={isBooked}
                          onClick={() => !isBooked && setBookingData({ ...bookingData, time })}
                          className={`py-3 px-2 rounded-xl text-sm font-bold text-center transition ${
                            isBooked
                              ? 'bg-gray-100 text-gray-300 border border-gray-100 cursor-not-allowed line-through'
                              : bookingData.time === time
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-teal-600'
                          }`}>{time}</button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Notes Section - Collapsed by default */}
            <div>
              <button
                onClick={() => setShowNotesInput(!showNotesInput)}
                className="w-full flex items-center justify-between text-sm font-bold text-gray-800 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
              >
                <ChevronDown size={16} className={`text-gray-600 transition-transform ${showNotesInput ? 'rotate-180' : ''}`} />
                <span>הוסף הערות</span>
              </button>
              {showNotesInput && (
                <div className="mt-2 flex items-start gap-2">
                  <VoiceMicButton value={bookingData.notes} onResult={v => setBookingData({ ...bookingData, notes: v })} className="mt-2" />
                  <textarea
                    placeholder="ספר למוסך על תקלות או בקשות מיוחדות..."
                    value={bookingData.notes}
                    onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                    className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Summary Line at Bottom */}
            {bookingData.vehicleId && bookingData.date && bookingData.time && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm text-right space-y-1">
                <div className="flex justify-between">
                  <span className="text-teal-600 font-bold">{selectedVehicle?.nickname}</span>
                  <span className="text-gray-600">רכב:</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-teal-600 font-bold">{new Date(bookingData.date).toLocaleDateString('he-IL')} • {bookingData.time}</span>
                  <span className="text-gray-600">תאריך ושעה:</span>
                </div>
              </div>
            )}

            {/* Confirm Button */}
            <div className="flex gap-2 pt-2">
              <Button
                disabled={!bookingData.vehicleId || !bookingData.date || !bookingData.time}
                onClick={handleSubmitBooking}
                loading={submitting}
                icon={<Check size={16} />}
                className="w-full"
              >
                אשר תור
              </Button>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-700 text-center font-bold">
              ✓ המוסך יאשר את הזמנתך תוך 15 דקות ותקבל התראה
            </div>
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title={`דרג את ${reviewGarage?.name || ''}`} size="sm">
        <div className="space-y-4 text-center">
          <p className="text-gray-600 text-sm">איך היה השירות?</p>
          <div className="flex justify-center"><StarRating rating={reviewRating} size={32} interactive onChange={setReviewRating} /></div>
          {reviewRating > 0 && (
            <p className="text-sm font-bold text-amber-600">
              {reviewRating === 1 ? 'גרוע' : reviewRating === 2 ? 'לא טוב' : reviewRating === 3 ? 'סביר' : reviewRating === 4 ? 'טוב' : 'מעולה!'}
            </p>
          )}
          <div className="text-right">
            <label className="block text-sm font-bold text-gray-700 mb-2">תגובה (אופציונלי)</label>
            <div className="flex items-start gap-2">
              <VoiceMicButton value={reviewComment} onResult={setReviewComment} className="mt-2" />
              <textarea className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition resize-none"
                rows={3} placeholder="ספר על החוויה שלך..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowReviewModal(false)} className="flex-1">ביטול</Button>
            <Button onClick={handleSubmitReview} loading={reviewSubmitting} disabled={reviewRating < 1} className="flex-1" icon={<Star size={16} />}>שלח ביקורת</Button>
          </div>
        </div>
      </Modal>

      {/* Reviews List Modal */}
      <Modal isOpen={showReviewsModal} onClose={() => setShowReviewsModal(false)} title={`ביקורות — ${reviewGarage?.name || ''}`} size="lg">
        <div className="space-y-3">
          {reviewGarage && (
            <div className="flex items-center justify-between bg-teal-50 rounded-2xl p-4">
              <button onClick={() => { setShowReviewsModal(false); openReviewModal(reviewGarage); }}
                className="text-sm text-teal-700 font-bold hover:underline">+ כתוב ביקורת</button>
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(reviewGarage.rating)} size={16} />
                <span className="font-bold text-teal-700">{reviewGarage.rating.toFixed(1)}</span>
              </div>
            </div>
          )}
          {garageReviews.length === 0 ? (
            <div className="text-center py-8"><MessageSquare size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-gray-500">אין ביקורות עדיין</p></div>
          ) : (
            garageReviews.map(r => (
              <div key={r.id} className="border border-gray-200 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('he-IL')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-700">{r.userName}</span>
                    <StarRating rating={r.rating} size={12} />
                  </div>
                </div>
                {r.comment && <p className="text-sm text-gray-600 text-right">{r.comment}</p>}
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
