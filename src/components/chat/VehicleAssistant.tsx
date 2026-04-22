'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, RotateCcw, Sparkles, ChevronLeft } from 'lucide-react';
import VoiceMicButton from '@/components/ui/VoiceMicButton';

// ── Types ──────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface VehicleAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
}

// ── Quick suggestions ──────────────────────────────
const SUGGESTIONS = [
  { label: 'מה כולל הטיפול הבא?', icon: '🔧' },
  { label: 'יש לי רעש מוזר ברכב', icon: '🔊' },
  { label: 'מתי צריך להחליף שמן?', icon: '🛢️' },
  { label: 'הרכב לא מתניע', icon: '🚗' },
  { label: 'נורת חיווי נדלקה', icon: '⚠️' },
  { label: 'כמה עולה טיפול?', icon: '💰' },
];

// ── Bot avatar ─────────────────────────────────────
const BotAvatar = () => (
  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] flex items-center justify-center flex-shrink-0 shadow-sm">
    <Sparkles size={13} className="text-white" />
  </div>
);

// ── Component ──────────────────────────────────────
export default function VehicleAssistant({
  isOpen, onClose, vehicleId, vehicleName,
}: VehicleAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // ── Send message ─────────────────────────────────
  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isStreaming) return;

    setInput('');
    setError(null);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };

    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
    };

    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, assistantMsg]);
    setIsStreaming(true);

    const apiMessages = updatedMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortRef.current = new AbortController();

      const response = await fetch('/api/chat/vehicle-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, messages: apiMessages }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'שגיאה בשליחת ההודעה');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

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
            if (event.error) throw new Error(event.error);
            if (event.text) {
              fullText += event.text;
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = { ...updated[lastIdx], content: fullText };
                }
                return updated;
              });
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'שגיאה בשירות AI') {
              // skip parse errors
            }
          }
        }
      }

      if (!fullText) {
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant' && !updated[lastIdx].content) {
            updated[lastIdx] = { ...updated[lastIdx], content: 'לא הצלחתי לעבד את הבקשה. נסה שוב.' };
          }
          return updated;
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const errorMsg = err instanceof Error ? err.message : 'שגיאה לא צפויה';
      setError(errorMsg);
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'assistant' && !updated[lastIdx].content) {
          return updated.slice(0, -1);
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const resetConversation = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput('');
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  const showWelcome = messages.length === 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-end lg:items-center justify-center backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="bg-[#f8f9fb] w-full max-w-lg h-[90vh] lg:h-[80vh] lg:max-h-[700px] rounded-t-3xl lg:rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <h3 className="font-bold text-sm text-[#1e3a5f] leading-tight">AutoLog AI</h3>
            <p className="text-[11px] text-gray-400 truncate">{vehicleName}</p>
          </div>
          {messages.length > 0 ? (
            <button
              onClick={resetConversation}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              title="שיחה חדשה"
            >
              <RotateCcw size={16} className="text-gray-400" />
            </button>
          ) : (
            <div className="w-8" /> /* spacer for centering */
          )}
        </div>

        {/* ── Messages area ── */}
        <div className="flex-1 overflow-y-auto px-4 py-5">

          {/* Welcome state */}
          {showWelcome && (
            <div className="flex flex-col items-center h-full justify-center -mt-4">
              {/* Logo mark */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2a5a8f] flex items-center justify-center mb-4 shadow-lg">
                <Sparkles size={24} className="text-white" />
              </div>

              <h4 className="font-bold text-[#1e3a5f] text-lg mb-1">
                מה נוכל לעזור?
              </h4>
              <p className="text-[13px] text-gray-400 text-center mb-8 max-w-[260px] leading-relaxed">
                אני מכיר את ה{vehicleName} שלך ויכול לעזור בכל שאלה על הרכב
              </p>

              {/* Suggestion grid */}
              <div className="w-full max-w-sm space-y-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.label)}
                    className="w-full flex items-center gap-3 bg-white rounded-xl px-4 py-3 text-right hover:shadow-md transition-all active:scale-[0.98] border border-gray-100 group"
                  >
                    <span className="text-base flex-shrink-0">{s.icon}</span>
                    <span className="flex-1 text-sm text-gray-700 group-hover:text-[#1e3a5f] font-medium">{s.label}</span>
                    <ChevronLeft size={14} className="text-gray-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {!showWelcome && (
            <div className="space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar — bot only */}
                  {msg.role === 'assistant' && <BotAvatar />}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-[1.7] ${
                      msg.role === 'user'
                        ? 'bg-[#1e3a5f] text-white rounded-tl-md'
                        : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tr-md'
                    }`}
                  >
                    {msg.content || (
                      <span className="inline-flex items-center gap-2 text-gray-400 py-0.5">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Error */}
              {error && (
                <div className="flex gap-2">
                  <BotAvatar />
                  <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl rounded-tr-md px-4 py-3 text-sm max-w-[80%]">
                    {error}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input area ── */}
        <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0">
          <div className="flex items-end gap-2">
            <VoiceMicButton value={input} onResult={v => setInput(v)} disabled={isStreaming} />
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="כתוב או דבר..."
                rows={1}
                disabled={isStreaming}
                className="w-full resize-none bg-[#f0f2f5] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:bg-white focus:border focus:border-gray-200 disabled:opacity-50 max-h-[100px] leading-relaxed transition-all placeholder:text-gray-400"
                style={{ minHeight: '42px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 100) + 'px';
                }}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="w-10 h-10 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30 active:scale-95 transition-all hover:bg-[#2a5a8f] shadow-sm"
            >
              {isStreaming ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} className="rotate-180 -mr-0.5" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            AutoLog AI יכול לטעות — מומלץ להתייעץ עם מכונאי מוסמך
          </p>
        </div>
      </div>
    </div>
  );
}
