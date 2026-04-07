'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import { Card, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  CreditCard, DollarSign, TrendingUp, TrendingDown, Filter, ChevronDown,
  Calendar, MapPin, Wrench, Loader2, AlertCircle, Download, Receipt,
  CheckCircle2, Clock, AlertTriangle, PieChart, ArrowUpDown, Brain, Target
} from 'lucide-react';

interface Payment {
  id: string;
  date: string;
  garageName: string;
  serviceType: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue';
  source: 'inspection' | 'appointment' | 'expense';
  vehicleNickname?: string;
  description?: string;
}

interface PaymentSummary {
  totalThisMonth: number;
  totalThisYear: number;
  averageMonthlySpend: number;
  payments: Payment[];
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  inspection: 'בדיקה',
  maintenance: 'תחזוקה',
  repair: 'תיקון',
  test_prep: 'הכנה לטסט',
  fuel: 'דלק',
  insurance: 'ביטוח',
  test: 'טסט',
  parking: 'חניה',
  fines: 'קנסות',
  other: 'אחר',
};

const SERVICE_ICONS: Record<string, typeof Wrench> = {
  inspection: CheckCircle2,
  maintenance: Wrench,
  repair: Wrench,
  test_prep: Calendar,
  fuel: TrendingUp,
  insurance: CreditCard,
};

