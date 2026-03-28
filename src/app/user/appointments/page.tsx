'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  Calendar, Clock, MapPin, Phone, Loader2, AlertCircle,
  ChevronLeft, Plus, Trash2, CheckCircle2, Wrench,
  ClipboardCheck, Car, Settings2, Play, Shield, Brain, TrendingUp, Target,
  X, CalendarDays, Timer, CircleDot, ChevronDown, Sparkles,
} from 'lucide-react';

interface Appointment {
  id: string;
  serviceType: string;
  date: string;
  time: string;
  status: string;
  notes?: string;
  completionNotes?: string;
  completedAt?: string;
  garage: {
    id: string;
    name: string;
    city: string;
    phone: string;
    address?: string;
  };
  vehicle: {
    id: string;
    nickname: string;
    manufacturer: string;
    model: string;
    year: number;
    licensePlate: string;
  };
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';

const serviceTypeHeb: Record<string, string> = {
  inspection: 'בדיקה',
  maintenance: 'טיפול',
  repair: 'תיקון',
  test_prep: 'הכנה לטסט',
};

const serviceTypeIcon: Record<string, typeof ClipboardCheck> = {
  inspection: ClipboardCheck,
  maintenance: Wrench,
  repair: Settings2,
  test_prep: Car,
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock; dotColor: string }> = {
  pending: {
    label: 'ממתין לאישור',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Clock,
    dotColor: 'bg-amber-400',
  },
  confirmed: {
    label: 'מאושר',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: CheckCircle2,
    dotColor: 'bg-emerald-400',
  },
  in_progress: {
    label: 'בטיפול',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Play,
    dotColor: 'bg-blue-400',
  },
  completed: {
    label: 'הושלם',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    icon: Shield,
    dotColor: 'bg-teal-400',
  },
  cancelled: {
    label: 'בוטל',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: X,
    dotColor: 'bg-gray-400',
  },
  rejected: {
    label: 'נדחה',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertCircle,
    dotColor: 'bg-red-400',
  },
};

const statusSteps = [
  { key: 'pending', label: 'ממתין', icon: Clock },
  { key: 'confirmed', label: 'אושר', icon: CheckCircle2 },
  { key: 'in_progress', label: 'בטיפול', icon: Play },
  { key: 'completed', label: 'הושלם', icon: Shield },
];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <X size={16} className="text-red-500" />
        </div>
        <div>
          <span className="text-sm font-bold text-red-700">התור בוטל</span>
          <p className="text-xs text-red-500 mt-0.5">התור בוטל על ידי המשתמש</p>
        </div>
      </div>
    );
  }

  if (currentStatus === 'rejected') {
    return (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle size={16} className="text-red-500" />
        </div>
        <div>
          <span className="text-sm font-bold text-red-700">ההזמנה נדחתה</span>
          <p className="text-xs text-red-500 mt-0.5">המוסך דחה את ההזמנה</p>
        </div>
      </div>
    );
  }

  const currentIndex = statusSteps.findIndex(s => s.key === currentStatus);

  return (
    <div className="relative px-2 py-4">
      {/* Progress bar background */}
      <div className="absolute top-[28px] right-[32px] left-[32px] h-1 bg-gray-200 rounded-full" />
      {/* Progress bar filled */}
      <div
        className="absolute top-[28px] right-[32px] h-1 bg-gradient-to-l from-teal-400 to-teal-600 rounded-full transition-all duration-500"
        style={{ width: `${(currentIndex / (statusSteps.length - 1)) * (100 - 15)}%` }}
      />

      <div className="relative flex items-start justify-between">
        {statusSteps.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200 scale-110 ring-4 ring-teal-100'
                  : isDone
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
              }`}>
                <Icon size={16} />
              </div>
              <span className={`text-[11px] font-semibold text-center leading-tight ${
                isActive ? 'text-teal-700' : isDone ? 'text-teal-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentStatusChip({ status }: { status: string }) {
  const config = statusConfig[status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bgColor} ${config.color} border ${config.borderColor}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${status === 'in_progress' ? 'animate-pulse' : ''}`} />
      {config.label}
    </div>
  );
}

export default function AppointmentsPage() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const url = new URL('/api/appointments', window.location.origin);
        if (filter !== 'all') {
          url.searchParams.set('status', filter);
        }
        const res = await fetch(url.toString());
        if (res.status === 401) { window.location.href = '/auth/login'; return; }
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'שגיאה בטעינת התורים');
          setLoading(false);
          return;
        }
        setAppointments(data.appointments || []);
        setError('');
      } catch {
        setError('שגיאת חיבור');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [filter]);

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    setCancelling(true);
    setError('');
    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בביטול התור');
        setCancelling(false);
        return;
      }
      setAppointments(prev => prev.map(apt => apt.id === selectedAppointment.id ? { ...apt, status: 'cancelled' } : apt));
      setShowCancelModal(false);
      setShowDetailModal(false);
      setSelectedAppointment(null);
    } catch {
      setError('שגיאת חיבור');
      setCancelling(false);
    }
  };

  const canCancel = (status: string) => status === 'pending' || status === 'confirmed';

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const getServiceLabel = (type: string) => serviceTypeHeb[type] || type;
  const getServiceIcon = (type: string) => {
    const Icon = serviceTypeIcon[type] || ClipboardCheck;
    return <Icon size={20} />;
  };

  // Counts
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const inProgressCount = appointments.filter(a => a.status === 'in_progress').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const totalActive = pendingCount + confirmedCount + inProgressCount;

  // AI
  const getNextAppointment = () => {
    const upcoming = appointments
      .filter(a => a.status !== 'completed' && a.status !== 'cancelled' && a.status !== 'rejected')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0];
  };
  const getMostVisitedGarage = () => {
    if (appointments.length === 0) return null;
    const garageCounts: Record<string, { name: string; count: number }> = {};
    appointments.forEach(apt => {
      if (!garageCounts[apt.garage.id]) garageCounts[apt.garage.id] = { name: apt.garage.name, count: 0 };
      garageCounts[apt.garage.id].count++;
    });
    return Object.values(garageCounts).sort((a, b) => b.count - a.count)[0];
  };
  const nextAppt = getNextAppointment();
  const mostVisited = getMostVisitedGarage();

  const filterTabs: { key: FilterStatus; label: string; count?: number; activeColor: string }[] = [
    { key: 'all', label: 'הכל', count: appointments.length, activeColor: 'bg-[#1e3a5f]' },
    { key: 'pending', label: 'ממתין', count: pendingCount, activeColor: 'bg-amber-500' },
    { key: 'confirmed', label: 'מאושר', count: confirmedCount, activeColor: 'bg-emerald-500' },
    { key: 'in_progress', label: 'בטיפול', count: inProgressCount, activeColor: 'bg-blue-500' },
    { key: 'completed', label: 'הושלם', count: completedCount, activeColor: 'bg-teal-500' },
    { key: 'rejected', label: 'נדחה', activeColor: 'bg-red-500' },
    { key: 'cancelled', label: 'בוטל', activeColor: 'bg-gray-500' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <span className="text-sm text-gray-400">טוען תורים...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-12 lg:pt-0" dir="rtl">
      {/* Hero Header */}
      <div className="bg-gradient-to-l from-[#1a3a5c] to-[#0d7377] rounded-2xl mx-3 sm:mx-0 p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/user/book-garage')}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <Plus size={16} />
              <span>תור חדש</span>
            </button>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">התורים שלי</h1>
                <p className="text-white/50 text-xs mt-0.5">ניהול ומעקב אחר התורים שלך</p>
              </div>
              <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center">
                <CalendarDays size={22} className="text-white/80" />
              </div>
            </div>
          </div>

          {/* Mini Stats in Header */}
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{pendingCount}</div>
              <div className="text-[10px] text-white/60 font-medium mt-0.5">ממתינים</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-300">{confirmedCount}</div>
              <div className="text-[10px] text-white/60 font-medium mt-0.5">מאושרים</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-300">{inProgressCount}</div>
              <div className="text-[10px] text-white/60 font-medium mt-0.5">בטיפול</div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Appointment Banner */}
      {nextAppt && (
        <div
          className="mx-3 sm:mx-0 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all"
          onClick={() => { setSelectedAppointment(nextAppt); setShowDetailModal(true); }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200 flex-shrink-0">
              <Timer size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-teal-700">התור הקרוב</span>
                <AppointmentStatusChip status={nextAppt.status} />
              </div>
              <p className="text-sm font-bold text-[#1e3a5f]">{nextAppt.garage.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(nextAppt.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })} בשעה {nextAppt.time}
              </p>
            </div>
            <ChevronLeft size={18} className="text-teal-400 flex-shrink-0" />
          </div>
        </div>
      )}

      {error && (
        <div className="flex gap-2 mx-3 sm:mx-0 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Filter Tabs - Professional */}
      <div className="mx-3 sm:mx-0">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filterTabs.map(f => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all text-sm border ${
                  isActive
                    ? `${f.activeColor} text-white border-transparent shadow-md`
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{f.label}</span>
                {f.count !== undefined && f.count > 0 && (
                  <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-bold px-1.5 ${
                    isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Insights - Premium */}
      {!loading && appointments.length > 0 && (
        <div className="mx-3 sm:mx-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-purple-200">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1e3a5f]">תובנות חכמות</h2>
                <p className="text-[11px] text-gray-400">סיכום אוטומטי של התורים שלך</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 bg-teal-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp size={14} className="text-teal-600" />
                  </div>
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">סטטיסטיקה</span>
                </div>
                <p className="text-lg font-bold text-[#1e3a5f]">{completedCount} הושלמו</p>
                <p className="text-xs text-gray-500 mt-0.5">{pendingCount} ממתינים · {confirmedCount} מאושרים</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Target size={14} className="text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">מוסך מועדף</span>
                </div>
                {mostVisited ? (
                  <>
                    <p className="text-lg font-bold text-[#1e3a5f] truncate">{mostVisited.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{mostVisited.count} ביקורים</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">אין מוסך מועדף</p>
                )}
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <CalendarDays size={14} className="text-amber-600" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">סה\"כ תורים</span>
                </div>
                <p className="text-lg font-bold text-[#1e3a5f]">{appointments.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">{totalActive} פעילים · {completedCount} היסטוריים</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="mx-3 sm:mx-0">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 text-center py-14 px-6 shadow-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CalendarDays size={28} className="text-teal-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">אין תורים</h3>
            <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
              {filter === 'all'
                ? 'עדיין לא נקבעו תורים. קבע את התור הראשון!'
                : 'אין תורים בסטטוס הנבחר'}
            </p>
            <button
              onClick={() => router.push('/user/book-garage')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-teal-200 hover:shadow-xl hover:from-teal-600 hover:to-teal-700 transition-all"
            >
              <Plus size={16} />
              קבע תור חדש
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map(appointment => {
              const appointmentDate = new Date(appointment.date);
              const isInProgress = appointment.status === 'in_progress';
              const isCancelled = appointment.status === 'cancelled' || appointment.status === 'rejected';
              const config = statusConfig[appointment.status] || statusConfig.pending;

              return (
                <div
                  key={appointment.id}
                  onClick={() => { setSelectedAppointment(appointment); setShowDetailModal(true); }}
                  className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-lg group ${
                    isInProgress
                      ? 'border-blue-200 shadow-md shadow-blue-50'
                      : isCancelled
                        ? 'border-gray-200 opacity-60'
                        : 'border-gray-100 hover:border-teal-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Date Column */}
                    <div className="flex-shrink-0 w-14 text-center">
                      <div className={`rounded-xl p-2 ${isInProgress ? 'bg-blue-50' : 'bg-[#fef7ed]'}`}>
                        <div className={`text-xl font-bold ${isInProgress ? 'text-blue-700' : 'text-[#1e3a5f]'}`}>
                          {appointmentDate.getDate()}
                        </div>
                        <div className="text-[10px] font-medium text-gray-500">
                          {appointmentDate.toLocaleDateString('he-IL', { month: 'short' })}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 font-medium">{appointment.time}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <h3 className="font-bold text-[#1e3a5f] text-base truncate">{appointment.garage.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isInProgress ? 'bg-blue-100 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
                              {getServiceIcon(appointment.serviceType)}
                            </div>
                            <span className="text-xs text-gray-500">{getServiceLabel(appointment.serviceType)}</span>
                          </div>
                        </div>
                        <AppointmentStatusChip status={appointment.status} />
                      </div>

                      {/* Vehicle + Location row */}
                      <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Car size={12} className="text-gray-400" />
                          <span className="font-medium">{appointment.vehicle.nickname}</span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-gray-400" />
                          <span>{appointment.garage.city}</span>
                        </div>
                      </div>

                      {/* In-progress live indicator */}
                      {isInProgress && (
                        <div className="mt-2.5 flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                          <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                          </div>
                          <span className="text-xs font-bold text-blue-700">הרכב בטיפול כרגע</span>
                        </div>
                      )}

                      {/* Completion summary */}
                      {appointment.status === 'completed' && appointment.completionNotes && (
                        <div className="mt-2.5 p-2.5 bg-teal-50 border border-teal-100 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2 size={12} className="text-teal-600" />
                            <span className="text-[11px] font-bold text-teal-700">סיכום טיפול</span>
                          </div>
                          <p className="text-xs text-teal-800 line-clamp-2">{appointment.completionNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <ChevronLeft size={18} className="text-gray-300 group-hover:text-teal-500 transition-colors flex-shrink-0 mt-2" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal && !!selectedAppointment}
        onClose={() => setShowDetailModal(false)}
        title="פרטי התור"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-5">
            <StatusTimeline currentStatus={selectedAppointment.status} />

            {/* Garage Info Card */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <MapPin size={18} className="text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1e3a5f]">{selectedAppointment.garage.name}</h3>
                  <p className="text-xs text-gray-500">{selectedAppointment.garage.address || selectedAppointment.garage.city}</p>
                </div>
              </div>
              <a
                href={`tel:${selectedAppointment.garage.phone}`}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 transition"
              >
                <Phone size={14} />
                {selectedAppointment.garage.phone}
              </a>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'שירות', value: getServiceLabel(selectedAppointment.serviceType), icon: Wrench },
                { label: 'תאריך', value: new Date(selectedAppointment.date).toLocaleDateString('he-IL'), icon: Calendar },
                { label: 'שעה', value: selectedAppointment.time, icon: Clock },
                { label: 'רכב', value: selectedAppointment.vehicle.nickname + ' (' + selectedAppointment.vehicle.licensePlate + ')', icon: Car },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon size={12} className="text-gray-400" />
                    <span className="text-[11px] text-gray-400 font-medium">{item.label}</span>
                  </div>
                  <p className="text-sm font-bold text-[#1e3a5f] truncate">{item.value}</p>
                </div>
              ))}
            </div>

            {selectedAppointment.notes && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <span className="text-[11px] text-gray-400 font-medium">הערות</span>
                <p className="text-sm text-gray-700 mt-1">{selectedAppointment.notes}</p>
              </div>
            )}

            {/* Status Messages */}
            {selectedAppointment.status === 'pending' && (
              <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-amber-600" />
                  <span className="font-bold text-amber-800 text-sm">ממתין לאישור המוסך</span>
                </div>
                <p className="text-xs text-amber-700">למוסך יש 3 דקות לאשר או לדחות. תקבל התראה.</p>
              </div>
            )}

            {selectedAppointment.status === 'rejected' && (
              <div className="bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={16} className="text-red-600" />
                  <span className="font-bold text-red-800 text-sm">ההזמנה נדחתה</span>
                </div>
                <p className="text-xs text-red-700">המוסך דחה את ההזמנה. ניתן לנסות מוסך אחר.</p>
              </div>
            )}

            {selectedAppointment.status === 'in_progress' && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </div>
                  <span className="font-bold text-blue-800 text-sm">הרכב בטיפול</span>
                </div>
                <p className="text-xs text-blue-700">המוסך מטפל כעת ברכב שלך. תקבל עדכון כשהטיפול יסתיים.</p>
              </div>
            )}

            {selectedAppointment.status === 'completed' && selectedAppointment.completionNotes && (
              <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 border border-teal-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className="text-teal-600" />
                  <span className="font-bold text-teal-800 text-sm">סיכום הטיפול</span>
                </div>
                <p className="text-sm text-teal-700">{selectedAppointment.completionNotes}</p>
                {selectedAppointment.completedAt && (
                  <p className="text-xs text-teal-500 mt-2">תאריך סיום: {new Date(selectedAppointment.completedAt).toLocaleDateString('he-IL')}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowDetailModal(false)} className="flex-1">סגור</Button>
              {canCancel(selectedAppointment.status) && (
                <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setShowCancelModal(true)} className="flex-1">בטל תור</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal && !!selectedAppointment}
        onClose={() => setShowCancelModal(false)}
        title="ביטול התור"
        size="sm"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">בטל את התור?</p>
                <p className="text-sm text-amber-700 mt-1">
                  התור ב{selectedAppointment.garage.name} בתאריך{' '}
                  {new Date(selectedAppointment.date).toLocaleDateString('he-IL')} בשעה{' '}
                  {selectedAppointment.time} יבוטל.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowCancelModal(false)} className="w-full sm:w-auto">שוב לא</Button>
              <Button variant="danger" loading={cancelling} onClick={handleCancelAppointment} className="w-full sm:w-auto">כן, בטל</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
