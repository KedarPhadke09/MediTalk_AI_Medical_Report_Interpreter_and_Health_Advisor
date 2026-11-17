import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DEMO_GUIDELINES } from '@/lib/demoData';
import { embed } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 120;

export async function GET() {
  try {
    let embeddedCount = 0;
    const errors: string[] = [];

    for (const g of DEMO_GUIDELINES) {
      try {
        const { embedding } = await embed({
          model: google.textEmbeddingModel('gemini-embedding-001'),
          value: `${g.title} - ${g.source}: ${g.content}`,
        });

        const { error } = await supabaseAdmin.from('guidelines').upsert({
          id: g.id,
          title: g.title,
          source: g.source,
          content: g.content,
          embedding,
        });

        if (error) {
          errors.push(`${g.title}: ${error.message}`);
        } else {
          embeddedCount++;
        }
      } catch (err: any) {
        errors.push(`${g.title}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: DEMO_GUIDELINES.length,
      embeddedCount,
      errors: errors.length > 0 ? errors : undefined,
      note: 'Guidelines seeded with Gemini 3072-dim embeddings into pgvector',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
