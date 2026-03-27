'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  dir?: string;
  lang?: string;
}

export default function VoiceInput({
  value,
  onChange,
  placeholder,
  rows = 2,
  className = '',
  dir = 'rtl',
  lang = 'he-IL',
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [supported, setSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef<any>(null);
  const valueRef = useRef(value);

  // Keep ref in sync
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setErrorMsg('');

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: { results: { [index: number]: { [index: number]: { transcript: string } } }; resultIndex: number }) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        const separator = valueRef.current && !valueRef.current.endsWith(' ') && !valueRef.current.endsWith('\n') ? ' ' : '';
        const newValue = valueRef.current + separator + final;
        onChange(newValue);
        setInterimText('');
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === 'not-allowed') {
        setErrorMsg('יש לאשר גישה למיקרופון');
      } else if (event.error === 'network') {
        setErrorMsg('שגיאת רשת - נסה שוב');
      } else if (event.error !== 'no-speech') {
        setErrorMsg('שגיאה בזיהוי דיבור');
      }
      if (event.error !== 'no-speech') {
        setIsListening(false);
        setInterimText('');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [lang, onChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (!supported) {
    // Fallback: just render a plain textarea
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-xl border border-gray-300 p-3 text-sm ${className}`}
        dir={dir}
      />
    );
  }

  return (
    <div className="relative">
      <textarea
        value={value + (interimText ? (value ? ' ' : '') + interimText : '')}
        onChange={e => {
          // If user edits while interim text showing, commit what's there
          setInterimText('');
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-xl border ${isListening ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'} p-3 ps-12 text-sm transition-all ${className}`}
        dir={dir}
      />
      <button
        type="button"
        onClick={toggleListening}
        className={`absolute start-2 top-2 p-2 rounded-lg transition-all ${
          isListening
            ? 'bg-red-500 text-white shadow-lg animate-pulse hover:bg-red-600'
            : 'bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-600'
        }`}
        title={isListening ? 'עצור הקלטה' : 'הקלט הערה קולית'}
        aria-label={isListening ? 'עצור הקלטה' : 'הקלט הערה קולית'}
      >
        {isListening ? <Square size={16} /> : <Mic size={16} />}
      </button>
      {isListening && (
        <div className="absolute start-2 bottom-2 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-red-500 font-medium">מקליט...</span>
        </div>
      )}
      {errorMsg && !isListening && (
        <div className="text-xs text-red-500 mt-1 text-right">{errorMsg}</div>
      )}
    </div>
  );
}
