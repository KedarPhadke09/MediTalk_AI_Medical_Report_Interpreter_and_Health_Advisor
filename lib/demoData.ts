import { Patient, Report, Guideline } from './supabase';

export const DEMO_PATIENTS: Patient[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Rajesh Kumar',
    age: 52,
    gender: 'M',
    phone: '+91-9876543210',
    created_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Priya Sharma',
    age: 38,
    gender: 'F',
    phone: '+91-9123456789',
    created_at: new Date('2026-02-15').toISOString(),
  },
];

export const DEMO_REPORTS: Report[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    patient_id: 'a0000000-0000-0000-0000-000000000001',
    type: 'Comprehensive Blood Panel',
    file_url: '',
    uploaded_at: '2026-11-10T10:30:00Z',
    values: [
      { test: 'HbA1c', value: 7.2, unit: '%', range: '4.0 - 5.6' },
      { test: 'Fasting Glucose', value: 142, unit: 'mg/dL', range: '70 - 100' },
      { test: 'Hemoglobin', value: 14.2, unit: 'g/dL', range: '13.0 - 17.0' },
      { test: 'Creatinine', value: 1.1, unit: 'mg/dL', range: '0.6 - 1.3' },
      { test: 'WBC', value: 7200, unit: '/µL', range: '4000 - 11000' },
    ],
    flags: [
      { test: 'HbA1c', status: 'high', severity: 'moderate' },
      { test: 'Fasting Glucose', status: 'high', severity: 'moderate' },
      { test: 'Hemoglobin', status: 'normal', severity: 'none' },
      { test: 'Creatinine', status: 'normal', severity: 'none' },
      { test: 'WBC', status: 'normal', severity: 'none' },
    ],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    patient_id: 'a0000000-0000-0000-0000-000000000001',
    type: 'Glycemic Follow-Up',
    file_url: '',
    uploaded_at: '2026-08-15T09:15:00Z',
    values: [
      { test: 'HbA1c', value: 6.8, unit: '%', range: '4.0 - 5.6' },
      { test: 'Fasting Glucose', value: 128, unit: 'mg/dL', range: '70 - 100' },
      { test: 'Hemoglobin', value: 14.8, unit: 'g/dL', range: '13.0 - 17.0' },
    ],
    flags: [
      { test: 'HbA1c', status: 'high', severity: 'moderate' },
      { test: 'Fasting Glucose', status: 'high', severity: 'moderate' },
      { test: 'Hemoglobin', status: 'normal', severity: 'none' },
    ],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    patient_id: 'a0000000-0000-0000-0000-000000000002',
    type: 'Lipid Profile',
    file_url: '',
    uploaded_at: '2026-11-12T11:45:00Z',
    values: [
      { test: 'LDL', value: 165, unit: 'mg/dL', range: '< 130' },
      { test: 'HDL', value: 32, unit: 'mg/dL', range: '> 40' },
      { test: 'Total Cholesterol', value: 245, unit: 'mg/dL', range: '< 200' },
      { test: 'Triglycerides', value: 195, unit: 'mg/dL', range: '< 150' },
    ],
    flags: [
      { test: 'LDL', status: 'high', severity: 'moderate' },
      { test: 'HDL', status: 'low', severity: 'moderate' },
      { test: 'Total Cholesterol', status: 'high', severity: 'moderate' },
      { test: 'Triglycerides', status: 'high', severity: 'moderate' },
    ],
  },
];

