import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, handleApiError, sanitizeInput } from '@/lib/api-helpers';
import { AuthError } from '@/lib/api-helpers';

/**
 * POST /api/chat/vehicle-assistant
 *
 * Streaming AI chat assistant that knows the user's vehicle.
 * Accepts: { vehicleId: string, messages: Array<{ role: 'user'|'assistant', content: string }> }
 * Returns: SSE stream of text chunks
 */

// ── Types ──────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Vehicle context loader ─────────────────────────
async function loadVehicleContext(vehicleId: string, userId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true, userId: true, manufacturer: true, model: true,
      year: true, mileage: true, fuelType: true, licensePlate: true,
      color: true, nickname: true,
      testExpiryDate: true, insuranceExpiry: true,
    },
  });

  if (!vehicle || vehicle.userId !== userId) return null;

  // Fetch recent treatments (last 10)
  const treatments = await prisma.treatment.findMany({
    where: { vehicleId },
    orderBy: { date: 'desc' },
    take: 10,
    select: {
      type: true, title: true, date: true,
      cost: true, mileage: true, garageName: true,
    },
  });

  // Fetch maintenance schedule from cache
  let maintenanceInfo = '';
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ maintenanceData: string | null }>>(
      `SELECT "maintenanceData" FROM "Vehicle" WHERE "id" = $1`,
      vehicleId
    );
    const cached = result[0]?.maintenanceData;
    if (cached) {
      const schedule = JSON.parse(cached);
      const nextKm = schedule.nextServiceKm;
      const items = (schedule.items || [])
        .filter((i: { nextAtKm: number }) => i.nextAtKm === nextKm)
        .map((i: { item: string; estimatedCost: string; category: string }) =>
          `${i.item} (${i.estimatedCost})`
        );
      maintenanceInfo = `הטיפול הבא ב-${nextKm?.toLocaleString()} ק"מ. פריטים: ${items.join(', ') || 'טיפול שגרתי'}.`;
    }
  } catch { /* non-fatal */ }

  // Document status
  const testDays = vehicle.testExpiryDate
    ? Math.ceil((new Date(vehicle.testExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const insuranceDays = vehicle.insuranceExpiry
    ? Math.ceil((new Date(vehicle.insuranceExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    vehicle,
    treatments,
    maintenanceInfo,
    testDays,
    insuranceDays,
  };
}

// ── System prompt builder ──────────────────────────
function buildSystemPrompt(ctx: NonNullable<Awaited<ReturnType<typeof loadVehicleContext>>>) {
  const { vehicle, treatments, maintenanceInfo, testDays, insuranceDays } = ctx;

  const treatmentHistory = treatments.length > 0
    ? treatments.map(t => {
        const date = new Date(t.date).toLocaleDateString('he-IL');
        const cost = t.cost ? ` (₪${t.cost})` : '';
        const km = t.mileage ? ` @ ${t.mileage.toLocaleString()} ק"מ` : '';
        const garage = t.garageName ? ` — ${t.garageName}` : '';
        return `• ${t.title}${cost}${km} — ${date}${garage}`;
      }).join('\n')
    : 'אין היסטוריית טיפולים';

  const testStatus = testDays !== null
    ? (testDays < 0 ? `טסט פג תוקף לפני ${Math.abs(testDays)} יום!` : `טסט בתוקף — נותרו ${testDays} יום`)
    : 'אין מידע על טסט';

  const insuranceStatus = insuranceDays !== null
    ? (insuranceDays < 0 ? `ביטוח פג תוקף!` : `ביטוח בתוקף — נותרו ${insuranceDays} יום`)
    : 'אין מידע על ביטוח';

  return `אתה עוזר מקצועי לרכב באפליקציית AutoLog — אפליקציה ישראלית לניהול רכב.
שמך "AutoLog AI" ואתה מומחה לרכבים עם ידע רחב בתחזוקה, תקלות, בטיחות ורגולציה ישראלית.

── הרכב של המשתמש ──
יצרן: ${vehicle.manufacturer}
דגם: ${vehicle.model}
שנה: ${vehicle.year}
קילומטראז': ${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' ק"מ' : 'לא ידוע'}
סוג דלק: ${vehicle.fuelType || 'לא ידוע'}
צבע: ${vehicle.color || 'לא ידוע'}
לוחית: ${vehicle.licensePlate}

── סטטוס מסמכים ──
${testStatus}
${insuranceStatus}

── תחזוקה ──
${maintenanceInfo || 'אין מידע על תחזוקה מתוזמנת'}

── היסטוריית טיפולים אחרונים ──
${treatmentHistory}

── כללי התנהגות ──
1. ענה תמיד בעברית תקינה, בטון ידידותי ומקצועי. הקפד על איות ודקדוק נכונים. אל תהיה פורמלי מדי ואל תהיה לא רציני.
2. השתמש בידע על הרכב הספציפי של המשתמש בתשובות שלך. אל תשאל שאלות שהתשובה להן כבר נמצאת בנתונים למעלה.
3. כשמישהו מתאר תקלה — תן הסבר קצר ומובן מה עלול לגרום לזה, וציין תמיד שמומלץ לבדוק אצל מכונאי מוסמך. לעולם אל תאבחן באופן סופי.
4. אם יש קשר בין השאלה להיסטוריית הטיפולים או למועד הטיפול הבא — הזכר את זה.
5. כשהמשתמש צריך מוסך — הצע לו להזמין תור דרך AutoLog.
6. אל תדבר על נושאים שלא קשורים לרכב, נהיגה, בטיחות בדרכים או שירות. אם שואלים משהו לא קשור — ענה בנימוס שאתה מתמחה ברכב ותשמח לעזור בנושאי רכב.
7. שמור על תשובות קצרות וברורות. אל תכתוב חיבור. 2-4 משפטים בדרך כלל מספיקים.
8. אל תמציא מידע. אם אתה לא בטוח — אמור שאתה לא בטוח והמלץ לפנות למקצוען.
9. אם הטסט או הביטוח עומדים לפוג או פגו — הזכר את זה כשרלוונטי ודחוף.
10. חשוב מאוד: אל תשתמש בעיצוב Markdown. אין כוכביות (**), אין תבליטים (#), אין קווים תחתונים. כתוב טקסט רגיל ופשוט בלבד. במקום הדגשה עם כוכביות, פשוט כתוב את המילה כמו שהיא.
11. אל תציג טבלאות או קוד. אל תשתמש באימוג'י מיותרים — מותר אימוג'י אחד קטן בסוף הודעה אם מתאים, לא יותר.`;
}

// ── Streaming handler ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();

    const { vehicleId, messages } = body as {
      vehicleId?: string;
      messages?: ChatMessage[];
    };

    if (!vehicleId || typeof vehicleId !== 'string') {
      return new Response(JSON.stringify({ error: 'חסר מזהה רכב' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'חסרות הודעות' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Limit conversation length to prevent abuse
    if (messages.length > 30) {
      return new Response(JSON.stringify({ error: 'השיחה ארוכה מדי, פתח שיחה חדשה' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sanitize user messages
    const sanitizedMessages = messages.map(m => ({
      role: m.role,
      content: m.role === 'user' ? sanitizeInput(m.content).slice(0, 1000) : m.content,
    }));

    // Load vehicle context
    const ctx = await loadVehicleContext(vehicleId, payload.userId);
    if (!ctx) {
      return new Response(JSON.stringify({ error: 'רכב לא נמצא' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(ctx);

    // Get API key — prefer Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!anthropicKey && !openaiKey) {
      return new Response(JSON.stringify({ error: 'שירות הצ\'אט לא מוגדר' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Stream with Anthropic Claude
    if (anthropicKey) {
      return streamWithAnthropic(anthropicKey, systemPrompt, sanitizedMessages);
    }

    // Fallback: stream with OpenAI
    return streamWithOpenAI(openaiKey!, systemPrompt, sanitizedMessages);

  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status, headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'שגיאת שרת' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── Anthropic streaming ────────────────────────────
function streamWithAnthropic(apiKey: string, system: string, messages: ChatMessage[]) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            temperature: 0.4,
            system,
            stream: true,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('Anthropic stream error:', response.status, errText);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'שגיאה בשירות AI' })}\n\n`));
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'No response stream' })}\n\n`));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);

              // content_block_delta contains the streamed text
              if (event.type === 'content_block_delta' && event.delta?.text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
                );
              }

              // message_stop means we're done
              if (event.type === 'message_stop') {
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              }
            } catch {
              // Skip unparseable SSE lines
            }
          }
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (error) {
        console.error('Anthropic stream error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'שגיאה בשירות' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ── OpenAI streaming fallback ──────────────────────
function streamWithOpenAI(apiKey: string, system: string, messages: ChatMessage[]) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 800,
            temperature: 0.4,
            stream: true,
            messages: [
              { role: 'system', content: system },
              ...messages.map(m => ({ role: m.role, content: m.content })),
            ],
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('OpenAI stream error:', response.status, errText);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'שגיאה בשירות AI' })}\n\n`));
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              continue;
            }

            try {
              const event = JSON.parse(data);
              const text = event.choices?.[0]?.delta?.content;
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            } catch {
              // skip
            }
          }
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (error) {
        console.error('OpenAI stream error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'שגיאה בשירות' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
