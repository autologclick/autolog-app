'use client';

/**
 * Graphic Editor — second tab of /admin/social.
 *
 * A lightweight in-browser composer that produces shareable graphics in the
 * AutoLog brand palette. Three template types (post / story / wide), live
 * preview with the AutoLog logo overlaid, and export-to-PNG via html2canvas
 * (already installed in this project — see package.json).
 *
 * The PNG is uploaded to Vercel Blob via the existing /api/admin/social/generate-image
 * route? No — we keep it simple: this tab downloads to local disk, and the
 * admin can attach the file to a new post in the generator tab.
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Download, Image as ImageIcon, Palette, Loader2, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BRAND } from '@/lib/social/brand-voice';

type TemplateSize = 'square' | 'story' | 'wide';

const SIZE_DIMENSIONS: Record<TemplateSize, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: 'מרובע (פוסט פייסבוק / IG)' },
  story:  { w: 1080, h: 1920, label: 'סטורי אנכי (9:16)' },
  wide:   { w: 1200, h: 628,  label: 'רוחב (לינק / באנר)' },
};

const PRESET_PALETTES = [
  { name: 'מותג ראשי',  bg: BRAND.colors.primary,     text: '#FFFFFF', accent: BRAND.colors.accent },
  { name: 'בהיר נקי',   bg: '#FFFFFF',                  text: BRAND.colors.text, accent: BRAND.colors.primary },
  { name: 'אמבר חם',    bg: BRAND.colors.accent,        text: '#1F2937', accent: BRAND.colors.primary },
  { name: 'כהה מודרני', bg: '#0F172A',                  text: '#FFFFFF', accent: BRAND.colors.accent },
];

export default function GraphicEditor() {
  const [size, setSize] = useState<TemplateSize>('square');
  const [palette, setPalette] = useState(PRESET_PALETTES[0]);
  const [headline, setHeadline] = useState('הרכב שלך, תמיד מתחת לעין');
  const [subtitle, setSubtitle] = useState('תזכורות חכמות לטסט, טיפול ומסמכים — באפליקציה אחת');
  const [cta, setCta] = useState('הורידו את AutoLog');
  const [showLogo, setShowLogo] = useState(true);
  const [exporting, setExporting] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dims = SIZE_DIMENSIONS[size];

  // Scale the on-screen preview so it fits — actual export uses real pixel size
  const previewScale = size === 'story' ? 0.25 : size === 'wide' ? 0.35 : 0.3;

  const handleExport = async () => {
    if (!stageRef.current) return;
    setExporting(true);
    try {
      // Dynamic import so SSR doesn't choke
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(stageRef.current, {
        backgroundColor: null,
        scale: 1,           // stage is already at full pixel size; CSS transform handles preview
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `autolog-${size}-${Date.now()}.png`;
      a.click();
      toast.success('הגרפיקה ירדה למחשב');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה בייצוא');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Controls */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardTitle><Palette size={20} className="inline ms-1" /> תבנית</CardTitle>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(Object.keys(SIZE_DIMENSIONS) as TemplateSize[]).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`p-2 border rounded text-xs ${
                  size === s ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                }`}
              >
                {SIZE_DIMENSIONS[s].label}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>סגנון</CardTitle>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PRESET_PALETTES.map((p) => (
              <button
                key={p.name}
                onClick={() => setPalette(p)}
                className={`p-3 rounded-lg border-2 text-right ${
                  palette.name === p.name ? 'border-blue-600' : 'border-transparent'
                }`}
                style={{ backgroundColor: p.bg, color: p.text }}
              >
                <div className="text-xs font-medium">{p.name}</div>
                <div className="text-[10px] opacity-70 mt-1">Aa כותרת</div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>טקסט</CardTitle>
          <div className="space-y-3 mt-3">
            <Input
              label="כותרת"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={60}
            />
            <Input
              label="כותרת משנה"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              maxLength={120}
            />
            <Input
              label="קריאה לפעולה"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              maxLength={40}
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
              />
              הצג לוגו AutoLog
            </label>
          </div>
        </Card>

        <Button
          onClick={handleExport}
          disabled={exporting}
          className="w-full"
        >
          {exporting ? (
            <><Loader2 size={18} className="animate-spin ms-2" /> מייצא…</>
          ) : (
            <><Download size={18} className="ms-2" /> ייצא PNG</>
          )}
        </Button>
      </div>

      {/* Live preview stage */}
      <div className="lg:col-span-2">
        <Card>
          <CardTitle>תצוגה מקדימה ({dims.w}×{dims.h})</CardTitle>
          <div className="mt-4 flex justify-center bg-gray-100 rounded-lg p-4 overflow-hidden">
            <div
              style={{
                width: dims.w * previewScale,
                height: dims.h * previewScale,
              }}
              className="relative"
            >
              {/* Actual stage — full size, scaled down via CSS transform */}
              <div
                ref={stageRef}
                style={{
                  width: dims.w,
                  height: dims.h,
                  backgroundColor: palette.bg,
                  color: palette.text,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top right',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  fontFamily: BRAND.fontFamilies.heading,
                  direction: 'rtl',
                }}
                className="overflow-hidden"
              >
                {/* Accent stripe */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    insetInlineStart: 0,
                    width: '12px',
                    height: '100%',
                    backgroundColor: palette.accent,
                  }}
                />

                {/* Logo */}
                {showLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={BRAND.logo.svg}
                    alt="AutoLog"
                    style={{
                      position: 'absolute',
                      top: 60,
                      insetInlineEnd: 60,
                      width: size === 'story' ? 180 : 140,
                      height: 'auto',
                      filter: palette.bg === '#FFFFFF' ? 'none' : 'brightness(0) invert(1)',
                    }}
                  />
                )}

                {/* Headline */}
                <div
                  style={{
                    position: 'absolute',
                    top: size === 'story' ? '40%' : '38%',
                    insetInlineEnd: 80,
                    insetInlineStart: 80,
                    fontSize: size === 'wide' ? 88 : 120,
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: palette.text,
                  }}
                >
                  {headline}
                </div>

                {/* Subtitle */}
                <div
                  style={{
                    position: 'absolute',
                    top: size === 'story' ? '58%' : '62%',
                    insetInlineEnd: 80,
                    insetInlineStart: 80,
                    fontSize: size === 'wide' ? 36 : 52,
                    fontWeight: 400,
                    lineHeight: 1.35,
                    color: palette.text,
                    opacity: 0.85,
                  }}
                >
                  {subtitle}
                </div>

                {/* CTA */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 80,
                    insetInlineEnd: 80,
                    backgroundColor: palette.accent,
                    color: '#0F172A',
                    padding: '24px 56px',
                    borderRadius: 999,
                    fontSize: 44,
                    fontWeight: 700,
                  }}
                >
                  {cta}
                </div>

                {/* URL footer */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 40,
                    insetInlineStart: 80,
                    fontSize: 28,
                    opacity: 0.55,
                  }}
                >
                  {BRAND.url.replace('https://', '')}
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            הייצוא יתבצע ברזולוציה המלאה ({dims.w}×{dims.h})
          </p>
        </Card>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
          <div className="flex gap-2">
            <ImageIcon size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <strong>טיפ:</strong> אחרי ייצוא הגרפיקה למחשב, חזור לטאב "מחולל פוסטים",
              צור טקסט מתאים, ובחר את התמונה שהורדת כככמדיה לפוסט. רוצה תמונה שנוצרה
              ע"י AI במקום? לחץ "צור תמונה תואמת" בטאב המחולל אחרי שיצרת פוסט.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
