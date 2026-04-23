'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import VoiceMicButton from '@/components/ui/VoiceMicButton';
import {
  Camera, Upload, X, Car, Loader2, CheckCircle2,
  Clock, MapPin, ChevronLeft, Image as ImageIcon,
  Star, Phone, Send, AlertCircle, Hammer, Plus,
  Eye, DollarSign, Calendar, Building2, Check
} from 'lucide-react';

interface Vehicle {
  id: string;
  nickname: string;
  manufacturer: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
}

interface Quote {
  id: string;
  price: number;
  estimatedDays: number | null;
  notes: string | null;
  warranty: string | null;
  status: string;
  createdAt: string;
  garage: {
    id: string;
    name: string;
    city: string;
    rating: number;
    reviewCount: number;
    phone: string | null;
    imageUrl: string | null;
  };
}

interface BodyworkRequest {
  id: string;
  description: string;
  images: string;
  damageArea: string | null;
  urgency: string;
  city: string | null;
  status: string;
  acceptedQuoteId: string | null;
  createdAt: string;
  vehicle: Vehicle;
  quotes: Quote[];
  _count: { quotes: number };
}

const DAMAGE_AREAS = [
  { value: 'front', label: 'חזית' },
  { value: 'rear', label: 'אחורי' },
  { value: 'left', label: 'צד שמאל' },
  { value: 'right', label: 'צד ימין' },
  { value: 'hood', label: 'מכסה מנוע' },
  { value: 'trunk', label: 'תא מטען' },
  { value: 'bumper', label: 'פגוש' },
  { value: 'door', label: 'דלת' },
  { value: 'fender', label: 'כנף' },
  { value: 'roof', label: 'גג' },
  { value: 'other', label: 'אחר' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: 'ממתין להצעות', color: 'bg-blue-100 text-blue-700' },
  quoted: { label: 'התקבלו הצעות', color: 'bg-amber-100 text-amber-700' },
  accepted: { label: 'הצעה נבחרה', color: 'bg-green-100 text-green-700' },
  completed: { label: 'הושלם', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-600' },
};

export default function BodyworkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<BodyworkRequest[]>([]);

  // New request form
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [description, setDescription] = useState('');
  const [damageArea, setDamageArea] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // View request detail
  const [viewRequest, setViewRequest] = useState<BodyworkRequest | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [vehiclesRes, requestsRes] = await Promise.all([
        fetch('/api/vehicles').catch(() => null),
        fetch('/api/bodywork').catch(() => null),
      ]);
      if (vehiclesRes?.ok) {
        const data = await vehiclesRes.json().catch(() => ({}));
        setVehicles(Array.isArray(data) ? data : Array.isArray(data?.vehicles) ? data.vehicles : []);
      }
      if (requestsRes?.ok) {
        const data = await requestsRes.json().catch(() => []);
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (images.length >= 6) { toast.error('מקסימום 6 תמונות'); break; }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!selectedVehicle) { toast.error('בחר רכב'); return; }
    if (!description.trim()) { toast.error('תאר את הנזק'); return; }
    if (images.length === 0) { toast.error('העלה לפחות תמונה אחת'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bodywork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicle,
          description: description.trim(),
          images,
          damageArea: damageArea || null,
          urgency,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'שגיאה');
      }

      toast.success('הבקשה נשלחה! המוסכים יחזרו אליך עם הצעות');
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בשליחה');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptQuote = async (requestId: string, quoteId: string) => {
    setAccepting(true);
    try {
      const res = await fetch(`/api/bodywork/${requestId}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      });
      if (!res.ok) throw new Error('שגיאה');
      toast.success('ההצעה אושרה! המוסך יצור איתך קשר');
      setViewRequest(null);
      fetchData();
    } catch {
      toast.error('שגיאה באישור ההצעה');
    } finally {
      setAccepting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedVehicle('');
    setDescription('');
    setDamageArea('');
    setUrgency('normal');
    setImages([]);
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="פחחות — הצעות מחיר" backUrl="/user/service" />

        {/* ── New Request Button ── */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl py-4 font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <Camera size={22} />
          צלם נזק וקבל הצעות מחיר
        </button>

        {/* ── Existing Requests ── */}
        {requests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#1e3a5f]">הבקשות שלי</h2>
            {requests.map(req => {
              const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.open;
              const parsedImages = JSON.parse(req.images || '[]');
              return (
                <button
                  key={req.id}
                  onClick={() => setViewRequest(req)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-right hover:shadow-md transition"
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    {parsedImages[0] && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        <img src={parsedImages[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#1e3a5f] text-sm">{req.vehicle.nickname || `${req.vehicle.manufacturer} ${req.vehicle.model}`}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{req.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          {req._count.quotes} הצעות
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(req.createdAt).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                    </div>
                    <ChevronLeft size={18} className="text-gray-300 self-center flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Empty State ── */}
        {requests.length === 0 && !showForm && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
              <Hammer size={36} className="text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">עדיין אין בקשות פחחות</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">צלם את הנזק, תאר מה קרה, ומוסכי הפחחות שלנו ישלחו לך הצעות מחיר</p>
          </div>
        )}

      {/* ── New Request Modal ── */}
      <Modal isOpen={showForm} onClose={resetForm} title="בקשת הצעת מחיר — פחחות" size="lg">
        <div className="space-y-5">
          {/* Vehicle Select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">בחר רכב *</label>
            <select
              value={selectedVehicle}
              onChange={e => setSelectedVehicle(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">בחר רכב...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.nickname || `${v.manufacturer} ${v.model}`} — {v.licensePlate}
                </option>
              ))}
            </select>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">תמונות הנזק * (עד 6)</label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-orange-400 hover:bg-orange-50 transition"
                >
                  <Camera size={22} className="text-gray-400" />
                  <span className="text-[11px] text-gray-400">צלם / העלה</span>
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">תיאור הנזק *</label>
            <div className="flex items-start gap-2">
              <VoiceMicButton value={description} onResult={setDescription} className="mt-2" />
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="מה קרה? איפה הנזק? מה צריך לתקן?..."
                rows={3}
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm resize-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                dir="rtl"
              />
            </div>
          </div>

          {/* Damage Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">אזור הנזק</label>
            <div className="flex flex-wrap gap-2">
              {DAMAGE_AREAS.map(area => (
                <button
                  key={area.value}
                  onClick={() => setDamageArea(damageArea === area.value ? '' : area.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    damageArea === area.value
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">דחיפות</label>
            <div className="flex gap-2">
              {[
                { value: 'urgent', label: 'דחוף', icon: '🔴' },
                { value: 'normal', label: 'רגיל', icon: '🟡' },
                { value: 'flexible', label: 'גמיש', icon: '🟢' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setUrgency(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                    urgency === opt.value
                      ? 'bg-orange-50 border-orange-400 text-orange-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-orange-200'
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!selectedVehicle || !description.trim() || images.length === 0}
            className="w-full !bg-gradient-to-r from-orange-500 to-amber-500 !py-3.5 !text-base !font-bold !rounded-xl"
            icon={<Send size={18} />}
          >
            שלח לקבלת הצעות מחיר
          </Button>
        </div>
      </Modal>

      {/* ── View Request + Quotes Modal ── */}
      <Modal isOpen={!!viewRequest} onClose={() => setViewRequest(null)} title="פרטי הבקשה" size="lg">
        {viewRequest && (
          <div className="space-y-5">
            {/* Images */}
            <div className="grid grid-cols-3 gap-2">
              {JSON.parse(viewRequest.images || '[]').map((img: string, i: number) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* Details */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#1e3a5f]">
                  {viewRequest.vehicle.nickname || `${viewRequest.vehicle.manufacturer} ${viewRequest.vehicle.model}`}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_MAP[viewRequest.status]?.color || ''}`}>
                  {STATUS_MAP[viewRequest.status]?.label || viewRequest.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{viewRequest.description}</p>
              {viewRequest.damageArea && (
                <p className="text-xs text-gray-400">אזור: {DAMAGE_AREAS.find(a => a.value === viewRequest.damageArea)?.label}</p>
              )}
            </div>

            {/* Quotes */}
            <div>
              <h3 className="font-bold text-[#1e3a5f] mb-3">
                {viewRequest.quotes.length > 0
                  ? `הצעות מחיר (${viewRequest.quotes.length})`
                  : 'ממתין להצעות מחיר...'
                }
              </h3>

              {viewRequest.quotes.length === 0 && (
                <div className="text-center py-8 bg-blue-50 rounded-xl">
                  <Clock size={32} className="mx-auto text-blue-300 mb-2" />
                  <p className="text-sm text-blue-600 font-medium">הבקשה נשלחה למוסכים באזור</p>
                  <p className="text-xs text-blue-400 mt-1">ההצעות בדרך כלל מגיעות תוך כמה שעות</p>
                </div>
              )}

              <div className="space-y-3">
                {viewRequest.quotes.map(quote => {
                  const isAccepted = viewRequest.acceptedQuoteId === quote.id;
                  return (
                    <div
                      key={quote.id}
                      className={`rounded-xl p-4 border ${
                        isAccepted
                          ? 'bg-green-50 border-green-200'
                          : quote.status === 'rejected'
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building2 size={18} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1e3a5f]">{quote.garage.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>{quote.garage.city}</span>
                              <span className="flex items-center gap-0.5">
                                <Star size={10} className="text-amber-400 fill-amber-400" />
                                {quote.garage.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-extrabold text-[#1e3a5f]">₪{quote.price.toLocaleString()}</p>
                          {quote.estimatedDays && (
                            <p className="text-xs text-gray-400">{quote.estimatedDays} ימים</p>
                          )}
                        </div>
                      </div>

                      {quote.notes && <p className="text-xs text-gray-500 mb-2">{quote.notes}</p>}
                      {quote.warranty && <p className="text-xs text-teal-600 mb-2">אחריות: {quote.warranty}</p>}

                      {/* Accept button */}
                      {viewRequest.status !== 'accepted' && viewRequest.status !== 'completed' && quote.status === 'pending' && (
                        <button
                          onClick={() => handleAcceptQuote(viewRequest.id, quote.id)}
                          disabled={accepting}
                          className="w-full mt-2 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {accepting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          בחר הצעה זו
                        </button>
                      )}
                      {isAccepted && (
                        <div className="flex items-center gap-2 mt-2 text-green-600 text-sm font-bold">
                          <CheckCircle2 size={16} />
                          ההצעה שנבחרה
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
