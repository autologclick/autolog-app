'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle, StatCard } from '@/components/ui/Card';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Shield, Calendar, Star, Users, TrendingUp, Clock, FileText, Plus, Building2,
  Loader2, BarChart3, Phone, ChevronLeft, DollarSign, AlertCircle, CheckCircle2,
  Wrench, User, AlertTriangle, Brain, Zap, Target, Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardData {
  garage: { name: string; city: string; status: string };
  stats: {
    inspectionsThisMonth: number;
    inspectionsLastMonth: number;
    trend: number;
    pendingAppointments: number;
    averageRating: number | null;
    totalReviews: number;
    totalInspections: number;
    revenueThisMonth: number;
    averageScore: number | null;
  };
  todayAppointments: Array<{
    id: string; time: string; customer: string; phone: string;
    vehicle: string; service: string; status: string;
  }>;
  recentInspections: Array<{
    id: string; vehicle: string; customer: string; date: string;
    score: number | null; status: string; type: string;
  }>;
}

const inspectionTypeLabels: Record<string, string> = {
  full: 'בדיקה מלאה',
  rot: 'בדיקת רקב',
  engine: 'בדיקת מנוע',
  pre_test: 'הכנה לטסט',
  periodic: 'טיפול תקופתי',
  troubleshoot: 'אבחון תקלה',
  tires: 'בדיקת צמיגים',
  brakes: 'בדיקת בלמים',
};

