'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import { Card, CardTitle } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  Hammer, Car, Clock, DollarSign, User, Building2,
  Star, Eye, ChevronLeft, Image as ImageIcon,
  CheckCircle2, XCircle, AlertCircle, Search,
  TrendingUp, BarChart3
} from 'lucide-react';

interface Quote {
  id: string;
  price: number;
  estimatedDays: number | null;
  notes: string | null;
  warranty: string | null;
  status: string;
  createdAt: string;
  garage: { id: string; name: string; city: string; rating: number; reviewCount: number; phone: string | null };
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
  user: { fullName: string; phone: string | null; email?: string; city: string | null };
  vehicle: { nickname: string; manufacturer: string; model: string; year: number; licensePlate: string; color: string | null };
  quotes: Quote[];
  _count: { quotes: number };
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: 'ממתין להצעות', color: 'bg-blue-100 text-blue-700' },
  quoted: { label: 'התקבלו הצעות', color: 'bg-amber-100 text-amber-700' },
  accepted: { label: 'הצעה נבחרה', color: 'bg-green-100 text-green-700' },
  completed: { label: 'הושלם', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-600' },
};

const DAMAGE_LABELS: Record<string, string> = {
  front: 'חזית', rear: 'אחורי', left: 'צד שמאל', right: 'צד ימין',
  hood: 'מכסה מנוע', trunk: 'תא מטען', bumper: 'פגוש', door: 'דלת',
  fender: 'כנף', roof: 'גג', other: 'אחר',
};

const URGENCY_LABELS: Record<string, string> = {
  urgent: '🔴 דחוף', normal: '🟡 רגיל', flexible: '🟢 גמיש',
};

