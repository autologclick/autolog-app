'use client';

import { useEffect, useState } from 'react';

interface AuditRow {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  ip?: string | null;
  userAgent?: string | null;
  changes?: string | null;
  metadata?: string | null;
}

export default function AuditLogsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ action: '', resourceType: '', userId: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.action) params.set('action', filter.action);
      if (filter.resourceType) params.set('resourceType', filter.resourceType);
      if (filter.userId) params.set('userId', filter.userId);
      params.set('limit', '100');
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const j = await res.json();
        setRows(j.logs || j.entries || j.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div dir="rtl" className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">יומן אירועים (Audit Log)</h1>
      <p className="text-sm text-gray-600">יומן זה אינו ניתן לעריכה או מחיקה.</p>

      <div className="flex flex-wrap gap-2">
        <input
          placeholder="פעולה"
          value={filter.action}
          onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          className="border rounded-lg p-2 text-sm"
        />
        <input
          placeholder="סוג משאב"
          value={filter.resourceType}
          onChange={(e) => setFilter({ ...filter, resourceType: e.target.value })}
          className="border rounded-lg p-2 text-sm"
        />
        <input
          placeholder="מזהה משתמש"
          value={filter.userId}
          onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
          className="border rounded-lg p-2 text-sm"
        />
        <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
          סנן
        </button>
      </div>

      {loading ? (
        <div>טוען…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-right">זמן</th>
                <th className="p-2 text-right">פעולה</th>
                <th className="p-2 text-right">סוג</th>
                <th className="p-2 text-right">משאב</th>
                <th className="p-2 text-right">משתמש</th>
                <th className="p-2 text-right">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">{new Date(r.timestamp).toLocaleString('he-IL')}</td>
                  <td className="p-2">{r.action}</td>
                  <td className="p-2">{r.resourceType}</td>
                  <td className="p-2 font-mono text-xs">{r.resourceId}</td>
                  <td className="p-2 font-mono text-xs">{r.userId}</td>
                  <td className="p-2">{r.ip || '-'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    אין רשומות
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