export default function GarageDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/garage/dashboard');
        const d = await res.json();

        if (!res.ok) {
          setError(d.error || 'לא ניתן לטעון את הדשבורד');
          setLoading(false);
          return;
        }

        if (d && d.garage) {
          setData(d);
        } else {
          setError('נתונים לא שלמים מהשרת');
        }
        setLoading(false);
      } catch (err) {
        setError('שגיאה בטעינת הדשבורד');
        setLoading(false);
      }
    };

    fetchDashboard();

    fetch('/api/notifications?limit=1')
      .then(r => r.json())
      .then(d => { if (d.unreadCount) setUnreadNotifs(d.unreadCount); })
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin" style={{color: '#0d9488'}} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
          <AlertTriangle size={32} className="text-red-600" />
        </div>
        <p className="text-gray-700 font-semibold mb-2 text-lg">{error || 'לא ניתן לטעון את הדשבורד'}</p>
        <p className="text-gray-500 text-sm mb-6">
          {error?.includes('מחובר') ? 'יתכן שאינך מחובר כבעל מוסך' : 'אנא נסה שוב מאוחר יותר'}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            נסה שוב
          </Button>
          <Button onClick={() => router.push('/auth/login')}>
            התחבר מחדש
          </Button>
        </div>
      </div>
    );
  }

  const { garage, stats, todayAppointments, recentInspections } = data;

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#fef7ed] rounded-lg border-2 border-[#1e3a5f] flex items-center justify-center">
                <Building2 size={24} className="text-[#1e3a5f]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold" style={{color: '#1e3a5f'}}>{garage?.name || 'מוסך'}</h1>
                <p className="text-sm text-gray-600">{garage?.city} • <span style={{color: '#0d9488'}} className="font-medium">{{ active: 'פעיל', inactive: 'לא פעיל', pending: 'ממתין', suspended: 'מושעה' }[garage?.status || ''] || garage?.status}</span></p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button icon={<Plus size={16} />} onClick={() => router.push('/garage/new-inspection')} className="flex-1 sm:flex-none" style={{backgroundColor: '#0d9488'}}>
              בדיקה חדשה
            </Button>
          </div>
        </div>

        {/* Pending Appointments Banner */}
        {stats.pendingAppointments > 0 && (
          <div className="bg-white border-r-4 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition" style={{borderRightColor: '#0d9488'}}>
            <div className="rounded-lg p-2 flex-shrink-0" style={{backgroundColor: '#f0fdfa'}}>
              <AlertCircle size={20} style={{color: '#0d9488'}} />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <h3 className="font-semibold text-[#1e3a5f] text-sm sm:text-base">
                {stats.pendingAppointments} תורים ממתינים לאישור
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                בדוק ואשר תורים חדשים שדורשים אישור
              </p>
            </div>
            <button
              onClick={() => router.push('/garage/appointments')}
              className="text-white rounded-lg px-4 py-2 text-xs sm:text-sm font-medium flex-shrink-0 transition whitespace-nowrap hover:shadow-md"
              style={{backgroundColor: '#0d9488'}}
            >
              אשר תורים
            </button>
          </div>
        )}

        {/* Summary Cards - 4 Quick Stats in Hebrew */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* תורים היום - Today's Appointments */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{backgroundColor: '#f0fdfa'}}>
                <Calendar size={20} style={{color: '#0d9488'}} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{color: '#1e3a5f'}}>{todayAppointments.length}</div>
            <p className="text-gray-600 text-sm mt-2">תורים היום</p>
          </div>

          {/* בדיקות החודש - This Month's Inspections */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{backgroundColor: '#f0fdfa'}}>
                <Shield size={20} style={{color: '#0d9488'}} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold" style={{color: '#1e3a5f'}}>{stats.inspectionsThisMonth}</div>
              {stats.trend !== 0 && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stats.trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {stats.trend > 0 ? '+' : ''}{stats.trend}%
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mt-2">בדיקות החודש</p>
          </div>

          {/* לקוחות פעילים - Active Customers */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{backgroundColor: '#f0fdfa'}}>
                <Users size={20} style={{color: '#0d9488'}} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{color: '#1e3a5f'}}>{stats.totalReviews}</div>
            <p className="text-gray-600 text-sm mt-2">לקוחות פעילים</p>
          </div>

          {/* ביקורות - Reviews */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{backgroundColor: '#f0fdfa'}}>
                <Star size={20} style={{color: '#0d9488'}} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{color: '#1e3a5f'}}>{stats.averageRating !== null ? stats.averageRating : '—'}</div>
            <p className="text-gray-600 text-sm mt-2">ביקורות</p>
          </div>
        </div>

        {/* AI Insights for Garage */}
        <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-teal-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#0d9488] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-[#0d9488]" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">תובנות AI למוסך</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Trend Insight */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className={stats.trend >= 0 ? 'text-green-600' : 'text-red-500'} />
                <span className="text-xs font-bold text-gray-700">מגמת בדיקות</span>
              </div>
              <p className="text-xs text-gray-600">
                {stats.trend > 10
                  ? `📈 עלייה משמעותית של ${stats.trend}% בבדיקות החודש. המומנטום חיובי — שקלו להוסיף שעות פעילות.`
                  : stats.trend > 0
                  ? `📊 עלייה קלה של ${stats.trend}% בבדיקות. שמרו על הקצב הנוכחי.`
                  : stats.trend < -10
                  ? `📉 ירידה של ${Math.abs(stats.trend)}% בבדיקות. מומלץ לשלוח תזכורות ללקוחות קיימים.`
                  : stats.inspectionsThisMonth === 0
                  ? '🔍 אין בדיקות החודש. שלחו הודעות ללקוחות לגבי טסט שנתי קרוב.'
                  : '📊 פעילות יציבה. ניתן לחזק קשרי לקוחות לצמיחה עתידית.'}
              </p>
            </div>

            {/* Appointments Load */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-gray-700">עומס תורים</span>
              </div>
              <p className="text-xs text-gray-600">
                {todayAppointments.length >= 5
                  ? `⚡ יום עמוס! ${todayAppointments.length} תורים להיום. ודאו שצוות המוסך מוכן.`
                  : todayAppointments.length >= 2
                  ? `📅 ${todayAppointments.length} תורים להיום — יום פעיל. יש מקום לתור אחד נוסף.`
                  : todayAppointments.length === 1
                  ? '📅 תור אחד להיום. ניתן לקבל לקוחות ללא תור.'
                  : '🕐 אין תורים להיום. הזדמנות טובה לטיפול בפניות חדשות ושיווק.'}
              </p>
            </div>

            {/* Rating & Quality Insight */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-gray-700">דירוג ואיכות</span>
              </div>
              <p className="text-xs text-gray-600">
                {stats.averageRating !== null && stats.averageRating >= 4.5
                  ? `⭐ דירוג מצוין (${stats.averageRating})! לקוחות מרוצים מאוד. שקלו לבקש ביקורות נוספות.`
                  : stats.averageRating !== null && stats.averageRating >= 3.5
                  ? `⭐ דירוג טוב (${stats.averageRating}). בדקו ביקורות אחרונות לזיהוי נקודות לשיפור.`
                  : stats.averageRating !== null && stats.averageRating > 0
                  ? `⚠️ דירוג ${stats.averageRating} — יש מקום לשיפור. מומלץ לקרוא ביקורות ולפעול לשיפור השירות.`
                  : stats.averageScore !== null && stats.averageScore > 0
                  ? `🔧 ציון בדיקה ממוצע: ${stats.averageScore}. שמרו על רמת בדיקה גבוהה לבניית אמון.`
                  : '📋 אין מספיק נתונים לדירוג. עודדו לקוחות להשאיר ביקורת.'}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Appointments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.push('/garage/appointments')} className="text-sm font-semibold flex items-center gap-1 transition hover:opacity-70" style={{color: '#0d9488'}}>
              כל התורים <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-2" style={{color: '#1e3a5f'}}>
              <Calendar size={18} />
              <h2 className="font-bold">תורים להיום</h2>
            </div>
          </div>
          <div className="space-y-3">
            {todayAppointments.length > 0 ? todayAppointments.map((a) => (
              <div key={a.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-gray-100 rounded-lg hover:bg-[#fef7ed]/30 hover:shadow-md transition">
                <div className="p-2 rounded-lg flex-shrink-0" style={{backgroundColor: '#f0fdfa'}}>
                  <Clock size={16} style={{color: '#0d9488'}} />
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <div className="font-semibold text-[#1e3a5f] text-sm sm:text-base">{a.customer}</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">{a.time} • {a.vehicle}</div>
                  <div className="text-xs text-gray-500 mt-1">{a.service}</div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <StatusBadge status={a.status} />
                  {a.phone && (
                    <a href={`tel:${a.phone}`} title={a.phone} className="h-8 w-8 rounded-lg flex items-center justify-center hover:shadow-md transition flex-shrink-0" style={{backgroundColor: '#f0fdfa', color: '#0d9488'}}>
                      <Phone size={14} />
                    </a>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <Calendar size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-500 font-medium">אין תורים להיום</p>
                <p className="text-gray-400 text-sm mt-1">מקום פנוי לתורים חדשים</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Inspections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.push('/garage/inspections')} className="text-sm font-semibold flex items-center gap-1 transition hover:opacity-70" style={{color: '#0d9488'}}>
              כל הבדיקות <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-2" style={{color: '#1e3a5f'}}>
              <Shield size={18} />
              <h2 className="font-bold">5 בדיקות אחרונות</h2>
            </div>
          </div>
          {recentInspections.length > 0 ? (
            <>
              {/* Mobile card list */}
              <div className="sm:hidden space-y-3">
                {recentInspections.slice(0, 5).map((i) => (
                  <div key={i.id} onClick={() => router.push(`/inspection/${i.id}`)}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-gray-100 rounded-lg hover:bg-[#fef7ed]/30 hover:shadow-md cursor-pointer transition">
                    <div className="flex items-center gap-3">
                      {i.score !== null ? (
                        <span className={`text-lg font-bold rounded-lg w-10 h-10 flex items-center justify-center ${
                          i.score >= 80 ? 'bg-green-100 text-green-700' :
                          i.score >= 60 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{i.score}</span>
                      ) : <span className="text-gray-300 text-lg">—</span>}
                      <StatusBadge status={i.status} />
                    </div>
                    <div className="text-right min-w-0">
                      <div className="font-medium text-xs truncate text-[#1e3a5f]">{i.vehicle}</div>
                      <div className="text-[10px] text-gray-500">{i.date} • {inspectionTypeLabels[i.type] || i.type}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b-2" style={{borderBottomColor: '#e5e7eb'}}>
                      <th className="text-right py-3 px-3 font-semibold text-gray-600 text-xs">ציון</th>
                      <th className="text-right py-3 px-3 font-semibold text-gray-600 text-xs">רכב</th>
                      <th className="text-right py-3 px-3 font-semibold text-gray-600 text-xs">לקוח</th>
                      <th className="text-right py-3 px-3 font-semibold text-gray-600 text-xs">סוג</th>
                      <th className="text-right py-3 px-3 font-semibold text-gray-600 text-xs">תאריך</th>
                      <th className="text-right py-3 px-3 font-semibold text-gray-600 text-xs">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInspections.slice(0, 5).map((i) => (
                      <tr key={i.id}
                        onClick={() => router.push(`/inspection/${i.id}`)}
                        className="border-b border-gray-100 hover:bg-[#fef7ed]/50 cursor-pointer transition">
                        <td className="py-3 px-3">
                          {i.score !== null ? (
                            <span className={`font-bold text-xs ${
                              i.score >= 80 ? 'text-green-600' : i.score >= 60 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {i.score}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-medium text-xs text-[#1e3a5f]">{i.vehicle}</td>
                        <td className="py-3 px-3 text-gray-600 text-xs">{i.customer}</td>
                        <td className="py-3 px-3 text-gray-600 text-xs">
                          <span className="bg-slate-100 rounded-full px-2 py-1 text-xs">
                            {inspectionTypeLabels[i.type] || i.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 text-xs">{i.date}</td>
                        <td className="py-3 px-3"><StatusBadge status={i.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Shield size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-medium">עדיין לא נעשו בדיקות</p>
              <button onClick={() => router.push('/garage/new-inspection')}
                className="mt-4 px-4 py-2 rounded-lg text-white font-medium transition hover:shadow-md" style={{backgroundColor: '#0d9488'}}>
                צור בדיקה ראשונה
              </button>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-16 lg:pb-0">
          {/* בדיקה חדשה - New Inspection */}
          <button onClick={() => router.push('/garage/new-inspection')}
            className="flex flex-col items-center gap-3 p-5 bg-white border border-gray-100 rounded-xl hover:shadow-lg hover:border-gray-200 transition text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#f0fdfa'}}>
              <Wrench size={20} style={{color: '#0d9488'}} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1e3a5f]">בדיקה חדשה</div>
              <div className="text-xs text-gray-500 mt-0.5">צור דוח בדיקה</div>
            </div>
          </button>

          {/* צור תור - Create Appointment */}
          <button onClick={() => router.push('/garage/appointments')}
            className="flex flex-col items-center gap-3 p-5 bg-white border border-gray-100 rounded-xl hover:shadow-lg hover:border-gray-200 transition text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#f0fdfa'}}>
              <Calendar size={20} style={{color: '#0d9488'}} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1e3a5f]">ניהול תורים</div>
              <div className="text-xs text-gray-500 mt-0.5">אשר או עדכן</div>
            </div>
          </button>

          {/* ביקורות - Reviews */}
          <button onClick={() => router.push('/garage/reviews')}
            className="flex flex-col items-center gap-3 p-5 bg-white border border-gray-100 rounded-xl hover:shadow-lg hover:border-gray-200 transition text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#f0fdfa'}}>
              <Star size={20} style={{color: '#0d9488'}} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1e3a5f]">ביקורות</div>
              <div className="text-xs text-gray-500 mt-0.5">{stats.totalReviews} ביקורות</div>
            </div>
          </button>

          {/* לקוחות - Customers */}
          <button onClick={() => router.push('/garage/customers')}
            className="flex flex-col items-center gap-3 p-5 bg-white border border-gray-100 rounded-xl hover:shadow-lg hover:border-gray-200 transition text-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#f0fdfa'}}>
              <User size={20} style={{color: '#0d9488'}} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1e3a5f]">לקוחות</div>
              <div className="text-xs text-gray-500 mt-0.5">ניהול לקוחות</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
