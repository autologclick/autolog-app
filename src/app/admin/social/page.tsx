'use client';

/**
 * /admin/social — Social Media Command Center
 *
 * Four-tab dashboard for the admin to run AutoLog's social presence:
 *   1. מחולל פוסטים AI   — Claude-powered post generator in brand voice
 *   2. מחולל גרפי         — In-browser graphic editor with brand colors + logo
 *   3. תזמון ופוסטים      — Scheduler / status board / publish-now
 *   4. WhatsApp + מותג    — WhatsApp templates + brand asset library
 *
 * Auth: client-side check via the admin layout's /api/auth/me redirect.
 * Server-side enforcement happens in each /api/admin/social/* route.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Palette, Calendar, MessageCircle, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import PostGenerator from '@/components/admin/social/PostGenerator';
import GraphicEditor from '@/components/admin/social/GraphicEditor';
import Scheduler from '@/components/admin/social/Scheduler';
import WhatsAppTemplates from '@/components/admin/social/WhatsAppTemplates';
import ConnectionsPanel from '@/components/admin/social/ConnectionsPanel';

type Tab = 'generator' | 'graphic' | 'scheduler' | 'whatsapp';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'generator', label: 'מחולל פוסטים', icon: <Sparkles size={18} /> },
  { id: 'graphic',   label: 'מחולל גרפי',   icon: <Palette size={18} /> },
  { id: 'scheduler', label: 'תזמון ופוסטים', icon: <Calendar size={18} /> },
  { id: 'whatsapp',  label: 'WhatsApp',     icon: <MessageCircle size={18} /> },
];

export default function AdminSocialPage() {
  const [tab, setTab] = useState<Tab>('generator');
  const params = useSearchParams();

  // Handle OAuth callback feedback
  useEffect(() => {
    if (params.get('connected') === '1') {
      toast.success('חשבון Meta חובר בהצלחה');
    }
    const err = params.get('error');
    if (err) {
      const messages: Record<string, string> = {
        missing_code: 'תהליך החיבור בוטל',
        meta_not_configured: 'הגדרות Meta App חסרות (ראה SETUP_SOCIAL.md)',
        short_token_failed: 'Meta דחה את החיבור',
      };
      toast.error(messages[err] ?? `שגיאה: ${err}`);
    }
  }, [params]);

  return (
    <div dir="rtl">
      <Toaster position="bottom-center" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone size={28} className="text-blue-600" />
          מרכז סושיאל
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          ייצור, עיצוב, תזמון ופרסום של כל התוכן שלך בפייסבוק, אינסטגרם ו-WhatsApp — במקום אחד.
        </p>
      </div>

      {/* Meta connections */}
      <ConnectionsPanel />

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {tab === 'generator' && <PostGenerator onPostSaved={() => setTab('scheduler')} />}
        {tab === 'graphic'   && <GraphicEditor />}
        {tab === 'scheduler' && <Scheduler />}
        {tab === 'whatsapp'  && <WhatsAppTemplates />}
      </div>
    </div>
  );
}
