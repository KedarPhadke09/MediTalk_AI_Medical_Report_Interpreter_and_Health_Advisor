'use client';

import React from 'react';
import { Activity, ShieldCheck, User, Volume2, VolumeX } from 'lucide-react';
import { Patient } from '@/lib/supabase';

interface NavbarProps {
  currentPatient: Patient;
  patientsList?: Patient[];
  onSelectPatient: (patient: Patient) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export function Navbar({
  currentPatient,
  patientsList = [],
  onSelectPatient,
  voiceEnabled,
  onToggleVoice,
}: NavbarProps) {
  const displayList = patientsList.length > 0 ? patientsList : [currentPatient];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-200">
            <Activity className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">MediTalk</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Clinical AI
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Voice-First Medical Report Interpreter & Health Advisor
            </p>
          </div>
        </div>

        {/* Center: Safety Engine Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Zero-Hallucination Deterministic Engine: Active</span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Patient Switcher */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <User className="h-4 w-4 text-slate-500 ml-1.5" />
            <select
              value={currentPatient.id}
              onChange={(e) => {
                const found = displayList.find((p) => p.id === e.target.value);
                if (found) onSelectPatient(found);
              }}
              className="text-xs font-medium bg-transparent text-slate-800 border-none focus:outline-none focus:ring-0 pr-2 cursor-pointer max-w-[180px] truncate"
            >
              {displayList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age}y, {p.gender})
                </option>
              ))}
            </select>
          </div>

          {/* Voice Output Toggle */}
          <button
            onClick={onToggleVoice}
            title={voiceEnabled ? 'Mute AI voice output' : 'Enable AI voice output'}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              voiceEnabled
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-blue-600 animate-pulse" />
                <span className="hidden sm:inline">Voice On</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-slate-400" />
                <span className="hidden sm:inline">Voice Off</span>
              </>
            )}
          </button>

          {/* GitHub Repository Link */}
          <a
            href="https://github.com/KedarPhadke09/MediTalk_AI_Medical_Report_Interpreter_and_Health_Advisor"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="GitHub Repository"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
