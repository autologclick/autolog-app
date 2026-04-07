'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import {
  Star, Gift, Fuel, Shield, Wrench, Tag, Loader2, Copy, CheckCircle2,
  QrCode, Clock, History, ArrowLeft
} from 'lucide-react';

const categories = ['הכל', 'services', 'insurance', 'tires', 'fuel', 'accessories'];
const categoryLabels: Record<string, string> = {
  'הכל': 'הכל',
  services: 'מוסכים',
  insurance: 'ביטוח',
  tires: 'צמיגים',
  fuel: 'דלק',
  accessories: 'אביזרים',
};

const categoryIcons: Record<string, typeof Wrench> = {
  'הכל': Star,
  services: Wrench,
  insurance: Shield,
  tires: Wrench,
  fuel: Fuel,
  accessories: Gift,
};

interface Benefit {
  id: string;
  name: string;
  category: string;
  discount: string;
  description: string | null;
  partnerName: string | null;
  icon: string | null;
  expiryDate: string | null;
  isActive: boolean;
}

interface Redemption {
  id: string;
  code: string;
  qrData: string;
  benefitName: string;
  partnerName: string | null;
  discount: string | null;
  expiresAt: string | null;
  status: string;
}

interface UserRedemption {
  id: string;
  code: string;
  benefitName: string;
  partnerName: string | null;
  discount: string | null;
  status: string;
  expiresAt: string | null;
  usedAt: string | null;
  createdAt: string;
}

const getBenefitIcon = (category: string, icon: string | null) => {
  const iconType = icon || category;
  switch (iconType) {
    case 'services': case 'wrench': return <Wrench size={24} className="text-orange-500" />;
    case 'insurance': case 'shield': return <Shield size={24} className="text-teal-500" />;
    case 'tires': case 'wrench_alt': return <Wrench size={24} className="text-amber-600" />;
    case 'fuel': return <Fuel size={24} className="text-orange-500" />;
    case 'accessories': case 'gift': return <Gift size={24} className="text-pink-500" />;
    default: return <Star size={24} className="text-amber-500" />;
  }
};

function formatDate(date: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
}

