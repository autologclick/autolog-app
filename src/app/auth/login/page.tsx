'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { LogIn, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('mode') === 'register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP step (second factor) — after password is accepted
  const [otpStep, setOtpStep] = useState(false);
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [savedEmail, setSavedEmail] = useState('');
  const [savedPassword, setSavedPassword] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const email = form.get('email');
    const password = form.get('password');

    if (!email || !password) {
      setError(isRegister ? 'נא למלא את כל השדות הנדרשים' : 'נא למלא מייל וסיסמה');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(isRegister && {
            fullName: form.get('fullName'),
            phone: form.get('phone') || undefined,
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details && typeof data.details === 'object') {
          const firstError = Object.values(data.details)[0];
          setError(typeof firstError === 'string' ? firstError : data.error || 'שגיאה בנתונים');
        } else {
          setError(data.error || 'שגיאה');
        }
        setLoading(false);
        return;
      }

      // Login step 1: server asked for OTP
      if (!isRegister && data.requiresOtp) {
        setSavedEmail(String(email));
        setSavedPassword(String(password));
        setRequiresTotp(Boolean(data.requiresTotp));
        setOtpStep(true);
        setInfo(data.message || 'נשלח קוד למייל שלך.');
        setLoading(false);
        return;
      }

      // Redirect based on role — add welcome flag for new registrations
      const role = data.user?.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'garage_owner') router.push('/garage');
      else router.push(isRegister ? '/user?welcome=1' : '/user');
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Form submit error:', err);
      }
      setError('שגיאת חיבור. אנא בדוק את החיבור שלך ונסה שוב.');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: savedEmail,
          password: savedPassword,
          emailOtp,
          ...(requiresTotp && { totpCode }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה באימות הקוד');
        setLoading(false);
        return;
      }
      const role = data.user?.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'garage_owner') router.push('/garage');
      else router.push('/user');
    } catch {
      setError('שגיאת רשת. נסה שוב.');
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: savedEmail, password: savedPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בשליחת הקוד');
      } else {
        setInfo('קוד חדש נשלח לאימייל שלך.');
      }
    } catch {
      setError('שגיאת רשת.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4 overflow-hidden" dir="rtl">
      {/* Animated Background Shapes - Hidden on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        {/* Large gradient circle - top left */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/10 to-blue-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }} />

        {/* Medium gradient circle - bottom right */}
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-gradient-to-tl from-blue-400/10 to-teal-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        {/* Small accent circle - top right */}
        <div className="absolute top-20 -right-20 w-40 h-40 bg-gradient-to-bl from-teal-300/5 to-transparent rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />

        {/* Subtle car-shaped abstract elements */}
        <svg className="absolute top-1/4 -left-20 w-96 h-96 opacity-5 animate-float" viewBox="0 0 200 200" style={{ animationDelay: '1.5s' }}>
          <path d="M 50 100 L 60 80 L 140 80 L 150 100 L 150 130 Q 150 140 140 140 L 60 140 Q 50 140 50 130 Z" stroke="currentColor" strokeWidth="2" fill="none" className="text-teal-600" />
          <circle cx="70" cy="135" r="8" fill="currentColor" className="text-teal-600" />
          <circle cx="130" cy="135" r="8" fill="currentColor" className="text-teal-600" />
        </svg>

        {/* Accent line decoration */}
        <div className="absolute top-1/3 right-1/4 w-32 h-1 bg-gradient-to-l from-teal-500/30 to-transparent rounded-full blur-sm" />
      </div>

      {/* Content Container */}
      <div className={`w-full max-w-md relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Header Logo Section */}
        <div className="text-center mb-3 sm:mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-center mb-3 sm:mb-4">
            <Logo size="xl" className="transform hover:scale-105 transition-transform duration-300" />
          </div>
          <p className="text-slate-600 text-xs sm:text-sm font-medium tracking-wide">ניהול רכבים חכם ויעיל</p>
        </div>

        {/* Main Card */}
        <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>

          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-5 sm:px-8 py-4 sm:py-6 border-b border-slate-200">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {otpStep ? 'אימות קוד מהמייל' : isRegister ? 'הרשמה חדשה' : 'התחברות'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {otpStep
                ? `שלחנו קוד בן 6 ספרות ל-${savedEmail}`
                : isRegister
                  ? 'צור חשבון חדש לניהול רכבך'
                  : 'התחבר לחשבונך הקיים'}
            </p>
          </div>

          {/* Form Section */}
          <div className="px-5 sm:px-8 py-5 sm:py-8">
            {otpStep ? (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {info && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                    {info}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    קוד מהמייל (6 ספרות)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full border-2 rounded-xl p-4 text-center text-2xl font-mono tracking-widest"
                    dir="ltr"
                    autoFocus
                  />
                </div>

                {requiresTotp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      קוד מאפליקציית האימות (חשבון מנהל)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder="000000"
                      className="w-full border-2 rounded-xl p-4 text-center text-xl font-mono tracking-widest"
                      dir="ltr"
                    />
                  </div>
                )}

                {error && (
                  <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg"
                  size="lg"
                  loading={loading}
                  disabled={emailOtp.length !== 6 || (requiresTotp && totpCode.length < 6)}
                >
                  אמת והיכנס
                </Button>

                <div className="flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50"
                  >
                    שלח קוד חדש
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(false);
                      setEmailOtp('');
                      setTotpCode('');
                      setError('');
                      setInfo('');
                    }}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    ← חזור
                  </button>
                </div>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Register Fields */}
              {isRegister && (
                <>
                  <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <Input
                      name="fullName"
                      label="שם מלא"
                      placeholder="הכנס את שמך המלא"
                      required
                      className="border-slate-300 focus:border-teal-400"
                    />
                  </div>
                  <div className="animate-fade-in" style={{ animationDelay: '0.35s' }}>
                    <Input
                      name="phone"
                      label="טלפון"
                      placeholder="054-1234567"
                      className="border-slate-300 focus:border-teal-400"
                    />
                  </div>
                </>
              )}

              {/* Email Input */}
              <div className="animate-fade-in" style={{ animationDelay: isRegister ? '0.4s' : '0.3s' }}>
                <Input
                  name="email"
                  label="אימייל"
                  type="email"
                  placeholder="your@email.com"
                  required
                  className="border-slate-300 focus:border-teal-400"
                />
              </div>

              {/* Password Input */}
              <div className="animate-fade-in" style={{ animationDelay: isRegister ? '0.45s' : '0.35s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 disabled:bg-gray-50 disabled:text-gray-500 pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
                size="lg"
                loading={loading}
                icon={isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
              >
                {isRegister ? 'הרשמה' : 'התחברות'}
              </Button>
            </form>
            )}

            {/* Forgot Password */}
            {!isRegister && !otpStep && (
              <div className="text-center mt-4">
                <a
                  href="/auth/forgot-password"
                  className="text-slate-500 hover:text-teal-600 text-xs transition-colors"
                >
                  שכחתי סיסמה
                </a>
              </div>
            )}

            {/* Toggle Mode */}
            {!otpStep && (
              <div className="text-center mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                  }}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors"
                >
                  {isRegister ? 'כבר יש לך חשבון? התחבר כאן' : 'אין לך חשבון? הירשם כאן'}
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-slate-600 text-xs mt-6 px-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          אנו מגנים על הפרטיות שלך. כל הנתונים שלך מוצפנים וחסויים.
        </p>
      </div>
    </div>
  );
}
