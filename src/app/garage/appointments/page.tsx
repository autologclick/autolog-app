'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  Calendar, Clock, Phone, Check, X, Loader2,
  Play, CheckCircle2, AlertCircle, FileText, User, Car, Shield,
  Brain, TrendingUp, Target, Timer, Bell, Volume2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  date: string;
  time: string;
  serviceType: string;
  status: string;
  notes?: string;
  completionNotes?: string;
  completedAt?: string;
  createdAt: string;
  user: {
    fullName: string;
    phone: string | null;
  };
  vehicle: {
    nickname: string;
    licensePlate: string;
    model: string;
  };
}

const serviceTypeHeb: Record<string, string> = {
  inspection: 'בדיקה',
  maintenance: 'טיפול',
  repair: 'תיקון',
  test_prep: 'הכנה לטסט',
};

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Completion modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingAppointment, setCompletingAppointment] = useState<Appointment | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Cancel confirm modal (for confirmed/in_progress)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);

  // Reject modal (for pending appointments)
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingAppointment, setRejectingAppointment] = useState<Appointment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Countdown timer state
  const RESPONSE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // New appointment alert
  const [newAlertCount, setNewAlertCount] = useState(0);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const initialLoadDone = useRef(false);

  // Filter
  const [filter, setFilter] = useState<'all' | 'pending' | 'today' | 'in_progress' | 'upcoming' | 'completed'>('all');

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // Two-tone chime: pleasant notification sound
      const frequencies = [587.33, 783.99]; // D5, G5
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.5);
      });
    } catch {
      // Audio not available — silent fail
    }
  }, [soundEnabled]);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/garage/appointments?limit=200');
      if (res.ok) {
        const data = await res.json();
        const list: Appointment[] = data.appointments || [];
        setAppointments(list);
        // Track known IDs so we only alert on truly new ones
        list.forEach(a => knownIdsRef.current.add(a.id));
        initialLoadDone.current = true;
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading appointments:', err);
      }
      setError('שגיאה בטעינת התורים');
    } finally {
      setLoading(false);
    }
  };

  // Poll for new appointments every 30 seconds
  useEffect(() => {
    if (!initialLoadDone.current) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/garage/appointments?limit=200');
        if (!res.ok) return;
        const data = await res.json();
        const freshAppointments: Appointment[] = data.appointments || [];

        // Detect new appointments
        const newOnes = freshAppointments.filter(a => !knownIdsRef.current.has(a.id));
        if (newOnes.length > 0) {
          newOnes.forEach(a => knownIdsRef.current.add(a.id));
          setAppointments(freshAppointments);
          setNewAlertCount(newOnes.length);
          setShowNewAlert(true);
          playNotificationSound();

          // Auto-hide after 10 seconds
          setTimeout(() => setShowNewAlert(false), 10000);
        }
      } catch {
        // Silent fail for poll
      }
    }, 30000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [initialLoadDone.current, playNotificationSound]);

  // Timer: update "now" every second when there are pending appointments
  useEffect(() => {
    const hasPending = appointments.some(a => a.status === 'pending');
    if (hasPending) {
      timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appointments]);

  // Calculate remaining seconds for a pending appointment
  const getRemainingSeconds = useCallback((createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const elapsed = now - created;
    const remaining = RESPONSE_TIMEOUT_MS - elapsed;
    return Math.max(0, Math.ceil(remaining / 1000));
  }, [now]);

  // Format seconds as M:SS
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const updateStatus = async (appointmentId: string, status: string, notes?: string, rejReason?: string) => {
    setUpdating(appointmentId);
    setError('');
    setSuccess('');

    try {
      const body: any = { status };
      if (notes) body.completionNotes = notes;
      if (rejReason) body.rejectionReason = rejReason;

      const res = await fetch(`/api/garage/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה בעדכון הסטטוס');
        return;
      }

      // Update local state
      setAppointments(prev =>
        prev.map(a => a.id === appointmentId ? { ...a, status, completionNotes: notes || a.completionNotes } : a)
      );

      setSuccess(data.message || 'הסטטוס עודכן בהצלחה');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('שגיאת חיבור');
    } finally {
      setUpdating(null);
    }
  };

  const handleConfirm = (appointment: Appointment) => {
    updateStatus(appointment.id, 'confirmed');
  };

  const handleStartWork = (appointment: Appointment) => {
    updateStatus(appointment.id, 'in_progress');
  };

  const openCompleteModal = (appointment: Appointment) => {
    setCompletingAppointment(appointment);
    setCompletionNotes('');
    setShowCompleteModal(true);
  };

  const handleComplete = () => {
    if (!completingAppointment) return;
    updateStatus(completingAppointment.id, 'completed', completionNotes || undefined);
    setShowCompleteModal(false);
    setCompletingAppointment(null);
  };

  const openCancelModal = (appointment: Appointment) => {
    setCancellingAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancel = () => {
    if (!cancellingAppointment) return;
    updateStatus(cancellingAppointment.id, 'cancelled');
    setShowCancelModal(false);
    setCancellingAppointment(null);
  };

  const openRejectModal = (appointment: Appointment) => {
    setRejectingAppointment(appointment);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = () => {
    if (!rejectingAppointment) return;
    updateStatus(rejectingAppointment.id, 'rejected', undefined, rejectionReason || undefined);
    setShowRejectModal(false);
    setRejectingAppointment(null);
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter(a => {
    const apptDate = a.date.split('T')[0];
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'in_progress') return a.status === 'in_progress';
    if (filter === 'today') return apptDate === today;
    if (filter === 'upcoming') return apptDate > today && a.status !== 'completed' && a.status !== 'cancelled';
    if (filter === 'completed') return a.status === 'completed';
    return true;
  }).sort((a, b) => {
    // Priority sort: pending first, then in_progress, then confirmed, then others
    const priority: Record<string, number> = { pending: 0, in_progress: 1, confirmed: 2, completed: 3, cancelled: 4, rejected: 5 };
    const pa = priority[a.status] ?? 5;
    const pb = priority[b.status] ?? 5;
    if (pa !== pb) return pa - pb;
    // Within same status, sort by date ascending (nearest first)
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const todayCount = appointments.filter(a => a.date.split('T')[0] === today).length;
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const inProgressCount = appointments.filter(a => a.status === 'in_progress').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  const getActionButtons = (appointment: Appointment) => {
    const isUpdating = updating === appointment.id;
    const buttons = [];

    // Phone button always visible
    if (appointment.user.phone) {
      buttons.push(
        <a
          key="phone"
          href={`tel:${appointment.user.phone}`}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
          title="התקשר ללקוח"
        >
          <Phone size={14} className="text-gray-600" />
        </a>
      );
    }

    if (appointment.status === 'pending') {
      const remaining = getRemainingSeconds(appointment.createdAt);
      const isExpired = remaining <= 0;

      // Countdown timer badge
      buttons.push(
        <div
          key="timer"
          className={`h-8 px-2 rounded-lg flex items-center gap-1 text-xs font-bold ${
            isExpired
              ? 'bg-red-100 text-red-700'
              : remaining <= 60
              ? 'bg-red-100 text-red-600 animate-pulse'
              : remaining <= 120
              ? 'bg-amber-100 text-amber-700'
              : 'bg-blue-100 text-blue-700'
          }`}
          title="זמן שנותר לתגובה"
        >
          <Timer size={14} />
          <span>{isExpired ? 'פג תוקף' : formatCountdown(remaining)}</span>
        </div>
      );

      if (!isExpired) {
        buttons.push(
          <button
            key="confirm"
            onClick={() => handleConfirm(appointment)}
            disabled={isUpdating}
            className="h-8 px-3 rounded-lg bg-emerald-100 flex items-center justify-center gap-1 hover:bg-emerald-200 transition disabled:opacity-50 text-xs font-medium text-emerald-700"
            title="אשר תור"
          >
            {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            <span>אשר</span>
          </button>
        );
      }
      buttons.push(
        <button
          key="reject"
          onClick={() => openRejectModal(appointment)}
          disabled={isUpdating}
          className="h-8 px-3 rounded-lg bg-red-100 flex items-center justify-center gap-1 hover:bg-red-200 transition disabled:opacity-50 text-xs font-medium text-red-700"
          title="דחה הזמנה"
        >
          <X size={14} />
          <span>{isExpired ? 'דחה (פג תוקף)' : 'דחה'}</span>
        </button>
      );
    }

    if (appointment.status === 'confirmed') {
      buttons.push(
        <button
          key="start"
          onClick={() => handleStartWork(appointment)}
          disabled={isUpdating}
          className="h-8 px-3 rounded-lg bg-blue-100 flex items-center justify-center gap-1 hover:bg-blue-200 transition disabled:opacity-50 text-xs font-medium text-blue-700"
          title="התחל טיפול"
        >
          {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          <span>התחל</span>
        </button>
      );
      buttons.push(
        <button
          key="cancel"
          onClick={() => openCancelModal(appointment)}
          disabled={isUpdating}
          className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition disabled:opacity-50"
          title="בטל תור"
        >
          <X size={14} className="text-red-600" />
        </button>
      );
    }

    if (appointment.status === 'in_progress') {
      buttons.push(
        <button
          key="complete"
          onClick={() => openCompleteModal(appointment)}
          disabled={isUpdating}
          className="h-8 px-3 rounded-lg bg-emerald-100 flex items-center justify-center gap-1 hover:bg-emerald-200 transition disabled:opacity-50 text-xs font-medium text-emerald-700"
          title="סיים טיפול"
        >
          {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          <span>סיים טיפול</span>
        </button>
      );
    }

    if (appointment.status === 'completed') {
      buttons.push(
        <button
          key="inspection"
          onClick={() => router.push(`/garage/new-inspection?appointmentId=${appointment.id}`)}
          className="h-8 px-3 rounded-lg bg-teal-100 flex items-center justify-center gap-1 hover:bg-teal-200 transition text-xs font-medium text-teal-700"
          title="צור#g^O^W^\�^G^O^g^�^P�(���������(�����������M������ͥ�������(����������������^�^W^��^G^O^g^�^P������(�����������ѽ��(��������(�����((����ɕ��ɸ����ѽ���(����((����������������(����ɕ��ɸ��(�������؁�����9�����������؁�д�ȁ����д���(���������؁�����9���􉙱����ѕ�̵���ѕȁ����̈�(�����������؁�����9����ܴ�����������l����ݕ�t�ɽչ���������ɑ�ȴȁ��ɑ�ȵl�Ŕ̈́ՙt�������ѕ�̵���ѕȁ���ѥ�䵍��ѕȈ�(�������������������ȁize={20} className="text-[#1e3a5f]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">ניהול תורים</h1>
        </div>
        <Card className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#fef7ed] rounded-lg border-2 border-[#1e3a5f] flex items-center justify-center shadow-sm">
          <Calendar size={20} className="text-[#1e3a5f]" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">ניהול תורים</h1>
          <p className="text-sm text-gray-500">צפייה ועדכון תורים</p>
        </div>
        <button
          onClick={() => setSoundEnabled(prev => !prev)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
            soundEnabled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
          title={soundEnabled ? 'צליל התראה פעיל' : 'צליל התראה כבוי'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <Bell size={18} />}
        </button>
      </div>

      {/* New Appointment Alert Banner */}
      {showNewAlert && (
        <div className="animate-pulse bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell size={22} className="animate-bounce" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-base">
              {newAlertCount === 1 ? '🔔 תור חדש התקבל!' : `🔔 ${newAlertCount} תורים חדשים התקבלו!`}
            </p>
            <p className="text-sm text-white/90">לחץ על &quot;ממתינים&quot; כדי לצפות ולאשר</p>
          </div>
          <button
            onClick={() => { setShowNewAlert(false); setFilter('pending'); }}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            הצג
          </button>
          <button
            onClick={() => setShowNewAlert(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600">{todayCount}</div>
          <div className="text-xs text-gray-500 mt-1">היום</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-xs text-gray-500 mt-1">ממתינים</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
          <div className="text-xs text-gray-500 mt-1">בטיפול</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-600">{completedCount}</div>
          <div className="text-xs text-gray-500 mt-1">הושלמו</div>
        </div>
      </div>

      {/* AI Insights */}
      {appointments.length > 0 && (
        <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">תובנות AI לתורים</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-amber-600" />
                <span className="text-xs font-bold text-gray-700">תורים ממתינים</span>
              </div>
              <p className="text-xs text-gray-600">
                {pendingCount > 3
                  ? `⚠️ ${pendingCount} תורים ממתינים — יש 15 דקות לאשר כל הזמנה לפני שתידחה אוטומטית!`
                  : pendingCount > 0
                  ? `📍 ${pendingCount} תורים ממתינים. זכרו: 15 דקות לאישור לפני דחייה אוטומטית.`
                  : '✅ כל התורים מאושרים — עבודה מצוינת!'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-gray-700">עומס יומי</span>
              </div>
              <p className="text-xs text-gray-600">
                {todayCount >= 5
                  ? `⚡ יום עמוס! ${todayCount} תורים להיום. ודאו שיש מספיק צוות.`
                  : todayCount >= 2
                  ? `📍 ${todayCount} תורים להיום — קצב פעילות טוב.`
                  : todayCount === 1
                  ? '📅 תור אחד להיום. יש מקום לתורים נוספים.'
                  : '🕐 אין תורים להיום. הזדמנות לשיווק ופנייה ללקוחות.'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-gray-700">יחס השלמה</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const total = appointments.length;
                  const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
                  return rate >= 80
                    ? `⭐ יחס השלמה ${rate}% — ביצועים מעולים!`
                    : rate >= 50
                    ? `📊 יחס השלמה ${rate}%. שאפו ל-80%+ לשיפור שביעות רצון.`
                    : total > 0
                    ? `📈 יחס השלמה ${rate}%. מומלץ לעקוב אחר תורים שלא הושלמו.`
                    : '📋 אין מספיק נתונים לניתוח.';
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'הכל' },
          { key: 'pending', label: `ממתינים (${pendingCount})` },
          { key: 'in_progress', label: `בטיפול (${inProgressCount})` },
          { key: 'today', label: 'היום' },
          { key: 'upcoming', label: 'קרובים' },
          { key: 'completed', label: 'הושלמו' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition text-sm ${
              filter === f.key
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">אין תורים להצגה</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map(a => {
            const apptDate = new Date(a.date);
            const isToday = a.date.split('T')[0] === today;

            return (
              <Card key={a.id} className={`${
                a.status === 'in_progress' ? 'border-blue-300 border-2' :
                a.status === 'pending' ? 'border-amber-300 border-2' : ''
              }`}>
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  {/* Time Badge */}
                  <div className={`text-center rounded-lg p-2 min-w-[70px] ${
                    isToday ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <div className={`text-xs font-medium ${isToday ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {isToday ? 'היום' : apptDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {a.time}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="font-bold text-sm sm:text-base">{a.user.fullName}</span>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-1">
                      <Car size={14} className="text-gray-400" />
                      <span>{a.vehicle.nickname} ({a.vehicle.licensePlate})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                      <FileText size={14} className="text-gray-400" />
                      <span>{serviceTypeHeb[a.serviceType] || a.serviceType}</span>
                    </div>
                    {a.notes && (
                      <div className="text-xs text-gray-400 mt-1 italic">הערות: {a.notes}</div>
                    )}
                    {a.status === 'completed' && a.completionNotes && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-xs text-emerald-700">
                        <span className="font-medium">סיכום טיפול:</span> {a.completionNotes}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1.5 items-center flex-wrap sm:flex-nowrap">
                    {getActionButtons(a)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Complete Modal */}
      <Modal
        isOpen={showCompleteModal && !!completingAppointment}
        onClose={() => setShowCompleteModal(false)}
        title="סיום טיפול ותיעוד"
        size="md"
      >
        {completingAppointment && (
          <div className="space-y-4">
            {/* Appointment Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">לקוח:</span>
                <span className="font-medium">{completingAppointment.user.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">רכב:</span>
                <span className="font-medium">{completingAppointment.vehicle.nickname} ({completingAppointment.vehicle.licensePlate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">שירות:</span>
                <span className="font-medium">{serviceTypeHeb[completingAppointment.serviceType] || completingAppointment.serviceType}</span>
              </div>
            </div>

            {/* Completion Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 text-right mb-2">
                תיעוד הטיפול שבוצע
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="תאר את הטיפול שבוצע, חלקים שהוחלפו, המלצות ללקוח..."
                className="w-full p-3 border border-gray-300 rounded-xl text-right resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={4}
                dir="rtl"
              />
              <p className="text-xs text-gray-400 text-right mt-1">
                התיעוד יישלח ללקוח ויופיע במערכת המעקב שלו
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <button
                  onClick={handleComplete}
                  disabled={updating === completingAppointment.id}
                  className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updating === completingAppointment.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  סיים וידע את הלקוח
                </button>
              </div>
              <button
                onClick={() => {
                  handleComplete();
                  router.push(`/garage/new-inspection?appointmentId=${completingAppointment.id}`);
                }}
                className="w-full bg-teal-600 text-white rounded-xl py-2.5 font-medium hover:bg-teal-700 transition flex items-center justify-center gap-2 text-sm"
              >
                <Shield size={16} />
                סיים + פור דוח בדיקה
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal (for confirmed/in_progress) */}
      <Modal
        isOpen={showCancelModal && !!cancellingAppointment}
        onClose={() => setShowCancelModal(false)}
        title="ביטול תור"
        size="sm"
      >
        {cancellingAppointment && (
          <div className="space-y-4">
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">בטל את התור?</p>
                <p className="text-sm text-amber-700 mt-1">
                  התור של {cancellingAppointment.user.fullName} בתאריך{' '}
                  {new Date(cancellingAppointment.date).toLocaleDateString('he-IL')} בשעה{' '}
                  {cancellingAppointment.time} יבוטל והלקוח יקבל הודעה.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
              >
                חזור
              </Button>
              <Button
                variant="danger"
                onClick={handleCancel}
                loading={updating === cancellingAppointment.id}
                className="flex-1"
              >
                כן, בטל
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal (for pending appointments) */}
      <Modal
        isOpen={showRejectModal && !!rejectingAppointment}
        onClose={() => setShowRejectModal(false)}
        title="דחיית הזמנה"
        size="sm"
      >
        {rejectingAppointment && (
          <div className="space-y-4" dir="rtl">
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">דחה את ההזמנה?</p>
                <p className="text-sm text-red-700 mt-1">
                  ההזמנה של {rejectingAppointment.user.fullName} ל{serviceTypeHeb[rejectingAppointment.serviceType] || rejectingAppointment.serviceType} תידחה והלקוח יקבל הודעה.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 text-right mb-2">
                סיבת דחייה (אופציונלי)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="לדוגמה: אין תור פנוי בזמן זה, הציוד לא זמין..."
                className="w-full p-3 border border-gray-300 rounded-xl text-right resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={2}
                maxLength={300}
                dir="rtl"
              />
              <p className="text-xs text-gray-400 text-right mt-1">
                עד 300 תווים. הסיבה תישלח ללקוח.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowRejectModal(false)}
                className="flex-1"
              >
                חזור
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                loading={updating === rejectingAppointment.id}
                className="flex-1"
              >
                דחה הזמנה
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
