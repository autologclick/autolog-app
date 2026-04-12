'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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

interface GarageReview {
  id: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
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

// Service types with Hebrew labels, English values, and emojis
const serviceOptions = [
  { value: 'inspection', label: 'בדיקה', emoji: '🔍', description: 'בדיקת רכב מקיפה' },
  { value: 'maintenance', label: 'טיפול', emoji: '🔧', description: 'טיפול שוטף ותחזוקה' },
  { value: 'repair', label: 'תיקון', emoji: '🛠️', description: 'תיקון תקלה ספציפית' },
  { value: 'test_prep', label: 'הכנה לטסט', emoji: '🧪', description: 'הכנת הרכב לטסט שנתי' },
];

const serviceValueToLabel: Record<string, string> = {
  inspection: 'בדיקה', maintenance: 'טיפול', repair: 'תיקון', test_prep: 'הכנה לטסט',
  oil_change: 'החלפת שמן', tires: 'צמיגים', brakes: 'בלמים', diagnostics: 'אבחון',
  bodywork: 'פחחות', electrical: 'חשמל', ac: 'מיזוג', lights_mirrors: 'פנסים ומראות',
  spare_parts: 'חלקי חילוף',
};

const timeSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

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

  const selectedGarage = garages.find(g => g.id === selectedGarageId);
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
    setBookingData({ vehicleId: '', date: '', time: '', notes: '' });
    setShowNotesInput(false);
    setError('');
    setBookingStep('details');
    setShowBookingModal(true);
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
      if (!res.ok) { setError(data.error || 'שגיאה בהזמנת התור'); setSubmitting(false); return; }
      setBookingStep('success');
      setSubmitting(false);
    } catch { setError('שגיאת חיבור'); setSubmitting(false); }
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
                    className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200 hover:border-teal-600 transition-all text-center group"
                  >
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform inline-block">
                      {service.emoji}
                    </div>
                    <div className="font-bold text-gray-800 text-sm">{service.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{service.description}</div>
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

            {/* Search */}
            <Input placeholder="חפש מוסך לפי שם או עיר..." icon={<Search size={16} />}
              value={search} onChange={e => setSearch(e.target.value)} />

            {/* Filters row - sort + city in one compact row */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {(['nearest', 'rating'] as SortOption[]).map(opt => (
                <button key={opt} onClick={() => setSortBy(opt)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    sortBy === opt ? 'bg-teal-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
                  }`}>
                  {sortLabels[opt]}
                </button>
              ))}
              {cities.length > 0 && (
                <div className="w-px bg-gray-200 flex-shrink-0 my-1" />
              )}
              {cities.length > 0 && (
                <button onClick={() => setFilterCity('')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    !filterCity ? 'bg-teal-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
                  }`}>הכל</button>
              )}
              {cities.map(city => (
                <button key={city} onClick={() => setFilterCity(city)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    filterCity === city ? 'bg-teal-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
                  }`}>{city}</button>
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
                <span className="font-bold text-gray-800">{serviceValueToLabel[selectedService]}</span>
                <span className="text-gray-600">שירות:</span>
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
                <span className="font-bold text-gray-800">{serviceValueToLabel[selectedService]}</span>
              </div>
            </div>

            {/* Vehicle Selection - Horizontal Scrollable Cards */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                בחר את הרכב שלך
              </label>
              {vehicles.length === 0 ? (
                <div className="text-center py-6 bg-[#fef7ed] rounded-2xl border-2 border-dashed border-gray-300">
                  <Car size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 text-sm font-bold">אין רכבים</p>
                  <p className="text-gray-400 text-xs mt-1">הוסף רכב קודם לפני הזמנת תור</p>
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {vehicles.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setBookingData({ ...bookingData, vehicleId: v.id })}
                      className={`flex-shrink-0 w-32 p-3 rounded-xl border-2 transition text-center flex flex-col items-center gap-2 ${
                        bookingData.vehicleId === v.id
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-gray-200 bg-white hover:border-teal-600'
                      }`}
                    >
                      <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Car size={16} className="text-teal-600" />
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800 text-xs">{v.nickname}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{v.manufacturer} {v.model}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                בחר תאריך
              </label>
              <Input type="date" min={minDate} value={bookingData.date}
                onChange={e => setBookingData({ ...bookingData, date: e.target.value })} />
            </div>

            {/* Time Selection - Rounded button grid */}
            {bookingData.date && (
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  בחר שעה
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map(time => (
                    <button key={time}
                      onClick={() => setBookingData({ ...bookingData, time })}
                      className={`py-3 px-2 rounded-xl text-sm font-bold text-center transition ${
                        bookingData.time === time
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-teal-600'
                      }`}>{time}</button>
                  ))}
                </div>
              </div>
            )}

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
                <div className="mt-2">
                  <textarea
                    placeholder="ספר למוסך על תקלות או בקשות מיוחדות..."
                    value={bookingData.notes}
                    onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition resize-none"
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
              ✓ המוסך יאשר את הזמנתך תוך 3 דקות ותקבל התראה
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
            <textarea className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition resize-none"
              rows={3} placeholder="ספר על החוויה שלך..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
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
