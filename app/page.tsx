import Link from "next/link";
import { dashboardData } from "@/lib/data";
import { rankedTasks } from "@/lib/agent";
import { DashboardClock } from "@/components/clock";
import { PlanView } from "@/components/plan-view";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const nav = [
  "Home",
  "Agent",
  "Tasks",
  "Projects",
  "Calendar",
  "Knowledge",
  "Intelligence",
  "Analytics",
  "Focus",
  "Settings",
];

const hrefs: Record<string, string> = {
  Home: "/",
  Agent: "/agent",
  Tasks: "/tasks",
  Projects: "/projects",
  Calendar: "/calendar",
  Knowledge: "/knowledge",
  Intelligence: "/intelligence",
  Analytics: "/analytics",
  Focus: "/focus",
  Settings: "/settings",
};

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(d);

export default async function Home() {
  let data;
  let ranking;
  let activePlan = null;
  let todayFocusMinutes = 0;
  let todayDoneCount = 0;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [dashData, rank, plan, focusAgg, doneTasks] = await Promise.all([
      dashboardData(),
      rankedTasks(),
      prisma.dailyPlan.findFirst({
        where: { date: today, status: "ACTIVE" },
        include: { items: { orderBy: { order: "asc" } } },
      }),
      prisma.activity.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { durationMinutes: true },
      }),
      prisma.task.count({
        where: { status: "DONE", completedAt: { gte: today } },
      }),
    ]);

    data = dashData;
    ranking = rank;
    todayFocusMinutes = focusAgg._sum.durationMinutes || 0;
    todayDoneCount = doneTasks;

    if (plan) {
      activePlan = {
        id: plan.id,
        summary: plan.summary,
        items: plan.items.map((i) => ({
          id: i.id,
          title: i.title,
          type: i.type as any,
          startAt: i.startAt ? i.startAt.toISOString() : null,
          endAt: i.endAt ? i.endAt.toISOString() : null,
          durationMinutes: i.durationMinutes,
          priority: i.priority as any,
          rationale: i.rationale,
          status: i.status,
        })),
      };
    }
  } catch {
    return (
      <main className="error">
        <h1>WATCHTOWER OFFLINE</h1>
        <p>
          Database connection unavailable. Check DATABASE_URL and run migrations.
          Your credentials remain server-side.
        </p>
      </main>
    );
  }

  const hour = new Date().getHours();
  const phase =
    hour < 12 ? "GOOD MORNING" : hour < 18 ? "MIDDAY STATUS" : "EVENING REVIEW";

  const haveDoneEnough = todayFocusMinutes >= 180 || todayDoneCount >= 3;
  const best = ranking[0];

  return (
    <main>
      <aside>
        <Link href="/" className="brand">
          WATCH<br />TOWER
        </Link>
        <nav>
          {nav.map((n) => (
            <Link className={n === "Home" ? "active" : ""} href={hrefs[n]} key={n}>
              {n}
            </Link>
          ))}
        </nav>
        <div className="system">
          SYSTEM ONLINE<br />
          <span>V2 AUTONOMOUS AGENT ACTIVE</span>
        </div>
      </aside>

      <section className="shell">
        <header>
          <div>
            <p className="eyebrow">PERSONAL AI OPERATING SYSTEM / V2</p>
            <h1>
              {phase}, {data.u.displayName.toUpperCase()}
            </h1>
          </div>
          <DashboardClock />
        </header>

        <div className="brief">
          TODAY’S COMMAND CENTER{" "}
          <span>
            {data.events.length} CALENDAR COMMITMENTS · {ranking.length} OPEN TASKS ·{" "}
            {todayDoneCount} DONE TODAY · {todayFocusMinutes}M FOCUSED
          </span>
        </div>

        {/* Evening "Have I Done Enough?" Card */}
        {hour >= 18 && (
          <div
            style={{
              padding: "16px 20px",
              background: haveDoneEnough ? "#14532d" : "#262626",
              color: "#fff",
              borderRadius: "4px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", margin: 0 }}>
                HAVE I DONE ENOUGH TODAY?
              </p>
              <p style={{ fontSize: "14px", margin: "4px 0 0" }}>
                {haveDoneEnough
                  ? `Yes. You completed ${todayDoneCount} tasks and logged ${todayFocusMinutes} minutes of focused work. Permission to rest, recharge, and disconnect.`
                  : `You logged ${todayFocusMinutes}m of focus and completed ${todayDoneCount} tasks. Wrap up your active item or review priorities for tomorrow.`}
              </p>
            </div>
            {haveDoneEnough && (
              <span style={{ fontSize: "20px" }}>✓</span>
            )}
          </div>
        )}

        <div className="grid hero-grid">
          <section className="panel recommendation">
            <p className="eyebrow">YOUR BEST NEXT ACTION</p>
            {best ? (
              <>
                <h2>{best.title}</h2>
                <p className="meta">
                  {best.project} · {best.priority} · {best.estimatedMinutes || "—"} MIN
                </p>
                <p>{best.reason}</p>
                <div className="actions">
                  <Link href="/focus">START FOCUS</Link>
                  <Link className="ghost" href="/agent">
                    CHOOSE ALTERNATIVE
                  </Link>
                  <Link className="ghost" href="/agent">
                    PLAN MY DAY
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2>NO URGENT WORK OPEN</h2>
                <p>
                  All scheduled tasks are cleared. You have permission to take a break,
                  hydrate, or capture what matters next.
                </p>
              </>
            )}
          </section>

          <section className="panel timeline">
            <p className="eyebrow">TODAY / CALENDAR</p>
            {data.events.length ? (
              data.events.map((e) => (
                <div className="line" key={e.id}>
                  <time>{fmt(e.startTime)}</time>
                  <span>
                    {e.title}
                    <small>
                      {e.eventType} · {e.isFixed ? "FIXED" : "FLEXIBLE"}
                    </small>
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">Calendar connection unavailable or no events today.</p>
            )}
            <Link href="/calendar" className="under">
              CALENDAR STATUS & SYNC →
            </Link>
          </section>
        </div>

        {/* Daily Plan Display */}
        <div style={{ marginTop: "16px" }}>
          <PlanView plan={activePlan} />
        </div>

        <div className="grid lower-grid" style={{ marginTop: "16px" }}>
          <section className="panel">
            <p className="eyebrow">RANKED PRIORITIES</p>
            {ranking.slice(0, 4).map((t, i) => (
              <div className="priority" key={t.id}>
                <b>0{i + 1}</b>
                <span>
                  {t.title}
                  <small>
                    {t.project} · {t.reason}
                  </small>
                </span>
                <em>{t.priority}</em>
              </div>
            ))}
            {!ranking.length && (
              <p className="muted">No open work. Ask the agent to create tasks.</p>
            )}
          </section>

          <section className="panel">
            <p className="eyebrow">ACTIVE PROJECTS</p>
            {data.projects.map((p) => (
              <div className="project" key={p.id}>
                <span>
                  {p.name}
                  <small>
                    {p.status} · {p.priority}
                  </small>
                </span>
                <b>{p.progress}%</b>
                <div>
                  <i style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
            {!data.projects.length && <p className="muted">No projects yet.</p>}
          </section>

          <section className="panel">
            <p className="eyebrow">INTELLIGENCE</p>
            <Link className="under" href="/intelligence">
              VIEW CLUSTERED SIGNALS →
            </Link>
          </section>
        </div>

        <section className="panel reminders" style={{ marginTop: "16px" }}>
          <p className="eyebrow">INTELLIGENT REMINDERS</p>
          {data.reminders.length ? (
            data.reminders.map((r) => (
              <div key={r.id}>
                {r.title}
                <span>
                  {r.priority} · {fmt(r.triggerAt)}
                </span>
              </div>
            ))
          ) : (
            <p className="muted">No active reminders. Watchtower will not spam you.</p>
          )}
        </section>
      </section>
    </main>
  );
}
