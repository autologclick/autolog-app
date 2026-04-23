'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import VoiceMicButton from '@/components/ui/VoiceMicButton';
import {
  Hammer, Car, Clock, DollarSign, Send, Eye,
  Star, MapPin, AlertCircle, CheckCircle2,
  Calendar, ChevronLeft, Loader2, Image as ImageIcon
} from 'lucide-react';

interface BodyworkRequest {
  id: string;
  description: string;
  images: string;
  damageArea: string | null;
  urgency: string;
  city: string | null;
  status: string;
  createdAt: string;
  user: { fullName: string; phone: string | null; city: string | null };
  vehicle: { nickname: string; manufacturer: string; model: string; year: number; licensePlate: string; color: string | null };
  quotes: Array<{
    id: string;
    price: number;
    estimatedDays: number | null;
    notes: string | null;
    warranty: string | null;
    status: string;
    garage: { id: string; name: string };
  }>;
  _count: { quotes: number };
}

const DAMAGE_LABELS: Record<string, string> = {
  front: 'חזית', rear: 'אחורי', left: 'צד שמאל', right: 'צד ימין',
  hood: 'מכסה מנוע', trunk: 'תא מטען', bumper: 'פגוש', door: 'דלת',
  fender: 'כנף', roof: 'גג', other: 'אחר',
};

const URGENCY_LABELS: Record<string, string> = {
  urgent: '🔴 דחוף', normal: '🟡 רגיל', flexible: '🟢 גמיש',
};

