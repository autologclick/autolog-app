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
            <img src="https://autolog.click/logo.png" width="48" height="48" alt="אוטולוג" style="display:block;margin:0 auto 10px;border:0;border-radius:10px" />
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
            ${footerExtra ? footerExtra + '<br>' : ''}אוטולוג — ניהול רכב חכם, במקום אחד · <a href="https://autolog.click" style="color:#2E77D0;text-decoration:none">autolog.click</a>
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
    p('קיבלנו בקשה לאיפוס הסיסמה ב-AutoLog. לחצו על הכפתור למטה כדי לבחור סיסמה חדשה:'),
    `<div style="text-align:center;margin:24px 0">${btnHtml(resetUrl, 'איפוס סיסמה', '#2E77D0')}</div>`,
    pSmall('הקישור תקף לשעה אחת בלבד.'),
    pSmall('אם לא ביקשת איפוס סיסמה, ניתן להתעלם מהודעה זו.'),
  ].join('');

  return emailWrapper('linear-gradient(135deg,#1B4E8A,#1D5FAF)', header, body);
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

  return emailWrapper('linear-gradient(135deg,#059669,#2E77D0)', header, body);
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
      addr ? `<div style="text-align:center;margin:0 0 20px">${btnHtml(`https://waze.com/ul?q=${encodeURIComponent(addr)}&navigate=yes`, '🧭 ניווט למוסך', '#059669')}</div>` : '',
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
 * Treatment Email — sent to customer when garage submits a treatment for approval,
 * and sent to the garage when the customer approves or rejects it.
 */
