'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import {
  Shield, Search, Plus, Eye, Download, Loader2,
  Car, ClipboardCheck, Wrench, Settings, FileText, AlertTriangle, ChevronDown, BarChart3,
  Brain, TrendingUp, Target, Activity, Send, PenLine
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Inspection {
  id: string;
  vehicle: { nickname: string; licensePlate: string; model: string };
  garage: { name: string };
  date: string;
  overallScore: number | null;
  status: string;
  inspectionType: string;
  mechanicName: string | null;
}

// ============ TYPE CONFIG ============
const TYPE_CONFIG: Record<string, {
  label: string;
  icon: typeof Car;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
}> = {
  full: { label: 'בדיקה מלאה', icon: Car, badgeBg: 'bg-teal-100', badgeText: 'text-teal-700', borderClass: 'border-r-teal-500' },
  pre_test: { label: 'הכנה לטסט', icon: ClipboardCheck, badgeBg: 'bg-blue-100', badgeText: 'text-blue-700', borderClass: 'border-r-blue-500' },
  periodic: { label: 'טיפול תקופתי', icon: Settings, badgeBg: 'bg-teal-100', badgeText: 'text-teal-700', borderClass: 'border-r-teal-500' },
  troubleshoot: { label: 'תיקון / אבחון', icon: Wrench, badgeBg: 'bg-orange-100', badgeText: 'text-orange-700', borderClass: 'border-r-orange-500' },
  rot: { label: 'בדיקת רקב', icon: FileText, badgeBg: 'bg-amber-100', badgeText: 'text-amber-700', borderClass: 'border-r-amber-500' },
  engine: { label: 'בדיקת מנוע', icon: Settings, badgeBg: 'bg-red-100', badgeText: 'text-red-700', borderClass: 'border-r-red-500' },
  tires: { label: 'בדיקת צמיגים', icon: Settings, badgeBg: 'bg-slate-100', badgeText: 'text-slate-700', borderClass: 'border-r-slate-500' },
  brakes: { label: 'בדיקת בלמים', icon: AlertTriangle, badgeBg: 'bg-rose-100', badgeText: 'text-rose-700', borderClass: 'border-r-rose-500' },
};

const DEFAULT_TYPE = { label: 'בדיקה', icon: BarChart3, badgeBg: 'bg-gray-100', badgeText: 'text-gray-700', borderClass: 'border-r-gray-400' };

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || DEFAULT_TYPE;
}

const FILTER_TABS = [
  { key: 'all', label: 'הכל', icon: BarChart3 },
  { key: 'full', label: 'בדיקות מקיפות', icon: Car },
  { key: 'pre_test', label: 'הכנה לטסט', icon: ClipboardCheck },
  { key: 'periodic', label: 'טיפולים', icon: Settings },
  { key: 'troubleshoot', label: 'תיקונים', icon: Wrench },
];

