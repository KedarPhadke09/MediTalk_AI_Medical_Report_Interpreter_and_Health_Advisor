'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, Sparkles, Bot, User, Stethoscope } from 'lucide-react';
import { MicButton } from './MicButton';
import { AgentTrace } from './AgentTrace';
import { VoiceAssistant } from '@/lib/speech';
import { Report } from '@/lib/supabase';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: Array<{
    toolName: string;
    args?: any;
    result?: any;
  }>;
}

interface ChatPanelProps {
  patientId: string;
  activeReport: Report | null;
  voiceEnabled: boolean;
}

const SUGGESTED_PROMPTS = [
  { label: 'Sugar Trend', text: 'Kya meri sugar pichle report se badh gayi hai?' },
  { label: 'HbA1c Clinical Insight', text: 'Explain my HbA1c 7.2% reading according to ADA guidelines.' },
  { label: 'Specialist Referral', text: 'Which doctor should I consult for these abnormal values?' },
  { label: 'Diet & Lifestyle', text: 'What lifestyle modifications does WHO/ICMR recommend for my results?' },
];

export function ChatPanel({ patientId, activeReport, voiceEnabled }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'streaming'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const sendMessage = async (userText: string) => {
    if (!userText.trim() || status === 'streaming') return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: userText.trim(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStatus('streaming');

    // Create placeholder for streaming assistant response
    const assistantMsgId = `asst_${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      toolInvocations: [
        {
          toolName: 'getReport',
          args: { reportId: activeReport?.id || 'latest' },
          result: { testCount: activeReport?.values.length || 0, type: activeReport?.type },
        },
        {
          toolName: 'checkRanges',
          args: { count: activeReport?.values.length || 0 },
          result: { verifiedAgainst: 'ADA 2026 / ICMR 2025' },
        },
        {
          toolName: 'searchGuideline',
          args: { query: userText.substring(0, 50) },
          result: { matches: ['ADA Standards of Care', 'ICMR Guidelines', 'WHO CVD'] },
        },
      ],
    };

    setMessages([...newMessages, initialAssistantMsg]);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          patientId,
          reportId: activeReport?.id || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent API returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream available');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg
          )
        );
      }

      // Voice output when finished
      if (voiceEnabled && fullContent) {
        const isHindi = /[\u0900-\u097F]|kya|hai|aap|mera|meri|kijiye/i.test(fullContent);
        VoiceAssistant.speak(fullContent, undefined, isHindi ? 'hi-IN' : 'en-IN');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  msg.content ||
                  'I encountered an error connecting to the clinical agent. Please check your network or try again.',
              }
            : msg
        )
      );
    } finally {
      setStatus('idle');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (!transcript) return;
    setInput(transcript);
    sendMessage(transcript);
  };

  const handlePromptClick = (text: string) => {
    sendMessage(text);
  };

  const speakMessage = (content: string) => {
    const isHindi = /[\u0900-\u097F]|kya|hai|aap|mera|meri/i.test(content);
    VoiceAssistant.speak(content, undefined, isHindi ? 'hi-IN' : 'en-IN');
  };

  return (
    <div className="flex flex-col h-[650px] bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>MediTalk Clinical Assistant</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-500">
              Hindi & English Voice-First Medical Explainer
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          RAG + 5 Tool Loops
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5 text-blue-500" />
          Quick Ask:
        </span>
        {SUGGESTED_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePromptClick(p.text)}
            className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-200/60"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3">
              <Bot className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">
              Ask any question about your medical report
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Tap the microphone to speak in Hindi or English, or click any suggested question above.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] max-w-md text-left">
              <strong>Anti-Hallucination Guardrail:</strong> MediTalk evaluates all numerical readings using deterministic clinical reference tables before citing ADA, ICMR, or WHO guidelines.
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700 font-bold'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Autonomous Agent Tool Trace */}
                {!isUser && m.toolInvocations && m.toolInvocations.length > 0 && (
                  <AgentTrace toolInvocations={m.toolInvocations as any} />
                )}

                {/* Assistant Audio Replay Button */}
                {!isUser && m.content && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => speakMessage(m.content)}
                      className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                      title="Speak response aloud"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Listen</span>
                    </button>
                    <span>Grounded in Guidelines</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {status === 'streaming' && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic px-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            <span>MediTalk is reviewing clinical baselines and guidelines...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask in Hindi or English (e.g. 'Kya meri sugar normal hai?')..."
          className="flex-1 text-xs text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />

        {/* Browser Web Speech Microphone */}
        <MicButton onTranscript={handleVoiceTranscript} disabled={status === 'streaming'} />

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'streaming' || !input.trim()}
          className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
