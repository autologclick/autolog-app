'use client';

/**
 * Admin → Partners (Affiliate program management)
 *
 * Lists all affiliate partners with running totals:
 *   signups · earned · paid · unpaid balance
 *
 * Quick actions inline:
 *   - Mark as paid (records a payout)
 *   - Pause / resume / archive
 *   - Copy poster URL (with ?ref=CODE so partner can preview their landing)
 *
 * "Add partner" opens a modal with name + code + commission fields.
 * Per-partner detail page (/admin/partners/[id]) shows the full list of referred users.
 */

import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  Handshake, Search, Plus, Eye, Loader2, Copy, CheckCircle2,
  AlertCircle, Users, Wallet, TrendingUp,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Partner {
  id: string;
  code: string;
  name: string;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  commissionPerSignup: number;
  totalSignups: number;
  totalEarned: number;
  totalPaid: number;
  unpaidBalance: number;
  status: 'active' | 'paused' | 'archived';
  notes?: string | null;
  createdAt: string;
}

const formatILS = (n: number) =>
  `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function AdminPartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    commissionPerSignup: 1,
    notes: '',
  });

  useEffect(() => { fetchPartners(); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchPartners(), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function fetchPartners() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await fetch(`/api/admin/partners?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners);
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      name: '', code: '', contactName: '', contactPhone: '',
      contactEmail: '', commissionPerSignup: 1, notes: '',
    });
    setError('');
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.code.trim()) {
      setError('שם וקוד הם שדות חובה');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.code)) {
      setError('קוד חייב להיות אותיות לטיניות קטנות, ספרות ומקפים בלבד');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה ביצירת שותף');
        return;
      }
      setShowAddModal(false);
      resetForm();
      await fetchPartners();
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(p: Partner) {
    const amount = window.prompt(
      `כמה שילמת ל${p.name}?\nיתרה לתשלום: ${formatILS(p.unpaidBalance)}`,
      String(p.unpaidBalance),
    );
    if (!amount) return;
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0) {
      alert('סכום לא תקין');
      return;
    }
    const res = await fetch(`/api/admin/partners/${p.id}?action=payout`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: num }),
    });
    if (res.ok) {
      await fetchPartners();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'שגיאה ברישום תשלום');
    }
  }

  async function handleStatusToggle(p: Partner, newStatus: Partner['status']) {
    const res = await fetch(`/api/admin/partners/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) await fetchPartners();
  }

  function copyShareUrl(code: string) {
    const url = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  // Aggregate stats across all active partners
  const stats = partners.reduce(
    (a, p) => ({
      signups: a.signups + p.totalSignups,
      earned: a.earned + p.totalEarned,
      unpaid: a.unpaid + p.unpaidBalance,
    }),
    { signups: 0, earned: 0, unpaid: 0 },
  );

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Handshake className="text-[#0d9488]" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">שותפים — תוכנית האפיליאט</h1>
            <p className="text-sm text-gray-500">ניהול שותפים, מעקב הרשמות, ותשלום עמלות</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowAddModal(true); }} icon={<Plus size={16} />}>
          הוספת שותף
        </Button>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
              <Users className="text-teal-600" size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1e3a5f]">{stats.signups}</div>
              <div className="text-sm text-gray-500">סך הרשמות מאפיליאט</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="text-emerald-600" size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1e3a5f]">{formatILS(stats.earned)}</div>
              <div className="text-sm text-gray-500">סך עמלות שצברו השותפים</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Wallet className="text-amber-600" size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1e3a5f]">{formatILS(stats.unpaid)}</div>
              <div className="text-sm text-gray-500">סך יתרה לתשלום</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          icon={<Search size={16} />}
          placeholder="חיפוש לפי שם, קוד או איש קשר…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Partners list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-gray-400" size={28} />
        </div>
      ) : partners.length === 0 ? (
        <Card className="p-12 text-center">
          <Handshake className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="font-bold text-lg text-gray-700 mb-2">אין שותפים עדיין</h3>
          <p className="text-gray-500 mb-6">
            הוסף שותף ראשון, הפק לו פוסטר עם QR מותאם,<br />
            ותעקוב כאן אחרי הרשמות והעמלות.
          </p>
          <Button onClick={() => { resetForm(); setShowAddModal(true); }} icon={<Plus size={16} />}>
            הוספת שותף ראשון
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {partners.map((p) => {
            const aboveThreshold = p.unpaidBalance >= 100;
            return (
              <Card key={p.id} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-[#1e3a5f] truncate">{p.name}</h3>
                      {p.status === 'active' && <Badge variant="success">פעיל</Badge>}
                      {p.status === 'paused' && <Badge variant="warning">מושהה</Badge>}
                      {p.status === 'archived' && <Badge variant="default">בארכיון</Badge>}
                      {aboveThreshold && p.status === 'active' && (
                        <Badge variant="danger">דורש תשלום</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 font-mono">
                      ref={p.code}
                    </div>
                    {p.contactName && (
                      <div className="text-sm text-gray-600 mt-1">
                        {p.contactName}
                        {p.contactPhone && <span className="text-gray-400"> · {p.contactPhone}</span>}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 text-center lg:text-right">
                    <div>
                      <div className="text-xs text-gray-500">הרשמות</div>
                      <div className="font-bold text-lg text-[#1e3a5f]">{p.totalSignups}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">צבר</div>
                      <div className="font-bold text-lg text-[#1e3a5f]">{formatILS(p.totalEarned)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">שולם</div>
                      <div className="font-bold text-lg text-gray-500">{formatILS(p.totalPaid)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">יתרה</div>
                      <div className={`font-bold text-lg ${aboveThreshold ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatILS(p.unpaidBalance)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 lg:flex-col">
                    <button
                      onClick={() => copyShareUrl(p.code)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition"
                      title="העתק לינק אישי של השותף"
                    >
                      {copiedId === p.code ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      {copiedId === p.code ? 'הועתק!' : 'לינק'}
                    </button>
                    <button
                      onClick={() => handleMarkPaid(p)}
                      disabled={p.unpaidBalance <= 0}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg text-white font-medium transition"
                    >
                      <Wallet size={14} />
                      סמן כשולם
                    </button>
                    <button
                      onClick={() => router.push(`/admin/partners/${p.id}`)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 font-medium transition"
                    >
                      <Eye size={14} />
                      פרטים
                    </button>
                    {p.status === 'active' ? (
                      <button
                        onClick={() => handleStatusToggle(p, 'paused')}
                        className="text-xs px-3 py-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg text-amber-700 font-medium transition"
                      >
                        השהה
                      </button>
                    ) : p.status === 'paused' ? (
                      <button
                        onClick={() => handleStatusToggle(p, 'active')}
                        className="text-xs px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-700 font-medium transition"
                      >
                        הפעל
                      </button>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add partner modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="הוספת שותף חדש">
        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם השותף *</label>
            <Input
              placeholder="מוסך דוד תל אביב"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              קוד יחיד *
              <span className="text-xs text-gray-500 font-normal mr-2">
                (מופיע ב-URL וב-QR. אותיות לטיניות קטנות, ספרות, ומקפים)
              </span>
            </label>
            <Input
              dir="ltr"
              placeholder="mosach-david-tlv"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })}
            />
            {form.code && (
              <div className="text-xs text-gray-500 mt-1 font-mono" dir="ltr">
                autolog.click/?ref={form.code}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">איש קשר</label>
              <Input
                placeholder="דוד כהן"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
              <Input
                placeholder="050-1234567"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <Input
              placeholder="david@example.com"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              עמלה לכל הרשמה (₪)
            </label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={form.commissionPerSignup}
              onChange={(e) => setForm({ ...form, commissionPerSignup: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות (לעצמי בלבד)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={2}
              placeholder="כל הערה פנימית — הסכמים, פרטי תשלום, וכו׳"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>ביטול</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={16} /> : 'הוסף שותף'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