export default function GarageInspectionsPage() {
  const router = useRouter();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'awaiting_signature' | 'completed'>('all');

  const handleDownload = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    window.open(`/inspection/${id}/print`, '_blank');
  };

  useEffect(() => { loadInspections(); }, []);

  const loadInspections = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inspections?limit=100');
      if (res.ok) {
        const data = await res.json();
        setInspections(data.inspections || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const filtered = inspections.filter(i => {
    const matchType = filterType === 'all' || i.inspectionType === filterType;
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    const typeLabel = getTypeConfig(i.inspectionType).label;
    const matchSearch = !search ||
      `${i.vehicle.nickname} (${i.vehicle.licensePlate})`.includes(search) ||
      i.mechanicName?.includes(search) ||
      typeLabel.includes(search);
    return matchType && matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const awaitingCount = inspections.filter(i => i.status === 'awaiting_signature').length;
  const completedCount = inspections.filter(i => i.status === 'completed').length;

  const typeCounts = inspections.reduce((acc, i) => {
    acc[i.inspectionType] = (acc[i.inspectionType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] rounded-lg border-2 border-[#1e3a5f] flex items-center justify-center shadow-sm">
            <Shield size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">בדיקות ופעולות</h1>
            <p className="text-sm text-gray-500">{inspections.length} רשומות</p>
          </div>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => router.push('/garage/new-inspection')} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
          פעולה חדשה
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="חפש לפי רכב, מכניק או סוג..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-3 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Status Quick Filters */}
      {awaitingCount > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus(filterStatus === 'awaiting_signature' ? 'all' : 'awaiting_signature')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              filterStatus === 'awaiting_signature'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <PenLine size={14} />
            ממתינות לחתימה
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              filterStatus === 'awaiting_signature' ? 'bg-white/20' : 'bg-amber-200'
            }`}>{awaitingCount}</span>
          </button>
          <button
            onClick={() => setFilterStatus(filterStatus === 'completed' ? 'all' : 'completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              filterStatus === 'completed'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            }`}
          >
            חתומות
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              filterStatus === 'completed' ? 'bg-white/20' : 'bg-green-200'
            }`}>{completedCount}</span>
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map(tab => {
          const count = tab.key === 'all' ? inspections.length : (typeCounts[tab.key] || 0);
          if (tab.key !== 'all' && count === 0) return null;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                filterType === tab.key
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <IconComponent size={14} />
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filterType === tab.key ? 'bg-white/20' : 'bg-gray-200'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* AI Insights */}
      {!loading && inspections.length > 0 && (
        <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">תובנות AI לבדיקות</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-gray-700">סוג בדיקה מוביל</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
                  if (!topType) return '📋 אין מספיק נתונים לניתוח.';
                  const pct = Math.round((topType[1] / inspections.length) * 100);
                  return `📊 ${getTypeConfig(topType[0]).label} — ${pct}% מכלל הבדיקות (${topType[1]} מתוך ${inspections.length}). ${pct > 50 ? 'שקלו גיוון שירותים.' : 'התפלגות מגוונת.'}`;
                })()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-gray-700">ציון ממוצע</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const scored = inspections.filter(i => i.overallScore !== null);
                  if (scored.length === 0) return '🔍 אין ציונים זמינים עדיין.';
                  const avg = Math.round(scored.reduce((s, i) => s + (i.overallScore || 0), 0) / scored.length);
                  return avg >= 80
                    ? `⭐ ציון ממוצע ${avg} — איכות בדיקות מצוינת! שמרו על הרמה.`
                    : avg >= 60
                    ? `📊 ציון ממוצע ${avg} — יש מקום לשיפור בחלק מהבדיקות.`
                    : `⚠️ ציון ממוצע ${avg} — מומלץ לבדוק את תהליכי הבדיקה.`;
                })()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-amber-600" />
                <span className="text-xs font-bold text-gray-700">סטטוס פעילות</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const completed = inspections.filter(i => i.status === 'completed').length;
                  const pending = inspections.filter(i => i.status === 'pending' || i.status === 'in_progress' || i.status === 'awaiting_signature').length;
                  if (pending > 0) return `⏳ ${pending} בדיקות בתהליך. ${completed} הושלמו. סיימו בדיקות פתוחות לשיפור זמני טיפול.`;
                  return `✅ כל ${completed} הבדיקות הושלמו. ביצועים מצוינים!`;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200">
            <Shield size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">
            {inspections.length === 0 ? 'אין בדיקות עדיין' : 'אין תוצאות'}
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {inspections.length === 0 ? 'לחץ על "פעולה חדשה" להתחיל' : 'נסה לשנות את הסינון'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(i => {
            const config = getTypeConfig(i.inspectionType);
            return (
              <div
                key={i.id}
                className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer border-r-4 ${config.borderClass}`}
                onClick={() => router.push(`/inspection/${i.id}`)}
              >
                <div className="flex items-center gap-3 p-4">
                  {/* Score */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    i.overallScore && i.overallScore >= 80 ? 'bg-green-50' :
                    i.overallScore && i.overallScore >= 60 ? 'bg-amber-50' :
                    i.overallScore ? 'bg-red-50' : 'bg-gray-50'
                  }`}>
                    {i.overallScore ? (
                      <span className={`text-lg font-bold ${
                        i.overallScore >= 80 ? 'text-green-600' :
                        i.overallScore >= 60 ? 'text-amber-600' : 'text-red-600'
                      }`}>{i.overallScore}</span>
                    ) : (
                      <span className="text-gray-300 text-lg">—</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.badgeBg} ${config.badgeText}`}>
                        <config.icon size={12} />
                        {config.label}
                      </span>
                      <StatusBadge status={i.status} />
                    </div>
                    <p className="font-bold text-sm text-gray-800 truncate">{i.vehicle.nickname}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{i.vehicle.licensePlate}</span>
                      <span>•</span>
                      <span>{new Date(i.date).toLocaleDateString('he-IL')}</span>
                      {i.mechanicName && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{i.mechanicName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {(i.status === 'completed' || i.status === 'awaiting_signature') && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (i.status !== 'awaiting_signature') {
                            await fetch(`/api/inspections/${i.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'awaiting_signature' }),
                            });
                          }
                          const signUrl = `${window.location.origin}/inspection/${i.id}`;
                          const msg = encodeURIComponent(`שלום, דוח הבדיקה שלך מוכן לצפייה וחתימה:\n${signUrl}`);
                          window.open(`https://wa.me/?text=${msg}`, '_blank');
                        }}
                        className="p-2 rounded-lg text-green-500 hover:text-green-700 hover:bg-green-50 transition"
                        title="שלח לחתימה ב-WhatsApp"
                      >
                        <Send size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/inspection/${i.id}`)}
                      className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                    >
                      <Eye size={16} />
                    </button>
                    {i.status === 'awaiting_signature' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}/inspection/${i.id}`;
                          const msg = `שלום, דוח הבדיקה שלך מוכן. אנא חתום לאישור קבלת הדוח:\n${url}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="p-2 rounded-lg text-green-500 hover:text-green-700 hover:bg-green-50 transition"
                        title="שלח לחתימה בוואצאפ"
                      >
                        <Send size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDownload(i.id, e)}
                      className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
