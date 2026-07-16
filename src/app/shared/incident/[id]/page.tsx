'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Users, FileText, Camera, X, AlertTriangle } from 'lucide-react';

const INCIDENT_LABEL: Record<string, string> = {
  road_accident: 'תאונת דרכים',
  hit_and_run: 'פגע וברח / רכב חונה',
  theft_vandalism: 'גניבה / פריצה / ונדליזם',
  injury: 'פגיעת גוף / נפגעים',
};
const EVENT_LABEL: Record<string, string> = {
  accident: 'תאונה', breakdown: 'תקלה', medical: 'אירוע רפואי',
  theft: 'גניבה', security: 'אירוע ביטחוני', other: 'אחר',
};
const STATUS_LABEL: Record<string, string> = {
  open: 'פתוח', in_progress: 'בטיפול', resolved: 'טופל', closed: 'סגור',
};

interface Party {
  fullName?: string; idNumber?: string; phone?: string; licensePlate?: string;
  driverLicenseNumber?: string; vehicleManufacturer?: string; vehicleModel?: string;
  vehicleColor?: string; insuranceCompany?: string; insurancePolicyNumber?: string;
  isDriverOwner?: boolean; ownerName?: string;
}
interface Witness { fullName?: string; phone?: string; notes?: string; }

export default function SharedIncidentPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [loading, setLoading] = useState(true);
  const [ev, setEv] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const qs = typeof window !== 'undefined' ? window.location.search : '';
        const res = await fetch(`/api/public/sos/${id}${qs}`);
        const data = await res.json();
        if (res.ok && data.event) {
          setEv(data.event);
          try { setReport(data.event.incidentData ? JSON.parse(data.event.incidentData) : null); } catch { /* noop */ }
          try { const ph = data.event.photos ? JSON.parse(data.event.photos) : []; setPhotos(Array.isArray(ph) ? ph : []); } catch { /* noop */ }
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center" dir="rtl"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
  }
  if (error || !ev) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex flex-col items-center justify-center gap-3 px-6 text-center" dir="rtl">
        <AlertTriangle className="text-red-400" size={40} />
        <p className="text-gray-600">הקישור אינו תקין או שפג תוקפו.</p>
        <a href="https://autolog.click" className="text-sm text-red-600 font-bold">AutoLog</a>
      </div>
    );
  }

  const parties: Party[] = report?.involvedParties || [];
  const witnesses: Witness[] = report?.witnesses || [];
  const incidentName = report
    ? (INCIDENT_LABEL[report.incidentType] || report.incidentType)
    : (EVENT_LABEL[ev.eventType] || ev.eventType || 'אירוע');
  const vehicleName = ev.vehicle
    ? [ev.vehicle.manufacturer, ev.vehicle.model].filter(Boolean).join(' ') + (ev.vehicle.licensePlate ? ` · ${ev.vehicle.licensePlate}` : '')
    : '';
  const occurredAt = report?.occurredAt ? report.occurredAt.replace('T', ' ') : new Date(ev.createdAt).toLocaleString('he-IL');
  const description = report?.description || ev.description;

  const Row = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div className="flex justify-between gap-3 text-sm py-1 border-b border-gray-50 last:border-0">
        <span className="text-gray-400 flex-shrink-0">{label}</span>
        <span className="font-semibold text-[#1B4E8A] text-left">{value}</span>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-[#F3F6FA] pb-10" dir="rtl">
      <div className="bg-gradient-to-l from-red-600 to-red-700 text-white px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center"><FileText size={22} /></div>
            <div>
              <h1 className="text-xl font-bold">תיעוד אירוע</h1>
              <p className="text-sm text-white/70">{incidentName} · {new Date(ev.createdAt).toLocaleDateString('he-IL')}</p>
            </div>
          </div>
          <p className="text-[11px] text-white/60 mt-3">דוח שהופק ב-AutoLog</p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-1">
          <h3 className="font-bold text-[#1B4E8A] mb-2 flex items-center gap-2"><FileText size={16} className="text-red-500" />פרטי האירוע</h3>
          <Row label="סוג" value={incidentName} />
          {vehicleName && <Row label="רכב" value={vehicleName} />}
          <Row label="מועד" value={occurredAt} />
          <Row label="מיקום" value={ev.location} />
          <Row label="סטטוס" value={STATUS_LABEL[ev.status] || ev.status} />
          {report?.hasInjuries && <Row label="נפגעים" value="כן" />}
          <Row label="פרטי נפגעים" value={report?.injuriesDetails} />
          <Row label="מספר תלונה" value={report?.policeReportNumber} />
          <Row label="חברת הביטוח שלך" value={report?.ownInsuranceCompany} />
          <Row label="פוליסה שלך" value={report?.ownInsurancePolicyNumber} />
          {description && <div className="pt-2 text-sm text-[#1B4E8A]"><span className="text-gray-400">תיאור: </span>{description}</div>}
          {report?.stolenItems && <div className="pt-1 text-sm text-[#1B4E8A]"><span className="text-gray-400">פריטים שנגנבו: </span>{report.stolenItems}</div>}
          {report?.nearbyCameras && <div className="pt-1 text-sm text-[#1B4E8A]"><span className="text-gray-400">מצלמות בסביבה: </span>{report.nearbyCameras}</div>}
          {ev.notes && <div className="pt-1 text-sm text-[#1B4E8A]"><span className="text-gray-400">הערות: </span>{ev.notes}</div>}
        </div>

        {parties.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-[#1B4E8A] px-1 flex items-center gap-2"><Users size={16} className="text-red-500" />מעורבים ({parties.length})</h3>
            {parties.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <Row label="שם" value={p.fullName} />
                <Row label="ת.ז." value={p.idNumber} />
                <Row label="טלפון" value={p.phone} />
                <Row label="מספר רכב" value={p.licensePlate} />
                <Row label="רישיון נהיגה" value={p.driverLicenseNumber} />
                <Row label="רכב" value={[p.vehicleManufacturer, p.vehicleModel, p.vehicleColor].filter(Boolean).join(' ')} />
                <Row label="חברת ביטוח" value={p.insuranceCompany} />
                <Row label="פוליסה" value={p.insurancePolicyNumber} />
                {p.isDriverOwner === false && <Row label="בעל הרכב" value={p.ownerName} />}
              </div>
            ))}
          </div>
        )}

        {witnesses.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-[#1B4E8A] px-1 flex items-center gap-2"><Users size={16} className="text-teal-500" />עדים ({witnesses.length})</h3>
            {witnesses.map((w, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <Row label="שם" value={w.fullName} />
                <Row label="טלפון" value={w.phone} />
                <Row label="הערות" value={w.notes} />
              </div>
            ))}
          </div>
        )}

        {photos.length > 0 && (
          <div>
            <h3 className="font-bold text-[#1B4E8A] px-1 mb-2 flex items-center gap-2"><Camera size={16} className="text-red-500" />תמונות ({photos.length})</h3>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={'תמונה ' + (i + 1)} onClick={() => setLightbox(src)} className="w-full h-28 object-cover rounded-xl cursor-pointer border border-gray-100" />
              ))}
            </div>
          </div>
        )}

        <div className="text-center py-6">
          <a href="https://autolog.click" className="text-xs text-gray-400">מופק באמצעות AutoLog · autolog.click</a>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 left-4 text-white" onClick={() => setLightbox(null)}><X size={28} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="תמונה מלאה" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
