'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import {
  Receipt, Search, Eye, Loader2, Building2, Car, Calendar, ChevronDown, ChevronUp, Filter,
  Brain, TrendingUp, DollarSign, Wrench, Target, AlertTriangle, BarChart3
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BillingInspection {
  id: string;
  inspectionType: string;
  date: string;
  status: string;
  overallScore: number | null;
  cost: number | null;
  workPerformed: Array<{ item: string; action: string; notes?: string; cost?: number }> | null;
  vehicle: { nickname: string | null; model: string; manufacturer: string | null; licensePlate: string };
  garage: { id: string; name: string; city: string | null };
}

interface GarageSummary {
  garageId: string;
  garageName: string;
  garageCity: string | null;
  inspections: BillingInspection[];
  totalInspections: number;
  preTestCount: number;
  totalCost: number;
}

const typeLabels: Record<string, string> = {
  full: 'בדיקה מלאה',
  rot: 'בדיקת רקב',
  engine: 'בדיקת מנוע',
  tires: 'בדיקת צמיגים',
  brakes: 'בדיקת בלמים',
  pre_test: 'הכנה לטסט',
  periodic: 'טיפול תקופתי',
  troubleshoot: 'אבחון תקלה',
};

export default function AdminBillingPage() {
  const [inspections, setInspections] = useState<BillingInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedGarage, setExpandedGarage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { fetchInspections(); }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inspections?limit=200');
      if (res.ok) {
        const data = await res.json();
        // Parse workPerformed JSON for each inspection
        const parsed = (data.inspections || []).map((i: any) => ({
          ...i,
          workPerformed: typeof i.workPerformed === 'string' ? JSON.parse(i.workPerformed) : i.workPerformed || null,
          cost: i.cost || null,
        }));
        setInspections(parsed);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter inspections
  const filtered = inspections.filter(i => {
    if (filterType !== 'all' && i.inspectionType !== filterType) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      i.vehicle.nickname?.toLowerCase().includes(s) ||
      i.vehicle.licensePlate?.includes(s) ||
      i.garage.name?.toLowerCase().includes(s)
    );
  });

  // Group by garage
  const garageSummaries: GarageSummary[] = Object.values(
    filtered.reduce((acc: Record<string, GarageSummary>, i) => {
      const gId = i.garage.id || i.garage.name;
      if (!acc[gId]) {
        acc[gId] = {
          garageId: gId,
          garageName: i.garage.name,
          garageCity: i.garage.city,
          inspections: [],
          totalInspections: 0,
          preTestCount: 0,
          totalCost: 0,
        };
      }
      acc[gId].inspections.push(i);
      acc[gId].totalInspections++;
      if (i.inspectionType === 'pre_test') acc[gId].preTestCount++;
      // Calculate cost from workPerformed items
      const workCost = i.workPerformed?.reduce((sum, w) => sum + (w.cost || 0), 0) || 0;
      acc[gId].totalCost += i.cost || workCost;
      return acc;
    }, {})
  ).sort((a, b) => b.totalInspections - a.totalInspections);

  const totalPreTests = filtered.filter(i => i.inspectionType === 'pre_test').length;
  const totalAll = filtered.length;

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <Receipt size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">מעקב חיוב מוסכים</h1>
            <p className="text-sm text-gray-500">סיכום בדיקות ועלויות לפי מוסך</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="info" size="md">{totalAll} בדיקות</Badge>
          <Badge variant="success" size="md">{totalPreTests} הכנה לטסט</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1">
          <Input placeholder="חפש לפי מוסך או רכב..." icon={<Search size={16} />}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white text-right"
          dir="rtl">
          <option value="all">כל הסוגים</option>
          <option value="pre_test">הכנה לטסט</option>
          <option value="full">בדיקה מלאה</option>
          <option value="rot">בדיקת רקב</option>
          <option value="engine">בדיקת מנוע</option>
        </select>
      </div>

      {/* Summary Stats */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-t-4 border-t-[#1e3a5f]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1e3a5f] bg-opacity-10 rounded-lg flex items-center justify-center">
                <BarChart3 size={18} className="text-[#1e3a5f]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1e3a5f]">{totalAll}</div>
                <div className="text-xs text-gray-500">סה״כ בדיקות</div>
              </div>
            </div>
          </Card>
          <Card className="border-t-4 border-t-blue-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench size={18} className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalPreTests}</div>
                <div className="text-xs text-gray-500">הכנות לטסט</div>
              </div>
            </div>
          </Card>
          <Card className="border-t-4 border-t-[#0d9488]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <DollarSign size={18} className="text-[#0d9488]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#0d9488]">
                  ₪{garageSummaries.reduce((sum, g) => sum + g.totalCost, 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">סה״כ עלויות</div>
              </div>
            </div>
          </Card>
          <Card className="border-t-4 border-t-emerald-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Building2 size={18} className="text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{garageSummaries.length}</div>
                <div className="text-xs text-gray-500">מוסכים פעילים</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* AI Billing Insights */}
      {!loading && garageSummaries.length > 0 && (
        <Card className="bg-gradient-to-r from-[#fef7ed] to-white border-r-4 border-r-[#0d9488]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#0d9488] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-[#0d9488]" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">תובנות AI לחיוב</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Top garage insight */}
            {garageSummaries.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-xl border border-teal-200">
                <Target size={18} className="text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-teal-800">מוסך מוביל</p>
                  <p className="text-xs text-teal-600 mt-0.5">
                    {garageSummaries[0].garageName} — {garageSummaries[0].totalInspections} בדיקות
                    {garageSummaries[0].totalCost > 0 && `, ₪${garageSummaries[0].totalCost.toLocaleString()}`}
                  </p>
                </div>
              </div>
            )}
            {/* Pre-test ratio */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <TrendingUp size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-800">יחס הכנה לטסט</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {totalAll > 0 ? `${Math.round((totalPreTests / totalAll) * 100)}%` : '0%'} מהבדיקות הן הכנה לטסט
                  {totalPreTests / totalAll > 0.5 ? ' — ביקוש גבוה' : totalPreTests / totalAll > 0.25 ? ' — יחס בריא' : ' — ביקוש נמוך'}
                </p>
              </div>
            </div>
            {/* Cost per inspection */}
            {(() => {
              const totalCost = garageSummaries.reduce((sum, g) => sum + g.totalCost, 0);
              const avgCost = totalAll > 0 ? Math.round(totalCost / totalAll) : 0;
              return (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <DollarSign size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">עלות ממוצעת לבדיקה</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      ₪{avgCost.toLocaleString()} — {avgCost > 300 ? 'גבוה מהממוצע, מומלץ לבדוק' : avgCost > 0 ? 'בטווח סביר' : 'לא דווחו עלויות'}
                    </p>
                  </div>
                </div>
              );
            })()}
            {/* Garages without costs */}
            {garageSummaries.filter(g => g.totalCost === 0).length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
                <AlertTriangle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-800">מוסכים ללא דיווח עלויות</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {garageSummaries.filter(g => g.totalCost === 0).length} מוסכים לא דיווחו עלויות — מומלץ לוודא
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-teal-600" />
        </div>
      ) : garageSummaries.length === 0 ? (
        <div className="text-center py-12">
          <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">לא נמצאו בדיקות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {garageSummaries.map(gs => (
            <Card key={gs.garageId} className="overflow-hidden">
              {/* Garage summary header */}
              <button
                onClick={() => setExpandedGarage(expandedGarage === gs.garageId ? null : gs.garageId)}
                className="w-full flex items-center justify-between text-right p-0"
              >
                <div className="flex items-center gap-2">
                  {expandedGarage === gs.garageId
                    ? <ChevronUp size={16} className="text-gray-400" />
                    : <ChevronDown size={16} className="text-gray-400" />}
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                      {gs.totalInspections} בדיקות
                    </span>
                    {gs.preTestCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {gs.preTestCount} הכנות לטסט
                      </span>
                    )}
                    {gs.totalCost > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                        {gs.totalCost.toLocaleString()} ₪
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="font-bold text-sm text-gray-800 block">{gs.garageName}</span>
                    {gs.garageCity && <span className="text-xs text-gray-500">{gs.garageCity}</span>}
                  </div>
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-emerald-600" />
                  </div>
                </div>
              </button>

              {/* Expanded details - list of inspections for this garage */}
              {expandedGarage === gs.garageId && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-right py-2 px-2 font-semibold text-gray-500">רכב</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-500">סוג</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-500">תאריך</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-500">ציון</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-500">עבודות</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-500">עלות</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-500"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {gs.inspections.map(i => {
                          const workCount = i.workPerformed?.length || 0;
                          const workCost = i.workPerformed?.reduce((sum, w) => sum + (w.cost || 0), 0) || 0;
                          const displayCost = i.cost || workCost;
                          return (
                            <tr key={i.id} className="border-b border-gray-50 hover:bg-[#fef7ed]/30 transition">
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-1">
                                  <Car size={12} className="text-gray-400" />
                                  <span className="font-medium text-gray-800">
                                    {i.vehicle.nickname || `${i.vehicle.manufacturer || ''} ${i.vehicle.model}`.trim()}
                                  </span>
                                </div>
                                <span className="text-gray-400 text-xs font-mono">{i.vehicle.licensePlate}</span>
                              </td>
                              <td className="py-2 px-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  i.inspectionType === 'pre_test' ? 'bg-blue-100 text-blue-700' :
                                  i.inspectionType === 'full' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {typeLabels[i.inspectionType] || i.inspectionType}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar size={10} className="text-gray-300" />
                                  {new Date(i.date).toLocaleDateString('he-IL')}
                                </div>
                              </td>
                              <td className="py-2 px-2">
                                {i.overallScore != null ? (
                                  <span className={`font-bold ${
                                    i.overallScore >= 80 ? 'text-green-600' :
                                    i.overallScore >= 50 ? 'text-amber-600' :
                                    'text-red-600'
                                  }`}>{i.overallScore}</span>
                                ) : '—'}
                              </td>
                              <td className="py-2 px-2">
                                {workCount > 0 ? (
                                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    {workCount} פריטים
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="py-2 px-2">
                                {displayCost > 0 ? (
                                  <span className="font-medium text-teal-700">{displayCost.toLocaleString()} ₪</span>
                                ) : '—'}
                              </td>
                              <td className="py-2 px-2">
                                <Button variant="ghost" size="sm" icon={<Eye size={12} />}
                                  onClick={() => router.push(`/inspection/${i.id}`)} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
