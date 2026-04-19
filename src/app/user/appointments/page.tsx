'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  Calendar, Clock, MapPin, Phone, Loader2, AlertCircle,
  ChevronRight, Plus, Trash2, CheckCircle2, Wrench,
  ClipboardCheck, Car, Settings2, Play, Shield, Brain, TrendingUp, Target,
  Bell, Volume2, X,
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
    manufacturerString: string;
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

const statusSteps = [
  { key: 'pending', label: 'ממתין לאישור', icon: Clock },
  { key: 'confirmed', label: 'מאושר', icon: CheckCircle2 },
  { key: 'in_progress', label: 'בטיפול', icon: Play },
  { key: 'completed', label: 'הושלם', icon: Shield },
];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
        <AlertCircle size={16} className="text-red-500" />
        <span className="text-sm font-medium text-red-700">התור בוטל</span>
      </div>
    );
  }

  if (currentStatus === 'rejected') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
        <X size={16} className="text-red-500" />
        <span className="text-sm font-medium text-red-700">ההזמנה נדחתה על ידי המוסך</span>
      </div>
    );
  }

  const currentIndex = statusSteps.findIndex(s => s.key === currentStatus);

  return (
    <div className="flex items-center justify-between px-2 py-3">
      {statusSteps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        const isFuture = i > currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isActive ? 'bg-teal-600 text-white shadow-md scale-110' :
                isDone ? 'bg-teal-100 text-teal-600' :
                'bg-gray-100 text-gray-400'
              }`}>
                <Icon size={14} />
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight max-w-[60px] ${
                isActive ? 'text-teal-700' : isDone ? 'text-teal-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {i < statusSteps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-16px] ${
                isDone ? 'bg-teal-400' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
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

  // Status change alert state
  const [newAlertCount, setNewAlertCount] = useState(0);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const knownStatusRef = useRef<Map<string, string>>(new Map());
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const initialLoadDone = useRef(false);

  const statusLabelHeb: Record<string, string> = {
    confirmed: 'אושר',
    rejected: 'נדחה',
    in_progress: 'בטיפול',
    completed: 'הושלם',
    cancelled: 'בוטל',
  };

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const t = ctx.currentTime;

      // Two-tone chime: pleasant notification sound
      const frequencies = [587.33, 783.99]; // D5, G5
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.3, t + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * 0.15);
        osc.stop(t + i * 0.15 + 0.5);
      });
    } catch {
      // Audio not available — silent fail
    }
  }, [soundEnabled]);

  // Fetch appointments
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

        const list: Appointment[] = data.appointments || [];
        setAppointments(list);
        // Track known statuses for change detection
        list.forEach(a => knownStatusRef.current.set(a.id, a.status));
        initialLoadDone.current = true;
        setError('');
      } catch {
        setError('שגיאת חיבור');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [filter]);

  // Poll for status changes every 30 seconds
  useEffect(() => {
    if (!initialLoadDone.current) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/appointments');
        if (!res.ok) return;
        const data = await res.json();
        const freshList: Appointment[] = data.appointments || [];

        // Detect status changes
        const changed: { id: string; oldStatus: string; newStatus: string; garageName: string }[] = [];
        freshList.forEach(a => {
          const prev = knownStatusRef.current.get(a.id);
          if (prev && prev !== a.status) {
            changed.push({ id: a.id, oldStatus: prev, newStatus: a.status, garageName: a.garage.name });
          }
          knownStatusRef.current.set(a.id, a.status);
        });

        // Also detect new appointments (in case user booked from another tab)
        const newOnes = freshList.filter(a => !knownStatusRef.current.has(a.id));
        newOnes.forEach(a => knownStatusRef.current.set(a.id, a.status));

        if (changed.length > 0) {
          setAppointments(freshList);
          setNewAlertCount(changed.length);
          const first = changed[0];
          setAlertMessage(
            changed.length === 1
              ? `התור ב${first.garageName} ${statusLabelHeb[first.newStatus] || 'עודכן'}`
              : `${changed.length} תורים עודכנו`
          );
          setShowNewAlert(true);
          playNotificationSound();
          setTimeout(() => setShowNewAlert(false), 10000);
        } else if (newOnes.length > 0) {
          setAppointments(freshList);
        }
      } catch {
        // Silent fail for poll
      }
    }, 30000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [initialLoadDone.current, playNotificationSound]);

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    setCancelling(true);
    setError('');

    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה בביטול התור');
        setCancelling(false);
        return;
      }

      setAppointments(prev =>
        prev.map(apt =>
          apt.id === selectedAppointment.id ? { ...apt, status: 'cancelled' } : apt
        )
      );

      setShowCancelModal(false);
      setShowDetailModal(false);
      setSelectedAppointment(null);
    } catch {
      setError('שגיאת חיבור');
      setCancelling(false);
    }
  };

  const canCancel = (status: string) =>
    status === 'pending' || status === 'confirmed';

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const getServiceLabel = (type: string) => serviceTypeHeb[type] || type;

  const getServiceIcon = (type: string) => {
    const Icon = serviceTypeIcon[type] || ClipboardCheck;
    return <Icon size={20} className="text-teal-600" />;
  };

  // Count per status
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const inProgressCount = appointments.filter(a => a.status === 'in_progress').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  // AI Insights calculations
  const getNextAppointment = () => {
    const upcoming = appointments.filter(a =>
      a.status !== 'completed' && a.status !== 'cancelled'
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0];
  };

  const getMostVisitedGarage = () => {
    if (appointments.length === 0) return null;
    const garageCounts: Record<string, { name: string; count: number }> = {};
    appointments.forEach(apt => {
      if (!garageCounts[apt.garage.id]) {
        garageCounts[apt.garage.id] = { name: apt.garage.name, count: 0 };
      }
      garageCounts[apt.garage.id].count++;
    });
    const sorted = Object.values(garageCounts).sort((a, b) => b.count - a.count);
    return sorted[0];
  };

  const nextAppt = getNextAppointment();
  const mostVisited = getMostVisitedGarage();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fef7ed] pb-24">
        <PageHeader title="התורים שלי" backUrl="/user/service" />
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fef7ed] pb-24" dir="rtl">
      <PageHeader title="התורים שלי" backUrl="/user/service" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-4">
        {/* Status Change Alert Banner */}
        {showNewAlert && (
          <div className="animate-pulse bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bell size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-lg">{alertMessage || `${newAlertCount} עדכונים חדשים`}</p>
                <p className="text-sm text-white/80">התקבל עדכון סטטוס לתורים שלך</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewAlert(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Sound Control */}
        <div className="flex justify-end">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-full transition-colors ${
              soundEnabled ? 'bg-white text-teal-700 shadow-sm' : 'bg-white text-gray-400 shadow-sm'
            }`}
            title={soundEnabled ? 'השתק התראות' : 'הפעל התראות'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <Bell size={18} />}
          </button>
        </div>

        {/* Filter Chips - Horizontal Scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {([
            { key: 'all', label: 'הכל', color: '' },
            { key: 'pending', label: 'ממתין', color: 'bg-amber-400' },
            { key: 'confirmed', label: 'מאושר', color: 'bg-emerald-400' },
            { key: 'in_progress', label: 'בטיפול', color: 'bg-blue-400' },
            { key: 'completed', label: 'הושלם', color: 'bg-teal-400' },
            { key: 'rejected', label: 'נדחה', color: 'bg-red-400' },
            { key: 'cancelled', label: 'מבוטל', color: 'bg-gray-400' },
          ] as { key: FilterStatus; label: string; color: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 ${
                filter === f.key
                  ? 'bg-white text-teal-700 shadow-sm font-semibold'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              {f.color && <span className={`w-1.5 h-1.5 rounded-full ${filter === f.key ? 'bg-teal-600' : f.color}`} />}
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* AI Insights */}
        {!loading && appointments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center">
                <Brain size={18} className="text-teal-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-800">תובנות AI לתורים</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Next Appointment */}
              <div className="bg-[#fef7ed] rounded-xl p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} className="text-teal-600" />
                  <span className="text-xs font-bold text-gray-700">תור הבא</span>
                </div>
                {nextAppt ? (
                  <p className="text-xs text-gray-600">
                    {new Date(nextAppt.date).toLocaleDateString('he-IL')} בשעה {nextAppt.time} ב{nextAppt.garage.name}
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">אין תור קרוב</p>
                )}
              </div>

              {/* Appointments Status Overview */}
              <div className="bg-[#fef7ed] rounded-xl p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-teal-600" />
                  <span className="text-xs font-bold text-gray-700">סטטוס תורים</span>
                </div>
                <p className="text-xs text-gray-600">
                  {pendingCount} ממתינים, {confirmedCount} מאושרים, {completedCount} הושלמו
                </p>
              </div>

              {/* Most Visited Garage */}
              <div className="bg-[#fef7ed] rounded-xl p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} className="text-teal-600" />
                  <span className="text-xs font-bold text-gray-700">מוסך מועדף</span>
                </div>
                {mostVisited ? (
                  <p className="text-xs text-gray-600">
                    {mostVisited.name} ({mostVisited.count} תורים)
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">אין מוסך מועדף</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Calendar size={32} className="text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">אין תורים</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? 'עדיין לא קבעת תורים. קבע תור כעת!'
                : `אין תורים ${filter === 'pending' ? 'ממתינים לאישור' : filter === 'confirmed' ? 'מאושרים' : filter === 'in_progress' ? 'בטיפול' : filter === 'completed' ? 'שהושלמו' : filter === 'rejected' ? 'שנדחו' : 'שבוטלו'}`}
            </p>
            <Button
              icon={<Plus size={16} />}
              onClick={() => router.push('/user/book-garage')}
            >
              קבע תור חדש
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Separate upcoming and past appointments */}
            {filteredAppointments
              .filter(a => a.status !== 'completed' && a.status !== 'cancelled' && a.status !== 'rejected')
              .map(appointment => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onSelect={() => {
                    setSelectedAppointment(appointment);
                    setShowDetailModal(true);
                  }}
                  getServiceLabel={getServiceLabel}
                  getServiceIcon={getServiceIcon}
                />
              ))}

            {/* Past appointments section */}
            {filteredAppointments.some(a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'rejected') && (
              <div className="mt-8">
                <h3 className="text-sm font-bold text-gray-600 mb-3 px-1">תורים קודמים</h3>
                <div className="space-y-3 opacity-60">
                  {filteredAppointments
                    .filter(a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'rejected')
                    .map(appointment => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onSelect={() => {
                          setSelectedAppointment(appointment);
                          setShowDetailModal(true);
                        }}
                        getServiceLabel={getServiceLabel}
                        getServiceIcon={getServiceIcon}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <DetailAndCancelModals
          showDetailModal={showDetailModal}
          selectedAppointment={selectedAppointment}
          setShowDetailModal={setShowDetailModal}
          showCancelModal={showCancelModal}
          setShowCancelModal={setShowCancelModal}
          cancelling={cancelling}
          canCancel={canCancel}
          handleCancelAppointment={handleCancelAppointment}
          getServiceLabel={getServiceLabel}
        />
      </div>
    </div>
  );
}

// Appointment Card Component
function AppointmentCard({
  appointment,
  onSelect,
  getServiceLabel,
  getServiceIcon,
}: {
  appointment: Appointment;
  onSelect: () => void;
  getServiceLabel: (type: string) => string;
  getServiceIcon: (type: string) => React.ReactNode;
}) {
  const appointmentDate = new Date(appointment.date);
  const isInProgress = appointment.status === 'in_progress';

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
    >
      <div className="flex items-start gap-4">
        {/* Service Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
          isInProgress ? 'bg-blue-50' : 'bg-teal-50'
        }`}>
          {getServiceIcon(appointment.serviceType)}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                {appointment.garage.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {getServiceLabel(appointment.serviceType)}
              </p>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          {/* Vehicle Info */}
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <Car size={12} className="text-gray-400" />
            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
              {appointment.vehicle.nickname}
            </span>
            <span className="text-gray-400">•</span>
            <span>{appointment.vehicle.licensePlate}</span>
          </div>

          {/* Time & Location */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <Calendar size={12} className="text-teal-600" />
              {appointmentDate.toLocaleDateString('he-IL')}
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-teal-600" />
              {appointment.time}
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-teal-600" />
              {appointment.garage.city}
            </div>
          </div>

          {/* Timeline dots indicator */}
          <div className="flex items-center gap-1 mt-2">
            <TimelineIndicator status={appointment.status} />
          </div>

          {/* In-progress indicator */}
          {isInProgress && (
            <div className="mt-2 flex items-center gap-2 text-blue-700 bg-blue-50 rounded-lg px-3 py-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium">הרכב בטיפול כרגע</span>
            </div>
          )}

          {/* Rejection reason - shown when rejected */}
          {appointment.status === 'rejected' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <X size={12} className="text-red-600" />
                <span className="text-xs font-bold text-red-700">ההזמנה נדחתה</span>
              </div>
              {appointment.completionNotes && (
                <p className="text-xs text-red-700">סיבה: {appointment.completionNotes}</p>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = '/user/book-garage';
                }}
                className="mt-2 w-full text-center bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
              >
                קבע תור במוסך אחר
              </button>
            </div>
          )}

          {/* Treatment Summary - shown when completed */}
          {appointment.status === 'completed' && appointment.completionNotes && (
            <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={12} className="text-teal-600" />
                <span className="text-xs font-bold text-teal-700">סיכום טיפול</span>
              </div>
              <p className="text-xs text-teal-800">{appointment.completionNotes}</p>
              {appointment.completedAt && (
                <p className="text-xs text-teal-500 mt-1">
                  הושלם: {new Date(appointment.completedAt).toLocaleDateString('he-IL')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="text-teal-600 flex-shrink-0 mt-1">
          <ChevronRight size={20} />
        </div>
      </div>
    </div>
  );
}

// Timeline Indicator Component
function TimelineIndicator({ status }: { status: string }) {
  const steps = ['pending', 'confirmed', 'in_progress', 'completed'];
  const currentIndex = steps.indexOf(status);

  if (status === 'cancelled' || status === 'rejected') {
    return (
      <span className="text-xs text-gray-500">
        {status === 'cancelled' ? 'בוטל' : 'נדחה'}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div
          key={step}
          className={`w-2 h-2 rounded-full ${
            i <= currentIndex ? 'bg-teal-600' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

function DetailAndCancelModals({
  showDetailModal,
  selectedAppointment,
  setShowDetailModal,
  showCancelModal,
  setShowCancelModal,
  cancelling,
  canCancel,
  handleCancelAppointment,
  getServiceLabel,
}: {
  showDetailModal: boolean;
  selectedAppointment: Appointment | null;
  setShowDetailModal: (open: boolean) => void;
  showCancelModal: boolean;
  setShowCancelModal: (open: boolean) => void;
  cancelling: boolean;
  canCancel: (status: string) => boolean;
  handleCancelAppointment: () => Promise<void>;
  getServiceLabel: (type: string) => string;
}) {
  return (
    <>
      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal && !!selectedAppointment}
        onClose={() => setShowDetailModal(false)}
        title="פרטי התור"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            {/* Status Timeline */}
            <StatusTimeline currentStatus={selectedAppointment.status} />

            {/* Appointment Details */}
            <div className="bg-[#fef7ed] border border-gray-200 rounded-2xl p-4 space-y-3 text-sm text-right">
              <div className="flex justify-between">
                <span className="text-gray-600">מוסך:</span>
                <span className="font-medium">{selectedAppointment.garage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">כתובת:</span>
                <span className="font-medium">{selectedAppointment.garage.address || selectedAppointment.garage.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">טלפון:</span>
                <a
                  href={`tel:${selectedAppointment.garage.phone}`}
                  className="font-medium text-teal-600 hover:underline flex items-center gap-1"
                >
                  <Phone size={12} />
                  {selectedAppointment.garage.phone}
                </a>
              </div>
            </div>

            {/* Service Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">שירות</span>
                <p className="font-medium">{getServiceLabel(selectedAppointment.serviceType)}</p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">תאריך</span>
                <p className="font-medium">
                  {new Date(selectedAppointment.date).toLocaleDateString('he-IL')}
                </p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">שעה</span>
                <p className="font-medium">{selectedAppointment.time}</p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">רכב</span>
                <p className="font-medium">{selectedAppointment.vehicle.nickname} ({selectedAppointment.vehicle.licensePlate})</p>
              </div>
            </div>

            {/* Notes */}
            {selectedAppointment.notes && (
              <div>
                <span className="text-gray-500 text-sm">הערות</span>
                <p className="text-sm mt-1">{selectedAppointment.notes}</p>
              </div>
            )}

            {/* Pending message */}
            {selectedAppointment.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-amber-600" />
                  <span className="font-bold text-amber-800 text-sm">ממתין לאישור המוסך</span>
                </div>
                <p className="text-xs text-amber-700">למוסך יש 15 דקות לאשר או לדחות את ההזמנה. תקבל התראה.</p>
              </div>
            )}

            {/* Rejected message */}
            {selectedAppointment.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <X size={16} className="text-red-600" />
                  <span className="font-bold text-red-800 text-sm">ההזמנה נדחתה</span>
                </div>
                {selectedAppointment.completionNotes ? (
                  <p className="text-xs text-red-700">סיבה: {selectedAppointment.completionNotes}</p>
                ) : (
                  <p className="text-xs text-red-700">המוסך דחה את ההזמנה. ניתן לנסות מוסך אחר או לבחור זמן אחר.</p>
                )}
              </div>
            )}

            {/* In-progress message */}
            {selectedAppointment.status === 'in_progress' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="font-bold text-blue-800 text-sm">הרכב בטיפול</span>
                </div>
                <p className="text-xs text-blue-700">המוסך מטפל כעת ברכב שלך. תקבל עדכון כשהטיפול יסתיים.</p>
              </div>
            )}

            {/* Treatment Completion Summary */}
            {selectedAppointment.status === 'completed' && selectedAppointment.completionNotes && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className="text-teal-600" />
                  <span className="font-bold text-teal-800 text-sm">סיכום הטיפול שבוצע</span>
                </div>
                <p className="text-sm text-teal-700">{selectedAppointment.completionNotes}</p>
                {selectedAppointment.completedAt && (
                  <p className="text-xs text-teal-500 mt-2">
                    תאריך סיום: {new Date(selectedAppointment.completedAt).toLocaleDateString('he-IL')}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="ghost"
                onClick={() => setShowDetailModal(false)}
                className="flex-1"
              >
                סגור
              </Button>
              {canCancel(selectedAppointment.status) && (
                <Button
                  variant="danger"
                  icon={<Trash2 size={16} />}
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1"
                >
                  בטל תור
                </Button>
              )}
              {selectedAppointment.status === 'rejected' && (
                <Button
                  icon={<Plus size={16} />}
                  onClick={() => { window.location.href = '/user/book-garage'; }}
                  className="flex-1"
                >
                  קבע תור במוסך אחר
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal && !!selectedAppointment}
        onClose={() => setShowCancelModal(false)}
        title="ביטול התור"
        size="sm"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">בטל את התור?</p>
                <p className="text-sm text-amber-700 mt-1">
                  התור ב{selectedAppointment.garage.name} בתאריך{' '}
                  {new Date(selectedAppointment.date).toLocaleDateString('he-IL')} בשעה{' '}
                  {selectedAppointment.time} יבוטל.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowCancelModal(false)}
                className="w-full sm:w-auto"
              >
                שוב לא
              </Button>
              <Button
                variant="danger"
                loading={cancelling}
                onClick={handleCancelAppointment}
                className="w-full sm:w-auto"
              >
                כן, בטל
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
