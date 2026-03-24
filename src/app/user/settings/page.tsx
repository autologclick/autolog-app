'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  Settings, User, Bell, LogOut, Save, Key, Loader2,
  CheckCircle2, AlertCircle, Eye, EyeOff, Shield, Car,
  ClipboardList, Search, Calendar, AlertTriangle, Gift
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    email: '',
    licenseNumber: '',
  });
  const [saveMessage, setSaveMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    testReminder: true,
    insuranceReminder: true,
    inspectionUpdate: true,
    benefitAlerts: false,
    appointmentReminder: true,
    sosAlerts: true,
  });

  // Vehicle count
  const [vehicleCount, setVehicleCount] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()).catch(() => ({})),
      fetch('/api/vehicles').then(r => r.json()).catch(() => ({ vehicles: [] })),
    ]).then(([userData, vData]) => {
      if (userData.user) {
        setProfile({
          fullName: userData.user.fullName || '',
          phone: userData.user.phone || '',
          email: userData.user.email || '',
          licenseNumber: userData.user.licenseNumber || '',
        });
      }
      setVehicleCount(vData.vehicles?.length || 0);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSaveMessage('הפרטים נשמרו בהצלחה!');
        setSaveSuccess(true);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        const data = await res.json();
        setSaveMessage(data.error || 'שגיאה בשמירה');
      }
    } catch {
      setSaveMessage('שגיאת חיבור');
    }
    setSaving(false);
  };

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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch {
      router.push('/auth/login');
    }
  };

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
          <Settings size={22} className="text-[#1e3a5f]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1e3a5f]">הגדרות</h1>
          <p className="text-sm text-gray-500">ניהול חשבון ופרטים אישיים</p>
        </div>
      </div>

      {/* Profile summary card */}
      <div className="bg-gradient-to-l from-teal-500 to-teal-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
            {profile.fullName.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{profile.fullName || 'משתמש'}</h2>
            <p className="text-teal-100 text-sm">{profile.email}</p>
            <div className="flex items-center gap-3 mt-1 text-teal-100 text-xs">
              <span className="flex items-center gap-1">
                <Car size={12} />
                {vehicleCount} רכבים
              </span>
              {profile.phone && (
                <span>{profile.phone}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <Card>
        <CardTitle icon={<User className="text-teal-600" />}>פרטים אישיים</CardTitle>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="שם מלא"
              placeholder="הכנס שם מלא"
              value={profile.fullName}
              onChange={e => setProfile({ ...profile, fullName: e.target.value })}
            />
            <Input
              label="טלפון"
              placeholder="050-000-0000"
              value={profile.phone}
              onChange={e => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="אימייל"
              placeholder="example@email.com"
              value={profile.email}
              type="email"
              onChange={e => setProfile({ ...profile, email: e.target.value })}
            />
            <Input
              label="מספר רישיון"
              placeholder="מספר רישיון נהיגה"
              value={profile.licenseNumber}
              onChange={e => setProfile({ ...profile, licenseNumber: e.target.value })}
            />
          </div>

          {saveMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
              saveSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {saveMessage}
            </div>
          )}

          <Button icon={<Save size={16} />} loading={saving} onClick={handleSave}>
            שמור שינויים
          </Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardTitle icon={<Bell className="text-amber-500" />}>העדפות התראות</CardTitle>
        <div className="space-y-2 mt-4">
          {[
            { key: 'testReminder' as const, label: 'תזכורת טסט', desc: 'התראה 30 יום לפני פקיעת הטסט', icon: ClipboardList },
            { key: 'insuranceReminder' as const, label: 'תזכורת ביטוח', desc: 'התראה 30 יום לפני פקיעת הביטוח', icon: Shield },
            { key: 'inspectionUpdate' as const, label: 'עדכוני בדיקה', desc: 'עדכון כשדוח בדיקה מוכן', icon: Search },
            { key: 'appointmentReminder' as const, label: 'תזכורת תורים', desc: 'תזכורת יום לפני תור מוסך', icon: Calendar },
            { key: 'sosAlerts' as const, label: 'התראות חירום', desc: 'עדכונים על אירועי חירום', icon: AlertTriangle },
            { key: 'benefitAlerts' as const, label: 'הטבות חדשות', desc: 'התראה על הטבות חדשות במועדון', icon: Gift },
          ].map(item => (
            <label
              key={item.key}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className="text-gray-600" />
                <div>
                  <div className="font-medium text-sm text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={notifPrefs[item.key]}
                  onChange={() => toggleNotif(item.key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-teal-500 transition-colors" />
                <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:-translate-x-5 transition-transform" />
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card>
        <CardTitle icon={<Shield className="text-red-500" />}>אבטחה</CardTitle>
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-sm text-gray-800">סיסמה</p>
              <p className="text-xs text-gray-500">שנה את סיסמת החשבון שלך</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Key size={14} />}
              onClick={() => setShowPasswordModal(true)}
            >
              שנה סיסמה
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-sm text-gray-800">מזהה חשבון</p>
              <p className="text-xs text-gray-500">מזהה ייחודי לצורך תמיכה</p>
            </div>
            <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono text-gray-600">
              {profile.email.split('@')[0]}
            </code>
          </div>
        </div>
      </Card>

      {/* Logout */}
      <Button
        variant="danger"
        icon={<LogOut size={16} />}
        className="w-full"
        loading={loggingOut}
        onClick={handleLogout}
      >
        התנתקות
      </Button>

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
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition ${
                        passwordData.newPassword.length >= i * 3
                          ? passwordData.newPassword.length >= 12 ? 'bg-green-500'
                            : passwordData.newPassword.length >= 8 ? 'bg-teal-500'
                            : 'bg-amber-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {passwordData.newPassword.length < 6 ? 'חלשה מדי' :
                   passwordData.newPassword.length < 8 ? 'בינונית' :
                   passwordData.newPassword.length < 12 ? 'טובה' : 'חזקה'}
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
