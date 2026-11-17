export interface ReferenceRange {
  test: string;
  lower: number;
  upper: number;
  unit: string;
  category: 'diabetes' | 'lipid' | 'thyroid' | 'cbc' | 'renal' | 'liver' | 'vitals';
  specialist: string;
  criticalLowMultiplier?: number;
  criticalHighMultiplier?: number;
}

export const REFERENCE_RANGES: Record<string, ReferenceRange> = {
  // Diabetes & Blood Sugar
  'HbA1c': {
    test: 'HbA1c',
    lower: 4.0,
    upper: 5.6,
    unit: '%',
    category: 'diabetes',
    specialist: 'Endocrinologist',
    criticalHighMultiplier: 1.6, // > 9.0%
  },
  'Fasting Glucose': {
    test: 'Fasting Glucose',
    lower: 70,
    upper: 100,
    unit: 'mg/dL',
    category: 'diabetes',
    specialist: 'Endocrinologist',
    criticalLowMultiplier: 0.7,  // < 50 mg/dL
    criticalHighMultiplier: 1.8, // > 180 mg/dL
  },
  'Postprandial Glucose': {
    test: 'Postprandial Glucose',
    lower: 90,
    upper: 140,
    unit: 'mg/dL',
    category: 'diabetes',
    specialist: 'Endocrinologist',
    criticalHighMultiplier: 1.8,
  },

  // Lipid Profile
  'LDL': {
    test: 'LDL',
    lower: 0,
    upper: 130,
    unit: 'mg/dL',
    category: 'lipid',
    specialist: 'Cardiologist',
    criticalHighMultiplier: 1.46, // > 190 mg/dL
  },
  'HDL': {
    test: 'HDL',
    lower: 40,
    upper: 999,
    unit: 'mg/dL',
    category: 'lipid',
    specialist: 'Cardiologist',
    criticalLowMultiplier: 0.75, // < 30 mg/dL
  },
  'Total Cholesterol': {
    test: 'Total Cholesterol',
    lower: 0,
    upper: 200,
    unit: 'mg/dL',
    category: 'lipid',
    specialist: 'Cardiologist',
    criticalHighMultiplier: 1.3,
  },
  'Triglycerides': {
    test: 'Triglycerides',
    lower: 0,
    upper: 150,
    unit: 'mg/dL',
    category: 'lipid',
    specialist: 'Cardiologist',
    criticalHighMultiplier: 2.0,
  },

  // Thyroid
  'TSH': {
    test: 'TSH',
    lower: 0.4,
    upper: 4.0,
    unit: 'mIU/L',
    category: 'thyroid',
    specialist: 'Endocrinologist',
    criticalLowMultiplier: 0.25, // < 0.1 mIU/L
    criticalHighMultiplier: 2.5,  // > 10 mIU/L
  },
  'T3': {
    test: 'T3',
    lower: 80,
    upper: 200,
    unit: 'ng/dL',
    category: 'thyroid',
    specialist: 'Endocrinologist',
  },
  'T4': {
    test: 'T4',
    lower: 54,
    upper: 155,
    unit: 'µg/dL',
    category: 'thyroid',
    specialist: 'Endocrinologist',
  },

  // Complete Blood Count (CBC)
  'Hemoglobin': {
    test: 'Hemoglobin',
    lower: 13.0,
    upper: 17.0,
    unit: 'g/dL',
    category: 'cbc',
    specialist: 'Hematologist',
    criticalLowMultiplier: 0.61, // < 8 g/dL
  },
  'WBC': {
    test: 'WBC',
    lower: 4000,
    upper: 11000,
    unit: '/µL',
    category: 'cbc',
    specialist: 'Hematologist / General Physician',
    criticalLowMultiplier: 0.5,
    criticalHighMultiplier: 3.0,
  },
  'Platelets': {
    test: 'Platelets',
    lower: 150000,
    upper: 450000,
    unit: '/µL',
    category: 'cbc',
    specialist: 'Hematologist',
    criticalLowMultiplier: 0.33, // < 50,000
    criticalHighMultiplier: 1.8,
  },

  // Renal Function
  'Creatinine': {
    test: 'Creatinine',
    lower: 0.6,
    upper: 1.3,
    unit: 'mg/dL',
    category: 'renal',
    specialist: 'Nephrologist',
    criticalHighMultiplier: 2.0, // > 2.6 mg/dL
  },
  'eGFR': {
    test: 'eGFR',
    lower: 60,
    upper: 999,
    unit: 'mL/min/1.73m²',
    category: 'renal',
    specialist: 'Nephrologist',
    criticalLowMultiplier: 0.5, // < 30 mL/min
  },

  // Liver Function
  'ALT': {
    test: 'ALT',
    lower: 7,
    upper: 56,
    unit: 'U/L',
    category: 'liver',
    specialist: 'Gastroenterologist / Hepatologist',
    criticalHighMultiplier: 3.0,
  },
  'AST': {
    test: 'AST',
    lower: 10,
    upper: 40,
    unit: 'U/L',
    category: 'liver',
    specialist: 'Gastroenterologist / Hepatologist',
    criticalHighMultiplier: 3.0,
  },
};

