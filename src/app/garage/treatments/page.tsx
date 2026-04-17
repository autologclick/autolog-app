'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import VoiceInput from '@/components/ui/VoiceInput';
import {
  Wrench, Send, Loader2, AlertCircle, Clock,
  CheckCircle, XCircle, Calendar, DollarSign, Car,
  Search, Filter, Plus, FileText, ChevronDown, Settings,
  Droplet, CircleDot, Zap, Snowflake, Palette, ClipboardList,
  Brain, TrendingUp, Target
} from 'lucide-react';

interface Treatment {
  id: string;
  vehicleId: string;
  userId: string;
  garageName?: string;
  mechanicName?: string;
  type: string;
  title: string;
  description?: string;
  mileage?: number;
  cost?: number;
  date: string;
  status: string;
  notes?: string;
  createdAt: string;
}

const TREATMENT_TYPES: Record<string, { label: string; icon: typeof Wrench }> = {
  maintenance: { label: 'טיפול תקופתי', icon: Wrench },
  repair: { label: 'תיקון', icon: Settings },
  oil_change: { label: 'החלפת שמן', icon: Droplet },
  tires: { label: 'צמיגים', icon: CircleDot },
  brakes: { label: 'בלמים', icon: XCircle },
  electrical: { label: 'חשמל', icon: Zap },
  ac: { label: 'מיזוג', icon: Snowflake },
  bodywork: { label: 'פחחות/צבע', icon: Palette },
  other: { label: 'אחר', icon: ClipboardList },
};

const STATUS_MAP: Record<string, { label: string; bgClass: string; icon: typeof Clock }> = {
  pending_approval: { label: 'ממתין לאישור', bgClass: 'bg-amber-50 text-amber-700 border border-amber-200', icon: Clock },
  approved: { label: 'אושר', bgClass: 'bg-green-50 text-green-700 border border-green-200', icon: CheckCircle },
  rejected: { label: 'נדחה', bgClass: 'bg-red-50 text-red-700 border border-red-200', icon: XCircle },
};

