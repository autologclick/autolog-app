'use client';

import { useState, useEffect, useRef } from 'react';
import Badge from '@/components/ui/Badge';
import {
  Car, Calendar, CheckCircle2, Bell, AlertTriangle, Settings,
  MapPin, FileBarChart, Receipt, Users, Sparkles, Shield, LogOut,
  MessageCircle, Loader2, ChevronDown, ChevronRight, Camera, AlertCircle, Image as ImageIcon, Clock, ChevronLeft,
  Brain, TrendingUp, TrendingDown, Minus, Lightbulb, Target, Zap, Activity, PenLine
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const serviceTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    inspection: '××××§×', test_prep: '××× × ×××¡×', maintenance: '×××¤×× ×ª×§××¤×ª×',
    repair: '×ª××§××', oil_change: '××××¤×ª ×©××', tires: '×¦×××××', brakes: '×××××',
    diagnostics: '×××××', bodywork: '×¤××××ª', electrical: '××©××', ac: '×××××',
  };
  return map[t] || t;
};

interface Vehicle {
  id: string;
  nickname: string;
  model: string;
  manufacturer: string;
  licensePlate: string;
  year: number;
  testStatus: string;
  testExpiryDate?: string;
  insuranceStatus: string;
  insuranceExpiry?: string;
  isPrimary: boolean;
  imageUrl?: string;
  mileage?: number;
  overallScore?: number;
  lastInspectionId?: string;
  lastInspectionDate?: string;
  _count?: { inspections: number; sosEvents: number; expenses: number };
}

