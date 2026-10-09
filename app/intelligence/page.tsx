import { AppShell } from "@/components/app-shell";
import { getGdeltNews } from "@/lib/gdelt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Intelligence() {
  // Check clustered news in database first
  const clusters = await prisma.newsCluster.findMany({
    orderBy: [{ importance: "desc" }, { lastSeenAt: "desc" }],
    take: 20,
    include: { items: { include: { newsItem: true }, take: 3 } },
  });

  let ai = [] as Awaited<ReturnType<typeof getGdeltNews>>;
  let motor = [] as Awaited<ReturnType<typeof getGdeltNews>>;

  if (clusters.length === 0) {
    try {
      [ai, motor] = await Promise.all([
        getGdeltNews("ai"),
        getGdeltNews("motorsport"),
      ]);
    } catch {}
  }

  const aiClusters = clusters.filter((c) => c.topic === "AI_ML");
  const motorClusters = clusters.filter((c) => c.topic === "MOTORSPORT");

  return (
    <AppShell active="INTELLIGENCE">
      <header>
        <div>
          <p className="eyebrow">CURATED INTELLIGENCE & CLUSTERING</p>
          <h1>INTELLIGENCE</h1>
        </div>
      </header>

      <div className="brief">
        SIGNAL, NOT NOISE · MULTI-SOURCE GDELT & RSS CLUSTERED
      </div>

      <section className="page-grid">
        {/* AI / ML SECTION */}
        <section className="panel intelligence-list">
          <p className="eyebrow">AI / ML RESEARCH & INDUSTRY</p>
          {aiClusters.length > 0
            ? aiClusters.map((c) => (
                <div
                  key={c.id}
                  style={{
                    borderTop: "1px solid var(--line)",
                    padding: "12px 0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <b>{c.canonicalTitle}</b>
                    <span style={{ fontSize: "10px", color: "var(--gray)", fontWeight: 700 }}>
                      IMPORTANCE {c.importance}/100
                    </span>
                  </div>
                  {c.relevance && (
                    <small style={{ display: "block", color: "#166534", fontWeight: 600, margin: "4px 0" }}>
                      ★ {c.relevance}
                    </small>
                  )}
                  {c.items[0]?.newsItem?.sourceUrl && (
                    <a
                      href={c.items[0].newsItem.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="under"
                      style={{ fontSize: "11px", display: "inline-block", marginTop: "4px" }}
                    >
                      READ CANONICAL SOURCE ↗
                    </a>
                  )}
                </div>
              ))
            : ai.map((x) => (
                <a href={x.url} target="_blank" key={x.url} rel="noopener noreferrer">
                  <b>{x.title}</b>
                  <small>{x.source} · {x.publishedAt || "RECENT"} ↗</small>
                </a>
              ))}
          {!aiClusters.length && !ai.length && (
            <p className="muted">Feed temporarily offline. Check back shortly.</p>
          )}
        </section>

        {/* MOTORSPORT SECTION */}
        <section className="panel intelligence-list">
          <p className="eyebrow">MOTORSPORT & ENDURANCE RACING</p>
          {motorClusters.length > 0
            ? motorClusters.map((c) => (
                <div
                  key={c.id}
                  style={{
                    borderTop: "1px solid var(--line)",
                    padding: "12px 0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <b>{c.canonicalTitle}</b>
                    <span style={{ fontSize: "10px", color: "var(--gray)", fontWeight: 700 }}>
                      IMPORTANCE {c.importance}/100
                    </span>
                  </div>
                  {c.relevance && (
                    <small style={{ display: "block", color: "#1e40af", fontWeight: 600, margin: "4px 0" }}>
                      🏎 {c.relevance}
                    </small>
                  )}
                  {c.items[0]?.newsItem?.sourceUrl && (
                    <a
                      href={c.items[0].newsItem.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="under"
                      style={{ fontSize: "11px", display: "inline-block", marginTop: "4px" }}
                    >
                      READ CANONICAL SOURCE ↗
                    </a>
                  )}
                </div>
              ))
            : motor.map((x) => (
                <a href={x.url} target="_blank" key={x.url} rel="noopener noreferrer">
                  <b>{x.title}</b>
                  <small>{x.source} · {x.publishedAt || "RECENT"} ↗</small>
                </a>
              ))}
          {!motorClusters.length && !motor.length && (
            <p className="muted">Feed temporarily offline. Check back shortly.</p>
          )}
        </section>
      </section>
    </AppShell>
  );
}
