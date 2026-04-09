'use client';

import { useState } from 'react';
import { ChevronRight, CheckCircle2, Loader2, AlertCircle, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LicenseScanButton, { type ScanResult } from '@/components/ui/LicenseScanButton';

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
const manufacturers = [
  'טויוטה', 'הונדה', 'ניסאן', 'מאזדה', 'סוזוקי', 'יונדאי', 'קיה', 'סקודה',
  'פולקסווגן', 'אאודי', 'BMW', 'מרצדס', 'פיאט', 'סיטרואן',
  'פז\'\u05D5', 'שברולט', 'פורד', 'רנו', 'אופל', 'וולוו', 'סיאט',
  'BYD', 'טסלה', 'דאצ\'\u05D9ה', 'ג\'\u05D9פ', 'סובארו', 'מיצובישי',
];

export default function OnboardingWizard({ isOpen, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nickname: '',
    licensePlate: '',
    manufacturer: '',
    model: '',
    year: currentYear.toString(),
    color: '',
    fuelType: '',
    testExpiryDate: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Handle scan result from LicenseScanButton
  const handleScanResult = (result: ScanResult) => {
    setFormData(prev => ({
      ...prev,
      licensePlate: result.licensePlate || prev.licensePlate,
      manufacturer: result.manufacturer || prev.manufacturer,
      model: result.model || prev.model,
      year: result.year || prev.year,
      color: result.color || prev.color,
      fuelType: result.fuelType || prev.fuelType,
      testExpiryDate: result.testExpiryDate || prev.testExpiryDate,
      nickname: result.nickname || prev.nickname,
    }));
    setError('');
  };

  // Manual lookup by plate number
  const handleManualLookup = async () => {
    const plate = formData.licensePlate.replace(/[-\s]/g, '');
    if (!plate || plate.length < 7) {
      setError('נא להזין מספר רכב תקין (7-8 ספרות)');
      return;
    }

    setLookingUp(true);
    setLookupMessage('מחפש פרטים במשרד התחבורה...');
    setError('');

    try {
      const res = await fetch(`/api/vehicles/lookup?plate=${encodeURIComponent(plate)}`);
      const data = await res.json();

      if (res.ok && data.vehicle) {
        const v = data.vehicle;
        setFormData(prev => ({
          ...prev,
          manufacturer: v.manufacturer || prev.manufacturer,
          model: v.model || prev.model,
          year: v.year ? String(v.year) : prev.year,
          color: v.color || prev.color,
          fuelType: v.fuelType || prev.fuelType,
          testExpiryDate: v.testExpiryDate || prev.testExpiryDate,
          nickname: v.commercialName || (v.manufacturer && v.model ? `${v.manufacturer} ${v.model}` : prev.nickname),
        }));
        setLookupMessage('הפרטים נטענו בהצלחה!');
        setTimeout(() => setLookupMessage(''), 3000);
      } else {
        setLookupMessage('לא נמצאו פרטים לרכב זה');
        setTimeout(() => setLookupMessage(''), 3000);
      }
    } catch {
      setLookupMessage('שגיאה בחיפוש. נסה שוב.');
      setTimeout(() => setLookupMessage(''), 3000);
    }

    setLookingUp(false);
  };

  const handleSubmit = async () => {
    if (!formData.nickname || !formData.licensePlate || !formData.manufacturer || !formData.model || !formData.year) {
      setError('נא להשלים את כל השדות');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: formData.nickname,
          licensePlate: formData.licensePlate.replace(/[-\s]/g, '').toUpperCase(),
          manufacturer: formData.manufacturer,
          model: formData.model,
          year: parseInt(formData.year),
          color: formData.color || undefined,
          fuelType: formData.fuelType || undefined,
          testExpiryDate: formData.testExpiryDate || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה בהוספת הרכב');
        setLoading(false);
        return;
      }

      setStep(3);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch {
      setError('שגיאת חיבור. אנא נסה שוב.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" dir="rtl">
      <div className="bg-white w-full max-w-md mx-4 rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="p-8 space-y-6 text-center">
            <div className="space-y-4">
              <div className="text-6xl">🚗</div>
              <h1 className="text-3xl font-bold text-[#1e3a5f]">ברוכים הבאים ל-AutoLog!</h1>
              <p className="text-gray-600 text-base leading-relaxed">
                אפליקציה חכמה לניהול כל צרכי הרכב שלך במקום אחד
              </p>
            </div>

            <div className="space-y-3 text-right">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 size={16} className="text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">הזמן תורים בקלות</p>
                  <p className="text-sm text-gray-500">מצא מוסכים ובחר שעה בקליק</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 size={16} className="text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">ניהול רכבים</p>
                  <p className="text-sm text-gray-500">עקוב אחרי כל הרכבים שלך ותחזוקתם</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 size={16} className="text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">דירוגים וביקורות</p>
                  <p className="text-sm text-gray-500">השווה מוסכים ותעזור לאחרים להחליט</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              בוא נתחיל
              <ChevronRight size={18} />
            </Button>
          </div>
        )}

        {/* Step 2: Add Vehicle */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#1e3a5f]">הוסף את הרכב שלך</h2>
                <div className="text-2xl">🔧</div>
              </div>
              <p className="text-sm text-gray-500">צלם רישיון רכב או הזן פרטים ידנית</p>
            </div>

            {/* License Scan Button */}
            <LicenseScanButton onScanResult={handleScanResult} compact />

            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {lookupMessage && (
              <div className={`text-center text-sm py-2 px-3 rounded-lg ${
                lookupMessage.includes('בהצלחה') ? 'bg-green-50 text-green-700' :
                lookupMessage.includes('שגיאה') || lookupMessage.includes('לא נמצאו') ? 'bg-amber-50 text-amber-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {lookupMessage}
              </div>
            )}

            <div className="space-y-3">
              {/* License plate with lookup button */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">מספר רכב</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="למשל: 1234567"
                    value={formData.licensePlate}
                    onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                    disabled={loading}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleManualLookup}
                    disabled={loading || lookingUp || formData.licensePlate.replace(/[-\s]/g, '').length < 7}
                    className="px-3 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                  >
                    {lookingUp ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    חפש
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">כינוי הרכב</label>
                <Input
                  placeholder="למשל: הרכב שלי, הטויוטה..."
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">יצרן</label>
                  <select
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-sm"
                  >
                    <option value="">בחר יצרן</option>
                    {/* Include API-returned manufacturer if not in the static list */}
                    {formData.manufacturer && !manufacturers.includes(formData.manufacturer) && (
                      <option value={formData.manufacturer}>{formData.manufacturer}</option>
                    )}
                    {manufacturers.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">דגם</label>
                  <Input
                    placeholder="למשל: Corolla"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">שנה</label>
                  <select
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800 text-sm"
                  >
                    {years.map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">צבע</label>
                  <Input
                    placeholder="למשל: לבן"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl"
              >
                חזור
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    הוסף רכב
                    <ChevronRight size={18} />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="p-8 space-y-6 text-center">
            <div className="space-y-4">
              <div className="text-7xl animate-bounce">🎉</div>
              <h2 className="text-3xl font-bold text-teal-600">מעולה!</h2>
              <p className="text-xl font-semibold text-gray-800">הרכב נוסף בהצלחה</p>
              <p className="text-gray-600">
                {formData.nickname} {formData.manufacturer && `• ${formData.manufacturer} ${formData.model}`}
              </p>

              <div className="flex justify-center gap-2 pt-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>

              <p className="text-sm text-gray-500 pt-4">מעביר אותך לדשבורד...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