export default function GarageTreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    licensePlate: '',
    type: 'maintenance',
    title: '',
    description: '',
    mechanicName: '',
    mileage: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchTreatments = async () => {
    try {
      const res = await fetch('/api/garage/treatments');
      const data = await res.json();
      setTreatments(data.treatments || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchTreatments(); }, []);

  const filteredTreatments = treatments.filter(t => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchSearch = !searchQuery || t.title.includes(searchQuery) ||
      t.mechanicName?.includes(searchQuery) || t.description?.includes(searchQuery);
    return matchStatus && matchSearch;
  });

  const stats = {
    total: treatments.length,
    pending: treatments.filter(t => t.status === 'pending_approval').length,
    approved: treatments.filter(t => t.status === 'approved').length,
    totalCost: treatments.reduce((s, t) => s + (t.cost || 0), 0),
  };

  const handleSend = async () => {
    if (!form.licensePlate || !form.title) {
      setError('נא למלא מספר רישוי וכותרת');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/garage/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licensePlate: form.licensePlate,
          type: form.type,
          title: form.title,
          description: form.description || undefined,
          mechanicName: form.mechanicName || undefined,
          mileage: form.mileage ? Number(form.mileage) : undefined,
          cost: form.cost ? Number(form.cost) : undefined,
          date: form.date,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בשליחת הטיפול');
        setSaving(false);
        return;
      }
      setSuccess('הטיפול נשלח ללקוח לאישור!');
      setShowModal(false);
      setForm({
        licensePlate: '', type: 'maintenance', title: '', description: '',
        mechanicName: '', mileage: '', cost: '', date: new Date().toISOString().split('T')[0], notes: '',
      });
      fetchTreatments();
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('שגיאת חיבור');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-12 lg:pt-0 animate-pulse" dir="rtl">
        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-lg" /><div className="h-6 bg-gray-200 rounded w-32" /></div><div className="h-10 w-28 bg-gray-100 rounded-lg" /></div>
        <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl p-4 h-20" />)}</div>
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-1/3" /><div className="h-3 bg-gray-50 rounded w-1/2" /></div>
              <div className="h-6 w-16 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] rounded-lg border-2 border-[#1e3a5f] flex items-center justify-center shadow-sm">
            <Wrench size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">ניהול טיפולים</h1>
            <p className="text-sm text-gray-500">שלח ועקוב אחר טיפולים ללקוחות</p>
          </div>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
          טיפול חדש
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <FileText size={16} className="text-emerald-600" />
            <span className="text-xs text-gray-400">סה״כ</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Clock size={16} className="text-amber-500" />
            <span className="text-xs text-gray-400">ממתינים</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-xs text-gray-400">אושרו</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={16} className="text-teal-600" />
            <span className="text-xs text-gray-400">סה״כ עלויות</span>
          </div>
          <p className="text-2xl font-bold text-teal-600">₪{stats.totalCost.toLocaleString()}</p>
        </div>
      </div>

      {/* AI Insights */}
      {treatments.length > 0 && (
        <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">תובנות AI לטיפולים</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-gray-700">אישורים ממתינים</span>
              </div>
              <p className="text-xs text-gray-600">
                {stats.pending > 3
                  ? `⚠️ ${stats.pending} טיפולים ממתינים לאישור — פנו ללקוחות לזירוז.`
                  : stats.pending > 0
                  ? `📋 ${stats.pending} טיפולים בהמתנה. שלחו תזכורת ללקוחות.`
                  : '✅ כל הטיפולים אושרו — מצוין!'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-teal-600" />
                <span className="text-xs font-bold text-gray-700">עלות ממוצעת</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const withCost = treatments.filter(t => t.cost && t.cost > 0);
                  if (withCost.length === 0) return '📋 אין נתוני עלות זמינים עדיין.';
                  const avg = Math.round(withCost.reduce((s, t) => s + (t.cost || 0), 0) / withCost.length);
                  return `💰 עלות ממוצעת ₪${avg.toLocaleString()} לטיפול. סה״כ ₪${stats.totalCost.toLocaleString()} מ-${withCost.length} טיפולים.`;
                })()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-gray-700">סוג טיפול נפוץ</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const typeCounts = treatments.reduce((acc, t) => {
                    acc[t.type] = (acc[t.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
                  if (!topType) return '📋 אין מספיק נתונים.';
                  const label = TREATMENT_TYPES[topType[0]]?.label || topType[0];
                  return `🔧 ${label} — ${topType[1]} טיפולים (${Math.round((topType[1] / treatments.length) * 100)}%). ${topType[1] > treatments.length * 0.5 ? 'שקלו חבילות מיוחדות.' : 'מגוון טיפולים בריא.'}`;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {success && (
        <div className="flex gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm items-center">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}
      {error && !showModal && (
        <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm items-center">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          {[
            { key: 'all', label: 'הכל', icon: '📋' },
            { key: 'pending_approval', label: 'ממתינים', icon: '⏳' },
            { key: 'approved', label: 'אושרו', icon: '✅' },
            { key: 'rejected', label: 'נדחו', icon: '❌' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-200 text-sm flex items-center gap-1.5 ${
                filterStatus === tab.key
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200'
              }`}
            >
              <span className="text-xs">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>   <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-48 pl-3 pr-9 py-2 border border-gray-200 rounded-xl text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* List */}
      {filteredTreatments.length === 0 ? (
        <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200">
            <Wrench size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">
            {treatments.length === 0 ? 'אין טיפולים עדיין' : 'אין תוצאות לסינון'}
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {treatments.length === 0 ? 'שלח טיפול ללקוח לפי מספר רישוי' : 'נסה לשנות את הסינון'}
          </p>
          {treatments.length === 0 && (
            <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              טיפול חדש
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTreatments.map(t => {
            const statusInfo = STATUS_MAP[t.status] || STATUS_MAP.pending_approval;
            const StatusIcon = statusInfo.icon;
            const typeInfo = TREATMENT_TYPES[t.type] || TREATMENT_TYPES.other;
            const isExpanded = expandedId === t.id;

            return (
              <Card key={t.id} className="overflow-hidden hover:shadow-md transition-all !p-0">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  className="w-full px-4 py-4 text-right hover:bg-[#fef7ed]/50 transition"
                >
                  <div className="flex items-center gap-3">
                    {/* Type icon */}
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <typeInfo.icon size={20} className="text-gray-600" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm text-gray-800 truncate">{t.title}</h4>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.bgClass}`}>
                          <StatusIcon size={10} />
                          {statusInfo.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span>{typeInfo.label}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(t.date).toLocaleDateString('he-IL')}
                        </span>
                        {t.mechanicName && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">{t.mechanicName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Cost + arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {t.cost != null && t.cost > 0 && (
                        <span className="font-bold text-emerald-600">₪{t.cost.toLocaleString()}</span>
                      )}
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {t.description && (
                        <div className="col-span-2 sm:col-span-3">
                          <p className="text-xs text-gray-400 mb-1">תיאור</p>
                          <p className="text-gray-700 text-sm">{t.description}</p>
                        </div>
                      )}
                      {t.mechanicName && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">מכונאי</p>
                          <p className="font-semibold text-gray-800">{t.mechanicName}</p>
                        </div>
                      )}
                      {t.mileage && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">ק״מ</p>
                          <p className="font-semibold text-gray-800">{t.mileage.toLocaleString()} ק״מ</p>
                        </div>
                      )}
                      {t.notes && (
                        <div className="col-span-2 sm:col-span-3">
                          <p className="text-xs text-gray-400 mb-1">הערות</p>
                          <p className="text-gray-700 text-sm">{t.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 end-4 lg:bottom-6 lg:end-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95 z-30"
      >
        <Plus size={24} />
      </button>

      {/* Send Treatment Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setError(''); }} title="שליחת טיפול ללקוח" size="lg">
        <div className="space-y-4">
          {/* Vehicle identification */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car size={16} className="text-emerald-600" />
              <h4 className="font-bold text-emerald-800 text-sm">זיהוי לקוח לפי מספר רישוי</h4>
            </div>
            <Input
              placeholder="הכנס מספר רישוי..."
              value={form.licensePlate}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
            />
            <p className="text-xs text-emerald-600 mt-2">הלקוח חייב להיות רשום במערכת AutoLog</p>
          </div>

          {/* Treatment type as grid */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">סוג טיפול</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TREATMENT_TYPES).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setForm({ ...form, type: key })}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                    form.type === key
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                  }`}
                >
                  <div className="block mb-1">
                    <info.icon size={24} className="mx-auto text-gray-600" />
                  </div>
                  <span className="text-[10px] font-medium">{info.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="כותרת הטיפול"
            placeholder="למשל: טיפול 30,000 ק״מ"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">תיאור העבודה</label>
            <VoiceInput
              value={form.description}
              onChange={(val) => setForm({ ...form, description: val })}
              placeholder="פירוט העבודה שבוצעה, חלקים שהוחלפו..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="שם מכונאי" placeholder="אופציונלי" value={form.mechanicName}
              onChange={(e) => setForm({ ...form, mechanicName: e.target.value })} />
            <Input label="תאריך" type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="עלות (₪)" type="number" placeholder="0" value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            <Input label="ק״מ ברכב" type="number" placeholder="45000" value={form.mileage}
              onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">הערות</label>
            <VoiceInput
              value={form.notes}
              onChange={(val) => setForm({ ...form, notes: val })}
              placeholder="הערות נוספות..."
              rows={2}
            />
          </div>

          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm items-center">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="w-full sm:w-auto">ביטול</Button>
            <Button icon={<Send size={16} />} loading={saving} onClick={handleSend}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              שלח ללקוח
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
