import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const schemaSql = `
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INT,
  gender TEXT,
  phone TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- REPORTS (structured lab values)
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  file_url TEXT,
  values JSONB NOT NULL,
  flags JSONB,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- GUIDELINES (RAG chunks with embeddings)
CREATE TABLE IF NOT EXISTS guidelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768)
);

-- HNSW index for fast cosine similarity
CREATE INDEX IF NOT EXISTS guidelines_embedding_idx
  ON guidelines USING hnsw (embedding vector_cosine_ops);

-- RECOMMENDATIONS (the advisor output)
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id),
  text TEXT NOT NULL,
  urgency TEXT CHECK (urgency IN ('info', 'follow_up', 'urgent')),
  specialist TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CONVERSATIONS (chat history for context)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'tool')),
  content TEXT NOT NULL,
  tool_calls JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RAG RETRIEVAL FUNCTION
CREATE OR REPLACE FUNCTION match_guidelines(
  query_vec vector(768),
  match_count INT DEFAULT 5
) RETURNS TABLE(
  id UUID, title TEXT, source TEXT, content TEXT, similarity FLOAT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.title, g.source, g.content,
         1 - (g.embedding <=> query_vec) AS similarity
  FROM guidelines g
  WHERE g.embedding IS NOT NULL
    AND 1 - (g.embedding <=> query_vec) > 0.40
  ORDER BY g.embedding <=> query_vec
  LIMIT match_count;
END;
$$;

-- SEED PATIENTS
INSERT INTO patients (id, name, age, gender, phone) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Rajesh Kumar', 52, 'M', '+91-9876543210'),
  ('a0000000-0000-0000-0000-000000000002', 'Priya Sharma', 38, 'F', '+91-9123456789')
ON CONFLICT (id) DO NOTHING;

-- SEED REPORTS
INSERT INTO reports (id, patient_id, type, values, flags, uploaded_at) VALUES
  ('b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'blood_test',
   '[{"test":"HbA1c","value":7.2,"unit":"%","range":"4-5.6"},{"test":"Fasting Glucose","value":142,"unit":"mg/dL","range":"70-100"},{"test":"Hemoglobin","value":14.2,"unit":"g/dL","range":"13-17"}]',
   '[{"test":"HbA1c","status":"high","severity":"moderate"},{"test":"Fasting Glucose","status":"high","severity":"moderate"},{"test":"Hemoglobin","status":"normal","severity":"none"}]',
   '2026-11-10'),

  ('b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'blood_test',
   '[{"test":"HbA1c","value":6.8,"unit":"%","range":"4-5.6"},{"test":"Fasting Glucose","value":128,"unit":"mg/dL","range":"70-100"},{"test":"Hemoglobin","value":14.8,"unit":"g/dL","range":"13-17"}]',
   '[{"test":"HbA1c","status":"high","severity":"moderate"},{"test":"Fasting Glucose","status":"high","severity":"moderate"},{"test":"Hemoglobin","status":"normal","severity":"none"}]',
   '2026-08-15'),

  ('b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000002',
   'lipid_profile',
   '[{"test":"LDL","value":165,"unit":"mg/dL","range":"<130"},{"test":"HDL","value":32,"unit":"mg/dL","range":">40"},{"test":"Total Cholesterol","value":245,"unit":"mg/dL","range":"<200"}]',
   '[{"test":"LDL","status":"high","severity":"moderate"},{"test":"HDL","status":"low","severity":"moderate"},{"test":"Total Cholesterol","status":"high","severity":"moderate"}]',
   '2026-11-12')
ON CONFLICT (id) DO NOTHING;
`;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in .env.local');
  }

  console.log('Connecting to Supabase PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected successfully. Applying schema and initial seed data...');
  await client.query(schemaSql);
  console.log('Schema, extensions, tables, indexes, and seed patients/reports created successfully!');
  await client.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
