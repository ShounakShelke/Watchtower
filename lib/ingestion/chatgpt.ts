import { prisma } from "../prisma";
import { getEmbedding } from "../retrieval/engine";

export interface IngestionReport {
  conversationsParsed: number;
  knowledgeRecordsCreated: number;
  memoryCandidatesProposed: number;
  projectsDetected: string[];
}

/**
 * Parses markdown or text export of ChatGPT conversations and generates:
 * 1. Segmented Knowledge documents
 * 2. Staged MemoryCandidates for user review
 */
export async function ingestChatGPTMarkdown(
  userId: string,
  rawContent: string,
  fileName: string = "chatgpt-export.md"
): Promise<IngestionReport> {
  const sections = rawContent
    .split(/\n#{1,3}\s+|(?:\r?\n){3,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 50);

  let knowledgeCount = 0;
  let candidateCount = 0;
  const detectedProjects = new Set<string>();

  for (const section of sections) {
    const lines = section.split("\n");
    const title = lines[0].replace(/^[#*-]\s*/, "").slice(0, 100) || "Conversation Segment";

    // 1. Detect project references
    if (/GT2|competitor|benchmark/i.test(section)) detectedProjects.add("GT2");
    if (/MedLMP|clinical|medical/i.test(section)) detectedProjects.add("MedLMP");
    if (/Watchtower|operating system|agent/i.test(section)) detectedProjects.add("Watchtower");

    // 2. Create Knowledge Document
    const knowledge = await prisma.knowledge.create({
      data: {
        userId,
        title,
        content: section,
        sourceType: "chatgpt_import",
        sourceReference: fileName,
        metadata: {
          importedAt: new Date().toISOString(),
          wordCount: section.split(/\s+/).length,
        },
      },
    });
    knowledgeCount++;

    // Generate and store embedding if available
    const emb = await getEmbedding(section);
    if (emb) {
      await prisma.knowledgeEmbedding.create({
        data: {
          knowledgeId: knowledge.id,
          embedding: emb,
          model: "text-embedding-004",
        },
      });
    }

    // 3. Extract Decision or Preference Memory Candidates
    const prefMatch = section.match(/(?:I prefer|I like to|My routine is|I usually work on|I decided to)\s+([^.\n]+)/i);
    if (prefMatch) {
      const statement = prefMatch[1].trim();
      if (statement.length > 10 && statement.length < 200) {
        await prisma.memoryCandidate.create({
          data: {
            userId,
            category: "preference",
            key: `pref_${title.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30)}`,
            value: statement,
            reason: `Extracted from imported conversation: "${title}"`,
            confidence: 0.75,
            sourceType: "chatgpt_import",
            sourceReference: fileName,
            status: "PENDING",
          },
        });
        candidateCount++;
      }
    }
  }

  return {
    conversationsParsed: sections.length,
    knowledgeRecordsCreated: knowledgeCount,
    memoryCandidatesProposed: candidateCount,
    projectsDetected: Array.from(detectedProjects),
  };
}

