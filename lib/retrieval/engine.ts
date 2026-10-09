import { prisma } from "../prisma";

export interface SearchResultItem {
  id: string;
  type: "KNOWLEDGE" | "MEMORY" | "PROJECT";
  title: string;
  snippet: string;
  score: number;
  metadata?: any;
}

/**
 * Computes cosine similarity between two numeric vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates text embeddings using Gemini or mock fallback.
 */
export async function getEmbedding(text: string): Promise<number[] | null> {
  const geminiKey = process.env.EMBEDDING_API_KEY || process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: text.slice(0, 2048) }] },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.embedding?.values || null;
  } catch {
    return null;
  }
}

/**
 * Hybrid retrieval engine combining semantic vectors (if available) with lexical matching.
 */
export async function hybridSearch(
  userId: string,
  query: string,
  limit: number = 10
): Promise<SearchResultItem[]> {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: SearchResultItem[] = [];

  // 1. Fetch Candidates from Database
  const [knowledgeItems, memoryItems, projectItems] = await Promise.all([
    prisma.knowledge.findMany({
      where: { userId },
      include: { embeddings: true },
      take: 50,
    }),
    prisma.memory.findMany({
      where: { userId },
      take: 50,
    }),
    prisma.project.findMany({
      where: { userId },
      take: 20,
    }),
  ]);

  // 2. Try Vector Search if query embedding succeeds
  const queryVector = await getEmbedding(query);

  if (queryVector) {
    for (const k of knowledgeItems) {
      if (k.embeddings.length > 0) {
        const emb = k.embeddings[0].embedding as number[];
        const sim = cosineSimilarity(queryVector, emb);
        if (sim > 0.4) {
          results.push({
            id: k.id,
            type: "KNOWLEDGE",
            title: k.title,
            snippet: k.content.slice(0, 300),
            score: sim * 100,
            metadata: { sourceType: k.sourceType, reference: k.sourceReference },
          });
        }
      }
    }
  }

  // 3. Lexical / Keyword Scoring Fallback & Supplement
  for (const k of knowledgeItems) {
    if (results.some((r) => r.id === k.id)) continue;
    const text = `${k.title} ${k.content}`.toLowerCase();
    let matchCount = 0;
    for (const term of queryTerms) {
      if (text.includes(term)) matchCount++;
    }
    if (matchCount > 0) {
      results.push({
        id: k.id,
        type: "KNOWLEDGE",
        title: k.title,
        snippet: k.content.slice(0, 300),
        score: matchCount * 15,
        metadata: { sourceType: k.sourceType },
      });
    }
  }

  for (const m of memoryItems) {
    const text = `${m.category} ${m.key} ${m.value}`.toLowerCase();
    let matchCount = 0;
    for (const term of queryTerms) {
      if (text.includes(term)) matchCount++;
    }
    if (matchCount > 0) {
      results.push({
        id: m.id,
        type: "MEMORY",
        title: `Memory: ${m.key}`,
        snippet: m.value,
        score: matchCount * 20 + m.confidence * 10,
        metadata: { category: m.category },
      });
    }
  }

  for (const p of projectItems) {
    const text = `${p.name} ${p.description || ""} ${p.goal || ""}`.toLowerCase();
    let matchCount = 0;
    for (const term of queryTerms) {
      if (text.includes(term)) matchCount++;
    }
    if (matchCount > 0) {
      results.push({
        id: p.id,
        type: "PROJECT",
        title: `Project: ${p.name}`,
        snippet: p.description || p.goal || "Active project",
        score: matchCount * 18,
        metadata: { progress: p.progress, status: p.status },
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

