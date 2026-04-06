'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import {
  Calendar, Search, Filter, Download, Loader2, Clock,
  CheckCircle2, XCircle, AlertCircle, TrendingUp, Building2,
  User, Car, Phone, ChevronDown, ChevronUp, BarChart3
} from 'lucide-react';
import { APPOINTMENT_STATUS_HEB, SERVICE_TYPE_HEB } from '@/lib/constants/translations';

// =============================================
// Types
// =============================================

interface AppointmentUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
}

interface AppointmentGarage {
  id: string;
  name: string;
  city: string;
  phone?: string;
}

interface AppointmentVehicle {
  id: string;
  nickname: string;
  licensePlate: string;
  manufacturer: string;
  model: string;
  year: number;
}

interface Appointment {
  id: string;
  userId: string;
  garageId: string;
  vehicleId: string;
  serviceType: string;
  date: string;
  time: string;
  status: string;
  notes?: string;
  completionNotes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: AppointmentUser;
  garage: AppointmentGarage;
  vehicle: AppointmentVehicle;
}

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  rejected: number;
  cancelled: number;
  inProgress: number;
  thisMonth: number;
}

interface GaragePerformance {
  garageId: string;
  garageName: string;
  garageCity: string;
  totalAppointments: number;
  confirmed: number;
  completed: number;
  rejected: number;
  pending: number;
  approvalRate: number;
  completionRate: number;
}

