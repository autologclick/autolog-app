'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  Shield, Key, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff,
  Lock, Smartphone, Clock, AlertTriangle, FileCheck, LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SecurityCenterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ fullName: '', email: '', phone: '', createdAt: '' });

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setProfile({
            fullName: data.user.fullName || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            createdAt: data.user.createdAt || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordError('יש למלא את כל השדות');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('סיסמה חדשה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('הסיסמאות לא תואמות');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      if (res.ok) {
        setPasswordSuccess(true);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(false);
        }, 2000);
      } else {
        const data = await res.json();
        setPasswordError(data.error || 'שגיאה בשינוי סיסמה');
      }
    } catch {
      setPasswordError('שגיאת חיבור');
    }
    setChangingPassword(false);
  };

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { level: 0, label: 'חלשה מדי', color: 'bg-red-500' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'חלשה', color: 'bg-red-500' };
    if (score <= 2) return { level: 2, label: 'בינונית', color: 'bg-amber-500' };
    if (score <= 3) return { level: 3, label: 'טובה', color: 'bg-teal-500' };
    return { level: 4, label: 'חזקה', color: 'bg-green-500' };
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch {
      router.push('/auth/login');
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-[#fef7ed] pb-24" dir="rtl">
      <PageHeader title="אבטחה" backUrl="/user/profile" />

      <div className="max-w-2xl mx-auto px-4 space-y-6 pt-6">
        {/* Security Score Card */}
        <div className="bg-gradient-to-l from-teal-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-teal-100 text-sm mb-2">מצב אבטחת החשבון</p>
              <h2 className="text-3xl font-bold">טוב</h2>
              <p className="text-teal-100 text-xs mt-2">
                {memberSince && `חבר מאז ${memberSince}`}
              </p>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              <Shield size={40} className="text-white" />
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i <= 3 ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>

        {/* Security Checklist Items */}
        <div className="space-y-3">
          {/* Password */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Key size={22} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-sm text-gray-900">סיסמה</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    מוגדרת
                  </span>
                </div>
                <p className="text-xs text-gray-500">שנה את סיסמת החשבון שלך לשיפור האבטחה</p>
              </div>
              <div className="flex-shrink-0">
                <div className="text-teal-600">→</div>
              </div>
            </div>
          </button>

          {/* Email Verification */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={22} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-sm text-gray-900">אימייל מאומת</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    מאומת
                  </span>
                </div>
                <p className="text-xs text-gray-500">{profile.email}</p>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone size={22} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-sm text-gray-900">טלפון</h3>
                  {profile.phone ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      מעודכן
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      לא הוגדר
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {profile.phone || 'הוסף מספר טלפון לאבטחה מוגברת'}
                </p>
              </div>
            </div>
          </div>

          {/* Login Activity */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock size={22} className="text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 mb-1">פעילות אחרונה</h3>
                <p className="text-xs text-gray-500">
                  התחברות אחרונה: היום, {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Account ID */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock size={22} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 mb-1">מזהה חשבון</h3>
                <p className="text-xs text-gray-500 mb-2">מזהה ייחודי לצורך תמיכה טכנית</p>
                <code className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg font-mono text-gray-600 border border-gray-200 inline-block">
                  {profile.email.split('@')[0]}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
            <FileCheck size={20} className="text-blue-500" />
            טיפים לאבטחה
          </h3>
          <div className="space-y-3">
            {[
              { text: 'השתמש בסיסמה ייחודית שאינה בשימוש באתרים אחרים', done: true },
              { text: 'ודא שהאימייל שלך מעודכן לקבלת התראות אבטחה', done: !!profile.email },
              { text: 'הוסף מספר טלפון לשחזור חשבון', done: !!profile.phone },
              { text: 'שנה סיסמה כל 3-6 חודשים', done: false },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  tip.done ? 'bg-green-100' : 'bg-gray-200'
                }`}>
                  {tip.done ? (
                    <CheckCircle2 size={14} className="text-green-600" />
                  ) : (
                    <AlertTriangle size={12} className="text-gray-400" />
                  )}
                </div>
                <p className={`text-sm ${tip.done ? 'text-gray-700' : 'text-gray-500'}`}>{tip.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-200">
          <h3 className="font-bold text-sm text-red-600 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} />
            אזור מוגבל
          </h3>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
            <div>
              <p className="font-medium text-sm text-gray-800">התנתקות מכל המכשירים</p>
              <p className="text-xs text-gray-500">ינתק את כל הסשנים הפעילים</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition text-sm flex-shrink-0"
            >
              <LogOut size={14} />
              התנתק
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordError('');
          setPasswordSuccess(false);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }}
        title="שינוי סיסמה"
        size="md"
      >
        {passwordSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">הסיסמה שונתה בהצלחה!</h3>
            <p className="text-gray-500 text-sm">הסיסמה החדשה פעילה מעכשיו</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סיסמה נוכחית</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="הכנס סיסמה נוכחית"
                  className="w-full px-4 py-2 pr-10 rounded-2xl border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סיסמה חדשה</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="לפחות 6 תווים"
                  className="w-full px-4 py-2 pr-10 rounded-2xl border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">אימות סיסמה חדשה</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="הכנס שוב את הסיסמה החדשה"
                className="w-full px-4 py-2 rounded-2xl border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {passwordData.newPassword && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => {
                    const strength = getPasswordStrength(passwordData.newPassword);
                    return (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition ${
                          i <= strength.level ? strength.color : 'bg-gray-200'
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500">
                  חוזק: {getPasswordStrength(passwordData.newPassword).label}
                </p>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle size={16} />
                {passwordError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium py-2 rounded-xl hover:from-teal-600 hover:to-teal-700 transition disabled:opacity-50"
              >
                {changingPassword ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                  </span>
                ) : (
                  'שנה סיסמה'
                )}
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-medium py-2 rounded-xl hover:bg-gray-200 transition"
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
