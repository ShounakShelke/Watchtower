import { prisma } from "./prisma";
import { UserContextSnapshot, Priority, TaskStatus } from "./types";
import { calculateTaskScore } from "./priority";
import { createHash } from "crypto";

export async function assembleUserContext(userId: string): Promise<{
  snapshot: UserContextSnapshot;
  promptText: string;
  contextHash: string;
}> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const next7Days = new Date(now.getTime() + 7 * 86400000);

  const [
    userRecord,
    todayEvents,
    upcomingEvents,
    tasks,
    projects,
    activeFocus,
    recentActivities,
    activePlan,
    memories,
    patterns,
    integration,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: { lte: endOfDay },
        endTime: { gte: startOfDay },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: { gt: endOfDay, lte: next7Days },
      },
      orderBy: { startTime: "asc" },
      take: 6,
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED] },
      },
      include: { project: true },
      take: 30,
    }),
    prisma.project.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        tasks: { where: { status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] } } },
      },
      take: 8,
    }),
    prisma.focusSession.findFirst({
      where: { userId, endedAt: null },
      include: { task: true, project: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.dailyPlan.findFirst({
      where: { userId, date: startOfDay, status: "ACTIVE" },
      include: { items: { orderBy: { order: "asc" } } },
    }),
    prisma.memory.findMany({
      where: { userId },
      orderBy: { confidence: "desc" },
      take: 10,
    }),
    prisma.behaviorPattern.findMany({
      where: { userId },
      take: 5,
    }),
    prisma.integration.findFirst({
      where: { userId, provider: "google" },
    }),
  ]);

  if (!userRecord) {
    throw new Error(`User with ID ${userId} not found.`);
  }

  // Calculate free slots for today
  const freeSlots: { start: string; end: string; durationMinutes: number }[] = [];
  let cursor = Math.max(now.getTime(), startOfDay.getTime() + 8 * 3600000); // from 8 AM or now
  const dayCutoff = startOfDay.getTime() + 22 * 3600000; // 10 PM

  for (const ev of todayEvents) {
    const s = ev.startTime.getTime();
    const e = ev.endTime.getTime();
    if (s > cursor) {
      const diffMins = Math.floor((s - cursor) / 60000);
      if (diffMins >= 20) {
        freeSlots.push({
          start: new Date(cursor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          end: new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          durationMinutes: diffMins,
        });
      }
    }
    cursor = Math.max(cursor, e);
  }
  if (cursor < dayCutoff) {
    const diffMins = Math.floor((dayCutoff - cursor) / 60000);
    if (diffMins >= 20) {
      freeSlots.push({
        start: new Date(cursor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        end: new Date(dayCutoff).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        durationMinutes: diffMins,
      });
    }
  }

  // Rank tasks deterministically
  const nowMs = now.getTime();
  const ranked = tasks
    .map((t) => {
      const { score, reason } = calculateTaskScore(t, nowMs);
      return {
        id: t.id,
        title: t.title,
        projectName: t.project?.name || "Unassigned",
        priority: t.priority,
        score,
        reason,
        estimatedMinutes: t.estimatedMinutes,
        status: t.status,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      };
    })
    .sort((a, b) => b.score - a.score);

  const snapshot: UserContextSnapshot = {
    user: {
      id: userRecord.id,
      email: userRecord.email,
      displayName: userRecord.displayName,
      timezone: userRecord.timezone,
    },
    now: now.toISOString(),
    currentDayOfWeek: now.toLocaleDateString("en-US", { weekday: "long" }),
    currentTimeStr: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    calendar: {
      todayEvents: todayEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        endTime: e.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        eventType: e.eventType,
        isFixed: e.isFixed,
      })),
      upcomingEvents: upcomingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        endTime: e.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        eventType: e.eventType,
      })),
      freeSlots,
      isConnected: integration?.status === "CONNECTED",
    },
    tasks: {
      ranked: ranked.slice(0, 10),
      urgentCount: ranked.filter((t) => t.priority === Priority.CRITICAL || t.score >= 50).length,
      totalOpenCount: tasks.length,
    },
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      priority: p.priority,
      deadline: p.deadline ? p.deadline.toLocaleDateString() : null,
      openTaskCount: p.tasks.length,
    })),
    activeFocusSession: activeFocus
      ? {
          id: activeFocus.id,
          taskTitle: activeFocus.task?.title,
          projectName: activeFocus.project?.name,
          startedAt: activeFocus.startedAt.toISOString(),
          elapsedMinutes: Math.floor((nowMs - activeFocus.startedAt.getTime()) / 60000),
        }
      : null,
    recentActivity: recentActivities.map((a) => ({
      id: a.id,
      activityType: a.activityType,
      description: a.description,
      durationMinutes: a.durationMinutes,
      createdAt: a.createdAt.toISOString(),
    })),
    activePlan: activePlan
      ? {
          id: activePlan.id,
          status: activePlan.status as any,
          summary: activePlan.summary,
          items: activePlan.items.map((i) => ({
            id: i.id,
            title: i.title,
            type: i.type as any,
            startAt: i.startAt ? i.startAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
            endAt: i.endAt ? i.endAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
            durationMinutes: i.durationMinutes,
            priority: i.priority,
            rationale: i.rationale,
            status: i.status,
          })),
        }
      : null,
    memories: memories.map((m) => ({
      id: m.id,
      category: m.category,
      key: m.key,
      value: m.value,
    })),
    behaviorPatterns: patterns.map((p) => ({
      patternType: p.patternType,
      value: p.valueJson as any,
      confidence: p.confidence,
    })),
  };

  // Structured compact prompt text
  const promptLines: string[] = [
    `CURRENT TIME: ${snapshot.currentDayOfWeek}, ${snapshot.currentTimeStr} (Timezone: ${snapshot.user.timezone})`,
    `USER: ${snapshot.user.displayName}`,
    `CALENDAR STATUS: ${snapshot.calendar.isConnected ? "CONNECTED" : "DISCONNECTED (No Google Sync)"}`,
  ];

  if (snapshot.calendar.todayEvents.length > 0) {
    promptLines.push(
      `TODAY'S SCHEDULE: ${snapshot.calendar.todayEvents
        .map((e) => `[${e.startTime}-${e.endTime}] ${e.title} (${e.isFixed ? "Fixed" : "Flexible"})`)
        .join("; ")}`
    );
  } else {
    promptLines.push("TODAY'S SCHEDULE: No events scheduled.");
  }

  if (snapshot.calendar.freeSlots.length > 0) {
    promptLines.push(
      `AVAILABLE FREE SLOTS TODAY: ${snapshot.calendar.freeSlots
        .map((s) => `${s.start}-${s.end} (${s.durationMinutes}m)`)
        .join(", ")}`
    );
  }

  if (snapshot.activeFocusSession) {
    promptLines.push(
      `ACTIVE FOCUS SESSION: Working on "${snapshot.activeFocusSession.taskTitle || snapshot.activeFocusSession.projectName}" for ${snapshot.activeFocusSession.elapsedMinutes} mins.`
    );
  }

  if (snapshot.tasks.ranked.length > 0) {
    promptLines.push("TOP DETERMINISTICALLY RANKED TASKS:");
    for (const t of snapshot.tasks.ranked.slice(0, 5)) {
      promptLines.push(
        ` - [ID: ${t.id}] "${t.title}" (Project: ${t.projectName}, Priority: ${t.priority}, Score: ${t.score}) -> Reason: ${t.reason}`
      );
    }
  }

  if (snapshot.activePlan) {
    promptLines.push(
      `ACTIVE DAILY PLAN: "${snapshot.activePlan.summary || "In progress"}" with ${
        snapshot.activePlan.items.length
      } scheduled items.`
    );
  }

  if (snapshot.memories.length > 0) {
    promptLines.push(
      `KNOWN USER PREFERENCES & MEMORY: ${snapshot.memories
        .map((m) => `[${m.key}]: ${m.value}`)
        .join("; ")}`
    );
  }

  const promptText = promptLines.join("\n");
  const contextHash = createHash("sha256").update(promptText).digest("hex").slice(0, 16);

  return { snapshot, promptText, contextHash };
}

