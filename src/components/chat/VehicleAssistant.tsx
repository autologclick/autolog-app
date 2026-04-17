'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, MessageCircle, RotateCcw } from 'lucide-react';

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
  { label: 'מה הטיפול הבא?', icon: '🔧' },
  { label: 'יש לי רעש מוזר ברכב', icon: '🔊' },
  { label: 'מתי צריך להחליף שמן?', icon: '🛢️' },
  { label: 'הרכב לא מתניע', icon: '🚗' },
  { label: 'נורת חיווי נדלקה', icon: '⚠️' },
  { label: 'כמה עולה טיפול?', icon: '💰' },
];

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

    // Prepare messages for API (only role+content)
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
            if (event.error) {
              throw new Error(event.error);
            }
            if (event.text) {
              fullText += event.text;
              // Update the assistant message with streamed text
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
              // Skip parse errors for SSE lines
            }
          }
        }
      }

      // If no text came through, show fallback
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

      // Remove the empty assistant message
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

  // ── Reset conversation ───────────────────────────
  const resetConversation = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput('');
    setIsStreaming(false);
  };

  // ── Handle Enter key ─────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  const showSuggestions = messages.length === 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end lg:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg h-[92vh] lg:h-[80vh] lg:max-h-[700px] rounded-t-2xl lg:rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-l from-[#1e3a5f] to-[#2a5a8f] text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <MessageCircle size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-tight">AutoLog AI</h3>
            <p className="text-[11px] text-white/70 truncate">{vehicleName}</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={resetConversation}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="שיחה חדשה"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Messages area ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fa]">
          {/* Welcome message */}
          {showSuggestions && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <MessageCircle size={28} className="text-white" />
              </div>
              <h4 className="font-bold text-[#1e3a5f] text-base mb-1">היי, אני AutoLog AI</h4>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                אני מכיר את הרכב שלך ויכול לעזור עם כל שאלה — תחזוקה, תקלות, עלויות או המלצות.
              </p>
            </div>
          )}

          {/* Suggestion chips */}
          {showSuggestions && (
            <div className="flex flex-wrap justify-center gap-2 pb-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.label)}
                  className="bg-white border border-gray-200 rounded-full px-3.5 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition-all active:scale-95 shadow-sm"
                >
                  <span className="ml-1.5">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                }`}
              >
                {msg.content || (
                  <span className="inline-flex items-center gap-1.5 text-gray-400">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs">חושב...</span>
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Error message */}
          {error && (
            <div className="flex justify-end">
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-2.5 text-sm max-w-[85%]">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area ── */}
        <div className="border-t border-gray-100 bg-white p-3 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="שאל אותי על הרכב שלך..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none disabled:opacity-50 max-h-[100px] leading-relaxed"
              style={{ minHeight: '42px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 100) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-all hover:bg-teal-700"
            >
              {isStreaming ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} className="rotate-180" />
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
