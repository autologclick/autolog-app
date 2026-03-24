'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle, StatCard } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Receipt,
  Search,
  Filter,
  DollarSign,
  Car,
  User,
  Calendar,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Fuel,
  Wrench,
  Shield,
  ParkingCircle,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

const categoryConfig = {
  fuel: { label: 'דלק', icon: Fuel, color: 'text-orange-600 bg-orange-50' },
  maintenance: { label: 'תחזוקה', icon: Wrench, color: 'text-blue-600 bg-blue-50' },
  insurance: { label: 'ביטוח', icon: Shield, color: 'text-teal-600 bg-teal-50' },
  test: { label: 'טסט', icon: FileCheck, color: 'text-green-600 bg-green-50' },
  parking: { label: 'חנייה', icon: ParkingCircle, color: 'text-teal-600 bg-teal-50' },
  fines: { label: 'קנסות', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  other: { label: 'אחר', icon: Receipt, color: 'text-gray-600 bg-gray-50' },
};

type Expense = {
  id: string;
  category: string;
  amount: number;
  description: string;
  vehicleNickname: string;
  vehiclePlate: string;
  ownerName: string;
  date: string;
};

type Stats = {
  totalExpenses: number;
  thisMonthTotal: number;
  averagePerVehicle: number;
  totalEntries: number;
  byCategory: Record<string, number>;
};

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (fromMonth) params.append('fromMonth', fromMonth);
      if (toMonth) params.append('toMonth', toMonth);

      const response = await fetch(`/api/admin/expenses?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setExpenses(data.expenses || []);
      setStats(data.stats);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch expenses:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, searchTerm, selectedCategory, fromMonth, toMonth]);

  const categories = Object.keys(categoryConfig);

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] border-2 border-[#1e3a5f] rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">ניהול הוצאות</h1>
            <p className="text-sm text-gray-500">צפייה וניהול כל הוצאות המשתמשים</p>
          </div>
        </div>
        <Button
          onClick={fetchExpenses}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          רענן
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="סך הוצאות" value={`₪${stats.totalExpenses.toLocaleString('he-IL')}`} icon={<DollarSign size={20} />} color="teal" />
          <StatCard label="הוצאות החודש" value={`₪${stats.thisMonthTotal.toLocaleString('he-IL')}`} icon={<Calendar size={20} />} color="green" />
          <StatCard label="ממוצע לרכב" value={`₪${stats.averagePerVehicle.toLocaleString('he-IL')}`} icon={<Car size={20} />} color="orange" />
          <StatCard label="מספר רשומות" value={stats.totalEntries.toString()} icon={<TrendingUp size={20} />} color="navy" />
        </div>
      )}

      {/* Category Breakdown */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-6">
          {categories.map((category) => {
            const amount = stats.byCategory[category] || 0;
            const config = categoryConfig[category as keyof typeof categoryConfig];
            const Icon = config.icon;
            return (
              <Card key={category} className="p-3">
                <div className={`p-2 rounded mb-2 inline-block ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-gray-600">{config.label}</p>
                <p className="font-semibold text-sm">
                  ₪{amount.toLocaleString('he-IL')}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white md:col-span-2">
            <Search className="w-4 h-4 text-gray-400 order-2" />
            <input
              type="text"
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="flex-1 outline-none text-sm order-1"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 bg-white text-sm cursor-pointer"
          >
            <option value="all">כל הקטגוריות</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {categoryConfig[cat as keyof typeof categoryConfig].label}
              </option>
            ))}
          </select>
          <input
            type="month"
            value={fromMonth}
            onChange={(e) => {
              setFromMonth(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 bg-white text-sm"
          />
          <input
            type="month"
            value={toMonth}
            onChange={(e) => {
              setToMonth(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 bg-white text-sm"
          />
        </div>
      </Card>

      {/* Expenses Table/Cards */}
      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">טוען...</p>
        </Card>
      ) : expenses.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">לא נמצאו הוצאות</p>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto mb-6">
            <Card>
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="p-4 text-right font-semibold">קטגוריה</th>
                    <th className="p-4 text-right font-semibold">סכום</th>
                    <th className="p-4 text-right font-semibold">תיאור</th>
                    <th className="p-4 text-right font-semibold">רכב</th>
                    <th className="p-4 text-right font-semibold">בעלים</th>
                    <th className="p-4 text-right font-semibold">תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const config = categoryConfig[expense.category as keyof typeof categoryConfig];
                    const Icon = config?.icon || Receipt;
                    return (
                      <tr key={expense.id} className="border-b hover:bg-[#fef7ed]/50">
                        <td className="p-4">
                          <div className={`w-fit px-2 py-1 rounded ${config?.color}`}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span className="text-xs">{config?.label}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold">
                          ₪{expense.amount.toLocaleString('he-IL')}
                        </td>
                        <td className="p-4 text-gray-600">{expense.description}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Car className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium">{expense.vehicleNickname}</p>
                              <p className="text-xs text-gray-500">{expense.vehiclePlate}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            {expense.ownerName}
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">
                          {new Date(expense.date).toLocaleDateString('he-IL')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 mb-6">
            {expenses.map((expense) => {
              const config = categoryConfig[expense.category as keyof typeof categoryConfig];
              const Icon = config?.icon || Receipt;
              return (
                <Card key={expense.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-fit px-2 py-1 rounded ${config?.color}`}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{config?.label}</span>
                      </div>
                    </div>
                    <p className="font-semibold">₪{expense.amount.toLocaleString('he-IL')}</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{expense.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{expense.vehicleNickname}</p>
                        <p className="text-xs text-gray-500">{expense.vehiclePlate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {expense.ownerName}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(expense.date).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="outline"
            >
              הקודם
            </Button>
            <span className="text-sm text-gray-600">עמוד {page}</span>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={expenses.length < pageSize}
              variant="outline"
            >
              הבא
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
