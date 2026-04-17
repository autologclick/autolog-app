'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText, Download, Share2, ArrowRight, Loader2,
  Car, Wrench, Calendar, DollarSign, ClipboardCheck,
  FileCheck, ChevronDown, ChevronUp, Mail, MessageCircle,
  Printer, AlertCircle, Shield, Gauge, Clock,
} from 'lucide-react';

interface VehicleInfo {
  nickname: string;
  manufacturer: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  vin: string;
  testExpiryDate: string | null;
  insuranceExpiry: string | null;
}

interface Summary {
  totalTreatments: number;
  totalAppointments: number;
  totalInspections: number;
  totalExpenses: number;
  totalCost: number;
  lastTreatmentDate: string | null;
  lastInspectionDate: string | null;
  lastMileage: number;
}

interface TreatmentItem {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string | null;
  garageName: string | null;
  mechanicName: string | null;
  mileage: number | null;
  cost: number | null;
  items: string | null;
}

interface AppointmentItem {
  id: string;
  date: string;
  time: string;
  serviceType: string;
  status: string;
  garageName: string;
  garageCity: string;
  completionNotes: string | null;
}

interface InspectionItem {
  id: string;
  date: string;
  type: string;
  overallScore: number | null;
  garageName: string | null;
  summary: string | null;
}

interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string | null;
}

interface DocumentItem {
  id: string;
  type: string;
  title: string;
  expiryDate: string | null;
}

interface ReportData {
  vehicle: VehicleInfo;
  summary: Summary;
  treatments: TreatmentItem[];
  appointments: AppointmentItem[];
  inspections: InspectionItem[];
  expenses: ExpenseItem[];
  documents: DocumentItem[];
  generatedAt: string;
}

const statusLabels: Record<string, string> = {
  completed: 'הושלם',
  confirmed: 'מאושר',
  in_progress: 'בטיפול',
  pending: 'ממתין',
};

const docTypeLabels: Record<string, string> = {
  insurance: 'ביטוח',
  test: 'טסט',
  license: 'רישיון',
  receipt: 'קבלה',
  report: 'דוח',
  other: 'אחר',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('he-IL');
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(amount);
}

type SectionKey = 'treatments' | 'appointments' | 'inspections' | 'expenses' | 'documents';