export interface LabValueInput {
  test: string;
  value: number;
  unit?: string;
  range?: string;
}

export interface RangeCheckResult {
  test: string;
  value: number;
  unit: string;
  range: string;
  status: 'normal' | 'low' | 'high' | 'critical' | 'unknown';
  severity: 'none' | 'moderate' | 'critical';
  specialist?: string;
  note?: string;
}

/**
 * DETERMINISTIC ZERO-HALLUCINATION RANGE CHECKER
 * Hardcoded rules directly compare raw patient values against verified medical baselines.
 * The LLM is NEVER allowed to decide normal/abnormal independently.
 */
export function deterministicCheck(values: LabValueInput[]): RangeCheckResult[] {
  return values.map((v) => {
    // Find matching range case-insensitively or via alias
    const normalizedName = Object.keys(REFERENCE_RANGES).find(
      (k) => k.toLowerCase() === v.test.toLowerCase() ||
             v.test.toLowerCase().includes(k.toLowerCase())
    );

    const range = normalizedName ? REFERENCE_RANGES[normalizedName] : null;

    if (!range) {
      return {
        test: v.test,
        value: v.value,
        unit: v.unit || '',
        range: v.range || 'Custom/Unverified',
        status: 'unknown',
        severity: 'none',
        note: 'No verified baseline in reference engine; clinician consultation advised.',
      };
    }

    const { lower, upper, unit, specialist } = range;
    const formattedRange = `${lower} - ${upper} ${unit}`;

    // Critical low check
    if (range.criticalLowMultiplier && v.value < lower * range.criticalLowMultiplier) {
      return {
        test: range.test,
        value: v.value,
        unit,
        range: formattedRange,
        status: 'critical',
        severity: 'critical',
        specialist,
        note: `Critically low value below safety threshold (${lower * range.criticalLowMultiplier} ${unit}). Immediate physician assessment recommended.`,
      };
    }

    // Critical high check
    if (range.criticalHighMultiplier && v.value > upper * range.criticalHighMultiplier) {
      return {
        test: range.test,
        value: v.value,
        unit,
        range: formattedRange,
        status: 'critical',
        severity: 'critical',
        specialist,
        note: `Critically elevated value above safety ceiling (${upper * range.criticalHighMultiplier} ${unit}). Urgent evaluation advised.`,
      };
    }

    // Moderate High
    if (v.value > upper) {
      return {
        test: range.test,
        value: v.value,
        unit,
        range: formattedRange,
        status: 'high',
        severity: 'moderate',
        specialist,
        note: `Elevated above normal upper limit (${upper} ${unit}).`,
      };
    }

    // Moderate Low
    if (v.value < lower) {
      return {
        test: range.test,
        value: v.value,
        unit,
        range: formattedRange,
        status: 'low',
        severity: 'moderate',
        specialist,
        note: `Below normal lower baseline (${lower} ${unit}).`,
      };
    }

    // Normal
    return {
      test: range.test,
      value: v.value,
      unit,
      range: formattedRange,
      status: 'normal',
      severity: 'none',
      specialist,
      note: 'Within verified clinical reference limits.',
    };
  });
}
