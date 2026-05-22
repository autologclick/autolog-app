'use client';

/**
 * AI Post Generator — first tab of /admin/social.
 *
 * Lets the admin:
 *   1. Pick a platform (FB / IG / IG Story / WhatsApp)
 *   2. Pick an occasion (test reminder, holiday, promo …) or write free text
 *   3. Optionally add tone / extra context
 *   4. Call /api/admin/social/generate (Claude with AutoLog brand voice)
 *   5. Preview, edit, and save as draft / schedule / publish
 */

import { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import {
  Sparkles, Loader2, Send, Save, Calendar, Image as ImageIcon,
  Facebook, Instagram, MessageCircle, Wand2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CONTENT_OCCASIONS } from '@/lib/social/brand-voice';

type Platform = 'facebook' | 'instagram' | 'instagram_story' | 'whatsapp';

interface Generated {
  caption: string;
  hashtags: string;
  callToAction: string;
  imagePrompt: string;
}

const PLATFORM_BUTTONS: { id: Platform; label: string; icon: React.ReactNode }[] = [
  { id: 'facebook', label: 'פייסבוק', icon: <Facebook size={18} /> },
  { id: 'instagram', label: 'אינסטגרם', icon: <Instagram size={18} /> },
  { id: 'instagram_story', label: 'IG סטורי', icon: <Instagram size={18} /> },
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={18} /> },
];

interface Props {
  onPostSaved?: () => void;
}

export default function PostGenerator({ onPostSaved }: Props) {
  const [platform, setPlatform] = useState<Platform>('facebook');
  const [occasion, setOccasion] = useState<string>('custom');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('');
  const [extraContext, setExtraContext] = useState('');

  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [result, setResult] = useState<Generated | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  const [scheduleFor, setScheduleFor] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('כתוב על מה הפוסט');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, occasion, prompt, tone, extraContext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'יצירת הפוסט נכשלה');
      setResult(data);
      toast.success('הפוסט נוצר. אפשר לערוך לפני הפרסום.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    const imagePrompt = result?.imagePrompt;
    if (!imagePrompt) {
      toast.error('אין הצעת תמונה — צור פוסט קודם');
      return;
    }
    setGeneratingImage(true);
    try {
      const isStory = platform === 'instagram_story';
      const res = await fetch('/api/admin/social/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${imagePrompt}. סגנון: גרפי נקי, נעים, מתאים למותג AutoLog.`,
          size: isStory ? '1024x1792' : '1024x1024',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'יצירת התמונה נכשלה');
      setImageUrl(data.url);
      toast.success('התמונה מוכנה');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSave = async (mode: 'draft' | 'schedule') => {
    if (!result) return;
    if (mode === 'schedule' && !scheduleFor) {
      toast.error('בחר זמן לתזמון');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          caption: result.caption,
          hashtags: result.hashtags,
          callToAction: result.callToAction,
          mediaUrls: imageUrl ? [imageUrl] : [],
          scheduledFor: mode === 'schedule' ? new Date(scheduleFor).toISOString() : undefined,
          aiPrompt: prompt,
          aiModel: 'claude-sonnet-4-6',
          status: mode === 'schedule' ? 'scheduled' : 'draft',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שמירה נכשלה');
      toast.success(mode === 'schedule' ? 'הפוסט תוזמן' : 'נשמר כטיוטה');
      onPostSaved?.();
      // reset
      setResult(null);
      setImageUrl('');
      setPrompt('');
      setExtraContext('');
      setTone('');
      setScheduleFor('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <Card>
        <CardTitle>
          <Sparkles size={20} className="inline ms-1" /> מחולל פוסטים AI
        </CardTitle>

        {/* Platform */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">פלטפורמה</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_BUTTONS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                  platform === p.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Occasion */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">סוג התוכן</label>
          <select
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {CONTENT_OCCASIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Prompt */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">על מה הפוסט?</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="למשל: תזכורת לבעלי רכבים שטסט שנתי מתקרב עם קריאה להוריד את האפליקציה"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <Input
            placeholder="טון (אופציונלי) - חמים, רציני…"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          />
          <Input
            placeholder="הקשר נוסף (אופציונלי)"
            value={extraContext}
            onChange={(e) => setExtraContext(e.target.value)}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-4 w-full"
        >
          {generating ? (
            <><Loader2 size={18} className="animate-spin ms-2" /> יוצר…</>
          ) : (
            <><Wand2 size={18} className="ms-2" /> צור פוסט</>
          )}
        </Button>
      </Card>

      {/* Preview / edit / save */}
      <Card>
        <CardTitle>תצוגה מקדימה</CardTitle>
        {!result ? (
          <div className="mt-6 text-center text-gray-500 text-sm py-12 border-2 border-dashed border-gray-200 rounded-lg">
            התוצאה תופיע כאן אחרי שתלחץ "צור פוסט"
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="generated" className="w-full rounded-lg border" />
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <ImageIcon size={32} className="mx-auto text-gray-400" />
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={handleGenerateImage}
                  disabled={generatingImage}
                >
                  {generatingImage ? (
                    <><Loader2 size={16} className="animate-spin ms-1" /> יוצר תמונה…</>
                  ) : (
                    'צור תמונה תואמת'
                  )}
                </Button>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">טקסט הפוסט</label>
              <textarea
                value={result.caption}
                onChange={(e) => setResult({ ...result, caption: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">האשטגים</label>
              <Input
                value={result.hashtags}
                onChange={(e) => setResult({ ...result, hashtags: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Badge variant="success">{platform}</Badge>
              <span>{result.caption.length} תווים</span>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">תזמן ל:</label>
                <input
                  type="datetime-local"
                  value={scheduleFor}
                  onChange={(e) => setScheduleFor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="flex-1"
                >
                  <Save size={16} className="ms-1" /> שמור טיוטה
                </Button>
                <Button
                  onClick={() => handleSave('schedule')}
                  disabled={saving || !scheduleFor}
                  className="flex-1"
                >
                  <Calendar size={16} className="ms-1" /> תזמן
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
