'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle, StatCard } from '@/components/ui/Card';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Users, Car, Wrench, Shield, AlertCircle, TrendingUp,
  BarChart3, Calendar, Bell, FileText, DollarSign, Star,
  Activity, ArrowUpRight, ArrowDownRight, CheckCircle, Clock,
  Brain, Zap, AlertTriangle, Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ActivityItem {
  id: string;
  type: 'user' | 'inspection' | 'appointment' | 'sos';
  title: string;
  description: string;
  timestamp: Date;
  meta: Record<string, any>;
}

interface DashboardData {
  stats: {
    totalUsers: number;
    totalVehicles: number;
    monthlyInspections: number;
    inspectionTrend: number;
    openSos: number;
    pendingAppointments: number;
    monthlyRevenue: number;
    revenueTrend: number;
    expiredDocuments: number;
    activeGarages: number;
    inactiveGarages: number;
    todayAppointments: number;
    weekAppointments: number;
    garageApplications: number;
  };
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    vehicleCount: number;
    createdAt: Date;
  }>;
  recentInspections: Array<{
    id: string;
    vehicle: string;
    garage: string;
    score: number | null;
    status: string;
    date: Date;
  }>;
  recentActivity: ActivityItem[];
  topGarages: Array<{
    id: string;
    name: string;
    city: string;
    isActive: boolean;
    inspectionCount: number;
    reviewCount: number;
    avgRating: number;
  }>;
}

function getRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffSeconds = Math.ceil(diffTime / 1000);
  const diffMinutes = Math.ceil(diffSeconds / 60);
  const diffHours = Math.ceil(diffMinutes / 60);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffSeconds < 60) return 'עכשיו';
  if (diffMinutes < 60) return `לפני ${diffMinutes} דק׳`;
  if (diffHours < 24) return `לפני ${diffHours} שע׳`;
  if (diffDays === 1) return 'אתמול';
  if (diffDays === 2) return 'לפני יומיים';
  if (diffDays <= 7) return `לפני ${diffDays} ימים`;
  if (diffDays <= 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`;
  return `לפני ${Math.floor(diffDays / 30)} חודשים`;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'user':
      return <Users size={16} className="text-[#1e3a5f]" />;
    case 'inspection':
      return <Shield size={16} className="text-[#0d9488]" />;
    case 'appointment':
      return <Calendar size={16} className="text-blue-600" />;
    case 'sos':
      return <AlertCircle size={16} className="text-red-600" />;
    default:
      return <Activity size={16} className="text-gray-600" />;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'user':
      return 'bg-[#1e3a5f] bg-opacity-10';
    case 'inspection':
      return 'bg-[#0d9488] bg-opacity-10';
    case 'appointment':
      return 'bg-blue-100';
    case 'sos':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) throw new Error('שגיאה בטעינת הדשבורד');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {error && (
        <div className="text-center py-16 px-4">
          <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-2">לא ניתן לטעון את הדשבורד</p>
          <p className="text-gray-400 text-sm mb-4">אירעה שגיאה בטעינת הנתונים</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm hover:bg-opacity-90 transition">נסה שוב</button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] rounded-lg flex items-center justify-center border-2 border-[#1e3a5f]">
            <BarChart3 size={22} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">מרכז בקרה</h1>
            <p className="text-sm text-gray-500">דשבורד ניהול מערכת</p>
          </div>
        </div>
        <Badge variant="info" size="md">אדמין</Badge>
      </div>

      {/* Live Statistics Cards - 6 Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Users */}
        <Card className="border-t-4 border-t-[#1e3a5f] bg-gradient-to-br from-[#fef7ed] to-white">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-[#1e3a5f] bg-opacity-10 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-[#1e3a5f]" />
              </div>
              {data && data.stats.totalUsers > 0 && (
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <ArrowUpRight size={14} />
                </div>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">{data?.stats.totalUsers.toLocaleString('he-IL') ?? '0'}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">סה״כ משתמשים</div>
          </div>
        </Card>

        {/* 2. Active Garages */}
        <Card className="border-t-4 border-t-[#0d9488] bg-gradient-to-br from-[#fef7ed] to-white">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-[#0d9488] bg-opacity-10 rounded-lg flex items-center justify-center">
                <Wrench size={20} className="text-[#0d9488]" />
              </div>
              {data && data.stats.activeGarages > 0 && (
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <ArrowUpRight size={14} />
                </div>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0d9488]">{data?.stats.activeGarages.toLocaleString('he-IL') ?? '0'}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">מוסכים פעילים</div>
          </div>
        </Card>

        {/* 3. Monthly Inspections */}
        <Card className="border-t-4 border-t-blue-600 bg-gradient-to-br from-[#fef7ed] to-white">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-blue-600" />
              </div>
              {data && data.stats.inspectionTrend >= 0 && (
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <ArrowUpRight size={14} />
                  <span className="text-xs">{data.stats.inspectionTrend}%</span>
                </div>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{data?.stats.monthlyInspections.toLocaleString('he-IL') ?? '0'}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">בדיקות החודש</div>
          </div>
        </Card>

        {/* 4. Today's Appointments */}
        <Card className="border-t-4 border-t-amber-500 bg-gradient-to-br from-[#fef7ed] to-white">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-amber-500" />
              </div>
              {data && data.stats.todayAppointments > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 rounded-full text-xs font-bold text-amber-600">
                  {data.stats.todayAppointments > 9 ? '9+' : data.stats.todayAppointments}
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600">{data?.stats.todayAppointments ?? '0'}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">תורים היום</div>
          </div>
        </Card>

        {/* 5. Open SOS Events - RED if > 0 */}
        <Card className={`border-t-4 border-t-red-600 bg-gradient-to-br ${data?.stats.openSos ? 'from-red-50 to-white' : 'from-[#fef7ed] to-white'}`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              {data && data.stats.openSos > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 rounded-full text-xs font-bold text-red-600 animate-pulse">
                  {data.stats.openSos}
                </span>
              )}
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${data?.stats.openSos ? 'text-red-600' : 'text-gray-600'}`}>{data?.stats.openSos ?? '0'}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">אירועי SOS פתוחים</div>
          </div>
        </Card>

        {/* 6. Monthly Revenue */}
        <Card className="border-t-4 border-t-green-600 bg-gradient-to-br from-[#fef7ed] to-white">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
              {data && data.stats.revenueTrend >= 0 && (
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <ArrowUpRight size={14} />
                  <span className="text-xs">{data.stats.revenueTrend}%</span>
                </div>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">₪{(data?.stats.monthlyRevenue ?? 0).toLocaleString('he-IL')}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">הכנסות החודש</div>
          </div>
        </Card>
      </div>


      {/* Quick Action Buttons */}
      <Card className="bg-gradient-to-r from-[#1e3a5f] to-[#0d9488] text-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Activity size={18} />
          </div>
          <h2 className="text-lg font-bold">פעולות מהירות</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <Button
            onClick={() => router.push('/admin/users')}
            className="flex flex-col items-center justify-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0 h-auto py-4 transition"
          >
            <Users size={22} />
            <span className="text-xs font-medium text-center">ניהול משתמשים</span>
          </Button>
          <Button
            onClick={() => router.push('/admin/garages')}
            className="flex flex-col items-center justify-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0 h-auto py-4 transition"
          >
            <Wrench size={22} />
            <span className="text-xs font-medium text-center">ניהול מוסכים</span>
          </Button>
          <Button
            onClick={() => router.push('/admin/inspections')}
            className="flex flex-col items-center justify-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0 h-auto py-4 transition"
          >
            <Shield size={22} />
            <span className="text-xs font-medium text-center">בדיקות</span>
          </Button>
          <Button
            onClick={() => router.push('/admin/applications')}
            className="flex flex-col items-center justify-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0 h-auto py-4 transition"
          >
            <FileText size={22} />
            <span className="text-xs font-medium text-center">בקשות מוסכים</span>
          </Button>
        </div>
      </Card>

      {/* AI System Insights */}
      {data && (
        <Card className="bg-gradient-to-r from-[#fef7ed] to-white border-r-4 border-r-[#0d9488]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#0d9488] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-[#0d9488]" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">תובנות AI למערכת</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.stats.openSos > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
                <AlertTriangle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-800">אירועי SOS פתוחים</p>
                  <p className="text-xs text-red-600 mt-0.5">{data.stats.openSos} אירועי חירום ממתינים לטיפול דחוף</p>
                </div>
              </div>
            )}
            {data.stats.garageApplications > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <FileText size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-800">בקשות הצטרפות</p>
                  <p className="text-xs text-blue-600 mt-0.5">{data.stats.garageApplications} מוסכים ממתינים לאישור הצטרפות</p>
                </div>
              </div>
            )}
            {data.stats.expiredDocuments > 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <Clock size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">מסמכים שפגו</p>
                  <p className="text-xs text-amber-600 mt-0.5">{data.stats.expiredDocuments} מסמכים שתוקפם פג דורשים עדכון</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-xl border border-teal-200">
              <Target size={18} className="text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-teal-800">מגמת צמיחה</p>
                <p className="text-xs text-teal-600 mt-0.5">
                  {data.stats.inspectionTrend > 0
                    ? `עלייה של ${data.stats.inspectionTrend}% בבדיקות לעומת חודש קודם`
                    : data.stats.inspectionTrend < 0
                    ? `ירידה של ${Math.abs(data.stats.inspectionTrend)}% בבדיקות - מומלץ לבדוק`
                    : 'קצב בדיקות יציב לעומת חודש קודם'
                  }
                </p>
              </div>
            </div>
            {data.stats.pendingAppointments > 5 && (
              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                <Zap size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-indigo-800">עומס תורים</p>
                  <p className="text-xs text-indigo-600 mt-0.5">{data.stats.pendingAppointments} תורים ממתינים - שקול הוספת מוסכים</p>
                </div>
              </div>
            )}
            {data.stats.inactiveGarages > 0 && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Wrench size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-700">מוסכים לא פעילים</p>
                  <p className="text-xs text-gray-500 mt-0.5">{data.stats.inactiveGarages} מוסכים מושבתים - בדוק סיבה</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recent Activity Feed - Unified */}
      <Card>
        <CardTitle icon={<Activity className="text-[#0d9488]" />}>פעילות אחרונה (עדכון בזמן אמת)</CardTitle>
        <div className="space-y-0 mt-4">
          {loading ? (
            <div className="text-gray-500 text-sm py-8 text-center">טוען נתונים...</div>
          ) : data?.recentActivity && data.recentActivity.length > 0 ? (
            data.recentActivity.map((activity, idx) => (
              <div
                key={activity.id}
                className={`flex items-start gap-3 p-3 ${idx !== data.recentActivity.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-[#fef7ed] transition`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium text-[#1e3a5f]">{activity.title}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {activity.description}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.type === 'user' && `${activity.meta.email} • ${activity.meta.vehicles} רכבים`}
                    {activity.type === 'inspection' && `${activity.meta.garage} • ניקוד: ${activity.meta.score ?? '—'}`}
                    {activity.type === 'appointment' && `${activity.meta.garage} • ${{ pending: 'ממתין', confirmed: 'מאושר', completed: 'הושלם', cancelled: 'בוטל', in_progress: 'בביצוע' }[activity.meta.status] || activity.meta.status}`}
                    {activity.type === 'sos' && `${activity.meta.vehicle} • ${{ open: 'פתוח', resolved: 'טופל', closed: 'סגור', pending: 'ממתין' }[activity.meta.status] || activity.meta.status}`}
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ms-2 flex-shrink-0">{getRelativeDate(activity.timestamp)}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm py-8 text-center">אין פעילות אחרונה</div>
          )}
        </div>
      </Card>

      {/* Garages Overview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle icon={<Wrench className="text-[#0d9488]" />}>מוסכים מובילים</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/garages')}
            className="text-[#0d9488] border-[#0d9488] hover:bg-[#0d9488] hover:bg-opacity-5"
          >
            צפה בהכל
          </Button>
        </div>
        <div className="overflow-x-auto mt-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-right py-3 px-3 font-semibold text-gray-700">מוסך</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">עיר</th>
                <th className="text-center py-3 px-3 font-semibold text-gray-700">דירוג</th>
                <th className="text-center py-3 px-3 font-semibold text-gray-700">בדיקות</th>
                <th className="text-center py-3 px-3 font-semibold text-gray-700">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 px-3 text-center text-gray-500">טוען...</td>
                </tr>
              ) : data?.topGarages && data.topGarages.length > 0 ? (
                data.topGarages.map((g, idx) => (
                  <tr key={g.id} className={`border-b border-gray-100 hover:bg-[#fef7ed] transition ${idx === data.topGarages.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="py-3 px-3 font-medium text-[#1e3a5f]">{g.name}</td>
                    <td className="py-3 px-3 text-gray-600">{g.city}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star size={16} className="text-amber-500 fill-amber-500" />
                        <span className="font-semibold text-[#1e3a5f]">{g.avgRating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-[#0d9488] bg-opacity-10 text-[#0d9488] rounded-full text-xs font-bold">
                        {g.inspectionCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={g.isActive ? 'success' : 'warning'}>{g.isActive ? 'פעיל' : 'מושהה'}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 px-3 text-center text-gray-500">אין מוסכים</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
