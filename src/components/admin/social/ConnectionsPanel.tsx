'use client';

/**
 * ConnectionsPanel — small banner shown at the top of /admin/social that
 * lists connected SocialAccount rows and a button to add a Facebook /
 * Instagram connection (kicks off the OAuth flow).
 */

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Facebook, Instagram, MessageCircle, Plus, Trash2, Loader2,
  CheckCircle2, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Account {
  id: string;
  platform: string;
  accountId: string;
  accountName: string;
  isActive: boolean;
  lastUsedAt: string | null;
  tokenExpiresAt: string | null;
}

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  facebook: <Facebook size={16} className="text-blue-600" />,
  instagram: <Instagram size={16} className="text-pink-600" />,
  instagram_story: <Instagram size={16} className="text-pink-600" />,
  whatsapp: <MessageCircle size={16} className="text-green-600" />,
};

export default function ConnectionsPanel() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/social/accounts');
      const data = await res.json();
      if (res.ok) setAccounts(data.accounts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startMetaOAuth = () => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    if (!appId) {
      toast.error('NEXT_PUBLIC_META_APP_ID לא מוגדר. ראה SETUP_SOCIAL.md');
      return;
    }
    const redirectUri = `${window.location.origin}/api/admin/social/meta/oauth-callback`;
    const scope = [
      'pages_show_list',
      'pages_manage_posts',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_content_publish',
      'business_management',
    ].join(',');
    const url = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
    window.location.href = url;
  };

  const disconnect = async (id: string) => {
    if (!confirm('לנתק את החיבור?')) return;
    try {
      const res = await fetch(`/api/admin/social/accounts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('ניתוק נכשל');
      toast.success('נותק');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה');
    }
  };

  const active = accounts.filter((a) => a.isActive);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-700 mb-2">
            חשבונות מחוברים {loading && <Loader2 size={14} className="inline animate-spin ms-1" />}
          </div>
          {active.length === 0 ? (
            <p className="text-xs text-gray-500">
              אין חיבור פעיל לפייסבוק / אינסטגרם. לחץ "חבר Facebook + Instagram" כדי להתחיל.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {active.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full text-xs border"
                >
                  {PLATFORM_ICON[a.platform]}
                  <span className="font-medium">{a.accountName}</span>
                  <CheckCircle2 size={12} className="text-green-600" />
                  <button
                    onClick={() => disconnect(a.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="נתק"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button onClick={startMetaOAuth} variant="secondary">
          <Plus size={14} className="ms-1" /> חבר Facebook + Instagram
        </Button>
      </div>
    </div>
  );
}
