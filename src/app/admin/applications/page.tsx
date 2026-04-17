'use client';
import React from 'react';
import NextImage from 'next/image';

import { useState, useEffect } from 'react';
import {
  Building2, Clock, CheckCircle2, XCircle, Loader2,
  Mail, Phone, MapPin, User, Wrench, Calendar,
  ChevronDown, ChevronUp, AlertCircle, MessageSquare, Image
} from 'lucide-react';

interface Application {
  id: string;
  garageName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  address: string | null;
  description: string | null;
  services: string | null;
  yearsExperience: number;
  employeeCount: number;
  licenseNumber: string | null;
  images: string | null;
  status: string;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'ממתין לאישור', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'אושר', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'נדחה', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [counts, setCounts] = useState({ total: 0, pending: 0 });
  const [error, setError] = useState('');
  const [credentialsInfo, setCredentialsInfo] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState('');

  const fetchApplications = async () => {
    try {
      const url = filter
        ? `/api/admin/garage-applications?status=${filter}`
        : '/api/admin/garage-applications';
      const res = await fetch(url);
      if (!res.ok) throw new Error('שגיאה בטעינת הבקשות');
      const data = await res.json();
      setApplications(data.applications || []);
      setCounts({ total: data.total, pending: data.pending });
    } catch {
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/garage-applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: noteText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה');
        return;
      }

      // Show temp password if new user was created
      if (data.tempPassword) {
        setCredentialsInfo({
          email: data.loginEmail,
          password: data.tempPassword,
        });
      }

      setNoteText('');
      setExpandedId(null);
      fetchApplications();
    } catch {
      setError('שגיאת חיבור');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('he-IL', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const parseServices = (servicesJson: string | null): string[] => {
    if (!servicesJson) return [];
    try { return JSON.parse(servicesJson); } catch { return []; }
  };

  const SERVICE_LABELS: Record<string, string> = {
    inspection: 'בדיקות רכב',
    maintenance: 'טיפולים שוטפים',
    repair: 'תיקונים',
    test_prep: 'הכנה לטסט',
    tires: 'צמיגים',
    bodywork: 'פחחות וצבע',
    electrical: 'חשמל רכב',
    ac: 'מיזוג אוויר',
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-12 lg:pt-0 animate-pulse" dir="rtl">
        <div className="h-8 bg-gray-200 rounded-lg w-48" />
        <div className="bg-white rounded-xl p-4 space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50">
              <div className="w-10 h-10 bg-gray-100 rounded-lg" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-2/3" /><div className="h-3 bg-gray-50 rounded w-1/3" /></div>
              <div className="h-8 w-20 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Credentials Modal */}
      {credentialsInfo && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={() => setCredentialsInfo(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">המוסך אושר בהצלחה!</h3>
              <p className="text-sm text-gray-500 mt-1">פרטי ההתחברות של בעל המוסך:</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">אימייל</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm flex-1 bg-white rounded-lg px-3 py-2 border">{credentialsInfo.email}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(credentialsInfo.email); setCopied('email'); setTimeout(() => setCopied(''), 2000); }}
                    className="px-3 py-2 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                  >
                    {copied === 'email' ? '✓' : 'העתק'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">סיסמה זמנית</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm flex-1 bg-white rounded-lg px-3 py-2 border font-bold text-teal-700">{credentialsInfo.password}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(credentialsInfo.password); setCopied('pass'); setTimeout(() => setCopied(''), 2000); }}
                    className="px-3 py-2 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                  >
                    {copied === 'pass' ? '✓' : 'העתק'}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 text-center">
              ⚠️ שלח פרטים אלו לבעל המוסך. מומלץ שישנה את הסיסמה בכניסה הראשונה.
            </p>
            <button
              onClick={() => setCredentialsInfo(null)}
              className="w-full py-2.5 bg-[#1e3a5f] text-white font-bold rounded-xl hover:bg-[#162d4a] transition"
            >
              סגור
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">בקשות הצטרפות מוסכים</h1>
          <p className="text-sm text-gray-500 mt-1">
            {counts.pending > 0
              ? `${counts.pending} בקשות ממתינות לאישור מתוך ${counts.total}`
              : `${counts.total} בקשות סה"כ`
            }
          </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'הכל', count: counts.total },
          { value: 'pending', label: 'ממתינות', count: counts.pending },
          { value: 'approved', label: 'אושרו', count: null },
          { value: 'rejected', label: 'נדחו', count: null },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setLoading(true); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === f.value
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {f.label}
            {f.count !== null && f.count > 0 && (
              <span className={`me-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                filter === f.value ? 'bg-teal-500' : 'bg-gray-100'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {filter === 'pending' ? 'אין בקשות ממתינות' : 'אין בקשות'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const isExpanded = expandedId === app.id;
            const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConf.icon;
            const services = parseServices(app.services);

            return (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Summary Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  className="w-full p-5 flex items-center gap-4 text-right hover:bg-[#fef7ed]/50 transition"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[#1e3a5f] truncate">{app.garageName}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.color}`}>
                        <StatusIcon size={12} />
                        {statusConf.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><User size={12} />{app.ownerName}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} />{app.city}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(app.createdAt)}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-gray-700 dir-ltr">{app.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-gray-700 dir-ltr">{app.phone}</span>
                        </div>
                        {app.address && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="text-gray-700">{app.address}, {app.city}</span>
                          </div>
                        )}
                        {app.licenseNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 size={14} className="text-gray-400" />
                            <span className="text-gray-700">רישיון: {app.licenseNumber}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-gray-700">{app.yearsExperience} שנות ניסיון</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User size={14} className="text-gray-400" />
                          <span className="text-gray-700">{app.employeeCount} עובדים</span>
                        </div>
                      </div>
                    </div>

                    {app.description && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600">{app.description}</p>
                      </div>
                    )}

                    {services.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Wrench size={12} /> שירותים:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {services.map(s => (
                            <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                              {SERVICE_LABELS[s] || s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Application Images */}
                    {app.images && (() => {
                      try {
                        const imgs = JSON.parse(app.images) as string[];
                        if (imgs.length === 0) return null;
                        return (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Image size={12} /> תמונות מהמוסך:</p>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                              {imgs.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-400 transition">
                                  <NextImage src={url} alt={`תמונת מוסך ${idx + 1}`} fill sizes="(max-width: 640px) 33vw, 16vw" className="object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      } catch { return null; }
                    })()}

                    {/* Admin Notes (for already reviewed) */}
                    {app.adminNotes && app.status !== 'pending' && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                        <p className="text-xs text-blue-500 mb-1 flex items-center gap-1"><MessageSquare size={12} /> הערות מנהל:</p>
                        <p className="text-sm text-blue-700">{app.adminNotes}</p>
                      </div>
                    )}

                    {/* Action Buttons (only for pending) */}
                    {app.status === 'pending' && (
                      <div className="border-t border-gray-100 pt-4 mt-4">
                        <div className="mb-3">
                          <label className="text-xs text-gray-500 mb-1 block">הערות (אופציונלי)</label>
                          <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="הוסף הערה לגבי הבקשה..."
                            rows={2}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAction(app.id, 'approved')}
                            disabled={!!actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition disabled:opacity-60"
                          >
                            {actionLoading === app.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            אשר מוסך
                          </button>
                          <button
                            onClick={() => handleAction(app.id, 'rejected')}
                            disabled={!!actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition border border-red-200 disabled:opacity-60"
                          >
                            {actionLoading === app.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <XCircle size={16} />
                            )}
                            דחה מוסך
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}