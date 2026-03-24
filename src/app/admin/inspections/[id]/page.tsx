'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { Shield, ArrowRight, Car, Building2, Wrench, Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

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



interface InspectionDetail {
  id: string;
  inspectionType: string;
  date: string;
  status: string;
  overallScore: number | null;
  mechanicName: string | null;
  summary: string | null;
  recommendations: string | null;
  detailedScores: string | null;
  cost: number | null;
  vehicle: { nickname: string; model: string; licensePlate: string; manufacturer?: string };
  garage: { name: string; city: string };
  items: { id: string; category: string; itemName: string; status: string; notes: string | null; score: number | null }[];
}

const typeLabels: Record<string, string> = {
  full: 'בדיקה מלאה', rot: 'בדיקת רקב', engine: 'בדיקת מנוע',
  tires: 'בדיקת צמיגים', brakes: 'בדיקת בלמים', pre_test: 'הכנה לטסט',
  periodic: 'טיפול תקופתי', troubleshoot: 'אבחון תקלה',
};

const statusIcon = (status: string) => {
  if (status === 'ok') return <CheckCircle size={14} className="text-green-500" />;
  if (status === 'warning') return <AlertTriangle size={14} className="text-amber-500" />;
  return <XCircle size={14} className="text-red-500" />;
};

export default function AdminInspectionDetailPage({ params }: { params: { id: string } }) {
  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/inspections/${params.id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setInspection(data.inspection))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-teal-600" /></div>;
  if (!inspection) return <div className="text-center py-20"><p className="text-gray-500">בדיקה לא נמצאה</p></div>;

  const recs = (() => { try { return JSON.parse(inspection.recommendations || '[]'); } catch { return []; } })();
  const scores = (() => { try { return JSON.parse(inspection.detailedScores || '{}'); } catch { return {}; } })();

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" icon={<ArrowRight size={16} />} onClick={() => router.back()} />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] rounded-lg flex items-center justify-center border-2 border-[#1e3a5f]">
            <Shield size={22} className="text-[#1e3a5f]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">פרטי בדיקה</h1>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Car size={20} className="text-teal-600" />
            <h3 className="font-bold">רכב</h3>
          </div>
          <p className="text-sm">{inspection.vehicle.nickname || inspection.vehicle.model}</p>
          <p className="text-xs text-gray-500">{inspection.vehicle.licensePlate}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Building2 size={20} className="text-teal-600" />
            <h3 className="font-bold">מוסך</h3>
          </div>
          <p className="text-sm">{inspection.garage.name}</p>
          <p className="text-xs text-gray-500">{inspection.garage.city}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Wrench size={20} className="text-blue-600" />
            <h3 className="font-bold">פרטים</h3>
          </div>
          <p className="text-sm">{typeLabels[inspection.inspectionType] || inspection.inspectionType}</p>
          <p className="text-xs text-gray-500">{new Date(inspection.date).toLocaleDateString('he-IL')}</p>
          <div className="mt-1"><StatusBadge status={inspection.status} /></div>
        </Card>
      </div>

      {/* Score */}
      {inspection.overallScore !== null && (
        <Card>
          <h3 className="font-bold mb-3">ציון כללי</h3>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${inspection.overallScore >= 80 ? 'text-green-600' : inspection.overallScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
              {inspection.overallScore}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div className={`h-3 rounded-full ${inspection.overallScore >= 80 ? 'bg-green-500' : inspection.overallScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${inspection.overallScore}%` }} />
            </div>
          </div>
        </Card>
      )}

      {/* Detailed scores */}
      {Object.keys(scores).length > 0 && (
        <Card>
          <h3 className="font-bold mb-3">ציונים מפורטים</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(scores).map(([key, val]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">{key}</div>
                <div className={`text-lg font-bold ${(val as number) >= 80 ? 'text-green-600' : (val as number) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{val as number}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Items */}
      {(inspection.items || []).length > 0 && (
        <Card>
          <h3 className="font-bold mb-3">פריטי בדיקה</h3>
          <div className="space-y-2">
            {inspection.items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {statusIcon(item.status)}
                  <span className="text-sm font-medium">{item.itemName}</span>
                  <span className="text-xs text-gray-400">({categoryLabel(item.category)})</span>
                </div>
                {item.score && <span className="text-sm font-bold">{item.score}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary & Recommendations */}
      {inspection.summary && (
        <Card>
          <h3 className="font-bold mb-2">סיכום</h3>
          <p className="text-sm text-gray-700">{inspection.summary}</p>
        </Card>
      )}
      {recs.length > 0 && (
        <Card>
          <h3 className="font-bold mb-2">המלצות</h3>
          <ul className="space-y-1">
            {recs.map((r: string, i: number) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-teal-500 mt-0.5">•</span> {r}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
