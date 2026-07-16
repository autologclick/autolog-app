'use client';

/**
 * Read-only incident report viewer — /user/sos/[id]
 * Always renders the base event so EVERY past event shows real data; adds the
 * full documentation (parties/witnesses/police/photos) when it exists, plus a
 * "send to insurance agent" PDF action (browser print, Hebrew RTL, no deps).
 */

import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Users, FileText, Camera, X, Share2, Printer } from 'lucide-react';

const INCIDENT_LABEL: Record<string, string> = {
  road_accident: 'תאונת דרכים',
  hit_and_run: 'פגע וברח / רכב חונה',
  theft_vandalism: 'גניבה / פריצה / ונדליזם',
  injury: 'פגיעת גוף / נפגעים',
};
const EVENT_LABEL: Record<string, string> = {
  accident: 'תאונה',
  breakdown: 'תקלה',
  medical: 'אירוע רפואי',
  theft: 'גניבה',
  security: 'אירוע ביטחוני',
  other: 'אחר',
};
const STATUS_LABEL: Record<string, string> = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  resolved: 'טופל',
  closed: 'סגור',
};

interface Party {
  fullName?: string; idNumber?: string; phone?: string; licensePlate?: string;
  driverLicenseNumber?: string; vehicleManufacturer?: string; vehicleModel?: string;
  vehicleColor?: string; insuranceCompany?: string; insurancePolicyNumber?: string;
  isDriverOwner?: boolean; ownerName?: string;
}
interface Witness { fullName?: string; phone?: string; notes?: string; }

export default function SosIncidentView() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || '');

  const [loading, setLoading] = useState(true);
  const [ev, setEv] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/sos/${id}`);
        const data = await res.json();
        if (data.event) {
          setEv(data.event);
          try { setReport(data.event.incidentData ? JSON.parse(data.event.incidentData) : null); } catch { /* noop */ }
          try { const ph = data.event.photos ? JSON.parse(data.event.photos) : []; setPhotos(Array.isArray(ph) ? ph : []); } catch { /* noop */ }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center" dir="rtl"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
  }
  if (!ev) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex flex-col items-center justify-center gap-3" dir="rtl">
        <p className="text-gray-500">האירוע לא נמצא</p>
        <button onClick={() => router.push('/user/sos')} className="text-red-600 font-bold">חזרה</button>
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

  async function shareReport() {
    const title = `תיעוד אירוע — ${incidentName}`;
    try {
      const res = await fetch(`/api/sos/${id}/share-link`, { method: 'POST' });
      const data = await res.json();
      const url: string = data?.url || '';
      if (!url) throw new Error('no url');
      const text = `${title}\nצפייה בדוח המלא כולל תמונות:\n${url}`;
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success('הקישור לצפייה בדוח הועתק. אפשר להדביק בהודעה לסוכן.');
      }
    } catch {
      toast.error('לא הצלחנו ליצור קישור שיתוף. נסה שוב.');
    }
  }

  function sendToAgent() {
    const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as any)[c]));
    const line = (l: string, v: any) => (v ? `<tr><td class="l">${esc(l)}</td><td class="v">${esc(v)}</td></tr>` : '');
    let b = '';
    b += `<h1>תיעוד אירוע — ${esc(incidentName)}</h1>`;
    b += `<div class="meta">הופק ב-${esc(new Date().toLocaleString('he-IL'))} · AutoLog</div>`;
    b += '<table>';
    b += line('סוג אירוע', incidentName);
    b += line('רכב', vehicleName);
    b += line('מועד', occurredAt);
    b += line('מיקום', ev.location);
    b += line('סטטוס', STATUS_LABEL[ev.status] || ev.status);
    if (report?.hasInjuries) b += line('נפגעים', 'כן');
    b += line('פרטי נפגעים', report?.injuriesDetails);
    b += line('מספר תלונה במשטרה', report?.policeReportNumber);
    b += line('חברת הביטוח שלך', report?.ownInsuranceCompany);
    b += line('פוליסה שלך', report?.ownInsurancePolicyNumber);
    b += '</table>';
    if (description) b += `<h2>תיאור</h2><p>${esc(description)}</p>`;
    if (report?.stolenItems) b += `<h2>פריטים שנגנבו</h2><p>${esc(report.stolenItems)}</p>`;
    if (report?.nearbyCameras) b += `<h2>מצלמות בסביבה</h2><p>${esc(report.nearbyCameras)}</p>`;
    if (ev.notes) b += `<h2>הערות</h2><p>${esc(ev.notes)}</p>`;
    if (parties.length) {
      b += `<h2>מעורבים (${parties.length})</h2>`;
      parties.forEach((p, i) => {
        b += `<div class="card"><div class="ct">צד ${i + 1}</div><table>`;
        b += line('שם', p.fullName);
        b += line('ת.ז.', p.idNumber);
        b += line('טלפון', p.phone);
        b += line('מספר רכב', p.licensePlate);
        b += line('רישיון נהיגה', p.driverLicenseNumber);
        b += line('רכב', [p.vehicleManufacturer, p.vehicleModel, p.vehicleColor].filter(Boolean).join(' '));
        b += line('חברת ביטוח', p.insuranceCompany);
        b += line('פוליסה', p.insurancePolicyNumber);
        if (p.isDriverOwner === false) b += line('בעל הרכב', p.ownerName);
        b += '</table></div>';
      });
    }
    if (witnesses.length) {
      b += `<h2>עדים (${witnesses.length})</h2>`;
      witnesses.forEach((w) => {
        b += '<div class="card"><table>';
        b += line('שם', w.fullName);
        b += line('טלפון', w.phone);
        b += line('הערות', w.notes);
        b += '</table></div>';
      });
    }
    if (photos.length) {
      b += `<h2>תמונות (${photos.length})</h2><div class="imgs">`;
      photos.forEach((src) => { b += `<img src="${src}"/>`; });
      b += '</div>';
    }
    const html = `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>תיעוד אירוע - ${esc(incidentName)}</title>
