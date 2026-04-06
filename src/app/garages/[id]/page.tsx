'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MapPin, Star, Phone, Clock, Building2, Loader2,
  ChevronLeft, Calendar, Share2, Coffee, Car, Wifi,
  Armchair, Monitor, Heart, MessageSquare, CheckCircle2,
  Wrench, ClipboardCheck, Settings2
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface GarageReview {
  id: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface GarageProfile {
  id: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  rating: number;
  reviewCount: number;
  services: string[];
  amenities: string[];
  isPartner: boolean;
  description?: string;
  reviews: GarageReview[];
  _count?: {
    inspections: number;
    appointments: number;
    reviews: number;
  };
}

const amenityConfig: Record<string, { label: string; Icon: typeof Coffee }> = {
  coffee: { label: 'קפה', Icon: Coffee },
  shuttle: { label: 'הסעות', Icon: Car },
  wifi: { label: 'WiFi', Icon: Wifi },
  waiting_room: { label: 'חדר המתנה', Icon: Armchair },
  tv: { label: 'טלויזיה', Icon: Monitor },
  children_area: { label: 'פינת ילדים', Icon: Heart },
};

const serviceConfig: Record<string, { label: string; Icon: typeof Wrench }> = {
  inspection: { label: 'בדיקה', Icon: ClipboardCheck },
  maintenance: { label: 'טיפול', Icon: Wrench },
  repair: { label: 'תיקון', Icon: Settings2 },
  test_prep: { label: 'הכנה לטסט', Icon: Car },
  'בדיקה': { label: 'בדיקה', Icon: ClipboardCheck },
  'טיפול': { label: 'טיפול', Icon: Wrench },
  'תיקון': { label: 'תיקון', Icon: Settings2 },
  'הכנה לטסט': { label: 'הכנה לטסט', Icon: Car },
  'פנסים ומראות': { label: 'פנסים ומראות', Icon: Wrench },
  'חלקי חילוף': { label: 'חלקי חילוף', Icon: Settings2 },
};

export default function PublicGaragePage() {
  const { id } = useParams();
  const router = useRouter();
  const [garage, setGarage] = useState<GarageProfile | null>(null);
  const [allReviews, setAllReviews] = useState<GarageReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/garages?limit=50`).then(r => r.json()).catch(() => ({ garages: [] })),
      fetch(`/api/garages/${id}/reviews`).then(r => r.json()).catch(() => ({ reviews: [] })),
    ]).then(([gData, rData]) => {
      const found = gData.garages?.find((g: any) => g.id === id);
      if (found) {
        setGarage({
          ...found,
          services: typeof found.services === 'string' ? (() => { try { return JSON.parse(found.services); } catch { return []; } })() : found.services || [],
          amenities: typeof found.amenities === 'string' ? (() => { try { return JSON.parse(found.amenities); } catch { return []; } })() : found.amenities || [],
          reviews: rData.reviews?.slice(0, 3) || [],
        });
        setAllReviews(rData.reviews || []);
      }
      setLoading(false);
    });
  }, [id]);

  const handleShare = () => {
    const url = `https://autolog.click/garages/${id}`;
    const text = `מוסך ${garage?.name} מומלץ! 🚗\n${garage?.address ? `כתובת: ${garage.address}, ${garage.city}` : garage?.city}\nדירוג: ${garage?.rating}/5 ⭐\n`;
    if (navigator.share) {
      navigator.share({ title: garage?.name, text, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + url)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (!garage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6" dir="rtl">
        <Building2 size={64} className="text-gray-300" />
        <h1 className="text-xl font-bold text-gray-700">המוסך לא נמצא</h1>
        <Button onClick={() => router.push('/user/book-garage')}>חזור לרשימת מוסכים</Button>
      </div>
    );
  }

  const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
      ))}
    </div>
  );

  const displayReviews = showAllReviews ? allReviews : allReviews.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Hero Header */}
      <div className="bg-gradient-to-l from-[#1a3a5c] to-[#0d7377] text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-white/70 hover:text-white mb-4 text-sm">
            <ChevronLeft size={16} /> חזרה
          </button>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Building2 size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{garage.name}</h1>
                {garage.isPartner && (
                  <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">שותף AutoLog</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-white/80 text-sm mb-3">
                <MapPin size={14} />
                <span>{garage.address ? `${garage.address}, ${garage.city}` : garage.city}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={garage.rating} size={18} />
                  <span className="font-bold text-lg">{garage.rating > 0 ? garage.rating.toFixed(1) : '—'}</span>
                </div>
                <span className="text-white/60 text-sm">({garage.reviewCount} ביקורות)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 -mt-4 pb-8 space-y-4">
        {/* Action Buttons */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-2">
          <Button onClick={() => router.push('/user/book-garage')} className="flex-1" icon={<Calendar size={16} />}>
            קבע תור
          </Button>
          {garage.phone && (
            <a href={`tel:${garage.phone}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition font-medium text-sm">
              <Phone size={16} />
              התקשר
            </a>
          )}
          <button onClick={handleShare}
            className="flex items-center justify-center w-11 h-11 rounded-xl border-2 border-gray-200 text-gray-500 hover:bg-gray-50 transition">
            <Share2 size={16} />
          </button>
        </div>

        {/* Stats */}
        {garage._count && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-teal-600">{garage._count.inspections}</div>
              <div className="text-xs text-gray-500 mt-1">בדיקות</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-teal-600">{garage._count.appointments}</div>
              <div className="text-xs text-gray-500 mt-1">תורים</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-teal-600">{garage._count.reviews}</div>
              <div className="text-xs text-gray-500 mt-1">ביקורות</div>
            </div>
          </div>
        )}

        {/* Services */}
        {garage.services.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-3">שירותים</h2>
            <div className="grid grid-cols-2 gap-2">
              {garage.services.map(s => {
                const config = serviceConfig[s];
                const Icon = config?.Icon || Wrench;
                return (
                  <div key={s} className="flex items-center gap-2 bg-teal-50 rounded-xl px-3 py-2.5">
                    <Icon size={16} className="text-teal-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-teal-800">{config?.label || s}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Amenities */}
        {garage.amenities.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-3">מתקנים</h2>
            <div className="flex gap-3 flex-wrap">
              {garage.amenities.map(a => {
                const config = amenityConfig[a];
                if (!config) return null;
                const { Icon } = config;
                return (
                  <div key={a} className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
                    <Icon size={16} className="text-amber-600" />
                    <span className="text-sm text-amber-800">{config.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-3">פרטי התקשרות</h2>
          <div className="space-y-3">
            {garage.address && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MapPin size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">כתובת</p>
                  <p className="font-medium text-gray-800">{garage.address}, {garage.city}</p>
                </div>
              </div>
            )}
            {garage.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Phone size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">טלפון</p>
                  <a href={`tel:${garage.phone}`} className="font-medium text-teal-600 hover:underline">{garage.phone}</a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">ביקורות ({allReviews.length})</h2>
            <div className="flex items-center gap-2">
              <StarRating rating={garage.rating} size={16} />
              <span className="font-bold text-gray-700">{garage.rating > 0 ? garage.rating.toFixed(1) : '—'}</span>
            </div>
          </div>

          {allReviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">אין ביקורות עדיין</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayReviews.map(r => (
                <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-teal-700">{r.userName.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-sm text-gray-800">{r.userName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={r.rating} size={12} />
                      <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
              {allReviews.length > 5 && !showAllReviews && (
                <button onClick={() => setShowAllReviews(true)}
                  className="w-full py-3 text-center text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-xl transition">
                  הצג את כל {allReviews.length} הביקורות
                </button>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-l from-teal-600 to-teal-700 rounded-2xl p-6 text-center text-white">
          <h3 className="text-lg font-bold mb-2">רוצה לקבוע תור?</h3>
          <p className="text-teal-100 text-sm mb-4">הזמן תור עכשיו ונחזור אליך תוך דקות</p>
          <Button onClick={() => router.push('/user/book-garage')}
            className="bg-white !text-teal-700 hover:bg-teal-50 font-bold">
            <Calendar size={16} className="ml-2" />
            קבע תור עכשיו
          </Button>
        </div>
      </div>
    </div>
  );
}
