'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardTitle, StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import {
  Plus, Edit, Trash2, Car, TrendingUp, Fuel, Wrench, Shield,
  AlertTriangle, MapPin, DollarSign, Calendar,
  Loader2, BarChart3, Zap, TrendingDown, Brain, Lightbulb, Activity
} from 'lucide-react';

interface Expense {
  id: string;
  vehicleId: string;
  vehicle?: { id: string; nickname: string; model: string };
  category: 'fuel' | 'maintenance' | 'insurance' | 'test' | 'parking' | 'fines' | 'other';
  amount: number;
  description: string;
  date: string;
  createdAt?: string;
}

interface Vehicle {
  id: string;
  nickname: string;
  manufacturer: string;
  model: string;
  licensePlate: string;
}

const CATEGORIES = {
  fuel: { label: 'דלק', color: 'orange', icon: Fuel, emoji: '⛽' },
  maintenance: { label: 'תחזוקה', color: 'purple', icon: Wrench, emoji: '🔧' },
  insurance: { label: 'ביטוח', color: 'blue', icon: Shield, emoji: '🛡️' },
  test: { label: 'בדיקה', color: 'cyan', icon: Zap, emoji: '📄' },
  parking: { label: 'חניה', color: 'amber', icon: MapPin, emoji: '🅿️' },
  fines: { label: 'קנסות', color: 'red', icon: AlertTriangle, emoji: '📝' },
  other: { label: 'אחר', color: 'slate', icon: DollarSign, emoji: '📋' },
};