export default function GarageBodyworkPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<BodyworkRequest[]>([]);
  const [viewRequest, setViewRequest] = useState<BodyworkRequest | null>(null);

  // Quote form
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteRequestId, setQuoteRequestId] = useState('');
  const [price, setPrice] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [notes, setNotes] = useState('');
  const [warranty, setWarranty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notBodywork, setNotBodywork] = useState(false);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/bodywork');
      if (res.ok) {
        setRequests(await res.json());
      } else if (res.status === 403) {
        setNotBodywork(true);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const openQuoteForm = (requestId: string) => {
    setQuoteRequestId(requestId);
    setPrice('');
    setEstimatedDays('');
    setNotes('');
    setWarranty('');
    setShowQuoteForm(true);
  };

  const handleSubmitQuote = async () => {
    if (!price || parseFloat(price) <= 0) { toast.error('הזן מחיר תקין'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/bodywork/${quoteRequestId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: parseFloat(price),
          estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
          notes: notes.trim() || null,
          warranty: warranty.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'שגיאה');
      }

      toast.success('ההצעה נשלחה בהצלחה!');
      setShowQuoteForm(false);
      setViewRequest(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בשליחה');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if the garage already quoted on a request
  const hasQuoted = (req: BodyworkRequest) => {
    return req.quotes.some(q => q.status !== 'rejected');
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <PageHeader title="בקשות פחחות" backUrl="/garage" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {notBodywork ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
              <AlertCircle size={36} className="text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">המוסך לא מוגדר לפחחות</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-4">כדי לקבל בקשות פחחות מלקוחות, הוסף את שירות "פחחות" בהגדרות המוסך</p>
            <button
              onClick={() => window.location.href = '/garage/settings'}
              className="px-6 py-2.5 bg-[#1e3a5f] text-white rounded-xl font-bold text-sm hover:bg-[#2a5a8f] transition"
            >
              עבור להגדרות
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <Hammer size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-500 mb-2">אין בקשות פחחות כרגע</h3>
            <p className="text-sm text-gray-400">בקשות חדשות מלקוחות יופיעו כאן</p>
          </div>
        ) : (
          requests.map(req => {
            const parsedImages = JSON.parse(req.images || '[]');
            const quoted = hasQuoted(req);
            return (
              <button
                key={req.id}
                onClick={() => setViewRequest(req)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-right hover:shadow-md transition"
              >
                <div className="flex gap-3">
                  {parsedImages[0] && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={parsedImages[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#1e3a5f] text-sm">
                        {req.vehicle.manufacturer} {req.vehicle.model} {req.vehicle.year}
                      </span>
                      {quoted ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">נשלחה הצעה</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">חדש</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{req.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{URGENCY_LABELS[req.urgency] || req.urgency}</span>
                      {req.damageArea && <span>{DAMAGE_LABELS[req.damageArea]}</span>}
                      <span>{new Date(req.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>
                  </div>
                  <ChevronLeft size={18} className="text-gray-300 self-center flex-shrink-0" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ── View Request Detail ── */}
      <Modal isOpen={!!viewRequest} onClose={() => setViewRequest(null)} title="פרטי בקשת פחחות" size="lg">
        {viewRequest && (
          <div className="space-y-5">
            {/* Customer info */}
            <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {viewRequest.user.fullName[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1e3a5f]">{viewRequest.user.fullName}</p>
                <p className="text-xs text-gray-500">
                  {viewRequest.vehicle.manufacturer} {viewRequest.vehicle.model} {viewRequest.vehicle.year} • {viewRequest.vehicle.color || ''} • {viewRequest.vehicle.licensePlate}
                </p>
              </div>
              <span className="text-xs">{URGENCY_LABELS[viewRequest.urgency]}</span>
            </div>

            {/* Images */}
            <div className="grid grid-cols-3 gap-2">
              {JSON.parse(viewRequest.images || '[]').map((img: string, i: number) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 font-medium mb-1">תיאור הנזק:</p>
              <p className="text-sm text-gray-600">{viewRequest.description}</p>
              {viewRequest.damageArea && (
                <p className="text-xs text-gray-400 mt-2">אזור: {DAMAGE_LABELS[viewRequest.damageArea]}</p>
              )}
            </div>

            {/* Quote button or existing quote */}
            {hasQuoted(viewRequest) ? (
              <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-700">ההצעה שלך נשלחה</p>
                  <p className="text-xs text-green-600">
                    ₪{viewRequest.quotes.find(q => q.status !== 'rejected')?.price?.toLocaleString() || ''}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openQuoteForm(viewRequest.id)}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg transition"
              >
                <Send size={16} />
                שלח הצעת מחיר
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* ── Quote Form Modal ── */}
      <Modal isOpen={showQuoteForm} onClose={() => setShowQuoteForm(false)} title="שלח הצעת מחיר">
        <div className="space-y-4">
          <Input
            label="מחיר (₪) *"
            type="number"
            placeholder="למשל: 2500"
            value={price}
            onChange={e => setPrice(e.target.value)}
            icon={<DollarSign size={16} />}
          />
          <Input
            label="זמן משוער (ימים)"
            type="number"
            placeholder="למשל: 3"
            value={estimatedDays}
            onChange={e => setEstimatedDays(e.target.value)}
            icon={<Calendar size={16} />}
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">הערות</label>
            <div className="flex items-start gap-2">
              <VoiceMicButton value={notes} onResult={setNotes} className="mt-2" />
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="פירוט העבודה, חומרים, הערות..."
                rows={2}
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm resize-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                dir="rtl"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">אחריות</label>
            <div className="flex items-center gap-2">
              <VoiceMicButton value={warranty} onResult={setWarranty} />
              <input
                value={warranty}
                onChange={e => setWarranty(e.target.value)}
                placeholder="למשל: שנה על צבע"
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                dir="rtl"
              />
            </div>
          </div>
          <Button
            onClick={handleSubmitQuote}
            loading={submitting}
            disabled={!price || parseFloat(price) <= 0}
            className="w-full !bg-gradient-to-r from-orange-500 to-amber-500 !py-3 !rounded-xl"
            icon={<Send size={16} />}
          >
            שלח הצעה
          </Button>
        </div>
      </Modal>
    </div>
  );
}
