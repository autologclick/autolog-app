'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2, User, Mail, Phone, MapPin, FileText,
  Wrench, Clock, Users, Award, CheckCircle2, ArrowRight,
  Loader2, AlertCircle, Send, Camera, Image, X, Plus
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

const SERVICE_OPTIONS = [
  { id: 'inspection', label: 'בדיקות רכב' },
  { id: 'maintenance', label: 'טיפולים שוטפים' },
  { id: 'repair', label: 'תיקונים כלליים' },
  { id: 'test_prep', label: 'הכנה לטסט' },
  { id: 'tires', label: 'צמיגים ואיזון' },
  { id: 'bodywork', label: 'פחחות וצבע' },
  { id: 'electrical', label: 'חשמל רכב' },
  { id: 'ac', label: 'מיזוג אוויר' },
  { id: 'gearbox', label: 'גיר ותיבת הילוכים' },
  { id: 'alignment', label: 'כיוון גלגלים' },
  { id: 'brakes', label: 'בלמים' },
  { id: 'suspension', label: 'מתלים והיגוי' },
  { id: 'exhaust', label: 'מערכת פליטה' },
  { id: 'diagnostics', label: 'אבחון ממוחשב' },
  { id: 'battery', label: 'מצברים וסוללות' },
  { id: 'oil_fluids', label: 'שמנים ונוזלים' },
  { id: 'hybrid_ev', label: 'היברידי/חשמלי' },
  { id: 'glass', label: 'שמשות וזגוגית' },
  { id: 'locksmith', label: 'מנעולנות רכב' },
  { id: 'towing', label: 'גרירה וחילוץ' },
];

const LANGUAGE_OPTIONS = [
  { id: 'hebrew', label: 'עברית' },
  { id: 'arabic', label: 'ערבית' },
  { id: 'russian', label: 'רוסית' },
  { id: 'english', label: 'אנגלית' },
  { id: 'amharic', label: 'אמהרית' },
  { id: 'french', label: 'צרפתית' },
  { id: 'spanish', label: 'ספרדית' },
  { id: 'romanian', label: 'רומנית' },
];

const CITIES = [
  'תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'ראשון לציון',
  'פתח תקווה', 'אשדוד', 'נתניה', 'חולון', 'בני ברק',
  'רמת גן', 'אשקלון', 'הרצליה', 'כפר סבא', 'רעננה',
  'מודיעין', 'לוד', 'רמלה', 'נהריה', 'עכו', 'אילת', 'אחר',
];

