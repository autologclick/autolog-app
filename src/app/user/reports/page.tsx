'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  FileText, Filter, Loader2, Search, ChevronDown,
  Car, ClipboardCheck, Wrench, Settings, AlertTriangle,
  CheckCircle2, Clock, Eye, Download, BarChart3, Brain, TrendingUp, Target
} from 'lucide-react';


const categoryLabel = (c: string) => {
  const map: Record<string, string> = {
    tires: '×¦×××××', lights: '×ª×××¨×', brakes: '×××××', engine: '×× ××¢',
    steering: '×××××', suspension: '××ª×××', body: '××¨××', fluids: '× ×××××',
    electrical: '××©××', interior: '×¤× ××', exterior: '×××¦×× ×', gearbox: '×ª×××ª ×××××××',
    exhaust: '×¤××××', ac: '×××××', windows: '×××× ××ª', battery: '××¦××¨',
    pre_test: '××× × ×××¡×', work_performed: '×¢×××××ª ×©×××¦×¢×',
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
    label: '××××§× ×××× (AutoLog)',
    icon: Car,
    colorClass: 'text-teal-600',
    bgClass: 'bg-teal-50',
    borderClass: 'border-r-teal-500',
    scoreBgClass: '#0d9488',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-700',
  },
  pre_test: {
    label: '××× × ×××¡×',
    icon: ClipboardCheck,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-r-blue-500',
    scoreBgClass: '#2563eb',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
  },
  periodic: {
    label: '×××¤×× ×ª×§××¤×ª×',
    icon: Settings,
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50',
    borderClass: 'border-r-purple-500',
    scoreBgClass: '#9333ea',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
  },
  troubleshoot: {
    label: '×ª××§×× / ××××× ×ª×§××',
    icon: Wrench,
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-50',
    borderClass: 'border-r-orange-500',
    scoreBgClass: '#ea580c',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
  },
  rot: {
    label: '××××§×ª ×¨×§×',
    icon: FileText,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    borderClass: 'border-r-amber-500',
    scoreBgClass: '#d97706',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
  },
  engine: {
    label: '××××§×ª ×× ××¢',
    icon: Settings,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-50',
    borderClass: 'border-r-red-500',
    scoreBgClass: '#dc2626',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
  },
  tires: {
    label: '××××§×ª ×¦×××××',
    icon: Settings,
    colorClass: 'text-slate-600',
    bgClass: 'bg-slate-50',
    borderClass: 'border-r-slate-500',
    scoreBgClass: '#475569',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
  },
  brakes: {
    label: '××××§×ª ×××××',
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
function ScoreCircle({ score, accentColor }: { score: number; accentColor: string }) {
  const green = '#0d9488';
  const amber = '#f59e0b';
  const red = '#ef4444';
  const strokeColor = score >= 80 ? green : score >= 60 ? amber : red;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="45" fill="none" stroke={strokeColor} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color: strokeColor }}>{score}</span>
      </div>
    </div>
  );
}

