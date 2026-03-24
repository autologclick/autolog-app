'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle, StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
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
  fuel: { label: 'דלק', color: 'orange', icon: Fuel },
  maintenance: { label: 'תחזוקה', color: 'purple', icon: Wrench },
  insurance: { label: 'ביטוח', color: 'blue', icon: Shield },
  test: { label: 'בדיקה', color: 'cyan', icon: Zap },
  parking: { label: 'חניה', color: 'amber', icon: MapPin },
  fines: { label: 'קנסות', color: 'red', icon: AlertTriangle },
  other: { label: 'אחר', color: 'slate', icon: DollarSign },
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
      // Reset form but keep modal open for quick successive adds
      const keepCategory = formData.category;
      const keepVehicle = formData.vehicleId;
      setFormData({
        vehicleId: keepVehicle,
        category: keepCategory,
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setError('');
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
    } catch {
      setError('שגיאת חיבור');
    }
    setSaving(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenses(expenses.filter(e => e.id !== id));
      }
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting expense');
      }
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
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 text-right">
          <div className="w-10 h-10 bg-[#fef7ed] rounded-xl border-2 border-[#1e3a5f] flex items-center justify-center shadow-sm">
            <DollarSign size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">הוצאות וקבלות</h1>
            <p className="text-sm text-gray-500">ניהול הוצאות הרכב שלך</p>
          </div>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => {
          resetForm(selectedCategory);
          setShowAddModal(true);
        }} className="w-full sm:w-auto">
          הוסף הוצאה
        </Button>
      </div>

      {/* Vehicle Selector */}
      {vehicles.length > 0 && (
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-3 text-right">בחר רכב</label>
          <select
            value={selectedVehicleId || ''}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 bg-white text-right text-sm hover:border-teal-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition appearance-none cursor-pointer"
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

      {/* Summary Section - Enhanced with 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="סה״כ הוצאות"
          value={`₪${totalExpenses.toLocaleString()}`}
          icon={<DollarSign size={20} />}
          color="navy"
        />
        <StatCard
          label="החודש"
          value={`₪${monthlyExpenses.toLocaleString()}`}
          icon={<Calendar size={20} />}
          color="teal"
        />
        <StatCard
          label="ממוצע חודשי"
          value={filteredExpenses.length > 0 ? `₪${Math.round((totalExpenses / 6)).toLocaleString()}` : '₪0'}
          icon={<TrendingDown size={20} />}
          color="green"
        />
      </div>

      {/* Category Breakdown Cards */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-right">התפלגות לפי קטגוריה</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(categoryBreakdown).map(([cat, amount]) => {
              const catData = CATEGORIES[cat as keyof typeof CATEGORIES];
              const IconComp = catData.icon;
              const percentage = ((amount / totalExpenses) * 100).toFixed(0);
              return (
                <Card key={cat} className="text-center hover:shadow-md transition">
                  <div className="flex items-center justify-center mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-${catData.color}-50 flex items-center justify-center`}>
                      <IconComp size={18} className={`text-${catData.color}-600`} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium mb-1">{catData.label}</p>
                  <p className="text-sm font-bold text-[#1e3a5f]">₪{amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">{percentage}%</p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Chart */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-right">טרנד חודשי</h3>
        <Card className="p-6">
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
        </Card>
      </div>

      {/* AI Expense Analysis */}
      {(aiExpenseLoading || aiExpenseAnalysis) && (
        <div className="bg-gradient-to-l from-[#1e3a5f]/5 to-teal-50 rounded-2xl p-5 border border-teal-100">
          <div className="flex items-center gap-2 mb-4 justify-end">
            <h3 className="text-sm font-bold text-[#1e3a5f]">ניתוח AI של הוצאות</h3>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-[#1e3a5f] flex items-center justify-center">
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

      {/* Category Filter Tabs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-right">סנן לפי קטגוריה</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {catData.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200">
            <DollarSign size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">אין הוצאות עדיין</h3>
          <p className="text-gray-500 mb-6">הוסף הוצאה כדי להתחיל לעקוב על הוצאות הרכב שלך</p>
          <Button icon={<Plus size={16} />} onClick={() => {
            resetForm(selectedCategory);
            setShowAddModal(true);
          }}>הוסף הוצאה ראשונה</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Mobile Cards View */}
          <div className="block sm:hidden space-y-3">
            {filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => {
              const catData = CATEGORIES[exp.category];
              const IconComp = catData.icon;
              return (
                <Card key={exp.id} className="hover">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${catData.color}-50 flex items-center justify-center flex-shrink-0`}>
                      <IconComp size={18} className={`text-${catData.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">{catData.label}</span>
                        <span className="font-bold text-[#1e3a5f]">₪{exp.amount.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{exp.description}</p>
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
                          <Car size={12} className="inline me-1" /> {exp.vehicle.nickname}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Card>
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 px-4 text-xs font-bold text-gray-500">תאריך</th>
                    <th className="pb-3 px-4 text-xs font-bold text-gray-500">קטגוריה</th>
                    <th className="pb-3 px-4 text-xs font-bold text-gray-500">תיאור</th>
                    <th className="pb-3 px-4 text-xs font-bold text-gray-500">רכב</th>
                    <th className="pb-3 px-4 text-xs font-bold text-gray-500">סכום</th>
                    <th className="pb-3 px-4 text-xs font-bold text-gray-500">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp, idx) => {
                    const catData = CATEGORIES[exp.category];
                    const IconComp = catData.icon;
                    return (
                      <tr key={exp.id} className={`${idx < filteredExpenses.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-[#fef7ed] transition`}>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(exp.date).toLocaleDateString('he-IL')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <IconComp size={16} className={`text-${catData.color}-600`} />
                            <span className="text-sm font-medium text-gray-700">{catData.label}</span>
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
            </Card>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="הוסף הוצאה" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">רכב</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 bg-white text-right text-sm hover:border-teal-300 transition appearance-none cursor-pointer"
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
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">קטגוריה</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as keyof typeof CATEGORIES })}
                className="w-full p-3 rounded-xl border border-gray-200 bg-white text-right text-sm hover:border-teal-300 transition appearance-none cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23666%27 d=%27M6 9L1 4h10z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center', paddingRight: '32px', paddingLeft: '12px' }}
              >
                {CATEGORY_KEYS.map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORIES[cat].label}
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
            <Button loading={saving} onClick={handleAddExpense} className="w-full sm:w-auto">הוסף הוצאה</Button>
          </div>
        </div>
      </Modal>

      {/* Floating Add Button */}
      <button
        onClick={() => {
          resetForm(selectedCategory);
          setShowAddModal(true);
        }}
        className="fixed bottom-20 end-4 lg:bottom-6 lg:end-6 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95 z-30"
      >
        <Plus size={24} />
      </button>

      {/* Edit Expense Modal */}
      <Modal isOpen={showEditModal} onClose={() => {
        setShowEditModal(false);
        setEditExpenseId(null);
        resetForm();
      }} title="ערוך הוצאה" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">רכב</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 bg-white text-right text-sm hover:border-teal-300 transition appearance-none cursor-pointer"
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
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">קטגוריה</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as keyof typeof CATEGORIES })}
                className="w-full p-3 rounded-xl border border-gray-200 bg-white text-right text-sm hover:border-teal-300 transition appearance-none cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23666%27 d=%27M6 9L1 4h10z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center', paddingRight: '32px', paddingLeft: '12px' }}
              >
                {CATEGORY_KEYS.map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORIES[cat].label}
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
            <Button loading={saving} onClick={handleEditExpense} className="w-full sm:w-auto">שמור שינויים</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
