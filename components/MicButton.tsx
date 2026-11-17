'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface MicButtonProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
}

export function MicButton({ onTranscript, disabled }: MicButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. For voice input, please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      // Set to Indian English / Hindi multilingual recognition
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          onTranscript(transcript.trim());
        }
        setListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setListening(false);
    }
  }, [listening, onTranscript]);

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        title="Speech recognition not supported in this browser. Please use Chrome."
        className="h-11 w-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center cursor-not-allowed"
      >
        <MicOff className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      {listening && (
        <>
          <span className="absolute inline-flex h-full w-full rounded-xl bg-red-400 opacity-75 animate-ping" />
          <span className="absolute -top-7 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full whitespace-nowrap animate-bounce">
            Listening... Speak in Hindi or English
          </span>
        </>
      )}
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        title={listening ? 'Stop recording' : 'Tap to speak in Hindi or English'}
        className={`relative z-10 h-11 w-11 rounded-xl flex items-center justify-center transition-all ${
          listening
            ? 'bg-red-600 text-white shadow-md shadow-red-200'
            : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 active:scale-95'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>
    </div>
  );
}
