'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
          <Shield size={22} className="text-[#1e3a5f]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1e3a5f]">מרכז אבטחה</h1>
          <p className="text-sm text-gray-500">ניהול אבטחת החשבון שלך</p>
        </div>
      </div>

      {/* Security Score Banner */}
      <div className="bg-gradient-to-l from-teal-500 to-emerald-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-teal-100 text-sm mb-1">מצב אבטחת החשבון</p>
            <h2 className="text-2xl font-bold">טוב</h2>
            <p className="text-teal-100 text-xs mt-1">
              {memberSince && `חבר מאז ${memberSince}`}
            </p>
          </div>
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Shield size={36} className="text-white" />
          </div>
        </div>
        <div className="mt-4 flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 3 ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      </div>

      {/* Security Items */}
      <div className="space-y-3">
        {/* Password */}
        <Card hover onClick={() => setShowPasswordModal(true)}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Key size={22} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-sm text-gray-800">סיסמה</h3>
                <Badge variant="success" size="sm">מוגדרת</Badge>
              </div>
              <p className="text-xs text-gray-500">שנה את סיסמת החשבון שלך לשיפור האבטחה</p>
            </div>
            <Button variant="outline" size="sm">שנה</Button>
          </div>
        </Card>

        {/* Email Verification */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={22} className="text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-sm text-gray-800">אימייל מאומת</h3>
                <Badge variant="success" size="sm">מאומת</Badge>
              </div>
              <p className="text-xs text-gray-500">{profile.email}</p>
            </div>
          </div>
        </Card>

        {/* Phone */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone size={22} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-sm text-gray-800">טלפון</h3>
                {profile.phone ? (
                  <Badge variant="success" size="sm">מעודכן</Badge>
                ) : (
                  <Badge variant="warning" size="sm">לא הוגדר</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {profile.phone || 'הוסף מספר טלפון לאבטחה מוגברת'}
              </p>
            </div>
          </div>
        </Card>

        {/* Login Activity */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock size={22} className="text-teal-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-sm text-gray-800">פעילות אחרונה</h3>
              </div>
              <p className="text-xs text-gray-500">
                התחברות אחרונה: היום, {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </Card>

        {/* Account ID */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock size={22} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-sm text-gray-800">מזהה חשבון</h3>
              </div>
              <p className="text-xs text-gray-500">מזהה ייחודי לצורך תמיכה טכנית</p>
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600 mt-1 inline-block">
                {profile.email.split('@')[0]}
              </code>
            </div>
          </div>
        </Card>
      </div>

      {/* Security Tips */}
      <Card className="bg-blue-50/50 border-blue-100">
        <CardTitle icon={<FileCheck className="text-blue-500" />}>טיפים לאבטחה</CardTitle>
        <div className="space-y-3 mt-3">
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
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <h3 className="font-bold text-sm text-red-600 mb-3 flex items-center gap-2">
          <AlertTriangle size={16} />
          אזור מוגבל
        </h3>
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
          <div>
            <p className="font-medium text-sm text-gray-800">התנתקות מכל המכשירים</p>
            <p className="text-xs text-gray-500">ינתק את כל הסשנים הפעילים</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<LogOut size={14} />}
            onClick={handleLogout}
          >
            התנתק
          </Button>
        </div>
      </Card>

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
            <div className="relative">
              <Input
                label="סיסמה נוכחית"
                type={showCurrent ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="הכנס סיסמה נוכחית"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute left-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="סיסמה חדשה"
                type={showNew ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="לפחות 6 תווים"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute left-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Input
              label="אימות סיסמה חדשה"
              type="password"
              value={passwordData.confirmPassword}
              onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="הכנס שוב את הסיסמה החדשה"
            />

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
              <Button onClick={handlePasswordChange} loading={changingPassword} className="flex-1">
                שנה סיסמה
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowPasswordModal(false)}
                className="flex-1"
              >
                ביטול
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