function isExpiringSoon(date: string | null): boolean {
  if (!date) return false;
  const diff = new Date(date).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

function isExpired(date: string | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

function daysUntilExpiry(date: string | null): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export default function BenefitsPage() {
  const [selectedCategory, setSelectedCategory] = useState('הכל');
  const [activeTab, setActiveTab] = useState<'available' | 'redemptions'>('available');
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [userRedemptions, setUserRedemptions] = useState<UserRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [currentRedemption, setCurrentRedemption] = useState<Redemption | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (activeTab === 'available') {
      loadBenefits();
    } else {
      loadUserRedemptions();
    }
  }, [selectedCategory, activeTab]);

  const loadBenefits = async () => {
    try {
      setLoading(true);
      setError('');
      let url = '/api/benefits?limit=50';
      if (selectedCategory !== 'הכל') {
        url += `&category=${selectedCategory}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('שגיאה');
      const data = await res.json();
      setBenefits(data.benefits || []);
    } catch {
      setError('לא ניתן לטעון הטבות כרגע');
    } finally {
      setLoading(false);
    }
  };

  const loadUserRedemptions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/redemptions');
      if (!res.ok) throw new Error('שגיאה');
      const data = await res.json();
      setUserRedemptions(data.redemptions || []);
    } catch {
      setError('לא ניתן לטעון את ההטבות שלך כרגע');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (benefit: Benefit) => {
    try {
      setRedeemingId(benefit.id);
      const res = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ benefitId: benefit.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'שגיאה ביצירת קוד הטבה');
        return;
      }
      const redemption = await res.json();
      setCurrentRedemption(redemption);
      setShowRedemptionModal(true);
    } catch {
      alert('שגיאה ביצירת קוד הטבה');
    } finally {
      setRedeemingId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const getStatusBadge = (status: string, expiresAt: string | null) => {
    if (isExpired(expiresAt)) return <Badge variant="danger" size="sm">פג תוקף</Badge>;
    if (status === 'used') return <Badge variant="success" size="sm">מומש</Badge>;
    if (status === 'active') {
      if (isExpiringSoon(expiresAt)) return <Badge variant="warning" size="sm">עומד לפוג</Badge>;
      return <Badge variant="success" size="sm">פעיל</Badge>;
    }
    return <Badge size="sm">{status}</Badge>;
  };

  const activeRedemptions = userRedemptions.filter(r => r.status === 'active' && !isExpired(r.expiresAt));

  return (
    <div className="min-h-screen bg-[#fef7ed] pb-24" dir="rtl">
      <PageHeader
        title="🎁 הטבות מועדון"
        variant="green"
        subtitle="חבר פרימיום"
        backUrl="/user/profile"
      />

      <div className="space-y-6 pt-6 px-4" dir="rtl">
        {/* Tabs as chips */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'available'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
            }`}
          >
            זמינות
          </button>
          <button
            onClick={() => setActiveTab('redemptions')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'redemptions'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
            }`}
          >
            שלי
            {activeRedemptions.length > 0 && (
              <span className="w-5 h-5 bg-white text-teal-600 text-[10px] rounded-full flex items-center justify-center font-bold">
                {activeRedemptions.length}
              </span>
            )}
          </button>
        </div>

        {/* Category Filter */}
        {activeTab === 'available' && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => {
              const Icon = categoryIcons[cat] || Star;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <Icon size={12} />
                  {categoryLabels[cat] || cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <PageSkeleton />
        ) : error ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button variant="outline" onClick={activeTab === 'available' ? loadBenefits : loadUserRedemptions}>
              נסה שוב
            </Button>
          </div>
        ) : activeTab === 'available' && benefits.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gift size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">אין הטבות זמינות</h3>
            <p className="text-gray-500 text-sm">הטבות חדשות יתווספו בקרוב!</p>
          </div>
        ) : activeTab === 'redemptions' && userRedemptions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">אין לך הטבות מומשות</h3>
            <p className="text-gray-500 text-sm mb-4">בחר הטבה מהרשימה כדי לקבל קוד מימוש</p>
            <Button variant="outline" onClick={() => setActiveTab('available')} icon={<ArrowLeft size={14} />}>
              להטבות הזמינות
            </Button>
          </div>
        ) : activeTab === 'available' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map(b => {
              const days = daysUntilExpiry(b.expiryDate);
              const discountColor = b.discount.includes('%')
                ? 'bg-teal-100 text-teal-700'
                : b.discount.includes('₪')
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700';

              return (
                <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      {getBenefitIcon(b.category, b.icon)}
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${discountColor}`}>
                      {b.discount}
                    </span>
                  </div>

                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">{b.name}</h3>
                    {b.partnerName && (
                      <p className="text-xs text-gray-500 mb-1">שותף: {b.partnerName}</p>
                    )}
                    {b.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{b.description}</p>
                    )}
                  </div>

                  {b.expiryDate && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <Clock size={12} />
                      {formatDate(b.expiryDate)}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    size="sm"
                    icon={<Tag size={14} />}
                    onClick={() => handleRedeem(b)}
                    loading={redeemingId === b.id}
                    disabled={redeemingId !== null}
                  >
                    מימוש ההטבה
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {userRedemptions.map(r => {
              const days = daysUntilExpiry(r.expiresAt);
              return (
                <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      r.status === 'used' ? 'bg-gray-100' :
                      isExpired(r.expiresAt) ? 'bg-red-50' : 'bg-teal-50'
                    }`}>
                      <QrCode size={22} className={
                        r.status === 'used' ? 'text-gray-400' :
                        isExpired(r.expiresAt) ? 'text-red-400' : 'text-teal-600'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-sm text-gray-900">{r.benefitName}</h3>
                        {getStatusBadge(r.status, r.expiresAt)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{r.code}</span>
                        {r.partnerName && <span>{r.partnerName}</span>}
                        {days !== null && days > 0 && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Clock size={10} />
                            עוד {days} ימים
                          </span>
                        )}
                      </div>
                    </div>
                    {r.discount && (
                      <div className="text-left flex-shrink-0">
                        <span className="text-lg font-bold text-teal-600">{r.discount}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Redemption Modal */}
        <Modal
          isOpen={showRedemptionModal}
          onClose={() => { setShowRedemptionModal(false); setCurrentRedemption(null); setCopiedCode(false); }}
          size="lg"
        >
          {currentRedemption && (
            <div className="space-y-5">
              {/* Success header */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">ההטבה מוכנה!</h3>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-gray-50 rounded-2xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(currentRedemption.code)}&size=200x200`}
                  alt="QR Code"
                  className="w-44 h-44"
                />
              </div>

              {/* Details */}
              <div className="text-center">
                <h4 className="text-lg font-bold text-gray-900 mb-1">{currentRedemption.benefitName}</h4>
                {currentRedemption.partnerName && (
                  <p className="text-sm text-gray-500">שותף: {currentRedemption.partnerName}</p>
                )}
              </div>

              {/* Code */}
              <div className="bg-teal-50 rounded-2xl p-4 border border-teal-200">
                <p className="text-xs text-gray-500 mb-2 text-center">קוד הטבה:</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-2xl font-bold text-teal-600 flex-1 text-center tracking-wider">{currentRedemption.code}</code>
                  <button
                    onClick={() => copyCode(currentRedemption.code)}
                    className={`p-2 rounded-lg transition ${copiedCode ? 'bg-green-100 text-green-600' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                  >
                    {copiedCode ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              {/* Discount + Expiry */}
              <div className="grid grid-cols-2 gap-3">
                {currentRedemption.discount && (
                  <div className="bg-amber-50 rounded-2xl p-3 text-center border border-amber-200">
                    <p className="text-xs text-gray-500 mb-1">הנחה</p>
                    <p className="text-lg font-bold text-amber-600">{currentRedemption.discount}</p>
                  </div>
                )}
                {currentRedemption.expiresAt && (
                  <div className="bg-orange-50 rounded-2xl p-3 text-center border border-orange-200">
                    <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1"><Clock size={10} /> תוקף</p>
                    <p className="text-sm font-bold text-orange-600">{formatDate(currentRedemption.expiresAt)}</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-center">
                <p className="text-sm text-blue-800 font-medium">הצג קוד זה או תמונת QR לבעל העסק לקבלת ההטבה</p>
              </div>

              <Button
                className="w-full"
                onClick={() => { setShowRedemptionModal(false); setCurrentRedemption(null); setCopiedCode(false); }}
              >
                סגור
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
