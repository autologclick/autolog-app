'use client';

/**
 * Admin → Partner detail
 *
 * Shows running totals + the full list of users referred by this partner.
 * Lets admin mark a payout and toggle the partner's status.
 */

import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Handshake, ArrowRight, Wallet, Phone, Mail, Loader2,
  Users, TrendingUp, Copy, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface ReferredUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  isActive: boolean;
}

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
  referrals: ReferredUser[];
}

const formatILS = (n: number) =>
  `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function PartnerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [posterCopied, setPosterCopied] = useState(false);

  useEffect(() => { fetchPartner(); }, [params.id]);

  async function fetchPartner() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/partners/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setPartner(data.partner);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid() {
    if (!partner) return;
    const amount = window.prompt(
      `כמה שילמת ל${partner.name}?\nיתרה לתשלום: ${formatILS(partner.unpaidBalance)}`,
      String(partner.unpaidBalance),
    );
    if (!amount) return;
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0) {
      alert('סכום לא תקין');
      return;
    }
    const res = await fetch(`/api/admin/partners/${partner.id}?action=payout`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: num }),
    });
    if (res.ok) await fetchPartner();
  }

  function copyLink() {
    if (!partner) return;
    const url = `${window.location.origin}/?ref=${partner.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function copyPosterUrl() {
    if (!partner) return;
    // The partner poster HTML lives on the admin's local machine
    // (in C:\Users\User\AutoLog\flyers\). We can't construct a clickable
    // web URL to it from this page (browser security blocks file://).
    // Instead we copy a query-string fragment the admin can append after
    // opening the file locally.
    const fragment = `?ref=${partner.code}&name=${encodeURIComponent(partner.name)}`;
    navigator.clipboard.writeText(fragment).then(() => {
      setPosterCopied(true);
      setTimeout(() => setPosterCopied(false), 2500);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto text-gray-300 mb-3" size={40} />
        <p className="text-gray-500">שותף לא נמצא.</p>
        <Button onClick={() => router.push('/admin/partners')} className="mt-4">
          חזרה לרשימה
        </Button>
      </div>
    );
  }

  const aboveThreshold = partner.unpaidBalance >= 100;

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <button
        onClick={() => router.push('/admin/partners')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowRight size={16} />
        חזרה לכל השותפים
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Handshake className="text-[#0d9488]" size={28} />
            <h1 className="text-2xl font-bold text-[#1e3a5f]">{partner.name}</h1>
            {partner.status === 'active' && <Badge variant="success">פעיל</Badge>}
            {partner.status === 'paused' && <Badge variant="warning">מושהה</Badge>}
            {partner.status === 'archived' && <Badge variant="default">בארכיון</Badge>}
            {aboveThreshold && partner.status === 'active' && (
              <Badge variant="danger">דורש תשלום</Badge>
            )}
          </div>
          <div className="text-sm text-gray-500 font-mono" dir="ltr">
            code: {partner.code}  ·  ₪{partner.commissionPerSignup}/signup
          </div>
        </div>
        <Button onClick={handleMarkPaid} disabled={partner.unpaidBalance <= 0} icon={<Wallet size={16} />}>
          סמן כשולם
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5">
          <div className="text-xs text-gray-500 mb-1">הרשמות</div>
          <div className="text-2xl font-bold text-[#1e3a5f]">{partner.totalSignups}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-gray-500 mb-1">צבר</div>
          <div className="text-2xl font-bold text-[#1e3a5f]">{formatILS(partner.totalEarned)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-gray-500 mb-1">שולם</div>
          <div className="text-2xl font-bold text-gray-500">{formatILS(partner.totalPaid)}</div>
        </Card>
        <Card className={`p-5 ${aboveThreshold ? 'ring-2 ring-red-300' : ''}`}>
          <div className="text-xs text-gray-500 mb-1">יתרה לתשלום</div>
          <div className={`text-2xl font-bold ${aboveThreshold ? 'text-red-600' : 'text-emerald-600'}`}>
            {formatILS(partner.unpaidBalance)}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: contact + links */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-5">
            <CardTitle className="mb-3">פרטי קשר</CardTitle>
            {partner.contactName && (
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <Users size={16} className="text-gray-400" />
                {partner.contactName}
              </div>
            )}
            {partner.contactPhone && (
              <a
                href={`tel:${partner.contactPhone}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-2"
              >
                <Phone size={16} />
                {partner.contactPhone}
              </a>
            )}
            {partner.contactEmail && (
              <a
                href={`mailto:${partner.contactEmail}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <Mail size={16} />
                {partner.contactEmail}
              </a>
            )}
            {!partner.contactName && !partner.contactPhone && !partner.contactEmail && (
              <p className="text-sm text-gray-400">— לא הוזנו פרטי קשר —</p>
            )}
          </Card>

          <Card className="p-5">
            <CardTitle className="mb-3">לינקים אישיים</CardTitle>
            <button
              onClick={copyLink}
              className="w-full flex items-center justify-between gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition mb-2"
            >
              <span className="text-gray-700">לינק אתר (לשיתוף)</span>
              {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} className="text-gray-500" />}
            </button>
            <button
              onClick={copyPosterUrl}
              className="w-full flex items-center justify-between gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition"
            >
              <span className="text-gray-700">העתק קוד לפוסטר</span>
              {posterCopied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} className="text-gray-500" />}
            </button>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              ההדפסה: פותחים את הקובץ <code className="bg-gray-100 px-1 rounded">flyers/autolog-poster-partner.html</code> במחשב, ומדביקים את הקוד בסוף ה-URL בכתובת.
            </p>
          </Card>

          {partner.notes && (
            <Card className="p-5">
              <CardTitle className="mb-3">הערות פנימיות</CardTitle>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{partner.notes}</p>
            </Card>
          )}
        </div>

        {/* Right: referrals list */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <CardTitle className="mb-4">
              משתמשים שהגיעו דרך השותף ({partner.referrals.length})
            </CardTitle>
            {partner.referrals.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500">עדיין לא הגיעו משתמשים דרך הקוד הזה.</p>
                <p className="text-sm text-gray-400 mt-2">
                  הדפס את הפוסטר ותלה במוסך — ההרשמות יופיעו כאן.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {partner.referrals.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#1e3a5f]">{u.fullName}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </div>
                    <div className="text-sm text-gray-500 text-left">
                      <div>{formatDate(u.createdAt)}</div>
                      {!u.isActive && (
                        <Badge variant="default">לא פעיל</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
