'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { AlertCircle, MapPin, Phone, Clock, Eye, CheckCircle, AlertTriangle, Loader2, ChevronDown, Circle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SosEvent {
  id: string;
  eventType: string;
  user: {
    fullName: string;
    phone: string;
  };
  vehicle: {
    nickname: string;
    licensePlate: string;
    model: string;
  };
  location: string;
  createdAt: string;
  status: string;
  priority: string;
}

const eventTypeLabels: Record<string, string> = {
  accident: 'תאונה',
  breakdown: 'תקלה מכנית',
  flat_tire: 'צמיג תקוע',
  fuel: 'דלק נגמר',
  electrical: 'נעילה ברכב',
  other: 'אחר',
};

const priorityLabels: Record<string, string> = {
  critical: 'קריטי',
  high: 'דחוף',
  medium: 'בינוני',
  low: 'נמוך',
};

const getPriorityColor = (priority: string | null | undefined) => {
  switch (priority) {
    case 'critical':
      return 'text-red-600 bg-red-50';
    case 'high':
      return 'text-orange-600 bg-orange-50';
    case 'medium':
      return 'text-amber-600 bg-amber-50';
    case 'low':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export default function AdminSosPage() {
  const [events, setEvents] = useState<SosEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sos');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch SOS events:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (eventId: string, newStatus: string) => {
    setUpdating(eventId);
    try {
      const res = await fetch(`/api/sos/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchEvents();
        setExpandedId(null);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update SOS event:', error);
      }
    } finally {
      setUpdating(null);
    }
  };

  const filtered =
    filter === 'all' ? events :
    filter === 'active' ? events.filter(e => e.status !== 'resolved') :
    events.filter(e => e.status === 'resolved');
  const activeCount = events.filter(e => e.status !== 'resolved').length;
  const resolvedCount = events.filter(e => e.status === 'resolved').length;

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <AlertCircle size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">אירועי SOS</h1>
            <p className="text-sm text-gray-500">ניהול ומעקב אירועי חירום</p>
          </div>
        </div>
        {activeCount > 0 && <Badge variant="danger" size="md">{activeCount} פעילים!</Badge>}
      </div>

      {/* Filter Tabs - Status Based */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all' as const, label: 'הכל', icon: Circle, count: events.length },
          { key: 'active' as const, label: 'פעילים', icon: Circle, count: activeCount },
          { key: 'resolved' as const, label: 'טופלו', icon: CheckCircle, count: resolvedCount },
        ].map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                filter === tab.key ? 'bg-[#1e3a5f] text-white shadow-md' : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-[#1e3a5f]'
              }`}
            >
              <IconComponent size={14} />
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-teal-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">לא נמצאו אירועים</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filtered.map(event => {
            const isActive = event.status !== 'resolved';
            const borderColor = event.priority === 'critical' ? 'border-l-4 border-l-red-600' :
                                event.priority === 'high' ? 'border-l-4 border-l-orange-500' :
                                event.priority === 'medium' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500';
            return (
            <Card key={event.id} hover className={`${borderColor} ${isActive ? 'bg-gradient-to-r from-red-50 to-white shadow-md' : 'bg-white'}`}>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/admin/sos/${event.id}`)}
                  className="w-full flex flex-col sm:flex-row items-start gap-3 sm:gap-4"
                >
                  {(() => {
                    const priorityColor = getPriorityColor(event.priority);
                    const [textColor, bgColor] = priorityColor.split(' ');
                    let IconComponent = AlertCircle;
                    if (event.priority === 'critical') IconComponent = AlertTriangle;
                    else if (event.priority === 'high') IconComponent = AlertCircle;
                    else if (event.priority === 'medium') IconComponent = AlertCircle;
                    else IconComponent = CheckCircle;

                    return (
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                        <IconComponent size={20} className={textColor} />
                      </div>
                    );
                  })()}
                  <div className="flex-1 text-right w-full">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                      <h3 className="font-bold text-sm sm:text-base">{eventTypeLabels[event.eventType] || event.eventType}</h3>
                      <StatusBadge status={event.status} />
                      <Badge variant={event.priority === 'critical' || event.priority === 'high' ? 'danger' : event.priority === 'medium' ? 'warning' : 'default'} size="sm">
                        {priorityLabels[event.priority] || event.priority}
                      </Badge>
                    </div>
                    <div className="text-xs sm:text-sm space-y-2">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 justify-end">
                        <span className="font-bold text-gray-800">{event.user?.fullName}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-600">{event.vehicle?.nickname || event.vehicle?.model} ({event.vehicle?.licensePlate})</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-gray-600 justify-end text-xs">
                        <span className="flex items-center gap-1"><Phone size={12} className="flex-shrink-0" />{event.user?.phone || 'ללא טלפון'}</span>
                        {event.location && <span className="flex items-center gap-1"><MapPin size={12} className="flex-shrink-0" />{event.location}</span>}
                        <span className="flex items-center gap-1"><Clock size={12} className="flex-shrink-0" />{new Date(event.createdAt).toLocaleDateString('he-IL')} {new Date(event.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Status Update Section */}
                <button
                  onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  className="w-full flex items-center justify-between p-2 hover:bg-[#fef7ed]/50 rounded-lg transition text-xs text-gray-600"
                >
                  <span>עדכן סטטוס</span>
                  <ChevronDown size={16} className={`transition-transform ${expandedId === event.id ? 'rotate-180' : ''}`} />
                </button>

                {expandedId === event.id && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                    {event.status !== 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={(e) => { e.stopPropagation(); updateStatus(event.id, 'open'); }}
                        loading={updating === event.id}
                      >
                        פתוח
                      </Button>
                    )}
                    {event.status !== 'assigned' && (
                      <Button
                        size="sm"
                        className="text-xs bg-blue-500 hover:bg-blue-600"
                        onClick={(e) => { e.stopPropagation(); updateStatus(event.id, 'assigned'); }}
                        loading={updating === event.id}
                      >
                        הוקצה
                      </Button>
                    )}
                    {event.status !== 'in_progress' && (
                      <Button
                        size="sm"
                        className="text-xs bg-amber-500 hover:bg-amber-600"
                        onClick={(e) => { e.stopPropagation(); updateStatus(event.id, 'in_progress'); }}
                        loading={updating === event.id}
                      >
                        בטיפול
                      </Button>
                    )}
                    {event.status !== 'resolved' && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="text-xs"
                        onClick={(e) => { e.stopPropagation(); updateStatus(event.id, 'resolved'); }}
                        loading={updating === event.id}
                      >
                        סגור
                      </Button>
                    )}
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200">
                  <Button variant="ghost" size="sm" icon={<Phone size={14} />} onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${event.user?.phone}`; }} className="text-xs sm:text-sm">{event.user?.phone}</Button>
                  <Button size="sm" icon={<Eye size={14} />} variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/admin/sos/${event.id}`); }} className="text-xs sm:text-sm">פרטים מלאים</Button>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
