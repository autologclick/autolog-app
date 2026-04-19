import { createLogger } from '@/lib/logger';

const logger = createLogger('email');

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface ResendResponse {
  id?: string;
  error?: string;
}

/**
 * Send an email using Resend API.
 * Fails silently (logs error) so that calling code isn't blocked.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn('RESEND_API_KEY not configured — skipping email');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'AutoLog <noreply@autolog.click>',
        to,
        subject,
        html,
      }),
    });

    const data: ResendResponse = await res.json();

    if (!res.ok) {
      logger.error('Resend API error', { status: res.status, error: data.error });
      return false;
    }

    logger.info('Email sent successfully', { to, emailId: data.id });
    return true;
  } catch (error) {
    logger.error('Failed to send email', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

// ============================================================================
// Shared responsive email wrapper
// ============================================================================

/**
 * Wraps email content in a mobile-responsive shell.
 * Uses max-width instead of fixed width, viewport meta, and media queries.
 */
function emailWrapper(headerBg: string, headerContent: string, bodyHtml: string, footerExtra = ''): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>AutoLog</title>
  <style>
    /* Force full width on mobile */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-body { padding: 20px 16px !important; }
      .email-header { padding: 20px 16px !important; }
      .email-header h1 { font-size: 18px !important; }
      .email-footer { padding: 14px 16px !important; }
      .btn { padding: 12px 24px !important; font-size: 15px !important; }
      .btn-row .btn { display: block !important; margin: 0 0 10px 0 !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
      .detail-table td { padding: 6px 8px !important; font-size: 14px !important; }
      .detail-label { width: 90px !important; }
    }
  </style>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f4f4f7;margin:0;padding:0;direction:rtl;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 8px">
    <tr><td align="center">
      <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);width:100%;max-width:520px">
        <!-- Header -->
        <tr>
          <td class="email-header" style="background:${headerBg};padding:22px 28px;text-align:center">
            ${headerContent}
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td class="email-body" style="padding:24px 28px">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td class="email-footer" style="padding:14px 28px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0">
            ${footerExtra ? footerExtra + '<br>' : ''}AutoLog — ניהול רכבים חכם
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

/** Primary CTA button */
function btnHtml(href: string, label: string, bg: string): string {
  return `<a class="btn" href="${href}" style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700">${label}</a>`;
}

/** Detail table row */
function detailRow(label: string, value: string, isLast = false): string {
  const border = isLast ? '' : 'border-bottom:1px solid #e2e8f0;';
  return `<tr><td class="detail-label" style="${border}font-weight:600;width:110px;padding:8px 10px;font-size:15px;color:#334155">${label}</td><td style="${border}padding:8px 10px;font-size:15px;color:#334155">${value}</td></tr>`;
}

/** Detail table wrapper */
function detailTable(rows: string): string {
  return `<table class="detail-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin-bottom:20px">${rows}</table>`;
}

/** Paragraph */
function p(text: string, extra = ''): string {
  return `<p style="font-size:16px;color:#1e293b;margin:0 0 18px;line-height:1.6;${extra}">${text}</p>`;
}

/** Small/muted paragraph */
function pSmall(text: string, extra = ''): string {
  return `<p style="font-size:14px;color:#64748b;margin:0 0 10px;line-height:1.5;${extra}">${text}</p>`;
}

// ============================================================================
// Email builders
// ============================================================================

/**
 * Password Reset Email
 */
export function buildPasswordResetEmailHtml({
  fullName,
  resetUrl,
}: {
  fullName: string;
  resetUrl: string;
}): string {
  const header = '<h1 style="color:#ffffff;margin:0;font-size:20px">🔑 איפוס סיסמה</h1>';

  const body = [
    p(`שלום ${fullName},`),
    p('קיבלנו בקשה לאיפוס הסיסמה שלך ב-AutoLog. לחץ על הכפתור למטה כדי לבחור סיסמה חדשה:'),
    `<div style="text-align:center;margin:24px 0">${btnHtml(resetUrl, 'איפוס סיסמה', '#10b981')}</div>`,
    pSmall('הקישור תקף לשעה אחת בלבד.'),
    pSmall('אם לא ביקשת איפוס סיסמה, ניתן להתעלם מהודעה זו.'),
  ].join('');

  return emailWrapper('linear-gradient(135deg,#1e3a5f,#2d5a8e)', header, body);
}

