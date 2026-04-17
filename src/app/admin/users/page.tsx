'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Users, Search, Filter, Eye, Edit, Loader2, AlertCircle, Building2, Shield, UserCheck, UserX, Key, Mail, CheckCircle2 } from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  vehicleCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState({ fullName: '', phone: '', role: '', isActive: true });
  const [updating, setUpdating] = useState(false);
  const [credentialsInfo, setCredentialsInfo] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('שגיאה בטעינת משתמשים');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError('שגיאה בטעינת משתמשים');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditData({
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    });
    setEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!res.ok) throw new Error('שגיאה בעדכון משתמש');

      setUsers(users.map(u =>
        u.id === editingUser.id
          ? { ...u, ...editData }
          : u
      ));
      setEditModal(false);
      setEditingUser(null);
    } catch {
      setError('לא הצלחנו לעדכן את המשתמש. נסה שוב.');
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    setPasswordLoading(true);
    setActionMsg('');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה באיפוס סיסמה');
      setCredentialsInfo({ email: data.email, password: data.tempPassword });
      setEditModal(false);
    } catch {
      setError('לא הצלחנו לאפס את הסיסמה. נסה שוב מאוחר יותר.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendResetEmail = async (userId: string) => {
    setPasswordLoading(true);
    setActionMsg('');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_reset_email' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה בשליחת מייל');
      setActionMsg(data.message);
      setEditModal(false);
    } catch {
      setError('לא הצלחנו לשלוח מייל לאיפוס סיסמה. נסה שוב.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.fullName.includes(search) || u.email.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      user: 'משתמש',
      admin: 'מנהל',
      garage_owner: 'בעלי מוסך',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-[#1e3a5f]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <Users size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">ניהול משתמשים</h1>
            <p className="text-sm text-gray-500">צפייה ועריכת משתמשי המערכת</p>
          </div>
        </div>
        <Badge variant="info" size="md">{users.length} משתמשים</Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users size={14} className="text-[#1e3a5f]" />
          </div>
          <p className="text-2xl font-bold text-[#1e3a5f]">{users.filter(u => u.role === 'user').length}</p>
          <p className="text-xs text-gray-500">משתמשים</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Building2 size={14} className="text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-teal-600">{users.filter(u => u.role === 'garage_owner').length}</p>
          <p className="text-xs text-gray-500">בעלי מוסכים</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield size={14} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{users.filter(u => u.role === 'admin').length}</p>
          <p className="text-xs text-gray-500">מנהלים</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <UserX size={14} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-500">{users.filter(u => !u.isActive).length}</p>
          <p className="text-xs text-gray-500">לא פעילים</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="text-red-600" size={20} />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Search + Role Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="חפש לפי שם או מייל..."
            icon={<Search size={16} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'הכל', count: users.length },
          { key: 'user', label: 'משתמשים', count: users.filter(u => u.role === 'user').length },
          { key: 'garage_owner', label: 'בעלי מוסכים', count: users.filter(u => u.role === 'garage_owner').length },
          { key: 'admin', label: 'מנהלים', count: users.filter(u => u.role === 'admin').length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setRoleFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              roleFilter === tab.key ? 'bg-[#1e3a5f] text-white shadow-md' : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-[#1e3a5f]'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600">שם</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600 hidden sm:table-cell">אימייל</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600 hidden lg:table-cell">טלפון</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600">תפקיד</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600 hidden sm:table-cell">רכבים</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600">סטטוס</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600 hidden lg:table-cell">הצטרפות</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold text-gray-600">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-gray-200">
                        <Users size={32} className="text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-600">{search ? 'לא נמצאו משתמשים תואמים' : 'אין משתמשים במערכת'}</h3>
                      {search && <p className="text-gray-400 text-sm">נסה לחפש עם מילות מפתח אחרות</p>}
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-[#fef7ed]/50 transition">
                  <td className="py-2 sm:py-3 px-2 sm:px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#fef7ed] rounded-full flex items-center justify-center text-xs font-bold text-[#1e3a5f] flex-shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <span className="font-medium text-xs sm:text-sm">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-gray-600 text-xs sm:text-sm hidden sm:table-cell">{u.email}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-gray-600 text-xs hidden lg:table-cell">{u.phone}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3">
                    <Badge variant="default" size="sm">{getRoleLabel(u.role)}</Badge>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm hidden sm:table-cell">{u.vehicleCount}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3">
                    <Badge variant={u.isActive ? 'success' : 'danger'} size="sm">
                      {u.isActive ? 'פעיל' : 'לא'}
                    </Badge>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-gray-500 text-xs hidden lg:table-cell">
                    {new Date(u.createdAt).toLocaleDateString('he-IL')}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3">
                    <div className="flex gap-0.5 sm:gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={14} />}
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={14} />}
                        onClick={() => openEditModal(u)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={editModal}
        onClose={() => {
          setEditModal(false);
          setEditingUser(null);
        }}
        title={`עריכת משתמש - ${editingUser?.fullName}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
            <Input
              value={editData.fullName}
              onChange={e => setEditData({ ...editData, fullName: e.target.value })}
              placeholder="שם מלא"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
            <Input
              value={editData.phone}
              onChange={e => setEditData({ ...editData, phone: e.target.value })}
              placeholder="טלפון"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד</label>
            <select
              value={editData.role}
              onChange={e => setEditData({ ...editData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="user">משתמש</option>
              <option value="admin">מנהל</option>
              <option value="garage_owner">בעלי מוסך</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={editData.isActive}
              onChange={e => setEditData({ ...editData, isActive: e.target.checked })}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              משתמש פעיל
            </label>
          </div>

          {/* Password Management Section */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
              <Key size={14} />
              ניהול סיסמה
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => editingUser && handleResetPassword(editingUser.id)}
                disabled={passwordLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition disabled:opacity-50"
              >
                {passwordLoading ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                איפוס סיסמה ידני
              </button>
              <button
                onClick={() => editingUser && handleSendResetEmail(editingUser.id)}
                disabled={passwordLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-teal-300 text-teal-700 rounded-lg hover:bg-teal-50 transition disabled:opacity-50"
              >
                {passwordLoading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                שלח קישור איפוס במייל
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="primary"
              onClick={handleUpdate}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {updating && <Loader2 size={16} className="animate-spin" />}
              שמור שינויים
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setEditModal(false);
                setEditingUser(null);
              }}
              className="flex-1"
            >
              ביטול
            </Button>
          </div>
        </div>
      </Modal>

      {/* Credentials Modal */}
      {credentialsInfo && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={() => setCredentialsInfo(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">הסיסמה אופסה בהצלחה!</h3>
              <p className="text-sm text-gray-500 mt-1">פרטי ההתחברות החדשים:</p>
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
                    {copied === 'email' ? '\u2713' : 'העתק'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">סיסמה חדשה</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm flex-1 bg-white rounded-lg px-3 py-2 border font-bold text-teal-700">{credentialsInfo.password}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(credentialsInfo.password); setCopied('pass'); setTimeout(() => setCopied(''), 2000); }}
                    className="px-3 py-2 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                  >
                    {copied === 'pass' ? '\u2713' : 'העתק'}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 text-center">
              שלח פרטים אלו למשתמש. מומלץ שישנה את הסיסמה בכניסה הראשונה.
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

      {/* Success Action Message */}
      {actionMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-[100]" dir="rtl">
          <CheckCircle2 size={18} />
          <span className="font-medium">{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="mr-2 text-white/80 hover:text-white">&times;</button>
        </div>
      )}
    </div>
  );
}
