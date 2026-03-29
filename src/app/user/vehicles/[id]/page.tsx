'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  Edit, Trash2, Shield, Calendar, Fuel, Gauge, Clock,
  Loader2, ChevronRight, AlertCircle, CheckCircle2, MapPin,
  RefreshCw, Star, Settings, ArrowRight, Car, FileText,
} from 'lucide-react';

interface Inspection {
  id: string;
  inspectionType: string;
  date: Date | string;
  status: string;
  overallScore?: number;
  garage: { id: string; name: string };
}

interface Appointment {
  id: string;
  serviceType: string;
  date: Date | string;
  time: string;
  status: string;
  garage: { id: string; name: string };
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: Date | string;
  description?: string;
}

interface VehicleData {
  id: string;
  nickname: string;
  manufacturer: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  mileage?: number;
  fuelType?: string;
  testExpiryDate?: string;
  testStatus: string;
  insuranceExpiry?: string;
  insuranceStatus: string;
  isPrimary: boolean;
  inspections: Inspection[];
  appointments: Appointment[];
  expenses: Expense[];
  _count: {
    inspections: number;
    appointments: number;
    sosEvents: number;
    expenses: number;
  };
}

const inspectionTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    full: 'בדיקה מלאה',
    rot: 'בדיקת רקב',
    engine: 'בדיקת מנוע',
    pre_test: 'הכנה לטסט',
    tires: 'בדיקת צמיגים',
    brakes: 'בדיקת בלמים',
    periodic: 'טיפול תקופתי',
    troubleshoot: 'אבחון תקלה',
    test_prep: 'הכנה לטסט',
  };
  return map[t] || t;
};

const expenseCategoryLabel = (c: string) => {
  const map: Record<string, string> = {
    fuel: 'דלק', insurance: 'ביטוח', maintenance: 'תחזוקה', repair: 'תיקון',
    parking: 'חניה', toll: 'אגרה', test: 'טסט', fine: 'קנס', wash: 'שטיפה', other: 'אחר',
  };
  return map[c] || c;
};

const serviceTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    inspection: 'בדיקה',
    test_prep: 'הכנה לטסט',
    maintenance: 'טיפול תקופתי',
    repair: 'תיקון',
    oil_change: 'החלפת שמן',
    tires: 'צמיגים',
    brakes: 'בלמים',
    diagnostics: 'אבחון',
    bodywork: 'פחחות',
    electrical: 'חשמל',
    ac: 'מיזוג',
  };
  return map[t] || t;
};

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editData, setEditData] = useState({
    nickname: '',
    mileage: '',
    fuelType: '',
    color: '',
    testExpiryDate: '',
    insuranceExpiry: '',
    isPrimary: false,
  });

  // Fetch vehicle on mount
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`/api/vehicles/${id}`);
        if (res.status === 401) { window.location.href = '/auth/login'; return; }
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'שגיאה בטעינת הרכב');
          setLoading(false);
          return;
        }

        setVehicle(data.vehicle);
        setEditData({
          nickname: data.vehicle.nickname,
          mileage: data.vehicle.mileage?.toString() || '',
          fuelType: data.vehicle.fuelType || '',
          color: data.vehicle.color || '',
          testExpiryDate: data.vehicle.testExpiryDate?.split('T')[0] || '',
          insuranceExpiry: data.vehicle.insuranceExpiry?.split('T')[0] || '',
          isPrimary: data.vehicle.isPrimary,
        });
      } catch {
        setError('שגיאת חיבור');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  const handleSaveEdits = async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: editData.nickname,
          mileage: editData.mileage ? parseInt(editData.mileage) : null,
          fuelType: editData.fuelType || null,
          color: editData.color || null,
          testExpiryDate: editData.testExpiryDate || null,
          insuranceExpiry: editData.insuranceExpiry || null,
          isPrimary: editData.isPrimary,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה בעדכון הרכב');
        setSaving(false);
        return;
      }

      setVehicle(data.vehicle);
      setShowEditModal(false);
    } catch {
      setError('שגיאת חיבור');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async () => {
    setDeleting(true);
    setError('');

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה במחיקת הרכב');
        setDeleting(false);
        return;
      }

      router.push('/user/vehicles');
    } catch {
      setError('שגיאת חיבור');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <Card className="text-center py-12">
        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Car size={24} className="text-teal-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-600 mb-2">הרכב לא נמצא</h3>
        <p className="text-gray-400 mb-4">הרכב שחיפשת אינו קיים</p>
        <Button onClick={() => router.push('/user/vehicles')}>חזור לרכבים</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-[#1e3a5f]">{vehicle.nickname}</h1>
            {vehicle.isPrimary && <Badge variant="success">ראשי</Badge>}
          </div>
          <p className="text-gray-500">
            {vehicle.manufacturer} {vehicle.model} • {vehicle.year} • {vehicle.licensePlate}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FileText size={16} />}
            onClick={() => router.push(`/user/vehicles/${id}/report`)}
          >
            דוח למכירה
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Edit size={16} />}
            onClick={() => setShowEditModal(true)}
          >
            עריכה
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={16} />}
            onClick={() => setShowDeleteModal(true)}
          >
            מחק
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-teal-600" />
            <span className="text-xs text-gray-500">טסט</span>
          </div>
          <StatusBadge status={vehicle.testStatus} />
          {vehicle.testExpiryDate && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(vehicle.testExpiryDate).toLocaleDateString('he-IL')}
            </p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-blue-600" />
            <span className="text-xs text-gray-500">ביטוח</span>
          </div>
          <StatusBadge status={vehicle.insuranceStatus} />
          {vehicle.insuranceExpiry && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(vehicle.insuranceExpiry).toLocaleDateString('he-IL')}
            </p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge size={16} className="text-[#1e3a5f]" />
            <span className="text-xs text-gray-500">ע�ם</span>
          </div>
          <p className="text-lg font-bold text-[#1e3a5f]">
            {vehicle.mileage?.toLocaleString('he-IL') || '—'}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Fuel size={16} className="text-orange-600" />
            <span className="text-xs text-gray-500">דלק</span>
          </div>
          <p className="text-lg font-bold text-[#1e3a5f]">
            {vehicle.fuelType || '—'}
          </p>
        </Card>
      </div>

      {/* Full Details */}
      <Card>
        <CardTitle icon={<Settings size={20} />} className="mb-4">
          פרטי הרכב
        </CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">יצרן</span>
            <p className="font-medium mt-1">{vehicle.manufacturer}</p>
          </div>
          <div>
            <span className="text-gray-500">דגם</span>
            <p className="font-medium mt-1">{vehicle.model}</p>
          </div>
          <div>
            <span className="text-gray-500">שנה</span>
            <p className="font-medium mt-1">{vehicle.year}</p>
          </div>
          <div>
            <span className="text-gray-500">מס' רישוי</span>
            <p className="font-medium mt-1">{vehicle.licensePlate}</p>
          </div>
          <div>
            <span className="text-gray-500">צבע</span>
            <p className="font-medium mt-1">{vehicle.color || '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">סוג דלק</span>
            <p className="font-medium mt-1">{vehicle.fuelType || '—'}</p>
          </div>
        </div>
      </Card>

      {/* Recent Inspections */}
      <Card>
        <CardTitle icon={<CheckCircle2 size={20} />} className="mb-4">
          בדיקות אחרונות
        </CardTitle>
        {vehicle.inspections.length === 0 ? (
          <p className="text-gray-500 text-sm">אין בדיקות עדיין</p>
        ) : (
          <div className="space-y-3">
            {vehicle.inspections.map(inspection => (
              <div
                key={inspection.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-[#1e3a5f]">{inspectionTypeLabel(inspection.inspectionType)}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Clock size={12} />
                    {new Date(inspection.date).toLocaleDateString('he-IL')}
                    <MapPin size={12} />
                    {inspection.garage.name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {inspection.overallScore && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-teal-600">{inspection.overallScore}</p>
                      <p className="text-xs text-gray-500">ניקוד</p>
                    </div>
                  )}
                  <StatusBadge status={inspection.status} />
                </div>
              </div>
            ))}
          </div>
        )}
        {vehicle._count.inspections > 0 && (
          <Button variant="outline" className="w-full mt-3" icon={<ChevronRight size={16} />}>
            צפה בכל הבדיקות ({vehicle._count.inspections})
          </Button>
        )}
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <CardTitle icon={<Calendar size={20} />} className="mb-4">
          תורים קרובים
        </CardTitle>
        {vehicle.appointments.length === 0 ? (
          <p className="text-gray-500 text-sm">אין תורים קרובים</p>
        ) : (
          <div className="space-y-3">
            {vehicle.appointments.map(appointment => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-[#1e3a5f]">{serviceTypeLabel(appointment.serviceType)}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Clock size={12} />
                    {new Date(appointment.date).toLocaleDateString('he-IL')} • {appointment.time}
                    <MapPin size={12} />
                    {appointment.garage.name}
                  </div>
                </div>
                <StatusBadge status={appointment.status} />
              </div>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          className="w-full mt-3"
          icon={<ArrowRight size={16} />}
          onClick={() => router.push('/user/book-garage')}
        >
          קבע תור חדש
        </Button>
      </Card>

      {/* Expenses Summary */}
      <Card>
        <CardTitle icon={<Gauge size={20} />} className="mb-4">
          הוצאות ({vehicle._count.expenses})
        </CardTitle>
        {vehicle.expenses.length === 0 ? (
          <p className="text-gray-500 text-sm">אין הוצאות מתועדות</p>
        ) : (
          <div className="space-y-2">
            {vehicle.expenses.slice(0, 5).map(expense => (
              <div key={expense.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-[#1e3a5f]">{expenseCategoryLabel(expense.category)}</p>
                  {expense.description && (
                    <p className="text-xs text-gray-500">{expense.description}</p>
                  )}
                </div>
                <p className="font-bold text-[#1e3a5f]">₪{expense.amount.toLocaleString('he-IL')}</p>
              </div>
            ))}
          </div>
        )}
        {vehicle._count.expenses > 5 && (
          <Button variant="outline" className="w-full mt-3">
            צפה בכל ההוצאות ({vehicle._count.expenses})
          </Button>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="עריכת פרטי הרכב"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="כינוי"
            value={editData.nickname}
            onChange={e => setEditData({ ...editData, nickname: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="ק׵מ"
              type="number"
              value={editData.mileage}
              onChange={e => setEditData({ ...editData, mileage: e.target.value })}
            />
            <Input
              label="סוג דלק"
              value={editData.fuelType}
              onChange={e => setEditData({ ...editData, fuelType: e.target.value })}
            />
          </div>

          <Input
            label="צבע"
            value={editData.color}
            onChange={e => setEditData({ ...editData, color: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="תוקף טסט"
              type="date"
              value={editData.testExpiryDate}
              onChange={e => setEditData({ ...editData, testExpiryDate: e.target.value })}
            />
            <Input
              label="תוקף ביטוח"
              type="date"
              value={editData.insuranceExpiry}
              onChange={e => setEditData({ ...editData, insuranceExpiry: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={editData.isPrimary}
              onChange={e => setEditData({ ...editData, isPrimary: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">זה הרכב הראשי שלי</span>
          </label>

          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              ביטול
            </Button>
            <Button loading={saving} onClick={handleSaveEdits}>
              שמור שינויים
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="מחיקת רכב"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">זו פעולה בלתי הפיכה</p>
              <p className="text-sm text-red-700 mt-1">
                המחיקה של {vehicle.nickname} תסיר את כל הבדיקות, התורים וההוצאות הקשורות אליו.
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              ביטול
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={handleDeleteVehicle}
            >
              מחק רכב
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
