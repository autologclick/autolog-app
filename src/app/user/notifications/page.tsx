'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import Button from '@/components/ui/Button';
import {
  Loader2,
  CheckCircle2,
  Bell,
  Calendar,
  ClipboardCheck,
  AlertTriangle,
  Car,
  Gift,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  older: Notification[];
}

const notificationTypeConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  appointment_update: {
    icon: <Calendar size={20} />,
    color: '#0d9488',
    bgColor: 'bg-teal-100',
    label: 'עדכון תור',
  },
  inspection_complete: {
    icon: <ClipboardCheck size={20} />,
    color: '#059669',
    bgColor: 'bg-green-100',
    label: 'בדיקה הושלמה',
  },
  sos_update: {
    icon: <AlertTriangle size={20} />,
    color: '#dc2626',
    bgColor: 'bg-red-100',
    label: 'עדכון SOS',
  },
  vehicle_alert: {
    icon: <Car size={20} />,
    color: '#d97706',
    bgColor: 'bg-amber-100',
    label: 'התראת רכב',
  },
  benefits_update: {
    icon: <Gift size={20} />,
    color: '#2563eb',
    bgColor: 'bg-blue-100',
    label: 'עדכון הטבות',
  },
  general: {
    icon: <Bell size={20} />,
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    label: 'כללי',
  },
};

function getNotificationConfig(type: string) {
  return notificationTypeConfig[type] || notificationTypeConfig.general;
}

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

function groupNotificationsByDate(notifications: Notification[]): GroupedNotifications {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const grouped: GroupedNotifications = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach(notif => {
    const notifDate = new Date(notif.createdAt);
    const notifDay = new Date(
      notifDate.getFullYear(),
      notifDate.getMonth(),
      notifDate.getDate()
    );

    if (notifDay.getTime() === today.getTime()) {
      grouped.today.push(notif);
    } else if (notifDay.getTime() === yesterday.getTime()) {
      grouped.yesterday.push(notif);
    } else if (notifDay.getTime() > weekAgo.getTime()) {
      grouped.thisWeek.push(notif);
    } else {
      grouped.older.push(notif);
    }
  });

  return grouped;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [filterUnread]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      let url = '/api/notifications?limit=100';
      if (filterUnread) url += '&isRead=false';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading notifications:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean, link?: string) => {
    if (!isRead) {
      try {
        await fetch('/api/notifications/' + id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        });
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error marking as read:', err);
        }
      }
    }

    if (link) {
      window.location.href = link;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error marking all as read:', err);
      }
    }
  };

  const filteredNotifications = filterUnread
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const grouped = groupNotificationsByDate(filteredNotifications);
  const hasNotifications = Object.values(grouped).some(arr => arr.length > 0);

  const renderNotificationGroup = (
    notifications: Notification[],
    title: string
  ) => {
    if (notifications.length === 0) return null;

    return (
      <div key={title} className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 pt-2">
          {title}
        </h3>
        {notifications.map(notif => {
          const config = getNotificationConfig(notif.type);
          return (
            <div
              key={notif.id}
              className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleMarkAsRead(notif.id, notif.isRead, notif.link)}
            >
              <div className="flex gap-3 items-start">
                {/* Icon Box */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white`}
                  style={{ backgroundColor: config.color }}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-gray-900 leading-tight">
                      {notif.title}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {notif.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      {config.label}
                    </span>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="bg-[#fef7ed] min-h-screen pb-24" dir="rtl">
      <PageHeader
        title="התראות"
        subtitle={unreadCount + " התראות חדשות"}
        backUrl="/user/profile"
      />

      <div className="px-4 md:px-6 space-y-4">
        {/* Mark All as Read Button */}
        {unreadCount > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              icon={<CheckCircle2 size={16} />}
              onClick={handleMarkAllAsRead}
              className="text-teal-600 hover:text-teal-700 text-sm"
            >
              סמן הכל כנקרא
            </Button>
          </div>
        )}

        {/* Filter Chips */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterUnread(false)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              !filterUnread
                ? 'bg-teal-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            הכל
          </button>
          <button
            onClick={() => setFilterUnread(true)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              filterUnread
                ? 'bg-teal-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            חדשות בלבד
          </button>
        </div>

        {/* Notifications List */}
        {!hasNotifications ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">אין התראות</h3>
            <p className="text-gray-600 text-sm">
              {filterUnread
                ? 'הכל נקרא - מצוין!'
                : 'עדיין אין התראות חדשות'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderNotificationGroup(grouped.today, 'היום')}
            {renderNotificationGroup(grouped.yesterday, 'אתמול')}
            {renderNotificationGroup(grouped.thisWeek, 'השבוע')}
            {renderNotificationGroup(grouped.older, 'ישן יותר')}
          </div>
        )}
      </div>
    </div>
  );
}
