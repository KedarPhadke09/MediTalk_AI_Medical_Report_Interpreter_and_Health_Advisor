'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, Loader2, Sparkles, FileImage } from 'lucide-react';
import { Report } from '@/lib/supabase';
import { DEMO_REPORTS } from '@/lib/demoData';

interface UploadZoneProps {
  patientId: string;
  onReportLoaded: (report: Report, patient?: any) => void;
}

export function UploadZone({ patientId, onReportLoaded }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      formData.append('type', file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to parse file');
      }

      const newReport: Report = {
        id: data.reportId,
        patient_id: data.patient?.id || patientId,
        type: data.type,
        file_url: data.fileUrl,
        values: data.values,
        flags: data.flags,
        uploaded_at: new Date().toISOString(),
      };

      onReportLoaded(newReport, data.patient);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg(err.message || 'Error processing document');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const loadPreset = (index: number) => {
    const preset = DEMO_REPORTS[index] || DEMO_REPORTS[0];
    onReportLoaded(preset);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Upload Diagnostic Report</h2>
          <p className="text-xs text-slate-500">Supports PDF lab reports, clinic slips, and scanned medical images</p>
        </div>
        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
          PDF & Multi-Modal Vision
        </span>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
            : 'border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-slate-50'
        } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center">
          <div className="h-11 w-11 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center mb-2.5">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <UploadCloud className="h-5 w-5" />
            )}
          </div>

          <p className="text-xs font-semibold text-slate-800">
            {uploading ? 'Extracting Lab Values & Verifying Baselines...' : 'Drop medical report PDF or Image here'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            or <span className="text-blue-600 underline font-medium">browse files</span> from your computer
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick 1-Click Demo Buttons for Viva/Evaluation */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Instant Demo Presets:
          </span>
          <span className="text-[10px] text-slate-400">1-click test reports</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => loadPreset(0)}
            className="text-left p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-200 transition-all text-xs"
          >
            <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              Diabetic Panel (Nov &apos;26)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              HbA1c 7.2% | Glucose 142
            </div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset(1)}
            className="text-left p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-200 transition-all text-xs"
          >
            <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-emerald-600" />
              Previous Baseline (Aug &apos;26)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              HbA1c 6.8% | Glucose 128
            </div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset(2)}
            className="text-left p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-200 transition-all text-xs"
          >
            <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
              <FileImage className="h-3.5 w-3.5 text-amber-600" />
              Lipid Profile (Nov &apos;26)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              LDL 165 | HDL 32 | Chol 245
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
