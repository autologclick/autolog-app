'use client';

import { useEffect, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  FileText,
  Shield,
  Car,
  User,
  Calendar,
  Download,
  Eye,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Search,
  Filter,
  FolderOpen,
  Brain,
  Clock,
  Target,
  TrendingUp,
} from 'lucide-react';

const typeLabels: Record<string, string> = {
  insurance_compulsory: 'ביטוח חובה',
  insurance_comprehensive: 'ביטוח מקיף',
  insurance_third_party: 'ביטוח צד ג׳',
  license: 'רישיון רכב',
  registration: 'רישום',
  test_certificate: 'תעודת טסט',
  receipt: 'קבלה',
  photo: 'תמונה',
  other: 'אחר',
};

const getTypeBadgeColor = (type: string): 'info' | 'success' | 'warning' | 'danger' | 'default' => {
  if (['insurance_compulsory', 'insurance_comprehensive', 'insurance_third_party'].includes(type))
    return 'info';
  if (['license', 'registration'].includes(type)) return 'default';
  if (type === 'test_certificate') return 'success';
  if (type === 'receipt') return 'warning';
  return 'default';
};

const getExpiryColor = (expiryDate: string | null) => {
  if (!expiryDate) return 'text-gray-600';
  const daysUntilExpiry = Math.ceil(
    (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntilExpiry < 0) return 'text-red-600';
  if (daysUntilExpiry <= 30) return 'text-amber-600';
  return 'text-green-600';
};

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, expiringSoon: 0, expired: 0 });

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/admin/documents?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);

        const total = data.documents?.length || 0;
        const expiringSoon = data.documents?.filter((doc: any) => {
          if (!doc.expiryDate) return false;
          const daysUntil = Math.ceil(
            (new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysUntil >= 0 && daysUntil <= 30;
        }).length || 0;
        const expired = data.documents?.filter((doc: any) => {
          if (!doc.expiryDate) return false;
          return new Date(doc.expiryDate) < new Date();
        }).length || 0;

        setStats({ total, expiringSoon, expired });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch documents:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [searchTerm, typeFilter]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('he-IL');
  };

  return (
    <div dir="rtl" className="space-y-6 pt-12 lg:pt-0">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">ניהול מסמכים</h1>
            <p className="text-sm text-gray-500">ניהול וצפייה בכל המסמכים של המשתמשים</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border border-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">סה"כ מסמכים</p>
                  <p className="text-2xl font-bold text-[#1e3a5f]">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">פקיעה קרובה</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">פקעו</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">סוגים</p>
                  <p className="text-2xl font-bold text-teal-600">{Object.keys(typeLabels).length}</p>
                </div>
                <Shield className="w-8 h-8 text-teal-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Row */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute end-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש לפי שם מסמך או בעלים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pe-10 ps-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">כל הסוגים</option>
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <Button
              onClick={() => fetchDocuments()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              רענן
            </Button>
          </div>
        </div>

        {/* AI Document Insights */}
        {!loading && documents.length > 0 && (
          <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-teal-200 rounded-xl p-5 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#0d9488] bg-opacity-10 rounded-lg flex items-center justify-center">
                <Brain size={18} className="text-[#0d9488]" />
              </div>
              <h2 className="text-lg font-bold text-[#1e3a5f]">תובנות AI למסמכים</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.expired > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-800">מסמכים שפגו תוקף</p>
                    <p className="text-xs text-red-600 mt-0.5">{stats.expired} מסמכים דורשים חידוש מיידי — יש ליידע את המשתמשים</p>
                  </div>
                </div>
              )}
              {stats.expiringSoon > 0 && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <Clock size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">פקיעה קרובה</p>
                    <p className="text-xs text-amber-600 mt-0.5">{stats.expiringSoon} מסמכים יפקעו ב-30 הימים הקרובים — מומלץ לשלוח תזכורות</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-xl border border-teal-200">
                <Target size={18} className="text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-teal-800">סטטוס כללי</p>
                  <p className="text-xs text-teal-600 mt-0.5">
                    {stats.expired === 0 && stats.expiringSoon === 0
                      ? 'כל המסמכים בתוקף — מצוין!'
                      : `${stats.total - stats.expired - stats.expiringSoon} מתוך ${stats.total} מסמכים בתוקף מלא`
                    }
                  </p>
                </div>
              </div>
              {(() => {
                const insuranceDocs = documents.filter(d => d.type?.startsWith('insurance_'));
                const pct = stats.total > 0 ? Math.round((insuranceDocs.length / stats.total) * 100) : 0;
                return (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <TrendingUp size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-800">התפלגות מסמכים</p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        {pct}% מהמסמכים הם ביטוח — {insuranceDocs.length} מתוך {stats.total}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Documents List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : documents.length === 0 ? (
          <Card className="bg-white border border-gray-200 p-8">
            <div className="text-center">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">לא נמצאו מסמכים</p>
              <p className="text-gray-500 text-sm mt-1">נסו לשנות את הסננים או חפשו מונח אחר</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      מסמך
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      רכב
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      בעלים
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      תאריך פקיעה
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      תאריך יצירה
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-200 hover:bg-[#fef7ed]/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-[#1e3a5f]">{doc.title}</p>
                            <Badge variant={getTypeBadgeColor(doc.type)} className="text-xs mt-1">
                              {typeLabels[doc.type] || doc.type}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Car className="w-4 h-4" />
                          <div>
                            <p className="font-medium text-[#1e3a5f]">{doc.vehicleNickname}</p>
                            <p className="text-xs text-gray-500">{doc.licensePlate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-[#1e3a5f]">{doc.ownerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 text-sm ${getExpiryColor(doc.expiryDate)}`}>
                          <Calendar className="w-4 h-4" />
                          {doc.expiryDate ? formatDate(doc.expiryDate) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          צפייה
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="bg-white border border-gray-200 p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <p className="font-medium text-[#1e3a5f]">{doc.title}</p>
                        </div>
                        <Badge variant={getTypeBadgeColor(doc.type)} className="text-xs">
                          {typeLabels[doc.type] || doc.type}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Car className="w-4 h-4" />
                        <div>
                          <p className="font-medium text-[#1e3a5f]">{doc.vehicleNickname}</p>
                          <p className="text-xs text-gray-500">{doc.licensePlate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="text-[#1e3a5f]">{doc.ownerName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className={`flex items-center gap-2 ${getExpiryColor(doc.expiryDate)}`}>
                        <Calendar className="w-4 h-4" />
                        <span>{doc.expiryDate ? formatDate(doc.expiryDate) : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      צפייה
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
