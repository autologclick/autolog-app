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
