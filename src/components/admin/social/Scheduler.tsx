'use client';

/**
 * Scheduler — third tab of /admin/social.
 *
 * Shows all posts grouped by status (scheduled / draft / published / failed),
 * with quick actions: publish-now, reschedule, edit, delete.
 */

import { useEffect, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import {
  Calendar, Loader2, Send, Edit2, Trash2, RefreshCw,
  CheckCircle2, AlertCircle, Clock, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SocialPost {
  id: string;
  platform: string;
  status: string;
  caption: string;
  mediaUrls: string[];
  scheduledFor: string | null;
  publishedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  socialAccount?: { accountName: string; platform: string } | null;
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  draft:      { label: 'טיוטה',     icon: <FileText size={14} />, variant: 'default' },
  scheduled:  { label: 'מתוזמן',    icon: <Clock size={14} />,    variant: 'warning' },
  publishing: { label: 'מתפרסם…',   icon: <Loader2 size={14} className="animate-spin" />, variant: 'warning' },
  published:  { label: 'פורסם',     icon: <CheckCircle2 size={14} />, variant: 'success' },
  failed:     { label: 'נכשל',       icon: <AlertCircle size={14} />, variant: 'danger' },
};

export default function Scheduler() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/social/posts');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'טעינה נכשלה');
      setPosts(data.posts);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const publishNow = async (id: string) => {
    setActingId(id);
    try {
      const res = await fetch('/api/admin/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'פרסום נכשל');
      toast.success('פורסם');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setActingId(null);
    }
  };

  const remove = async (id: string) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/social/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('מחיקה נכשלה');
      toast.success('נמחק');
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setActingId(null);
    }
  };

  const grouped = {
    scheduled: posts.filter((p) => p.status === 'scheduled'),
    draft: posts.filter((p) => p.status === 'draft'),
    published: posts.filter((p) => p.status === 'published'),
    failed: posts.filter((p) => p.status === 'failed'),
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
        <p className="text-sm text-gray-500 mt-2">טוען פוסטים…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">לוח שנה ופוסטים</h3>
        <Button variant="secondary" onClick={load}>
          <RefreshCw size={16} className="ms-1" /> רענן
        </Button>
      </div>

      {(['scheduled', 'draft', 'failed', 'published'] as const).map((section) => {
        const list = grouped[section];
        if (list.length === 0) return null;
        return (
          <Card key={section}>
            <CardTitle>
              {STATUS_META[section]?.icon}
              <span className="ms-2">
                {STATUS_META[section]?.label} ({list.length})
              </span>
            </CardTitle>
            <div className="mt-3 divide-y divide-gray-100">
              {list.map((p) => (
                <div key={p.id} className="py-3 flex gap-3 items-start">
                  {p.mediaUrls[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.mediaUrls[0]}
                      alt=""
                      className="w-16 h-16 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={STATUS_META[p.status]?.variant ?? 'default'}>
                        {p.platform}
                      </Badge>
                      {p.scheduledFor && (
                        <span className="text-xs text-gray-500">
                          <Calendar size={12} className="inline ms-1" />
                          {new Date(p.scheduledFor).toLocaleString('he-IL')}
                        </span>
                      )}
                      {p.publishedAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(p.publishedAt).toLocaleString('he-IL')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{p.caption}</p>
                    {p.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{p.errorMessage}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {(p.status === 'scheduled' || p.status === 'draft' || p.status === 'failed') && (
                      <Button
                        size="sm"
                        onClick={() => publishNow(p.id)}
                        disabled={actingId === p.id}
                      >
                        {actingId === p.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setRemoveId(p.id)}
                      disabled={actingId === p.id}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {posts.length === 0 && (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm">אין פוסטים עדיין. עבור לטאב "מחולל פוסטים" כדי ליצור את הראשון.</p>
          </div>
        </Card>
      )}
      <ConfirmDialog
        isOpen={removeId !== null}
        title="מחיקת פוסט"
        message="למחוק את הפוסט?"
        confirmLabel="מחק"
        danger
        onConfirm={() => { const id = removeId; setRemoveId(null); if (id) remove(id); }}
        onCancel={() => setRemoveId(null)}
      />
    </div>
  );
}
