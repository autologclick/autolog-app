'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  Users, Search, Phone, Mail, Car, Calendar, ChevronDown, ChevronUp,
  FileText, AlertCircle, Loader2, Star, Clock, TrendingUp, Eye,
  MessageSquare, Wrench, Shield, Brain, Target, Activity
} from 'lucide-react';

interface Document {
  id: string;
  type: string;
  title: string;
  expiryDate: string | null;
}

interface Vehicle {
  id: string;
  nickname: string;
  licensePlate: string;
  manufacturer: string;
  model: string;
  year: number;
  documents: Document[];
}

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  lastVisit: string;
  totalVisits: number;
  vehicles: Vehicle[];
}

type SortOption = 'name' | 'recent' | 'visits';

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const days = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 30) return `לפני ${Math.floor(days / 7)} שבועות`;
  if (days < 365) return `לפני ${Math.floor(days / 30)} חודשים`;
  return `לפני ${Math.floor(days / 365)} שנים`;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/garage/customers', { credentials: 'include' });
      if (!response.ok) throw new Error('שגיאה בטעינת הלקוחות');
      const data = await response.json();
      setCustomers(data.customers || []);
      setError(null);
    } catch {
      setError('לא הצלחנו לטעון את רשימת הלקוחות. נסה לרענן את הדף.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = (() => {
    let result = customers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.vehicles?.some(v => v.licensePlate.includes(q) || v.nickname?.toLowerCase().includes(q))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName, 'he');
      if (sortBy === 'visits') return b.totalVisits - a.totalVisits;
      return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
    });

    return result;
  })();

  const toggleVehicle = (vehicleId: string) => {
    const next = new Set(expandedVehicles);
    next.has(vehicleId) ? next.delete(vehicleId) : next.add(vehicleId);
    setExpandedVehicles(next);
  };

  const isExpired = (date: string | null) => date ? new Date(date) < new Date() : false;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('he-IL');

  // Stats
  const totalCustomers = customers.length;
  const totalVehicles = customers.reduce((s, c) => s + (c.vehicles?.length || 0), 0);
  const recentVisitors = customers.filter(c => {
    const days = (Date.now() - new Date(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 30;
  }).length;
  const loyalCustomers = customers.filter(c => c.totalVisits >= 3).length;

  if (loading) {
    return (
      <div className="space-y-6 pt-12 lg:pt-0 animate-pulse" dir="rtl">
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-lg" /><div className="space-y-2"><div className="h-6 bg-gray-200 rounded w-36" /><div className="h-4 bg-gray-100 rounded w-20" /></div></div>
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl p-4 h-20" />)}</div>
        <div className="h-10 bg-white rounded-lg" />
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-1/3" /><div className="h-3 bg-gray-50 rounded w-1/4" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#fef7ed] rounded-lg border-2 border-[#1e3a5f] flex items-center justify-center shadow-sm">
          <Users size={20} className="text-[#1e3a5f]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">לקוחות</h1>
          <p className="text-sm text-gray-500">ניהול לקוחות והרכבים שלהם</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-4 text-white shadow-md">
          <Users size={18} className="opacity-80 mb-1" />
          <div className="text-2xl font-bold">{totalCustomers}</div>
          <div className="text-xs opacity-80">סה״כ לקוחות</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-md">
          <Car size={18} className="opacity-80 mb-1" />
          <div className="text-2xl font-bold">{totalVehicles}</div>
          <div className="text-xs opacity-80">רכבים רשומים</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-md">
          <Clock size={18} className="opacity-80 mb-1" />
          <div className="text-2xl font-bold">{recentVisitors}</div>
          <div className="text-xs opacity-80">ביקרו החודש</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-md">
          <Star size={18} className="opacity-80 mb-1" />
          <div className="text-2xl font-bold">{loyalCustomers}</div>
          <div className="text-xs opacity-80">לקוחות נאמנים</div>
        </div>
      </div>

      {/* AI Insights */}
      {customers.length > 0 && (
        <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">תובנות AI ללקוחות</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-gray-700">פעילות לקוחות</span>
              </div>
              <p className="text-xs text-gray-600">
                {recentVisitors > totalCustomers * 0.5
                  ? `📈 ${Math.round((recentVisitors / totalCustomers) * 100)}% מהלקוחות ביקרו החודש — בסיס לקוחות פעיל!`
                  : recentVisitors > 0
                  ? `📊 ${recentVisitors} מתוך ${totalCustomers} ביקרו החודש. שלחו תזכורות ללקוחות רדומים.`
                  : '⚠️ אין ביקורים החודש. מומלץ לשלוח הודעות ללקוחות קיימים.'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-gray-700">נאמנות לקוחות</span>
              </div>
              <p className="text-xs text-gray-600">
                {loyalCustomers > 0
                  ? `⭐ ${loyalCustomers} לקוחות נאמנים (3+ ביקורים). שקלו תוכנית הטבות לחיזוק הנאמנות.`
                  : '📋 אין עדיין לקוחות חוזרים. התמקדו בשירות מעולה לבניית בסיס לקוחות.'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Car size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-gray-700">רכבים לכל לקוח</span>
              </div>
              <p className="text-xs text-gray-600">
                {totalCustomers > 0
                  ? `🚗 ממוצע ${(totalVehicles / totalCustomers).toFixed(1)} רכבים ללקוח. ${totalVehicles > totalCustomers ? 'משפחות עם מספר רכבים — הציעו חבילות.' : 'רוב הלקוחות עם רכב אחד.'}`
                  : '📋 אין לקוחות עדיין.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="חפש לפי שם, טלפון, מספר רישוי..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition text-right"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-right cursor-pointer hover:border-teal-300 transition"
        >
          <option value="recent">ביקור אחרון</option>
          <option value="name">שם א-ת</option>
          <option value="visits">מספר ביקורים</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">
            {searchQuery ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}
          </h3>
          <p className="text-gray-400 text-sm">
            {searchQuery ? 'נסה לחפש במונח אחר' : 'לקוחות יופיעו כאן אחרי שיקבעו תור'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map(customer => {
            const isExpanded = expandedCustomer === customer.id;
            const initials = customer.fullName.split(' ').map(n => n[0]).join('').slice(0, 2);
            const visitScore = customer.totalVisits >= 5 ? 'gold' : customer.totalVisits >= 3 ? 'silver' : 'normal';

            return (
              <Card key={customer.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Customer Header */}
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedCustomer(isExpanded ? null : customer.id)}
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    visitScore === 'gold' ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' :
                    visitScore === 'silver' ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                    'bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700'
                  }`}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-[#1e3a5f] truncate">{customer.fullName}</h3>
                      {visitScore === 'gold' && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0 flex items-center gap-1">
                          <Star size={12} />
                          VIP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Car size={12} />
                        {(customer.vehicles?.length || 0)} רכבים
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp size={12} />
                        {customer.totalVisits} ביקורים
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        {timeAgo(customer.lastVisit)}
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {customer.phone && (
                      <a
                        href={`tel:${customer.phone}`}
                        onClick={e => e.stopPropagation()}
                        className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition"
                        title="התקשר"
                      >
                        <Phone size={15} className="text-emerald-600" />
                      </a>
                    )}
                    <a
                      href={`mailto:${customer.email}`}
                      onClick={e => e.stopPropagation()}
                      className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition"
                      title="שלח מייל"
                    >
                      <Mail size={15} className="text-blue-600" />
                    </a>
                    <div className={`w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center transition ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {/* Contact Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                        <Phone size={16} className="text-teal-600" />
                        <div>
                          <p className="text-xs text-gray-500">טלפון</p>
                          <a href={`tel:${customer.phone}`} className="text-sm font-medium text-teal-600 hover:underline">
                            {customer.phone}
                          </a>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                        <Mail size={16} className="text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">אימייל</p>
                          <a href={`mailto:${customer.email}`} className="text-sm font-medium text-blue-600 hover:underline truncate block max-w-[200px]">
                            {customer.email}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Visit Stats */}
                    <div className="flex gap-4">
                      <div className="bg-teal-50 rounded-xl px-4 py-3 flex-1 text-center">
                        <p className="text-xs text-teal-600 mb-1">ביקורים</p>
                        <p className="text-xl font-bold text-teal-700">{customer.totalVisits}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl px-4 py-3 flex-1 text-center">
                        <p className="text-xs text-blue-600 mb-1">ביקור אחרון</p>
                        <p className="text-sm font-bold text-blue-700">{formatDate(customer.lastVisit)}</p>
                      </div>
                      <div className="bg-teal-50 rounded-xl px-4 py-3 flex-1 text-center">
                        <p className="text-xs text-teal-600 mb-1">רכבים</p>
                        <p className="text-xl font-bold text-teal-700">{(customer.vehicles?.length || 0)}</p>
                      </div>
                    </div>

                    {/* Vehicles */}
                    {customer.vehicles && customer.vehicles.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <Car size={16} className="text-teal-600" />
                          רכבים ({(customer.vehicles?.length || 0)})
                        </h4>
                        <div className="space-y-2">
                          {customer.vehicles?.map(vehicle => (
                            <div key={vehicle.id} className="border border-gray-200 rounded-xl overflow-hidden">
                              <button
                                onClick={() => toggleVehicle(vehicle.id)}
                                className="w-full p-3 flex items-center justify-between hover:bg-[#fef7ed]/50 transition"
                              >
                                <div className="flex items-center gap-3 text-right">
                                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <Car size={18} className="text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm text-[#1e3a5f]">{vehicle.nickname}</p>
                                    <p className="text-xs text-gray-500">
                                      {vehicle.manufacturer} {vehicle.model} • {vehicle.year} • {vehicle.licensePlate}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {vehicle.documents?.some(d => isExpired(d.expiryDate)) && (
                                    <span className="w-2 h-2 bg-red-500 rounded-full" title="יש מסמכים שפג תוקפם" />
                                  )}
                                  <Badge variant="default" size="sm">
                                    {(vehicle.documents?.length || 0)} מסמכים
                                  </Badge>
                                  {expandedVehicles.has(vehicle.id) ? (
                                    <ChevronUp size={16} className="text-gray-400" />
                                  ) : (
                                    <ChevronDown size={16} className="text-gray-400" />
                                  )}
                                </div>
                              </button>

                              {/* Documents */}
                              {expandedVehicles.has(vehicle.id) && (
                                <div className="px-3 pb-3 border-t border-gray-100">
                                  {(vehicle.documents?.length || 0) === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">אין מסמכים</p>
                                  ) : (
                                    <div className="space-y-2 mt-3">
                                      {vehicle.documents.map(doc => {
                                        const expired = isExpired(doc.expiryDate);
                                        return (
                                          <div key={doc.id} className={`flex items-center justify-between p-2.5 rounded-lg ${
                                            expired ? 'bg-red-50' : 'bg-gray-50'
                                          }`}>
                                            <div className="flex items-center gap-2">
                                              <FileText size={14} className={expired ? 'text-red-500' : 'text-teal-600'} />
                                              <div>
                                                <p className="text-sm font-medium text-gray-800">{doc.title}</p>
                                                <p className="text-xs text-gray-500">{doc.type}</p>
                                              </div>
                                            </div>
                                            {doc.expiryDate && (
                                              <Badge variant={expired ? 'danger' : 'success'} size="sm">
                                                {expired ? 'פג תוקף' : `עד ${formatDate(doc.expiryDate)}`}
                                              </Badge>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
