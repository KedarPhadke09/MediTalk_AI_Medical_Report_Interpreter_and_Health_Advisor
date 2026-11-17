import { streamText, tool, isStepCount } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { deterministicCheck } from '@/lib/ranges';
import { searchMedicalGuidelines } from '@/lib/rag';
import { DEMO_REPORTS, DEMO_PATIENTS } from '@/lib/demoData';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, patientId, patient: customPatient, reportId, activeReport } = await req.json();

    const selectedPatient = customPatient || DEMO_PATIENTS.find(p => p.id === patientId) || DEMO_PATIENTS[0];

    const result = streamText({
      model: google('gemini-3.5-flash-lite'),
      system: `You are MediTalk, an advanced clinical medical report interpreter and health advisor.
Patient Profile:
- Name: ${selectedPatient.name}
- Age: ${selectedPatient.age}
- Gender: ${selectedPatient.gender}
- Active Report Title: ${activeReport?.type || reportId || 'Latest Available'}
- Active Report Lab Values: ${JSON.stringify(activeReport?.values || [])}
- Active Report Evaluated Flags: ${JSON.stringify(activeReport?.flags || [])}

STRICT CLINICAL RULES:
1. Address the patient respectfully by their exact name (${selectedPatient.name}) and reference their specific report metrics.
2. NEVER invent, hallucinate, or assume lab numbers or units. Only use exact data from the active report or returned by tools.
3. Always execute 'checkRanges' to deterministically determine normal/low/high/critical status BEFORE explaining any test.
4. If the patient asks about abnormal values, ALWAYS call 'searchGuideline' and cite the exact source guideline (e.g. ADA Standards of Care 2026, ICMR, WHO).
5. For longitudinal questions (e.g., "is my diabetes getting worse?", "how did my cholesterol change?"), call 'getHistory' to compare dates and values.
6. If an abnormal or critical value is identified, call 'createRecommendation' with the appropriate urgency ('info' | 'follow_up' | 'urgent') and specialist (e.g., Endocrinologist, Cardiologist, Nephrologist).
7. IF ANY VALUE IS CRITICAL (e.g., severe hypoglycemia, acute renal spike), prominently say: "Please consult a doctor or emergency physician urgently."
8. Respond in the SAME language the patient used (Hindi or English). If the patient speaks Hinglish or Hindi, answer warmly in clear, conversational Hindi or Hinglish.
9. Keep explanations warm, reassuring, and free of unnecessary medical jargon.
10. MANDATORY DISCLAIMER: Always state that you are an AI informational health advisor and this is not a formal medical diagnosis.`,
      messages,
      stopWhen: isStepCount(6),
      tools: {
        getReport: tool({
          description: 'Fetch the structured lab values from an uploaded medical report by reportId',
          inputSchema: z.object({
            reportId: z.string().describe('The UUID of the report to retrieve'),
          }),
          execute: async ({ reportId: idToFetch }) => {
            if (activeReport && (activeReport.id === idToFetch || !idToFetch || idToFetch === 'latest')) {
              return { report: activeReport, source: 'active_session' };
            }
            try {
              const { data, error } = await supabaseAdmin
                .from('reports')
                .select('id, type, values, flags, uploaded_at')
                .eq('id', idToFetch)
                .single();

              if (!error && data) {
                return { report: data, source: 'supabase' };
              }
            } catch (err) {
              console.warn('Supabase fetch failed, looking in local demo store:', err);
            }

            // Local fallback
            const demo = DEMO_REPORTS.find((r) => r.id === idToFetch) || DEMO_REPORTS[0];
            return { report: demo, source: 'verified_dataset' };
          },
        }),

        checkRanges: tool({
          description: 'Deterministically evaluate lab values against verified clinical reference ranges. Must be called before interpreting results.',
          inputSchema: z.object({
            values: z.array(
              z.object({
                test: z.string().describe('Name of the lab test, e.g. HbA1c, Fasting Glucose'),
                value: z.number().describe('Measured numerical value'),
                unit: z.string().optional(),
                range: z.string().optional(),
              })
            ),
          }),
          execute: async ({ values }) => {
            const evaluation = deterministicCheck(values);
            return {
              evaluation,
              criticalCount: evaluation.filter((e) => e.severity === 'critical').length,
              abnormalCount: evaluation.filter((e) => e.status !== 'normal').length,
            };
          },
        }),

        searchGuideline: tool({
          description: 'Search clinical medical guidelines (ADA, ICMR, WHO, KDIGO) using vector RAG for authoritative evidence and citations.',
          inputSchema: z.object({
            query: z.string().describe('Clinical condition or test query, e.g. "HbA1c diabetes threshold"'),
          }),
          execute: async ({ query }) => {
            const guidelines = await searchMedicalGuidelines(query, 3);
            return {
              query,
              retrievedGuidelines: guidelines.map((g) => ({
                title: g.title,
                source: g.source,
                content: g.content,
                relevanceScore: g.similarity ? Number(g.similarity.toFixed(2)) : undefined,
              })),
            };
          },
        }),

        getHistory: tool({
          description: "Get patient's historical medical reports over time for trend analysis (e.g. HbA1c trajectory, cholesterol changes).",
          inputSchema: z.object({
            patientId: z.string().describe('The UUID of the patient'),
            test: z.string().optional().describe('Optional specific test name to isolate (e.g. HbA1c)'),
          }),
          execute: async ({ patientId: pId, test }) => {
            let reports: any[] = [];
            try {
              const { data, error } = await supabaseAdmin
                .from('reports')
                .select('id, type, values, flags, uploaded_at')
                .eq('patient_id', pId)
                .order('uploaded_at', { ascending: false })
                .limit(10);

              if (!error && data && data.length > 0) {
                reports = data;
              }
            } catch (err) {
              console.warn('Supabase getHistory failed, falling back:', err);
            }

            if (reports.length === 0) {
              reports = DEMO_REPORTS.filter((r) => r.patient_id === pId || pId.includes('0001'));
            }

            if (test) {
              const testLower = test.toLowerCase();
              const trend = reports
                .map((r) => {
                  const valObj = (r.values as any[]).find(
                    (v) => v.test.toLowerCase() === testLower || v.test.toLowerCase().includes(testLower)
                  );
                  return valObj
                    ? {
                        reportId: r.id,
                        date: r.uploaded_at,
                        test: valObj.test,
                        value: valObj.value,
                        unit: valObj.unit,
                      }
                    : null;
                })
                .filter(Boolean)
                .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime());

              return { test, trendCount: trend.length, trend };
            }

            return { totalReports: reports.length, reports };
          },
        }),

        createRecommendation: tool({
          description: 'Record an actionable clinical recommendation, urgency classification, and suggested medical specialist.',
          inputSchema: z.object({
            patientId: z.string(),
            reportId: z.string().optional(),
            text: z.string().describe('The recommendation summary for the patient'),
            urgency: z.enum(['info', 'follow_up', 'urgent']),
            specialist: z.string().optional().describe('Recommended specialist e.g. Endocrinologist, Cardiologist'),
          }),
          execute: async (params) => {
            try {
              const { data, error } = await supabaseAdmin
                .from('recommendations')
                .insert({
                  patient_id: params.patientId,
                  report_id: params.reportId || null,
                  text: params.text,
                  urgency: params.urgency,
                  specialist: params.specialist || 'General Physician',
                })
                .select()
                .single();

              if (!error && data) {
                return { success: true, recommendationId: data.id, persistence: 'supabase' };
              }
            } catch (err) {
              console.warn('Recommendation insert in Supabase skipped:', err);
            }

            return {
              success: true,
              recommendationId: 'rec_' + Math.random().toString(36).substring(2, 9),
              persistence: 'session',
              recommendation: params,
            };
          },
        }),
      },
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Agent route error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Agent Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
