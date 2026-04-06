'use client';

import { useState } from 'react';
import { ChevronRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
const manufacturers = [
  'טויוטה', 'הונדה', 'ניסן', 'מאזדה', 'סוזוקי', 'היונדאי', 'קיה', 'סקודה',
  'סקיא', 'פולקסווגן', 'אאודי', 'בי.מ.וו', 'מרצדס', 'פיאט', 'סיטרואן',
  'לנץ', 'אלפא רומיאו', 'פיג׳ו', 'שברולט', 'פורד', 'בי.וואי.די', 'גיילי', 'גרייט וואל'
];

export default function OnboardingWizard({ isOpen, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nickname: '',
    licensePlate: '',
    manufacturer: '',
    model: '',
    year: currentYear.toString(),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
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
          licensePlate: formData.licensePlate.toUpperCase(),
          manufacturer: formData.manufacturer,
          model: formData.model,
          year: parseInt(formData.year),
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
    } catch (err) {
      setError('שגיאת חיבור. אנא נסה שוב.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" dir="rtl">
      <div className="bg-white w-full max-w-md mx-4 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="p-8 space-y-6 text-center min-h-screen flex flex-col justify-center">
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
                  <p className="text-sm text-gray-500">עקוב אחר כל הרכבים שלך ותחזוקתם</p>
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
              onClick={handleNextStep}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              בוא נתחיל
              <ChevronRight size={18} />
            </Button>
          </div>
        )}

        {/* Step 2: Add Vehicle */}
        {step === 2 && (
          <div className="p-8 space-y-6 min-h-screen flex flex-col justify-center">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1e3a5f]">הוסף את הרכב שלך</h2>
                <div className="text-3xl">🔧</div>
              </div>
              <p className="text-sm text-gray-600">מידע בסיסי כדי להתחיל</p>
            </div>

            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">כינוי הרכב</label>
                <Input
                  placeholder="למשל: הרכב שלי, בי.מ.וו שחור..."
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">מספר רישוי</label>
                <Input
                  placeholder="למשל: 12-345-67"
                  value={formData.licensePlate}
                  onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">יצרן</label>
                <select
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800"
                >
                  <option value="">בחר יצרן</option>
                  {manufacturers.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">דגם</label>
                <Input
                  placeholder="למשל: X5, Accord, Altima..."
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">שנה</label>
                <select
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-gray-800"
                >
                  {years.map(y => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
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
          <div className="p-8 space-y-6 text-center min-h-screen flex flex-col justify-center">
            <div className="space-y-4 animate-in fade-in">
              <div className="text-7xl animate-bounce">🎉</div>
              <h2 className="text-3xl font-bold text-teal-600">מעולה!</h2>
              <p className="text-xl font-semibold text-gray-800">הרכב נוסף בהצלחה</p>
              <p className="text-gray-600">
                {formData.nickname} • {formData.manufacturer} {formData.model}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-4 text-center">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-teal-400 rounded-full mx-auto animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>

              <p className="text-sm text-gray-500 pt-4">
                מעביר אתך לדשבורד בעוד לחץ...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