export default function VehicleReportPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    treatments: true,
    appointments: true,
    inspections: true,
    expenses: true,
    documents: true,
  });
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReport();
  }, [vehicleId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/report`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'שגיאה בטעינת הדוח');
      }
      const data = await res.json();
      setReport(data);
    } catch {
      setError('לא הצלחנו לטעון את הדוח. בדוק את החיבור לאינטרנט ונסה שוב.');
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(key: SectionKey) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const element = document.getElementById('report-content');
      if (!element) return;

      // Hide buttons during capture
      const noPrintEls = element.querySelectorAll('.no-print');
      noPrintEls.forEach(el => (el as HTMLElement).style.display = 'none');

      // Open all collapsible sections for PDF
      const hiddenSections = element.querySelectorAll('[data-collapsed="true"]');
      hiddenSections.forEach(el => el.setAttribute('data-collapsed', 'false'));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        windowWidth: 800,
      });

      // Restore buttons
      noPrintEls.forEach(el => (el as HTMLElement).style.display = '');

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 16;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 8;

      pdf.addImage(imgData, 'JPEG', 8, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 16);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 8;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 8, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 16);
      }

      const plateNum = data?.vehicle?.licensePlate || 'vehicle';
      pdf.save(`vehicle-report-${plateNum}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('לא הצלחנו ליצור את קובץ ה־PDF. נסה שוב.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  function handleShareWhatsApp() {
    const text = `דוח היסטוריית רכב - ${report?.vehicle.manufacturer} ${report?.vehicle.model} ${report?.vehicle.year}\n` +
      `לוחית רישוי: ${report?.vehicle.licensePlate}\n` +
      `סה"כ טיפולים: ${report?.summary.totalTreatments}\n` +
      `קילומטראז׳ אחרון: ${report?.summary.lastMileage ? report.summary.lastMileage.toLocaleString() : 'לא ידוע'}\n` +
      `עלות כוללת: ${formatCurrency(report?.summary.totalCost || 0)}\n\n` +
      `הדוח נוצר ע"י AutoLog`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShareMenuOpen(false);
  }

  function handleShareEmail() {
    const subject = `דוח היסטוריית רכב - ${report?.vehicle.manufacturer} ${report?.vehicle.model} ${report?.vehicle.year}`;
    const body = `דוח היסטוריית רכב\n\n` +
      `רכב: ${report?.vehicle.manufacturer} ${report?.vehicle.model} ${report?.vehicle.year}\n` +
      `לוחית רישוי: ${report?.vehicle.licensePlate}\n` +
      `סה"כ טיפולים: ${report?.summary.totalTreatments}\n` +
      `סה"כ בדיקות: ${report?.summary.totalInspections}\n` +
      `קילומטראז׳ אחרון: ${report?.summary.lastMileage ? report.summary.lastMileage.toLocaleString() : 'לא ידוע'}\n` +
      `עלות כוללת: ${formatCurrency(report?.summary.totalCost || 0)}\n\n` +
      `הדוח נוצר ע"י AutoLog`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    setShareMenuOpen(false);
  }

  function handlePrint() {
    window.print();
    setShareMenuOpen(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#1e3a5f] mx-auto mb-3" />
          <p className="text-gray-500 text-sm">טוען דוח היסטוריית רכב...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-2">{error || 'שגיאה בטעינת הדוח'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm hover:bg-[#2a4a6f] transition"
          >
            חזרה
          </button>
        </div>
      </div>
    );
  }

  const { vehicle, summary } = report;

  return (
    <div id="report-content" className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Header */}
      <div className="bg-[#1e3a5f] text-white no-print">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-white/80 hover:text-white text-sm transition"
            >
              <ArrowRight size={18} />
              חזרה
            </button>
            <div className="flex items-center gap-2">
              {/* Share button */}
              <div className="relative" ref={shareRef}>
                <button
                  onClick={() => setShareMenuOpen(!shareMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition"
                >
                  <Share2 size={16} />
                  שיתוף
                </button>
                {shareMenuOpen && (
                  <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 min-w-[180px]">
                    <button
                      onClick={handleShareWhatsApp}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <MessageCircle size={16} className="text-green-500" />
                      WhatsApp
                    </button>
                    <button
                      onClick={handleShareEmail}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Mail size={16} className="text-blue-500" />
                      אימייל
                    </button>
                    <button
                      onClick={handlePrint}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Printer size={16} className="text-gray-500" />
                      הדפסה
                    </button>
                  </div>
                )}
              </div>
              {/* Download PDF */}
              <button
                onClick={handleDownloadPdf}
                disabled={generatingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition disabled:opacity-50"
              >
                {generatingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Vehicle Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-l from-[#1e3a5f] to-[#2a5080] p-5 text-white">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <Car size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold">דוח היסטוריית רכב</h1>
                <p className="text-white/80 text-sm mt-0.5">
                  {vehicle.manufacturer} {vehicle.model} {vehicle.year}
                </p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-white/70">
                  <span className="bg-white/10 px-2.5 py-1 rounded-full">
                    {vehicle.licensePlate}
                  </span>
                  {vehicle.color && (
                    <span className="bg-white/10 px-2.5 py-1 rounded-full">{vehicle.color}</span>
                  )}
                  {vehicle.vin && (
                    <span className="bg-white/10 px-2.5 py-1 rounded-full">שלדה: {vehicle.vin}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status row */}
          <div className="grid grid-cols-2 divide-x divide-gray-100" style={{ direction: 'rtl' }}>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-1">
                <Shield size={14} />
                ביטוח
              </div>
              <p className="text-sm font-medium text-gray-800">
                {vehicle.insuranceExpiry ? formatDate(vehicle.insuranceExpiry) : 'לא הוגדר'}
              </p>
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-1">
                <FileCheck size={14} />
                טסט
              </div>
              <p className="text-sm font-medium text-gray-800">
                {vehicle.testExpiryDate ? formatDate(vehicle.testExpiryDate) : 'לא הוגדר'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'טיפולים', value: summary.totalTreatments, icon: Wrench, color: 'text-blue-600 bg-blue-50' },
            { label: 'בדיקות', value: summary.totalInspections, icon: ClipboardCheck, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'ק"מ אחרון', value: summary.lastMileage ? summary.lastMileage.toLocaleString() : '—', icon: Gauge, color: 'text-purple-600 bg-purple-50' },
            { label: 'עלות כוללת', value: formatCurrency(summary.totalCost), icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-3.5 text-center shadow-sm">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Treatments Section */}
        {report.treatments.length > 0 && (
          <CollapsibleSection
            title="היסטוריית טיפולים"
            icon={Wrench}
            count={report.treatments.length}
            expanded={expandedSections.treatments}
            onToggle={() => toggleSection('treatments')}
            color="blue"
          >
            <div className="divide-y divide-gray-50">
              {report.treatments.map((t) => (
                <div key={t.id} className="p-4 hover:bg-gray-50/50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800 text-sm">{t.title}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{t.type}</span>
                      </div>
                      {t.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                        {t.garageName && <span>מוסך: {t.garageName}</span>}
                        {t.mechanicName && <span>מכונאי: {t.mechanicName}</span>}
                        {t.mileage && <span>{t.mileage.toLocaleString()} ק"מ</span>}
                      </div>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                      {t.cost != null && t.cost > 0 && (
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatCurrency(t.cost)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Inspections Section */}
        {report.inspections.length > 0 && (
          <CollapsibleSection
            title="בדיקות רכב"
            icon={ClipboardCheck}
            count={report.inspections.length}
            expanded={expandedSections.inspections}
            onToggle={() => toggleSection('inspections')}
            color="emerald"
          >
            <div className="divide-y divide-gray-50">
              {report.inspections.map((i) => (
                <div key={i.id} className="p-4 hover:bg-gray-50/50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800 text-sm">{i.type}</span>
                        {i.overallScore != null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            i.overallScore >= 80 ? 'bg-emerald-50 text-emerald-700' :
                            i.overallScore >= 60 ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            ציון: {i.overallScore}
                          </span>
                        )}
                      </div>
                      {i.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{i.summary}</p>}
                      {i.garageName && <p className="text-xs text-gray-400 mt-1">מוסך: {i.garageName}</p>}
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">{formatDate(i.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Appointments Section */}
        {report.appointments.length > 0 && (
          <CollapsibleSection
            title="תורים"
            icon={Calendar}
            count={report.appointments.length}
            expanded={expandedSections.appointments}
            onToggle={() => toggleSection('appointments')}
            color="violet"
          >
            <div className="divide-y divide-gray-50">
              {report.appointments.map((a) => (
                <div key={a.id} className="p-4 hover:bg-gray-50/50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800 text-sm">{a.serviceType}</span>
                        <span className="text-xs px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full">
                          {statusLabels[a.status] || a.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400">
                        <span>{a.garageName}</span>
                        {a.garageCity && <span>{a.garageCity}</span>}
                        {a.time && <span>שעה: {a.time}</span>}
                      </div>
                      {a.completionNotes && <p className="text-xs text-gray-500 mt-1">{a.completionNotes}</p>}
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">{formatDate(a.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Expenses Section */}
        {report.expenses.length > 0 && (
          <CollapsibleSection
            title="הוצאות"
            icon={DollarSign}
            count={report.expenses.length}
            expanded={expandedSections.expenses}
            onToggle={() => toggleSection('expenses')}
            color="amber"
          >
            <div className="divide-y divide-gray-50">
              {report.expenses.map((e) => (
                <div key={e.id} className="p-4 hover:bg-gray-50/50 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 text-sm">{e.category}</span>
                      </div>
                      {e.description && <p className="text-xs text-gray-500 mt-0.5">{e.description}</p>}
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-xs text-gray-400">{formatDate(e.date)}</p>
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(e.amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Documents Section */}
        {report.documents.length > 0 && (
          <CollapsibleSection
            title="מסמכים"
            icon={FileText}
            count={report.documents.length}
            expanded={expandedSections.documents}
            onToggle={() => toggleSection('documents')}
            color="slate"
          >
            <div className="divide-y divide-gray-50">
              {report.documents.map((d) => (
                <div key={d.id} className="p-4 hover:bg-gray-50/50 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 text-sm">{d.title}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full">
                        {docTypeLabels[d.type] || d.type}
                      </span>
                    </div>
                    {d.expiryDate && (
                      <p className="text-xs text-gray-400 flex-shrink-0">
                        תוקף: {formatDate(d.expiryDate)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Footer */}
        <div className="text-center py-6 text-xs text-gray-300">
          <p>דוח זה נוצר באופן אוטומטי ע"י AutoLog</p>
          <p className="mt-0.5">{formatDate(report.generatedAt)}</p>
        </div>
      </div>
    </div>
  );
}

/* Collapsible Section Component */
function CollapsibleSection({
  title,
  icon: Icon,
  count,
  expanded,
  onToggle,
  color,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  color: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    violet: 'text-violet-600 bg-violet-50',
    amber: 'text-amber-600 bg-amber-50',
    slate: 'text-slate-600 bg-slate-50',
  };
  const iconColor = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon size={18} />
          </div>
          <div className="text-right">
            <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
            <p className="text-xs text-gray-400">{count} רשומות</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      {expanded && <div className="border-t border-gray-50">{children}</div>}
    </div>
  );
}
