'use client';

import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronUp, CheckCircle, Database, Search, Activity, BookOpen, UserCheck } from 'lucide-react';

interface ToolInvocation {
  toolName: string;
  toolCallId?: string;
  state?: 'pending' | 'result' | 'partial-call' | 'call';
  args?: any;
  result?: any;
}

interface AgentTraceProps {
  toolInvocations?: ToolInvocation[];
}

const toolIcons: Record<string, any> = {
  getReport: Database,
  checkRanges: Activity,
  searchGuideline: BookOpen,
  getHistory: Search,
  createRecommendation: UserCheck,
};

const toolLabels: Record<string, string> = {
  getReport: 'Report Lab Values Extracted',
  checkRanges: 'Deterministic Range Engine Executed',
  searchGuideline: 'Vector RAG Guidelines Retrieved',
  getHistory: 'Longitudinal Patient History Queried',
  createRecommendation: 'Clinical Action Plan Generated',
};

export function AgentTrace({ toolInvocations }: AgentTraceProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!toolInvocations || toolInvocations.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-200/80">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-blue-600" />
          <span>Agent Autonomous Reasoning ({toolInvocations.length} tools executed)</span>
        </span>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
          {toolInvocations.map((inv, idx) => {
            const Icon = toolIcons[inv.toolName] || Cpu;
            const label = toolLabels[inv.toolName] || inv.toolName;

            return (
              <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">{label}</span>
                      <span className="text-[10px] text-slate-400 ml-2 font-mono">{inv.toolName}()</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle className="h-2.5 w-2.5" />
                    Success
                  </span>
                </div>

                {/* Arguments & Result display */}
                {inv.args && (
                  <div className="mt-2 pt-2 border-t border-slate-100 font-mono text-[10px] text-slate-600 bg-slate-50/80 p-1.5 rounded overflow-x-auto max-h-24">
                    <span className="text-slate-400 uppercase tracking-wider block font-sans text-[9px] mb-0.5">Parameters:</span>
                    {JSON.stringify(inv.args, null, 2)}
                  </div>
                )}

                {inv.result && (
                  <div className="mt-1 font-mono text-[10px] text-slate-600 bg-blue-50/40 p-1.5 rounded border border-blue-100/50 overflow-x-auto max-h-28">
                    <span className="text-blue-500 uppercase tracking-wider block font-sans text-[9px] mb-0.5">Tool Output:</span>
                    {JSON.stringify(inv.result, null, 2)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
