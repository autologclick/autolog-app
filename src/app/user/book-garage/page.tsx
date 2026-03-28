'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  MapPin, Star, Phone, Search, Calendar, ChevronRight,
  Loader2, Check, AlertCircle, CheckCircle2, Building2,
  ArrowUpDown, SlidersHorizontal, X, MessageSquare,
  Wrench, ClipboardCheck, Car, Settings2, ArrowRight,
  Clock, MapIcon, FileText, Coffee, Wifi, Monitor, Heart, Armchair
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

// Service types with Hebrew labels, English values, and icons
const serviceOptions = [
  { value: 'inspection', label: 'בדיקה', icon: <ClipboardCheck size={28} />, description: 'בדיקת רכב מקיפה' },
  { value: 'maintenance', label: 'טיפול', icon: <Wrench size={28} />, description: 'טיפול שוטף ותחזוקה' },
  { value: 'repair', label: 'תיקון', icon: <Settings2 size={28} />, description: 'תיקון תקלה ספציפית' },
  { value: 'test_prep', label: 'הכנה לטסט', icon: <Car size={28} />, description: 'הכנת הרכב לטסט שנתי' },
];

const serviceValueToLabel: Record<string, string> = {
  inspection: 'בדיקה', maintenance: 'טיפול', repair: 'תיקון', test_prep: 'הכנה לטסט',
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

export default function BookGaragePage() {
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

  // Flow state: service → garages → booking details
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedGarageId, setSelectedGarageId] = useState<string>('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState<'service' | 'vehicle' | 'datetime' | 'review' | 'success'>('service');
  const [bookingData, setBookingData] = useState({ vehicleId: '', date: '', time: '', notes: '' });

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
    setBookingStep('service');
    setError('');
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
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>;
  }

  return (
    <div className="space-y-4 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
          <Calendar size={20} className="text-[#1e3a5f]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">הזמנת תור</h1>
          <p className="text-sm text-gray-500">בחר שירות, מוסך וקבע תור בקלות</p>
        </div>
      </div>

      {/* === STEP 1: Service Selection === */}
      {!selectedService && (
        <div className="space-y-4">
          <div className="bg-gradient-to-l from-teal-50 to-white rounded-2xl p-5 border border-teal-100">
            <h2 className="text-lg font-bold text-gray-800 mb-1">באיזה שירות אתה מעוניין?</h2>
            <p className="text-sm text-gray-500 mb-4">בחר את סוג השירות ונציג לך מוסכים מתאימים</p>
            <div className="grid grid-cols-2 gap-3">
              {serviceOptions.map(service => (
                <button
                  key={service.value}
                  onClick={() => setSelectedService(service.value)}
                  className="bg-white p-5 rounded-xl border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-center group"
                >
                  <div className="text-teal-600 mb-2 flex justify-center group-hover:scale-110 transition-transform">
                    {service.icon}
                  </div>
                  <div className="font-bold text-gray-800 text-sm">{service.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{service.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === STEP 2: Garage Selection (after service is picked) === */}
      {selectedService && (
        <>
          {/* Selected service banner */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-teal-600" />
              <span className="text-sm font-medium text-teal-800">
                שירות: <span className="font-bold">{serviceValueToLabel[selectedService]}</span>
              </span>
            </div>
            <button
              onClick={() => setSelectedService('')}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
            >
              <X size={14} /> שנה
            </button>
          </div>

          {/* Search + filters */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input placeholder="חפש מוסך לפי שם או עיר..." icon={<Search size={16} />}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1">
              {(['nearest', 'rating'] as SortOption[]).map(opt => (
                <button key={opt} onClick={() => setSortBy(opt)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                    sortBy === opt ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-teal-50'
                  }`}>
                  {sortLabels[opt]}
                </button>
              ))}
            </div>
          </div>

          {/* City filter chips */}
          {cities.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterCity('')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  !filterCity ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-teal-50'
                }`}>הכל</button>
              {cities.map(city => (
                <button key={city} onClick={() => setFilterCity(city)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    filterCity === city ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-teal-50'
                  }`}>{city}</button>
              ))}
            </div>
          )}

          {/* Garage List */}
          {sortedGarages.length === 0 ? (
            <div className="text-center py-12">
              <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">לא נמצאו מוסכים</p>
              <p className="text-gray-400 text-sm">נסה לשנות את החיפוש</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedGarages.map(g => (
                <div key={g.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 size={22} className="text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-[#1e3a5f]">{g.name}</h3>
                        {g.isPartner && <Badge variant="success" size="sm">שותף</Badge>}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <MapPin size={13} />
                        <span>{g.address ? `${g.address}, ${g.city}` : g.city}</span>
                        {g.distance != null && g.distance < 900 && (
                          <span className="text-teal-600 font-medium mr-1">
                            • {g.distance < 1 ? `${Math.round(g.distance * 1000)} מ׳` : `${g.distance.toFixed(1)} ק״מ`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={Math.round(g.rating)} size={14} />
                        <span className="text-sm font-bold text-gray-700">{g.rating > 0 ? g.rating.toFixed(1) : '—'}</span>
                        <button onClick={() => openReviewsList(g)} className="text-xs text-teal-600 hover:underline">
                          ({g.reviewCount} ביקורות)
                        </button>
                      </div>
                      {(g.services || []).length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {(g.services || []).slice(0, 4).map(s => (
                            <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - full width */}
                  <div className="flex items-center gap-2">
                    {g.phone && (
                      <a href={`tel:${g.phone}`}
                        className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-[#fef7ed]/50 transition">
                        <Phone size={16} />
                      </a>
                    )}
                    <button onClick={() => openReviewModal(g)}
                      className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-[#fef7ed]/50 transition">
                      <MessageSquare size={16} />
                    </button>
                    <button
                      onClick={() => openBooking(g)}
                      className="flex-1 bg-teal-600 text-white h-11 rounded-xl text-sm font-bold hover:bg-teal-700 transition flex items-center justify-center gap-1.5"
                    >
                      <Calendar size={14} />
                      קבע תור {serviceValueToLabel[selectedService]}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* === BOOKING MODAL (Service → Vehicle → DateTime → Review → Success) === */}
      <Modal isOpen={showBookingModal} onClose={() => { setShowBookingModal(false); setBookingStep('service'); setSelectedService(''); }}
        title={bookingStep === 'success' ? 'התור נקבע בהצלחה!' : `הזמנת תור — ${selectedGarage?.name || ''}`} size="lg">

        {bookingStep === 'success' ? (
          <div className="text-center py-6">
            <CheckCircle2 size={64} className="mx-auto text-green-600 mb-4" />
            <h3 className="text-xl font-bold text-green-700 mb-2">התור נקבע בהצלחה!</h3>
            <p className="text-gray-500 text-sm mb-4">המוסך יאשר את התור בקרוב ותקבל התראה</p>
            <div className="bg-teal-50 rounded-xl p-4 space-y-2 text-sm text-right">
              <div className="flex justify-between"><span className="text-gray-600">מוסך:</span><span className="font-medium">{selectedGarage?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">שירות:</span><span className="font-medium">{serviceValueToLabel[selectedService]}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">רכב:</span><span className="font-medium">{selectedVehicle?.nickname}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">תאריך:</span><span className="font-medium">{bookingData.date ? new Date(bookingData.date).toLocaleDateString('he-IL') : ''}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">שעה:</span><span className="font-medium">{bookingData.time}</span></div>
            </div>
            <Button onClick={() => { setShowBookingModal(false); setBookingStep('service'); setSelectedService(''); }} className="mt-4 w-full">סגור</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Step indicator - 4 steps */}
            <div className="flex items-center gap-1 text-sm justify-between w-full px-1">
              {(['service', 'vehicle', 'datetime', 'review'] as const).map((step, idx) => {
                const labels = ['בחירת שירות', 'בחירת רכב', 'תאריך ושעה', 'אישור'];
                const order: Record<string, number> = { service: 0, vehicle: 1, datetime: 2, review: 3 };
                const isActive = order[step] === order[bookingStep];
                const isPast = order[step] < order[bookingStep];
                return (
                  <div key={step} className="flex items-center gap-1 flex-1">
                    <div className="flex flex-col items-center w-full">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition flex-shrink-0 ${
                        isActive ? 'bg-teal-600 text-white' : isPast ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'
                      }`}>{idx + 1}</div>
                      <span className={`text-[9px] mt-1 text-center leading-tight max-w-[70px] ${isActive ? 'text-teal-600 font-semibold' : isPast ? 'text-teal-600' : 'text-gray-400'}`}>{labels[idx]}</span>
                    </div>
                    {idx < 3 && (
                      <div className={`h-0.5 flex-1 transition ${isPast || isActive ? 'bg-teal-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
              </div>
            )}

            {/* Service Selection Step */}
            {bookingStep === 'service' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-3">באיזה שירות אתה זקוק?</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {serviceOptions.map(service => (
                      <button
                        key={service.value}
                        onClick={() => { setSelectedService(service.value); setBookingStep('vehicle'); }}
                        className={`p-3 rounded-xl border-2 transition text-center flex flex-col items-center gap-2 ${
                          selectedService === service.value
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50'
                        }`}
                      >
                        <div className="text-teal-600">{service.icon}</div>
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{service.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{service.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Step */}
            {bookingStep === 'vehicle' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-3">בחר את הרכב שלך:</h3>
                  {vehicles.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Car size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">אין רכבים</p>
                      <p className="text-gray-400 text-xs mt-1">הוסף רכב קודם לפני הזמנת תור</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {vehicles.map(v => (
                        <button key={v.id}
                          onClick={() => { setBookingData({ ...bookingData, vehicleId: v.id }); setBookingStep('datetime'); }}
                          className={`w-full p-4 rounded-xl text-right border-2 transition flex items-center gap-3 ${
                            bookingData.vehicleId === v.id
                              ? 'border-teal-600 bg-teal-50'
                              : 'border-gray-200 bg-white hover:border-teal-500 hover:bg-teal-50'
                          }`}
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Car size={20} className="text-gray-600" />
                          </div>
                          <div className="flex-1 text-right">
                            <div className="font-bold text-gray-800">{v.nickname}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{v.manufacturer} {v.model} • {v.licensePlate}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setBookingStep('service')} className="flex-1">← חזור</Button>
                </div>
              </div>
            )}

            {/* DateTime Step */}
            {bookingStep === 'datetime' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-teal-600" />
                    בחר תאריך
                  </label>
                  <Input type="date" min={minDate} value={bookingData.date}
                    onChange={e => setBookingData({ ...bookingData, date: e.target.value })} />
                </div>
                {bookingData.date && (
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Clock size={16} className="text-teal-600" />
                      בחר שעה
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map(time => (
                        <button key={time}
                          onClick={() => setBookingData({ ...bookingData, time })}
                          className={`py-2.5 px-2 rounded-lg text-sm font-medium text-center transition ${
                            bookingData.time === time
                              ? 'bg-teal-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-teal-50'
                          }`}>{time}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setBookingStep('vehicle')} className="flex-1">← חזור</Button>
                  <Button disabled={!bookingData.date || !bookingData.time}
                    onClick={() => setBookingStep('review')} className="flex-1">המשך ←</Button>
                </div>
              </div>
            )}

            {/* Review/Confirmation Step */}
            {bookingStep === 'review' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800">בדוק את פרטי ההזמנה:</h3>

                {/* Summary Cards */}
                <div className="space-y-2">
                  {/* Service */}
                  <div className="bg-white border-2 border-teal-100 rounded-xl p-3 flex gap-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ClipboardCheck size={20} className="text-teal-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-gray-600">שירות</p>
                      <p className="font-bold text-gray-800">{serviceValueToLabel[selectedService]}</p>
                    </div>
                  </div>

                  {/* Garage */}
                  <div className="bg-white border-2 border-teal-100 rounded-xl p-3 flex gap-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 size={20} className="text-teal-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-gray-600">מוסך</p>
                      <p className="font-bold text-gray-800">{selectedGarage?.name}</p>
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div className="bg-white border-2 border-teal-100 rounded-xl p-3 flex gap-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Car size={20} className="text-teal-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-gray-600">רכב</p>
                      <p className="font-bold text-gray-800">{selectedVehicle?.nickname}</p>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="bg-white border-2 border-teal-100 rounded-xl p-3 flex gap-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar size={20} className="text-teal-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-gray-600">תאריך ושעה</p>
                      <p className="font-bold text-gray-800">{bookingData.date ? new Date(bookingData.date).toLocaleDateString('he-IL') : ''} • {bookingData.time}</p>
                    </div>
                  </div>
                </div>

                {/* Notes Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText size={14} className="text-gray-600" />
                    הערות נוספות (אופציונלי)
                  </label>
                  <textarea
                    placeholder="ספר למוסך על תקלות או בקשות מיוחדות..."
                    value={bookingData.notes}
                    onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition resize-none"
                    rows={2}
                  />
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-700 text-center">
                  ✓ המוסך יאשר את הזמנתך תוך 24 שעות ותקבל התראה
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setBookingStep('datetime')} className="flex-1">← חזור</Button>
                  <Button onClick={handleSubmitBooking} loading={submitting} icon={<Check size={16} />} className="flex-1">אישור הזמנה</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title={`דרג את ${reviewGarage?.name || ''}`} size="sm">
        <div className="space-y-4 text-center">
          <p className="text-gray-600 text-sm">איך היה השירות?</p>
          <div className="flex justify-center"><StarRating rating={reviewRating} size={32} interactive onChange={setReviewRating} /></div>
          {reviewRating > 0 && (
            <p className="text-sm font-medium text-amber-600">
              {reviewRating === 1 ? 'גרוע' : reviewRating === 2 ? 'לא טוב' : reviewRating === 3 ? 'סביר' : reviewRating === 4 ? 'טוב' : 'מעולה!'}
            </p>
          )}
          <div className="text-right">
            <label className="block text-sm font-medium text-gray-700 mb-1">תגובה (אופציונלי)</label>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            <div className="flex items-center justify-between bg-teal-50 rounded-xl p-3">
              <button onClick={() => { setShowReviewsModal(false); openReviewModal(reviewGarage); }}
                className="text-sm text-teal-700 font-medium hover:underline">+ כתוב ביקורת</button>
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
              <div key={r.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('he-IL')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-700">{r.userName}</span>
                    <StarRating rating={r.rating} size={12} />
                  </div>
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
