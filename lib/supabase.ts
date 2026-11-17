import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Browser client (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client (service role key with custom headers to prevent browser restriction warnings)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'User-Agent': 'supabase-node/2.0',
    },
  },
});

// Types
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  created_at: string;
}

export interface LabValue {
  test: string;
  value: number;
  unit: string;
  range: string;
}

export interface LabFlag {
  test: string;
  status: 'normal' | 'low' | 'high' | 'critical' | 'unknown';
  severity: 'none' | 'moderate' | 'critical';
}

export interface Report {
  id: string;
  patient_id: string;
  type: string;
  file_url?: string;
  values: LabValue[];
  flags: LabFlag[];
  uploaded_at: string;
}

export interface Recommendation {
  id: string;
  patient_id: string;
  report_id?: string;
  text: string;
  urgency: 'info' | 'follow_up' | 'urgent';
  specialist?: string;
  created_at: string;
}

export interface Guideline {
  id: string;
  title: string;
  source: string;
  content: string;
  similarity?: number;
}
