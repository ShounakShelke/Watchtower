import { prisma } from "../prisma";
import { getGdeltNews } from "../gdelt";

export interface NormalizedNewsItem {
  title: string;
  summary: string;
  sourceUrl: string;
  category: "AI / ML" | "MOTORSPORT";
  publishedAt: Date | null;
  importance: number;
  relevance?: string;
}

/**
 * Calculates Jaccard word similarity between two titles.
 */
function titleSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2));
  const setB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2));

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Rates personal relevance based on active user projects and interests.
 */
function evaluateRelevance(title: string, category: string): { importance: number; relevance?: string } {
  const t = title.toLowerCase();
  let importance = 50;
  let relevance: string | undefined = undefined;

  if (category === "AI / ML") {
    if (/agent|reasoning|deepseek|gemini|openai|anthropic|llama/i.test(t)) {
      importance += 25;
      relevance = "Directly relevant to Watchtower autonomous agent architecture.";
    }
    if (/clinical|biomedical|healthcare|medical/i.test(t)) {
      importance += 20;
      relevance = "Relevant to MedLMP clinical language model research.";
    }
  } else {
    // Motorsport
    if (/gt2|gt3|wec|le mans|hypercar|imsa|spa 24h|nürburgring/i.test(t)) {
      importance += 25;
      relevance = "High importance: GT / Endurance category tracking.";
    } else if (/f1|formula 1|motogp/i.test(t)) {
      importance += 15;
      relevance = "Top-tier open-wheel & bike championship update.";
    }
  }

  return { importance: Math.min(100, importance), relevance };
}

/**
 * Ingests, deduplicates, clusters, and persists intelligence items.
 */
export async function refreshIntelligence() {
  const [aiArticles, motorsportArticles] = await Promise.all([
    getGdeltNews("ai").catch(() => []),
    getGdeltNews("motorsport").catch(() => []),
  ]);

  const rawItems: NormalizedNewsItem[] = [];

  for (const a of aiArticles) {
    const { importance, relevance } = evaluateRelevance(a.title, "AI / ML");
    rawItems.push({
      title: a.title,
      summary: a.title,
      sourceUrl: a.url,
      category: "AI / ML",
      publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
      importance,
      relevance,
    });
  }

  for (const a of motorsportArticles) {
    const { importance, relevance } = evaluateRelevance(a.title, "MOTORSPORT");
    rawItems.push({
      title: a.title,
      summary: a.title,
      sourceUrl: a.url,
      category: "MOTORSPORT",
      publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
      importance,
      relevance,
    });
  }

  // Deduplicate and cluster
  const clusters: {
    canonicalTitle: string;
    topic: string;
    summary: string;
    importance: number;
    relevance?: string;
    items: NormalizedNewsItem[];
  }[] = [];

  for (const item of rawItems) {
    let matchedCluster = clusters.find(
      (c) => c.topic === item.category && titleSimilarity(c.canonicalTitle, item.title) > 0.4
    );

    if (matchedCluster) {
      matchedCluster.items.push(item);
      matchedCluster.importance = Math.max(matchedCluster.importance, item.importance);
    } else {
      clusters.push({
        canonicalTitle: item.title,
        topic: item.category,
        summary: item.summary,
        importance: item.importance,
        relevance: item.relevance,
        items: [item],
      });
    }
  }

  // Persist clusters and items into database
  for (const clusterData of clusters.slice(0, 15)) {
    const cluster = await prisma.newsCluster.create({
      data: {
        canonicalTitle: clusterData.canonicalTitle,
        topic: clusterData.topic === "AI / ML" ? "AI_ML" : "MOTORSPORT",
        summary: clusterData.summary,
        importance: clusterData.importance,
        relevance: clusterData.relevance || null,
      },
    });

    for (const item of clusterData.items) {
      const newsItem = await prisma.newsItem.create({
        data: {
          category: item.category,
          title: item.title,
          summary: item.summary,
          sourceUrl: item.sourceUrl,
          publishedAt: item.publishedAt,
          importance: item.importance,
          relevance: item.relevance || null,
        },
      });

      await prisma.newsClusterItem.create({
        data: {
          clusterId: cluster.id,
          newsItemId: newsItem.id,
        },
      });
    }
  }

  return { clustersCreated: clusters.length, itemsProcessed: rawItems.length };
}