export function buildTreatmentEmailHtml({
  recipientName,
  garageName,
  vehicleLabel,
  treatmentTitle,
  treatmentType,
  cost,
  mileage,
  date,
  status,
  rejectionReason,
  description,
}: {
  recipientName: string;
  garageName: string;
  vehicleLabel: string;
  treatmentTitle: string;
  treatmentType: string;
  cost?: number | null;
  mileage?: number | null;
  date: string;
  status: 'sent' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  description?: string | null;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';

  const cfg: Record<string, { emoji: string; title: string; color: string; message: string; cta: string; ctaUrl: string }> = {
    sent: {
      emoji: '🔧',
      title: 'טיפול חדש ממתין לאישורך',
      color: '#2E77D0',
      message: `<strong>${garageName}</strong> שלח/ה לך פירוט טיפול לרכב <strong>${vehicleLabel}</strong>. אנא בדוק/בדקי את הפרטים ואשר/י או דחה/דחי.`,
      cta: 'צפה/י באישור הטיפול',
      ctaUrl: `${baseUrl}/user/treatments`,
    },
    approved: {
      emoji: '✅',
      title: 'הטיפול אושר על ידי הלקוח/ה',
      color: '#059669',
      message: `<strong>${recipientName}</strong> אישר/ה את הטיפול <strong>${treatmentTitle}</strong> לרכב <strong>${vehicleLabel}</strong>.`,
      cta: 'צפה/י בטיפולים',
      ctaUrl: `${baseUrl}/garage/treatments`,
    },
    rejected: {
      emoji: '❌',
      title: 'הטיפול נדחה על ידי הלקוח/ה',
      color: '#dc2626',
      message: `<strong>${recipientName}</strong> דחה/דחתה את הטיפול <strong>${treatmentTitle}</strong> לרכב <strong>${vehicleLabel}</strong>.${rejectionReason ? ` סיבה: ${rejectionReason}` : ''}`,
      cta: 'צפה/י בטיפולים',
      ctaUrl: `${baseUrl}/garage/treatments`,
    },
  };

  const c = cfg[status];
  const header = `<h1 style="color:#ffffff;margin:0;font-size:20px">${c.emoji} ${c.title}</h1>`;

  const rows = [
    detailRow('מוסך', garageName),
    detailRow('רכב', vehicleLabel),
    detailRow('סוג', treatmentType),
    detailRow('כותרת', treatmentTitle),
    detailRow('תאריך', date),
    ...(mileage ? [detailRow('ק״מ', mileage.toLocaleString())] : []),
    ...(cost && cost > 0 ? [detailRow('עלות', `₪${cost.toLocaleString()}`, true)] : []),
  ].join('');

  const descriptionHtml = description
    ? `<div style="background:#f8fafc;border-right:3px solid ${c.color};border-radius:6px;padding:12px 14px;margin:0 0 16px"><p style="margin:0;font-size:14px;color:#475569;line-height:1.5">${description}</p></div>`
    : '';

  const body = [
    p(`שלום ${recipientName},`),
    p(c.message),
    descriptionHtml,
    detailTable(rows),
    `<div style="text-align:center;margin:24px 0">${btnHtml(c.ctaUrl, c.cta, c.color)}</div>`,
    pSmall('הודעה זו נשלחה אוטומטית ע״י מערכת AutoLog. אין צורך להשיב.'),
  ].join('');

  return emailWrapper(c.color, header, body);
}

/**
 * Bug Report Email — sent to the dev team whenever a user reports a bug
 * (via the floating "report bug" button OR when ErrorBoundary catches a
 * render error). Designed to give you everything you need to reproduce
 * and fix without bothering the user.
 */
export function buildBugReportEmailHtml({
  source,
  userDescription,
  errorMessage,
  errorStack,
  pageUrl,
  userAgent,
  viewport,
  userEmail,
  userName,
  userId,
  timestamp,
  sentryEventId,
}: {
  source: 'user-report' | 'error-boundary' | 'global-error';
  userDescription?: string | null;
  errorMessage?: string | null;
  errorStack?: string | null;
  pageUrl: string;
  userAgent: string;
  viewport?: string;
  userEmail?: string | null;
  userName?: string | null;
  userId?: string | null;
  timestamp: string;
  sentryEventId?: string | null;
}): string {
  const sourceConfig: Record<typeof source, { emoji: string; title: string; color: string; bg: string }> = {
    'user-report': {
      emoji: '👤',
      title: 'דיווח באג ממשתמש',
      color: '#2E77D0',
      bg: 'linear-gradient(135deg,#2E77D0,#0f766e)',
    },
    'error-boundary': {
      emoji: '⚠️',
      title: 'קריסת רינדור (Error Boundary)',
      color: '#f59e0b',
      bg: 'linear-gradient(135deg,#f59e0b,#d97706)',
    },
    'global-error': {
      emoji: '🚨',
      title: 'קריסה גלובלית של האפליקציה',
      color: '#dc2626',
      bg: 'linear-gradient(135deg,#dc2626,#b91c1c)',
    },
  };
  const cfg = sourceConfig[source];

  const header = `<h1 style="color:#ffffff;margin:0;font-size:20px">${cfg.emoji} ${cfg.title}</h1>`;

  // What the user said (only present for 'user-report')
  const userSaidHtml = userDescription
    ? `<div style="background:#f0fdfa;border-right:4px solid ${cfg.color};border-radius:8px;padding:16px;margin:0 0 20px"><p style="margin:0 0 6px;font-size:13px;color:#0f766e;font-weight:700">מה המשתמש אמר:</p><p style="margin:0;font-size:15px;color:#1e293b;line-height:1.6;white-space:pre-wrap">${userDescription.replace(/[<>]/g, '')}</p></div>`
    : '';

  // What the system caught (always present for errors, optional for user reports)
  const errorHtml = errorMessage
    ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin:0 0 20px"><p style="margin:0 0 6px;font-size:13px;color:#991b1b;font-weight:700">שגיאה טכנית:</p><p style="margin:0;font-size:14px;color:#7f1d1d;font-family:monospace;word-break:break-word">${errorMessage.replace(/[<>]/g, '')}</p></div>`
    : '';

  // Stack trace (truncated to first 15 lines for readability)
  const stackHtml = errorStack
    ? `<details style="margin:0 0 20px"><summary style="cursor:pointer;font-size:13px;color:#64748b;font-weight:600;margin-bottom:8px">Stack trace (לחץ להרחבה)</summary><pre style="background:#1e293b;color:#e2e8f0;border-radius:6px;padding:12px;font-size:11px;line-height:1.5;overflow-x:auto;direction:ltr;text-align:left;max-height:280px">${errorStack.split('\n').slice(0, 15).join('\n').replace(/[<>]/g, '')}</pre></details>`
    : '';

  // Context table — everything we know about the environment
  const rows = [
    detailRow('עמוד', `<span style="direction:ltr;font-family:monospace;font-size:13px">${pageUrl}</span>`),
    ...(userName ? [detailRow('משתמש', userName)] : []),
    ...(userEmail ? [detailRow('מייל לחזרה', `<a href="mailto:${userEmail}" style="color:${cfg.color}">${userEmail}</a>`)] : []),
    ...(userId ? [detailRow('User ID', `<span style="direction:ltr;font-family:monospace;font-size:12px">${userId}</span>`)] : []),
    ...(viewport ? [detailRow('גודל מסך', viewport)] : []),
    detailRow('דפדפן', `<span style="direction:ltr;font-size:12px;color:#475569">${userAgent.slice(0, 120)}</span>`),
    detailRow('זמן', new Date(timestamp).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'medium' })),
    ...(sentryEventId ? [detailRow('Sentry ID', `<span style="direction:ltr;font-family:monospace;font-size:12px">${sentryEventId.slice(0, 16)}...</span>`, true)] : [detailRow('זמן', new Date(timestamp).toLocaleString('he-IL'), true)].slice(1)),
  ].join('');

  const replyButton = userEmail
    ? `<div style="text-align:center;margin:24px 0">${btnHtml(`mailto:${userEmail}?subject=AutoLog%20-%20בנוגע%20לדיווח%20שלך`, '✉️ השב/י למשתמש', cfg.color)}</div>`
    : '';

  const body = [
    userSaidHtml,
    errorHtml,
    detailTable(rows),
    stackHtml,
    replyButton,
    pSmall('דיווח אוטומטי ממערכת AutoLog. כדי לעצור — הסר/י את ה-handler ב-/api/bug-report.'),
  ].join('');

  return emailWrapper(cfg.bg, header, body);
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
    `<p style="margin:0;font-size:18px;font-weight:700;color:#2E77D0">${vehicleLabel}</p></div>`,
    p('אישור הבקשה יאפשר למשתמש לצפות בפרטי הרכב, להוסיף טיפולים, הוצאות ומסמכים. אתה תישאר הבעלים הראשי של הרכב.', 'font-size:15px;color:#475569;'),
    `<div style="text-align:center;margin:24px 0">${btnHtml(manageUrl, 'נהל בקשות שיתוף', '#2E77D0')}</div>`,
    pSmall('ניתן לאשר או לדחות את הבקשה בכל עת מדף הרכבים שלך.'),
  ].join('');

  return emailWrapper('linear-gradient(135deg,#2E77D0,#0f766e)', header, body);
}

