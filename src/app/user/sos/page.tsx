'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle, Phone, MapPin, Clock, Send, Loader2,
  CheckCircle2, Flame, Wrench, CircleDot, Fuel, Lock,
  HelpCircle, Plus, ChevronRight, ChevronLeft, Shield,
  Navigation, PhoneCall, X
} from 'lucide-react';
import VoiceMicButton from '@/components/ui/VoiceMicButton';
import ComingSoonBanner from '@/components/shared/ComingSoonBanner';
import { GARAGES_ENABLED } from '@/lib/constants/feature-flags';

/* ────────────────────── Types ────────────────────── */

interface SosEvent {
  id: string;
  eventType: string;
  description?: string;
  location?: string;
  status: string;
  createdAt: string;
  priority?: string;
  vehicle?: { licensePlate: string; nickname: string };
}

interface Vehicle {
  id: string;
  nickname: string;
  licensePlate: string;
  model: string;
}

/* ────────────────────── Constants ────────────────────── */

const eventTypes = [
  { id: 'accident', label: 'תאונה', icon: Flame, color: 'from-red-500 to-rose-600', bgLight: 'bg-red-50', textColor: 'text-red-600' },
  { id: 'breakdown', label: 'תקלה מכנית', icon: Wrench, color: 'from-orange-500 to-amber-600', bgLight: 'bg-orange-50', textColor: 'text-orange-600' },
  { id: 'flat_tire', label: 'צמיג תקוע', icon: CircleDot, color: 'from-amber-500 to-yellow-600', bgLight: 'bg-amber-50', textColor: 'text-amber-600' },
  { id: 'fuel', label: 'דלק נגמר', icon: Fuel, color: 'from-yellow-500 to-lime-600', bgLight: 'bg-yellow-50', textColor: 'text-yellow-700' },
  { id: 'electrical', label: 'נעילה ברכב', icon: Lock, color: 'from-purple-500 to-violet-600', bgLight: 'bg-purple-50', textColor: 'text-purple-600' },
  { id: 'other', label: 'אחר', icon: HelpCircle, color: 'from-gray-500 to-slate-600', bgLight: 'bg-gray-50', textColor: 'text-gray-600' },
];

const eventTypeLabels: Record<string, string> = {
  accident: 'תאונה', breakdown: 'תקלה מכנית', flat_tire: 'צמיג תקוע',
  fuel: 'דלק נגמר', electrical: 'נעילה ברכב', locked_out: 'נעילה ברכב', other: 'אחר',
};

