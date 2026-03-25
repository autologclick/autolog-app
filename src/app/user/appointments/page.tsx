'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  Calendar, Clock, MapPin, Phone, Loader2, AlertCircle,
  ChevronRight, Plus, Trash2, CheckCircle2, Wrench,
  ClipboardCheck, Car, Settings2, Play, Shield, Brain, TrendingUp, Target,
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

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

const serviceTypeHeb: Record<string, string> = {
  inspection: '××××§×',
  maintenance: '×××¤××',
  repair: '×ª××§××',
  test_prep: '××× × ×××¡×',
};

const serviceTypeIcon: Record<string, typeof ClipboardCheck> = {
  inspection: ClipboardCheck,
  maintenance: Wrench,
  repair: Settings2,
  test_prep: Car,
};

const statusSteps = [
  { key: 'pending', label: '×××ª×× ××××©××¨', icon: Clock },
  { key: 'confirmed', label: '××××©×¨', icon: CheckCircle2 },
  { key: 'in_progress', label: '××××¤××', icon: Play },
  { key: 'completed', label: '×××©××', icon: Shield },
];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
        <AlertCircle size={16} className="text-red-500" />
        <span className="text-sm font-medium text-red-700">××ª××¨ ××××</span>
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

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const url = new URL('/api/appointments', window.location.origin);
        if (filter !== 'all') {
          url.searchParams.set('status', filter);
        }

        const res = await fetch(url.toString());
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || '×©×××× ×××¢×× ×ª ××ª××¨××');
          setLoading(false);
          return;
        }

        setAppointments(data.appointments || []);
        setError('');
      } catch {
        setError('×©××××ª ×××××¨');
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
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '×©×××× ×××××× ××ª××¨');
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
      setError('×©××××ª ×××××¨');
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] rounded-lg border-2 border-[#1e3a5f] flex items-center justify-center">
            <Calendar size={20} className="text-[#1e3a5f]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">××ª××¨×× ×©××</h1>
        </div>
        <Button
          icon={<Plus size={16} />}
          onClick={() => router.push('/user/book-garage')}
          className="w-full sm:w-auto"
        >
          ×§××¢ ×ª××¨ ×××©
        </Button>
      </div>

      {/* Quick Stats */}
      {(pendingCount > 0 || inProgressCount > 0 || confirmedCount > 0) && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex-shrink-0">
              <Clock size={16} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-800">{pendingCount} ×××ª×× ×× ××××©××¨</span>
            </div>
          )}
          {confirmedCount > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex-shrink-0">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">{confirmedCount} ××××©×¨××</span>
            </div>
          )}
          {inProgressCount > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex-shrink-0">
              <Play size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{inProgressCount} ××××¤×× ××¨××¢</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {([
          { key: 'all', label: '×××' },
          { key: 'pending', label: '×××ª×× ××××©××¨' },
          { key: 'confirmed', label: '××××©×¨' },
          { key: 'in_progress', label: '××××¤××' },
          { key: 'completed', label: '×××©××' },
          { key: 'cancelled', label: '×××××' },
        ] as { key: FilterStatus; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition text-sm ${
              filter === f.key
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* AI Insights */}
      {!loading && appointments.length > 0 && (
        <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-teal-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">×ª××× ××ª AI ××ª××¨××</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Next Appointment */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-teal-600" />
                <span className="text-xs font-bold text-gray-700">×ª××¨ ×××</span>
              </div>
              {nextAppt ? (
                <p className="text-xs text-gray-600">
                  ðï¸ {new Date(nextAppt.date).toLocaleDateString('he-IL')} ××©×¢× {nextAppt.time} ×{nextAppt.garage.name}
                </p>
              ) : (
                <p className="text-xs text-gray-600">××× ×ª××¨ ×§×¨××</p>
              )}
            </div>

            {/* Appointments Status Overview */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-teal-600" />
                <span className="text-xs font-bold text-gray-700">×¡××××¡ ×ª××¨××</span>
              </div>
              <p className="text-xs text-gray-600">
                ð {pendingCount} ×××ª×× ××, {confirmedCount} ××××©×¨××, {completedCount} ×××©×××
              </p>
            </div>

            {/* Most Visited Garage */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-teal-600" />
                <span className="text-xs font-bold text-gray-700">×××¡× ×××¢××£</span>
              </div>
              {mostVisited ? (
                <p className="text-xs text-gray-600">
                  ð§ {mostVisited.name} ({mostVisited.count} ×ª××¨××)
                </p>
              ) : (
                <p className="text-xs text-gray-600">××× ×××¡× ×××¢××£</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-12 h-12 bg-[#fef7ed] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} className="text-[#1e3a5f]" />
          </div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">××× ×ª××¨××</h3>
          <p className="text-gray-400 mb-4">
            {filter === 'all'
              ? '×¢×××× ×× ×§××¢×ª ×ª××¨××. ×§××¢ ×ª××¨ ××¢×ª!'
              : `××× ×ª××¨×× ${filter === 'pending' ? '×××ª×× ×× ××××©××¨' : filter === 'confirmed' ? '××××©×¨××' : filter === 'in_progress' ? '××××¤××' : filter === 'completed' ? '×©×××©×××' : '×©×××××'}`}
          </p>
          <Button
            icon={<Plus size={16} />}
            onClick={() => router.push('/user/book-garage')}
          >
            ×§××¢ ×ª××¨ ×××©
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map(appointment => {
            const appointmentDate = new Date(appointment.date);
            const isInProgress = appointment.status === 'in_progress';

            return (
              <Card
                key={appointment.id}
                hover
                onClick={() => {
                  setSelectedAppointment(appointment);
                  setShowDetailModal(true);
                }}
                className={isInProgress ? 'border-blue-300 border-2' : ''}
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
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-[#1e3a5f] text-lg">
                          {appointment.garage.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {getServiceLabel(appointment.serviceType)}
                        </p>
                      </div>
                      <StatusBadge status={appointment.status} />
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Car size={14} className="text-gray-400" />
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                        {appointment.vehicle.nickname}
                      </span>
                      <span className="text-gray-400">â¢</span>
                      <span className="text-xs">{appointment.vehicle.licensePlate}</span>
                    </div>

                    {/* Time & Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-teal-600" />
                        {appointmentDate.toLocaleDateString('he-IL')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-teal-600" />
                        {appointment.time}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-teal-600" />
                        {appointment.garage.city}
                      </div>
                    </div>

                    {/* In-progress indicator */}
                    {isInProgress && (
                      <div className="mt-2 flex items-center gap-2 text-blue-700 bg-blue-50 rounded-lg px-3 py-1.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium">××¨×× ××××¤×× ××¨××¢</span>
                      </div>
                    )}

                    {/* Notes if present */}
                    {appointment.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        ××¢×¨××ª: {appointment.notes}
                      </p>
                    )}

                    {/* Treatment Summary - shown when completed */}
                    {appointment.status === 'completed' && appointment.completionNotes && (
                      <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle2 size={14} className="text-teal-600" />
                          <span className="text-xs font-bold text-teal-700">×¡×××× ×××¤××</span>
                        </div>
                        <p className="text-sm text-teal-800">{appointment.completionNotes}</p>
                        {appointment.completedAt && (
                          <p className="text-xs text-teal-500 mt-1">
                            ×××©××: {new Date(appointment.completedAt).toLocaleDateString('he-IL')}
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
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal && !!selectedAppointment}
        onClose={() => setShowDetailModal(false)}
        title="×¤×¨×× ××ª××¨"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            {/* Status Timeline */}
            <StatusTimeline currentStatus={selectedAppointment.status} />

            {/* Appointment Details */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3 text-sm text-right">
              <div className="flex justify-between">
                <span className="text-gray-600">×××¡×:</span>
                <span className="font-medium">{selectedAppointment.garage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">××ª×××ª:</span>
                <span className="font-medium">{selectedAppointment.garage.address || selectedAppointment.garage.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">×××¤××:</span>
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
                <span className="text-gray-500 block mb-1">×©××¨××ª</span>
                <p className="font-medium">{getServiceLabel(selectedAppointment.serviceType)}</p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">×ª××¨××</span>
                <p className="font-medium">
                  {new Date(selectedAppointment.date).toLocaleDateString('he-IL')}
                </p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">×©×¢×</span>
                <p className="font-medium">{selectedAppointment.time}</p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">×¨××</span>
                <p className="font-medium">{selectedAppointment.vehicle.nickname} ({selectedAppointment.vehicle.licensePlate})</p>
              </div>
            </div>

            {/* Notes */}
            {selectedAppointment.notes && (
              <div>
                <span className="text-gray-500 text-sm">××¢×¨××ª</span>
                <p className="text-sm mt-1">{selectedAppointment.notes}</p>
              </div>
            )}

            {/* Pending message */}
            {selectedAppointment.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-amber-600" />
                  <span className="font-bold text-amber-800 text-sm">×××ª×× ××××©××¨ ××××¡×</span>
                </div>
                <p className="text-xs text-amber-700">××××¡× ×××©×¨ ××ª ××ª××¨ ×©×× ××§×¨×× ××ª×§×× ××ª×¨××.</p>
              </div>
            )}

            {/* In-progress message */}
            {selectedAppointment.status === 'in_progress' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="font-bold text-blue-800 text-sm">××¨×× ××××¤××</span>
                </div>
                <p className="text-xs text-blue-700">××××¡× ×××¤× ××¢×ª ××¨×× ×©××. ×ª×§×× ×¢×××× ××©××××¤×× ××¡×ª×××.</p>
              </div>
            )}

            {/* Treatment Completion Summary */}
            {selectedAppointment.status === 'completed' && selectedAppointment.completionNotes && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className="text-teal-600" />
                  <span className="font-bold text-teal-800 text-sm">×¡×××× ××××¤×× ×©×××¦×¢</span>
                </div>
                <p className="text-sm text-teal-700">{selectedAppointment.completionNotes}</p>
                {selectedAppointment.completedAt && (
                  <p className="text-xs text-teal-500 mt-2">
                    ×ª××¨×× ×¡×××: {new Date(selectedAppointment.completedAt).toLocaleDateString('he-IL')}
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
                ×¡×××¨
              </Button>
              {canCancel(selectedAppointment.status) && (
                <Button
                  variant="danger"
                  icon={<Trash2 size={16} />}
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1"
                >
                  ××× ×ª××¨
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
        title="××××× ××ª××¨"
        size="sm"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">××× ××ª ××ª××¨?</p>
                <p className="text-sm text-amber-700 mt-1">
                  ××ª××¨ ×{selectedAppointment.garage.name} ××ª××¨××{' '}
                  {new Date(selectedAppointment.date).toLocaleDateString('he-IL')} ××©×¢×{' '}
                  {selectedAppointment.time} ×××××.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowCancelModal(false)}
                className="w-full sm:w-auto"
              >
                ×©×× ××
              </Button>
              <Button
                variant="danger"
                loading={cancelling}
                onClick={handleCancelAppointment}
                className="w-full sm:w-auto"
              >
                ××, ×××
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
