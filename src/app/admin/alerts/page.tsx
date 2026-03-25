'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Bell, AlertTriangle, Shield, FileText, Clock, Check,
  Loader2, Users, Calendar, Building2, RefreshCw, ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: string;
  link?: string;
}

export default function AdminAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const res = await fetch('/api/admin/alerts');
      if (!res.ok) throw new Error('×©×××× ×××¢×× ×ª ××ª×¨×××ª');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '×©×××× ×××¢×× ×');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...Array.from(prev), id]));
  };

  const handleMarkAllRead = () => {
    setDismissedIds(new Set(alerts.map(a => a.id)));
  };

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id));
  const filtered = filter === 'unread'
    ? visibleAlerts.filter(a => !a.read)
    : filter === 'high'
    ? visibleAlerts.filter(a => a.priority === 'high')
    : visibleAlerts;

  const unreadCount = visibleAlerts.filter(a => !a.read).length;
  const highCount = visibleAlerts.filter(a => a.priority === 'high').length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'sos': return <AlertTriangle className="text-red-500" size={18} />;
      case 'expiry': return <Clock className="text-amber-500" size={18} />;
      case 'inspection': return <Shield className="text-teal-500" size={18} />;
      case 'user': return <Users className="text-blue-500" size={18} />;
      case 'application': return <Building2 className="text-teal-500" size={18} />;
      case 'appointment': return <Calendar className="text-indigo-500" size={18} />;
      default: return <FileText className="text-gray-500" size={18} />;
    }
  };

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = { high: '××××£', medium: '××× ×× ×', low: '× ×××' };
    return map[priority] || priority;
  };

  const getPriorityVariant = (priority: string): 'danger' | 'warning' | 'default' => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      default: return 'default';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '××¨××¢';
    if (diffMins < 60) return `××¤× × ${diffMins} ××§××ª`;
    if (diffHours < 24) return `××¤× × ${diffHours} ×©×¢××ª`;
    if (diffDays < 7) return `××¤× × ${diffDays} ××××`;
    return date.toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="animate-spin text-teal-600 mx-auto mb-3" size={32} />
          <p className="text-gray-500 text-sm">×××¢× ××ª×¨×××ª...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <Bell size={22} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">××¨×× ××ª×¨×××ª</h1>
            <p className="text-sm text-gray-500">{visibleAlerts.length} ××ª×¨×××ª ×¤×¢××××ª</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
            onClick={() => fetchAlerts(true)}
            disabled={refreshing}
          >
            ×¨×¢× ×
          </Button>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              ×¡×× ××× ×× ×§×¨×
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
          <p className="text-2xl font-bold text-red-600">{highCount}</p>
          <p className="text-xs text-red-500">××××¤××ª</p>
        </div>
        <div className="bg-teal-50 rounded-xl p-3 text-center border border-teal-100">
          <p className="text-2xl font-bold text-teal-600">{unreadCount}</p>
          <p className="text-xs text-teal-500">×× × ×§×¨××</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
          <p className="text-2xl font-bold text-gray-600">{visibleAlerts.length}</p>
          <p className="text-xs text-gray-500">×¡××´×</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
          <span className="text-red-700 text-sm">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => fetchAlerts()}>× ×¡× ×©××</Button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all' as const, label: '×××', count: visibleAlerts.length },
          { key: 'unread' as const, label: '×× × ×§×¨××', count: unreadCount },
          { key: 'high' as const, label: '××××¤××ª', count: highCount },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === tab.key
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-[#fef7ed]/50'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Alerts list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">
            {filter === 'all' ? '××× ××ª×¨×××ª ×¤×¢××××ª' : filter === 'unread' ? '××× ××ª×¨×××ª ×××©××ª' : '××× ××ª×¨×××ª ××××¤××ª'}
          </h3>
          <p className="text-gray-400 text-sm">××× ××¡××¨!</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(alert => (
            <Card
              key={alert.id}
              hover
              className={`transition-all ${
                !alert.read && !dismissedIds.has(alert.id)
                  ? 'border-r-4 border-r-teal-500 bg-teal-50/30'
                  : ''
              } ${alert.priority === 'high' && !dismissedIds.has(alert.id) ? 'border-r-4 border-r-red-500 bg-red-50/20' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-2.5 rounded-xl flex-shrink-0 ${
                  alert.priority === 'high' ? 'bg-red-50' :
                  alert.priority === 'medium' ? 'bg-amber-50' : 'bg-gray-50'
                }`}>
                  {getIcon(alert.type)}
                </div>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => alert.link && router.push(alert.link)}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`font-bold text-sm ${
                      !alert.read && !dismissedIds.has(alert.id) ? 'text-[#1e3a5f]' : 'text-gray-700'
                    }`}>
                      {alert.title}
                    </h3>
                    {!alert.read && !dismissedIds.has(alert.id) && (
                      <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />
                    )}
                    <Badge variant={getPriorityVariant(alert.priority)} size="sm">
                      {getPriorityLabel(alert.priority)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{alert.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">{formatRelativeTime(alert.time)}</span>
                    {alert.link && (
                      <span className="text-xs text-teal-500 flex items-center gap-1 hover:text-teal-700">
                        ×¦×¤× <ChevronLeft size={12} />
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!dismissedIds.has(alert.id) && !alert.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Check size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(alert.id);
                      }}
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