const priorityLabels: Record<string, string> = {
  critical: 'קריטי', high: 'גבוה', medium: 'בינוני', low: 'נמוך',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  open: { label: 'פתוח', color: 'bg-red-100 text-red-700 border-red-200' },
  assigned: { label: 'הוקצה', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  in_progress: { label: 'בטיפול', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  resolved: { label: 'טופל', color: 'bg-green-100 text-green-700 border-green-200' },
};

function translateEventType(type: string): string {
  return eventTypeLabels[type] || type;
}

function translatePriority(p: string): string {
  return priorityLabels[p] || p;
}

function getEventIcon(type: string) {
  if (type.includes('accident') || type.includes('תאונה')) return Flame;
  if (type.includes('flat') || type.includes('צמיג')) return CircleDot;
  if (type.includes('fuel') || type.includes('דלק')) return Fuel;
  if (type.includes('electrical') || type.includes('נעילה')) return Lock;
  if (type.includes('other')) return HelpCircle;
  return Wrench;
}

/* ────────────────────── Component ────────────────────── */

export default function SosPage() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [events, setEvents] = useState<SosEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [eventNote, setEventNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sosRes, vehiclesRes] = await Promise.all([
          fetch('/api/sos'),
          fetch('/api/vehicles'),
        ]);
        const sosData = await sosRes.json();
        const vehiclesData = await vehiclesRes.json();
        if (sosData.events) setEvents(sosData.events);
        if (vehiclesData.vehicles) {
          setVehicles(vehiclesData.vehicles);
          if (vehiclesData.vehicles.length > 0) {
            setSelectedVehicleId(vehiclesData.vehicles[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading SOS data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDetectLocation = async () => {
    setGeoLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocation(`${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
          setGeoLocating(false);
        },
        () => {
          setSubmitMessage('לא ניתן להשיג מיקום. אנא הזן ידנית.');
          setGeoLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setSubmitMessage('שירותי מיקום לא זמינים בדפדפן שלך.');
      setGeoLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedVehicleId) {
      setSubmitMessage('בחר רכב אנא');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          eventType: selectedType,
          description,
          location,
          latitude,
          longitude,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitMessage('הדיווח נשלח בהצלחה! נחזור אליך בהקדם.');
        setShowReportModal(false);
        resetForm();
        const evRes = await fetch('/api/sos');
        const evData = await evRes.json();
        if (evData.events) setEvents(evData.events);
      } else {
        setSubmitMessage(data.error || 'שגיאה בשליחת הדיווח');
      }
    } catch {
      setSubmitMessage('שגיאת חיבור');
    }
    setSubmitting(false);
    setTimeout(() => setSubmitMessage(''), 5000);
  };

  const resetForm = () => {
    setStep(0);
    setSelectedType(null);
    setDescription('');
    setLocation('');
    setLatitude(null);
    setLongitude(null);
  };

  const handleAddNote = async () => {
    if (!activeEventId || !eventNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/sos/${activeEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: eventNote }),
      });
      if (res.ok) {
        setEventNote('');
        setActiveEventId(null);
        setSubmitMessage('הערה הוספה בהצלחה');
        const evRes = await fetch('/api/sos');
        const evData = await evRes.json();
        if (evData.events) setEvents(evData.events);
      } else {
        setSubmitMessage('שגיאה בהוספת הערה');
      }
    } catch {
      setSubmitMessage('שגיאת חיבור');
    } finally {
      setAddingNote(false);
      setTimeout(() => setSubmitMessage(''), 5000);
    }
  };

  const activeEvents = events.filter(e => e.status !== 'resolved');
  const resolvedEvents = events.filter(e => e.status === 'resolved');

  /* ── Coming Soon gate ── */
  if (!GARAGES_ENABLED) {
    return (
      <div className="min-h-screen bg-[#fef7ed] pb-24" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-l from-red-600 to-red-700 text-white px-4 pt-6 pb-8 rounded-b-3xl">
          <h1 className="text-2xl font-bold">SOS חירום</h1>
          <p className="text-sm text-white/70 mt-1">שירות חירום לדרכים</p>
        </div>
        <div className="px-4 mt-6">
          <ComingSoonBanner
            title="SOS חירום — בקרוב!"
            description="שירות חירום עם חיבור ישיר למוסכים שותפים, שליחת מיקום ותיאום גרירה. בקרוב זמין באפליקציה."
          />
        </div>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className="min-h-screen bg-[#fef7ed] pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-red-600 to-red-700 text-white px-4 pt-6 pb-10 rounded-b-3xl relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute top-8 -right-4 w-16 h-16 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SOS חירום</h1>
              <p className="text-sm text-white/70">שירות חירום 24/7 לדרכים</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast message */}
      {submitMessage && (
        <div className={`mx-4 mt-4 p-4 rounded-2xl text-center font-semibold text-sm shadow-sm ${
          submitMessage.includes('הצלחה') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {submitMessage}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="animate-spin text-red-500" />
          <p className="text-gray-400 text-sm">טוען נתונים...</p>
        </div>
      ) : (
        <div className="px-4 -mt-4 space-y-5">

          {/* ═══ Emergency Action Card ═══ */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-red-100">
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-200">
                <AlertTriangle size={36} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-2">צריך עזרה דחופה?</h2>
              <p className="text-gray-500 text-sm mb-6">דווח על אירוע ונשלח לך עזרה בהקדם</p>
              <button
                onClick={() => { setShowReportModal(true); resetForm(); }}
                className="w-full bg-gradient-to-l from-red-600 to-red-500 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg shadow-red-200 hover:shadow-xl hover:from-red-700 hover:to-red-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <AlertTriangle size={22} />
                דווח על אירוע חירום
              </button>
            </div>

            {/* Quick actions strip */}
            <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
              <a
                href="tel:0533131310"
                className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-[#1e3a5f] hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                <PhoneCall size={18} className="text-red-500" />
                <span>חייג למוקד</span>
              </a>
              <button
                onClick={handleDetectLocation}
                disabled={geoLocating}
                className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-[#1e3a5f] hover:bg-gray-50 transition-colors active:bg-gray-100 disabled:opacity-50"
              >
                {geoLocating ? (
                  <Loader2 size={18} className="animate-spin text-teal-600" />
                ) : (
                  <Navigation size={18} className="text-teal-600" />
                )}
                <span>{geoLocating ? 'מאתר...' : 'זהה מיקום'}</span>
              </button>
            </div>

            {/* Show detected location */}
            {location && (
              <div className="border-t border-gray-100 px-5 py-3 bg-teal-50/50 flex items-center gap-2">
                <MapPin size={14} className="text-teal-600 flex-shrink-0" />
                <span className="text-xs text-teal-700 font-medium truncate">{location}</span>
                <CheckCircle2 size={14} className="text-teal-600 flex-shrink-0 mr-auto" />
              </div>
            )}
          </div>

          {/* ═══ Active Events ═══ */}
          {activeEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[#1e3a5f] mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                אירועים פעילים ({activeEvents.length})
              </h2>
              <div className="space-y-3">
                {activeEvents.map(event => {
                  const statuses = ['open', 'assigned', 'in_progress', 'resolved'];
                  const currentIndex = statuses.indexOf(event.status);
                  const EventIcon = getEventIcon(event.eventType);
                  const cfg = statusLabels[event.status] || statusLabels.open;
                  const priorityColor: Record<string, string> = {
                    critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
                    medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700',
                  };

                  return (
                    <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      {/* Event header */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                              <EventIcon size={20} className="text-red-600" />
                            </div>
                            <div>
                              <p className="font-bold text-[#1e3a5f] text-sm">{translateEventType(event.eventType)}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {event.vehicle?.nickname} • {event.vehicle?.licensePlate}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            {event.priority && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColor[event.priority] || 'bg-gray-100 text-gray-600'}`}>
                                {translatePriority(event.priority)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timeline progress */}
                        <div className="flex items-center gap-0.5 mb-1">
                          {statuses.map((status, index) => (
                            <div key={status} className="flex items-center flex-1">
                              <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                                index <= currentIndex ? 'bg-teal-500' : 'bg-gray-200'
                              }`} />
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 px-0.5">
                          <span>פתוח</span>
                          <span>הוקצה</span>
                          <span>בטיפול</span>
                          <span>טופל</span>
                        </div>
                      </div>

                      {/* Add note section */}
                      <div className="border-t border-gray-100 px-4 py-3">
                        {activeEventId === event.id ? (
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <VoiceMicButton value={eventNote} onResult={setEventNote} className="mt-1.5" />
                              <textarea
                                placeholder="הוסף עדכון או הערה..."
                                value={eventNote}
                                onChange={(e) => setEventNote(e.target.value)}
                                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none bg-gray-50"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => { setActiveEventId(null); setEventNote(''); }}
                                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                              >
                                ביטול
                              </button>
                              <button
                                onClick={handleAddNote}
                                disabled={addingNote || !eventNote.trim()}
                                className="px-4 py-2 text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                              >
                                {addingNote ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                שלח
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveEventId(event.id)}
                            className="w-full py-2 text-sm text-teal-600 font-semibold hover:bg-teal-50 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Plus size={14} />
                            הוסף עדכון
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ Event History ═══ */}
          <div>
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3 flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              היסטוריית אירועים
            </h2>

            {events.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={28} className="text-green-500" />
                </div>
                <p className="font-semibold text-[#1e3a5f] mb-1">הכל בסדר!</p>
                <p className="text-gray-400 text-sm">אין אירועי חירום קודמים</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map(e => {
                  const EventIcon = getEventIcon(e.eventType);
                  const cfg = statusLabels[e.status] || statusLabels.open;
                  return (
                    <div
                      key={e.id}
                      className={`bg-white rounded-2xl p-4 shadow-sm border transition-colors ${
                        e.status === 'resolved' ? 'border-green-100' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          e.status === 'resolved' ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <EventIcon size={18} className={e.status === 'resolved' ? 'text-green-600' : 'text-red-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[#1e3a5f]">{translateEventType(e.eventType)}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {e.vehicle?.licensePlate || 'ללא רכב'} • {new Date(e.createdAt).toLocaleDateString('he-IL')} {new Date(e.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ Emergency Numbers Reference ═══ */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-[#1e3a5f] mb-3">מספרי חירום</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'מוקד AutoLog', number: '053-313-1310', icon: Shield },
                { label: 'משטרה', number: '100', icon: Phone },
                { label: 'מד"א', number: '101', icon: Phone },
                { label: 'כיבוי אש', number: '102', icon: Phone },
              ].map(item => (
                <a
                  key={item.number}
                  href={`tel:${item.number.replace(/-/g, '')}`}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors active:scale-[0.98]"
                >
                  <item.icon size={16} className="text-red-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1e3a5f] truncate">{item.label}</p>
                    <p className="text-xs text-gray-400 font-mono" dir="ltr">{item.number}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Report Modal ═══ */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" dir="rtl">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowReportModal(false)}
          />

          {/* Modal content */}
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 bg-white z-10 px-5 pt-5 pb-3 border-b border-gray-100 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1e3a5f]">דיווח אירוע חירום</h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              {/* Steps indicator */}
              <div className="flex items-center gap-2 mt-3">
                <div className={`flex-1 h-1 rounded-full ${step >= 0 ? 'bg-red-500' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-red-500' : 'bg-gray-200'}`} />
              </div>
            </div>

            <div className="p-5">
              {step === 0 && (
                <div className="space-y-5">
                  {/* Vehicle select */}
                  <div>
                    <label className="text-sm font-bold text-[#1e3a5f] mb-2 block">בחר את הרכב</label>
                    <select
                      value={selectedVehicleId || ''}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-right text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 appearance-none"
                    >
                      <option value="">-- בחר רכב --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.nickname} ({v.licensePlate})</option>
                      ))}
                    </select>
                  </div>

                  {/* Event type grid */}
                  <div>
                    <label className="text-sm font-bold text-[#1e3a5f] mb-3 block">מה קרה?</label>
                    <div className="grid grid-cols-3 gap-3">
                      {eventTypes.map(t => {
                        const isSelected = selectedType === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => { setSelectedType(t.id); setStep(1); }}
                            className={`p-4 rounded-2xl text-center transition-all border-2 ${
                              isSelected
                                ? 'border-red-500 bg-red-50 shadow-md'
                                : 'border-gray-100 bg-white hover:border-red-200 hover:bg-red-50/30'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 ${t.bgLight}`}>
                              <t.icon size={24} className={t.textColor} />
                            </div>
                            <p className="text-xs font-bold text-[#1e3a5f]">{t.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  {/* Selected type badge */}
                  <div className="flex items-center gap-2.5 p-3 bg-red-50 rounded-xl border border-red-100">
                    {(() => {
                      const et = eventTypes.find(t => t.id === selectedType);
                      const Icon = et?.icon || HelpCircle;
                      return (
                        <>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${et?.bgLight || 'bg-gray-100'}`}>
                            <Icon size={16} className={et?.textColor || 'text-gray-600'} />
                          </div>
                          <span className="text-sm font-bold text-[#1e3a5f]">{et?.label}</span>
                          <button
                            onClick={() => setStep(0)}
                            className="mr-auto text-xs text-red-500 font-semibold hover:underline"
                          >
                            שנה
                          </button>
                        </>
                      );
                    })()}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-bold text-[#1e3a5f] mb-2 block">תיאור האירוע</label>
                    <div className="relative">
                      <textarea
                        placeholder="ספר בקצרה מה קרה..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 resize-none pr-12"
                        rows={3}
                      />
                      <div className="absolute top-3 right-3">
                        <VoiceMicButton value={description} onResult={setDescription} />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-[#1e3a5f]">מיקום</label>
                      <button
                        onClick={handleDetectLocation}
                        disabled={geoLocating}
                        className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 disabled:opacity-50 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors"
                      >
                        {geoLocating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                        {geoLocating ? 'מאתר...' : 'זהה GPS'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="רחוב, עיר"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
                      />
                      <MapPin size={16} className="absolute top-3.5 right-3 text-gray-400" />
                    </div>
                    {latitude && longitude && (
                      <p className="text-[11px] text-teal-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        מיקום GPS זוהה בהצלחה
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep(0)}
                      className="px-5 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      חזור
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-l from-red-600 to-red-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-red-200 hover:from-red-700 hover:to-red-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      {submitting ? 'שולח...' : 'שלח דיווח חירום'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
