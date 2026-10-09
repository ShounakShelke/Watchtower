import { AppShell } from "@/components/app-shell";
import { KnowledgeImporter } from "@/components/knowledge-importer";
import { MemoryCandidateList } from "@/components/memory-candidate-list";
import { prisma } from "@/lib/prisma";
import { user } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Knowledge() {
  const u = await user();
  const [entries, candidates, durableMemories] = await Promise.all([
    prisma.knowledge.findMany({
      where: { userId: u.id },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.memoryCandidate.findMany({
      where: { userId: u.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.memory.findMany({
      where: { userId: u.id },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <AppShell active="KNOWLEDGE">
      <header>
        <div>
          <p className="eyebrow">PERSISTENT CONTEXT & MEMORY</p>
          <h1>KNOWLEDGE & MEMORY</h1>
        </div>
      </header>

      {/* Memory Candidates Review Section */}
      <section className="panel" style={{ marginTop: "16px" }}>
        <p className="eyebrow">
          PROPOSED MEMORY CANDIDATES ({candidates.length} PENDING APPROVAL)
        </p>
        <MemoryCandidateList
          initialCandidates={candidates.map((c) => ({
            id: c.id,
            category: c.category,
            key: c.key,
            value: c.value,
            reason: c.reason,
            confidence: c.confidence,
          }))}
        />
      </section>

      <section className="page-grid" style={{ marginTop: "16px" }}>
        <div className="panel">
          <p className="eyebrow">CHATGPT HISTORY INGESTION</p>
          <KnowledgeImporter />

          <div style={{ marginTop: "24px" }}>
            <p className="eyebrow">DURABLE APPROVED MEMORIES ({durableMemories.length})</p>
            <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
              {durableMemories.map((m) => (
                <div
                  key={m.id}
                  style={{
                    borderTop: "1px solid var(--line)",
                    paddingTop: "6px",
                    fontSize: "12px",
                  }}
                >
                  <b>[{m.category}] {m.key}</b>
                  <p style={{ margin: "2px 0", color: "#333" }}>{m.value}</p>
                </div>
              ))}
              {durableMemories.length === 0 && (
                <p className="muted">No durable memories approved yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="panel wide">
          <p className="eyebrow">SEARCHABLE KNOWLEDGE DOCUMENTS / {entries.length}</p>
          {entries.map((e) => (
            <article className="knowledge" key={e.id}>
              <b>{e.title}</b>
              <small>
                {e.sourceType} · {e.updatedAt.toLocaleDateString()}
              </small>
              <p>
                {e.content.slice(0, 280)}
                {e.content.length > 280 ? "…" : ""}
              </p>
            </article>
          ))}
          {!entries.length && (
            <p className="muted">
              No imported knowledge. Paste a Markdown export to begin.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
