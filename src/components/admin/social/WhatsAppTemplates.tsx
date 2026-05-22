'use client';

/**
 * WhatsApp Templates — fourth tab of /admin/social.
 *
 * Lets the admin draft WA Business templates that they will then submit to
 * Meta for approval (via WhatsApp Manager). Once approved, the admin pastes
 * the metaTemplateId here so the system can send via the WhatsApp Cloud API.
 *
 * Includes a few starter templates relevant to AutoLog (test reminder,
 * service due, welcome) that the admin can clone and tweak.
 */

import { useEffect, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  MessageCircle, Plus, Loader2, CheckCircle2, Clock, AlertCircle,
  Copy, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  language: string;
  category: 'marketing' | 'utility' | 'authentication';
  body: string;
  variables: string[];
  header?: string | null;
  footer?: string | null;
  metaTemplateId?: string | null;
  approvalStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
}

const STARTERS: Partial<Template>[] = [
  {
    name: 'test_reminder_he',
    category: 'utility',
    language: 'he',
    body: 'שלום {{1}}, תזכורת ידידותית מ-AutoLog: הטסט השנתי של הרכב {{2}} מסתיים ב-{{3}}. רוצה לקבוע מוסך? ענה כאן ונדאג לך 🚗',
    variables: ['שם הלקוח', 'מספר רכב', 'תאריך פקיעה'],
    footer: 'AutoLog — כל מה שהרכב שלך צריך',
  },
  {
    name: 'service_due_he',
    category: 'utility',
    language: 'he',
    body: 'היי {{1}}, הרכב {{2}} עומד להגיע ל-{{3}} ק"מ ויש טיפול שמומלץ לעשות. רוצה שנמצא מוסך זמין השבוע?',
    variables: ['שם הלקוח', 'מספר רכב', 'קילומטראז׳ נוכחי'],
    footer: 'AutoLog',
  },
  {
    name: 'welcome_new_user_he',
    category: 'marketing',
    language: 'he',
    body: 'ברוך הבא ל-AutoLog, {{1}}! הוספנו את הרכב שלך לתיק הדיגיטלי. תזכורות לטסט ולטיפול יגיעו אוטומטית 👍',
    variables: ['שם משתמש'],
    footer: 'AutoLog — תיק רכב חכם',
  },
];

const STATUS_META: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger'; icon: React.ReactNode }> = {
  draft:     { label: 'טיוטה',   variant: 'default', icon: <Clock size={14} /> },
  submitted: { label: 'הוגש',    variant: 'warning', icon: <Clock size={14} /> },
  approved:  { label: 'מאושר',   variant: 'success', icon: <CheckCircle2 size={14} /> },
  rejected:  { label: 'נדחה',    variant: 'danger',  icon: <AlertCircle size={14} /> },
};

export default function WhatsAppTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Template>>({
    name: '',
    language: 'he',
    category: 'utility',
    body: '',
    variables: [],
    footer: '',
    approvalStatus: 'draft',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/social/whatsapp-templates');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'טעינה נכשלה');
      setTemplates(data.templates);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.body) {
      toast.error('שם וטקסט הם שדות חובה');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/social/whatsapp-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שמירה נכשלה');
      toast.success('נשמר');
      setShowModal(false);
      setForm({
        name: '', language: 'he', category: 'utility', body: '',
        variables: [], footer: '', approvalStatus: 'draft',
      });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setSaving(false);
    }
  };

  const startFromTemplate = (t: Partial<Template>) => {
    setForm({ ...t, approvalStatus: 'draft' });
    setShowModal(true);
  };

  const copyBody = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success('הועתק');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          <MessageCircle size={20} className="inline ms-1" /> תבניות WhatsApp
        </h3>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} className="ms-1" /> תבנית חדשה
        </Button>
      </div>

      <Card>
        <CardTitle><Sparkles size={18} className="inline ms-1" /> תבניות לדוגמה (לאוטולוג)</CardTitle>
        <p className="text-xs text-gray-500 mt-1">לחץ "השתמש" ועריך לפני שליחה לאישור Meta</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {STARTERS.map((s) => (
            <div key={s.name} className="border rounded-lg p-3 bg-gray-50">
              <div className="text-xs font-mono text-gray-500 mb-1">{s.name}</div>
              <p className="text-sm text-gray-800 mb-2 line-clamp-3 whitespace-pre-wrap">{s.body}</p>
              <Button size="sm" variant="secondary" onClick={() => startFromTemplate(s)}>
                השתמש
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="animate-spin mx-auto text-blue-500" size={28} />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-500">
            <MessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm">אין תבניות שמורות. צור אחת מהדוגמאות שלמעלה.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardTitle>התבניות שלי</CardTitle>
          <div className="mt-3 divide-y divide-gray-100">
            {templates.map((t) => (
              <div key={t.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-sm font-medium">{t.name}</span>
                      <Badge variant={STATUS_META[t.approvalStatus]?.variant ?? 'default'}>
                        {STATUS_META[t.approvalStatus]?.label}
                      </Badge>
                      <Badge variant="default">{t.category}</Badge>
                      <span className="text-xs text-gray-400">{t.language}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.body}</p>
                    {t.variables.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        משתנים: {t.variables.map((v, i) => `{{${i+1}}} = ${v}`).join(' · ')}
                      </p>
                    )}
                    {t.metaTemplateId && (
                      <p className="text-xs text-green-600 mt-1">Meta ID: {t.metaTemplateId}</p>
                    )}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => copyBody(t.body)}>
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
        <strong>הערה:</strong> כדי לשלוח הודעות WhatsApp ללקוחות, התבנית חייבת להיות
        מאושרת ע"י Meta דרך WhatsApp Manager. אחרי האישור, הדבק את ה-ID שקיבלת
        כאן בשדה "Meta Template ID" כדי שהמערכת תוכל לשלוח אוטומטית.
      </div>

      {showModal && (
        <Modal isOpen={showModal} title="תבנית WhatsApp" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <Input
              label="שם (אנגלית, _ בלבד)"
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="test_reminder_he"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">קטגוריה</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as 'marketing' | 'utility' | 'authentication' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="utility">utility (תפעולי)</option>
                  <option value="marketing">marketing (שיווקי)</option>
                  <option value="authentication">authentication (OTP)</option>
                </select>
              </div>
              <Input
                label="שפה"
                value={form.language ?? 'he'}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">טקסט (השתמש ב-{'{{1}}'}, {'{{2}}'} למשתנים)</label>
              <textarea
                value={form.body ?? ''}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <Input
              label="כותרת תחתית (אופציונלי)"
              value={form.footer ?? ''}
              onChange={(e) => setForm({ ...form, footer: e.target.value })}
            />
            <Input
              label="Meta Template ID (אחרי אישור)"
              value={form.metaTemplateId ?? ''}
              onChange={(e) => setForm({ ...form, metaTemplateId: e.target.value })}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>ביטול</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'שמור'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
