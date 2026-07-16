'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Star, CreditCard, FileCheck, Settings, Shield, Phone,
  LogOut, ChevronLeft, Loader2, User
} from 'lucide-react';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  licenseExpiry?: string | null;
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  badge?: number;
  description?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [licenseDate, setLicenseDate] = useState('');
  const [licenseSaving, setLicenseSaving] = useState(false);
  const [licenseSaved, setLicenseSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()).catch(() => ({ user: null })),
      fetch('/api/notifications?limit=50').then(r => r.json()).catch(() => ({ notifications: [] })),
      fetch('/api/vehicles').then(r => r.json()).catch(() => ({ vehicles: [] })),
    ]).then(([uData, nData, vData]) => {
      if (uData.user) {
        setUser(uData.user);
        if (uData.user.licenseExpiry) {
          setLicenseDate(String(uData.user.licenseExpiry).slice(0, 10));
        }
      }
      if (nData.notifications) {
        setUnreadCount(nData.notifications.filter((n: { isRead: boolean }) => !n.isRead).length);
      }
      if (vData.vehicles) setVehicleCount(vData.vehicles.length);
    }).finally(() => setLoading(false));
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  const saveLicenseDate = async () => {
    setLicenseSaving(true);
    setLicenseSaved(false);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseExpiry: licenseDate || null }),
      });
      if (res.ok) {
        setLicenseSaved(true);
        setTimeout(() => setLicenseSaved(false), 3000);
      }
    } catch { /* silent */ }
    setLicenseSaving(false);
  };

  const licenseDaysLeft = licenseDate
    ? Math.ceil((new Date(licenseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const menuItems: MenuItem[] = [
    {
      label: 'התראות',
      href: '/user/notifications',
      icon: <Bell size={20} />,
      iconBg: 'bg-amber-50 text-amber-600',
      badge: unreadCount || undefined,
      description: unreadCount ? `${unreadCount} התראות חדשות` : 'אין התראות חדשות',
    },
    {
      label: 'הטבות ומועדון',
      href: '/user/benefits',
      icon: <Star size={20} />,
      iconBg: 'bg-[#EAF2FC] text-[#2E77D0]',
      description: 'הנחות והטבות בלעדיות',
    },
    {
      label: 'תשלומים',
      href: '/user/payments',
      icon: <CreditCard size={20} />,
      iconBg: 'bg-blue-50 text-blue-600',
      description: 'היסטוריית חיובים ותשלומים',
    },
    {
      label: 'דוחות ואבחונים',
      href: '/user/reports',
      icon: <FileCheck size={20} />,
      iconBg: 'bg-[#EAF2FC] text-[#2E77D0]',
      description: 'צפה בתוצאות אבחוני הרכב',
    },
    {
      label: 'הגדרות',
      href: '/user/settings',
      icon: <Settings size={20} />,
      iconBg: 'bg-gray-100 text-gray-600',
      description: 'פרטים אישיים והעדפות',
    },
    {
      label: 'אבטחה',
      href: '/user/security',
      icon: <Shield size={20} />,
      iconBg: 'bg-gray-100 text-gray-600',
      description: 'סיסמה ואבטחת חשבון',
    },
    {
      label: 'תמיכה',
      href: '/user/support',
      icon: <Phone size={20} />,
      iconBg: 'bg-gray-100 text-gray-600',
      description: 'צור קשר ועזרה',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1B4E8A] to-[#2a5a8f] text-white px-4 pt-6 pb-10 rounded-b-3xl">
        <h1 className="text-2xl font-bold mb-1">פרופיל</h1>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        {/* User Card */}
        <div className="bg-white rounded-2xl p-5 shadow-md text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1B4E8A] to-teal-500 text-white flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold">{user ? getInitials(user.fullName) : '?'}</span>
          </div>
          <h2 className="text-xl font-bold text-[#1B4E8A]">{user?.fullName || 'משתמש'}</h2>
          <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
          {user?.phone && (
            <p className="text-sm text-gray-400">{user.phone}</p>
          )}
          <div className="mt-3 inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-sm font-medium">
            <User size={14} />
            {vehicleCount} רכבים רשומים
          </div>
        </div>

        {/* Driver's License */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#EAF2FC] text-[#2E77D0] flex-shrink-0">
              <CreditCard size={20} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-[#1B4E8A]">רישיון נהיגה</div>
              <div className="text-xs text-gray-400">
                {licenseDaysLeft === null
                  ? 'הזן תוקף ונזכיר לך לחדש בזמן'
                  : licenseDaysLeft < 0
                  ? 'פג תוקף!'
                  : `בתוקף — נותרו ${licenseDaysLeft} ימים`}
              </div>
            </div>
            {licenseDaysLeft !== null && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                licenseDaysLeft < 0 ? 'bg-red-50 text-red-600' :
                licenseDaysLeft <= 30 ? 'bg-amber-50 text-amber-600' :
                'bg-green-50 text-green-600'
              }`}>
                {licenseDaysLeft < 0 ? 'פג' : `${licenseDaysLeft} יום`}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={licenseDate}
              onChange={(e) => setLicenseDate(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              onClick={saveLicenseDate}
              disabled={licenseSaving}
              className="px-4 py-2 bg-[#2E77D0] text-white rounded-lg text-sm font-semibold hover:bg-[#1D5FAF] transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {licenseSaving ? <Loader2 size={14} className="animate-spin" /> : null}
              {licenseSaved ? 'נשמר ✓' : 'שמור'}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map(item => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.99] text-right"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#1B4E8A]">{item.label}</div>
                {item.description && (
                  <div className="text-xs text-gray-400 truncate">{item.description}</div>
                )}
              </div>
              {item.badge ? (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[24px] text-center">
                  {item.badge}
                </span>
              ) : null}
              <ChevronLeft size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={async () => {
            try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
            router.push('/auth/login');
          }}
          className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-red-100 hover:bg-red-50 transition-all active:scale-[0.99]"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-50 text-red-500 flex-shrink-0">
            <LogOut size={20} />
          </div>
          <div className="text-sm font-bold text-red-500">התנתק</div>
        </button>
      </div>
    </div>
  );
}
