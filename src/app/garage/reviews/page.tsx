'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Star, Loader2, TrendingUp, TrendingDown, MessageSquare,
  ThumbsUp, Filter, ChevronDown, Award, Brain, Target, AlertCircle
} from 'lucide-react';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

function StarsDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
      ))}
    </div>
  );
}

function TimeAgo({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return <span>היום</span>;
  if (days === 1) return <span>אתמול</span>;
  if (days < 7) return <span>לפני {days} ימים</span>;
  if (days < 30) return <span>לפני {Math.floor(days / 7)} שבועות</span>;
  return <span>{new Date(date).toLocaleDateString('he-IL')}</span>;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'highest' | 'lowest'>('newest');

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/garage/reviews?limit=100');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews
    .filter(r => filterRating === null || r.rating === filterRating)
    .sort((a, b) => {
      switch (sortOrder) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'highest': return b.rating - a.rating;
        case 'lowest': return a.rating - b.rating;
      }
    });

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  // Satisfaction rate
  const satisfactionRate = reviews.length > 0
    ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6 pt-12 lg:pt-0 animate-pulse" dir="rtl">
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-lg" /><div className="space-y-2"><div className="h-6 bg-gray-200 rounded w-40" /><div className="h-4 bg-gray-100 rounded w-20" /></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-amber-50 rounded-xl p-6 h-36 col-span-1 sm:col-span-2" />
          <div className="space-y-3"><div className="bg-white rounded-2xl p-4 h-20" /><div className="bg-white rounded-2xl p-4 h-20" /></div>
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-1/4" /><div className="h-3 bg-gray-50 rounded w-3/4" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#fef7ed] rounded-lg border-2 border-[#1e3a5f] flex items-center justify-center shadow-sm">
          <Star size={20} className="text-[#1e3a5f] fill-[#1e3a5f]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">ביקורות לקוחות</h1>
          <p className="text-sm text-gray-500">{reviews.length} ביקורות</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Main Rating Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 col-span-1 sm:col-span-2">
          <div className="flex items-center gap-6">
            <div className="text-center flex-shrink-0">
              <div className="text-5xl font-black text-amber-600 mb-1">{averageRating.toFixed(1)}</div>
              <StarsDisplay rating={Math.round(averageRating)} size={18} />
              <p className="text-xs text-gray-500 mt-2">{reviews.length} ביקורות</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingDistribution.map(d => (
                <button
                  key={d.star}
                  onClick={() => setFilterRating(filterRating === d.star ? null : d.star)}
                  className={`w-full flex items-center gap-2 text-sm group hover:opacity-80 transition ${
                    filterRating === d.star ? 'opacity-100' : filterRating !== null ? 'opacity-40' : ''
                  }`}
                >
                  <span className="w-3 text-xs text-gray-500 flex-shrink-0">{d.star}</span>
                  <Star size={12} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 bg-white rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-l from-amber-500 to-amber-400 h-full rounded-full transition-all"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-xs text-gray-500 text-left flex-shrink-0">{d.count}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats sidebar */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp size={16} className="text-green-500" />
              <span className="text-xs text-gray-500">שביעות רצון</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{satisfactionRate}%</p>
            <p className="text-[10px] text-gray-400">דירוג 4-5 כוכבים</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={16} className="text-blue-500" />
              <span className="text-xs text-gray-500">עם תגובה</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {reviews.filter(r => r.comment).length}
            </p>
            <p className="text-[10px] text-gray-400">מתוך {reviews.length}</p>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {reviews.length > 0 && (
        <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">תובנות AI לביקורות</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-gray-700">מגמת דירוג</span>
              </div>
              <p className="text-xs text-gray-600">
                {averageRating >= 4.5
                  ? `⭐ דירוג מצוין (${averageRating.toFixed(1)})! הלקוחות מרוצים מאוד — שמרו על הרמה.`
                  : averageRating >= 3.5
                  ? `📊 דירוג טוב (${averageRating.toFixed(1)}). בדקו ביקורות 1-3 כוכבים לזיהוי נקודות חולשה.`
                  : averageRating > 0
                  ? `⚠️ דירוג ${averageRating.toFixed(1)} — יש מקום משמעותי לשיפור. התמקדו בשירות לקוחות.`
                  : '📋 אין מספיק ביקורות לניתוח.'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-green-600" />
                <span className="text-xs font-bold text-gray-700">שביעות רצון</span>
              </div>
              <p className="text-xs text-gray-600">
                {satisfactionRate >= 90
                  ? `🌟 ${satisfactionRate}% שביעות רצון — תוצאה יוצאת דופן! השתמשו בזה לשיווק.`
                  : satisfactionRate >= 70
                  ? `👍 ${satisfactionRate}% שביעות רצון. יעד מומלץ: 90%+.`
                  : satisfactionRate > 0
                  ? `📈 ${satisfactionRate}% שביעות רצון — יש מקום לשיפור. שאלו לקוחות מה ניתן לשפר.`
                  : '📋 אין מספיק נתונים.'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-gray-700">תגובות לקוחות</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const withComments = reviews.filter(r => r.comment).length;
                  const pct = Math.round((withComments / reviews.length) * 100);
                  return pct >= 70
                    ? `💬 ${pct}% מהביקורות כוללות תגובה — מידע עשיר לשיפור מתמיד.`
                    : pct >= 30
                    ? `💬 ${pct}% השאירו תגובה. עודדו לקוחות לכתוב ביקורת מפורטת.`
                    : `📝 רק ${pct}% השאירו תגובה. הוסיפו בקשה לביקורת אחרי כל שירות.`;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {filterRating !== null && (
            <button
              onClick={() => setFilterRating(null)}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              נקה סינון ({filterRating} כוכבים)
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="text-sm border-0 bg-transparent text-gray-600 focus:ring-0 cursor-pointer"
          >
            <option value="newest">חדש לישן</option>
            <option value="highest">דירוג גבוה</option>
            <option value="lowest">דירוג נמוך</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200">
            <MessageSquare size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">
            {reviews.length === 0 ? 'אין ביקורות עדיין' : 'אין תוצאות לסינון'}
          </h3>
          <p className="text-gray-400 text-sm">
            {reviews.length === 0 ? 'ביקורות לקוחות יופיעו כאן' : 'נסה לשנות את הסינון'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  r.rating >= 4 ? 'bg-green-100 text-green-600' :
                  r.rating >= 3 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                }`}>
                  {r.userName.charAt(0)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-bold text-sm text-gray-800">{r.userName}</span>
                    <StarsDisplay rating={r.rating} size={14} />
                    <span className="text-xs text-gray-400 mr-auto">
                      <TimeAgo date={r.createdAt} />
                    </span>
                  </div>
                  {r.comment ? (
                    <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">דירוג ללא תגובה</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Achievement Banner */}
      {reviews.length > 0 && averageRating >= 4.0 && (
        <div className="bg-gradient-to-l from-amber-400 to-yellow-400 rounded-2xl p-4 flex items-center gap-3 text-white shadow-lg">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Award size={24} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">מוסך מצטיין!</p>
            <p className="text-amber-100 text-xs">דירוג ממוצע של {averageRating.toFixed(1)} - המשיכו בעבודה מצוינת</p>
          </div>
        </div>
      )}
    </div>
  );
}
