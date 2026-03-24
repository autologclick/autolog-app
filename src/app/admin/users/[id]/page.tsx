'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ChevronRight, Loader2, AlertCircle, Car, Calendar, AlertTriangle, Phone, Mail, Settings } from 'lucide-react';

const serviceTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    inspection: 'בדיקה', test_prep: 'הכנה לטסט', maintenance: 'טיפול תקופתי',
    repair: 'תיקון', oil_change: 'החלפת שמן', tires: 'צמיגים', brakes: 'בלמים',
    diagnostics: 'אבחון', bodywork: 'פחחות', electrical: 'חשמל', ac: 'מיזוג',
  };
  return map[t] || t;
};

interface UserDetail {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  vehicles: Vehicle[];
  appointments: Appointment[];
  sosEvents: SosEvent[];
}

interface Vehicle {
  id: string;
  nickname: string;
  manufacturer: string;
  model: string;
  year: number;
  licensePlate: string;
  testStatus: string;
  insuranceStatus: string;
}

interface Appointment {
  id: string;
  date: string;
  status: string;
  serviceType: string;
  vehicle: {
    nickname: string;
    licensePlate: string;
  };
  garage: {
    name: string;
  };
}

interface SosEvent {
  id: string;
  eventType: string;
  status: string;
  priority: string;
  createdAt: string;
  vehicle: {
    nickname: string;
    licensePlate: string;
  };
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/admin/users/${userId}`);
        if (!res.ok) throw new Error('שגיאה בטעינת פרטי המשתמש');
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה לא צפויה');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4 pt-12 lg:pt-0" dir="rtl">
        <Button variant="ghost" icon={<ChevronRight size={16} />} onClick={() => router.back()}>
          חזור
        </Button>
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="text-red-600" size={20} />
          <span className="text-red-700">{error || 'משתמש לא נמצא'}</span>
        </div>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      user: 'משתמש',
      admin: 'מנהל',
      garage_owner: 'בעלי מוסך',
    };
    return labels[role] || role;
  };

  const getStatusColor = (status: string): 'info' | 'default' | 'warning' | 'danger' | 'success' => {
    const colors: Record<string, string> = {
      pending: 'warning',
      confirmed: 'info',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'danger',
      open: 'danger',
      assigned: 'warning',
      resolved: 'success',
    };
    return (colors[status] || 'default') as 'info' | 'default' | 'warning' | 'danger' | 'success';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'ממתין',
      confirmed: 'אושר',
      in_progress: 'בתהליך',
      completed: 'הושלם',
      cancelled: 'בוטל',
      open: 'פתוח',
      assigned: 'הוקצה',
      resolved: 'סגור',
    };
    return labels[status] || status;
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      accident: 'תאונה',
      breakdown: 'תקלה',
      flat_tire: 'צמיג פנוי',
      fuel: 'דלק',
      electrical: 'חשמל',
      other: 'אחר',
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string): 'info' | 'default' | 'warning' | 'danger' | 'success' => {
    const colors: Record<string, string> = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
      critical: 'danger',
    };
    return (colors[priority] || 'default') as 'info' | 'default' | 'warning' | 'danger' | 'success';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'נמוכה',
      medium: 'בינונית',
      high: 'גבוהה',
      critical: 'קריטית',
    };
    return labels[priority] || priority;
  };

  const getDocumentStatus = (status: string): 'info' | 'default' | 'warning' | 'danger' | 'success' => {
    const colors: Record<string, string> = {
      valid: 'success',
      expiring: 'warning',
      expired: 'danger',
    };
    return (colors[status] || 'default') as 'info' | 'default' | 'warning' | 'danger' | 'success';
  };

  const getDocumentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      valid: 'תקף',
      expiring: 'עומד לפוג',
      expired: 'פג תוקף',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      <Button variant="ghost" icon={<ChevronRight size={16} />} onClick={() => router.back()}>
        חזור לרשימה
      </Button>

      {/* User Info Header */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-[#fef7ed] rounded-full flex items-center justify-center border-2 border-[#1e3a5f]">
              <span className="text-2xl font-bold text-[#1e3a5f]">{user.fullName.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1e3a5f]">{user.fullName}</h1>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={user.isActive ? 'success' : 'danger'}>
                  {user.isActive ? 'פעיל' : 'לא פעיל'}
                </Badge>
                <Badge variant="default">{getRoleLabel(user.role)}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-500 mb-1">טלפון</p>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-gray-600" />
              <p className="font-medium">{user.phone || '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">הצטרפות</p>
            <p className="font-medium text-sm">
              {new Date(user.createdAt).toLocaleDateString('he-IL')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">רכבים</p>
            <p className="font-medium text-2xl text-teal-600">{user.vehicles.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">הערכות</p>
            <p className="font-medium text-2xl text-teal-600">{user.appointments.length}</p>
          </div>
        </div>
      </Card>

      {/* Vehicles Section */}
      <div>
        <h2 className="text-xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
          <Car size={20} className="text-teal-600" />
          רכבים ({user.vehicles.length})
        </h2>

        {user.vehicles.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-6">אין רכבים רשומים</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.vehicles.map(vehicle => (
              <Card key={vehicle.id} hover>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{vehicle.nickname}</h3>
                    <p className="text-sm text-gray-600">
                      {vehicle.manufacturer} {vehicle.model} ({vehicle.year})
                    </p>
                    <p className="text-sm font-mono text-gray-500 mt-1">{vehicle.licensePlate}</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <div className="flex items-center gap-1">
                        <Badge variant={getDocumentStatus(vehicle.testStatus)} size="sm">
                          בדיקה: {getDocumentStatusLabel(vehicle.testStatus)}
                        </Badge>
                      </div>
                      <Badge variant={getDocumentStatus(vehicle.insuranceStatus)} size="sm">
                        ביטוח: {getDocumentStatusLabel(vehicle.insuranceStatus)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Appointments Section */}
      <div>
        <h2 className="text-xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-teal-600" />
          הערכות אחרונות ({user.appointments.length})
        </h2>

        {user.appointments.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-6">אין הערכות רשומות</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {user.appointments.map(appt => (
              <Card key={appt.id} hover>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold">{appt.garage.name}</h3>
                      <Badge variant={getStatusColor(appt.status)} size="sm">
                        {getStatusLabel(appt.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {appt.vehicle.nickname} - {appt.vehicle.licensePlate}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span><Calendar size={14} className="inline mr-1" />{new Date(appt.date).toLocaleDateString('he-IL')}</span>
                      <span><Settings size={14} className="inline mr-1" />{serviceTypeLabel(appt.serviceType)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* SOS Events Section */}
      <div>
        <h2 className="text-xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-600" />
          אירועי SOS אחרונים ({user.sosEvents.length})
        </h2>

        {user.sosEvents.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-6">אין אירועי SOS רשומים</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {user.sosEvents.map(event => (
              <Card key={event.id} hover>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold">{getEventTypeLabel(event.eventType)}</h3>
                      <Badge variant={getStatusColor(event.status)} size="sm">
                        {getStatusLabel(event.status)}
                      </Badge>
                      <Badge variant={getPriorityColor(event.priority)} size="sm">
                        {getPriorityLabel(event.priority)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {event.vehicle.nickname} - {event.vehicle.licensePlate}
                    </p>
                    <p className="text-sm text-gray-500">
                      <Calendar size={14} className="inline mr-1" />{new Date(event.createdAt).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
