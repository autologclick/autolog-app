'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { Shield, Search, Filter, Eye, Download, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Inspection {
  id: string;
  inspectionType: string;
  date: string;
  status: string;
  overallScore: number | null;
  vehicle: { nickname: string; model: string; licensePlate: string; userId: string };
  garage: { name: string; city: string };
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

export default function AdminInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const handleDownload = (id: string) => {
    window.open(`/inspection/${id}/print`, '_blank');
  };

  useEffect(() => { fetchInspections(); }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inspections?limit=50');
      if (res.ok) {
        const data = await res.json();
        setInspections(data.inspections || []);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch inspections:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = inspections.filter(i => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      i.vehicle.nickname?.toLowerCase().includes(s) ||
      i.vehicle.licensePlate?.includes(s) ||
      i.garage.name?.toLowerCase().includes(s) ||
      (typeLabels[i.inspectionType] || i.inspectionType).includes(s)
    );
  });

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <Shield size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">ניהול בדיקות</h1>
            <p className="text-sm text-gray-500">צפייה בכל הבדיקות שבוצעו</p>
          </div>
        </div>
        <Badge variant="info" size="md">{inspections.length} בדיקות</Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1">
          <Input placeholder="חפש לפי רכב, מוסך או סוג..." icon={<Search size={16} />}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-teal-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Shield size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">לא נמצאו בדיקות</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600">רכב</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600 hidden lg:table-cell">מוסך</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600 hidden md:table-cell">סוג</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600">תאריך</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600">ציון</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600">סטטוס</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.id} className="border-b border-gray-100 hover:bg-[#fef7ed]/50 transition">
                    <td className="py-2 sm:py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm">
                      {i.vehicle.nickname || i.vehicle.model} ({i.vehicle.licensePlate})
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-3 text-gray-600 text-xs hidden lg:table-cell">{i.garage.name}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-3 text-gray-600 text-xs hidden md:table-cell">{typeLabels[i.inspectionType] || i.inspectionType}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-3 text-gray-500 text-xs sm:text-sm">{new Date(i.date).toLocaleDateString('he-IL')}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-3">
                      {i.overallScore ? (
                        <span className={`font-bold text-xs sm:text-sm ${i.overallScore >= 80 ? 'text-green-600' : i.overallScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {i.overallScore}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-3"><StatusBadge status={i.status} /></td>
                    <td className="py-2 sm:py-3 px-2 sm:px-3">
                      <div className="flex gap-0.5 sm:gap-1">
                        <Button variant="ghost" size="sm" icon={<Eye size={14} />}
                          onClick={() => router.push(`/admin/inspections/${i.id}`)} />
                        <Button variant="ghost" size="sm"
                          icon={<Download size={14} />}
                          onClick={() => handleDownload(i.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
