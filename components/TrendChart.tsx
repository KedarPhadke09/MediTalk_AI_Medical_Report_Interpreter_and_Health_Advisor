'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { REFERENCE_RANGES } from '@/lib/ranges';

interface TrendPoint {
  date: string;
  value: number;
  label?: string;
}

interface TrendChartProps {
  testName: string;
  data: TrendPoint[];
  unit: string;
}

export function TrendChart({ testName, data, unit }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
        Select a test to view historical progression over time.
      </div>
    );
  }

  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const formattedData = sortedData.map((d) => ({
    ...d,
    formattedDate: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    }),
  }));

  const refRange = Object.values(REFERENCE_RANGES).find(
    (r) => r.test.toLowerCase() === testName.toLowerCase() ||
           testName.toLowerCase().includes(r.test.toLowerCase())
  );

  const firstVal = sortedData[0]?.value;
  const lastVal = sortedData[sortedData.length - 1]?.value;
  const diff = Number((lastVal - firstVal).toFixed(2));
  const isWorsening =
    testName.toLowerCase().includes('hdl') ? diff < 0 : diff > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">{testName} Trajectory</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {data.length} records tracked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Biomarker longitudinal trend across historical diagnostic reports
          </p>
        </div>

        {/* Delta Badge */}
        {data.length > 1 && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
              isWorsening
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {diff > 0 ? (
              <TrendingUp className="h-4 w-4 text-amber-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-emerald-600" />
            )}
            <span>
              {diff > 0 ? `+${diff}` : diff} {unit} ({firstVal} &rarr; {lastVal})
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-56 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="formattedDate"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit={` ${unit}`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                      <div className="font-semibold">{p.formattedDate}</div>
                      <div className="text-blue-300 font-bold mt-0.5">
                        {p.value} {unit}
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        {new Date(p.date).toDateString()}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {refRange && (
              <ReferenceLine
                y={refRange.upper}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: `Normal Max (${refRange.upper})`,
                  position: 'top',
                  fill: '#d97706',
                  fontSize: 10,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#1d4ed8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Clinical Reference Context */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Historical timeline</span>
        </span>
        {refRange && (
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            Standard Target: {refRange.lower} - {refRange.upper} {refRange.unit}
          </span>
        )}
      </div>
    </div>
  );
}
