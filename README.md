# MediTalk — AI Medical Report Interpreter & Health Advisor

> **Voice-first, agentic, RAG-powered medical report explainer with longitudinal biomarker tracking and zero-hallucination deterministic validation.**

[![Next.js 15](https://img.shields.io/badge/Next.js-15_App_Router-black?logo=next.js)](https://nextjs.org/)
[![Vercel AI SDK 7](https://img.shields.io/badge/AI_SDK-v7-000000?logo=vercel)](https://sdk.vercel.ai/)
[![Google Gemini](https://img.shields.io/badge/LLM-Gemini_3.5_Flash--Lite-4285F4?logo=google)](https://aistudio.google.com/)
[![Supabase pgvector](https://img.shields.io/badge/Vector_DB-Supabase_pgvector-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind_CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🏥 Problem Statement

In India and across the developing world, **over 46% of patients cannot interpret their diagnostic lab reports** (CBC, Glycated Hemoglobin, Lipid Profiles, Liver Function Tests, Thyroid Panels).
When confronted with dense lab abbreviations and numerical values:
1. Patients frequently **panic over clinically benign fluctuations**, overwhelming emergency rooms and OPDs.
2. Conversely, they often **disregard subtle, dangerous trends** (e.g., an HbA1c creeping from 6.2% to 7.2% over 6 months) until irreversible complications develop.
3. Existing AI solutions either hallucinate fake medical thresholds or act as one-shot chatbots with no historical memory, no longitudinal trend analysis, and no multi-modal voice accessibility.

**MediTalk** bridges this critical healthcare gap by providing a voice-native, agentic assistant that explains reports in plain Hindi and English, cross-references verified guidelines (ADA, ICMR, WHO, KDIGO), tracks health trajectories over time, and recommends the appropriate medical specialist — **grounded in a zero-hallucination deterministic safety engine**.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CLIENT / BROWSER RUNTIME                          │
│                                                                        │
│   ┌──────────────────┐   ┌───────────────────┐   ┌──────────────────┐  │
│   │  Web Speech STT  │   │  shadcn/ui Chat   │   │  Recharts Trends │  │
│   │  (Hindi/English) │   │  (useChat AI SDK) │   │  & Lab Cards     │  │
│   └────────┬─────────┘   └─────────┬─────────┘   └────────┬─────────┘  │
└────────────┼───────────────────────┼──────────────────────┼────────────┘
             │                       │                      │
             ▼                       ▼                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     VERCEL SERVERLESS RUNTIME                          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  /api/agent (Autonomous ToolLoopAgent - up to 6 iterations)    │   │
│   │                                                                │   │
│   │   [getReport] ──► [checkRanges] ──► [searchGuideline (RAG)]    │   │
│   │         ▲                 │                      ▲             │   │
│   │         │                 ▼                      │             │   │
│   │   [getHistory] ──► [createRecommendation]        │             │   │
│   └────────┬──────────────────┬──────────────────────┼─────────────┘   │
│            │                  │                      │                 │
│   ┌────────┴─────────┐        │             ┌────────┴─────────────┐   │
│   │  /api/upload     │        │             │  /api/speech         │   │
│   │  (PDF / Vision)  │        │             │  (Multilingual Audio)│   │
│   └──────────────────┘        │             └──────────────────────┘   │
└───────────────────────────────┼────────────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────────────────┐       ┌────────────────────────────────┐
│      SUPABASE POSTGRES        │       │       GOOGLE GEMINI API        │
│                               │       │                                │
│ • patients (demographics)     │       │ • gemini-3.5-flash-lite        │
│ • reports (structured JSONB)  │       │   (Reasoning & Tool Calling)   │
│ • guidelines (vector 3072)    │       │ • gemini-embedding-001         │
│ • recommendations (referrals) │       │   (Semantic RAG Embeddings)    │
│ • conversations (history)     │       │ • Gemini Vision Multimodal     │
└───────────────────────────────┘       └────────────────────────────────┘
```

---

## 🛡️ Anti-Hallucination Layer (Examiner Defense)

Medical AI must have zero tolerance for hallucinations. MediTalk introduces a **deterministic rule engine** (`lib/ranges.ts`) that runs **before** any natural language text can be synthesized:

1. **Deterministic Baseline Check:** All numerical values are evaluated against verified clinical reference intervals (e.g. ADA 2026 for diabetes, ICMR 2025 for lipid and hematology profiles).
2. **Hard-Gated Outputs:** If a patient's fasting glucose is 142 mg/dL, the rule engine stamps it as `status: 'high', severity: 'moderate'`. The LLM is strictly prohibited from altering this flag.
3. **Emergency Escalation:** Any value exceeding critical safety limits (e.g. HbA1c > 9.0%, Hemoglobin < 8.0 g/dL) automatically triggers an emergency warning: *"Please consult a doctor or emergency physician immediately."*
4. **Unknown Test Handling:** If a test is not found in the verified reference dictionary, it returns `status: 'unknown'` and prompts the patient to consult a clinician, rather than guessing.

---

## 🤖 Autonomous Agentic Workflow (`ToolLoopAgent`)

Rather than relying on naive single-prompt generation, MediTalk implements an autonomous tool loop with 5 distinct tools:

| Tool | Purpose | Output |
|------|---------|--------|
| `getReport` | Fetches structured lab metrics from Supabase / verified records | JSON array of tests, units, and values |
| `checkRanges` | Evaluates raw numbers deterministically against medical baselines | Color-coded flags, severity tiers, specialist map |
| `searchGuideline` | Executes cosine similarity search over embedded medical corpus | Verified excerpts and citations (ADA, ICMR, WHO) |
| `getHistory` | Extracts longitudinal historical patient data across past reports | Time-series data points for trajectory graphing |
| `createRecommendation` | Persists actionable clinical care plan with urgency classification | Stored recommendation with specialty referral |

---

## 📊 Comprehensive Reference Ranges

| Biomarker | Reference Range | Unit | Clinical Specialty | Critical Alert Threshold |
|---|---|---|---|---|
| **HbA1c** | 4.0 – 5.6 | % | Endocrinologist | > 9.0% |
| **Fasting Glucose** | 70 – 100 | mg/dL | Endocrinologist | < 50 or > 180 mg/dL |
| **Postprandial Glucose** | 90 – 140 | mg/dL | Endocrinologist | > 250 mg/dL |
| **LDL Cholesterol** | 0 – 130 | mg/dL | Cardiologist | > 190 mg/dL |
| **HDL Cholesterol** | > 40 | mg/dL | Cardiologist | < 30 mg/dL |
| **Total Cholesterol** | 0 – 200 | mg/dL | Cardiologist | > 260 mg/dL |
| **Triglycerides** | 0 – 150 | mg/dL | Cardiologist | > 300 mg/dL |
| **TSH** | 0.4 – 4.0 | mIU/L | Endocrinologist | < 0.1 or > 10.0 mIU/L |
| **Hemoglobin** | 13.0 – 17.0 | g/dL | Hematologist | < 8.0 g/dL |
| **WBC Count** | 4,000 – 11,000 | /µL | Hematologist / GP | < 2,000 or > 30,000 /µL |
| **Platelets** | 150,000 – 450,000 | /µL | Hematologist | < 50,000 /µL |
| **Serum Creatinine** | 0.6 – 1.3 | mg/dL | Nephrologist | > 2.6 mg/dL |
| **eGFR** | > 60 | mL/min | Nephrologist | < 30 mL/min |
| **ALT (SGPT)** | 7 – 56 | U/L | Hepatologist | > 170 U/L |
| **AST (SGOT)** | 10 – 40 | U/L | Hepatologist | > 120 U/L |

---

## ⚡ Tech Stack (100% Free & Open-Source)

- **Frontend & Serverless Framework:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **AI SDK:** Vercel AI SDK 7 (`ai`, `@ai-sdk/google`, `@ai-sdk/react`)
- **Reasoning Model:** Google Gemini 3.5 Flash-Lite (Free tier via Google AI Studio)
- **Vector Embeddings:** Google `gemini-embedding-001` (3072-dimensional embeddings)
- **Vector Database:** Supabase PostgreSQL with `pgvector`
- **Voice Input (STT):** Browser Web Speech API (Multilingual Hindi & English auto-detect)
- **Voice Output (TTS):** Native Web Speech Synthesis with clinical phonetic post-processing
- **Document & OCR Ingestion:** `pdf-parse` + Gemini Multimodal Vision API
- **Data Visualization:** Recharts

---

## 🚀 Quickstart & Setup

### 1. Clone & Install

```bash
git clone https://github.com/KedarPhadke09/MediTalk_AI_Medical_Report_Interpreter_and_Health_Advisor.git
cd MediTalk_AI_Medical_Report_Interpreter_and_Health_Advisor
npm install
```

### 2. Configure Environment Variables

Create `.env.local` using `.env.example`:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Initialize Supabase Database (pgvector)

Open your **Supabase Dashboard $\rightarrow$ SQL Editor** and execute:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INT,
  gender TEXT,
  phone TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  file_url TEXT,
  values JSONB NOT NULL,
  flags JSONB,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guidelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(3072)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id),
  text TEXT NOT NULL,
  urgency TEXT CHECK (urgency IN ('info', 'follow_up', 'urgent')),
  specialist TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'tool')),
  content TEXT NOT NULL,
  tool_calls JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION match_guidelines(
  query_vec vector(3072),
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
  ORDER BY g.embedding <=> query_vec
  LIMIT match_count;
END;
$$;
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to interact with MediTalk.

---

## 🎓 Viva Questions & Answers (Full Marks Guide)

### Q1: Why not rely directly on the LLM to judge normal vs abnormal values?
> **Answer:** Large Language Models are probabilistic next-token predictors and are prone to hallucinations, unit confusion (e.g. confusing mg/dL with mmol/L), and numerical drift. In healthcare, this poses severe clinical risk. MediTalk implements a hardcoded deterministic reference layer (`checkRanges`) that runs prior to generation. The LLM is only permitted to explain what the deterministic engine evaluated.

### Q2: What is the benefit of an Agentic Tool Loop over standard RAG?
> **Answer:** Standard RAG simply embeds a query and injects retrieved text into a static prompt. In contrast, an agent (`ToolLoopAgent`) exercises autonomous runtime decision-making. When a user asks *"Is my sugar getting worse?"*, the agent autonomously calls `getHistory` first, computes the delta between August and November, queries `searchGuideline` for ADA lifestyle thresholds, and calls `createRecommendation` to persist an endocrinologist follow-up.

### Q3: Why use pgvector instead of external vector databases like Pinecone?
> **Answer:** MediTalk stores structured patient records, longitudinal test histories, and vector embeddings in a single unified PostgreSQL database. This eliminates external network hops, reduces latency, simplifies data integrity with foreign key cascades, and operates entirely within Supabase's generous free tier.

---

## 📜 License

MIT License. Developed for academic excellence and clinical literacy.
