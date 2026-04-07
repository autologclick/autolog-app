'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import {
  FileCheck, Calendar, Receipt, AlertTriangle, ChevronDown,
  Loader2, Car, Filter, ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Vehicle {
  id: string;
  nickname: string;
  licensePlate: string;
  manufacturer: string;
  model: string;
}

interface HistoryEvent {
  id: string;
  type: 'inspection' | 'appointment' | 'expense' | 'sos';
  title: string;
  description?: string;
  date: string;
  status: string;
  vehicleId?: string;
  vehicle?: { nickname: string; licensePlate: string };
  amount?: number;
  currency?: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const limit = 20;

  useEffect(() => {
    Promise.all([
      fetch('/api/vehicles').then(r => r.json()).catch(() => ({ vehicles: [] })),
    ]).then(([vData]) => {
      if (vData.vehicles?.length > 0) {
        setVehicles(vData.vehicles);
      }
      loadHistory(0);
    });
  }, []);

  const loadHistory = async (newOffset: number) => {
    const params = new URLSearchParams();
    if (selectedVehicleId !== 'all') params.append('vehicleId', selectedVehicleId);
    if (selectedEventType !== 'all') params.append('type', selectedEventType);
    params.append('limit', String(limit));
    params.append('offset', String(newOffset));

    try {
      const res = await fetch(`/api/history?${params.toString()}`);
      const data = await res.json();
      if (data.events) {
        if (newOffset === 0) {
          setEvents(data.events);
        } else {
          setEvents(prev => [...prev, ...data.events]);
        }
        setHasMore(data.events.length === limit);
        setOffset(newOffset + limit);
      }
    } catch {
      // Fallback demo data
      if (newOffset === 0) {
        setEvents([
          {
            id: '1',
            type: 'inspection',
            title: 'בדיקת AutoLog קדמית',
            description: 'בדיקה שלמה של הרכב בביצוע',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            vehicleId: vehicles[0]?.id,
            vehicle: vehicles[0] ? { nickname: vehicles[0].nickname, licensePlate: vehicles[0].licensePlate } : undefined,
          },
          {
            id: '2',
            type: 'appointment',
            title: 'תור בדיקה',
            description: 'בדיקה שנתית בחנות',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'confirmed',
            vehicleId: vehicles[0]?.id,
            vehicle: vehicles[0] ? { nickname: vehicles[0].nickname, licensePlate: vehicles[0].licensePlate } : undefined,
          },
          {
            id: '3',
            type: 'expense',
            title: 'תיקון בלמים',
            description: 'החלפת רפידות בלמים חדשות',
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            vehicleId: vehicles[0]?.id,
            vehicle: vehicles[0] ? { nickname: vehicles[0].nickname, licensePlate: vehicles[0].licensePlate } : undefined,
            amount: 450,
            currency: 'ILS',
          },
          {
            id: '4',
            type: 'sos',
            title: 'אירוע חירום',
            description: 'תקלה בדרך - מחוזה ריסס דלק',
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'resolved',
            vehicleId: vehicles[0]?.id,
            vehicle: vehicles[0] ? { nickname: vehicles[0].nickname, licensePlate: vehicles[0].licensePlate } : undefined,
          },
        ]);
        setHasMore(false);
      }
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setShowVehicleDropdown(false);
    setOffset(0);
    setEvents([]);
    setLoading(true);
    loadHistory(0);
  };

  const handleTypeChange = (type: string) => {
    setSelectedEventType(type);
    setShowTypeDropdown(false);
    setOffset(0);
    setEvents([]);
    setLoading(true);
    loadHistory(0);
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    loadHistory(offset);
  };

  const getEventIcon = (type: string) => {
    const iconProps = { size: 18, strokeWidth: 2 };
    switch (type) {
      case 'inspection':
        return <FileCheck {...iconProps} />;
      case 'appointment':
        return <Calendar {...iconProps} />;
      case 'expense':
        return <Receipt {...iconProps} />;
      case 'sos':
        return <AlertTriangle {...iconProps} />;
      default:
        return null;
    }
  };

  const getEventDotColor = (type: string) => {
    switch (type) {
      case 'inspection':
        return 'bg-teal-500';
      case 'appointment':
        return 'bg-blue-500';
      case 'expense':
        return 'bg-amber-500';
      case 'sos':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      inspection: 'בדיקה',
      appointment: 'תור',
      expense: 'הוצאה',
      sos: 'אירוע חירום',
    };
    return map[type] || type;
  };

  const getEventIconColor = (type: string) => {
    switch (type) {
      case 'inspection':
        return 'text-teal-600';
      case 'appointment':
        return 'text-blue-600';
      case 'expense':
        return 'text-amber-600';
      case 'sos':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const map: Record<string, any> = {
      completed: 'success',
      confirmed: 'success',
      resolved: 'success',
      pending: 'info',
      in_progress: 'warning',
      cancelled: 'danger',
      open: 'danger',
    };
    return map[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      completed: 'הושלם',
      confirmed: 'מאושר',
      resolved: 'טופל',
      pending: 'ממתין',
      in_progress: 'בביצוע',
      cancelled: 'בוטל',
      open: 'פתוח',
    };
    return map[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="min-h-screen bg-[#fef7ed] pb-24 pt-12 lg:pt-0" dir="rtl">
      <div className="space-y-6">
        <PageHeader title="היסטוריה" backUrl="/user" />

        {loading && <PageSkeleton count={5} />}

        {!loading && (
          <>
            {/* Vehicle Selector and Type Filter - Mobile Stacked, Desktop Row */}
            <div className="px-4 lg:px-0 space-y-3 sm:space-y-0 sm:flex sm:gap-3">
        {/* Vehicle Selector */}
        <div className="relative flex-1 sm:flex-initial sm:w-64">
          <label className="text-xs font-medium text-gray-500 block mb-2">בחר רכב</label>
          <button
            onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-teal-300 transition bg-white"
          >
            <ChevronDown size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {selectedVehicleId === 'all'
                ? 'כל הרכבים'
                : selectedVehicle
                ? selectedVehicle.nickname || `${selectedVehicle.manufacturer} ${selectedVehicle.model}`
                : 'בחר רכב'}
            </span>
          </button>
          {showVehicleDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
              <button
                onClick={() => handleVehicleChange('all')}
                className={`w-full p-3 text-right text-sm hover:bg-[#fef7ed]/50 transition ${
                  selectedVehicleId === 'all' ? 'bg-teal-50 font-medium text-teal-700' : 'text-gray-700'
                }`}
              >
                כל הרכבים
              </button>
              {vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => handleVehicleChange(v.id)}
                  className={`w-full p-3 text-right text-sm hover:bg-[#fef7ed]/50 transition border-t border-gray-100 ${
                    selectedVehicleId === v.id ? 'bg-teal-50 font-medium text-teal-700' : 'text-gray-700'
                  }`}
                >
                  <div className="font-medium">{v.nickname || `${v.manufacturer} ${v.model}`}</div>
                  <div className="text-xs text-gray-400">{v.licensePlate}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Event Type Filter */}
        <div className="relative flex-1 sm:flex-initial sm:w-56">
          <label className="text-xs font-medium text-gray-500 block mb-2">סוג אירוע</label>
          <button
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-teal-300 transition bg-white"
          >
            <ChevronDown size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Filter size={14} />
              {selectedEventType === 'all' ? 'כל הסוגים' : getEventTypeLabel(selectedEventType)}
            </span>
          </button>
          {showTypeDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
              {[
                { value: 'all', label: 'כל הסוגים' },
                { value: 'inspection', label: 'בדיקה' },
                { value: 'appointment', label: 'תור' },
                { value: 'expense', label: 'הוצאה' },
                { value: 'sos', label: 'אירוע חירום' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleTypeChange(option.value)}
                  className={`w-full p-3 text-right text-sm hover:bg-[#fef7ed]/50 transition flex items-center justify-between ${
                    option.value !== 'all' ? 'border-t border-gray-100' : ''
                  } ${selectedEventType === option.value ? 'bg-teal-50 font-medium text-teal-700' : 'text-gray-700'}`}
                >
                  <span>{option.label}</span>
                  {option.value !== 'all' && (
                    <div className={`w-2 h-2 rounded-full ${getEventDotColor(option.value)}`} />
                  )}
                </button>
              ))}
            </div>
          )}
            </div>
            </div>

            {/* Timeline */}
            {events.length === 0 ? (
              <div className="px-4 lg:px-0">
                <Card className="bg-white rounded-2xl text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-600 mb-2">אין אירועים</h3>
              <p className="text-gray-400 text-sm">לא נמצאו אירועים התואמים את הפילטר שלך</p>
                </Card>
              </div>
            ) : (
              <div className="px-4 lg:px-0 relative">
                {/* Timeline vertical line */}
                <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-200 via-teal-200 to-transparent translate-x-[11px]" />

                <div className="space-y-4">
                  {events.map((event, idx) => (
                    <div key={event.id} className="flex gap-3 sm:gap-4">
                      {/* Timeline Dot */}
                      <div className="flex flex-col items-center flex-shrink-0 pt-4">
                        <div className={`w-5 h-5 rounded-full border-4 border-white ${getEventDotColor(event.type)} shadow-sm relative z-10`} />
                        {idx < events.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-300 to-gray-100 mt-1" />
                        )}
                      </div>

                      {/* Event Card */}
                      <div className="flex-1 min-w-0 pb-4">
                        <Card
                          hover
                          className="bg-white rounded-2xl p-4 shadow-sm"
                          onClick={() => {
                            switch (event.type) {
                              case 'inspection':
                                router.push(`/inspection/${event.id}`);
                                break;
                              case 'appointment':
                                router.push(`/user/appointments`);
                                break;
                              case 'expense':
                                router.push(`/user/expenses`);
                                break;
                              case 'sos':
                                router.push(`/user/sos`);
                                break;
                            }
                          }}
                        >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        event.type === 'inspection' ? 'bg-teal-50'
                          : event.type === 'appointment' ? 'bg-blue-50'
                          : event.type === 'expense' ? 'bg-amber-50'
                          : 'bg-red-50'
                      }`}>
                        <div className={getEventIconColor(event.type)}>{getEventIcon(event.type)}</div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h3 className="font-bold text-gray-800 text-sm sm:text-base">{event.title}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                              {getEventTypeLabel(event.type)}
                              {event.vehicle && ` • ${event.vehicle.nickname || event.vehicle.licensePlate}`}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(event.status)} size="sm" className="flex-shrink-0">
                            {getStatusLabel(event.status)}
                          </Badge>
                        </div>

                        {event.description && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                        )}

                        {event.amount && (
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-500">סה״כ הוצאה</span>
                            <span className="font-bold text-amber-600">
                              {event.amount.toLocaleString('he-IL')} {event.currency}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                          <span className="text-xs text-gray-400">{formatDate(event.date)}</span>
                          <ChevronRight size={16} className="text-gray-300" />
                        </div>
                      </div>
                        </div>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-3 rounded-xl border border-teal-300 bg-teal-50 text-teal-700 font-medium hover:bg-teal-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>טוען...</span>
                        </>
                      ) : (
                        <>
                          <span>טען עוד</span>
                          <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
