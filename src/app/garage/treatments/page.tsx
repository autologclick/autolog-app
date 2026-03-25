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
  maintenance: { label: '×××¤×× ×ª×§××¤×ª×', icon: Wrench },
  repair: { label: '×ª××§××', icon: Settings },
  oil_change: { label: '××××¤×ª ×©××', icon: Droplet },
  tires: { label: '×¦×××××', icon: CircleDot },
  brakes: { label: '×××××', icon: XCircle },
  electrical: { label: '××©××', icon: Zap },
  ac: { label: '×××××', icon: Snowflake },
  bodywork: { label: '×¤××××ª/×¦××¢', icon: Palette },
  other: { label: '×××¨', icon: ClipboardList },
};

const STATUS_MAP: Record<string, { label: string; bgClass: string; icon: typeof Clock }> = {
  pending_approval: { label: '×××ª×× ××××©××¨', bgClass: 'bg-amber-50 text-amber-700 border border-amber-200', icon: Clock },
  approved: { label: '×××©×¨', bgClass: 'bg-green-50 text-green-700 border border-green-200', icon: CheckCircle },
  rejected: { label: '× ×××', bgClass: 'bg-red-50 text-red-700 border border-red-200', icon: XCircle },
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
      setError('× × ×××× ××¡×¤×¨ ×¨××©×× ××××ª×¨×ª');
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
        setError(data.error || '×©×××× ××©××××ª ××××¤××');
        setSaving(false);
        return;
      }
      setSuccess('××××¤×× × ×©×× ×××§×× ××××©××¨!');
      setShowModal(false);
      setForm({
        licensePlate: '', type: 'maintenance', title: '', description: '',
        mechanicName: '', mileage: '', cost: '', date: new Date().toISOString().split('T')[0], notes: '',
      });
      fetchTreatments();
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('×©××××ª ×××××¨');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
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
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">× ×××× ×××¤××××</h1>
            <p className="text-sm text-gray-500">×©×× ××¢×§×× ×××¨ ×××¤×××× ×××§××××ª</p>
          </div>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
          ×××¤×× ×××©
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <FileText size={16} className="text-emerald-600" />
            <span className="text-xs text-gray-400">×¡××´×</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Clock size={16} className="text-amber-500" />
            <span className="text-xs text-gray-400">×××ª×× ××</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-xs text-gray-400">×××©×¨×</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={16} className="text-teal-600" />
            <span className="text-xs text-gray-400">×¡××´× ×¢×××××ª</span>
          </div>
          <p className="text-2xl font-bold text-teal-600">âª{stats.totalCost.toLocaleString()}</p>
        </div>
      </div>

      {/* AI Insights */}
      {treatments.length > 0 && (
        <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">×ª××× ××ª AI ××××¤××××</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-gray-700">×××©××¨×× ×××ª×× ××</span>
              </div>
              <p className="text-xs text-gray-600">
                {stats.pending > 3
                  ? `â ï¸ ${stats.pending} ×××¤×××× ×××ª×× ×× ××××©××¨ â ×¤× × ×××§××××ª ××××¨××.`
                  : stats.pending > 0
                  ? `ð ${stats.pending} ×××¤×××× ××××ª× ×. ×©××× ×ª××××¨×ª ×××§××××ª.`
                  : 'â ×× ××××¤×××× ×××©×¨× â ××¦×××!'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-teal-600" />
                <span className="text-xs font-bold text-gray-700">×¢×××ª ××××¦×¢×ª</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const withCost = treatments.filter(t => t.cost && t.cost > 0);
                  if (withCost.length === 0) return 'ð ××× × ×ª×× × ×¢×××ª ×××× ×× ×¢××××.';
                  const avg = Math.round(withCost.reduce((s, t) => s + (t.cost || 0), 0) / withCost.length);
                  return `ð° ×¢×××ª ××××¦×¢×ª âª${avg.toLocaleString()} ××××¤××. ×¡××´× âª${stats.totalCost.toLocaleString()} ×-${withCost.length} ×××¤××××.`;
                })()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-gray-700">×¡×× ×××¤×× × ×¤××¥</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const typeCounts = treatments.reduce((acc, t) => {
                    acc[t.type] = (acc[t.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
                  if (!topType) return 'ð ××× ××¡×¤××§ × ×ª×× ××.';
                  const label = TREATMENT_TYPES[topType[0]]?.label || topType[0];
                  return `ð§ ${label} â ${topType[1]} ×××¤×××× (${Math.round((topType[1] / treatments.length) * 100)}%). ${topType[1] > treatments.length * 0.5 ? '×©×§×× ××××××ª ×××××××ª.' : '××××× ×××¤×××× ××¨××.'}`;
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
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {[
            { key: 'all', label: '×××' },
            { key: 'pending_approval', label: '×××ª×× ××' },
            { key: 'approved', label: '×××©×¨×' },
            { key: 'rejected', label: '× ×××' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                filterStatus === tab.key
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="×××¤××©..."
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
            {treatments.length === 0 ? '××× ×××¤×××× ×¢××××' : '××× ×ª××¦×××ª ××¡×× ××'}
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {treatments.length === 0 ? '×©×× ×××¤×× ×××§×× ××¤× ××¡×¤×¨ ×¨××©××' : '× ×¡× ××©× ××ª ××ª ××¡×× ××'}
          </p>
          {treatments.length === 0 && (
            <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              ×××¤×× ×××©
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
                        <span>â¢</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(t.date).toLocaleDateString('he-IL')}
                        </span>
                        {t.mechanicName && (
                          <>
                            <span className="hidden sm:inline">â¢</span>
                            <span className="hidden sm:inline">{t.mechanicName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Cost + arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {t.cost != null && t.cost > 0 && (
                        <span className="font-bold text-emerald-600">âª{t.cost.toLocaleString()}</span>
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
                          <p className="text-xs text-gray-400 mb-1">×ª××××¨</p>
                          <p className="text-gray-700 text-sm">{t.description}</p>
                        </div>
                      )}
                      {t.mechanicName && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">×××× ××</p>
                          <p className="font-semibold text-gray-800">{t.mechanicName}</p>
                        </div>
                      )}
                      {t.mileage && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">×§×´×</p>
                          <p className="font-semibold text-gray-800">{t.mileage.toLocaleString()} ×§×´×</p>
                        </div>
                      )}
                      {t.notes && (
                        <div className="col-span-2 sm:col-span-3">
                          <p className="text-xs text-gray-400 mb-1">××¢×¨××ª</p>
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
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setError(''); }} title="×©××××ª ×××¤×× ×××§××" size="lg">
        <div className="space-y-4">
          {/* Vehicle identification */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car size={16} className="text-emerald-600" />
              <h4 className="font-bold text-emerald-800 text-sm">××××× ××§×× ××¤× ××¡×¤×¨ ×¨××©××</h4>
            </div>
            <Input
              placeholder="××× ×¡ ××¡×¤×¨ ×¨××©××..."
              value={form.licensePlate}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
            />
            <p className="text-xs text-emerald-600 mt-2">×××§×× ×××× ×××××ª ×¨×©×× ×××¢×¨××ª AutoLog</p>
          </div>

          {/* Treatment type as grid */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">×¡×× ×××¤××</label>
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
            label="×××ª×¨×ª ××××¤××"
            placeholder="×××©×: ×××¤×× 30,000 ×§×´×"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">×ª××××¨ ××¢××××</label>
            <VoiceInput
              value={form.description}
              onChange={(val) => setForm({ ...form, description: val })}
              placeholder="×¤××¨×× ××¢×××× ×©×××¦×¢×, ×××§×× ×©×××××¤×..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="×©× ×××× ××" placeholder="×××¤×¦××× ××" value={form.mechanicName}
              onChange={(e) => setForm({ ...form, mechanicName: e.target.value })} />
            <Input label="×ª××¨××" type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="×¢×××ª (âª)" type="number" placeholder="0" value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            <Input label="×§×´× ××¨××" type="number" placeholder="45000" value={form.mileage}
              onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">××¢×¨××ª</label>
            <VoiceInput
              value={form.notes}
              onChange={(val) => setForm({ ...form, notes: val })}
              placeholder="××¢×¨××ª × ××¡×¤××ª..."
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
            <Button variant="ghost" onClick={() => setShowModal(false)} className="w-full sm:w-auto">×××××</Button>
            <Button icon={<Send size={16} />} loading={saving} onClick={handleSend}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              ×©×× ×××§××
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
