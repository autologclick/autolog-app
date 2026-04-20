'use client';

import { useEffect, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Settings, Save, AlertTriangle, CheckCircle2, Loader2, Shield
} from 'lucide-react';

export default function AdminMaintenancePage() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/maintenance');
        if (res.ok) {
          const j = await res.json();
          setEnabled(Boolean(j.enabled));
          setMessage(j.message || '');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, message }),
      });
      if (res.ok) {
        setStatus('success');
        setStatusMessage('ההגדרות נשמרו בהצלחה');
      } else {
        const j = await res.json().catch(() => ({}));
        setStatus('error');
        setStatusMessage(j.error || 'שגיאה בשמירה');
      }
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-12 lg:pt-0 animate-pulse" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="h-6 bg-gray-200 rounded w-36" />
        </div>
        <div className="bg-white rounded-xl p-6 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-50 rounded-lg" />)}
        </div>
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
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">מצב תחזוקה</h1>
          <p className="text-sm text-gray-500">השבתה זמנית של המערכת לתחזוקה</p>
        </div>
      </div>

      {/* Current Status Banner */}
      {enabled && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-amber-800 text-sm">מצב תחזוקה פעיל</p>
            <p className="text-xs text-amber-600">המשתמשים רואים כרגע דף תחזוקה במקום המערכת</p>
          </div>
        </div>
      )}

      <Card>
        <CardTitle icon={<Shield className="text-teal-600" />}>הגדרות תחזוקה</CardTitle>
        <div className="space-y-5 mt-4">
          {/* Toggle */}
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-500" />
              <div>
                <div className="font-medium text-sm text-gray-800">הפעל מצב תחזוקה</div>
                <div className="text-xs text-gray-500">משתמשים יראו דף תחזוקה במקום המערכת</div>
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-amber-500 transition-colors" />
              <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:-translate-x-5 transition-transform" />
            </div>
          </label>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">הודעה למשתמשים</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="לדוגמה: המערכת בתחזוקה ותחזור לפעילות תוך שעה..."
              className="w-full border border-gray-300 rounded-xl p-3 min-h-[120px] text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 resize-none"
              dir="rtl"
            />
            <p className="text-xs text-gray-400 mt-1">ההודעה תוצג בדף התחזוקה שהמשתמשים יראו</p>
          </div>

          {/* Status Message */}
          {status && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
              status === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {statusMessage}
            </div>
          )}

          {/* Save Button */}
          <Button
            icon={<Save size={16} />}
            loading={saving}
            onClick={save}
          >
            שמור הגדרות
          </Button>
        </div>
      </Card>
    </div>
  );
}
