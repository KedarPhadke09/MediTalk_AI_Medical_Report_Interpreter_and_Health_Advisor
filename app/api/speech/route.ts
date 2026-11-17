import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, language = 'en' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    // Return speech metadata so browser Web Speech can synthesize with appropriate voice
    // along with pre-cleaned pronunciation for medical terms
    const cleanSpeechText = text
      .replace(/[*_#`]/g, '') // remove markdown symbols
      .replace(/\n+/g, '. ')
      .replace(/mg\/dL/g, ' milligrams per deciliter')
      .replace(/g\/dL/g, ' grams per deciliter')
      .replace(/mIU\/L/g, ' milli international units per liter')
      .replace(/HbA1c/gi, 'H b A 1 c')
      .trim();

    return NextResponse.json({
      success: true,
      text: cleanSpeechText,
      voiceRecommendation: language === 'hi' ? 'hi-IN' : 'en-IN',
      charCount: cleanSpeechText.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Speech generation error' }, { status: 500 });
  }
}
