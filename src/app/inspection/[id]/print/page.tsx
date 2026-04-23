'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Inspection {
  id: string;
  date: string;
  inspectionType: string;
  status: string;
  overallScore: number | null;
  mechanicName: string | null;
  mileage: number | null;
  summary: string | null;
  customerName: string | null;
  tiresData: Record<string, string> | null;
  lightsData: Record<string, string> | null;
  fluidsData: Record<string, string> | null;
  bodyData: { condition?: string; tags?: string[]; notes?: string } | null;
  brakingSystem: { frontDiscs?: number; rearDiscs?: number; frontPads?: number; rearPads?: number } | null;
  engineIssues: { issues?: string[]; notes?: string } | null;
  recommendations: Array<{ text: string; urgency?: string; estimatedCost?: string }> | null;
  notes: { undercarriage?: string; engine?: string; general?: string } | null;
  vehicle: {
    nickname: string | null; manufacturer: string | null;
    model: string; year: number | null; licensePlate: string;
    color: string | null; vin: string | null; mileage: number | null;
  };
  garage: {
    name: string; city: string | null;
    address: string | null; phone: string | null;
  };
  items: Array<{
    id: string; category: string; itemName: string;
    status: string; notes: string | null; score: number | null;
  }>;
  workPerformed: Array<{ item: string; action: string; notes?: string; cost?: number }> | null;
  cost: number | null;
}

const typeLabels: Record<string, string> = {
  full: 'אבחון מלא', rot: 'בדיקת רקב', engine: 'בדיקת מנוע',
  tires: 'בדיקת צמיגים', brakes: 'בדיקת בלמים', pre_test: 'הכנה לטסט',
};

const statusLabels: Record<string, string> = {
  ok: 'תקין', not_ok: 'לא תקין', worn: 'שחוק', warning: 'דורש תשומת לב',
  new: 'חדש', low: 'חסר', dirty: 'מלוכלך', leaking: 'נוזל', dry: 'יבש',
  replace: 'להחלפה', failed: 'פסול', critical: 'קריטי', sweating: 'הזעה',
};

const statusColor = (s: string) => {
  if (['ok', 'new'].includes(s)) return '#059669';
  if (['worn', 'warning', 'low', 'sweating'].includes(s)) return '#d97706';
  if (['not_ok', 'replace', 'failed', 'critical'].includes(s)) return '#dc2626';
  if (['dirty', 'leaking', 'dry'].includes(s)) return '#ea580c';
  return '#6b7280';
};

const categoryLabels: Record<string, string> = {
  exterior: 'חיצוני', interior: 'פנימי', engine: 'מנוע', tires: 'צמיגים',
  brakes: 'בלמים', suspension: 'מתלים', electrical: 'חשמל', lights: 'תאורה',
  fluids: 'נוזלים', body: 'מרכב', undercarriage: 'תחתית', pre_test: 'הכנה לטסט',
  work_performed: 'עבודות שבוצעו', general: 'כללי',
};

