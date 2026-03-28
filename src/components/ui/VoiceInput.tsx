'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export default function VoiceInput({ value, onChange, placeholder, rows = 3, className = '', disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [supported, setSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'requesting'>('unknown');
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'he-IL';
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      let interim = '';
      let final_ = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final_ += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final_) {
        onChange(value + (value ? ' ' : '') + final_);
        setInterimText('');
      } else {
        setInterimText(interim);
      }
    };

    rec.onerror = (event: any) => {
      setIsListening(false);
      setInterimText('');
      if (event.error === 'not-allowed') {
        setPermissionState('denied');
        setErrorMsg('הגישה למיקרופון נדחתה. יש לאשר בהגדרות הדפדפן');
      } else if (event.error === 'network') {
        setErrorMsg('שגיאת רשת. בדוק חיבור לאינטרנט');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setErrorMsg('שגיאה בזיהוי קולי. נסה שוב');
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = rec;

    return () => {
      try { rec.stop(); } catch(e) {}
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Update value ref for callback
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current || disabled) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    setErrorMsg('');

    // Request mic permission via getUserMedia first
    // This triggers the browser permission dialog on mobile
    try {
      setPermissionState('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Store stream ref to stop tracks later
      streamRef.current = stream;
      setPermissionState('granted');
      // Now start speech recognition
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Already started - stop and restart
        recognitionRef.current.stop();
        setTimeout(() => {
          try { recognitionRef.current.start(); setIsListening(true); } catch(e2) {}
        }, 100);
      }
    } catch (err: any) {
      setPermissionState('denied');
      setErrorMsg('יש לאשר גישה למיקרופון בהגדרות הדפדפן');
    }
  }, [isListening, disabled]);

  if (!supported) {
    return (
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={"w-full p-3 border rounded-lg resize-none text-right " + className}
          dir="rtl"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <textarea
        value={interimText ? value + (value ? ' ' : '') + interimText : value}
        onChange={(e) => { if (!isListening) onChange(e.target.value); }}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled || isListening}
        className={"w-full p-3 pr-12 border rounded-lg resize-none text-right " + (isListening ? 'border-red-400 bg-red-50 ' : '') + className}
        dir="rtl"
      />

      {/* Mic button */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={"absolute top-3 left-3 p-2 rounded-full transition-all " + (
          isListening
            ? 'bg-red-500 text-white animate-pulse shadow-lg'
            : permissionState === 'denied'
              ? 'bg-gray-200 text-gray-400'
              : 'bg-gray-100 text-gray-500 hover:bg-teal-100 hover:text-teal-600'
        )}
        title={isListening ? 'לחץ לעצור' : 'לחץ לדיבור'}
      >
        {permissionState === 'requesting' ? (
          <Loader2 size={20} className="animate-spin" />
        ) : isListening ? (
          <MicOff size={20} />
        ) : (
          <Mic size={20} />
        )}
      </button>

      {/* Status messages */}
      {isListening && (
        <p className="text-xs text-red-500 mt-1 text-right animate-pulse">
          🎤 מאזין... לחץ שוב לעצור
        </p>
      )}
      {errorMsg && !isListening && (
        <p className="text-xs text-red-500 mt-1 text-right">{errorMsg}</p>
      )}
    </div>
  );
}
