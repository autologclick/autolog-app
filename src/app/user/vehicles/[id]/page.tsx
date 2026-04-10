'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  Edit, Trash2, Shield, Calendar, Fuel, Gauge, Clock, Bell, Plus, X,
  Loader2, ChevronRight, AlertCircle, MapPin, Settings, Car, FileText,
  Camera, Image as ImageIcon, Zap, AlertTriangle, ChevronLeft, ChevronDown,
  Check, Flag, CheckCircle, Wrench, TrendingUp, MapPinIcon, Upload
} from 'lucide-react';
import Tesseract from 'tesseract.js';

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

interface Treatment {
  id: string;
  type: string;
  title: string;
  description?: string;
  date: string;
  cost?: number;
  mileage?: number;
  garageName?: string;
  image?: string;
  status: string;
}

interface Document {
  id: string;
  type: string;
  name: string;
  url?: string;
  uploadedAt?: string;
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

const LicensePlate = ({ plate }: { plate: string }) => {
  const formatPlate = (p: string) => {
    const clean = p.replace(/[^0-9]/g, '');
    if (clean.length === 7) {
      return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
    }
    if (clean.length === 8) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5)}`;
    }
    return p;
  };

  return (
    <div className="inline-flex items-center gap-0 rounded-md overflow-hidden bg-yellow-300 border-2 border-yellow-400 px-1">
      <div className="bg-blue-700 text-white px-2 py-1 flex items-center gap-1 rounded-sm">
        <Flag size={12} className="fill-white" />
        <span className="text-xs font-bold">IL</span>
      </div>
      <div className="bg-yellow-300 px-3 py-2 flex-1">
        <span className="text-sm font-black text-black tracking-wider">{formatPlate(plate)}</span>
      </div>
    </div>
  );
};

const ReminderCard = ({ title, value, subtitle, status }: { title: string; value: string | number; subtitle?: string; status?: 'warning' | 'danger' | 'success' }) => {
  let valueColor = 'text-gray-800';
  if (status === 'danger') valueColor = 'text-red-600';
  if (status === 'warning') valueColor = 'text-orange-600';
  if (status === 'success') valueColor = 'text-green-600';

  return (
    <Card className="p-4 flex flex-col items-center justify-center text-center">
      <p className="text-xs text-gray-500 mb-2">{title}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </Card>
  );
};

const TreatmentTypeChip = ({ type, selected, onClick }: { type: string; selected: boolean; onClick: () => void }) => {
  const typeMap: Record<string, string> = {
    maintenance: 'טיפול תקופתי',
    tires: 'החלפת צמיגים',
    electrical: 'החלפת מצבר',
    other: 'אחר'
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        selected
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {typeMap[type] || type}
    </button>
  );
};

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [showScanning, setShowScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [treatmentLoading, setTreatmentLoading] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [selectedReminderIndex, setSelectedReminderIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [editData, setEditData] = useState({
    nickname: '',
    mileage: '',
    fuelType: '',
    color: '',
    testExpiryDate: '',
    insuranceExpiry: '',
    isPrimary: false,
  });

  const [treatmentData, setTreatmentData] = useState({
    type: 'maintenance',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    mileage: '',
    garageName: '',
    image: null as File | null,
  });

  // Fetch vehicle, treatments, and documents on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehicleRes = await fetch(`/api/vehicles/${id}`);
        if (vehicleRes.status === 401) {
          window.location.href = '/auth/login';
          return;
        }

        const vehicleData = await vehicleRes.json();
        if (!vehicleRes.ok) {
          setError(vehicleData.error || 'שגיאה בטעינת הרכב');
          setLoading(false);
          return;
        }

        setVehicle(vehicleData.vehicle);
        setEditData({
          nickname: vehicleData.vehicle.nickname,
          mileage: vehicleData.vehicle.mileage?.toString() || '',
          fuelType: vehicleData.vehicle.fuelType || '',
          color: vehicleData.vehicle.color || '',
          testExpiryDate: vehicleData.vehicle.testExpiryDate?.split('T')[0] || '',
          insuranceExpiry: vehicleData.vehicle.insuranceExpiry?.split('T')[0] || '',
          isPrimary: vehicleData.vehicle.isPrimary,
        });

        // Fetch treatments
        const treatmentsRes = await fetch(`/api/treatments?vehicleId=${id}`);
        if (treatmentsRes.ok) {
          const treatmentsData = await treatmentsRes.json();
          setTreatments(treatmentsData.treatments || []);
        }

        // Fetch documents
        const documentsRes = await fetch(`/api/documents?vehicleId=${id}`);
        if (documentsRes.ok) {
          const documentsData = await documentsRes.json();
          setDocuments(documentsData.documents || []);
        }
      } catch {
        setError('שגיאת חיבור');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const handleAddTreatment = async () => {
    if (!treatmentData.title) {
      setError('יש להזין כותרת טיפול');
      return;
    }

    setTreatmentLoading(true);
    setError('');

    try {
      const payload = {
        vehicleId: id,
        type: treatmentData.type,
        title: treatmentData.title,
        description: treatmentData.description,
        date: treatmentData.date,
        cost: treatmentData.cost ? parseInt(treatmentData.cost) : null,
        mileage: treatmentData.mileage ? parseInt(treatmentData.mileage) : null,
        garageName: treatmentData.garageName,
        status: 'approved'
      };

      const res = await fetch('/api/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה בהוספת טיפול');
        setTreatmentLoading(false);
        return;
      }

      setTreatments([data.treatment, ...treatments]);
      setShowAddTreatment(false);
      setTreatmentData({
        type: 'maintenance',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        cost: '',
        mileage: '',
        garageName: '',
        image: null,
      });
    } catch {
      setError('שגיאת חיבור');
    } finally {
      setTreatmentLoading(false);
    }
  };

  const handleScanReceipt = async () => {
    if (!treatmentData.image) return;

    setShowScanning(true);

    try {
      const { data: { text } } = await Tesseract.recognize(treatmentData.image, 'heb+eng');

      // Parse the OCR text to extract details (basic implementation)
      const lines = text.split('\n');
      let extractedTitle = '';
      let extractedCost = '';
      let extractedDate = '';

      // Simple extraction logic
      for (const line of lines) {
        if (line.includes('₪') || line.includes('שקל')) {
          const match = line.match(/\d+/);
          if (match) extractedCost = match[0];
        }
      }

      // Auto-fill extracted data
      if (extractedTitle) setTreatmentData(prev => ({ ...prev, title: extractedTitle }));
      if (extractedCost) setTreatmentData(prev => ({ ...prev, cost: extractedCost }));

      setShowScanning(false);
    } catch (err) {
      setError('שגיאה בסריקת הקבלה');
      setShowScanning(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTreatmentData(prev => ({ ...prev, image: file }));
    }
  };

  const calculateDaysUntil = (dateString?: string): { days: number; status: 'danger' | 'warning' | 'success' } | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { days: diff, status: 'danger' };
    if (diff < 30) return { days: diff, status: 'warning' };
    return { days: diff, status: 'success' };
  };

  const reminders = [
    {
      title: 'טסט לרכב',
      value: vehicle?.testExpiryDate ? calculateDaysUntil(vehicle.testExpiryDate)?.days : null,
      subtitle: vehicle?.testExpiryDate ? new Date(vehicle.testExpiryDate).toLocaleDateString('he-IL') : null,
      status: vehicle?.testExpiryDate ? calculateDaysUntil(vehicle.testExpiryDate)?.status : null,
    },
    {
      title: 'טיפול שגרתי',
      value: (vehicle?.mileage ? (Math.ceil((vehicle.mileage + 5000) / 10000) * 10000).toLocaleString('he-IL') : 'N/A'),
      subtitle: 'עד לק"ן הבא',
      status: 'success' as const,
    },
    {
      title: 'חידוש ביטוח',
      value: vehicle?.insuranceExpiry ? calculateDaysUntil(vehicle.insuranceExpiry)?.days : null,
      subtitle: vehicle?.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toLocaleDateString('he-IL') : null,
      status: vehicle?.insuranceExpiry ? calculateDaysUntil(vehicle.insuranceExpiry)?.status : null,
    },
    {
      title: 'צמיגים קדמיים',
      value: (vehicle?.mileage ? (Math.ceil((vehicle.mileage + 15000) / 20000) * 20000).toLocaleString('he-IL') : 'N/A'),
      subtitle: 'עד לק"מ הבא',
      status: 'success' as const,
    },
  ];

  const visibleReminders = reminders.slice(selectedReminderIndex, selectedReminderIndex + 2);

  const documentTypes = [
    { key: 'license', name: 'רישיון רכב', icon: FileText },
    { key: 'mandatory_insurance', name: 'ביטוח חובה', icon: Shield },
    { key: 'comprehensive_insurance', name: 'ביטוח מקיף / צד ג', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <Card className="text-center py-12">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Car size={24} className="text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-600 mb-2">הרכב לא נמצא</h3>
        <p className="text-gray-400 mb-4">הרכב שחיפשת אינו קיים</p>
        <Button onClick={() => router.push('/user/vehicles')}>חזור לרכבים</Button>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2">
          <ChevronLeft size={24} className="text-gray-800" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm text-gray-500">{vehicle.manufacturer}</p>
          <h1 className="text-lg font-bold text-gray-800">{vehicle.model}</h1>
        </div>
        <div className="flex gap-1">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Bell size={20} className="text-gray-800" />
          </button>
          <button
            onClick={() => router.push('/user/vehicles/add')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Plus size={20} className="text-gray-800" />
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 hover:bg-red-50 rounded-lg"
            title="מחק רכב"
          >
            <Trash2 size={20} className="text-red-500" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {error && (
          <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Vehicle Info Card */}
        <Card className="p-6 space-y-4">
          <div className="flex justify-center">
            <LicensePlate plate={vehicle.licensePlate} />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">שנת ייצור</p>
              <p className="font-bold text-gray-800">{vehicle.year}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">נפח מנוע</p>
              <p className="font-bold text-gray-800">{vehicle.fuelType || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">רמת גימור</p>
              <p className="font-bold text-gray-800">—</p>
            </div>
          </div>

          <button
            onClick={() => setExpandedDetails(!expandedDetails)}
            className="w-full flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium text-blue-600">פרטים נוספים</span>
            <ChevronDown
              size={16}
              className={`text-blue-600 transition-transform ${expandedDetails ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedDetails && (
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">צבע</span>
                <span className="font-medium text-gray-800">{vehicle.color || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ק"מ</span>
                <span className="font-medium text-gray-800">{vehicle.mileage?.toLocaleString('he-IL') || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">דלק</span>
                <span className="font-medium text-gray-800">{vehicle.fuelType || '—'}</span>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full flex items-center justify-center gap-2 mt-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors"
              >
                <Edit size={16} />
                עריכה
              </button>
            </div>
          )}
        </Card>

        {/* Smart Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-lg font-bold text-gray-800">תזכורות</h2>
            <a href="#" className="text-xs text-blue-600 hover:text-blue-700">ℹ️ איך זה עובד?</a>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {visibleReminders.map((reminder, idx) => (
              <ReminderCard
                key={selectedReminderIndex + idx}
                title={reminder.title}
                value={reminder.value || '—'}
                subtitle={reminder.subtitle}
                status={reminder.status}
              />
            ))}
          </div>

          {reminders.length > 2 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: Math.ceil(reminders.length / 2) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedReminderIndex(idx * 2)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === Math.floor(selectedReminderIndex / 2) ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Treatments Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-lg font-bold text-gray-800">הטיפולים</h2>
            <a href="#" className="text-xs text-blue-600 hover:text-blue-700">ראה הכל ›</a>
          </div>

          {treatments.length === 0 ? (
            <Card className="p-8 text-center space-y-4">
              <p className="text-gray-500">לא בוצעו טיפולים עדיין</p>
              <button
                onClick={() => setShowAddTreatment(true)}
                className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
              >
                <Plus size={16} />
                הוסף טיפול ראשון
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              {treatments.slice(0, 3).map(treatment => (
                <Card key={treatment.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Wrench size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{treatment.title}</h3>
                      {treatment.description && (
                        <p className="text-sm text-gray-500 mt-1">{treatment.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Clock size={12} />
                        {new Date(treatment.date).toLocaleDateString('he-IL')}
                        {treatment.garageName && (
                          <>
                            <MapPin size={12} />
                            {treatment.garageName}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowAddTreatment(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            הוסף טיפול
          </button>
        </div>

        {/* Documents Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-lg font-bold text-gray-800">מסמכים</h2>
            <button className="p-1 hover:bg-gray-100 rounded-lg">
              <Plus size={20} className="text-gray-800" />
            </button>
          </div>

          <div className="space-y-2">
            {documentTypes.map(docType => {
              const exists = documents.some(d => {
                const t = d.type;
                if (docType.key === 'license') {
                  return t === 'license' || t === 'vehicle_license' || t === 'registration' || t === 'test_certificate';
                }
                if (docType.key === 'mandatory_insurance' || docType.key === 'comprehensive_insurance') {
                  return t === docType.key || t === 'insurance' || t.startsWith('insurance');
                }
                return t === docType.key;
              });
              const Icon = docType.icon;

              return (
                <Card key={docType.key} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon size={20} className="text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-800">{docType.name}</span>
                    </div>
                    {exists ? (
                      <Check size={20} className="text-green-600" />
                    ) : (
                      <button
                        onClick={() => router.push(`/user/documents?type=${docType.key}&vehicleId=${id}`)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + הוסף מסמך
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Delete button moved to header */}
      </div>

      {/* Add Treatment Modal */}
      <Modal
        isOpen={showAddTreatment}
        onClose={() => {
          setShowAddTreatment(false);
          setShowScanning(false);
          setError('');
        }}
        title="טיפול חדש"
        size="lg"
      >
        <div className="space-y-6">
          {/* Treatment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">סוג טיפול</label>
            <div className="flex gap-2 flex-wrap">
              {['maintenance', 'tires', 'electrical', 'other'].map(type => (
                <TreatmentTypeChip
                  key={type}
                  type={type}
                  selected={treatmentData.type === type}
                  onClick={() => setTreatmentData(prev => ({ ...prev, type }))}
                />
              ))}
            </div>
          </div>

          {/* Treatment Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">פרטי טיפול</label>
            <Input
              placeholder="כותרת טיפול"
              value={treatmentData.title}
              onChange={e => setTreatmentData(prev => ({ ...prev, title: e.target.value }))}
              icon={<Edit size={16} />}
            />
          </div>

          {/* Date and Location */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              value={treatmentData.date}
              onChange={e => setTreatmentData(prev => ({ ...prev, date: e.target.value }))}
              icon={<Calendar size={16} />}
            />
            <Input
              placeholder="שם הסדנה"
              value={treatmentData.garageName}
              onChange={e => setTreatmentData(prev => ({ ...prev, garageName: e.target.value }))}
              icon={<MapPinIcon size={16} />}
            />
          </div>

          {/* Price and Mileage */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="מחיר ₪"
              value={treatmentData.cost}
              onChange={e => setTreatmentData(prev => ({ ...prev, cost: e.target.value }))}
              icon={<span className="text-gray-400">₪</span>}
            />
            <Input
              type="number"
              placeholder="ק״מ"
              value={treatmentData.mileage}
              onChange={e => setTreatmentData(prev => ({ ...prev, mileage: e.target.value }))}
              icon={<Gauge size={16} />}
            />
          </div>

          {/* Description */}
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="תיאור"
            rows={3}
            value={treatmentData.description}
            onChange={e => setTreatmentData(prev => ({ ...prev, description: e.target.value }))}
          />

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">תמונה</label>
            <div className="flex gap-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors"
              >
                <Camera size={18} />
                <span className="text-sm">צלם תמונה</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors"
              >
                <ImageIcon size={18} />
                <span className="text-sm">בחר מגלריה</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {treatmentData.image && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-700">{treatmentData.image.name}</span>
              <button
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  if (cameraInputRef.current) cameraInputRef.current.value = '';
                  setTreatmentData(prev => ({ ...prev, image: null }));
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Scan Receipt Button */}
          {treatmentData.image && (
            <button
              onClick={handleScanReceipt}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-colors"
            >
              <Zap size={18} />
              ✨ סרוק קבלה
            </button>
          )}

          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowAddTreatment(false);
                setError('');
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleAddTreatment}
              disabled={treatmentLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {treatmentLoading && <Loader2 size={16} className="animate-spin" />}
              שמור
            </button>
          </div>
        </div>
      </Modal>

      {/* Scanning Modal */}
      {showScanning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-8 text-center space-y-4 max-w-sm">
            <div className="flex justify-center">
              <div className="animate-spin">
                <Loader2 size={32} className="text-blue-600" />
              </div>
            </div>
            <h3 className="font-bold text-gray-800">מנתח קבלה...</h3>
            <p className="text-sm text-gray-500">ה-AI מחפש פרטי טיפול</p>
          </Card>
        </div>
      )}

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
              label="ק״מ"
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

          <div className="flex gap-2 justify-end pt-4">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleSaveEdits}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              שמור שינויים
            </button>
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
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">זו פעולה בלתי הפיכה</p>
              <p className="text-sm text-red-700 mt-1">
                המחיקה של {vehicle.nickname} תסיר את כל הבדיקות, התורים והוצאות הקשורות אליה.
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleDeleteVehicle}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {deleting && <Loader2 size={16} className="animate-spin" />}
              מחק רכב
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