export const DEMO_GUIDELINES: Guideline[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    title: 'HbA1c Glycemic Targets & Clinical Thresholds',
    source: 'ADA Standards of Care 2026',
    content: 'An HbA1c level below 5.7% is considered normal. A level between 5.7% and 6.4% indicates prediabetes. A level of 6.5% or higher on two separate tests confirms diabetes mellitus. For most non-pregnant adults with diabetes, a general goal of HbA1c < 7.0% reduces microvascular complications. Levels exceeding 9.0% indicate poor glycemic control and warrant prompt therapy intensification with specialist review.',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    title: 'Fasting Plasma Glucose Criteria',
    source: 'ADA Standards of Care 2026',
    content: 'Normal fasting plasma glucose is < 100 mg/dL. Impaired Fasting Glucose (prediabetes) is classified between 100-125 mg/dL. Fasting glucose >= 126 mg/dL confirms diabetes. Values exceeding 180 mg/dL signal acute hyperglycemia requiring clinical evaluation to avert metabolic decompensation.',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    title: 'LDL Cholesterol & Atherosclerotic Risk Management',
    source: 'ICMR CVD Guidelines 2025',
    content: 'Optimal LDL cholesterol is < 100 mg/dL. Near-optimal is 100-129 mg/dL. Borderline high is 130-159 mg/dL, high is 160-189 mg/dL, and very high is >= 190 mg/dL. In diabetic individuals, an LDL exceeding 130 mg/dL warrants high-intensity statin therapy and cardiology referral.',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    title: 'HDL Cholesterol Cardioprotective Limits',
    source: 'WHO Cardiovascular Disease Guidelines',
    content: 'HDL cholesterol below 40 mg/dL in men and below 50 mg/dL in women represents a significant independent risk factor for coronary artery disease. Aerobic exercise, smoking cessation, and dietary modification with healthy fats provide therapeutic elevation.',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000005',
    title: 'TSH & Thyroid Dysfunction Management',
    source: 'Endocrine Society Guidelines 2025',
    content: 'Standard reference range for serum TSH is 0.4 to 4.0 mIU/L. TSH above 4.0 mIU/L suggests hypothyroidism; values below 0.4 mIU/L suggest hyperthyroidism. TSH above 10 mIU/L typically warrants levothyroxine therapy under endocrinology oversight.',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000006',
    title: 'Hemoglobin & Anemia Grading',
    source: 'ICMR Clinical Hematology 2025',
    content: 'Normal adult male hemoglobin is 13.0-17.0 g/dL; adult female is 12.0-15.0 g/dL. Mild anemia is 11.0-12.9 g/dL, moderate is 8.0-10.9 g/dL, and severe anemia is < 8.0 g/dL, requiring immediate investigation for blood loss or nutritional deficiency.',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000007',
    title: 'Serum Creatinine & eGFR Renal Staging',
    source: 'KDIGO Clinical Practice Guideline 2025',
    content: 'Normal serum creatinine is 0.6-1.3 mg/dL. An estimated GFR (eGFR) >= 90 mL/min/1.73m² indicates preserved kidney function. eGFR 60-89 denotes mild decline, while eGFR persistent below 60 mL/min/1.73m² defines Chronic Kidney Disease (CKD) warranting nephrology evaluation.',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000008',
    title: 'Liver Transaminases (ALT/AST) Clinical Significance',
    source: 'AASLD Liver Disease Guidelines 2025',
    content: 'Normal ALT is 7-56 U/L and AST is 10-40 U/L. Elevations 2 to 3 times upper limit of normal commonly correlate with non-alcoholic fatty liver disease (NAFLD), medication reactions, or alcohol consumption. Persistent elevations require hepatic ultrasound and viral serology.',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000009',
    title: 'White Blood Cell (WBC) Count & Infection Indicators',
    source: 'Merck Clinical Hematology Reference',
    content: 'Reference WBC count is 4,000 to 11,000 /µL. Leukocytosis (> 11,000 /µL) predominantly reflects active bacterial infection, acute inflammation, or physiologic stress. Leukopenia (< 4,000 /µL) warrants monitoring for viral suppression or marrow disorders.',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000010',
    title: 'Platelet Count & Hemostatic Safety',
    source: 'Merck Manual Reference',
    content: 'Standard platelet range is 150,000 to 450,000 /µL. Thrombocytopenia (< 150,000 /µL) increases bleeding tendency; counts below 50,000 /µL demand urgent hematological workup due to spontaneous hemorrhage risk.',
  },
];
