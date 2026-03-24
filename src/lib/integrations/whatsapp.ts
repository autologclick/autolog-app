/**
 * WhatsApp Integration via Twilio
 * Sends templated messages via WhatsApp
 * Gracefully disabled when env vars are missing
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('business');

// Localized message templates (Hebrew)
const MESSAGE_TEMPLATES = {
  test_reminder: {
    title: 'תזכורת בדיקה חודשית',
    body: 'שלום {{vehicleName}},\n\nזהו תזכורת לביצוע בדיקה חודשית של הרכב שלך.\n\nתאריך הבדיקה המתוכנן: {{testDate}}\n\nבואו לביקור בגראז שלנו כדי לוודא שהרכב בתנאי מעולה.\n\nתודה,\nצוות AutoLog',
  },
  appointment_confirmation: {
    title: 'אישור תור',
    body: 'שלום {{customerName}},\n\nתור שלך אושר בהצלחה!\n\nגראז: {{garageName}}\nתאריך: {{date}}\nשעה: {{time}}\n\nאנא הגיעו 5 דקות לפני המועד. במידה וצריכים לבטל או לשנות את התור, אנא הודיעו לנו בהקדם.\n\nתודה,\nצוות AutoLog',
  },
  sos_alert: {
    title: 'התראת חירום',
    body: 'התראת חירום לרכב {{vehicleName}}\n\nמיקום: {{location}}\nזמן: {{timestamp}}\n\nאנא בדוקו את מצב הרכב ובטאו תרומה לשירותי החרום במידת הצורך.',
  },
};

interface SendMessageResponse {
  sent: boolean;
  reason?: string;
  messageId?: string;
}

/**
 * Check if WhatsApp integration is configured
 */
export function isWhatsAppConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );
}

/**
 * Send a WhatsApp message via Twilio
 * @param to - Recipient phone number (E.164 format, e.g., +972501234567)
 * @param templateName - Template key from MESSAGE_TEMPLATES
 * @param params - Parameters to substitute in template
 */
export async function sendWhatsAppMessage(
  to: string,
  templateName: keyof typeof MESSAGE_TEMPLATES,
  params: Record<string, string>
): Promise<SendMessageResponse> {
  // Check if WhatsApp is configured
  if (!isWhatsAppConfigured()) {
    logger.warn('WhatsApp not configured, skipping message', {
      to,
      template: templateName,
    });
    return { sent: false, reason: 'not_configured' };
  }

  // Validate phone number format
  if (!to.match(/^\+\d{10,15}$/)) {
    logger.error('Invalid phone number format', { to });
    return { sent: false, reason: 'invalid_phone' };
  }

  // Get template
  const template = MESSAGE_TEMPLATES[templateName];
  if (!template) {
    logger.error('Template not found', { template: templateName });
    return { sent: false, reason: 'template_not_found' };
  }

  // Substitute parameters in template
  let body = template.body;
  for (const [key, value] of Object.entries(params)) {
    body = body.replace(`{{${key}}}`, value);
  }

  try {
    // Dynamically import Twilio SDK only if available
    // This allows graceful degradation if twilio package is not installed
    let twilio: any;
    try {
      twilio = require('twilio');
    } catch {
      logger.warn('Twilio package not installed, cannot send WhatsApp message');
      return { sent: false, reason: 'twilio_not_installed' };
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${to}`,
      body,
    });

    logger.info('WhatsApp message sent', {
      to,
      template: templateName,
      messageId: message.sid,
    });

    return { sent: true, messageId: message.sid };
  } catch (error) {
    logger.error('Failed to send WhatsApp message', {
      to,
      template: templateName,
      error: error instanceof Error ? error.message : String(error),
    });
    return { sent: false, reason: 'send_failed' };
  }
}

/**
 * Send a test reminder notification
 * @param phone - Recipient phone number in E.164 format
 * @param vehicleName - Name of the vehicle
 * @param testDate - Formatted date string (e.g., "2026-03-28")
 */
export async function sendTestReminder(
  phone: string,
  vehicleName: string,
  testDate: string
): Promise<SendMessageResponse> {
  return sendWhatsAppMessage(phone, 'test_reminder', {
    vehicleName,
    testDate,
  });
}

/**
 * Send an appointment confirmation notification
 * @param phone - Recipient phone number in E.164 format
 * @param garageName - Name of the garage
 * @param date - Appointment date (e.g., "2026-03-28")
 * @param time - Appointment time (e.g., "14:30")
 */
export async function sendAppointmentConfirmation(
  phone: string,
  garageName: string,
  date: string,
  time: string
): Promise<SendMessageResponse> {
  return sendWhatsAppMessage(phone, 'appointment_confirmation', {
    customerName: 'לקוח יקר',
    garageName,
    date,
    time,
  });
}

/**
 * Send an SOS alert notification
 * @param phone - Recipient phone number in E.164 format
 * @param vehicleName - Name of the vehicle
 * @param location - Location coordinates or address
 */
export async function sendSOSAlert(
  phone: string,
  vehicleName: string,
  location: string
): Promise<SendMessageResponse> {
  return sendWhatsAppMessage(phone, 'sos_alert', {
    vehicleName,
    location,
    timestamp: new Date().toLocaleString('he-IL'),
  });
}