export default function PrintInspectionPage() {
  const { id } = useParams();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/inspections/${id}`)
      .then(r => { if (!r.ok) throw new Error('שגיאה'); return r.json(); })
      .then(data => {
        setInspection(data.inspection || data);
        // Auto-print after render
        setTimeout(() => window.print(), 500);
      })
      .catch(() => setError('שגיאה בטעינת הבדיקה'));
  }, [id]);

  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>;
  if (!inspection) return <div style={{ padding: 40, textAlign: 'center' }}>טוען...</div>;

  const i = inspection;
  const v = i.vehicle;
  const g = i.garage;
  const score = i.overallScore || 0;
  const scoreColor = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626';
  const date = new Date(i.date).toLocaleDateString('he-IL');

  // Group items by category
  const items = i.items || [];
  const grouped: Record<string, typeof items> = {};
  items.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  return (
    <>

      {/* Print button (hidden when printing) */}
      <div className="no-print" style={{ padding: '12px 20px', background: '#f0fdf4', borderBottom: '1px solid #d1fae5', display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button onClick={() => window.print()} style={{
          background: '#0d9488', color: 'white', border: 'none', borderRadius: 8,
          padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer'
        }}>
          שמור כ-PDF / הדפס
        </button>
        <button onClick={() => window.close()} style={{
          background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8,
          padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer'
        }}>
          ✕ סגור
        </button>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '20px 24px' }}>

        {/* ===== HEADER ===== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '3px solid #0d9488' }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1e3a5f' }}>
              Auto<span style={{ color: '#0d9488' }}>Log</span>
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>דוח אבחון רכב מקצועי</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>מס׳ דוח</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f', fontFamily: 'monospace' }}>{i.id.slice(-8).toUpperCase()}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{date}</div>
          </div>
        </div>

        {/* ===== SCORE + TYPE ===== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>סוג בדיקה</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f' }}>{typeLabels[i.inspectionType] || i.inspectionType}</div>
            {i.mechanicName && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>מכניק: {i.mechanicName}</div>}
          </div>
          {score > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>ציון כללי</div>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white',
                background: scoreColor, boxShadow: `0 2px 8px ${scoreColor}40`
              }}>
                {score}
              </div>
            </div>
          )}
        </div>

        {/* ===== VEHICLE + GARAGE INFO ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 16, border: '1px solid #d1fae5' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46', marginBottom: 10, borderBottom: '1px solid #a7f3d0', paddingBottom: 6 }}>פרטי רכב</div>
            <table style={{ width: '100%', fontSize: 12 }}>
              <tbody>
                <InfoRow label="רכב" value={`${v.manufacturer || ''} ${v.model} ${v.year || ''}`} />
                <InfoRow label="לוחית" value={v.licensePlate} />
                {v.color && <InfoRow label="צבע" value={v.color} />}
                {v.vin && <InfoRow label="שלדה" value={v.vin} />}
                {(i.mileage || v.mileage) && <InfoRow label="ק״מ" value={`${(i.mileage || v.mileage || 0).toLocaleString()}`} />}
              </tbody>
            </table>
          </div>
          <div style={{ background: '#f0f9ff', borderRadius: 10, padding: 16, border: '1px solid #bae6fd' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0c4a6e', marginBottom: 10, borderBottom: '1px solid #7dd3fc', paddingBottom: 6 }}>פרטי מוסך</div>
            <table style={{ width: '100%', fontSize: 12 }}>
              <tbody>
                <InfoRow label="מוסך" value={g.name} />
                {g.city && <InfoRow label="עיר" value={g.city} />}
                {g.address && <InfoRow label="כתובת" value={g.address} />}
                {g.phone && <InfoRow label="טלפון" value={g.phone} />}
                {i.customerName && <InfoRow label="לקוח" value={i.customerName} />}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== INSPECTION ITEMS BY CATEGORY ===== */}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f', marginBottom: 6, paddingBottom: 4, borderBottom: '2px solid #e2e8f0' }}>
              {categoryLabels[cat] || cat}
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>פריט</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, width: 90 }}>סטטוס</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>הערות</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '5px 8px', color: '#334155' }}>{item.itemName}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 600, color: statusColor(item.status),
                        background: statusColor(item.status) + '15', border: `1px solid ${statusColor(item.status)}30`
                      }}>
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>
                    <td style={{ padding: '5px 8px', color: '#64748b', fontSize: 11 }}>{item.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* ===== BRAKING SYSTEM ===== */}
        {i.brakingSystem && (i.brakingSystem.frontDiscs || i.brakingSystem.rearDiscs) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f', marginBottom: 6, paddingBottom: 4, borderBottom: '2px solid #e2e8f0' }}>מערכת בלימה</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, fontSize: 12 }}>
              {i.brakingSystem.frontDiscs != null && <MeasureBox label="דיסקים קדמיים" value={`${i.brakingSystem.frontDiscs} מ״מ`} />}
              {i.brakingSystem.rearDiscs != null && <MeasureBox label="דיסקים אחוריים" value={`${i.brakingSystem.rearDiscs} מ״מ`} />}
              {i.brakingSystem.frontPads != null && <MeasureBox label="רפידות קדמיות" value={`${i.brakingSystem.frontPads} מ״מ`} />}
              {i.brakingSystem.rearPads != null && <MeasureBox label="רפידות אחוריות" value={`${i.brakingSystem.rearPads} מ״מ`} />}
            </div>
          </div>
        )}

        {/* ===== RECOMMENDATIONS ===== */}
        {i.recommendations && i.recommendations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f', marginBottom: 6, paddingBottom: 4, borderBottom: '2px solid #e2e8f0' }}>המלצות</div>
            {i.recommendations.map((rec, idx) => (
              <div key={idx} style={{ padding: '8px 12px', marginBottom: 6, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', fontSize: 12 }}>
                <div style={{ fontWeight: 600, color: '#92400e' }}>{rec.text}</div>
                {rec.urgency && <span style={{ fontSize: 11, color: '#b45309' }}>דחיפות: {rec.urgency} </span>}
                {rec.estimatedCost && <span style={{ fontSize: 11, color: '#b45309' }}>• עלות משוערת: ₪{rec.estimatedCost}</span>}
              </div>
            ))}
          </div>
        )}

        {/* ===== NOTES ===== */}
        {i.notes && (i.notes.general || i.notes.engine || i.notes.undercarriage) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f', marginBottom: 6, paddingBottom: 4, borderBottom: '2px solid #e2e8f0' }}>הערות</div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.7, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
              {i.notes.general && <div><strong>כללי:</strong> {i.notes.general}</div>}
              {i.notes.engine && <div><strong>מנוע:</strong> {i.notes.engine}</div>}
              {i.notes.undercarriage && <div><strong>תחתית:</strong> {i.notes.undercarriage}</div>}
            </div>
          </div>
        )}

        {/* ===== SUMMARY ===== */}
        {i.summary && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f', marginBottom: 6, paddingBottom: 4, borderBottom: '2px solid #e2e8f0' }}>סיכום</div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.7, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
              {i.summary}
            </div>
          </div>
        )}

        {/* ===== WORK PERFORMED ===== */}
        {i.workPerformed && i.workPerformed.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f', marginBottom: 6, paddingBottom: 4, borderBottom: '2px solid #e2e8f0' }}>עבודות שבוצעו</div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>פריט</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>פעולה</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>הערות</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e2e8f0', width: 80 }}>עלות</th>
                </tr>
              </thead>
              <tbody>
                {i.workPerformed.map((w, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '5px 8px' }}>{w.item}</td>
                    <td style={{ padding: '5px 8px' }}>{w.action}</td>
                    <td style={{ padding: '5px 8px', color: '#64748b' }}>{w.notes || '—'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 600 }}>{w.cost ? `₪${w.cost}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {i.cost && (
              <div style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, fontSize: 14, color: '#1e3a5f' }}>
                סה״כ: ₪{i.cost.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* ===== SIGNATURE AREA ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 30, paddingTop: 20, borderTop: '2px solid #e2e8f0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #94a3b8', height: 40, marginBottom: 6 }}></div>
            <div style={{ fontSize: 12, color: '#64748b' }}>חתימת מכניק</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #94a3b8', height: 40, marginBottom: 6 }}></div>
            <div style={{ fontSize: 12, color: '#64748b' }}>חתימת לקוח</div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>
          <div>דוח זה הופק אוטומטית על ידי מערכת AutoLog • {new Date().toLocaleDateString('he-IL')} • www.autolog.click</div>
          <div style={{ marginTop: 2 }}>AutoLog בע״מ • משה בקר 29, ראשון לציון • info@autolog.click</div>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: '3px 0', color: '#64748b', width: 60 }}>{label}:</td>
      <td style={{ padding: '3px 0', color: '#1e3a5f', fontWeight: 600 }}>{value}</td>
    </tr>
  );
}

function MeasureBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '8px 4px', border: '1px solid #e2e8f0' }}>
      <div style={{ color: '#64748b', marginBottom: 2, fontSize: 11 }}>{label}</div>
      <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: 14 }}>{value}</div>
    </div>
  );
}
