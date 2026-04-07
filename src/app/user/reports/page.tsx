'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import { StatusBadge } from '@/components/ui/Badge';
import {
  FileText, Filter, Loader2, Search, ChevronDown, PenLine,
  Car, ClipboardCheck, Wrench, Settings, AlertTriangle,
  CheckCircle2, Clock, Eye, Download, BarChart3, Brain, TrendingUp, Target
} from 'lucide-react';


const categoryLabel = (c: string) => {
  const map: Record<string, string> = {
    tires: 'צמיגים', lights: 'תאורה', brakes: 'בלמים', engine: 'מנוע',
    steering: 'היגוי', suspension: 'מתלים', body: 'מרכב', fluids: 'נוזלים',
    electrical: 'חשמל', interior: 'פנים', exterior: 'חיצוני', gearbox: 'תיבת הילוכים',
    exhaust: 'פליטה', ac: 'מיזוג', windows: 'חלונות', battery: 'מצבר',
    pre_test: 'הכנה לטסט', work_performed: 'עבודות שבוצעו',
  };
  return map[c] || c;
};

interface Inspection {
  id: string;
  inspectionType: string;
  date: string;
  status: string;
  overallScore?: number;
  createdAt?: string;
  vehicleId?: string;
  garageId?: string;
  vehicle?: { nickname: string; model: string; licensePlate: string };
  garage?: { name: string };
  items?: { category: string; itemName: string; status: string; score?: number; notes?: string }[];
}

// ============ TYPE CONFIG ============
// Each inspection type has its own identity: label, icon, color scheme
const INSPECTION_TYPE_CONFIG: Record<string, {
  label: string;
  icon: typeof Car;
  colorClass: string;       // text color
  bgClass: string;          // background
  borderClass: string;      // border accent
  scoreBgClass: string;     // score ring track
  badgeBg: string;          // type badge background
  badgeText: string;        // type badge text
}> = {
  full: {
    label: 'בדיקה מלאה (AutoLog)',
    icon: Car,
    colorClass: 'text-teal-600',
    bgClass: 'bg-teal-50',
    borderClass: 'border-r-teal-500',
    scoreBgClass: '#0d9488',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-700',
  },
  pre_test: {
    label: 'הכנה לטסט',
    icon: ClipboardCheck,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-r-blue-500',
    scoreBgClass: '#2563eb',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
  },
  periodic: {
    label: 'טיפול תקופתי',
    icon: Settings,
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50',
    borderClass: 'border-r-purple-500',
    scoreBgClass: '#9333ea',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
  },
  troubleshoot: {
    label: 'תיקון / אבחון תקלה',
    icon: Wrench,
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-50',
    borderClass: 'border-r-orange-500',
    scoreBgClass: '#ea580c',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
  },
  rot: {
    label: 'בדיקת רקב',
    icon: FileText,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    borderClass: 'border-r-amber-500',
    scoreBgClass: '#d97706',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
  },
  engine: {
    label: 'בדיקת מנוע',
    icon: Settings,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-50',
    borderClass: 'border-r-red-500',
    scoreBgClass: '#dc2626',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
  },
  tires: {
    label: 'בדיקת צמיגים',
    icon: Settings,
    colorClass: 'text-slate-600',
    bgClass: 'bg-slate-50',
    borderClass: 'border-r-slate-500',
    scoreBgClass: '#475569',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
  },
  brakes: {
    label: 'בדיקת בלמים',
    icon: AlertTriangle,
    colorClass: 'text-rose-600',
    bgClass: 'bg-rose-50',
    borderClass: 'border-r-rose-500',
    scoreBgClass: '#e11d48',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
  },
};

const DEFAULT_CONFIG = INSPECTION_TYPE_CONFIG.full;

function getConfig(type: string) {
  return INSPECTION_TYPE_CONFIG[type] || DEFAULT_CONFIG;
}

// ============ SCORE CIRCLE ============
function ScoreCircle({ score }: { score: number }) {
  const getGradientColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const strokeColor = getGradientColor(score);
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="50" cy="50" r="45" fill="none" stroke={strokeColor} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color: strokeColor }}>{score}</span>
      </div>
    </div>
  );
}

