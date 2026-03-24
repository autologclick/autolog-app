'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { AlertTriangle, ArrowRight, MapPin, Phone, Clock, User, Car, CheckCircle, Loader2, MessageSquare, Shield } from 'lucide-react';

const eventTypeLabels: Record<string, string> = {
  accident: 'תאונה',
  breakdown: 'תקלה בדרך',
  flat_tire: 'צמיג פרוץ',
  fuel: 'נגמר דלק',
  electrical: 'תקלה חשמלית',
  other: 'אחר',
};

const statusLabels: Record<string, string> = {
  open: 'פתוח',
  assigned: 'הוקצה טיפול',
  in_progress: 'בטיפול',
  resolved: 'טופל',
};

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'קריטי', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  high: { label: 'דחוף', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  medium: { label: 'בינוני', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  low: { label: 'נמוך', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
};

export default function AdminSosDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/sos/${id}`);
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event);
        setNotes(data.event.notes || '');
      }
    } catch {
      // error
    }
    setLoading(false);
  };

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/sos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        await fetchEvent();
      }
    } catch {
      // error
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertTriangle size={48} className="mx-auto text-gray-400" />
        <p className="text-gray-500 text-lg">אירוע לא נמצא</p>
        <Button onClick={() => router.push('/admin/sos')} icon={<ArrowRight size={16} />}>חזרה לרשימה</Button>
      </div>
    );
  }

  const priority = priorityConfig[event.priority] || priorityConfig.medium;
  const createdDate = new Date(event.createdAt);

  return (
    <div className="space-y-6 pt-12 lg:pt-0 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/sos')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowRight size={20} />
          </button>
          <div className="w-10 h-10 bg-[#fef7ed] rounded-lg flex items-center justify-center border-2 border-[#1e3a5f]">
            <AlertTriangle size={22} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e3a5f]">אירוע SOS</h1>
            <p className="text-sm text-gray-500">#{event.id?.slice(-8) || ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${priority.bg} ${priority.color}`}>
            {priority.label}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            event.status === 'open' ? 'bg-red-100 text-red-700' :
            event.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
            event.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
            'bg-green-100 text-green-700'
          }`}>
            {statusLabels[event.status] || event.status}
          </span>
        </div>
      </div>

      {/* Event Info */}
      <Card>
        <CardTitle>
          <AlertTriangle size={18} className="text-red-500" />
          פרטי האירוע
        </CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">סוג אירוע</p>
              <p className="font-medium">{eventTypeLabels[event.eventType] || event.eventType}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">תאריך ושעה</p>
              <p className="font-medium">{createdDate.toLocaleDateString('he-IL')} {createdDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          {event.location && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin size={18} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">מיקום</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </div>
          )}
          {event.description && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
              <MessageSquare size={18} className="text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">תיאור</p>
                <p className="font-medium">{event.description}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Customer & Vehicle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardTitle>
            <User size={18} className="text-blue-500" />
            פרטי לקוח
          </CardTitle>
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <User size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{event.user?.fullName || 'לא ידוע'}</p>
                <p className="text-sm text-gray-500">{event.user?.email}</p>
              </div>
            </div>
            {event.user?.phone && (
              <a href={`tel:${event.user.phone}`} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 font-medium hover:bg-green-100 transition">
                <Phone size={16} />
                {event.user.phone}
              </a>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>
            <Car size={18} className="text-teal-500" />
            פרטי רכב
          </CardTitle>
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center">
                <Car size={18} className="text-teal-600" />
              </div>
              <div>
                <p className="font-medium">{event.vehicle?.nickname || event.vehicle?.model}</p>
                <p className="text-sm text-gray-500">{event.vehicle?.manufacturer} {event.vehicle?.model} ({event.vehicle?.year})</p>
              </div>
            </div>
            <p className="text-sm bg-gray-50 px-3 py-2 rounded-lg">מספר רישוי: <span className="font-mono font-bold">{event.vehicle?.licensePlate}</span></p>
          </div>
        </Card>
      </div>

      {/* Admin Notes */}
      <Card>
        <CardTitle>
          <MessageSquare size={18} className="text-teal-500" />
          הערות טיפול
        </CardTitle>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="הוסף הערות לאירוע..."
          className="w-full mt-3 p-3 border border-gray-200 rounded-lg resize-none h-24 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          dir="rtl"
        />
      </Card>

      {/* Actions */}
      {event.status !== 'resolved' && (
        <Card className="bg-gray-50">
          <CardTitle>
            <CheckCircle size={18} className="text-green-500" />
            פעולות
          </CardTitle>
          <div className="flex flex-wrap gap-3 mt-4">
            {event.status === 'open' && (
              <Button
                onClick={() => updateStatus('assigned')}
                loading={updating}
                icon={<Shield size={16} />}
              >
                הקצה טיפול
              </Button>
            )}
            {(event.status === 'open' || event.status === 'assigned') && (
              <Button
                onClick={() => updateStatus('in_progress')}
                loading={updating}
                variant="outline"
                icon={<Clock size={16} />}
              >
                סמן בטיפול
              </Button>
            )}
            <Button
              onClick={() => updateStatus('resolved')}
              loading={updating}
              variant="outline"
              icon={<CheckCircle size={16} />}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              סגור אירוע
            </Button>
          </div>
        </Card>
      )}

      {event.status === 'resolved' && event.resolvedAt && (
        <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
          <CheckCircle size={24} className="mx-auto text-green-600 mb-2" />
          <p className="font-medium text-green-700">אירוע טופל בהצלחה</p>
          <p className="text-sm text-green-600">{new Date(event.resolvedAt).toLocaleDateString('he-IL')} {new Date(event.resolvedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      )}
    </div>
  );
}
