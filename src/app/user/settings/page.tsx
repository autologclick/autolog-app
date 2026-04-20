'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  User, Bell, LogOut, Save, Key, Loader2,
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
    ]).then(([userData, vData]: [any, any]) => {
      if (userData.user) {
        setProfile({
          fullName: userData.user.fullName || '',
          phone: userData.user.phone || '',
          email: userData.user.email || '',
          licenseNumber: userData.user.licenseNumber || '',
        });
        // Load notification preferences if saved
        if (userData.user.notificationPreferences) {
          setNotifPrefs(prev => ({ ...prev, ...userData.user.notificationPreferences }));
        }
      }
      setVehicleCount(vData.vehicles?.length || 0);
      setLoading(false);
    });
  }, []);

  // Basic client-side validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^0\d{1,2}[-\s]?\d{3}[-\s]?\d{4}$/;
  const isProfileValid = profile.fullName.trim().length > 0
    && (!profile.email || emailRegex.test(profile.email))
    && (!profile.phone || profile.phone.replace(/[-\s]/g, '').length < 10 || phoneRegex.test(profile.phone));

  const handleSave = async () => {
    if (profile.email && !emailRegex.test(profile.email)) {
      setSaveMessage('כתובת אימייל לא תקינה');
      setSaveSuccess(false);
      return;
    }
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
        toast.success('הפרטים נשמרו בהצלחה');
        setTimeout(() => router.push('/user'), 600);
        return;
      } else {
        const data = await res.json();
        setSaveMessage(data.error || 'לא הצלחנו לשמור את הפרטים. נסה שוב.');
      }
    } catch {
      setSaveMessage('שגיאת חיבור. בדוק את האינטרנט ונסה שוב.');
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
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    // Persist to server
    fetch('/api/auth/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationPreferences: updated }),
    }).catch(() => {
      // Revert on failure
      setNotifPrefs(notifPrefs);
      toast.error('שגיאה בשמירת העדפות התראות');
    });
  };

  const getInitialGradient = () => {
    const char = profile.fullName.charAt(0) || '?';
    const charCode = char.charCodeAt(0);
    const hue = (charCode * 137) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#fef7ed] pb-24" dir="rtl">
      <PageHeader title="הגדרות" backUrl="/user/profile" />

      <div className="max-w-2xl mx-auto px-4 space-y-6 pt-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, #1e3a5f 0%, #14b8a6 100%)`
              }}
            >
              {profile.fullName.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{profile.fullName || 'משתמש'}</h2>
              <p className="text-sm text-gray-500 truncate">{profile.email}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Car size={12} />
                  {vehicleCount} רכבים
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Details Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
            <User size={20} className="text-teal-600" />
            פרטים אישיים
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="settings-fullname" className="block text-sm font-medium text-gray-700 mb-2">שם מלא</label>
                <input
                  id="settings-fullname"
                  type="text"
                  placeholder="הכנס שם מלא"
                  value={profile.fullName}
                  onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="settings-phone" className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
                <input
                  id="settings-phone"
                  type="tel"
                  placeholder="054-000-0000"
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="settings-email" className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
                <input
                  id="settings-email"
                  type="email"
                  placeholder="example@email.com"
                  value={profile.email}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="settings-license" className="block text-sm font-medium text-gray-700 mb-2">מספר רישיון</label>
                <input
                  id="settings-license"
                  type="text"
                  placeholder="מספר רישיון נהיגה"
                  value={profile.licenseNumber}
                  onChange={e => setProfile({ ...profile, licenseNumber: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {saveMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                saveSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {saveSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {saveMessage}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !profile.fullName.trim()}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium py-2 rounded-xl hover:from-teal-600 hover:to-teal-700 transition disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  שומר...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save size={16} />
                  שמור שינויים
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
            <Bell size={20} className="text-amber-500" />
            העדפות התראות
          </h3>
          <div className="space-y-3">
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
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-gray-600" />
                  <div>
                    <div className="font-medium text-sm text-gray-800">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notifPrefs[item.key]}
                    onChange={() => toggleNotif(item.key)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    notifPrefs[item.key] ? 'bg-teal-500' : 'bg-gray-300'
                  }`} />
                  <div className={`absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notifPrefs[item.key] ? '-translate-x-5' : ''
                  }`} />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
            <Shield size={20} className="text-red-500" />
            אבטחה
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition"
            >
              <div>
                <p className="font-medium text-sm text-gray-800">סיסמה</p>
                <p className="text-xs text-gray-500">שנה את סיסמת החשבון שלך</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Key size={14} />}
              >
                שנה סיסמה
              </Button>
            </button>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-sm text-gray-800">מזהה חשבון</p>
                <p className="text-xs text-gray-500">מזהה ייחודי לצורך תמיכה</p>
              </div>
              <code className="text-xs bg-white px-3 py-1.5 rounded-lg font-mono text-gray-600 border border-gray-200">
                {profile.email.split('@')[0]}
              </code>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-medium py-2.5 rounded-xl hover:bg-red-100 transition disabled:opacity-50 mb-8"
        >
          {loggingOut ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <LogOut size={16} />
              התנתקות
            </>
          )}
        </button>
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
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="settings-current-password" className="block text-sm font-medium text-gray-700 mb-2">סיסמה נוכחית</label>
              <div className="relative">
                <input
                  id="settings-current-password"
                  type={showCurrent ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="הכנס סיסמה נוכחית"
                  className="w-full px-4 py-2 pr-10 rounded-xl border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showCurrent ? 'הסתר סיסמה' : 'הצג סיסמה'}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="settings-new-password" className="block text-sm font-medium text-gray-700 mb-2">סיסמה חדשה</label>
              <div className="relative">
                <input
                  id="settings-new-password"
                  type={showNew ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="לפחות 6 תווים"
                  className="w-full px-4 py-2 pr-10 rounded-xl border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showNew ? 'הסתר סיסמה' : 'הצג סיסמה'}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="settings-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">אימות סיסמה חדשה</label>
              <input
                id="settings-confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="הכנס שוב את הסיסמה החדשה"
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

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