export default function GarageApplyPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['hebrew']);
  const [imagePreviews, setImagePreviews] = useState<{ file: File; preview: string }[]>([]);

  const [form, setForm] = useState({
    garageName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    description: '',
    yearsExperience: '',
    employeeCount: '',
    licenseNumber: '',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleLanguage = (id: string) => {
    setSelectedLanguages(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 6 - imagePreviews.length;
    if (remaining <= 0) {
      setError('ניתן להעלות עד 6 תמונות');
      return;
    }
    const newPreviews: { file: File; preview: string }[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) continue;
      if (!file.type.startsWith('image/')) continue;
      newPreviews.push({ file, preview: URL.createObjectURL(file) });
    }
    setImagePreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeImagePreview = (index: number) => {
    setImagePreviews(prev => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const validateStep1 = () => {
    if (!form.garageName.trim()) return 'נא להזין את שם המוסך';
    if (!form.ownerName.trim()) return 'נא להזין את שם בעל המוסך';
    if (!form.email.trim()) return 'נא להזין כתובת אימייל';
    if (!form.phone.trim()) return 'נא להזין מספר טלפון';
    if (!form.city) return 'נא לבחור עיר';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Convert images to base64
      const imageData: string[] = [];
      for (const img of imagePreviews) {
        const b64 = await fileToBase64(img.file);
        imageData.push(b64);
      }

      const res = await fetch('/api/garage-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          services: selectedServices,
          languages: selectedLanguages,
          yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : 0,
          employeeCount: form.employeeCount ? parseInt(form.employeeCount) : 1,
          images: imageData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה בשליחת הבקשה');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('שגיאת חיבור. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f] mb-3">הבקשה נשלחה בהצלחה!</h1>
            <p className="text-gray-500 mb-6 leading-relaxed">
              תודה על ההתעניינות! צוות AutoLog יבדוק את הבקשה שלך ויחזור אליך תוך 1-3 ימי עסקים.
            </p>
            <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-right">
              <h3 className="font-bold text-emerald-800 text-sm mb-2">מה קורה עכשיו?</h3>
              <ul className="text-sm text-emerald-700 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">1.</span>
                  <span>הצוות שלנו בודק את פרטי הבקשה</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">2.</span>
                  <span>נצור איתך קשר לתיאום</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">3.</span>
                  <span>לאחר אישור — תקבל גישה מלאה למערכת</span>
                </li>
              </ul>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium transition"
            >
              <ArrowRight size={16} />
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <Link href="/auth/login" className="text-sm text-gray-500 hover:text-[#1e3a5f] transition">
            כניסה למערכת
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <Building2 size={14} />
            <span>בקשת הצטרפות למוסכים</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#1e3a5f] mb-3">הצטרף כמוסך שותף</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            מלא את הפרטים ונחזור אליך בהקדם. ההצטרפות כמוסך שותף היא בחינם.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
            step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            <span>1</span>
            <span className="hidden sm:inline">פרטי המוסך</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
            step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            <span>2</span>
            <span className="hidden sm:inline">מידע נוסף</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Error */}
          {error && (
            <div className="mx-6 mt-6 flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="p-6 space-y-5">
              <h2 className="text-lg font-bold text-[#1e3a5f]">פרטי המוסך ובעל העסק</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Building2 size={14} className="inline ml-1" />
                    שם המוסך *
                  </label>
                  <input
                    value={form.garageName}
                    onChange={e => updateField('garageName', e.target.value)}
                    placeholder="לדוגמה: מוסך השלום"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <User size={14} className="inline ml-1" />
                    שם בעל המוסך *
                  </label>
                  <input
                    value={form.ownerName}
                    onChange={e => updateField('ownerName', e.target.value)}
                    placeholder="שם מלא"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Mail size={14} className="inline ml-1" />
                    אימייל *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => updateField('email', e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Phone size={14} className="inline ml-1" />
                    טלפון *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    placeholder="050-1234567"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin size={14} className="inline ml-1" />
                    עיר *
                  </label>
                  <select
                    value={form.city}
                    onChange={e => updateField('city', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white"
                  >
                    <option value="">בחר עיר</option>
                    {CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin size={14} className="inline ml-1" />
                    כתובת
                  </label>
                  <input
                    value={form.address}
                    onChange={e => updateField('address', e.target.value)}
                    placeholder="רחוב ומספר"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleNext}
                  className="w-full px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md"
                >
                  המשך לשלב הבא
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Additional Info */}
          {step === 2 && (
            <div className="p-6 space-y-5">
              <h2 className="text-lg font-bold text-[#1e3a5f]">מידע נוסף על המוסך</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Wrench size={14} className="inline ml-1" />
                  שירותים שהמוסך מציע
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {SERVICE_OPTIONS.map(svc => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => toggleService(svc.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                        selectedServices.includes(svc.id)
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {svc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users size={14} className="inline ml-1" />
                  שפות שירות
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map(lang => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => toggleLanguage(lang.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                        selectedLanguages.includes(lang.id)
                          ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <FileText size={14} className="inline ml-1" />
                  תיאור המוסך
                </label>
                <textarea
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="ספר על המוסך, ההתמחות, ניסיון מיוחד..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 resize-none"
                />
              </div>

              {/* Images Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Camera size={14} className="inline ml-1" />
                  תמונות מהמוסך <span className="text-gray-400 font-normal">(אופציונלי, עד 6)</span>
                </label>
                <p className="text-xs text-gray-400 mb-3">צרף תמונות מבפנים ומבחוץ — עוזר לנו להכיר את המוסך שלך</p>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                    {imagePreviews.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={img.preview} alt={`תמונה ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImagePreview(idx)}
                          className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {imagePreviews.length < 6 && (
                  <label className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-emerald-400 hover:text-emerald-500 cursor-pointer transition text-sm">
                    <Plus size={18} />
                    <span>הוסף תמונות</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Clock size={14} className="inline ml-1" />
                    שנות ניסיון
                  </label>
                  <input
                    type="number"
                    value={form.yearsExperience}
                    onChange={e => updateField('yearsExperience', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Users size={14} className="inline ml-1" />
                    מספר עובדים
                  </label>
                  <input
                    type="number"
                    value={form.employeeCount}
                    onChange={e => updateField('employeeCount', e.target.value)}
                    placeholder="1"
                    min="1"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Award size={14} className="inline ml-1" />
                    מספר רישיון
                  </label>
                  <input
                    value={form.licenseNumber}
                    onChange={e => updateField('licenseNumber', e.target.value)}
                    placeholder="אופציונלי"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition"
                >
                  חזרה
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      שלח בקשת הצטרפות
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Benefits footer */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: CheckCircle2, text: 'הצטרפות חינמית' },
            { icon: Clock, text: 'אישור תוך 1-3 ימים' },
            { icon: Wrench, text: 'כלים מתקדמים' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="text-gray-400 text-xs flex flex-col items-center gap-1.5">
              <Icon size={18} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
