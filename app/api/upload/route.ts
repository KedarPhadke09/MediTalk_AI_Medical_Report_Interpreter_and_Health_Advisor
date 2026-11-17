import { NextResponse } from 'next/server';
import { supabaseAdmin, Patient } from '@/lib/supabase';
import { deterministicCheck } from '@/lib/ranges';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    let patientId = (formData.get('patientId') as string) || '';
    let reportType = (formData.get('type') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No report file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // 1. Upload to Supabase Storage (if available)
    let fileUrl = '';
    try {
      const uploadRes = await supabaseAdmin.storage.from('reports').upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });
      if (!uploadRes.error) {
        fileUrl = supabaseAdmin.storage.from('reports').getPublicUrl(fileName).data.publicUrl;
      }
    } catch (storageErr) {
      console.warn('Storage bucket upload optional fallback:', storageErr);
    }

    // 2. Multi-modal Text & OCR Extraction
    let extractedText = '';
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (isPdf) {
      try {
        const pdfModule: any = await import('pdf-parse');
        const PDFParseClass = pdfModule.PDFParse || pdfModule.default;
        if (typeof PDFParseClass === 'function') {
          const parser = new PDFParseClass(buffer);
          const parsed = await parser.getText();
          extractedText = parsed?.text || '';
        }
      } catch (pdfErr) {
        console.warn('pdf-parse fallback to multimodal extraction:', pdfErr);
      }
    }

    // 3. Multimodal Vision OCR extraction
    let ocrJsonRaw = '';
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || (isPdf ? 'application/pdf' : 'image/jpeg');

    const { text: visionResponse } = await generateText({
      model: google('gemini-3.5-flash-lite'),
      system: `You are an expert clinical laboratory data extraction engine.
Carefully read the medical report document (image or text).
Extract:
1. Patient Demographics: Name, Age, Gender/Sex.
2. Report Title / Investigation Type (e.g. Complete Blood Count (CBC), Lipid Profile, Liver Function Test, Thyroid Panel, etc.).
3. Quantitative Lab Tests: Standardized test name, measured numerical value, measurement unit, reference biological interval.

You must respond ONLY with a valid JSON object matching this schema:
{
  "patient": {
    "name": "Extracted Patient Name",
    "age": 25,
    "gender": "Male" or "Female"
  },
  "reportType": "Complete Blood Count (CBC)",
  "test_results": [
    {
      "name": "Standardized Test Name (e.g. Hemoglobin, Platelets, WBC, Fasting Glucose, HbA1c, etc.)",
      "value": 12.5,
      "unit": "g/dL",
      "range": "13.0 - 17.0"
    }
  ]
}
If age is written like "23 Years", return integer 23.
Extract ONLY real numerical diagnostic metrics. Do not include commentary outside the JSON block.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: extractedText
                ? `Extract all patient info, report title, and lab metrics from this report text:\n\n${extractedText.substring(0, 8000)}`
                : 'Extract all patient demographics, report title, and lab metrics from this medical document image.',
            },
            ...(extractedText
              ? []
              : [
                  {
                    type: 'file' as const,
                    data: base64Data,
                    mediaType: mimeType,
                  },
                ]),
          ],
        },
      ],
    });

    ocrJsonRaw = visionResponse.trim();
    if (ocrJsonRaw.startsWith('```json')) {
      ocrJsonRaw = ocrJsonRaw.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (ocrJsonRaw.startsWith('```')) {
      ocrJsonRaw = ocrJsonRaw.replace(/^```/, '').replace(/```$/, '').trim();
    }

    let parsedDoc: any = {};
    try {
      parsedDoc = JSON.parse(ocrJsonRaw);
    } catch (parseErr) {
      console.warn('JSON parse error from vision extraction:', parseErr, ocrJsonRaw);
      parsedDoc = {};
    }

    // Extract patient details
    const extractedPatientName = parsedDoc.patient?.name?.trim() || '';
    const rawAge = parsedDoc.patient?.age;
    const extractedAge =
      typeof rawAge === 'number'
        ? rawAge
        : parseInt(String(rawAge || '').replace(/[^0-9]/g, '')) || 30;
    const extractedGender =
      String(parsedDoc.patient?.gender || '').toLowerCase().startsWith('f') ? 'F' : 'M';

    if (parsedDoc.reportType) {
      reportType = parsedDoc.reportType;
    } else if (!reportType) {
      reportType = 'Clinical Lab Report';
    }

    const rawTestList = parsedDoc.test_results || parsedDoc.values || [];
    const values = rawTestList.map((v: any) => ({
      test: String(v.name || v.test || 'Test'),
      value:
        typeof v.value === 'number'
          ? v.value
          : parseFloat(String(v.value || '0').replace(/[^0-9.]/g, '')) || 0,
      unit: String(v.unit || ''),
      range: String(v.range || v.reference_range || ''),
    }));

    // 4. Deterministic Clinical Safety Validation
    const flags = deterministicCheck(values);

    // 5. Create or sync patient
    let patientObj: Patient;
    if (extractedPatientName) {
      const dynamicPatientId = `pat_${Date.now()}`;
      patientObj = {
        id: dynamicPatientId,
        name: extractedPatientName,
        age: extractedAge,
        gender: extractedGender,
        phone: '+91-XXXXXXXXXX',
        created_at: new Date().toISOString(),
      };
      patientId = dynamicPatientId;

      // Try inserting into Supabase
      try {
        await supabaseAdmin.from('patients').upsert({
          id: patientObj.id,
          name: patientObj.name,
          age: patientObj.age,
          gender: patientObj.gender,
          phone: patientObj.phone,
        });
      } catch (pErr) {
        console.warn('Supabase patient upsert skipped:', pErr);
      }
    } else {
      patientObj = {
        id: patientId || 'a0000000-0000-0000-0000-000000000001',
        name: 'Patient',
        age: 35,
        gender: 'M',
        phone: '+91-XXXXXXXXXX',
        created_at: new Date().toISOString(),
      };
    }

    // 6. Insert Report into Supabase
    let newReportId = `rep_${Date.now()}`;
    try {
      const { data: dbReport, error: dbErr } = await supabaseAdmin
        .from('reports')
        .insert({
          patient_id: patientId,
          type: reportType,
          file_url: fileUrl || null,
          values,
          flags,
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!dbErr && dbReport) {
        newReportId = dbReport.id;
      }
    } catch (dbError) {
      console.warn('Supabase reports table insert optional fallback:', dbError);
    }

    return NextResponse.json({
      success: true,
      reportId: newReportId,
      patientId,
      patient: patientObj,
      type: reportType,
      fileUrl,
      values,
      flags,
      criticalFlags: flags.filter((f) => f.severity === 'critical'),
      abnormalFlags: flags.filter((f) => f.status !== 'normal'),
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process medical report' },
      { status: 500 }
    );
  }
}
