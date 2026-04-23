'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';

interface VoiceMicButtonProps {
  /** Current text value of the target input */
  value: string;
  /** Called with the updated text (existing + spoken) */
  onResult: (newValue: string) => void;
  /** Disable the button */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

const MIC_CONSENT_KEY = 'autolog_mic_consent';

/**
 * Compact microphone button for speech-to-text.
 * Place it next to any <input> or <textarea> — it appends spoken text to the current value.
 * Uses Web Speech API (he-IL) with proper permission handling for mobile.
 *
 * On first use, shows a consent prompt explaining why mic access is needed.
 * After the user approves, it won't ask again.
 */
export default function VoiceMicButton({
  value,
  onResult,
  disabled = false,
  size = 'sm',
  className = '',
}: VoiceMicButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [permState, setPermState] = useState<'unknown' | 'granted' | 'denied' | 'requesting'>('unknown');
  const [showConsent, setShowConsent] = useState(false);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const valueRef = useRef(value);
  const onResultRef = useRef(onResult);

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    const rec = new SR();
    rec.lang = 'he-IL';
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        const cur = valueRef.current;
        onResultRef.current(cur + (cur ? ' ' : '') + transcript);
      }
    };

    rec.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setPermState('denied');
      }
    };

    rec.onend = () => {
      setIsListening(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };

    recognitionRef.current = rec;

    return () => {
      try { rec.stop(); } catch {}
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  /** Check if the user has already consented */
  const hasConsent = useCallback(() => {
    try { return localStorage.getItem(MIC_CONSENT_KEY) === 'true'; } catch { return false; }
  }, []);

  /** Save consent */
  const saveConsent = useCallback(() => {
    try { localStorage.setItem(MIC_CONSENT_KEY, 'true'); } catch {}
  }, []);

  /** Actually start listening (after consent is confirmed) */
  const startListening = useCallback(async () => {
    if (!recognitionRef.current) return;

    try {
      setPermState('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermState('granted');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        recognitionRef.current.stop();
        setTimeout(() => {
          try { recognitionRef.current.start(); setIsListening(true); } catch {}
        }, 100);
      }
    } catch {
      setPermState('denied');
    }
  }, []);

  /** Handle mic button click */
  const toggle = useCallback(async () => {
    if (!recognitionRef.current || disabled) return;

    if (permState === 'denied') {
      alert('הגישה למיקרופון נחסמה.\n\nכדי להפעיל מחדש:\nלחץ על הסמל 🔒 בשורת הכתובת → הרשאות → מיקרופון → אפשר');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    // First-time use: show consent prompt
    if (!hasConsent()) {
      setShowConsent(true);
      return;
    }

    await startListening();
  }, [isListening, disabled, hasConsent, startListening, permState]);

  /** User approved consent */
  const handleConsentApprove = useCallback(async () => {
    saveConsent();
    setShowConsent(false);
    await startListening();
  }, [saveConsent, startListening]);

  /** User declined consent */
  const handleConsentDecline = useCallback(() => {
    setShowConsent(false);
  }, []);

  if (!supported) return null;

  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`flex-shrink-0 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse shadow-md'
            : permState === 'denied'
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-gray-100 text-gray-400 hover:bg-teal-50 hover:text-teal-600 active:scale-90'
        } ${size === 'sm' ? 'p-1.5' : 'p-2'} ${className}`}
        title={
          permState === 'denied'
            ? 'הגישה למיקרופון נדחתה'
            : isListening
              ? 'לחץ לעצור'
              : 'לחץ לדיבור'
        }
      >
        {permState === 'requesting' ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : isListening ? (
          <MicOff size={iconSize} />
        ) : (
          <Mic size={iconSize} />
        )}
      </button>

      {/* ── Consent prompt (first-time only) ── */}
      {showConsent && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-[2px]" onClick={handleConsentDecline}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center relative"
            dir="rtl"
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={handleConsentDecline}
              className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>

            {/* Mic icon */}
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <Mic size={28} className="text-teal-600" />
            </div>

            <h3 className="font-bold text-lg text-[#1e3a5f] mb-2">הפעלת מיקרופון</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              AutoLog משתמש במיקרופון כדי להמיר דיבור לטקסט — במקום להקליד, פשוט תדבר.
              <br />
              <span className="text-gray-400 text-xs mt-1 block">ההקלטה לא נשמרת ומשמשת רק למילוי השדה.</span>
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleConsentApprove}
                className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition-colors shadow-sm"
              >
                אשר והפעל
              </button>
              <button
                onClick={handleConsentDecline}
                className="w-full py-2.5 rounded-xl text-gray-400 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                לא עכשיו
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
