'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { UploadZone } from '@/components/UploadZone';
import { ReportCard } from '@/components/ReportCard';
import { TrendChart } from '@/components/TrendChart';
import { ChatPanel } from '@/components/ChatPanel';
import { RecommendationCard } from '@/components/RecommendationCard';
import { DEMO_PATIENTS, DEMO_REPORTS } from '@/lib/demoData';
import { Patient, Report, Recommendation } from '@/lib/supabase';
import { FileText, Stethoscope } from 'lucide-react';

export default function Home() {
  const [currentPatient, setCurrentPatient] = useState<Patient>(DEMO_PATIENTS[0]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Filter reports for the active patient
  const patientReports = DEMO_REPORTS.filter((r) => r.patient_id === currentPatient.id);
  const [activeReport, setActiveReport] = useState<Report>(patientReports[0] || DEMO_REPORTS[0]);
  const [selectedTestForTrend, setSelectedTestForTrend] = useState<string>('HbA1c');

  // Recommendations state
  const [recommendations] = useState<Recommendation[]>([
    {
      id: 'rec-1',
      patient_id: currentPatient.id,
      text: 'HbA1c of 7.2% reflects moderate glycemic elevation above normal limits (<5.6%). Follow-up glycated hemoglobin test recommended in 90 days.',
      urgency: 'follow_up',
      specialist: 'Endocrinologist',
      created_at: new Date('2026-11-10').toISOString(),
    },
    {
      id: 'rec-2',
      patient_id: currentPatient.id,
      text: 'Fasting Blood Glucose 142 mg/dL exceeds target (<100 mg/dL). Adopt ADA lifestyle recommendations: 150 mins weekly aerobic activity and lower carbohydrate density.',
      urgency: 'info',
      specialist: 'Clinical Nutritionist',
      created_at: new Date('2026-11-10').toISOString(),
    },
  ]);

  // Handle patient switch
  const handleSelectPatient = (patient: Patient) => {
    setCurrentPatient(patient);
    const reports = DEMO_REPORTS.filter((r) => r.patient_id === patient.id);
    const chosen = reports[0] || DEMO_REPORTS[0];
    setActiveReport(chosen);
    // Set default trend test depending on patient condition
    if (patient.id.includes('0002')) {
      setSelectedTestForTrend('LDL');
    } else {
      setSelectedTestForTrend('HbA1c');
    }
  };

  // Handle newly uploaded or preset report
  const handleReportLoaded = (newReport: Report) => {
    setActiveReport(newReport);
    if (newReport.values && newReport.values.length > 0) {
      setSelectedTestForTrend(newReport.values[0].test);
    }
  };

  // Extract longitudinal trend data for the selected test
  const trendData = patientReports
    .map((r) => {
      const match = r.values.find(
        (v) =>
          v.test.toLowerCase() === selectedTestForTrend.toLowerCase() ||
          v.test.toLowerCase().includes(selectedTestForTrend.toLowerCase())
      );
      return match
        ? {
            date: r.uploaded_at,
            value: match.value,
            unit: match.unit,
          }
        : null;
    })
    .filter((d): d is { date: string; value: number; unit: string } => d !== null);

  const activeUnit =
    activeReport.values.find(
      (v) =>
        v.test.toLowerCase() === selectedTestForTrend.toLowerCase() ||
        v.test.toLowerCase().includes(selectedTestForTrend.toLowerCase())
    )?.unit || '';

  // Stats calculation
  const totalTests = activeReport.values.length;
  const criticalCount = activeReport.flags.filter((f) => f.severity === 'critical').length;
  const highCount = activeReport.flags.filter((f) => f.status === 'high').length;
  const normalCount = activeReport.flags.filter((f) => f.status === 'normal').length;

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col text-slate-900">
      <Navbar
        currentPatient={currentPatient}
        onSelectPatient={handleSelectPatient}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Patient Clinical Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-lg">
                {currentPatient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                    {currentPatient.name}
                  </h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                    {currentPatient.age} yrs • {currentPatient.gender === 'M' ? 'Male' : 'Female'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono">
                    ID: {currentPatient.id.substring(0, 8)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>Phone: {currentPatient.phone}</span>
                  <span>•</span>
                  <span>Active Report: <strong className="text-slate-700">{activeReport.type}</strong></span>
                  <span>•</span>
                  <span>Dated: {new Date(activeReport.uploaded_at).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2.5">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-medium">Total Tests</div>
                <div className="text-base font-bold text-slate-900">{totalTests}</div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-xs text-emerald-700 font-medium">In Range</div>
                <div className="text-base font-bold text-emerald-800">{normalCount}</div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-xs text-amber-700 font-medium">Elevated</div>
                <div className="text-base font-bold text-amber-800">{highCount}</div>
              </div>

              {criticalCount > 0 && (
                <div className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-center animate-pulse">
                  <div className="text-xs text-red-700 font-medium">Critical</div>
                  <div className="text-base font-bold text-red-800">{criticalCount}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Clinical Reports, Trends & Upload (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Upload Zone */}
            <UploadZone
              patientId={currentPatient.id}
              onReportLoaded={handleReportLoaded}
            />

            {/* Active Report Structured Lab Cards */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Lab Test Biomarkers ({activeReport.type})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Validated by deterministic reference range engine. Click any card to graph its historical trajectory.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Verified Engine
                </span>
              </div>

              <ReportCard
                values={activeReport.values}
                flags={activeReport.flags}
                onSelectTest={(test) => setSelectedTestForTrend(test)}
              />
            </div>

            {/* Longitudinal Trend Analysis Chart */}
            <TrendChart
              testName={selectedTestForTrend}
              data={trendData}
              unit={activeUnit}
            />

            {/* Actionable Clinical Recommendations */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-blue-600" />
                    <span>Specialist Referrals & Action Plans</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Autonomous recommendations synthesized by agent based on verified clinical guidelines
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Voice-Native Conversational Agent (5 cols) */}
          <div className="lg:col-span-5 sticky top-20">
            <ChatPanel
              patientId={currentPatient.id}
              activeReport={activeReport}
              voiceEnabled={voiceEnabled}
            />
          </div>
        </div>
      </main>

      {/* Clinical Disclaimer Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed">
            <strong>Medical Disclaimer:</strong> MediTalk is an artificial intelligence health explainer and clinical decision support system designed for patient health literacy. It does not provide medical diagnoses or replace consultations with licensed physicians. Always consult a healthcare specialist regarding diagnostic lab results.
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Built with Next.js 15 App Router • Gemini 3.5 Flash-Lite • Vercel AI SDK • Supabase pgvector RAG • Web Speech API
          </p>
        </div>
      </footer>
    </div>
  );
}
