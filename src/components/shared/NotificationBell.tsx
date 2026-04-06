'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, X, FileText, Shield, Calendar, AlertTriangle, Gift, Settings } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'test_expiry':
      return <FileText size={18} className="text-blue-600" />;
    case 'insurance_expiry':
      return <Shield size={18} className="text-teal-600" />;
    case 'appointment':
      return <Calendar size={18} className="text-purple-600" />;
    case 'sos':
      return <AlertTriangle size={18} className="text-red-600" />;
    case 'benefit':
      return <Gift size={18} className="text-pink-600" />;
    case 'system':
      return <Settings size={18} className="text-gray-600" />;
    default:
      return <Bell size={18} className="text-gray-600" />;
  }
};

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const typeIconMap: Record<string, React.ReactNode> = {};

// Note: Icons are now handled through component rendering, see below

const typeLabels: Record<string, string> = {
  test_expiry: 'טסט עומד לפוג',
  insurance_expiry: 'ביטוח עומד לפוג',
  appointment: 'תור',
  sos: 'SOS',
  benefit: 'הטבה',
  system: 'מערכת',
};

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'לפני כמה שניות';
  if (seconds < 3600) return `לפני ${Math.floor(seconds / 60)} דקות`;
  if (seconds < 86400) return `לפני ${Math.floor(seconds / 3600)} שעות`;
  if (seconds < 604800) return `לפני ${Math.floor(seconds / 86400)} ימים`;
  return then.toLocaleDateString('he-IL');
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications on mount and set up polling
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      loadNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <div className="relative z-[60]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition"
      >
        <Bell size={20} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute start-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200 z-[100]">
          {/* Header */}
          <div className="border-b border-gray-200 p-4">
            <h3 className="font-bold text-gray-800 text-right">התראות</h3>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Bell size={20} className="text-gray-400" />
                </div>
                <p>אין התראות חדשות</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => {
                      if (notif.link) {
                        window.location.href = notif.link;
                      } else {
                        handleMarkAsRead(notif.id);
                      }
                    }}
                    className={`w-full p-4 text-right transition hover:bg-[#fef7ed]/50 flex gap-3 ${
                      !notif.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm break-words">
                        {notif.title}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 break-words">
                        {notif.message}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {timeAgo(notif.createdAt)}
                      </div>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 p-3 space-y-2 bg-gray-50">
              <button
                onClick={handleMarkAllAsRead}
                className="w-full text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                סמן הכל כנקרא
              </button>
              <Link href="/user/notifications" className="block">
                <button className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium">
                  צפה בכל ההתראות
                </button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