export default function AdminBodyworkPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<BodyworkRequest[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [viewRequest, setViewRequest] = useState<BodyworkRequest | null>(null);

  useEffect(() => { fetchRequests(); }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/bodywork?status=${filter}` : '/api/bodywork';
      const res = await fetch(url);
      if (res.ok) setRequests(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  // Stats
  const totalRequests = requests.length;
  const openCount = requests.filter(r => r.status === 'open').length;
  const quotedCount = requests.filter(r => r.status === 'quoted').length;
  const acceptedCount = requests.filter(r => r.status === 'accepted' || r.status === 'completed').length;
  const totalQuotes = requests.reduce((sum, r) => sum + r._count.quotes, 0);

  // Filter by search
  const filtered = requests.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.user.fullName.toLowerCase().includes(s) ||
      r.vehicle.manufacturer.toLowerCase().includes(s) ||
      r.vehicle.model.toLowerCase().includes(s) ||
      r.vehicle.licensePlate.includes(s) ||
      r.description.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <PageHeader title="ניהול פחחות" backUrl="/admin" />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'סה"כ בקשות', value: totalRequests, icon: Hammer, color: 'text-[#1e3a5f]' },
            { label: 'ממתינות', value: openCount, icon: Clock, color: 'text-blue-600' },
            { label: 'עם הצעות', value: quotedCount, icon: DollarSign, color: 'text-amber-600' },
            { label: 'סגורות', value: acceptedCount, icon: CheckCircle2, color: 'text-green-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <stat.icon size={20} className={`mx-auto mb-1 ${stat.color}`} />
              <p className="text-2xl font-extrabold text-[#1e3a5f]">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: 'הכל' },
            { value: 'open', label: 'ממתינות' },
            { value: 'quoted', label: 'עם הצעות' },
            { value: 'accepted', label: 'נבחרו' },
            { value: 'completed', label: 'הושלם' },
            { value: 'cancelled', label: 'בוטלו' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                filter === f.value
                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפש לפי שם, רכב, מספר רישוי..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
            dir="rtl"
          />
        </div>

        {/* ── Requests List ── */}
        {loading ? (
          <PageSkeleton />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Hammer size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">אין בקשות פחחות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => {
              const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.open;
              const parsedImages = JSON.parse(req.images || '[]');
              return (
                <button
                  key={req.id}
                  onClick={() => setViewRequest(req)}
                  className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-right hover:shadow-md transition"
                >
                  <div className="flex gap-3">
                    {parsedImages[0] && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img src={parsedImages[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1e3a5f] text-sm">{req.user.fullName}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{req.vehicle.manufacturer} {req.vehicle.model}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-1">{req.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{URGENCY_LABELS[req.urgency]}</span>
                        <span>{req._count.quotes} הצעות</span>
                        <span>{new Date(req.createdAt).toLocaleDateString('he-IL')}</span>
                      </div>
                    </div>
                    <ChevronLeft size={16} className="text-gray-300 self-center flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      <Modal isOpen={!!viewRequest} onClose={() => setViewRequest(null)} title="פרטי בקשת פחחות — אדמין" size="lg">
        {viewRequest && (
          <div className="space-y-5">
            {/* Customer + Vehicle */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">לקוח</p>
                <p className="text-sm font-bold text-[#1e3a5f]">{viewRequest.user.fullName}</p>
                <p className="text-xs text-gray-500">{viewRequest.user.phone}</p>
                <p className="text-xs text-gray-400">{viewRequest.user.city}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">רכב</p>
                <p className="text-sm font-bold text-[#1e3a5f]">{viewRequest.vehicle.manufacturer} {viewRequest.vehicle.model} {viewRequest.vehicle.year}</p>
                <p className="text-xs text-gray-500">{viewRequest.vehicle.licensePlate} • {viewRequest.vehicle.color || '—'}</p>
              </div>
            </div>

            {/* Status + Urgency + Area */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_MAP[viewRequest.status]?.color || ''}`}>
                {STATUS_MAP[viewRequest.status]?.label || viewRequest.status}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                {URGENCY_LABELS[viewRequest.urgency]}
              </span>
              {viewRequest.damageArea && (
                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                  {DAMAGE_LABELS[viewRequest.damageArea]}
                </span>
              )}
              <span className="text-xs text-gray-400 mr-auto">{new Date(viewRequest.createdAt).toLocaleString('he-IL')}</span>
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
              <p className="text-sm font-bold text-gray-700 mb-1">תיאור הנזק</p>
              <p className="text-sm text-gray-600">{viewRequest.description}</p>
            </div>

            {/* Quotes */}
            <div>
              <h3 className="font-bold text-[#1e3a5f] mb-3 flex items-center gap-2">
                <DollarSign size={16} />
                הצעות מחיר ({viewRequest.quotes.length})
              </h3>

              {viewRequest.quotes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">עדיין לא התקבלו הצעות</p>
              ) : (
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
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-gray-400" />
                            <div>
                              <span className="text-sm font-bold text-[#1e3a5f]">{quote.garage.name}</span>
                              <span className="text-xs text-gray-400 mr-2">{quote.garage.city}</span>
                              <span className="text-xs text-gray-400 flex items-center gap-0.5 inline-flex">
                                <Star size={10} className="text-amber-400 fill-amber-400" />{quote.garage.rating}
                              </span>
                            </div>
                          </div>
                          <div className="text-left">
                            <span className="text-lg font-extrabold text-[#1e3a5f]">₪{quote.price.toLocaleString()}</span>
                            {quote.estimatedDays && <p className="text-xs text-gray-400">{quote.estimatedDays} ימים</p>}
                          </div>
                        </div>
                        {quote.notes && <p className="text-xs text-gray-500">{quote.notes}</p>}
                        {quote.warranty && <p className="text-xs text-teal-600">אחריות: {quote.warranty}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">{new Date(quote.createdAt).toLocaleString('he-IL')}</span>
                          {isAccepted && (
                            <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} /> נבחר
                            </span>
                          )}
                          {quote.status === 'rejected' && (
                            <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                              <XCircle size={12} /> נדחה
                            </span>
                          )}
                          {quote.status === 'pending' && !isAccepted && (
                            <span className="text-xs text-amber-500 font-bold">ממתין</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
