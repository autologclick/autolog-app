'use client';

import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Building2, Search, Plus, Star, MapPin, Eye, Edit, Loader2, Phone, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Garage {
  id: string;
  name: string;
  address?: string;
  city: string;
  phone?: string;
  email?: string;
  description?: string;
  rating: number;
  isActive: boolean;
  isPartner: boolean;
  services?: string;
  _count: {
    inspections: number;
    appointments: number;
  };
}

export default function AdminGaragesPage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGarage, setEditGarage] = useState<Garage | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '', city: '', address: '', phone: '', email: '', description: '', isPartner: false, isActive: true,
  });
  const router = useRouter();

  useEffect(() => { fetchGarages(); }, []);

  const fetchGarages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await fetch(`/api/admin/garages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setGarages(data.garages);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch garages:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchGarages(); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setFormData({ name: '', city: '', address: '', phone: '', email: '', description: '', isPartner: false, isActive: true });
    setError('');
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.city) {
      setError('שם ועיר הם שדות חובה');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/garages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה ביצירת מוסך'); setSaving(false); return; }
      setShowAddModal(false);
      resetForm();
      fetchGarages();
    } catch { setError('שגיאת חיבור'); }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!editGarage) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/garages/${editGarage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה בעדכון מוסך'); setSaving(false); return; }
      setShowEditModal(false);
      setEditGarage(null);
      resetForm();
      fetchGarages();
    } catch { setError('שגיאת חיבור'); }
    setSaving(false);
  };

  const openEditModal = (g: Garage) => {
    setEditGarage(g);
    setFormData({
      name: g.name, city: g.city, address: g.address || '', phone: g.phone || '',
      email: g.email || '', description: g.description || '', isPartner: g.isPartner, isActive: g.isActive,
    });
    setError('');
    setShowEditModal(true);
  };

  const GarageForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="שם המוסך *" placeholder="מוסך ישראלי" value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })} />
        <Input label="עיר *" placeholder="תל אביב" value={formData.city}
          onChange={e => setFormData({ ...formData, city: e.target.value })} />
      </div>
      <Input label="כתובת" placeholder="רחוב הרצל 10" value={formData.address}
        onChange={e => setFormData({ ...formData, address: e.target.value })} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="טלפון" placeholder="03-1234567" value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })} />
        <Input label="אימייל" placeholder="info@garage.co.il" value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" rows={3}
          placeholder="תיאור המוסך..." value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.isPartner}
            onChange={e => setFormData({ ...formData, isPartner: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <span className="text-sm">מוסך שותף</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.isActive}
            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <span className="text-sm">פעיל</span>
        </label>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button loading={saving} onClick={onSubmit} icon={<Plus size={16} />} className="w-full sm:w-auto order-2 sm:order-1">{submitLabel}</Button>
        <Button variant="ghost" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} className="w-full sm:w-auto order-1 sm:order-2">ביטול</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">ניהול מוסכים</h1>
            <p className="text-sm text-gray-500">צפייה ועריכת מוסכים במערכת</p>
          </div>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { resetForm(); setShowAddModal(true); }} className="w-full sm:w-auto ms-auto sm:ms-0">הוסף מוסך</Button>
      </div>

      <Input placeholder="חפש מוסך..." icon={<Search size={16} />} value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-teal-600" />
        </div>
      ) : garages.length === 0 ? (
        <div className="text-center py-12">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">לא נמצאו מוסכים</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {garages.map(g => (
            <Card key={g.id} hover>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base">{g.name}</h3>
                    {g.isPartner && <Badge variant="success" size="sm">שותף</Badge>}
                    <Badge variant={g.isActive ? 'success' : 'warning'} size="sm">{g.isActive ? 'פעיל' : 'מושהה'}</Badge>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 flex flex-wrap items-center gap-2 mt-1">
                    <span className="flex items-center gap-1"><MapPin size={12} />{g.city}</span>
                    {g.rating > 0 && <span className="flex items-center gap-1"><Star size={12} className="text-amber-500" />{g.rating.toFixed(1)}</span>}
                    <span>{g._count.inspections} בדיקות</span>
                  </div>
                </div>
                <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" icon={<Eye size={14} />}
                    onClick={() => router.push(`/admin/garages/${g.id}`)} />
                  <Button variant="ghost" size="sm" icon={<Edit size={14} />}
                    onClick={() => openEditModal(g)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Garage Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="הוספת מוסך חדש" size="lg">
        <GarageForm onSubmit={handleAdd} submitLabel="הוסף מוסך" />
      </Modal>

      {/* Edit Garage Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditGarage(null); resetForm(); }} title="עריכת מוסך" size="lg">
        <GarageForm onSubmit={handleEdit} submitLabel="שמור שינויים" />
      </Modal>
    </div>
  );
}
