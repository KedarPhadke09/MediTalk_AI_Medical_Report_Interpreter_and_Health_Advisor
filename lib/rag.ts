import { embed } from 'ai';
import { google } from '@ai-sdk/google';
import { supabaseAdmin, Guideline } from './supabase';
import { DEMO_GUIDELINES } from './demoData';

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// In-memory cache for guideline embeddings to avoid repeated embedding calls
let cachedGuidelineEmbeddings: { guideline: Guideline; embedding: number[] }[] | null = null;

async function getCachedDemoEmbeddings(): Promise<{ guideline: Guideline; embedding: number[] }[]> {
  if (cachedGuidelineEmbeddings) {
    return cachedGuidelineEmbeddings;
  }

  // Pre-generate embeddings for local fallback demo guidelines
  try {
    const results = [];
    for (const g of DEMO_GUIDELINES) {
      const { embedding } = await embed({
        model: google.textEmbeddingModel('gemini-embedding-001'),
        value: `${g.title} - ${g.source}: ${g.content}`,
      });
      results.push({ guideline: g, embedding });
    }
    cachedGuidelineEmbeddings = results;
    return results;
  } catch (err) {
    console.warn('Could not generate guideline embeddings, using keyword match fallback', err);
    return DEMO_GUIDELINES.map((g) => ({
      guideline: g,
      embedding: [],
    }));
  }
}

/**
 * Perform Vector RAG search against Supabase pgvector with local vector fallback
 */
export async function searchMedicalGuidelines(query: string, limit: number = 3): Promise<Guideline[]> {
  try {
    // 1. Generate query embedding
    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      value: query,
    });

    // 2. Try Supabase pgvector RPC
    try {
      const { data, error } = await supabaseAdmin.rpc('match_guidelines', {
        query_vec: embedding,
        match_count: limit,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          title: d.title,
          source: d.source,
          content: d.content,
          similarity: d.similarity,
        }));
      }
    } catch (dbErr) {
      console.warn('Supabase pgvector call skipped or failed, falling back to embedded vector search:', dbErr);
    }

    // 3. Fallback to vector search over verified guidelines
    const demoWithEmbeddings = await getCachedDemoEmbeddings();
    if (demoWithEmbeddings.length > 0 && demoWithEmbeddings[0].embedding.length > 0) {
      const scored = demoWithEmbeddings.map((item) => ({
        ...item.guideline,
        similarity: cosineSimilarity(embedding, item.embedding),
      }));

      scored.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
      return scored.slice(0, limit);
    }
  } catch (embedErr) {
    console.warn('Embedding error during search, using semantic keyword matching:', embedErr);
  }

  // 4. Robust fallback: Keyword relevance ranking
  const queryLower = query.toLowerCase();
  const scoredByKeyword = DEMO_GUIDELINES.map((g) => {
    let score = 0;
    const words = queryLower.split(/\s+/).filter(w => w.length > 2);
    for (const w of words) {
      if (g.title.toLowerCase().includes(w)) score += 3;
      if (g.source.toLowerCase().includes(w)) score += 2;
      if (g.content.toLowerCase().includes(w)) score += 1;
    }
    return { ...g, similarity: score > 0 ? 0.75 + Math.min(score * 0.05, 0.2) : 0.5 };
  });

  scoredByKeyword.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  return scoredByKeyword.slice(0, limit);
}
