'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldAlert, Stethoscope } from 'lucide-react';
import { LabValue, LabFlag } from '@/lib/supabase';
import { REFERENCE_RANGES } from '@/lib/ranges';

interface ReportCardProps {
  values: LabValue[];
  flags: LabFlag[];
  onSelectTest?: (testName: string) => void;
}

export function ReportCard({ values, flags, onSelectTest }: ReportCardProps) {
  if (!values || values.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 text-sm">
        No lab values recorded in this report.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {values.map((v, i) => {
        const flag = flags.find(
          (f) => f.test.toLowerCase() === v.test.toLowerCase() ||
                 v.test.toLowerCase().includes(f.test.toLowerCase())
        );
        const status = flag?.status || 'normal';
        const severity = flag?.severity || 'none';
        const refRangeObj = Object.values(REFERENCE_RANGES).find(
          (r) => r.test.toLowerCase() === v.test.toLowerCase() ||
                 v.test.toLowerCase().includes(r.test.toLowerCase())
        );

        // Styling variants
        let cardBg = 'bg-white border-slate-200';
        let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
        let Icon = CheckCircle2;
        let iconColor = 'text-slate-500';
        let valColor = 'text-slate-900';

        if (status === 'critical' || severity === 'critical') {
          cardBg = 'bg-red-50/50 border-red-200 ring-1 ring-red-200';
          badgeBg = 'bg-red-100 text-red-800 border-red-200 font-semibold';
          Icon = ShieldAlert;
          iconColor = 'text-red-600';
          valColor = 'text-red-950 font-bold';
        } else if (status === 'high') {
          cardBg = 'bg-amber-50/40 border-amber-200';
          badgeBg = 'bg-amber-100 text-amber-900 border-amber-200';
          Icon = AlertTriangle;
          iconColor = 'text-amber-600';
          valColor = 'text-amber-950';
        } else if (status === 'low') {
          cardBg = 'bg-sky-50/40 border-sky-200';
          badgeBg = 'bg-sky-100 text-sky-900 border-sky-200';
          Icon = AlertCircle;
          iconColor = 'text-sky-600';
          valColor = 'text-sky-950';
        } else if (status === 'normal') {
          cardBg = 'bg-emerald-50/20 border-emerald-200/80';
          badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-600';
          valColor = 'text-slate-900';
        }

        // Relative progress meter
        let percent = 50;
        if (refRangeObj) {
          const lower = refRangeObj.lower;
          const upper = refRangeObj.upper;
          const span = upper - lower || 1;
          const pos = ((v.value - lower) / span) * 100;
          percent = Math.max(5, Math.min(95, pos));
        }

        return (
          <div
            key={i}
            onClick={() => onSelectTest && onSelectTest(v.test)}
            className={`rounded-xl border p-4 transition-all duration-150 hover:shadow-md cursor-pointer ${cardBg}`}
          >
            {/* Header: Test Name & Status Badge */}
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-sm text-slate-800 tracking-tight leading-snug">
                {v.test}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeBg}`}
              >
                <Icon className={`h-3 w-3 ${iconColor}`} />
                {status}
              </span>
            </div>

            {/* Measured Value */}
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tracking-tight ${valColor}`}>
                {v.value}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {v.unit}
              </span>
            </div>

            {/* Reference Range Indicator */}
            <div className="mt-2.5">
              <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1">
                <span>Ref: {v.range || (refRangeObj ? `${refRangeObj.lower} - ${refRangeObj.upper}` : 'Standard')}</span>
                {refRangeObj?.specialist && (
                  <span className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    <Stethoscope className="h-2.5 w-2.5" />
                    {refRangeObj.specialist}
                  </span>
                )}
              </div>

              {/* Range bar visual */}
              <div className="relative h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    status === 'critical'
                      ? 'bg-red-500'
                      : status === 'high'
                      ? 'bg-amber-500'
                      : status === 'low'
                      ? 'bg-sky-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