interface UserProfile {
  fullName: string;
  role: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

interface Appointment {
  id: string;
  date: string;
  serviceType: string;
  status: string;
  garage?: { name: string };
  vehicle?: { nickname: string; licensePlate: string };
}

interface AiInsight {
  id: string;
  type: 'critical' | 'warning' | 'positive' | 'info';
  title: string;
  description: string;
}

interface AiPrediction {
  id: string;
  confidence: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedCost?: string;
  estimatedDate: string;
}

interface AiSavingsTip {
  id: string;
  title: string;
  description: string;
  potentialSaving: string;
}

interface AiNextAction {
  id: string;
  urgency: 'immediate' | 'soon' | 'planned';
  title: string;
  description: string;
}

interface AiReport {
  status: 'excellent' | 'good' | 'attention' | 'warning' | 'critical';
  statusLabel: string;
  overallScore: number;
  insights: AiInsight[];
  predictions: AiPrediction[];
  savingsTips: AiSavingsTip[];
  nextActions: AiNextAction[];
}

export default function UserDashboard() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [awaitingSignature, setAwaitingSignature] = useState<Array<{id: string; vehicle: string}>>([]);
  const [showAiDetails, setShowAiDetails] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const dateStr = today.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  // Helper function to check expiry status
  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { status: 'expired', daysUntil, label: '×¤× ×ª××§×£' };
    if (daysUntil <= 30) return { status: 'expiring', daysUntil, label: '×¤××§×¢ ××§×¨××' };
    return null;
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/vehicles').then(r => r.json()).catch(() => ({ vehicles: [] })),
      fetch('/api/auth/me').then(r => r.json()).catch(() => ({ user: null })),
      fetch('/api/notifications?limit=5').then(r => r.json()).catch(() => ({ notifications: [] })),
      fetch('/api/appointments?limit=3').then(r => r.json()).catch(() => ({ appointments: [] })),
      fetch('/api/inspections?status=awaiting_signature&limit=10').then(r => r.json()).catch(() => ({ inspections: [] })),
    ]).then(([vData, uData, nData, aData, iData]) => {
      if (vData.vehicles?.length > 0) setVehicles(vData.vehicles);
      if (uData.user) setUser(uData.user);
      if (nData.notifications) {
        setNotifications(nData.notifications);
        setUnreadCount(nData.notifications.filter((n: Notification) => !n.isRead).length);
      }
      if (aData.appointments) setAppointments(aData.appointments);
      if (iData.inspections) setAwaitingSignature(iData.inspections.map((i: any) => ({ id: i.id, vehicle: i.vehicle?.nickname || i.vehicle?.model || '' })));
      setLoading(false);
    });
  }, []);

  // Vehicle images now loaded from database via imageUrl field

  // Fetch AI health report for selected vehicle
  useEffect(() => {
    if (!vehicle) return;
    setAiLoading(true);
    setAiReport(null);
    fetch(`/api/ai/vehicle-health?vehicleId=${vehicle.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.report) setAiReport(data.report);
        setAiLoading(false);
      })
      .catch(() => setAiLoading(false));
  }, [vehicles, selectedVehicle]);

  const handleImageUpload = async (file: File) => {
    if (!vehicle) return;
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch(`/api/vehicles/${vehicle.id}/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });
        if (res.ok) {
          const data = await res.json();
          setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, imageUrl: data.imageUrl } : v));
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingImage(false);
    }
  };

  const vehicle = vehicles[selectedVehicle];
  const userName = user?.fullName?.split(' ')[0] || '××©×ª××©';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  const allDocsValid = vehicle
    ? vehicle.testStatus === 'valid' && vehicle.insuranceStatus === 'valid'
    : true;

  const inspectionScore = vehicle?.overallScore ?? null;

  const mainActions = [
    { label: '××ª××¨×× ×©××', icon: <Calendar size={28} strokeWidth={1.5} />, href: '/user/appointments' },
    { label: '××××§×ª AutoLog', icon: <CheckCircle2 size={28} strokeWidth={1.5} />, href: '/user/book-garage' },
    { label: '×××××ª ××××§×', icon: <FileBarChart size={28} strokeWidth={1.5} />, href: '/user/reports' },
    { label: '××¨×××× ×©××', icon: <Car size={28} strokeWidth={1.5} />, href: '/user/vehicles' },
    { label: '××¡××××', icon: <Shield size={28} strokeWidth={1.5} />, href: '/user/documents' },
    { label: '×××¦×××ª', icon: <Receipt size={28} strokeWidth={1.5} />, href: '/user/expenses' },
    { label: '×××¡×××¨××', icon: <Sparkles size={28} strokeWidth={1.5} />, href: '/user/history' },
    { label: '×××¡×× ××¡××¨', icon: <MapPin size={28} strokeWidth={1.5} />, href: '/user/book-garage' },
  ];

  const moreActions = [
    { label: '××××¨××ª', icon: <Settings size={28} strokeWidth={1.5} />, href: '/user/settings' },
    { label: '××¨×× ×××××', icon: <Shield size={28} strokeWidth={1.5} />, href: '/user/security' },
    { label: '×¦××¨ ×§×©×¨ / ×ª××××', icon: <MessageCircle size={28} strokeWidth={1.5} />, href: '/user/support' },
    { label: '××ª× ×ª×§××ª', icon: <LogOut size={28} strokeWidth={1.5} />, href: '/auth/login', color: 'text-red-400' },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/auth/login');
  };

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-[#1a3a5c] to-[#0d7377] rounded-2xl mx-3 sm:mx-0 p-5 sm:p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />
        </div>
        <div className="relative flex items-center justify-between">
          <button onClick={() => router.push('/user/notifications')} className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
            <Bell size={20} className="text-white/80" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl font-bold text-white">×©××× {userName}, ×©×××× ××¨×××ª ×××ª×</h1>
            <p className="text-white/60 text-sm mt-1">{dateStr}</p>
          </div>
        </div>
      </div>

      {/* Vehicle Section */}
      {vehicles.length > 0 ? (
        <div className="bg-white rounded-2xl mx-3 sm:mx-0 p-5 mb-4 shadow-sm">
          {/* Vehicle Selector */}
          <div className="text-right mb-4">
            <span className="text-sm font-medium text-gray-500">×××¨ ×¨××</span>
          </div>
          <div className="relative mb-5">
            <button
              onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-teal-300 transition"
            >
              <ChevronDown size={18} className="text-gray-400" />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold text-[#1e3a5f]">{vehicle?.nickname || vehicle?.manufacturer + ' ' + vehicle?.model}</div>
                  <div className="text-xs text-gray-400">{vehicle?.licensePlate}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#fef7ed] border-2 border-[#1e3a5f] flex items-center justify-center flex-shrink-0">
                  <Car size={18} className="text-[#1e3a5f]" />
                </div>
              </div>
            </button>
            {showVehicleDropdown && vehicles.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {vehicles.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVehicle(idx); setShowVehicleDropdown(false); }}
                    className={`w-full flex items-center gap-3 p-3 text-right hover:bg-[#fef7ed]/50 transition ${
                      idx === selectedVehicle ? 'bg-teal-50' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-bold text-sm text-[#1e3a5f]">{v.nickname || v.manufacturer + ' ' + v.model}</div>
                      <div className="text-xs text-gray-400">{v.licensePlate}</div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#fef7ed] border border-[#1e3a5f] flex items-center justify-center flex-shrink-0">
                      <Car size={14} className="text-[#1e3a5f]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Display Card */}
          {vehicle && (
            <div className="text-center">
            {/* Camera input - opens camera directly */}
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = '';
              }}
            />
            {/* Gallery input - opens file picker / gallery */}
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = '';
              }}
            />
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-right">
                  <h2 className="text-xl font-bold text-[#1e3a5f]">
                    {vehicle.manufacturer} {vehicle.model}
                  </h2>
                  <div className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 mt-1">
                    <Car size={14} className="text-teal-600" />
                    <span className="text-sm font-medium text-gray-700">{vehicle.licensePlate}</span>
                  </div>
                </div>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-lg group transition-all hover:shadow-xl"
                >
                  {vehicle.imageUrl ? (
                    <>
                      <img
                        src={vehicle.imageUrl}
                        alt={vehicle.nickname || vehicle.model}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Camera size={20} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 group-hover:border-teal-400 group-hover:bg-teal-50 transition">
                      {uploadingImage ? (
                        <Loader2 size={20} className="animate-spin text-teal-500" />
                      ) : (
                        <>
                          <Camera size={20} className="text-gray-400 group-hover:text-teal-500 transition" />
                          <span className="text-[9px] font-medium text-gray-400 group-hover:text-teal-600 transition">×××¡×£ ×ª××× ×</span>
                        </>
                      )}
                    </div>
                  )}
                </button>
              </div>

              {/* Score Bar */}
              {inspectionScore !== null ? (
                <button
                  onClick={() => vehicle.lastInspectionId ? router.push(`/inspection/${vehicle.lastInspectionId}`) : router.push('/user/reports')}
                  className="w-full flex items-center gap-3 mb-4 px-4 hover:opacity-80 transition"
                >
                  <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        inspectionScore >= 80 ? 'bg-teal-500' : inspectionScore >= 60 ? 'bg-teal-400' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(inspectionScore, 5)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${
                    inspectionScore >= 80 ? 'text-teal-600' : inspectionScore >= 60 ? 'text-teal-500' : 'text-amber-600'
                  }`}>{inspectionScore}</span>
                  <span className="text-xs text-gray-400">×¦××× ××××§×</span>
                </button>
              ) : (
                <button
                  onClick={() => router.push('/user/book-garage')}
                  className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2.5 bg-teal-50 rounded-xl hover:bg-teal-100 transition"
                >
                  <span className="text-sm text-teal-700 font-medium">×¢×××× ×× ×××¦×¢× ××××§× â ×§××¢ ×ª××¨</span>
                  <Shield size={16} className="text-teal-600" />
                </button>
              )}

              {/* Document Status */}
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className={allDocsValid ? 'text-teal-500' : 'text-amber-500'} />
                <span className={`text-sm font-medium ${allDocsValid ? 'text-teal-700' : 'text-amber-700'}`}>
                  {allDocsValid ? '×× ×××¡×××× ×ª×§×× ××' : '××© ××¡×××× ×©×××¨×©×× ×××¤××'}
                </span>
              </div>

              {/* Insurance & Test Expiry Alerts */}
              {vehicle && (
                <div className="mt-6 space-y-2">
                  {(() => {
                    const insuranceAlert = getExpiryStatus(vehicle.insuranceExpiry);
                    const testAlert = getExpiryStatus(vehicle.testExpiryDate);

                    const hasAlerts = insuranceAlert || testAlert;

                    if (!hasAlerts) return null;

                    return (
                      <div className="space-y-2">
                        {insuranceAlert && (
                          <div
                            className={`rounded-xl p-4 border-r-4 flex items-start gap-3 text-right ${
                              insuranceAlert.status === 'expired'
                                ? 'bg-red-50 border-red-400'
                                : 'bg-amber-50 border-amber-400'
                            }`}
                          >
                            <div className={`flex-shrink-0 mt-0.5 ${
                              insuranceAlert.status === 'expired'
                                ? 'text-red-600'
                                : 'text-amber-600'
                            }`}>
                              {insuranceAlert.status === 'expired' ? (
                                <AlertTriangle size={20} />
                              ) : (
                                <Clock size={20} />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={`text-sm font-bold ${
                                insuranceAlert.status === 'expired'
                                  ? 'text-red-800'
                                  : 'text-amber-800'
                              }`}>
                                ××××× ×××× â {insuranceAlert.label}
                              </div>
                              <div className={`text-xs mt-1 ${
                                insuranceAlert.status === 'expired'
                                  ? 'text-red-700'
                                  : 'text-amber-700'
                              }`}>
                                {insuranceAlert.status === 'expired'
                                  ? `×¤× ××ª××¨×× ${new Date(vehicle.insuranceExpiry!).toLocaleDateString('he-IL')}`
                                  : `×¤××§×¢ ××¢×× ${insuranceAlert.daysUntil} ×××× (${new Date(vehicle.insuranceExpiry!).toLocaleDateString('he-IL')})`}
                              </div>
                            </div>
                          </div>
                        )}

                        {testAlert && (
                          <div
                            className={`rounded-xl p-4 border-r-4 flex items-start gap-3 text-right ${
                              testAlert.status === 'expired'
                                ? 'bg-red-50 border-red-400'
                                : 'bg-amber-50 border-amber-400'
                            }`}
                          >
                            <div className={`flex-shrink-0 mt-0.5 ${
                              testAlert.status === 'expired'
                                ? 'text-red-600'
                                : 'text-amber-600'
                            }`}>
                              {testAlert.status === 'expired' ? (
                                <AlertTriangle size={20} />
                              ) : (
                                <Clock size={20} />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={`text-sm font-bold ${
                                testAlert.status === 'expired'
                                  ? 'text-red-800'
                                  : 'text-amber-800'
                              }`}>
                                ××××§× ×ª×§× ××ª â {testAlert.label}
                              </div>
                              <div className={`text-xs mt-1 ${
                                testAlert.status === 'expired'
                                  ? 'text-red-700'
                                  : 'text-amber-700'
                              }`}>
                                {testAlert.status === 'expired'
                                  ? `×¤× ××ª××¨×× ${new Date(vehicle.testExpiryDate!).toLocaleDateString('he-IL')}`
                                  : `×¤××§×¢ ××¢×× ${testAlert.daysUntil} ×××× (${new Date(vehicle.testExpiryDate!).toLocaleDateString('he-IL')})`}
                              </div>
                            </div>
                          </div>
                        )}

                        {(insuranceAlert || testAlert) && (
                          <button
                            onClick={() => router.push('/user/documents')}
                            className="w-full mt-3 bg-gradient-to-l from-teal-600 to-teal-700 text-white py-2.5 px-4 rounded-xl font-medium hover:from-teal-700 hover:to-teal-800 transition flex items-center justify-center gap-2"
                          >
                            <span>×××© ××ª ×××¡××××</span>
                            <ChevronLeft size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl mx-3 sm:mx-0 p-8 mb-4 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Car size={32} className="text-gray-400" />
          </div>
          <h3 className="font-bold text-[#1e3a5f] mb-2">×¢×××× ×× ×××¡×¤×ª ×¨××</h3>
          <p className="text-gray-500 text-sm mb-4">×××¡×£ ××ª ××¨×× ××¨××©×× ×©××</p>
          <button
            onClick={() => router.push('/user/vehicles')}
            className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition"
          >
            ×××¡×£ ×¨×× ×¨××©××
          </button>
        </div>
      )}

      {/* AI Vehicle Health Widget */}
      {vehicle && (
        <div className="mx-3 sm:mx-0 mb-4">
          <div className="bg-gradient-to-l from-[#1e3a5f]/5 to-teal-50 rounded-2xl p-5 shadow-sm border border-teal-100">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowAiDetails(!showAiDetails)}
                className="text-xs text-teal-600 hover:underline flex items-center gap-1"
              >
                {showAiDetails ? '××¡×ª×¨' : '×¤×¨×××'}
                <ChevronDown size={14} className={`transition-transform ${showAiDetails ? 'rotate-180' : ''}`} />
              </button>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1e3a5f]">× ××ª×× AI ××¨××</h3>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-[#1e3a5f] flex items-center justify-center">
                  <Brain size={16} className="text-white" />
                </div>
              </div>
            </div>

            {aiLoading ? (
              <div className="flex items-center justify-center py-6 gap-2">
                <span className="text-sm text-gray-400">×× ×ª× ××ª ××¦× ××¨××...</span>
                <Loader2 size={18} className="animate-spin text-teal-500" />
              </div>
            ) : aiReport ? (
              <>
                {/* Score Circle + Status */}
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      aiReport.status === 'excellent' ? 'text-teal-600' :
                      aiReport.status === 'good' ? 'text-teal-500' :
                      aiReport.status === 'attention' ? 'text-amber-600' :
                      aiReport.status === 'warning' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {aiReport.statusLabel}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">××¦× ×××× ×©× ××¨××</div>
                  </div>
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="35" fill="none"
                        stroke={
                          aiReport.overallScore >= 85 ? '#0d9488' :
                          aiReport.overallScore >= 70 ? '#14b8a6' :
                          aiReport.overallScore >= 55 ? '#f59e0b' :
                          aiReport.overallScore >= 35 ? '#f97316' : '#ef4444'
                        }
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${(aiReport.overallScore / 100) * 220} 220`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-[#1e3a5f]">{aiReport.overallScore}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Insights - Top 3 */}
                {aiReport.insights?.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {aiReport.insights.slice(0, showAiDetails ? 10 : 3).map((insight: AiInsight) => (
                      <div key={insight.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl text-right ${
                        insight.type === 'critical' ? 'bg-red-50' :
                        insight.type === 'warning' ? 'bg-amber-50' :
                        insight.type === 'positive' ? 'bg-green-50' : 'bg-blue-50'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-bold ${
                            insight.type === 'critical' ? 'text-red-700' :
                            insight.type === 'warning' ? 'text-amber-700' :
                            insight.type === 'positive' ? 'text-green-700' : 'text-blue-700'
                          }`}>{insight.title}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{insight.description}</div>
                        </div>
                        <div className={`flex-shrink-0 mt-0.5 ${
                          insight.type === 'critical' ? 'text-red-500' :
                          insight.type === 'warning' ? 'text-amber-500' :
                          insight.type === 'positive' ? 'text-green-500' : 'text-blue-500'
                        }`}>
                          {insight.type === 'critical' ? <AlertTriangle size={14} /> :
                           insight.type === 'warning' ? <AlertCircle size={14} /> :
                           insight.type === 'positive' ? <CheckCircle2 size={14} /> :
                           <Activity size={14} />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expanded Details */}
                {showAiDetails && (
                  <div className="space-y-4 mt-4 border-t border-teal-100 pt-4">
                    {/* Predictions */}
                    {aiReport.predictions?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 justify-end">
                          <h4 className="text-xs font-bold text-[#1e3a5f]">×ª×××××ª</h4>
                          <Target size={14} className="text-teal-500" />
                        </div>
                        <div className="space-y-2">
                          {aiReport.predictions.map((pred: AiPrediction) => (
                            <div key={pred.id} className="bg-white rounded-lg p-3 text-right">
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  pred.confidence === 'high' ? 'bg-teal-100 text-teal-700' :
                                  pred.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {pred.confidence === 'high' ? '×¡×××¨××ª ×××××' :
                                   pred.confidence === 'medium' ? '×¡×××¨××ª ××× ×× ××ª' : '×¡×××¨××ª × ××××'}
                                </span>
                                <div className="text-xs font-bold text-[#1e3a5f]">{pred.title}</div>
                              </div>
                              <div className="text-[11px] text-gray-500 mt-1">{pred.description}</div>
                              <div className="flex items-center gap-3 mt-1.5 justify-end text-[10px] text-gray-400">
                                {pred.estimatedCost && <span>{pred.estimatedCost}</span>}
                                <span>{pred.estimatedDate}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Savings Tips */}
                    {aiReport.savingsTips?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 justify-end">
                          <h4 className="text-xs font-bold text-[#1e3a5f]">×××¤×× ××××¡×××</h4>
                          <Lightbulb size={14} className="text-amber-500" />
                        </div>
                        <div className="space-y-2">
                          {aiReport.savingsTips.map((tip: AiSavingsTip) => (
                            <div key={tip.id} className="bg-amber-50/50 rounded-lg p-3 text-right">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  ×××¡×××: {tip.potentialSaving}
                                </span>
                                <div className="text-xs font-bold text-amber-800">{tip.title}</div>
                              </div>
                              <div className="text-[11px] text-gray-500 mt-1">{tip.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Actions */}
                    {aiReport.nextActions?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 justify-end">
                          <h4 className="text-xs font-bold text-[#1e3a5f]">×× ××¢×©××ª ×¢××©××</h4>
                          <Zap size={14} className="text-orange-500" />
                        </div>
                        <div className="space-y-2">
                          {aiReport.nextActions.map((action: AiNextAction) => (
                            <div key={action.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg text-right ${
                              action.urgency === 'immediate' ? 'bg-red-50 border border-red-200' :
                              action.urgency === 'soon' ? 'bg-amber-50 border border-amber-200' :
                              'bg-gray-50 border border-gray-200'
                            }`}>
                              <div className="flex-1">
                                <div className="text-xs font-bold text-[#1e3a5f]">{action.title}</div>
                                <div className="text-[11px] text-gray-500">{action.description}</div>
                              </div>
                              <div className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                action.urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                                action.urgency === 'soon' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {action.urgency === 'immediate' ? '××××£' :
                                 action.urgency === 'soon' ? '××§×¨××' : '××ª××× ×'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-sm text-gray-400">×× × ××ª× ×× ×ª× ××¨××¢</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Actions Grid */}
      <div className="mx-3 sm:mx-0 mb-4">
        <p className="text-sm text-gray-400 text-right mb-3 font-medium">×¤×¢××××ª ×¨××©×××ª</p>
        <div className="grid grid-cols-2 gap-3">
          {mainActions.map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 min-h-[100px]"
            >
              <div className="text-gray-500">
                {action.icon}
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Appointments */}
      {appointments.length > 0 && (
        <div className="mx-3 sm:mx-0 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => router.push('/user/appointments')} className="text-xs text-teal-600 hover:underline">×××</button>
            <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
              <Calendar size={14} /> ×ª××¨×× ×§×¨××××
            </p>
          </div>
          <div className="space-y-2">
            {appointments.slice(0, 3).map((apt) => (
              <button key={apt.id} onClick={() => router.push('/user/appointments')}
                className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex items-center gap-3 text-right">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1e3a5f] truncate">
                    {apt.garage?.name || '×××¡×'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {serviceTypeLabel(apt.serviceType)} â¢ {apt.vehicle?.nickname || apt.vehicle?.licensePlate || ''}
                  </div>
                </div>
                <div className="text-left flex-shrink-0">
                  <div className="text-xs font-medium text-teal-700">
                    {new Date(apt.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {new Date(apt.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  apt.status === 'confirmed' ? 'bg-green-400' : apt.status === 'pending' ? 'bg-amber-400' : 'bg-gray-300'
                }`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="mx-3 sm:mx-0 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => router.push('/user/notifications')} className="text-xs text-teal-600 hover:underline">×××</button>
            <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
              <Bell size={14} /> ×¢×××× ×× ×××¨×× ××
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {notifications.slice(0, 4).map((n, idx) => (
              <button key={n.id} onClick={() => router.push(n.link || '/user/notifications')}
                className={`w-full p-3 flex items-start gap-3 text-right hover:bg-[#fef7ed]/50 transition ${
                  idx < notifications.length - 1 ? 'border-b border-gray-100' : ''
                }`}>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${n.isRead ? 'text-gray-600' : 'text-[#1e3a5f] font-medium'}`}>
                    {n.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.message}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-gray-300">
                    {new Date(n.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                  </span>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-teal-500" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* More Section */}
      <div className="mx-3 sm:mx-0 mb-4">
        <p className="text-sm text-gray-400 text-right mb-3 font-medium">×¢××</p>
        <div className="grid grid-cols-2 gap-3">
          {moreActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                if (action.label === '××ª× ×ª×§××ª') {
                  handleLogout();
                } else {
                  router.push(action.href);
                }
              }}
              className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 min-h-[100px]"
            >
              <div className={action.color || 'text-gray-500'}>
                {action.icon}
              </div>
              <span className={`text-sm font-medium ${action.color || 'text-gray-700'}`}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SOS Emergency Button */}
      <div className="mx-3 sm:mx-0 mb-4">
        <button
          onClick={() => router.push('/user/sos')}
          className="w-full bg-gradient-to-l from-red-500 to-red-600 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-lg hover:from-red-600 hover:to-red-700 active:scale-[0.98] transition-all duration-200"
        >
          <AlertTriangle size={24} />
          <span className="text-lg font-bold">SOS â ×××¨××</span>
        </button>
      </div>

      {/* Privacy Note */}
      <div className="mx-3 sm:mx-0 mb-6 flex items-center justify-center gap-2 py-4">
        <Shield size={14} className="text-gray-300 flex-shrink-0" />
        <p className="text-xs text-gray-400 text-center">×××××¢ ×©×× ×××¦×¤× ×××××××. ×¦××××× ×××¡×××× ××©××©×× ×× ×××× ×××©× ××××.</p>
      </div>
    </div>
  );
}
