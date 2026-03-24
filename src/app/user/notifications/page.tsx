'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Loader2,
  CheckCircle2,
  Bell,
  Calendar,
  ClipboardCheck,
  AlertTriangle,
  Car,
  MessageSquare,
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

const notificationTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  appointment_update: {
    icon: <Calendar size={20} />,
    color: '#0d9488',
    label: 'עדכון תור',
  },
  inspection_complete: {
    icon: <ClipboardCheck size={20} />,
    color: '#059669',
    label: 'בדיקה הושלמה',
  },
  sos_update: {
    icon: <AlertTriangle size={20} />,
    color: '#dc2626',
    label: 'עדכון SOS',
  },
  vehicle_alert: {
    icon: <Car size={20} />,
    color: '#d97706',
    label: 'התראת רכב',
  },
  general: {
    icon: <Bell size={20} />,
    color: '#6b7280',
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
      <div key={title} className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3">
          {title}
        </h3>
        {notifications.map(notif => {
          const config = getNotificationConfig(notif.type);
          return (
            <Card
              key={notif.id}
              hover
              className={`transition-all ${
                notif.isRead
                  ? 'opacity-70 hover:opacity-100'
                  : 'border-l-4 border-teal-500 bg-gradient-to-r from-teal-50 to-white'
              }`}
              onClick={() => handleMarkAsRead(notif.id, notif.isRead, notif.link)}
            >
              <div className="flex gap-4 items-start">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                  style={{ backgroundColor: config.color }}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#1e3a5f] text-sm leading-tight">
                        {notif.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2 flex-shrink-0">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={notif.isRead ? 'default' : 'info'}>
                      {config.label}
                    </Badge>
                    {!notif.isRead && (
                      <div className="w-2 h-2 bg-teal-500 rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <Bell size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">התראות</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-600">
                {unreadCount} התראות לא קראו
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            icon={<CheckCircle2 size={16} />}
            onClick={handleMarkAllAsRead}
            className="text-teal-600 hover:text-teal-700"
          >
            סמן הכל כנקרא
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            !filterUnread
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-gray-600 hover:text-[#1e3a5f]'
          }`}
        >
          הכל
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterUnread
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-gray-600 hover:text-[#1e3a5f]'
          }`}
        >
          שלא נקראו ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : !hasNotifications ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">אין התראות</h3>
          <p className="text-gray-600 text-sm">
            {filterUnread
              ? 'הכל נקרא - מצוין!'
              : 'עדיין אין התראות חדשות'}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {renderNotificationGroup(grouped.today, 'היום')}
          {renderNotificationGroup(grouped.yesterday, 'אתמול')}
          {renderNotificationGroup(grouped.thisWeek, 'השבוע')}
          {renderNotificationGroup(grouped.older, 'ישן יותר')}
        </div>
      )}
    </div>
  );
}
