'use client';

export class VoiceAssistant {
  private static synth: SpeechSynthesis | null = null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  public static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  public static speak(text: string, onEnd?: () => void, lang: string = 'en-IN') {
    if (!this.isSpeechSynthesisSupported()) return;

    // Stop ongoing speech
    this.stop();

    // Clean text of markdown
    const cleanText = text
      .replace(/[*_#`[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/mg\/dL/gi, ' milligrams per deciliter')
      .replace(/g\/dL/gi, ' grams per deciliter')
      .replace(/HbA1c/gi, 'H B A 1 C')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; // Slightly measured rate for medical clarity
    utterance.pitch = 1.0;
    utterance.lang = lang;

    // Detect if Indian English or Hindi voice is available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang === lang || (lang.startsWith('hi') && v.lang.includes('hi')) || (lang.startsWith('en') && (v.lang.includes('IN') || v.lang.includes('GB')))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Speech error:', e);
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public static stop() {
    if (this.isSpeechSynthesisSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public static isSpeaking(): boolean {
    return !!(this.isSpeechSynthesisSupported() && window.speechSynthesis.speaking);
  }
}
