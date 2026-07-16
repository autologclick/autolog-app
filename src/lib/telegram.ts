/**
 * Telegram Ops Notifier
 * Sends ops/activity + critical-failure messages to a Telegram chat.
 * Fire-and-forget: never throws, never blocks a request.
 * Gracefully no-ops if TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are unset.
 *
 * Mirrors push-sender.ts — best-effort side-channel only.
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const DEDUP_WINDOW_MS = 5 * 60 * 1000;
const recentCritical = new Map<string, number>();

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function send(text: string): Promise<void> {
  if (!TOKEN || !CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // Swallow — Telegram being down must never affect the app.
  }
}

/** Activity / ops message. Fire-and-forget. */
export function notifyTelegram(title: string, body?: string): void {
  const text = body
    ? `<b>${escapeHtml(title)}</b>\n${escapeHtml(body)}`
    : `<b>${escapeHtml(title)}</b>`;
  void send(text);
}

/** Critical failure alert: 🔴 prefix + 5-min dedup per unique message. Fire-and-forget. */
export function notifyTelegramCritical(title: string, body?: string): void {
  const key = `${title}|${body || ''}`.slice(0, 200);
  const now = Date.now();
  const last = recentCritical.get(key);
  if (last && now - last < DEDUP_WINDOW_MS) return;
  recentCritical.set(key, now);

  if (recentCritical.size > 200) {
    for (const [k, t] of recentCritical) {
      if (now - t > DEDUP_WINDOW_MS) recentCritical.delete(k);
    }
  }

  const text = body
    ? `🔴 <b>${escapeHtml(title)}</b>\n${escapeHtml(body)}`
    : `🔴 <b>${escapeHtml(title)}</b>`;
  void send(text);
}
