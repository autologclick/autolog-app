'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  Settings, Shield, Bell, Globe, Save, Key, LogOut, Loader2,
  CheckCircle2, AlertCircle, AlertTriangle, Eye, EyeOff, Users, Building2, Car, FileCheck, Zap, Package, Home, BookOpen
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // System stats
  const [stats, setStats] = useState({ users: 0, garages: 0, vehicles: 0, inspections: 0 });

  // Admin profile
  const [adminProfile, setAdminProfile] = useState({ fullName: '', email: '', phone: '' });

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    sosAlerts: true,
    testExpiry: true,
    newUsers: false,
    weeklyReport: true,
    garageApplications: true,
    inspectionComplete: false,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()).catch(() => ({})),
      fetch('/api/admin/dashboard').then(r => r.json()).catch(() => ({})),
    ]).then(([userData, dashData]) => {
      if (userData.user) {
        setAdminProfile({
          fullName: userData.user.fullName || '',
          email: userData.user.email || '',
          phone: userData.user.phone || '',
        });
      }
      if (dashData.stats) {
        setStats({
          users: dashData.stats.totalUsers || 0,
          garages: dashData.stats.totalGarages || 0,
          vehicles: dashData.stats.totalVehicles || 0,
          inspections: dashData.stats.totalInspections || 0,
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSaveGeneral = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminProfile),
      });
      if (res.ok) {
        toast.success('ההגדרות נשמרו בהצלחה');
        setTimeout(() => router.push('/admin'), 600);
        return;
      } else {
        setSaveMessage('שגיאה בשמירה');
      }
    } catch {
      setSaveMessage('שגיאת חיבור');
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
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

  if (loading) {
    return (
      <div className="space-y-6 pt-12 lg:pt-0 animate-pulse" dir="rtl">
        <div className="h-8 bg-gray-200 rounded-lg w-36" />
        {[1,2].map(i => (
          <div key={i} className="bg-white rounded-xl p-6 space-y-4">
            <div className="h-5 bg-gray-100 rounded w-1/4" />
            <div className="space-y-3">{[1,2,3].map(j => <div key={j} className="h-10 bg-gray-50 rounded-lg" />)}</div>
          </div>
        ))}
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
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">הגדרות מערכת</h1>
          <p className="text-sm text-gray-500">ניהול המערכת וחשבון מנהל</p>
        </div>
      </div>

      {/* System stats mini-bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'משתמשים', value: stats.users, icon: <Users size={16} />, color: 'text-blue-600 bg-blue-50' },
          { label: 'מוסכים', value: stats.garages, icon: <Building2 size={16} />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'רכבים', value: stats.vehicles, icon: <Car size={16} />, color: 'text-amber-600 bg-amber-50' },
          { label: 'בדיקות', value: stats.inspections, icon: <FileCheck size={16} />, color: 'text-teal-600 bg-teal-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 text-center ${s.color.split(' ')[1]} border border-gray-100`}>
            <div className={`mx-auto w-8 h-8 rounded-lg flex items-center justify-center ${s.color} mb-1`}>
              {s.icon}
            </div>
            <p className="text-lg font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Admin Profile */}
      <Card>
        <CardTitle icon={<Globe className="text-teal-600" />}>פרטי מנהל ומערכת</CardTitle>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="שם המנהל"
              value={adminProfile.fullName}
              onChange={e => setAdminProfile({ ...adminProfile, fullName: e.target.value })}
            />
            <Input
              label="אימייל"
              value={adminProfile.email}
              type="email"
              onChange={e => setAdminProfile({ ...adminProfile, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="טלפון"
              value={adminProfile.phone}
              onChange={e => setAdminProfile({ ...adminProfile, phone: e.target.value })}
            />
            <Input label="טלפון תמיכה" defaultValue="053-313-1310" disabled />
          </div>

          {saveMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
              saveMessage.includes('הצלחה')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveMessage.includes('הצלחה') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {saveMessage}
            </div>
          )}

          <Button icon={<Save size={16} />} loading={saving} onClick={handleSaveGeneral}>
            שמור הגדרות
          </Button>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardTitle icon={<Bell className="text-amber-500" />}>הגדרות התראות</CardTitle>
        <div className="space-y-2 mt-4">
          {[
            { key: 'sosAlerts' as const, label: 'התראות SOS', desc: 'התראה מיידית על אירועי חירום חדשים', icon: AlertTriangle },
            { key: 'testExpiry' as const, label: 'טסטים פגי תוקף', desc: 'דוח יומי על רכבים עם טסט שפג', icon: FileCheck },
            { key: 'garageApplications' as const, label: 'בקשות הצטרפות', desc: 'התראה על בקשות מוסכים חדשות', icon: Building2 },
            { key: 'newUsers' as const, label: 'משתמשים חדשים', desc: 'התראה על כל הרשמה חדשה למערכת', icon: Users },
            { key: 'weeklyReport' as const, label: 'דוחות שבועיים', desc: 'סיכום שבועי למייל', icon: FileCheck },
            { key: 'inspectionComplete' as const, label: 'בדיקות הושלמו', desc: 'עדכון על בדיקות שהסתיימו', icon: CheckCircle2 },
          ].map(item => {
            const IconComponent = item.icon;
            return (
            <label
              key={item.key}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3">
                <IconComponent size={18} className="text-gray-600" />
                <div>
                  <div className="font-medium text-sm text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={notifPrefs[item.key]}
                  onChange={() => setNotifPrefs(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-teal-500 transition-colors" />
                <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:-translate-x-5 transition-transform" />
              </div>
            </label>
            );
          })}
        </div>
      </Card>

      {/* Security */}
      <Card>
        <CardTitle icon={<Shield className="text-red-500" />}>אבטחה</CardTitle>
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-sm text-gray-800">סיסמת מנהל</p>
              <p className="text-xs text-gray-500">שנה את סיסמת חשבון המנהל</p>
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

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordError('');
          setPasswordSuccess(false);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }}
        title="שינוי סיסמת מנהל"
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
              <Button variant="ghost" onClick={() => setShowPasswordModal(false)} className="flex-1">
                ביטול
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
