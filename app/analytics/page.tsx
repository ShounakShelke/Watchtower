import { AppShell } from "@/components/app-shell";
import { user } from "@/lib/data";
import { getAnalyticsSummary } from "@/lib/analytics/engine";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Analytics() {
  const u = await user();
  const summary = await getAnalyticsSummary(u.id);

  const recentActivity = await prisma.activity.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { project: true },
  });

  return (
    <AppShell active="ANALYTICS">
      <header>
        <div>
          <p className="eyebrow">DECISION & BEHAVIORAL ANALYTICS</p>
          <h1>PERFORMANCE ENGINE</h1>
        </div>
      </header>

      {/* Primary KPI Grid */}
      <section className="stat-grid">
        <div className="panel">
          <p className="eyebrow">FOCUS HOURS (7D)</p>
          <b>{summary.focusHours7d}</b>
          <span>TOTAL HOURS LOGGED</span>
        </div>
        <div className="panel">
          <p className="eyebrow">COMPLETED TASKS (7D)</p>
          <b>{summary.tasksCompleted7d}</b>
          <span>OUT OF {summary.totalOpenTasks} OPEN</span>
        </div>
        <div className="panel">
          <p className="eyebrow">ESTIMATION ACCURACY</p>
          <b>{summary.estimationAccuracyPct}%</b>
          <span>ESTIMATED VS ACTUAL</span>
        </div>
      </section>

      {/* Secondary Metrics & Project Velocity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
        <section className="panel">
          <p className="eyebrow">PLAN ADHERENCE</p>
          <div style={{ marginTop: "12px" }}>
            <span style={{ fontSize: "36px", fontWeight: 700, fontFamily: "var(--display)" }}>
              {summary.planAdherenceRate}%
            </span>
            <p className="muted" style={{ marginTop: "4px" }}>
              Percentage of planned daily blocks completed without postponement or abandonment.
            </p>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">PROJECT VELOCITY</p>
          <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
            {summary.projectVelocities.map((pv) => (
              <div key={pv.projectName} style={{ borderTop: "1px solid var(--line)", paddingTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <b>{pv.projectName}</b>
                  <span>{pv.progress}%</span>
                </div>
                <small className="muted">
                  {pv.completedCount} done · {pv.openCount} remaining
                </small>
              </div>
            ))}
            {summary.projectVelocities.length === 0 && (
              <p className="muted">No active project velocity records.</p>
            )}
          </div>
        </section>
      </div>

      {/* Activity Timeline */}
      <section className="panel activity" style={{ marginTop: "16px" }}>
        <p className="eyebrow">RECENT ACTIVITY TIMELINE</p>
        {recentActivity.map((a) => (
          <div className="record" key={a.id}>
            <div>
              <b>{a.description}</b>
              <small>
                {a.project?.name || "GENERAL"} · {a.createdAt.toLocaleString()}
              </small>
            </div>
            <span>{a.durationMinutes ? `${a.durationMinutes} MIN` : a.activityType}</span>
          </div>
        ))}
        {!recentActivity.length && <p className="muted">No activity logged recently.</p>}
      </section>
    </AppShell>
  );
}