// ============ FILTER TABS ============
const FILTER_TABS = [
  { key: 'all', label: '×××', icon: BarChart3 },
  { key: 'full', label: '××××§××ª ××§××¤××ª', icon: Car },
  { key: 'pre_test', label: '××× × ×××¡×', icon: ClipboardCheck },
  { key: 'periodic', label: '×××¤××××', icon: Settings },
  { key: 'troubleshoot', label: '×ª××§×× ××', icon: Wrench },
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <FileText size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">×××××ª ××¤×¢××××ª</h1>
            <p className="text-sm text-gray-500">{reports.length} ×¨×©××××ª</p>
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="×××¤××© ××¤× ×¨×× ×× ×××¡×..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-3 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm text-right focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map(tab => {
          const count = tab.key === 'all' ? reports.length : (typeCounts[tab.key] || 0);
          if (tab.key !== 'all' && count === 0) return null;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                filterType === tab.key
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <IconComponent size={14} />
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filterType === tab.key ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* AI Insights */}
      {!loading && reports.length > 0 && (
        <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-teal-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">×ª××× ××ª AI ××××××ª</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Average Score */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-teal-500" />
                <span className="text-xs font-bold text-gray-700">×¦××× ××××¦×¢</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const avgScore = Math.round(reports.reduce((sum, r) => sum + (r.overallScore || 0), 0) / reports.length);
                  const interpretation = avgScore >= 80 ? 'â ×××¦× ××× ××××' : avgScore >= 60 ? 'â ï¸ ×××¨×© ×ª×©×××ª ××' : 'ð´ ××© ××¢×××ª';
                  return `${avgScore}% ${interpretation}`;
                })()}
              </p>
            </div>

            {/* Most Common Type */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={14} className="text-blue-500" />
                <span className="text-xs font-bold text-gray-700">×¡×× ××××§× ×××××</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'all';
                  const config = getConfig(mostCommonType);
                  return `ð ${config.label}`;
                })()}
              </p>
            </div>

            {/* Overall Status */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-purple-500" />
                <span className="text-xs font-bold text-gray-700">×¡××××¡ ××××</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const completed = reports.filter(r => r.status === 'completed').length;
                  const percentage = Math.round((completed / reports.length) * 100);
                  const emoji = percentage === 100 ? 'ð¯' : percentage >= 75 ? 'ð' : 'â³';
                  return `${emoji} ${percentage}% ×××©×××`;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredReports.length === 0 ? (
        <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200">
            <FileText size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">
            {reports.length === 0 ? '××× ×××××ª ××¤×¢××××ª' : '××× ×ª××¦×××ª'}
          </h3>
          <p className="text-gray-400 text-sm">
            {reports.length === 0 ? '××××¨ ××××§×ª AutoLog ×× ×××¤××, ×××××¢ ×××¤××¢ ×××' : '× ×¡× ××©× ××ª ××ª ××¡×× ××'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map(r => {
            const config = getConfig(r.inspectionType);
            const TypeIcon = config.icon;
            const isExpanded = expandedReport === r.id;
            const recommendationCount = r.items?.filter(i => i.status !== 'ok').length || 0;

            return (
              <div key={r.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all border-r-4 ${r.status === 'awaiting_signature' ? 'border-amber-300 ring-2 ring-amber-200 animate-pulse-once' : 'border-gray-200'} ${config.borderClass}`}>
                {/* Awaiting signature banner */}
                {r.status === 'awaiting_signature' && (
                  <Link href={`/inspection/${r.id}`} className="block bg-amber-50 border-b border-amber-200 px-4 py-2.5 hover:bg-amber-100 transition">
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
                  className="flex items-center gap-3 sm:gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedReport(isExpanded ? null : r.id)}
                >
                  {/* Score Circle */}
                  <ScoreCircle score={r.overallScore || 0} accentColor={config.scoreBgClass} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Type Badge + Title */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${config.badgeBg} ${config.badgeText}`}>
                        <config.icon size={12} />
                        {config.label}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>

                    {/* Vehicle + Garage */}
                    <div className="text-sm text-gray-700 font-medium truncate">
                      {r.vehicle?.nickname || r.vehicle?.model} {r.vehicle?.licensePlate && `â¢ ${r.vehicle.licensePlate}`}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      {r.garage?.name && <span>{r.garage.name}</span>}
                      <span>{new Date(r.createdAt || r.date).toLocaleDateString('he-IL')}</span>
                    </div>
                  </div>

                  {/* Recommendations count + expand */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {recommendationCount > 0 && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-semibold">
                        {recommendationCount} ××××¦××ª
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
                  <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4">
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
                                <div key={cat} className={`p-3 rounded-xl text-center ${
                                  hasCritical ? 'bg-red-50 border border-red-200' :
                                  hasWarning ? 'bg-amber-50 border border-amber-200' :
                                  'bg-green-50 border border-green-200'
                                }`}>
                                  <div className="text-xs text-gray-600 mb-1">{cat}</div>
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
                            <p className="text-xs font-semibold text-gray-500">×××¦×××:</p>
                            {r.items.filter(i => i.status !== 'ok').map((item, idx) => (
                              <div key={idx} className={`flex items-center gap-2 p-2.5 rounded-xl text-sm ${
                                item.status === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                <span className="font-medium">{categoryLabel(item.category)} - {item.itemName}</span>
                                {item.notes && <span className="text-xs opacity-70 mr-auto">({item.notes})</span>}
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
                          ×¦×¤× ××¤×¨×××
                        </Button>
                      </Link>
                      <Link href={`/inspection/${r.id}`} className="flex-1">
                        <Button variant="ghost" size="sm" icon={<Download size={14} />} className="w-full">
                          ×××¨× PDF
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
  );
}