// ============ FILTER TABS ============
const FILTER_TABS = [
  { key: 'all', label: 'הכל', icon: BarChart3 },
  { key: 'full', label: 'בדיקות מקיפות', icon: Car },
  { key: 'pre_test', label: 'הכנה לטסט', icon: ClipboardCheck },
  { key: 'periodic', label: 'טיפולים', icon: Settings },
  { key: 'troubleshoot', label: 'תיקונים', icon: Wrench },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/inspections')
      .then(res => res.json())
      .then(data => setReports(data.inspections || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  // Filter
  const filteredReports = reports.filter(r => {
    const matchType = filterType === 'all' || r.inspectionType === filterType;
    const matchSearch = !searchQuery ||
      r.vehicle?.model?.includes(searchQuery) ||
      r.vehicle?.licensePlate?.includes(searchQuery) ||
      r.vehicle?.nickname?.includes(searchQuery) ||
      r.garage?.name?.includes(searchQuery);
    return matchType && matchSearch;
  }).sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

  // Stats
  const typeCounts = reports.reduce((acc, r) => {
    acc[r.inspectionType] = (acc[r.inspectionType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="bg-[#fef7ed] pb-24" dir="rtl">
        <PageHeader title="דוחות בדיקה" variant="purple" backUrl="/user/profile" />
        <div className="container mx-auto px-4 pt-12">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fef7ed] pb-24 min-h-screen" dir="rtl">
      <PageHeader title="דוחות בדיקה" variant="purple" backUrl="/user/profile" />

      <div className="container mx-auto px-4 space-y-6 pt-6">
        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש לפי רכב או מוסך..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-12 py-3 bg-white rounded-xl text-sm text-right border-0 shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTER_TABS.map(tab => {
          const count = tab.key === 'all' ? reports.length : (typeCounts[tab.key] || 0);
          if (tab.key !== 'all' && count === 0) return null;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === tab.key
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-700 shadow-sm hover:shadow-md'
              }`}
            >
              <IconComponent size={14} />
              {tab.label}
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                filterType === tab.key ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* AI Insights */}
      {!loading && reports.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Brain size={16} className="text-purple-600" />
            </div>
            <h2 className="text-sm font-bold text-[#1e3a5f]">תובנות AI</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Average Score */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-purple-500" />
                <span className="text-xs font-bold text-gray-700">ציון ממוצע</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {(() => {
                  const avgScore = Math.round(reports.reduce((sum, r) => sum + (r.overallScore || 0), 0) / reports.length);
                  const interpretation = avgScore >= 80 ? 'ממצב טוב' : avgScore >= 60 ? 'דורש תשומת לב' : 'יש בעיות';
                  return `${avgScore}%`;
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(() => {
                  const avgScore = Math.round(reports.reduce((sum, r) => sum + (r.overallScore || 0), 0) / reports.length);
                  const interpretation = avgScore >= 80 ? 'ממצב טוב' : avgScore >= 60 ? 'דורש תשומת לב' : 'יש בעיות';
                  return interpretation;
                })()}
              </p>
            </div>

            {/* Most Common Type */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={14} className="text-purple-500" />
                <span className="text-xs font-bold text-gray-700">בדיקה מוביל</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {(() => {
                  const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'all';
                  const config = getConfig(mostCommonType);
                  return config.label.split(' ')[0];
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(() => {
                  const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'all';
                  const count = typeCounts[mostCommonType] || 0;
                  return `${count} דוחות`;
                })()}
              </p>
            </div>

            {/* Overall Status */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-purple-500" />
                <span className="text-xs font-bold text-gray-700">הושלמו</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {(() => {
                  const completed = reports.filter(r => r.status === 'completed').length;
                  const percentage = Math.round((completed / reports.length) * 100);
                  return `${percentage}%`;
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(() => {
                  const completed = reports.filter(r => r.status === 'completed').length;
                  return `${completed}/${reports.length} דוחות`;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-purple-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">
            {reports.length === 0 ? 'אין דוחות בדיקה' : 'אין תוצאות'}
          </h3>
          <p className="text-gray-500 text-sm">
            {reports.length === 0 ? 'לאחר בדיקת AutoLog או טיפול, המידע יופיע כאן' : 'נסה לשנות את הסינון'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map(r => {
            const config = getConfig(r.inspectionType);
            const TypeIcon = config.icon;
            const isExpanded = expandedReport === r.id;
            const recommendationCount = r.items?.filter(i => i.status !== 'ok').length || 0;

            return (
              <div key={r.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all ${r.status === 'awaiting_signature' ? 'ring-2 ring-amber-200' : ''}`}>
                {/* Awaiting signature banner */}
                {r.status === 'awaiting_signature' && (
                  <Link href={`/inspection/${r.id}`} className="block bg-amber-50 px-4 py-2.5 hover:bg-amber-100 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 bg-amber-200 px-3 py-1 rounded-full">חתום עכשיו ←</span>
                      <div className="flex items-center gap-2 text-amber-700">
                        <PenLine size={14} />
                        <span className="text-sm font-medium">דוח זה ממתין לחתימתך</span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Main Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedReport(isExpanded ? null : r.id)}
                >
                  {/* Score Circle */}
                  <ScoreCircle score={r.overallScore || 0} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Type Badge + Status */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${config.badgeBg} ${config.badgeText}`}>
                        <config.icon size={12} />
                        {config.label.split(' ')[0]}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>

                    {/* Vehicle + Garage + Date */}
                    <div className="text-sm text-gray-800 font-medium truncate">
                      {r.vehicle?.nickname || r.vehicle?.model}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                      {r.vehicle?.licensePlate && <span>{r.vehicle.licensePlate}</span>}
                      {r.garage?.name && <span>{r.garage.name}</span>}
                      <span>{new Date(r.createdAt || r.date).toLocaleDateString('he-IL')}</span>
                    </div>
                  </div>

                  {/* Recommendations count + expand */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {recommendationCount > 0 && (
                      <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold">
                        {recommendationCount}
                      </span>
                    )}
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/30">
                    {/* Category breakdown */}
                    {r.items && r.items.length > 0 && (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                          {(() => {
                            const categories = Array.from(new Set(r.items.map(i => i.category)));
                            return categories.map(cat => {
                              const catItems = r.items!.filter(i => i.category === cat);
                              const avgScore = Math.round(catItems.reduce((sum, i) => sum + (i.score || 0), 0) / catItems.length);
                              const hasWarning = catItems.some(i => i.status !== 'ok');
                              const hasCritical = catItems.some(i => i.status === 'critical');
                              return (
                                <div key={cat} className={`p-3 rounded-xl text-center bg-white shadow-sm ${
                                  hasCritical ? 'border border-red-200' :
                                  hasWarning ? 'border border-amber-200' :
                                  'border border-green-200'
                                }`}>
                                  <div className="text-xs text-gray-600 mb-1">{categoryLabel(cat)}</div>
                                  <div className={`text-lg font-bold ${
                                    hasCritical ? 'text-red-600' : hasWarning ? 'text-amber-600' : 'text-green-600'
                                  }`}>{avgScore}</div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {/* Problem items */}
                        {r.items.filter(i => i.status !== 'ok').length > 0 && (
                          <div className="space-y-2 mb-4">
                            <p className="text-xs font-semibold text-gray-600 mb-2">ממצאים:</p>
                            {r.items.filter(i => i.status !== 'ok').map((item, idx) => (
                              <div key={idx} className={`flex items-center gap-2 p-2.5 rounded-xl text-sm bg-white shadow-sm border ${
                                item.status === 'critical' ? 'border-red-200' : 'border-amber-200'
                              }`}>
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                <span className={`font-medium ${item.status === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
                                  {categoryLabel(item.category)} - {item.itemName}
                                </span>
                                {item.notes && <span className={`text-xs opacity-70 mr-auto ${item.status === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>({item.notes})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/inspection/${r.id}`} className="flex-1">
                        <Button variant="outline" size="sm" icon={<Eye size={14} />} className="w-full">
                          צפה בפרטים
                        </Button>
                      </Link>
                      <Link href={`/inspection/${r.id}`} className="flex-1">
                        <Button variant="ghost" size="sm" icon={<Download size={14} />} className="w-full">
                          הורד PDF
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
