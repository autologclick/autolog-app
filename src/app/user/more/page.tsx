'use client';

import Link from 'next/link';
import {
  Wrench, MapPin, AlertTriangle, Calendar, Hammer,
  Clock, FileText, Repeat, Gift, CreditCard,
  User, Bell, Shield, Settings, LifeBuoy, HelpCircle, Search, Receipt
} from 'lucide-react';
import { GARAGES_ENABLED } from '@/lib/constants/feature-flags';

interface MoreItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  soon?: boolean;
}

const sections: { title: string; items: MoreItem[] }[] = [
  {
    title: 'שירותים',
    items: [
      { label: 'טיפולים', href: '/user/treatments', icon: <Wrench size={22} /> },
      { label: 'שירותי רכב', href: '/user/find-garage', icon: <Search size={22} /> },
      { label: 'הזמנת מוסך', href: '/user/book-garage', icon: <MapPin size={22} />, soon: !GARAGES_ENABLED },
      { label: 'SOS חירום', href: '/user/sos', icon: <AlertTriangle size={22} /> },
      { label: 'תורים', href: '/user/appointments', icon: <Calendar size={22} /> },
      { label: 'פחחות', href: '/user/bodywork', icon: <Hammer size={22} /> },
    ],
  },
  {
    title: 'המידע שלי',
    items: [
      { label: 'היסטוריה', href: '/user/history', icon: <Clock size={22} /> },
      { label: 'דוחות', href: '/user/reports', icon: <FileText size={22} /> },
      { label: 'העברת בעלות', href: '/user/vehicles/transfer', icon: <Repeat size={22} /> },
      { label: 'הוצאות', href: '/user/expenses', icon: <Receipt size={22} /> },
      { label: 'הטבות', href: '/user/benefits', icon: <Gift size={22} /> },
      { label: 'תשלומים', href: '/user/payments', icon: <CreditCard size={22} /> },
    ],
  },
  {
    title: 'חשבון',
    items: [
      { label: 'פרופיל', href: '/user/profile', icon: <User size={22} /> },
      { label: 'התראות', href: '/user/notifications', icon: <Bell size={22} /> },
      { label: 'אבטחה', href: '/user/security', icon: <Shield size={22} /> },
      { label: 'הגדרות', href: '/user/settings', icon: <Settings size={22} /> },
      { label: 'תמיכה', href: '/user/support', icon: <LifeBuoy size={22} /> },
      { label: 'מדריך משתמש', href: '/help', icon: <HelpCircle size={22} /> },
    ],
  },
];

export default function MorePage() {
  return (
    <div className="min-h-screen bg-[#F3F6FA] pb-24" dir="rtl">
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-1">עוד באוטולוג</h1>
        <p className="text-sm text-gray-500 mb-5">כל השירותים והכלים — במקום אחד</p>
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-sm font-bold text-gray-500 mb-2">{section.title}</h2>
            <div className="grid grid-cols-3 gap-3">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex flex-col items-center gap-2 text-center hover:border-teal-400 transition-all"
                >
                  <span className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                    {item.icon}
                  </span>
                  <span className="text-xs font-semibold text-gray-800 leading-tight">{item.label}</span>
                  {item.soon && (
                    <span className="absolute top-2 left-2 bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      בקרוב
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
