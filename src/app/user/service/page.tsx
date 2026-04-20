'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, MapPin, Wrench, AlertTriangle, ChevronLeft,
  Clock, CheckCircle, Loader2, Phone, Search, Shield
} from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  time?: string;
  serviceType: string;
  status: string;
  notes?: string;
  garage?: { id: string; name: string; city?: string; address?: string; phone?: string };
  vehicle?: { id: string; nickname: string; licensePlate: string };
}

const serviceTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    inspection: 'בדיקה', test_prep: 'הכנה לטסט', maintenance: 'טיפול תקופתי',
    repair: 'תיקון', oil_change: 'החלפת שמן', tires: 'צמיגים', brakes: 'בלמים',
    diagnostics: 'אבחון', bodywork: 'פחחות', electrical: 'חשמל', ac: 'מיזוג',
  };
  return map[t] || t;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'ממתין', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock size={14} /> },
  confirmed: { label: 'מאושר', color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle size={14} /> },
  in_progress: { label: 'בטיפול', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Wrench size={14} /> },
  completed: { label: 'הושלם', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: <CheckCircle size={14} /> },
  cancelled: { label: 'בוטל', color: 'bg-red-50 text-red-500 border-red-200', icon: <AlertTriangle size={14} /> },
};

export default function ServicePage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/appointments?limit=20')
      .then(r => r.json())
      .then(data => {
        setAppointments(data.appointments || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter(a => ['pending', 'confirmed', 'in_progress'].includes(a.status));
  const past = appointments.filter(a => ['completed', 'cancelled'].includes(a.status));

  return (
    <div className="min-h-screen bg-[#fef7ed] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1e3a5f] to-[#2a5a8f] text-white px-4 pt-6 pb-6 rounded-b-3xl">
        <h1 className="text-2xl font-bold mb-1">שירות</h1>
        <p className="text-sm text-white/70">הזמנת מוסך, תורים ומצבי חירום</p>
      </div>

      <div className="px-4 mt-4 space-y-5">
        {/* Book New Service — primary CTA */}
        <button
          onClick={() => router.push('/user/book-garage')}
          className="w-full bg-gradient-to-l from-teal-500 to-teal-600 text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar size={28} />
          </div>
          <div className="flex-1 text-right">
            <div className="text-lg font-bold">הזמן שירות חדש</div>
            <div className="text-sm text-white/80">בדיקה, טיפול, תיקון או הכנה לטסט</div>
          </div>
          <ChevronLeft size={20} className="text-white/60" />
        </button>

        {/* Pricing Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <Shield size={22} className="mx-auto text-teal-600 mb-2" />
            <div className="font-bold text-sm text-[#1e3a5f]">בדיקת AutoLog</div>
            <div className="text-teal-600 font-bold text-lg mt-1">₪350</div>
            <div className="text-[10px] text-gray-400 mt-0.5">+ ₪100 בדיקת מחשב</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <Search size={22} className="mx-auto text-blue-600 mb-2" />
            <div className="font-bold text-sm text-[#1e3a5f]">הכנה לטסט</div>
            <div className="text-teal-600 font-bold text-lg mt-1">₪250</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <Wrench size={22} className="mx-auto text-orange-500 mb-2" />
            <div className="font-bold text-sm text-[#1e3a5f]">אבחון תקלות</div>
            <div className="text-teal-600 font-bold text-lg mt-1">₪150</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <Calendar size={22} className="mx-auto text-purple-500 mb-2" />
            <div className="font-bold text-sm text-[#1e3a5f]">טיפול תקופתי</div>
            <div className="text-teal-600 font-bold text-lg mt-1">החל מ-₪550</div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div>
          <h2 className="text-lg font-bold text-[#1e3a5f] mb-3 flex items-center gap-2">
            <Calendar size={18} className="text-teal-600" />
            תורים קרובים
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-teal-600" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">אין תורים קרובים</p>
              <button
                onClick={() => router.push('/user/book-garage')}
                className="mt-3 text-teal-600 text-sm font-semibold"
              >
                הזמן עכשיו ←
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(appt => {
                const cfg = statusConfig[appt.status] || statusConfig.pending;
                return (
                  <div
                    key={appt.id}
                    onClick={() => router.push('/user/appointments')}
                    className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wrench size={16} className="text-[#1e3a5f]" />
                        <span className="font-bold text-[#1e3a5f]">{serviceTypeLabel(appt.serviceType)}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>
                    {appt.garage && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <MapPin size={14} />
                        <span>{appt.garage.name}{appt.garage.city ? ` • ${appt.garage.city}` : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>
                        {new Date(appt.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {appt.time ? ` • ${appt.time}` : ''}
                      </span>
                    </div>
                    {appt.vehicle && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <Shield size={14} />
                        <span>{appt.vehicle.nickname} • {appt.vehicle.licensePlate}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Appointments */}
        {past.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[#1e3a5f] flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                תורים קודמים
              </h2>
              <button
                onClick={() => router.push('/user/appointments')}
                className="text-sm text-teal-600 font-semibold"
              >
                הכל ←
              </button>
            </div>
            <div className="space-y-2">
              {past.slice(0, 3).map(appt => (
                <div key={appt.id} className="bg-white/70 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CheckCircle size={18} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#1e3a5f]">{serviceTypeLabel(appt.serviceType)}</div>
                    <div className="text-xs text-gray-400">
                      {appt.garage?.name} • {new Date(appt.date).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOS Emergency Button */}
        <button
          onClick={() => router.push('/user/sos')}
          className="w-full bg-gradient-to-l from-red-500 to-red-600 text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <AlertTriangle size={24} />
          <span className="text-lg font-bold">SOS — מצב חירום</span>
        </button>
      </div>
    </div>
  );
}