/**
 * Bodywork Quote Accepted — Garage Owner Email
 * Sent to the garage whose quote was accepted by the customer
 */
export function buildBodyworkAcceptedGarageEmailHtml({
  garageName,
  customerName,
  customerPhone,
  customerEmail,
  vehicleLabel,
  description,
  price,
  estimatedDays,
}: {
  garageName: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  vehicleLabel: string;
  description: string;
  price: number;
  estimatedDays?: number | null;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';
  const header = '<h1 style="color:#ffffff;margin:0;font-size:20px">🎉 הצעת המחיר שלך אושרה!</h1>';

  const rows = [
    detailRow('לקוח', customerName),
    customerPhone ? detailRow('טלפון', `<a href="tel:${customerPhone}" style="color:#2563eb;text-decoration:none;font-weight:600">${customerPhone}</a>`) : '',
    customerEmail ? detailRow('אימייל', `<a href="mailto:${customerEmail}" style="color:#2563eb;text-decoration:none;word-break:break-all">${customerEmail}</a>`) : '',
    detailRow('רכב', vehicleLabel),
    detailRow('תיאור הנזק', description),
    detailRow('מחיר שאושר', `₪${price.toLocaleString('he-IL')}`),
    estimatedDays ? detailRow('זמן משוער', `${estimatedDays} ימים`, true) : '',
  ].filter(Boolean).join('');

  const body = [
    p(`שלום ${garageName},`),
    p(`הלקוח <strong>${customerName}</strong> בחר בהצעת המחיר שלכם לפחחות! 🎉`),
    detailTable(rows),
    `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin:0 0 20px">`,
    `<p style="font-size:15px;color:#166534;margin:0;font-weight:600">📞 אנא צרו קשר עם הלקוח בהקדם לתיאום מועד לביצוע העבודה.</p></div>`,
    `<div style="text-align:center;margin:20px 0">${btnHtml(`${baseUrl}/garage/bodywork`, 'צפה בפרטים', '#f97316')}</div>`,
  ].join('');

  return emailWrapper('linear-gradient(135deg,#f97316,#ea580c)', header, body);
}

/**
 * Bodywork Quote Accepted — Admin Email
 * Sent to admin for record-keeping
 */
export function buildBodyworkAcceptedAdminEmailHtml({
  customerName,
  customerPhone,
  customerEmail,
  garageName,
  garageEmail,
  garagePhone,
  vehicleLabel,
  licensePlate,
  description,
  price,
  estimatedDays,
  requestId,
}: {
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  garageName: string;
  garageEmail?: string | null;
  garagePhone?: string | null;
  vehicleLabel: string;
  licensePlate?: string;
  description: string;
  price: number;
  estimatedDays?: number | null;
  requestId: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';
  const header = '<h1 style="color:#ffffff;margin:0;font-size:20px">📋 הצעת פחחות אושרה</h1>';

  const rows = [
    detailRow('לקוח', customerName),
    customerPhone ? detailRow('טלפון לקוח', customerPhone) : '',
    customerEmail ? detailRow('אימייל לקוח', customerEmail) : '',
    detailRow('מוסך', garageName),
    garagePhone ? detailRow('טלפון מוסך', garagePhone) : '',
    garageEmail ? detailRow('אימייל מוסך', garageEmail) : '',
    detailRow('רכב', vehicleLabel),
    licensePlate ? detailRow('מספר רכב', licensePlate) : '',
    detailRow('תיאור', description),
    detailRow('מחיר', `₪${price.toLocaleString('he-IL')}`),
    estimatedDays ? detailRow('זמן משוער', `${estimatedDays} ימים`, true) : '',
  ].filter(Boolean).join('');

  const body = [
    p('שלום מנהל,'),
    p('הצעת מחיר לפחחות אושרה על ידי הלקוח:'),
    detailTable(rows),
    `<div style="text-align:center;margin:20px 0">${btnHtml(`${baseUrl}/admin/bodywork`, 'צפה בפאנל ניהול', '#7c3aed')}</div>`,
  ].join('');

  return emailWrapper('linear-gradient(135deg,#7c3aed,#6d28d9)', header, body);
}

/**
 * Test/Insurance Expiry Reminder Email
 * Sent to vehicle owner when test (MOT) or insurance is approaching expiry.
 */
export function buildExpiryReminderEmailHtml({
  fullName,
  vehicleName,
  licensePlate,
  reminderType,
  expiryDate,
  daysUntil,
}: {
  fullName: string;
  vehicleName: string;
  licensePlate: string;
  reminderType: 'test' | 'insurance' | 'compulsory';
  expiryDate: Date;
  daysUntil: number;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';
  const isTest = reminderType === 'test';
  const isCompulsory = reminderType === 'compulsory';
  const isUrgent = daysUntil <= 3;
  const isExpired = daysUntil <= 0;

  const typeLabel = isTest ? 'טסט' : isCompulsory ? 'ביטוח חובה' : 'ביטוח מקיף';
  const typeIcon = isTest ? '🔧' : '🛡️';
  const accentColor = isExpired ? '#dc2626' : isUrgent ? '#f59e0b' : '#2563eb';
  const headerGradient = isExpired
    ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
    : isUrgent
    ? 'linear-gradient(135deg,#f59e0b,#d97706)'
    : 'linear-gradient(135deg,#1B4E8A,#1D5FAF)';

  const dateStr = expiryDate.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let timeText: string;
  let titleText: string;
  if (isExpired) {
    timeText = 'פג!';
    titleText = `ה${typeLabel} פג — נדרש טיפול דחוף`;
  } else if (daysUntil === 1) {
    timeText = 'מחר';
    titleText = `ה${typeLabel} פג מחר!`;
  } else if (daysUntil <= 7) {
    timeText = `תוך ${daysUntil} ימים`;
    titleText = `ה${typeLabel} פג בקרוב`;
  } else if (daysUntil <= 14) {
    timeText = 'תוך שבועיים';
    titleText = `תזכורת — ה${typeLabel} פג עוד שבועיים`;
  } else {
    timeText = `תוך ${daysUntil} יום`;
    titleText = `תזכורת — ה${typeLabel} פג בקרוב`;
  }

  const ctaLabel = isTest ? 'מצא מוסך לטסט' : 'נהל את הביטוח';
  const ctaUrl = isTest ? `${baseUrl}/user/garages` : `${baseUrl}/user/vehicles`;

  const header = `<h1 style="color:#ffffff;margin:0;font-size:20px">${typeIcon} ${titleText}</h1>`;

  const rows = [
    detailRow('רכב', vehicleName),
    detailRow('מספר רישוי', licensePlate),
    detailRow(isTest ? 'תאריך טסט' : 'תאריך פקיעת ביטוח', dateStr),
    detailRow('זמן נותר', `<strong style="color:${accentColor}">${timeText}</strong>`, true),
  ].join('');

  const tipText = isTest
    ? 'מומלץ לקבוע תור לאבחון לפני מועד הטסט. במערכת AutoLog תמצא מוסכים זמינים באזור שלך.'
    : 'מומלץ לחדש את פוליסת הביטוח לפני המועד כדי להימנע מנסיעה ללא ביטוח.';

  const urgentBanner = isExpired
    ? `<div style="background:#fef2f2;border:2px solid #dc2626;border-radius:8px;padding:14px;margin:0 0 20px;text-align:center"><p style="font-size:15px;color:#991b1b;margin:0;font-weight:700">⚠️ הרכב לא רשאי להיסע עד שתחדש ${typeLabel}!</p></div>`
    : isUrgent
    ? `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px;margin:0 0 20px"><p style="font-size:14px;color:#92400e;margin:0;font-weight:600">⏰ נותרו ${daysUntil <= 1 ? 'פחות מ-' : ''}${daysUntil} ימים. מומלץ לטפל בכך עכשיו.</p></div>`
    : '';

  const body = [
    p(`שלום ${fullName},`),
    p(`זוהי תזכורת ידידותית — ה${typeLabel} של הרכב שלך מתקרב למועד הפקיעה.`),
    detailTable(rows),
    urgentBanner,
    pSmall(tipText),
    `<div style="text-align:center;margin:24px 0">${btnHtml(ctaUrl, ctaLabel, accentColor)}</div>`,
    pSmall('כדי לעצור את התזכורות האלה לרכב מסוים, נהל את הרכב מהאפליקציה.', 'text-align:center;color:#94a3b8;font-size:12px;'),
  ].join('');

  return emailWrapper(headerGradient, header, body);
}

/**
 * Driver's License Expiry Reminder Email
 * Sent to the user when their driving license approaches expiry.
 */
export function buildLicenseReminderEmailHtml({
  fullName,
  expiryDate,
  daysUntil,
}: {
  fullName: string;
  expiryDate: Date;
  daysUntil: number;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolog.click';
  const isUrgent = daysUntil <= 3;
  const isExpired = daysUntil <= 0;
  const accentColor = isExpired ? '#dc2626' : isUrgent ? '#f59e0b' : '#2563eb';
  const headerGradient = isExpired
    ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
    : isUrgent
    ? 'linear-gradient(135deg,#f59e0b,#d97706)'
    : 'linear-gradient(135deg,#1B4E8A,#1D5FAF)';

  const dateStr = expiryDate.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let timeText: string;
  let titleText: string;
  if (isExpired) {
    timeText = 'פג!';
    titleText = 'רישיון הנהיגה פג — נדרש חידוש דחוף';
  } else if (daysUntil === 1) {
    timeText = 'מחר';
    titleText = 'רישיון הנהיגה פג מחר!';
  } else if (daysUntil <= 7) {
    timeText = `תוך ${daysUntil} ימים`;
    titleText = 'רישיון הנהיגה פג בקרוב';
  } else if (daysUntil <= 14) {
    timeText = 'תוך שבועיים';
    titleText = 'תזכורת — רישיון הנהיגה פג עוד שבועיים';
  } else {
    timeText = `תוך ${daysUntil} יום`;
    titleText = 'תזכורת — רישיון הנהיגה פג בקרוב';
  }

  const header = `<h1 style="color:#ffffff;margin:0;font-size:20px">🪪 ${titleText}</h1>`;

  const rows = [
    detailRow('תאריך פקיעה', dateStr),
    detailRow('זמן נותר', `<strong style="color:${accentColor}">${timeText}</strong>`, true),
  ].join('');

  const urgentBanner = isExpired
    ? `<div style="background:#fef2f2;border:2px solid #dc2626;border-radius:8px;padding:14px;margin:0 0 20px;text-align:center"><p style="font-size:15px;color:#991b1b;margin:0;font-weight:700">⚠️ נהיגה ללא רישיון בתוקף אסורה על פי חוק!</p></div>`
    : isUrgent
    ? `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px;margin:0 0 20px"><p style="font-size:14px;color:#92400e;margin:0;font-weight:600">⏰ נותרו ${daysUntil <= 1 ? 'פחות מ-' : ''}${daysUntil} ימים. מומלץ לחדש עכשיו.</p></div>`
    : '';

  const body = [
    p(`שלום ${fullName},`),
    p('זוהי תזכורת ידידותית — רישיון הנהיגה שלך מתקרב למועד הפקיעה.'),
    detailTable(rows),
    urgentBanner,
    pSmall('ניתן לחדש את רישיון הנהיגה באתר משרד התחבורה או בעמדות צילום מוסמכות. חידוש מוקדם חוסך עוגמת נפש.'),
    `<div style="text-align:center;margin:24px 0">${btnHtml(`${baseUrl}/user/profile`, 'עדכן בפרופיל שלי', accentColor)}</div>`,
    pSmall('כדי לעצור תזכורות אלה, הסר את תאריך הרישיון בפרופיל.', 'text-align:center;color:#94a3b8;font-size:12px;'),
  ].join('');

  return emailWrapper(headerGradient, header, body);
}
