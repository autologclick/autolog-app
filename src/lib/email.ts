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
 * Includes direct approve/reject action links.
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
  const appointmentsUrl = `${baseUrl}/garage/appointments`;

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
              ${customerPhone ? `<tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">טלפון</td><td style="border-bottom:1px solid #e2e8f0"><a href="tel:${customerPhone}" style="color:#2563eb;text-decoration:none">${customerPhone}</a></td></tr>` : ''}
              ${customerEmail ? `<tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">אימייל</td><td style="border-bottom:1px solid #e2e8f0"><a href="mailto:${customerEmail}" style="color:#2563eb;text-decoration:none">${customerEmail}</a></td></tr>` : ''}
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">רכב</td><td style="border-bottom:1px solid #e2e8f0">${vehicleLabel}</td></tr>
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">סוג שירות</td><td style="border-bottom:1px solid #e2e8f0">${serviceLabel}</td></tr>
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">תאריך</td><td style="border-bottom:1px solid #e2e8f0">${dateLabel}</td></tr>
              <tr><td style="font-weight:600">שעה</td><td>${timeLabel}</td></tr>
              ${notes ? `<tr><td style="border-top:1px solid #e2e8f0;font-weight:600">הערות</td><td style="border-top:1px solid #e2e8f0">${notes}</td></tr>` : ''}
            </table>

            <p style="font-size:14px;color:#dc2626;background:#fef2f2;padding:10px 14px;border-radius:8px;margin:0 0 20px">⏱️ יש לך 3 דקות לאשר או לדחות את התור לפני שהוא נדחה אוטומטית.</p>

            <div style="text-align:center;margin:24px 0">
              <a href="${appointmentsUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;margin-left:12px">
                ✅ אשר תור
              </a>
              <a href="${appointmentsUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700">
                ❌ דחה תור
              </a>
            </div>

            <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0">לחיצה תפתח את מערכת ניהול התורים</p>
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
 * Build the HTML for admin notification about a new appointment.
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

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f4f4f7;margin:0;padding:0;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:24px 32px;text-align:center">
            <h1 style="color:#ffffff;margin:0;font-size:22px">📋 תור חדש במערכת</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px">
            <p style="font-size:16px;color:#1e293b;margin:0 0 20px">שלום מנהל,</p>
            <p style="font-size:16px;color:#1e293b;margin:0 0 20px">תור חדש נקבע במערכת:</p>

            <table width="100%" cellpadding="8" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin-bottom:20px;font-size:15px;color:#334155">
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600;width:120px">מוסך</td><td style="border-bottom:1px solid #e2e8f0">${garageName}</td></tr>
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">לקוח</td><td style="border-bottom:1px solid #e2e8f0">${customerName}</td></tr>
              ${customerPhone ? `<tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">טלפון</td><td style="border-bottom:1px solid #e2e8f0">${customerPhone}</td></tr>` : ''}
              ${customerEmail ? `<tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">אימייל</td><td style="border-bottom:1px solid #e2e8f0">${customerEmail}</td></tr>` : ''}
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">רכב</td><td style="border-bottom:1px solid #e2e8f0">${vehicleLabel}</td></tr>
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">סוג שירות</td><td style="border-bottom:1px solid #e2e8f0">${serviceLabel}</td></tr>
              <tr><td style="border-bottom:1px solid #e2e8f0;font-weight:600">תאריך</td><td style="border-bottom:1px solid #e2e8f0">${dateLabel}</td></tr>
              <tr><td style="font-weight:600">שעה</td><td>${timeLabel}</td></tr>
              ${notes ? `<tr><td style="border-top:1px solid #e2e8f0;font-weight:600">הערות</td><td style="border-top:1px solid #e2e8f0">${notes}</td></tr>` : ''}
            </table>

            <div style="text-align:center">
              <a href="${baseUrl}/admin/appointments" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">
                צפה בפאנל ניהול
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
 * Build the HTML for a status-update notification email to a customer.
 * Enhanced: confirmed status includes garage contact details,
 * rejected status includes recommendation to try another garage.
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

  // Build garage contact section for confirmed appointments
  let garageContactHtml = '';
  if (status === 'confirmed' && (garagePhone || garageAddress)) {
    const contactRows: string[] = [];
    if (garageAddress && garageCity) {
      contactRows.push(`<tr><td style="border-bottom:1px solid #bbf7d0;font-weight:600;width:80px">כתובת</td><td style="border-bottom:1px solid #bbf7d0">${garageAddress}, ${garageCity}</td></tr>`);
    } else if (garageAddress) {
      contactRows.push(`<tr><td style="border-bottom:1px solid #bbf7d0;font-weight:600;width:80px">כתובת</td><td style="border-bottom:1px solid #bbf7d0">${garageAddress}</td></tr>`);
    }
    if (garagePhone) {
      contactRows.push(`<tr><td style="font-weight:600;width:80px">טלפון</td><td><a href="tel:${garagePhone}" style="color:#059669;text-decoration:none;font-weight:600">${garagePhone}</a></td></tr>`);
    }
    garageContactHtml = `
            <p style="font-size:15px;color:#1e293b;font-weight:600;margin:20px 0 8px">📍 פרטי התקשרות עם המוסך:</p>
            <table width="100%" cellpadding="8" cellspacing="0" style="background:#f0fdf4;border-radius:8px;margin-bottom:20px;font-size:15px;color:#334155;border:1px solid #bbf7d0">
              ${contactRows.join('')}
            </table>`;
  }

  // Build recommendation section for rejected appointments
  let rejectionRecommendationHtml = '';
  if (status === 'rejected') {
    rejectionRecommendationHtml = `
            <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0">
              <p style="font-size:15px;color:#92400e;margin:0 0 8px;font-weight:600">💡 מה עכשיו?</p>
              <p style="font-size:14px;color:#92400e;margin:0">מומלץ לנסות לקבוע תור במוסך אחר. במערכת AutoLog ישנם מוסכים נוספים שישמחו לעזור לך.</p>
            </div>
            <div style="text-align:center;margin:20px 0">
              <a href="${baseUrl}/user/garages" style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">
                🔍 חפש מוסך אחר
              </a>
            </div>`;
  }

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
            ${garageContactHtml}
            ${rejectionRecommendationHtml}

            <div style="text-align:center${status === 'rejected' ? '' : ';margin-top:8px'}">
              <a href="${baseUrl}/user/appointments" style="display:inline-block;background:${cfg.color};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">
                צפה בתורים שלי
              </a>
            </div>
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
