'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Building2, ArrowRight, MapPin, Phone, Mail, Star, Calendar, Shield, Loader2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GarageDetail {
  id: string;
  name: string;
  address: string | null;
  city: string;
  phone: string | null;
  email: string | null;
  description: string | null;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isPartner: boolean;
  createdAt: string;
  owner: { id: string; fullName: string; email: string; phone: string | null } | null;
  _count: { inspections: number; appointments: number; reviews: number };
  reviews: { id: string; userName: string; rating: number; comment: string | null; createdAt: string }[];
  appointments: { id: string; date: string; status: string; vehicle: { licensePlate: string }; user: { fullName: string } }[];
}

export default function AdminGarageDetailPage({ params }: { params: { id: string } }) {
  const [garage, setGarage] = useState<GarageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/admin/garages/${params.id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setGarage(data.garage))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-teal-600" /></div>;
  if (!garage) return <div className="text-center py-20"><p className="text-gray-500">מוסך לא נמצא</p></div>;

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" icon={<ArrowRight size={16} />} onClick={() => router.back()} />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] rounded-lg flex items-center justify-center border-2 border-[#1e3a5f]">
            <Building2 size={22} className="text-[#1e3a5f]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">{garage.name}</h1>
        </div>
        <div className="flex gap-2 ms-auto">
          {garage.isPartner && <Badge variant="success">שותף</Badge>}
          <Badge variant={garage.isActive ? 'success' : 'warning'}>{garage.isActive ? 'פעיל' : 'מושהה'}</Badge>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <Shield size={24} className="mx-auto text-teal-600 mb-2" />
            <div className="text-2xl font-bold">{garage._count.inspections}</div>
            <div className="text-xs text-gray-500">בדיקות</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Calendar size={24} className="mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold">{garage._count.appointments}</div>
            <div className="text-xs text-gray-500">תורים</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Star size={24} className="mx-auto text-amber-500 mb-2" />
            <div className="text-2xl font-bold">{garage.rating > 0 ? garage.rating.toFixed(1) : '—'}</div>
            <div className="text-xs text-gray-500">{garage._count.reviews} ביקורות</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Users size={24} className="mx-auto text-teal-600 mb-2" />
            <div className="text-2xl font-bold">{garage.owner ? '1' : '0'}</div>
            <div className="text-xs text-gray-500">בעלים</div>
          </div>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <h3 className="font-bold mb-4">פרטי מוסך</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> {garage.address || garage.city}</div>
          {garage.phone && <div className="flex items-center gap-2"><Phone size={16} className="text-gray-400" /> {garage.phone}</div>}
          {garage.email && <div className="flex items-center gap-2"><Mail size={16} className="text-gray-400" /> {garage.email}</div>}
          <div className="text-gray-500">נוצר: {new Date(garage.createdAt).toLocaleDateString('he-IL')}</div>
        </div>
        {garage.description && <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">{garage.description}</p>}
        {garage.owner && (
          <div className="mt-4 p-3 bg-teal-50 rounded-lg">
            <h4 className="text-sm font-bold text-[#1e3a5f] mb-1">בעל המוסך</h4>
            <p className="text-sm">{garage.owner.fullName} • {garage.owner.email}</p>
          </div>
        )}
      </Card>

      {/* Recent Reviews */}
      {garage.reviews.length > 0 && (
        <Card>
          <h3 className="font-bold mb-4">ביקורות אחרונות</h3>
          <div className="space-y-3">
            {garage.reviews.map(r => (
              <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{r.userName}</span>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-500" />
                    <span className="text-sm font-bold">{r.rating}</span>
                  </div>
                </div>
                {r.comment && <p className="text-xs text-gray-600">{r.comment}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('he-IL')}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Appointments */}
      {garage.appointments.length > 0 && (
        <Card>
          <h3 className="font-bold mb-4">תורים אחרונים</h3>
          <div className="space-y-2">
            {garage.appointments.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium">{a.user.fullName}</span>
                  <span className="text-gray-500 me-2">• {a.vehicle.licensePlate}</span>
                </div>
                <div className="text-xs text-gray-500">{new Date(a.date).toLocaleDateString('he-IL')}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
