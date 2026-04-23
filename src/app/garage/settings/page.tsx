'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import NextImage from 'next/image';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import VoiceMicButton from '@/components/ui/VoiceMicButton';
import {
  Settings, Save, Loader2, MapPin, Phone, Mail, Clock,
  CheckCircle2, AlertCircle, Wifi, Coffee, Tv, Car, Baby, Armchair,
  Droplets, ParkingCircle, CreditCard, Accessibility, Shield, Wind,
  Wrench, Zap, Globe, Camera, Image, Upload, X, Trash2, Plus, Star
} from 'lucide-react';

interface GarageProfile {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  description: string;
  services: string[];
  workingHours: Record<string, { open: string; close: string; closed?: boolean }>;
  amenities: string[];
  languages: string[];
  rating: number;
  reviewCount: number;
}

const defaultWorkingHours: Record<string, { open: string; close: string; closed?: boolean }> = {
  sunday: { open: '08:00', close: '18:00' },
  monday: { open: '08:00', close: '18:00' },
  tuesday: { open: '08:00', close: '18:00' },
  wednesday: { open: '08:00', close: '18:00' },
  thursday: { open: '08:00', close: '18:00' },
  friday: { open: '08:00', close: '13:00' },
  saturday: { open: '00:00', close: '00:00', closed: true },
};

const dayLabels: Record<string, string> = {
  sunday: 'ראשון',
  monday: 'שני',
  tuesday: 'שלישי',
  wednesday: 'רביעי',
  thursday: 'חמישי',
  friday: 'שישי',
  saturday: 'שבת',
};

const allServices = [
  // טיפולים שוטפים
  'טסט שנתי', 'שמן ומסננים', 'בלמים', 'צמיגים', 'מיזוג אוויר',
  'חשמל רכב', 'בדיקת קניה', 'תיקון שלדה', 'פחחות וצבע', 'גיר אוטומט',
  // מנוע והנעה
  'תיקון מנוע', 'תיקון טורבו', 'רצועת טיימינג', 'מערכת פליטה', 'מערכת קירור',
  'מערכת דלק / הזרקה', 'גיר ידני', 'מצמד (קלאץ׳)', 'דיפרנציאל',
  // מתלים והיגוי
  'בולמי זעזועים', 'זרועות מתלה', 'הגה כוח', 'איזון וכיוון',
  // חשמל ואלקטרוניקה
  'מחשב רכב (ECU)', 'מערכת התנעה', 'מערכת טעינה', 'תאורה ופנסים', 'חיישנים וסנסורים',
  // רכב פרטי מיוחד
  'רכבי יוקרה', 'רכבים היברידיים', 'רכבים חשמליים', 'ג׳יפים ושטח',
  // שירותים נוספים
  'גרירה', 'שירות עד הבית', 'ליסינג / השכרה', 'מכירת חלפים',
];

const amenityOptions = [
  { key: 'wifi', label: 'WiFi', icon: <Wifi size={16} /> },
  { key: 'coffee', label: 'קפה / שתייה', icon: <Coffee size={16} /> },
  { key: 'waiting_room', label: 'חדר המתנה ממוזג', icon: <Armchair size={16} /> },
  { key: 'tv', label: 'טלוויזיה', icon: <Tv size={16} /> },
  { key: 'shuttle', label: 'הסעה / רכב חלופי', icon: <Car size={16} /> },
  { key: 'children_area', label: 'פינת ילדים', icon: <Baby size={16} /> },
  { key: 'parking', label: 'חניה ללקוחות', icon: <ParkingCircle size={16} /> },
  { key: 'restroom', label: 'שירותים', icon: <Droplets size={16} /> },
  { key: 'credit_card', label: 'תשלום באשראי', icon: <CreditCard size={16} /> },
  { key: 'accessible', label: 'נגישות לנכים', icon: <Accessibility size={16} /> },
  { key: 'security_camera', label: 'מצלמות אבטחה', icon: <Shield size={16} /> },
  { key: 'ac', label: 'מקום מקורה', icon: <Wind size={16} /> },
  { key: 'tools_shop', label: 'חנות חלפים', icon: <Wrench size={16} /> },
  { key: 'ev_charger', label: 'עמדת טעינה חשמלית', icon: <Zap size={16} /> },
];