/**
 * Garage Welcome Email (with credentials)
 */
export function buildGarageWelcomeEmailHtml({
  ownerName,
  garageName,
  email,
  tempPassword,
  loginUrl,
}: {
  ownerName: string;
  garageName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): string {
  const header = '<h1 style="color:#ffffff;margin:0;font-size:20px">🎉 ברוכים הבאים ל-AutoLog!</h1>';

  const credTable = `<table class="detail-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;margin-bottom:20px;border:1px solid #bbf7d0">
    <tr><td style="border-bottom:1px solid #bbf7d0;font-weight:600;width:110px;padding:10px 12px;font-size:15px;color:#334155">אימייל</td><td style="border-bottom:1px solid #bbf7d0;padding:10px 12px;font-size:15px;color:#334155;font-family:monospace;word-break:break-all">${email}</td></tr>
    <tr><td style="font-weight:600;width:110px;padding:10px 12px;font-size:15px;color:#334155">סיסמה זמנית</td><td style="padding:10px 12px;font-size:15px;font-family:monospace;font-weight:700;color:#059669">${tempPassword}</td></tr>
  </table>`;

  const body = [
    p(`שלום ${ownerName},`),
    p(`בקשת ההצטרפות של <strong>${garageName}</strong> אושרה! להלן פרטי ההתחברות שלך:`),
    credTable,
    `<div style="background:#fef2f2;padding:12px;border-radius:8px;margin:0 0 20px">`,
    `<p style="font-size:14px;color:#dc2626;margin:0">⚠️ מומלץ לשנות את הסיסמה מיד לאחר ההתחברות הראשונה.</p></div>`,
    `<div style="text-align:center;margin:20px 0">${btnHtml(loginUrl, 'כניסה למערכת', '#059669')}</div>`,
  ].join('');

  return emailWrapper('linear-gradient(135deg,#059669,#10b981)', header, body);
}

/**
 * New Appointment — Garage Owner Email
 */
export function buildAppointmentEmailHtml({
  garageName,
  customerName,
  customerPhone,
  customerEmail,
  vehicleLabel,
  serviceLabel,
  dateLabel,
  timeLabel,
  notes,
  appointmentId,
}: {
  garageName: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  vehicleLabel: string;
  serviceLabel: string;
  dateLabel: string;
  timeLabel: string;
  notes?: string | null;
  appointmentId?: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';
  const header = '<h1 style="color:#ffffff;margin:0;font-size:20px">🔧 תור חדש התקבל!</h1>';

  const rows = [
    detailRow('לקוח', customerName),
    customerPhone ? detailRow('טלפון', `<a href="tel:${customerPhone}" style="color:#2563eb;text-decoration:none">${customerPhone}</a>`) : '',
    customerEmail ? detailRow('אימייל', `<a href="mailto:${customerEmail}" style="color:#2563eb;text-decoration:none;word-break:break-all">${customerEmail}</a>`) : '',
    detailRow('רכב', vehicleLabel),
    detailRow('סוג שירות', serviceLabel),
    detailRow('תאריך', dateLabel),
    detailRow('שעה', timeLabel, !notes),
    notes ? detailRow('הערות', notes, true) : '',
  ].filter(Boolean).join('');

  const body = [
    p('שלום,'),
    p(`תור חדש נקבע ב<strong>${garageName}</strong>:`),
    detailTable(rows),
    `<div style="background:#fef2f2;padding:12px;border-radius:8px;margin:0 0 20px">`,
    `<p style="font-size:14px;color:#dc2626;margin:0">⏱️ יש לך 15 דקות לאשר או לדחות את התור לפני שהוא נדחה אוטומטית.</p></div>`,
    `<div class="btn-row" style="text-align:center;margin:24px 0">`,
    `${btnHtml(`${baseUrl}/garage/appointments`, '✅ אשר תור', '#059669')}&nbsp;&nbsp;`,
    `${btnHtml(`${baseUrl}/garage/appointments`, '❌ דחה תור', '#dc2626')}`,
    `</div>`,
    pSmall('לחיצה תפתח את מערכת ניהול התורים', 'text-align:center;'),
  ].join('');

  return emailWrapper('linear-gradient(135deg,#2563eb,#1d4ed8)', header, body);
}

/**
 * New Appointment — Admin Email
 */
export function buildAdminAppointmentEmailHtml({
  garageName,
  customerName,
  customerPhone,
  customerEmail,
  vehicleLabel,
  serviceLabel,
  dateLabel,
  timeLabel,
  notes,
}: {
  garageName: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  vehicleLabel: string;
  serviceLabel: string;
  dateLabel: string;
  timeLabel: string;
  notes?: string | null;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';
  const header = '<h1 style="color:#ffffff;margin:0;font-size:20px">📋 תור חדש במערכת</h1>';

  const rows = [
    detailRow('מוסך', garageName),
    detailRow('לקוח', customerName),
    customerPhone ? detailRow('טלפון', customerPhone) : '',
    customerEmail ? detailRow('אימייל', `<span style="word-break:break-all">${customerEmail}</span>`) : '',
    detailRow('רכב', vehicleLabel),
    detailRow('סוג שירות', serviceLabel),
    detailRow('תאריך', dateLabel),
    detailRow('שעה', timeLabel, !notes),
    notes ? detailRow('הערות', notes, true) : '',
  ].filter(Boolean).join('');

  const body = [
    p('שלום מנהל,'),
    p('תור חדש נקבע במערכת:'),
    detailTable(rows),
    `<div style="text-align:center;margin:20px 0">${btnHtml(`${baseUrl}/admin/appointments`, 'צפה בפאנל ניהול', '#7c3aed')}</div>`,
  ].join('');

  return emailWrapper('linear-gradient(135deg,#7c3aed,#6d28d9)', header, body);
}

/**
 * Customer Status Update Email (confirmed, rejected, in_progress, completed, cancelled)
 */
export function buildCustomerStatusEmailHtml({
  customerName,
  garageName,
  vehicleLabel,
  serviceLabel,
  dateLabel,
  timeLabel,
  status,
  completionNotes,
  rejectionReason,
  garagePhone,
  garageAddress,
  garageCity,
}: {
  customerName: string;
  garageName: string;
  vehicleLabel: string;
  serviceLabel: string;
  dateLabel: string;
  timeLabel: string;
  status: 'confirmed' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  completionNotes?: string | null;
  rejectionReason?: string | null;
  garagePhone?: string | null;
  garageAddress?: string | null;
  garageCity?: string | null;
}): string {
  const statusConfig: Record<string, { emoji: string; title: string; color: string; message: string }> = {
    confirmed: {
      emoji: '✅',
      title: 'התור שלך אושר!',
      color: '#059669',
      message: `התור שלך ב<strong>${garageName}</strong> אושר. נתראה!`,
    },
    rejected: {
      emoji: '❌',
      title: 'ההזמנה נדחתה',
      color: '#dc2626',
      message: `לצערנו, ההזמנה שלך ב<strong>${garageName}</strong> נדחתה.${rejectionReason ? ` סיבה: ${rejectionReason}` : ''}`,
    },
    in_progress: {
      emoji: '🔧',
      title: 'הרכב נכנס לטיפול!',
      color: '#2563eb',
      message: `הרכב שלך נכנס לטיפול ב<strong>${garageName}</strong>.`,
    },
    completed: {
      emoji: '🎉',
      title: 'הטיפול הושלם בהצלחה!',
      color: '#059669',
      message: `הטיפול ברכב שלך הושלם ב<strong>${garageName}</strong>.${completionNotes ? ` סיכום: ${completionNotes}` : ''}`,
    },
    cancelled: {
      emoji: '🚫',
      title: 'התור בוטל',
      color: '#dc2626',
      message: `התור שלך ב<strong>${garageName}</strong> בוטל. אנא צור קשר עם המוסך לפרטים.`,
    },
  };

  const cfg = statusConfig[status] || statusConfig.confirmed;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';
  const header = `<h1 style="color:#ffffff;margin:0;font-size:20px">${cfg.emoji} ${cfg.title}</h1>`;

  const rows = [
    detailRow('מוסך', garageName),
    detailRow('רכב', vehicleLabel),
    detailRow('סוג שירות', serviceLabel),
    detailRow('תאריך', dateLabel),
    detailRow('שעה', timeLabel, true),
  ].join('');

  // Garage contact section for confirmed
  let garageContactHtml = '';
  if (status === 'confirmed' && (garagePhone || garageAddress)) {
    const contactRows: string[] = [];
    const addr = garageAddress && garageCity ? `${garageAddress}, ${garageCity}` : garageAddress || '';
    if (addr) contactRows.push(detailRow('כתובת', addr, !garagePhone));
    if (garagePhone) contactRows.push(detailRow('טלפון', `<a href="tel:${garagePhone}" style="color:#059669;text-decoration:none;font-weight:600">${garagePhone}</a>`, true));

    garageContactHtml = [
      `<p style="font-size:15px;color:#1e293b;font-weight:600;margin:16px 0 8px">📍 פרטי התקשרות עם המוסך:</p>`,
      `<table class="detail-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;margin-bottom:20px;border:1px solid #bbf7d0">${contactRows.join('')}</table>`,
    ].join('');
  }

  // Rejection recommendation
  let rejectionHtml = '';
  if (status === 'rejected') {
    rejectionHtml = [
      `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px;margin:16px 0">`,
      `<p style="font-size:15px;color:#92400e;margin:0 0 6px;font-weight:600">💡 מה עכשיו?</p>`,
      `<p style="font-size:14px;color:#92400e;margin:0">מומלץ לנסות לקבוע תור במוסך אחר. במערכת AutoLog ישנם מוסכים נוספים שישמחו לעזור לך.</p>`,
      `</div>`,
      `<div style="text-align:center;margin:16px 0">${btnHtml(`${baseUrl}/user/garages`, '🔍 חפש מוסך אחר', '#f59e0b')}</div>`,
    ].join('');
  }

  const body = [
    p(`שלום ${customerName},`),
    p(cfg.message),
    detailTable(rows),
    garageContactHtml,
    rejectionHtml,
    `<div style="text-align:center;margin:20px 0">${btnHtml(`${baseUrl}/user/appointments`, 'צפה בתורים שלי', cfg.color)}</div>`,
  ].join('');

  return emailWrapper(cfg.color, header, body);
}

/**
 * Vehicle Share Request Email
 */
export function buildVehicleShareRequestEmailHtml(
  ownerName: string,
  requesterName: string,
  requesterEmail: string,
  vehicleLabel: string,
  manageUrl: string,
): string {
  const header = '<h1 style="color:#ffffff;margin:0;font-size:20px">🚗 בקשת שיתוף רכב</h1>';

  const body = [
    p(`שלום ${ownerName},`),
    p(`<strong>${requesterName}</strong> (<span style="word-break:break-all">${requesterEmail}</span>) מבקש/ת גישה לניהול הרכב שלך:`),
    `<div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:14px;margin:0 0 20px;text-align:center">`,
    `<p style="margin:0;font-size:18px;font-weight:700;color:#0d9488">${vehicleLabel}</p></div>`,
    p('אישור הבקשה יאפשר למשתמש לצפות בפרטי הרכב, להוסיף טיפולים, הוצאות ומסמכים. אתה תישאר הבעלים הראשי של הרכב.', 'font-size:15px;color:#475569;'),
    `<div style="text-align:center;margin:24px 0">${btnHtml(manageUrl, 'נהל בקשות שיתוף', '#0d9488')}</div>`,
    pSmall('ניתן לאשר או לדחות את הבקשה בכל עת מדף הרכבים שלך.'),
  ].join('');

  return emailWrapper('linear-gradient(135deg,#0d9488,#0f766e)', header, body);
}