const CATEGORY_KEYS = Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiExpenseAnalysis, setAiExpenseAnalysis] = useState<any>(null);
  const [aiExpenseLoading, setAiExpenseLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    category: 'fuel' as keyof typeof CATEGORIES,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Fetch vehicles and expenses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, expensesRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/expenses'),
        ]);

        const vehiclesData = await vehiclesRes.json();
        const expensesData = await expensesRes.json();

        if (vehiclesData.vehicles) setVehicles(vehiclesData.vehicles);
        if (expensesData.expenses) setExpenses(expensesData.expenses);

        // Set first vehicle as selected
        if (vehiclesData.vehicles?.length > 0) {
          setSelectedVehicleId(vehiclesData.vehicles[0].id);
        }
      } catch {
        // Use demo data
        setVehicles([
          { id: '1', nickname: 'ספורטז\' לבנה', manufacturer: 'KIA', model: 'SPORTAGE', licensePlate: '7198738' },
          { id: '2', nickname: 'פורד פוקוס', manufacturer: 'FORD', model: 'FOCUS', licensePlate: '8746868' },
        ]);
        setExpenses([
          { id: '1', vehicleId: '1', category: 'fuel', amount: 180, description: 'תדלוק דלק סולר', date: '2026-03-15', vehicle: { id: '1', nickname: 'ספורטז\' לבנה', model: 'SPORTAGE' } },
          { id: '2', vehicleId: '1', category: 'maintenance', amount: 450, description: 'החלפת שמן מנוע', date: '2026-03-10', vehicle: { id: '1', nickname: 'ספורטז\' לבנה', model: 'SPORTAGE' } },
          { id: '3', vehicleId: '2', category: 'insurance', amount: 1200, description: 'ביטוח שנתי', date: '2026-03-01', vehicle: { id: '2', nickname: 'פורד פוקוס', model: 'FOCUS' } },
          { id: '4', vehicleId: '1', category: 'parking', amount: 50, description: 'דמי חניה', date: '2026-03-18', vehicle: { id: '1', nickname: 'ספורטז\' לבנה', model: 'SPORTAGE' } },
          { id: '5', vehicleId: '1', category: 'fuel', amount: 190, description: 'תדלוק דלק סולר', date: '2026-03-12', vehicle: { id: '1', nickname: 'ספורטז\' לבנה', model: 'SPORTAGE' } },
        ]);
        setSelectedVehicleId('1');
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Fetch AI expense analysis
  useEffect(() => {
    if (expenses.length === 0) return;
    setAiExpenseLoading(true);
    const url = selectedVehicleId
      ? `/api/ai/expense-analysis?vehicleId=${selectedVehicleId}`
      : '/api/ai/expense-analysis';
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.analysis) setAiExpenseAnalysis(data.analysis);
        setAiExpenseLoading(false);
      })
      .catch(() => setAiExpenseLoading(false));
  }, [expenses.length, selectedVehicleId]);

  // Filter expenses
  const filteredExpenses = expenses.filter(exp => {
    const matchesVehicle = !selectedVehicleId || exp.vehicleId === selectedVehicleId;
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    return matchesVehicle && matchesCategory;
  });

  // Calculate statistics
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyExpenses = filteredExpenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      const now = new Date();
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Category breakdown
  const categoryBreakdown = CATEGORY_KEYS.reduce((acc, cat) => {
    const sum = filteredExpenses.filter(exp => exp.category === cat).reduce((s, e) => s + e.amount, 0);
    if (sum > 0) acc[cat] = sum;
    return acc;
  }, {} as Record<string, number>);

  // Monthly data for chart
  const monthlyData = (() => {
    const data: Record<number, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      data[date.getMonth()] = filteredExpenses
        .filter(exp => {
          const expDate = new Date(exp.date);
          return expDate.getMonth() === date.getMonth() && expDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
    }
    return data;
  })();

  const maxMonthlyExpense = Math.max(...Object.values(monthlyData), 1);

  const handleAddExpense = async () => {
    if (!formData.vehicleId || !formData.amount || !formData.category) {
      setError('אנא מלא את כל השדות הנדרשים');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'שגיאה בהוספת הוצאה');
        setSaving(false);
        return;
      }

      const newExpense = await res.json();
      const vehicle = vehicles.find(v => v.id === formData.vehicleId);
      setExpenses(prev => [...prev, { ...newExpense.expense, vehicle }]);
      setError('');
      resetForm();
      setShowAddModal(false);
    } catch {
      setError('שגיאת חיבור');
    }
    setSaving(false);
  };

  const handleEditExpense = async () => {
    if (!editExpenseId || !formData.amount || !formData.category) {
      setError('אנא מלא את כל השדות הנדרשים');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/expenses/${editExpenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'שגיאה בעדכון הוצאה');
        setSaving(false);
        return;
      }

      const updated = await res.json();
      setExpenses(expenses.map(e => e.id === editExpenseId ? updated.expense : e));
      setShowEditModal(false);
      setEditExpenseId(null);
      resetForm();
      toast.success('ההוצאה עודכנה בהצלחה');
    } catch {
      setError('שגיאת חיבור. בדוק את האינטרנט ונסה שוב.');
    }
    setSaving(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenses(expenses.filter(e => e.id !== id));
        toast.success('ההוצאה נמחקה בהצלחה');
      } else {
        toast.error('לא הצלחנו למחוק את ההוצאה. נסה שוב.');
      }
    } catch {
      toast.error('שגיאת חיבור. בדוק את האינטרנט ונסה שוב.');
    }
  };

  const openEditModal = (expense: Expense) => {
    setEditExpenseId(expense.id);
    setFormData({
      vehicleId: expense.vehicleId,
      category: expense.category,
      amount: String(expense.amount),
      description: expense.description,
      date: expense.date,
    });
    setError('');
    setShowEditModal(true);
  };

  const resetForm = (presetCategory?: string) => {
    setFormData({
      vehicleId: selectedVehicleId || '',
      category: (presetCategory && presetCategory !== 'all' ? presetCategory : 'fuel') as keyof typeof CATEGORIES,
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setError('');
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const currentMonth = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-[#fef7ed] pb-24" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <PageHeader
          title="הוצאות"
          subtitle={currentMonth}
        />

        {/* CTA Button */}
        <Button
          icon={<Plus size={16} />}
          onClick={() => {
            resetForm(selectedCategory);
            setShowAddModal(true);
          }}
          className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
        >
          הוסף הוצאה
        </Button>

        {/* Vehicle Selector */}
        {vehicles.length > 0 && (
          <div className="relative">
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-3 text-right">בחר רכב</label>
            <select
              value={selectedVehicleId || ''}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-right text-sm hover:border-teal-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition appearance-none cursor-pointer text-[#1e3a5f]"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23666%27 d=%27M6 9L1 4h10z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center', paddingRight: '32px', paddingLeft: '12px' }}
            >
              <option value="">כל הרכבים</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.nickname} ({v.licensePlate})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats Row - 3 stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500 mb-1">סה״כ הוצאות</p>
            <p className="text-lg font-bold text-[#1e3a5f]">₪{totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500 mb-1">החודש</p>
            <p className="text-lg font-bold text-teal-600">₪{monthlyExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500 mb-1">ממוצע חודשי</p>
            <p className="text-lg font-bold text-[#1e3a5f]">₪{filteredExpenses.length > 0 ? Math.round((totalExpenses / 6)).toLocaleString() : '0'}</p>
          </div>
        </div>

        {/* Category Breakdown Cards */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[#1e3a5f] mb-3 text-right">התפלגות לפי קטגוריה</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(categoryBreakdown).map(([cat, amount]) => {
                const catData = CATEGORIES[cat as keyof typeof CATEGORIES];
                const percentage = ((amount / totalExpenses) * 100).toFixed(0);
                return (
                  <div key={cat} className="bg-white rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition">
                    <div className="text-2xl mb-2">{catData.emoji}</div>
                    <p className="text-xs text-gray-500 font-medium mb-2">{catData.label}</p>
                    <p className="text-sm font-bold text-[#1e3a5f]">₪{amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">{percentage}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Monthly Chart */}
        <div>
          <h3 className="text-sm font-semibold text-[#1e3a5f] mb-3 text-right">טרנד חודשי</h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-end justify-center gap-2 h-40">
              {Object.entries(monthlyData).map(([month, amount]) => {
                const months = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספ', 'אוק', 'נוב', 'דצ'];
                const monthLabel = months[parseInt(month)];
                const height = maxMonthlyExpense > 0 ? (amount / maxMonthlyExpense) * 100 : 0;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full h-full flex flex-col justify-end">
                      <div
                        className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg transition-all hover:from-teal-700 hover:to-teal-500 hover:shadow-lg"
                        style={{ height: `${Math.max(height, 8)}%` }}
                        title={`₪${amount}`}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{monthLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Expense Analysis */}
        {(aiExpenseLoading || aiExpenseAnalysis) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-teal-100">
            <div className="flex items-center gap-2 mb-4 justify-end">
              <h3 className="text-sm font-bold text-[#1e3a5f]">ניתוח AI של הוצאות</h3>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                <Brain size={16} className="text-white" />
              </div>
            </div>

          {aiExpenseLoading ? (
            <div className="flex items-center justify-center py-4 gap-2">
              <span className="text-sm text-gray-400">מנתח הוצאות...</span>
              <Loader2 size={18} className="animate-spin text-teal-500" />
            </div>
          ) : aiExpenseAnalysis ? (
            <div className="space-y-3">
              {/* Trend & Average */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/70 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    {aiExpenseAnalysis.trend === 'increasing' ? (
                      <TrendingUp size={16} className="text-red-500" />
                    ) : aiExpenseAnalysis.trend === 'decreasing' ? (
                      <TrendingDown size={16} className="text-green-500" />
                    ) : (
                      <Activity size={16} className="text-blue-500" />
                    )}
                  </div>
                  <div className={`text-sm font-bold ${
                    aiExpenseAnalysis.trend === 'increasing' ? 'text-red-600' :
                    aiExpenseAnalysis.trend === 'decreasing' ? 'text-green-600' : 'text-blue-600'
                  }`}>{aiExpenseAnalysis.trendLabel}</div>
                  <div className="text-[10px] text-gray-400">מגמה</div>
                </div>
                <div className="bg-white/70 rounded-xl p-3 text-center">
                  <div className="text-sm font-bold text-[#1e3a5f]">₪{aiExpenseAnalysis.monthlyAverage?.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400">ממוצע חודשי</div>
                </div>
              </div>

              {/* Insights */}
              {aiExpenseAnalysis.insights?.length > 0 && (
                <div className="space-y-2">
                  {aiExpenseAnalysis.insights.map((insight: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 bg-white/50 rounded-lg p-2.5 text-right">
                      <span className="text-xs text-gray-600 leading-relaxed">{insight}</span>
                      <Lightbulb size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    </div>
                  ))}
                </div>
              )}

              {/* Forecast */}
              {aiExpenseAnalysis.forecast && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-right">
                  <div className="text-xs font-bold text-teal-800 mb-1 flex items-center gap-1.5 justify-end">
                    תחזית
                    <BarChart3 size={14} className="text-teal-500" />
                  </div>
                  <p className="text-xs text-teal-700">{aiExpenseAnalysis.forecast}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

        {/* Category Filter Chips */}
        <div className="flex flex-wrap justify-center gap-2 py-3 px-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-200 text-sm ${
              selectedCategory === 'all'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-200'
                : 'bg-gray-50 text-gray-600 hover:bg-teal-50 hover:text-teal-700 border border-gray-200'
            }`}
          >
            הכל
          </button>
          {CATEGORY_KEYS.map(cat => {
            const catData = CATEGORIES[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-200 text-sm ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-teal-50 hover:text-teal-700 border border-gray-200'
                }`}
              >
                {catData.emoji} {catData.label}
              </button>
            );
          })}
        </div>

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">אין הוצאות עדיין</h3>
            <p className="text-gray-500 mb-6">הוסף הוצאה כדי להתחיל לעקוב על הוצאות הרכב שלך</p>
            <Button
              icon={<Plus size={16} />}
              onClick={() => {
                resetForm(selectedCategory);
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-teal-500 to-teal-600"
            >
              הוסף הוצאה ראשונה
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Mobile Cards View */}
            <div className="block sm:hidden space-y-3">
              {filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => {
                const catData = CATEGORIES[exp.category];
                return (
                  <div key={exp.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">
                      {catData.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">{catData.label}</span>
                        <span className="font-bold text-[#1e3a5f]">₪{exp.amount.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{exp.description}</p>
                      <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="text-teal-600 hover:text-teal-700 font-medium"
                          >
                            עריכה
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            מחיקה
                          </button>
                        </div>
                        <span>{new Date(exp.date).toLocaleDateString('he-IL')}</span>
                      </div>
                      {exp.vehicle && (
                        <p className="text-xs text-gray-400 mt-2">
                          {exp.vehicle.nickname}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="py-3 px-4 text-xs font-bold text-gray-500">תאריך</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500">קטגוריה</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500">תיאור</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500">רכב</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500">סכום</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp, idx) => {
                      const catData = CATEGORIES[exp.category];
                      return (
                        <tr key={exp.id} className={`${idx < filteredExpenses.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-[#fef7ed] transition`}>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(exp.date).toLocaleDateString('he-IL')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-sm font-medium text-[#1e3a5f]">{catData.label}</span>
                              <span className="text-lg">{catData.emoji}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">{exp.description}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {exp.vehicle?.nickname || '—'}
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-[#1e3a5f]">
                            ₪{exp.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(exp)}
                                className="text-teal-600 hover:text-teal-700 transition"
                                title="ערוך"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="text-red-600 hover:text-red-700 transition"
                                title="מחק"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="הוסף הוצאה" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-2 text-right">רכב</label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-right text-sm hover:border-teal-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition appearance-none cursor-pointer text-[#1e3a5f]"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23666%27 d=%27M6 9L1 4h10z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center', paddingRight: '32px', paddingLeft: '12px' }}
                >
                  <option value="">בחר רכב</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.nickname} ({v.licensePlate})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-2 text-right">קטגוריה</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as keyof typeof CATEGORIES })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-right text-sm hover:border-teal-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition appearance-none cursor-pointer text-[#1e3a5f]"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23666%27 d=%27M6 9L1 4h10z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center', paddingRight: '32px', paddingLeft: '12px' }}
                >
                  {CATEGORY_KEYS.map(cat => (
                    <option key={cat} value={cat}>
                      {CATEGORIES[cat].emoji} {CATEGORIES[cat].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label="סכום (₪)"
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <Input
                label="תאריך"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <Input
              label="תיאור"
              placeholder="לדוגמה: תדלוק דלק, החלפת שמן, ביטוח שנתי..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button variant="ghost" onClick={() => { setShowAddModal(false); resetForm(); }} className="w-full sm:w-auto">סיום</Button>
              <Button loading={saving} onClick={handleAddExpense} className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-teal-600">הוסף הוצאה</Button>
            </div>
          </div>
        </Modal>

        {/* Edit Expense Modal */}
        <Modal isOpen={showEditModal} onClose={() => {
          setShowEditModal(false);
          setEditExpenseId(null);
          resetForm();
        }} title="ערוך הוצאה" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-2 text-right">רכב</label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-right text-sm hover:border-teal-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition appearance-none cursor-pointer text-[#1e3a5f]"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23666%27 d=%27M6 9L1 4h10z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center', paddingRight: '32px', paddingLeft: '12px' }}
                >
                  <option value="">בחר רכב</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.nickname} ({v.licensePlate})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-2 text-right">קטגוריה</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as keyof typeof CATEGORIES })}
                  className="w-full p-3 rounded-2xl border border-gray-200 bg-white text-right text-sm hover:border-teal-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition appearance-none cursor-pointer text-[#1e3a5f]"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23666%27 d=%27M6 9L1 4h10z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center', paddingRight: '32px', paddingLeft: '12px' }}
                >
                  {CATEGORY_KEYS.map(cat => (
                    <option key={cat} value={cat}>
                      {CATEGORIES[cat].emoji} {CATEGORIES[cat].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label="סכום (₪)"
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <Input
                label="תאריך"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <Input
              label="תיאור"
              placeholder="לדוגמה: תדלוק דלק, החלפת שמן, ביטוח שנתי..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button variant="ghost" onClick={() => {
                setShowEditModal(false);
                setEditExpenseId(null);
                resetForm();
              }} className="w-full sm:w-auto">ביטול</Button>
              <Button loading={saving} onClick={handleEditExpense} className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-teal-600">שמור שינויים</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