const languageOptions = [
  { key: 'hebrew', label: 'עברית', code: 'HE' },
  { key: 'arabic', label: 'ערבית', code: 'AR' },
  { key: 'russian', label: 'רוסית', code: 'RU' },
  { key: 'english', label: 'אנגלית', code: 'EN' },
  { key: 'amharic', label: 'אמהרית', code: 'AM' },
  { key: 'french', label: 'צרפתית', code: 'FR' },
  { key: 'spanish', label: 'ספרדית', code: 'ES' },
  { key: 'romanian', label: 'רומנית', code: 'RO' },
  { key: 'tigrinya', label: 'תיגרינית', code: 'TI' },
  { key: 'portuguese', label: 'פורטוגזית', code: 'PT' },
  { key: 'georgian', label: 'גאורגית', code: 'KA' },
  { key: 'turkish', label: 'טורקית', code: 'TR' },
];

export default function GarageSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<GarageProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [workingHours, setWorkingHours] = useState(defaultWorkingHours);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['hebrew']);

  // Image state
  const [logo, setLogo] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    loadProfile();
    loadImages();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/garage/profile');
      if (res.ok) {
        const data = await res.json();
        const g = data.garage;
        setProfile(g);
        setName(g.name || '');
        setAddress(g.address || '');
        setCity(g.city || '');
        setPhone(g.phone || '');
        setEmail(g.email || '');
        setDescription(g.description || '');
        setServices(safeJsonParse(g.services) || []);
        setWorkingHours(safeJsonParse(g.workingHours) || defaultWorkingHours);
        setAmenities(safeJsonParse(g.amenities) || []);
        setLanguages(safeJsonParse(g.languages) || ['hebrew']);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading profile:', err);
      }
      setError('שגיאה בטעינת פרופיל המוסך');
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    try {
      const res = await fetch('/api/garage/images');
      if (res.ok) {
        const data = await res.json();
        setLogo(data.logo);
        setGallery(data.gallery || []);
      }
    } catch {
      // Silent fail — images are optional
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /** Compress image to max dimensions and JPEG; falls back to raw base64 */
  const compressImage = (file: File, maxPx = 1200): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      const timeout = setTimeout(() => { URL.revokeObjectURL(url); fileToBase64(file).then(resolve).catch(() => resolve('')); }, 5000);
      img.onload = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        try {
          let w = img.width, h = img.height;
          if (w > maxPx || h > maxPx) {
            if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
            else { w = Math.round(w * maxPx / h); h = maxPx; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) { fileToBase64(file).then(resolve); return; }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch { fileToBase64(file).then(resolve); }
      };
      img.onerror = () => { clearTimeout(timeout); URL.revokeObjectURL(url); fileToBase64(file).then(resolve).catch(() => resolve('')); };
      img.src = url;
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      setError('');
      const base64 = await compressImage(file, 800);
      const res = await fetch('/api/garage/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'logo', image: base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogo(data.logo);
      toast.success('הלוגו הועלה בהצלחה');
    } catch {
      setError('לא הצלחנו להעלות את הלוגו. ודא שהקובץ הוא תמונה תקינה ונסה שוב.');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    try {
      setUploadingLogo(true);
      const res = await fetch('/api/garage/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'logo' }),
      });
      if (res.ok) setLogo(null);
    } catch {
      setError('שגיאה במחיקת הלוגו');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (gallery.length + files.length > 10) {
      setError('ניתן להעלות עד 10 תמונות לגלריה');
      return;
    }
    try {
      setUploadingGallery(true);
      setError('');
      const base64Images: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i], 1200);
        if (compressed) base64Images.push(compressed);
      }
      if (!base64Images.length) {
        setError('לא נמצאו תמונות תקינות');
        return;
      }
      const res = await fetch('/api/garage/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'gallery', images: base64Images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGallery(prev => [...prev, ...(data.uploaded || [])]);
    } catch {
      setError('לא הצלחנו להעלות את התמונות. ודא שהקבצים תקינים ונסה שוב.');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleDeleteGalleryImage = async (imageUrl: string) => {
    try {
      const res = await fetch('/api/garage/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (res.ok) {
        setGallery(prev => prev.filter(url => url !== imageUrl));
      }
    } catch {
      setError('שגיאה במחיקת התמונה');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSaved(false);

      const res = await fetch('/api/garage/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          city,
          phone,
          email,
          description,
          services,
          workingHours,
          amenities,
          languages,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'שגיאה בשמירה');
      }

      toast.success('הפרופיל נשמר בהצלחה');
      setTimeout(() => router.push('/garage'), 600);
      return;
    } catch {
      setError('לא הצלחנו לשמור את הפרופיל. בדוק את החיבור לאינטרנט ונסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (service: string) => {
    setServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleLanguage = (lang: string) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const updateHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-12 lg:pt-0 animate-pulse" dir="rtl">
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-lg" /><div className="h-6 bg-gray-200 rounded w-36" /></div>
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div className="flex justify-center"><div className="w-24 h-24 bg-gray-100 rounded-xl" /></div>
          {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-gray-50 rounded-lg" />)}
        </div>
        <div className="bg-white rounded-xl p-6 space-y-3">
          {[1,2].map(i => <div key={i} className="h-10 bg-gray-50 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <Settings size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">הגדרות מוסך</h1>
            <p className="text-sm text-gray-500">ניהול פרופיל ושירותים</p>
          </div>
        </div>
        {profile && (
          <div className="flex items-center gap-2">
            <Badge variant="info">{profile.reviewCount} ביקורות</Badge>
            <Badge variant="success"><Star size={14} className="inline" /> {profile.rating.toFixed(1)}</Badge>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <h2 className="text-lg font-bold text-gray-800 mb-4">פרטים בסיסיים</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="שם המוסך" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="עיר" value={city} onChange={e => setCity(e.target.value)} required />
          <Input label="כתובת" value={address} onChange={e => setAddress(e.target.value)} icon={<MapPin size={16} />} />
          <Input label="טלפון" value={phone} onChange={e => setPhone(e.target.value)} icon={<Phone size={16} />} />
          <Input label="אימייל" value={email} onChange={e => setEmail(e.target.value)} type="email" icon={<Mail size={16} />} />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">תיאור המוסך</label>
          <div className="flex items-start gap-2">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              placeholder="תיאור קצר של המוסך, התמחויות, וניסיון..."
            />
            <VoiceMicButton value={description} onResult={v => setDescription(v)} size="md" className="mt-1" />
          </div>
        </div>
      </Card>

      {/* Logo & Gallery */}
      <Card>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Camera size={20} />
          תמונות המוסך
        </h2>
        <p className="text-sm text-gray-500 mb-5">הוסף לוגו ותמונות של המוסך מבפנים ומבחוץ. תמונות טובות מגדילות אמון ומושכות לקוחות.</p>

        {/* Logo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">לוגו / תמונת פרופיל</label>
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0 group">
              {logo ? (
                <>
                  <NextImage src={`${logo}?t=${Date.now()}`} alt="לוגו המוסך" fill sizes="112px" className="object-cover" />
                  <button
                    onClick={handleDeleteLogo}
                    className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    title="מחק לוגו"
                    aria-label="מחק לוגו"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="text-center text-gray-400">
                  <Camera size={28} className="mx-auto mb-1" />
                  <span className="text-xs">לוגו</span>
                </div>
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                  <Loader2 size={22} className="animate-spin text-emerald-600" />
                </div>
              )}
            </div>
            <div>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-emerald-100 transition border border-emerald-200">
                <Upload size={16} />
                {logo ? 'החלף לוגו' : 'העלה לוגו'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">JPEG, PNG או WebP. עד 5MB.</p>
            </div>
          </div>
        </div>

        {/* Gallery Upload */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-700">גלריית תמונות <span className="font-normal text-gray-400">({gallery.length}/10)</span></label>
            {gallery.length < 10 && (
              <div className="flex gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg cursor-pointer hover:bg-emerald-100 transition border border-emerald-200">
                  <Camera size={14} />
                  צלם
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg cursor-pointer hover:bg-emerald-100 transition border border-emerald-200">
                  <Plus size={14} />
                  מגלריה
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-3">העלה תמונות מהמוסך מבפנים ומבחוץ, ציוד, אזור המתנה, חניה ועוד.</p>

          {uploadingGallery && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm mb-3">
              <Loader2 size={16} className="animate-spin" />
              מעלה תמונות...
            </div>
          )}

          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {gallery.map((url, idx) => (
                <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <NextImage src={url} alt={`תמונה ${idx + 1}`} fill sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover" />
                  <button
                    onClick={() => handleDeleteGalleryImage(url)}
                    className="absolute top-1.5 left-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-md"
                    title="מחק תמונה"
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition">
                    <span className="text-white text-[10px]">{idx + 1}/{gallery.length}</span>
                  </div>
                </div>
              ))}
              {gallery.length < 10 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-500 cursor-pointer transition bg-gray-50">
                  <Plus size={24} />
                  <span className="text-xs mt-1">הוסף</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-emerald-400 hover:text-emerald-500 cursor-pointer transition bg-gray-50">
              <Image size={36} className="mb-2" />
              <span className="text-sm font-medium">לחץ להעלאת תמונות</span>
              <span className="text-xs mt-1">תמונות מבפנים, מבחוץ, ציוד, חניה ועוד</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleGalleryUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </Card>

      {/* Services */}
      <Card>
        <h2 className="text-lg font-bold text-gray-800 mb-4">שירותים</h2>
        <div className="flex flex-wrap gap-2">
          {allServices.map(service => (
            <button
              key={service}
              onClick={() => toggleService(service)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                services.includes(service)
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {service}
            </button>
          ))}
        </div>
      </Card>

      {/* Working Hours */}
      <Card>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={20} />
          שעות פעילות
        </h2>
        <div className="space-y-3">
          {Object.entries(dayLabels).map(([day, label]) => (
            <div key={day} className="flex items-center gap-3 flex-wrap">
              <span className="w-16 text-sm font-medium text-gray-700">{label}</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!workingHours[day]?.closed}
                  onChange={e => updateHours(day, 'closed', !e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-gray-500">פתוח</span>
              </label>
              {!workingHours[day]?.closed && (
                <>
                  <input
                    type="time"
                    value={workingHours[day]?.open || '08:00'}
                    onChange={e => updateHours(day, 'open', e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="time"
                    value={workingHours[day]?.close || '18:00'}
                    onChange={e => updateHours(day, 'close', e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </>
              )}
              {workingHours[day]?.closed && (
                <span className="text-sm text-gray-400">סגור</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Amenities */}
      <Card>
        <h2 className="text-lg font-bold text-gray-800 mb-4">מתקנים</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {amenityOptions.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => toggleAmenity(key)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
                amenities.includes(key)
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Languages */}
      <Card>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Globe size={20} />
          שפות שירות
        </h2>
        <p className="text-sm text-gray-500 mb-3">באילו שפות ניתן לקבל שירות במוסך?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {languageOptions.map(({ key, label, code }) => (
            <button
              key={key}
              onClick={() => toggleLanguage(key)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
                languages.includes(key)
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                languages.includes(key) ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-500'
              }`}>{code}</span>
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-start gap-3">
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm">
            <CheckCircle2 size={16} />
            נשמר בהצלחה
          </div>
        )}
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={!name.trim() || !city.trim() || !phone.trim()}
          icon={<Save size={16} />}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          שמור שינויים
        </Button>
      </div>
    </div>
  );
}

function safeJsonParse(value: string | null | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
