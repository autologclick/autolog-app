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

/**
 * Build the HTML for a password-reset email.
 */
export function buildPasswordResetEmailHtml({
  fullName,
  resetUrl,
}: {
  fullName: string;
  resetUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f4f4f7;margin:0;padding:0;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#2d5a8e);padding:24px 32px;text-align:center">
            <h1 style="color:#ffffff;margin:0;font-size:22px">🔑 איפוס סיסמה</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px">
            <p style="font-size:16px;color:#1e293b;margin:0 0 20px">שלום ${fullName},</p>
            <p style="font-size:16px;color:#1e293b;margin:0 0 20px">קיבלנו בקשה לאיפוס הסיסמה שלך ב-AutoLog. לחץ על הכפתור למטה כדי לבחור סיסמה חדשה:</p>
            <div style="text-align:center;margin:28px 0">
              <a href="${resetUrl}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700">
                איפוס סיסמה
              </a>
            </div>
            <p style="font-size:14px;color:#64748b;margin:0 0 12px">הקישור תקף לשעה אחת בלבד.</p>
            <p style="font-size:14px;color:#64748b;margin:0">אם לא ביקשת איפוס סיסמה, ניתן להתעלם מהודעה זו.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0">
            AutoLog — ניהול רכבים חכם
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Build the HTML for welcome email with credentials for new garage owners.
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
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f4f4f7;margin:0;padding:0;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#10b981);padding:24px 32px;text-align:center">
            <h1 style="color:#ffffff;margin:0;font-size:22px">🎉 ברוכים הבאים ל-AutoLog!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px">
            <p style="font-size:16px;color:#1e293b;margin:0 0 20px">שלום ${ownerName},</p>
            <p style="font-size:16px;color:#1e293b;margin:0 0 20px">בקשת ההצטרפות של <strong>${garageName}</strong> אושרה! להלן פרטי ההתחברות שלך:</p>
            <table width="100%" cellpadding="10" cellspacing="0" style="background:#f0fdf4;border-radius:8px;margin-bottom:20px;font-size:15px;color:#334155;border:1px solid #bbf7d0">
              <tr><td style="border-bottom:1px solid #bbf7d0;font-weight:600;width:120px">אימייל</td><td style="border-bottom:1px solid #bbf7d0;font-family:monospace">${email}</td></tr>
              <tr><td style="font-weight:600">סיסמה זמנית</td><td style="font-family:monospace;font-weight:700;color:#059669">${tempPassword}</td></tr>
            </table>
            <p style="font-size:14px;color:#dc2626;background:#fef2f2;padding:12px;border-radius:8px;margin:0 0 20px">⚠️ מומלץ לשנות את הסיסמה מיד לאחר ההתחברות הראשונה.</p>
            <div style="text-align:center;margin:20px 0">
              <a href="${loginUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700">
                כניסה למערכת
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0">
            AutoLog — ניהול רכבים חכם
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Build the HTML for a new-appointment notification email to a garage owner.
 */
export function buildAppointmentEmailHtml({
  garageName,
  customerName,
  vehicleLabel,
  serviceLabel,
  dateLabel,
  timeLabel,
  notes,
}: {
  garageName: string;
  customerName: string;
  vehicleLabel: string;
  serviceLabel: string;
  dateLabel: string;
  timeLabel: string;
  notes?: string | null;
}): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f4f4f7;margin:0;padding:0;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px 32px;text-align:center">
            <h1 style="color:#ffffff;margin:0;font-size:22px">🔧 תור חדש התקבל!</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px">
            <p style="font-size:16px;color:#1e293b;margin:0 0 20px">שלום,</p>
            <p style="font-size:16px;color:#1e293b;margin:0 0 20px">תור חדש נקבע ב<strong>${garageName}</strong>:</p>

            <table width="100%" cellpadding="8" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin-bottom:20px;font-size:15px;color:#334155">
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600;width:120px">לקוח</td><td style="border-bottom:1px solid #e2e8f0">${customerName}</td></tr>
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">רכב</td><td style="border-bottom:1px solid #e2e8f0">${vehicleLabel}</td></tr>
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">סוג שירות</td><td style="border-bottom:1px solid #e2e8f0">${serviceLabel}</td></tr>
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">תאריך</td><td style="border-bottom:1px solid #e2e8f0">${dateLabel}</td></tr>
              <tr><td style="font-weight:600">שעה</td><td>${timeLabel}</td></tr>
              ${notes ? `<tr><td style="border-top:1px solid #e2e8f0;font-weight:600">הערות</td><td style="border-top:1px solid #e2e8f0">${notes}</td></tr>` : ''}
            </table>

            <a href="https://autolog.click/garage/appointments" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">
              צפה בתורים
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0">
            AutoLog — ניהול רכבים חכם
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Build the HTML for a status-update notification email to a customer.
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
      message: `לצערנו, ההזמנה שלך ב<strong>${garageName}</strong> נדחתה.${rejectionReason ? ` סיבה: ${rejectionReason}` : ''} ניתן לנסות מוסך אחר.`,
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

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f4f4f7;margin:0;padding:0;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <!-- Header -->
        <tr>
          <td style="background:${cfg.color};padding:24px 32px;text-align:center">
            <h1 style="color:#ffffff;margin:0;font-size:22px">${cfg.emoji} ${cfg.title}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px">
            <p style="font-size:16px;color:#1e293b;margin:0 0 20px">שלום ${customerName},</p>
            <p style="font-size:16px;color:#1e293b;margin:0 0 20px">${cfg.message}</p>

            <table width="100%" cellpadding="8" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin-bottom:20px;font-size:15px;color:#334155">
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600;width:120px">מוסך</td><td style="border-bottom:1px solid #e2e8f0">${garageName}</td></tr>
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">רכב</td><td style="border-bottom:1px solid #e2e8f0">${vehicleLabel}</td></tr>
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">סוג שירות</td><td style="border-bottom:1px solid #e2e8f0">${serviceLabel}</td></tr>
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">תאריך</td><td style="border-bottom:1px solid #e2e8f0">${dateLabel}</td></tr>
              <tr><td style="font-weight:600">שעה</td><td>${timeLabel}</td></tr>
            </table>

            <a href="https://autolog.click/user/appointments" style="display:inline-block;background:${cfg.color};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">
              צפה בתורים שלי
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;text-alig