<style>
*{box-sizing:border-box}body{font-family:Arial,'Segoe UI',sans-serif;color:#1B4E8A;margin:24px;direction:rtl}
h1{font-size:20px;margin:0 0 4px;color:#b91c1c}
h2{font-size:15px;margin:18px 0 6px;border-bottom:2px solid #fca5a5;padding-bottom:3px}
.meta{font-size:11px;color:#888;margin-bottom:14px}
table{width:100%;border-collapse:collapse;margin:0}
td{padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;vertical-align:top}
td.l{color:#888;width:42%}td.v{font-weight:bold}
p{font-size:12px;line-height:1.5;margin:4px 0}
.card{border:1px solid #eee;border-radius:8px;padding:6px 10px;margin:6px 0}
.ct{font-weight:bold;font-size:12px;color:#b91c1c;margin-bottom:2px}
.imgs{display:flex;flex-wrap:wrap;gap:8px}.imgs img{width:31%;border-radius:6px;border:1px solid #eee}
@media print{body{margin:10mm}}
</style></head><body>${b}</body></html>`;

    const run = (target: Window) => {
      const go = () => { try { target.focus(); target.print(); } catch (e) { /* noop */ } };
      setTimeout(go, photos.length ? 900 : 300);
    };
    const win = window.open('', '_blank');
    if (win) {
      win.document.open(); win.document.write(html); win.document.close();
      run(win);
    } else {
      const iframe = document.createElement('iframe');
      Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
      document.body.appendChild(iframe);
      const d = iframe.contentWindow!.document;
      d.open(); d.write(html); d.close();
      run(iframe.contentWindow!);
      setTimeout(() => { try { document.body.removeChild(iframe); } catch (e) { /* noop */ } }, 60000);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] pb-24" dir="rtl">
      <div className="bg-gradient-to-l from-red-600 to-red-700 text-white px-4 pt-6 pb-8 rounded-b-3xl">
        <button onClick={() => router.push('/user/sos')} className="flex items-center gap-1 text-white/80 text-sm mb-3"><ArrowRight size={18} />חזרה ל-SOS</button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center"><FileText size={22} /></div>
          <div>
            <h1 className="text-xl font-bold">תיעוד אירוע</h1>
            <p className="text-sm text-white/70">{incidentName} · {new Date(ev.createdAt).toLocaleDateString('he-IL')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
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

        {!report && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center text-amber-700 text-xs">
            לאירוע זה אין תיעוד מפורט (מעורבים / עדים / תמונות). אפשר להוסיף תיעוד דרך «תיעוד אירוע».
          </div>
        )}

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
                <img key={i} src={src} alt={'תמונה ' + (i + 1)} onClick={() => setLightbox(src)} className="w-full h-28 object-cover rounded-xl cursor-pointer border border-gray-100" />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4 flex gap-3" dir="rtl">
        <button onClick={shareReport} className="flex-1 bg-gradient-to-l from-red-600 to-red-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow">
          <Share2 size={18} />שתף
        </button>
        <button onClick={sendToAgent} className="flex-1 bg-white border-2 border-red-500 text-red-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2">
          <Printer size={18} />הדפס / PDF
        </button>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 left-4 text-white" onClick={() => setLightbox(null)}><X size={28} /></button>
          <img src={lightbox} alt="תמונה מלאה" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
// END_SOS_VIEW_OK
