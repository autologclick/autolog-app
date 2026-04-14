'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Client-side maintenance gate.
 * Polls /api/maintenance-status once on mount (and every 60s while mounted).
 * If enabled, shows a full-screen maintenance overlay — except on admin/auth/api
 * routes so admins can still disable maintenance mode.
 */
export default function MaintenanceGate() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const pathname = usePathname() || '';

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('/api/maintenance-status', { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (cancelled) return;
        setEnabled(Boolean(j.enabled));
        setMessage(j.message || '');
      } catch {
        /* ignore */
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const bypass =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname === '/maintenance';

  if (!enabled || bypass) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
        <div className="text-6xl">🛠️</div>
        <h1 className="text-2xl font-bold text-gray-900">המערכת בתחזוקה</h1>
        <p className="text-gray-600">
          {message || 'אנו עובדים על שיפור המערכת. נחזור בקרוב!'}
        </p>
        <p className="text-sm text-gray-500">AutoLog · autolog.click</p>
      </div>
    </div>
  );
}
