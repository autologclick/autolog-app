'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

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

/**
 * Compact microphone button for speech-to-text.
 * Place it next to any <input> or <textarea> — it appends spoken text to the current value.
 * Uses Web Speech API (he-IL) with proper permission handling for mobile.
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
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const valueRef = useRef(value);

  useEffect(() => { valueRef.current = value; }, [value]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    const rec = new SR();
    rec.lang = 'he-IL';
    rec.interimResults = false; // Only final results for compact mode
    rec.continuous = false;     // Single utterance
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
        onResult(cur + (cur ? ' ' : '') + transcript);
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
      // Stop mic stream to release indicator
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

  const toggle = useCallback(async () => {
    if (!recognitionRef.current || disabled) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

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
  }, [isListening, disabled]);

  if (!supported) return null;

  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || permState === 'denied'}
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
  );
}
