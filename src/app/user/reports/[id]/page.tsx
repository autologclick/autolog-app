'use client';

import { useEffect, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { Printer, Download, Loader2, ArrowRight, Car, Wrench, BarChart3, FileText, AlertCircle, Search } from 'lucide-react';
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

interface Inspection {
  id: string;
  inspectionType: string;
  date: string;
  status: string;
  overallScore: number;
  detailedScores: Record<string, number>;
  summary: string;
  recommendations: string[];
  mechanicName: string;
  vehicle: {
    nickname: string;
    model: string;
    licensePlate: string;
    year: number;
    color?: string;
  };
  garage: {
    name: string;
    city: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    category: string;
    itemName: string;
    status: string;
    notes?: string;
    score?: number;
  }>;
  createdAt: string;
}

const inspectionTypeLabels: Record<string, string> = {
  full: 'אבחון מלא',
  rot: 'בדיקת רקב',
  engine: 'בדיקת מנוע',
  tires: 'בדיקת צמיגים',
  brakes: 'בדיקת בלמים',
  pre_test: 'הכנה לטסט',
  periodic: 'טיפול תקופתי',
  troubleshoot: 'אבחון תקלה',
};

function ScoreCircle({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return '#0d9488';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getLabel = () => {
    if (score >= 80) return 'מצוין';
    if (score >= 60) return 'טוב';
    return 'דורש תשומת לב';
  };

  const color = getColor();
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="score-circle transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-500 mt-1">מתוך 100</span>
        </div>
      </div>
      <div className="text-center">
        <Badge
          variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'}
          size="md"
        >
          {getLabel()}
        </Badge>
      </div>
    </div>
  );
}

function ProgressBar({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-800">{score}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function InspectionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const paramId = params.id;
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!paramId) return;

    const loadInspection = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/inspections/${paramId}`);
        if (!res.ok) {
          setError('בדיקה לא נמצאה');
          return;
        }
        const data = await res.json();
        setInspection(data);
      } catch (err) {
        setError('שגיאה בטעינת הבדיקה');
        if (process.env.NODE_ENV === 'development') {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadInspection();
  }, [paramId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">דוח בדיקה</h1>
        <Card className="text-center py-12 bg-red-50 border-red-200">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-red-600 mb-2">{error || 'בדיקה לא נמצאה'}</h3>
          <Button variant="outline" onClick={() => router.back()}>
            חזור אחורה
          </Button>
        </Card>
      </div>
    );
  }

  const itemsByCategory = (inspection.items || []).reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof inspection.items>);

  const warningItems = (inspection.items || []).filter(i => i.status !== 'ok');

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <FileText size={20} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">דוח בדיקה</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Printer size={16} />}
            onClick={() => window.print()}
          >
            הדפס
          </Button>
          <Button variant="ghost" size="sm" icon={<Download size={16} />}>
            הורד PDF
          </Button>
        </div>
      </div>

      {/* Header with overall score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Circle */}
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-8">
          <ScoreCircle score={inspection.overallScore} />
        </Card>

        {/* Vehicle Info */}
        <Card className="md:col-span-1">
          <CardTitle icon={<Car size={20} className="text-teal-600" />}>פרטי הרכב</CardTitle>
          <div className="space-y-3 mt-4">
            <div>
              <div className="text-xs text-gray-500 uppercase">כינוי</div>
              <div className="font-bold text-gray-800">{inspection.vehicle.nickname}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">דגם</div>
              <div className="text-gray-700">{inspection.vehicle.model}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">מספר רישוי</div>
              <div className="text-gray-700">{inspection.vehicle.licensePlate}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">שנה</div>
              <div className="text-gray-700">{inspection.vehicle.year}</div>
            </div>
            {inspection.vehicle.color && (
              <div>
                <div className="text-xs text-gray-500 uppercase">צבע</div>
                <div className="text-gray-700">{inspection.vehicle.color}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Garage Info */}
        <Card className="md:col-span-1">
          <CardTitle icon={<Wrench size={20} className="text-orange-500" />}>פרטי המוסך</CardTitle>
          <div className="space-y-3 mt-4">
            <div>
              <div className="text-xs text-gray-500 uppercase">שם</div>
              <div className="font-bold text-gray-800">{inspection.garage.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">עיר</div>
              <div className="text-gray-700">{inspection.garage.city}</div>
            </div>
            {inspection.garage.phone && (
              <div>
                <div className="text-xs text-gray-500 uppercase">טלפון</div>
                <div className="text-gray-700">{inspection.garage.phone}</div>
              </div>
            )}
            {inspection.garage.email && (
              <div>
                <div className="text-xs text-gray-500 uppercase">אימייל</div>
                <div className="text-gray-700 break-all">{inspection.garage.email}</div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Inspection Details */}
      <Card>
        <CardTitle icon={<BarChart3 size={20} className="text-purple-500" />}>פרטי הבדיקה</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase mb-1">סוג בדיקה</div>
            <div className="font-semibold text-gray-800">
              {inspectionTypeLabels[inspection.inspectionType] || inspection.inspectionType}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase mb-1">תאריך</div>
            <div className="font-semibold text-gray-800">
              {new Date(inspection.date).toLocaleDateString('he-IL')}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase mb-1">מכניק</div>
            <div className="font-semibold text-gray-800">{inspection.mechanicName || '-'}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase mb-1">סטטוס</div>
            <StatusBadge status={inspection.status} />
          </div>
        </div>
      </Card>

      {/* Category Scores */}
      <Card>
        <CardTitle icon={<BarChart3 size={20} className="text-purple-500" />}>ציוני קטגוריות</CardTitle>
        <div className="space-y-4 mt-4">
          {Object.entries(inspection.detailedScores || {}).map(([category, score]) => (
            <ProgressBar key={category} score={score} label={category} />
          ))}
        </div>
      </Card>

      {/* Summary */}
      {inspection.summary && (
        <Card>
          <CardTitle icon={<FileText size={20} className="text-gray-600" />}>סיכום</CardTitle>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {inspection.summary}
            </p>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {inspection.recommendations && inspection.recommendations.length > 0 && (
        <Card>
          <CardTitle icon={<AlertCircle size={20} className="text-amber-500" />}>המלצות</CardTitle>
          <ul className="space-y-2 mt-4">
            {inspection.recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
              >
                <span className="text-amber-600 flex-shrink-0">•</span>
                <span className="text-gray-800 text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Items with Issues */}
      {warningItems.length > 0 && (
        <Card>
          <CardTitle icon={<AlertCircle size={20} className="text-red-600" />}>פריטים הדורשים תשומת לב</CardTitle>
          <div className="space-y-2 mt-4">
            {warningItems.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  item.status === 'critical'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-amber-50 border border-amber-200'
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    item.status === 'critical' ? 'bg-red-600' : 'bg-amber-500'
                  }`}
                ></span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {categoryLabel(item.category)} - {item.itemName}
                  </div>
                  {item.notes && (
                    <div className="text-sm text-gray-600 mt-1">{item.notes}</div>
                  )}
                </div>
                {item.score !== undefined && (
                  <div className="text-sm font-bold text-gray-700">{item.score}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Items */}
      <Card>
        <CardTitle icon={<Search size={20} className="text-blue-500" />}>כל הפריטים</CardTitle>
        <div className="space-y-4 mt-4">
          {Object.entries(itemsByCategory).map(([category, items]) => (
            <div key={category}>
              <div className="font-semibold text-[#1e3a5f] mb-2 pb-2 border-b">
                {categoryLabel(category)}
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-[#fef7ed] rounded">
                    <div className="flex items-center gap-2 flex-1">
                      <span className={`w-3 h-3 rounded-full ${
                        item.status === 'ok'
                          ? 'bg-green-500'
                          : item.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-red-600'
                      }`}></span>
                      <span className="text-gray-800">{item.itemName}</span>
                      {item.notes && (
                        <span className="text-xs text-gray-500">({item.notes})</span>
                      )}
                    </div>
                    {item.score !== undefined && (
                      <span className="text-sm font-bold text-gray-700 ml-4">
                        {item.score}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Back Button */}
      <Button
        variant="ghost"
        icon={<ArrowRight size={16} />}
        onClick={() => router.push('/user/reports')}
      >
        חזור לדוחות
      </Button>
    </div>
  );
}
