'use client';

import React from 'react';
import { AlertOctagon, CalendarClock, Info, Stethoscope, ChevronRight } from 'lucide-react';
import { Recommendation } from '@/lib/supabase';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { urgency, text, specialist, created_at } = recommendation;

  let badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';
  let Icon = Info;
  let urgencyLabel = 'General Information';

  if (urgency === 'urgent') {
    badgeStyle = 'bg-red-50 text-red-800 border-red-200 font-bold';
    Icon = AlertOctagon;
    urgencyLabel = 'Urgent Physician Review';
  } else if (urgency === 'follow_up') {
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
    Icon = CalendarClock;
    urgencyLabel = 'Clinical Follow-Up Advised';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${badgeStyle}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {urgencyLabel}
        </span>

        {specialist && (
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
            <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
            {specialist}
          </span>
        )}
      </div>

      <p className="text-sm text-slate-800 leading-relaxed font-normal">
        {text}
      </p>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Recorded: {new Date(created_at).toLocaleDateString()}</span>
        <span className="text-blue-600 font-medium flex items-center gap-0.5 cursor-pointer hover:underline">
          View Guidelines <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