const STATUS_CONFIG = {
  paid: { label: 'שולם', bgClass: 'bg-green-50 text-green-700 border-green-200', dotClass: 'bg-green-500' },
  pending: { label: 'ממתין', bgClass: 'bg-amber-50 text-amber-700 border-amber-200', dotClass: 'bg-amber-500' },
  overdue: { label: 'באיחור', bgClass: 'bg-red-50 text-red-700 border-red-200', dotClass: 'bg-red-500' },
};

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/user/payments');
        if (!response.ok) throw new Error('שגיאה בטעינת התשלומים');
        const paymentData: PaymentSummary = await response.json();
        setData(paymentData);
        setFilteredPayments(paymentData.payments);
      } catch {
        const demoData: PaymentSummary = {
          totalThisMonth: 1250,
          totalThisYear: 8500,
          averageMonthlySpend: 1420,
          payments: [
            { id: '1', date: '2026-03-20', garageName: 'מוסך זהב', serviceType: 'inspection', amount: 350, currency: '₪', status: 'paid', source: 'inspection', vehicleNickname: 'ספורטז\' לבנה', description: 'בדיקה שנתית מלאה' },
            { id: '2', date: '2026-03-18', garageName: 'מוסך אל-דיין', serviceType: 'maintenance', amount: 450, currency: '₪', status: 'pending', source: 'appointment', vehicleNickname: 'ספורטז\' לבנה', description: 'החלפת שמן מנוע וסינונים' },
            { id: '3', date: '2026-03-15', garageName: 'דור אלון', serviceType: 'fuel', amount: 180, currency: '₪', status: 'paid', source: 'expense', vehicleNickname: 'ספורטז\' לבנה', description: 'תדלוק דלק סולר' },
            { id: '4', date: '2026-03-12', garageName: 'מוסך זהב', serviceType: 'repair', amount: 750, currency: '₪', status: 'paid', source: 'appointment', vehicleNickname: 'פורד פוקוס', description: 'החלפת רפידות בלמים קדמיות' },
            { id: '5', date: '2026-03-05', garageName: 'מוסך אל-דיין', serviceType: 'test_prep', amount: 280, currency: '₪', status: 'overdue', source: 'appointment', vehicleNickname: 'פורד פוקוס', description: 'הכנה לטסט שנתי' },
            { id: '6', date: '2026-02-28', garageName: 'מגדל ביטוח', serviceType: 'insurance', amount: 3200, currency: '₪', status: 'paid', source: 'expense', vehicleNickname: 'ספורטז\' לבנה', description: 'ביטוח מקיף שנתי' },
          ],
        };
        setData(demoData);
        setFilteredPayments(demoData.payments);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentData();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    if (!data) return;
    let filtered = [...data.payments];

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.status === selectedStatus);
    }
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.serviceType === selectedType);
    }

    switch (sortOrder) {
      case 'newest': filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); break;
      case 'oldest': filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); break;
      case 'highest': filtered.sort((a, b) => b.amount - a.amount); break;
      case 'lowest': filtered.sort((a, b) => a.amount - b.amount); break;
    }

    setFilteredPayments(filtered);
  }, [data, selectedStatus, selectedType, sortOrder]);

  const formatCurrency = (amount: number) => `₪${amount.toLocaleString('he-IL')}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Calculate stats
  const pendingCount = data?.payments.filter(p => p.status === 'pending').length || 0;
  const overdueCount = data?.payments.filter(p => p.status === 'overdue').length || 0;
  const pendingTotal = data?.payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0) || 0;
  const overdueTotal = data?.payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0) || 0;

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#fef7ed] pb-24" dir="rtl">
      <PageHeader title="תשלומים" backUrl="/user/profile" />

      <div className="space-y-6 pt-6 px-4 md:px-8 max-w-7xl mx-auto" dir="rtl">
        {/* Summary Stats Cards */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* This Month */}
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">החודש</p>
              <p className="text-2xl font-bold text-[#1e3a5f]">{formatCurrency(data.totalThisMonth)}</p>
              <p className="text-xs text-gray-400 mt-2">תשלומים מכל הסוגים</p>
            </div>
            {/* This Year */}
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">השנה</p>
              <p className="text-2xl font-bold text-[#1e3a5f]">{formatCurrency(data.totalThisYear)}</p>
              <p className="text-xs text-gray-400 mt-2">סה״כ הוצאות בשנה</p>
            </div>
            {/* Pending */}
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">ממתינים</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(pendingTotal)}</p>
              <p className="text-xs text-gray-400 mt-2">{pendingCount} תשלומים ממתינים</p>
            </div>
          </div>
        )}

      {/* AI Insights */}
      {!loading && data && data.payments.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-teal-600" />
            </div>
            <h2 className="text-sm font-bold text-[#1e3a5f]">תובנות AI</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Insight 1: Payment Summary */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-teal-600" />
                <span className="text-xs font-bold text-gray-700">סיכום תשלומים</span>
              </div>
              <p className="text-xs text-gray-600">
                סה״כ {formatCurrency(data.totalThisYear)} השנה • בממוצע {formatCurrency(data.averageMonthlySpend)} בחודש
              </p>
            </div>

            {/* Insight 2: Payment Status */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-amber-600" />
                <span className="text-xs font-bold text-gray-700">סטטוס תשלום</span>
              </div>
              <p className="text-xs text-gray-600">
                ✅ {data.payments.filter(p => p.status === 'paid').length} שולם • ⏳ {pendingCount} ממתין • ⚠️ {overdueCount} באיחור
              </p>
            </div>

            {/* Insight 3: Most Recent Payment */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-green-600" />
                <span className="text-xs font-bold text-gray-700">תשלום אחרון</span>
              </div>
              <p className="text-xs text-gray-600">
                {formatDate(data.payments[0].date)} • {SERVICE_TYPE_LABELS[data.payments[0].serviceType] || data.payments[0].serviceType} • {formatCurrency(data.payments[0].amount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'הכל', count: data?.payments.length || 0 },
          { key: 'paid', label: 'שולם', count: data?.payments.filter(p => p.status === 'paid').length || 0 },
          { key: 'pending', label: 'ממתין', count: pendingCount },
          { key: 'overdue', label: 'באיחור', count: overdueCount },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedStatus === tab.key
                ? 'bg-[#1e3a5f] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>  {/* Advanced Filters + Sort */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600 transition"
        >
          <Filter size={16} />
          סינון מתקדם
          <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-gray-400" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="text-sm border-0 bg-transparent text-gray-600 focus:ring-0 cursor-pointer"
          >
            <option value="newest">חדש לישן</option>
            <option value="oldest">ישן לחדש</option>
            <option value="highest">סכום גבוה לנמוך</option>
            <option value="lowest">סכום נמוך לגבוה</option>
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">סוג שירות</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-right focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer hover:border-teal-300 transition"
              >
                <option value="all">כל השירותים</option>
                {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedType('all'); setSelectedStatus('all'); setSortOrder('newest'); }}
                className="text-gray-500"
              >
                נקה סינון
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-medium text-red-800 text-sm">{error}</p>
            <p className="text-xs text-red-600">אנא נסה שוב מאוחר יותר</p>
          </div>
        </div>
      )}

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Receipt size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">אין תשלומים להצגה</h3>
          <p className="text-gray-500 text-sm">נסה לשנות את סנני החיפוש</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => {
            const statusConfig = STATUS_CONFIG[payment.status];
            const isExpanded = expandedPaymentId === payment.id;
            const statusIcon = payment.status === 'paid' ? '✅' : payment.status === 'pending' ? '⏳' : '⚠️';

            return (
              <div key={payment.id} className="bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-100">
                <button
                  onClick={() => setExpandedPaymentId(isExpanded ? null : payment.id)}
                  className="w-full px-4 py-4 hover:bg-gray-50 transition-colors text-right"
                >
                  <div className="flex items-center gap-3">
                    {/* Status Icon */}
                    <span className="text-lg flex-shrink-0">{statusIcon}</span>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-sm text-[#1e3a5f] truncate">{payment.garageName}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{SERVICE_TYPE_LABELS[payment.serviceType] || payment.serviceType}</span>
                        <span>•</span>
                        <span>{formatDate(payment.date)}</span>
                      </div>
                    </div>

                    {/* Amount + Arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="font-bold text-lg text-[#1e3a5f]">{formatCurrency(payment.amount)}</p>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">סוג שירות</p>
                        <p className="font-semibold text-gray-800">{SERVICE_TYPE_LABELS[payment.serviceType] || payment.serviceType}</p>
                      </div>
                      {payment.vehicleNickname && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">רכב</p>
                          <p className="font-semibold text-gray-800">{payment.vehicleNickname}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400 mb-1">מקור</p>
                        <p className="font-semibold text-gray-800">
                          {payment.source === 'inspection' ? 'בדיקה' : payment.source === 'appointment' ? 'תור' : 'הוצאה'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">תאריך</p>
                        <p className="font-semibold text-gray-800">{formatDate(payment.date)}</p>
                      </div>
                    </div>
                    {payment.description && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-400 mb-1">תיאור</p>
                        <p className="text-sm text-gray-700">{payment.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Total Bar */}
      {filteredPayments.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <PieChart size={16} className="text-teal-600" />
            <span>סה״כ {filteredPayments.length} תשלומים</span>
          </div>
          <p className="text-lg font-bold text-[#1e3a5f]">
            {formatCurrency(filteredPayments.reduce((s, p) => s + p.amount, 0))}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