// =============================================
// Status config
// =============================================

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  pending: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <Clock size={14} /> },
  confirmed: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <CheckCircle2 size={14} /> },
  in_progress: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: <Loader2 size={14} /> },
  completed: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: <CheckCircle2 size={14} /> },
  rejected: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: <XCircle size={14} /> },
  cancelled: { color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: <XCircle size={14} /> },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold ${config.bg} ${config.color}`}>
      {config.icon}
      {APPOINTMENT_STATUS_HEB[status] || status}
    </span>
  );
}

// =============================================
// Main Page
// =============================================

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [garagePerformance, setGaragePerformance] = useState<GaragePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointments' | 'performance'>('appointments');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (serviceFilter) params.append('serviceType', serviceFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const res = await fetch(`/api/admin/appointments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments);
        setStats(data.stats);
        setGaragePerformance(data.garagePerformance);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch appointments:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, serviceFilter, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => { setPage(1); }, 400));
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('he-IL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const exportCSV = () => {
    if (appointments.length === 0) return;

    const headers = ['תאריך', 'שעה', 'לקוח', 'טלפון', 'מוסך', 'עיר', 'רכב', 'לוחית', 'סוג שירות', 'סטטוס', 'נוצר בתאריך'];
    const rows = appointments.map(a => [
      formatDate(a.date),
      a.time,
      a.user.fullName,
      a.user.phone || '',
      a.garage.name,
      a.garage.city,
      `${a.vehicle.manufacturer} ${a.vehicle.model} ${a.vehicle.year}`,
      a.vehicle.licensePlate,
      SERVICE_TYPE_HEB[a.serviceType] || a.serviceType,
      APPOINTMENT_STATUS_HEB[a.status] || a.status,
      formatDateTime(a.createdAt),
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointments-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportGarageReport = () => {
    if (garagePerformance.length === 0) return;

    const headers = ['מוסך', 'עיר', 'סה"כ תורים', 'אושרו', 'הושלמו', 'נדחו', 'ממתינים', 'אחוז אישור', 'אחוז השלמה'];
    const rows = garagePerformance.map(g => [
      g.garageName,
      g.garageCity,
      g.totalAppointments.toString(),
      g.confirmed.toString(),
      g.completed.toString(),
      g.rejected.toString(),
      g.pending.toString(),
      `${g.approvalRate}%`,
      `${g.completionRate}%`,
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `garage-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
            <Calendar size={28} />
            ניהול תורים
          </h1>
          <p className="text-sm text-gray-500 mt-1">מעקב, דוחות וניתוח ביצועי מוסכים</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard label="סה&quot;כ" value={stats.total} icon={<Calendar size={18} />} color="purple" />
          <StatCard label="ממתינים" value={stats.pending} icon={<Clock size={18} />} color="amber" />
          <StatCard label="מאושרים" value={stats.confirmed} icon={<CheckCircle2 size={18} />} color="blue" />
          <StatCard label="בטיפול" value={stats.inProgress} icon={<Loader2 size={18} />} color="purple" />
          <StatCard label="הושלמו" value={stats.completed} icon={<CheckCircle2 size={18} />} color="green" />
          <StatCard label="נדחו" value={stats.rejected} icon={<XCircle size={18} />} color="red" />
          <StatCard label="בוטלו" value={stats.cancelled} icon={<XCircle size={18} />} color="gray" />
          <StatCard label="החודש" value={stats.thisMonth} icon={<TrendingUp size={18} />} color="teal" />
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg transition ${
            activeTab === 'appointments'
              ? 'bg-purple-100 text-purple-800 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar size={16} />
          רשימת תורים
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg transition ${
            activeTab === 'performance'
              ? 'bg-purple-100 text-purple-800 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <BarChart3 size={16} />
          ביצועי מוסכים
        </button>
      </div>

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <>
          {/* Search & Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="חיפוש לפי שם לקוח, מוסך, מייל או לוחית..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pr-9"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                    showFilters ? 'bg-purple-50 border-purple-300 text-purple-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Filter size={14} />
                  סינון
                  {(statusFilter || serviceFilter || dateFrom || dateTo) && (
                    <span className="w-2 h-2 bg-purple-500 rounded-full" />
                  )}
                </button>
                <button
                  onClick={exportCSV}
                  disabled={appointments.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <Download size={14} />
                  ייצוא CSV
                </button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">סטטוס</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                  >
                    <option value="">הכל</option>
                    {Object.entries(APPOINTMENT_STATUS_HEB).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">סוג שירות</label>
                  <select
                    value={serviceFilter}
                    onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                  >
                    <option value="">הכל</option>
                    {Object.entries(SERVICE_TYPE_HEB).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">מתאריך</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">עד תאריך</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Appointments List */}
          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={28} className="animate-spin text-purple-600" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Calendar size={48} className="mb-3" />
                <p className="text-lg font-semibold">אין תורים להצגה</p>
                <p className="text-sm">נסה לשנות את הסינון או החיפוש</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">תאריך</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">שעה</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">לקוח</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">מוסך</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">רכב</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">שירות</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">סטטוס</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">נוצר</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">פרטים</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt) => (
                        <>
                          <tr key={appt.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition">
                            <td className="px-4 py-3 font-medium">{formatDate(appt.date)}</td>
                            <td className="px-4 py-3">{appt.time}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{appt.user.fullName}</div>
                              <div className="text-xs text-gray-400">{appt.user.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{appt.garage.name}</div>
                              <div className="text-xs text-gray-400">{appt.garage.city}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{appt.vehicle.manufacturer} {appt.vehicle.model}</div>
                              <div className="text-xs text-gray-400">{appt.vehicle.licensePlate}</div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{SERVICE_TYPE_HEB[appt.serviceType] || appt.serviceType}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={appt.status} />
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(appt.createdAt)}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setExpandedRow(expandedRow === appt.id ? null : appt.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                              >
                                {expandedRow === appt.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                          </tr>
                          {expandedRow === appt.id && (
                            <tr key={`${appt.id}-detail`} className="bg-purple-50/30">
                              <td colSpan={9} className="px-6 py-4">
                                <AppointmentDetails appointment={appt} />
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3 p-4">
                  {appointments.map((appt) => (
                    <MobileAppointmentCard
                      key={appt.id}
                      appointment={appt}
                      expanded={expandedRow === appt.id}
                      onToggle={() => setExpandedRow(expandedRow === appt.id ? null : appt.id)}
                      formatDate={formatDate}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                      הקודם
                    </button>
                    <span className="text-sm text-gray-600">
                      עמוד {page} מתוך {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                      הבא
                    </button>
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <GaragePerformancePanel
          data={garagePerformance}
          loading={loading}
          onExport={exportGarageReport}
        />
      )}
    </div>
  );
}

// =============================================
// Sub-components
// =============================================

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  return (
    <div className={`rounded-xl border p-3 ${colorMap[color] || colorMap.gray}`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-80">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function AppointmentDetails({ appointment }: { appointment: Appointment }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
      <div className="space-y-2">
        <h4 className="font-bold text-purple-800 flex items-center gap-1.5">
          <User size={14} /> פרטי לקוח
        </h4>
        <p><strong>שם:</strong> {appointment.user.fullName}</p>
        <p><strong>מייל:</strong> {appointment.user.email}</p>
        {appointment.user.phone && (
          <p className="flex items-center gap-1">
            <Phone size={12} />
            <strong>טלפון:</strong> {appointment.user.phone}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-bold text-purple-800 flex items-center gap-1.5">
          <Building2 size={14} /> פרטי מוסך
        </h4>
        <p><strong>שם:</strong> {appointment.garage.name}</p>
        <p><strong>עיר:</strong> {appointment.garage.city}</p>
        {appointment.garage.phone && (
          <p className="flex items-center gap-1">
            <Phone size={12} />
            <strong>טלפון:</strong> {appointment.garage.phone}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-bold text-purple-800 flex items-center gap-1.5">
          <Car size={14} /> פרטי רכב
        </h4>
        <p><strong>כינוי:</strong> {appointment.vehicle.nickname}</p>
        <p><strong>רכב:</strong> {appointment.vehicle.manufacturer} {appointment.vehicle.model} ({appointment.vehicle.year})</p>
        <p><strong>לוחית:</strong> {appointment.vehicle.licensePlate}</p>
      </div>

      {appointment.notes && (
        <div className="sm:col-span-3 bg-white rounded-lg p-3 border border-purple-100">
          <h4 className="font-bold text-purple-800 mb-1">הערות הלקוח</h4>
          <p className="text-gray-700">{appointment.notes}</p>
        </div>
      )}

      {appointment.completionNotes && (
        <div className="sm:col-span-3 bg-green-50 rounded-lg p-3 border border-green-200">
          <h4 className="font-bold text-green-800 mb-1">סיכום טיפול (מוסך)</h4>
          <p className="text-gray-700">{appointment.completionNotes}</p>
        </div>
      )}

      <div className="sm:col-span-3 text-xs text-gray-400 flex gap-4 pt-1 border-t border-gray-100">
        <span>נוצר: {new Date(appointment.createdAt).toLocaleString('he-IL')}</span>
        <span>עודכן: {new Date(appointment.updatedAt).toLocaleString('he-IL')}</span>
        {appointment.completedAt && <span>הושלם: {new Date(appointment.completedAt).toLocaleString('he-IL')}</span>}
      </div>
    </div>
  );
}

function MobileAppointmentCard({
  appointment,
  expanded,
  onToggle,
  formatDate,
}: {
  appointment: Appointment;
  expanded: boolean;
  onToggle: () => void;
  formatDate: (d: string) => string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full text-right p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="font-bold text-[#1e3a5f]">{appointment.user.fullName}</div>
            <div className="text-sm text-gray-500">
              {appointment.garage.name} • {formatDate(appointment.date)} {appointment.time}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{SERVICE_TYPE_HEB[appointment.serviceType] || appointment.serviceType}</Badge>
              <StatusBadge status={appointment.status} />
            </div>
          </div>
          <div className="mt-1">
            {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <AppointmentDetails appointment={appointment} />
        </div>
      )}
    </div>
  );
}

function GaragePerformancePanel({
  data,
  loading,
  onExport,
}: {
  data: GaragePerformance[];
  loading: boolean;
  onExport: () => void;
}) {
  if (loading) {
    return (
      <Card className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-purple-600" />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-gray-400">
        <BarChart3 size={48} className="mb-3" />
        <p className="text-lg font-semibold">אין נתוני ביצועים</p>
        <p className="text-sm">ברגע שיהיו תורים במערכת, הנתונים יופיעו כאן</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1e3a5f]">ביצועי מוסכים - סיכום כללי</h2>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
        >
          <Download size={14} />
          ייצוא דוח
        </button>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((garage) => (
          <Card key={garage.garageId} className="p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <CardTitle className="text-base">{garage.garageName}</CardTitle>
                <p className="text-xs text-gray-500">{garage.garageCity}</p>
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-purple-700">{garage.totalAppointments}</div>
                <div className="text-xs text-gray-400">תורים</div>
              </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-2">
              <ProgressRow label="אחוז אישור" value={garage.approvalRate} color="bg-green-500" />
              <ProgressRow label="אחוז השלמה" value={garage.completionRate} color="bg-blue-500" />
            </div>

            {/* Status breakdown */}
            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100">
              <MiniStat label="אושרו" value={garage.confirmed} color="text-blue-600" />
              <MiniStat label="הושלמו" value={garage.completed} color="text-green-600" />
              <MiniStat label="נדחו" value={garage.rejected} color="text-red-600" />
              <MiniStat label="ממתינים" value={garage.pending} color="text-amber-600" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProgressRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-0.5">
        <span className="text-gray-600">{label}</span>
        <span className="font-bold">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}
