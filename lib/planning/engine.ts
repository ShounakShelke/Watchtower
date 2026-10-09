import { prisma } from "../prisma";
import { PlanItemType, PlanStatus, Priority, TaskStatus } from "../types";
import { calculateTaskScore } from "../priority";

export interface GeneratedPlanResult {
  summary: string;
  items: {
    title: string;
    type: PlanItemType;
    startAt?: string;
    endAt?: string;
    durationMinutes: number;
    priority: Priority;
    rationale: string;
    taskId?: string;
    calendarEventId?: string;
  }[];
  alternatives?: {
    title: string;
    projectName: string;
    priority: Priority;
    reason: string;
  }[];
  restAdvised?: boolean;
}

/**
 * Deterministic Day Planning Engine.
 * Constructs an optimal timeline using available free slots, fixed events, and ranked tasks.
 */
export async function generateDailyPlan(
  userId: string,
  options: {
    maxWorkHours?: number;
    tired?: boolean;
    availableMinutes?: number;
  } = {}
): Promise<GeneratedPlanResult> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [events, tasks, todayActivity] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: { lte: endOfDay },
        endTime: { gte: startOfDay },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
      },
      include: { project: true },
    }),
    prisma.activity.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
      _sum: { durationMinutes: true },
    }),
  ]);

  const focusedMinsToday = todayActivity._sum.durationMinutes || 0;

  // Check Rest Sufficiency condition: if user is tired OR has already worked 6+ hours
  if (options.tired || focusedMinsToday >= 360) {
    return {
      summary: "Rest & Recovery Plan — You have completed substantial deep work today.",
      restAdvised: true,
      items: [
        {
          title: "Rest & Disconnect",
          type: "REST",
          durationMinutes: 60,
          priority: Priority.LOW,
          rationale: `You have logged ${focusedMinsToday}m of focused activity today. Taking time to recharge will protect your cognitive performance tomorrow.`,
        },
        {
          title: "Light review / organize tomorrow",
          type: "OPTIONAL",
          durationMinutes: 20,
          priority: Priority.LOW,
          rationale: "Only do this if you have the energy; otherwise, stop for the evening.",
        },
      ],
    };
  }

  // Score and rank all tasks
  const rankedTasks = tasks
    .map((t) => {
      const { score, reason } = calculateTaskScore(t, now.getTime());
      return {
        ...t,
        score,
        reason,
      };
    })
    .sort((a, b) => b.score - a.score);

  const items: GeneratedPlanResult["items"] = [];

  // Add fixed calendar commitments first
  for (const ev of events) {
    if (ev.isFixed) {
      const duration = Math.max(
        15,
        Math.floor((ev.endTime.getTime() - ev.startTime.getTime()) / 60000)
      );
      items.push({
        title: ev.title,
        type: "FIXED",
        startAt: ev.startTime.toISOString(),
        endAt: ev.endTime.toISOString(),
        durationMinutes: duration,
        priority: Priority.HIGH,
        rationale: "Fixed calendar commitment.",
        calendarEventId: ev.id,
      });
    }
  }

  // Allocate top tasks into recommended blocks
  let taskBudgetMinutes = options.availableMinutes || (options.maxWorkHours ? options.maxWorkHours * 60 : 240); // default 4 hrs focus
  let allocatedMinutes = 0;

  for (const t of rankedTasks) {
    const taskDuration = t.estimatedMinutes || 45;
    if (allocatedMinutes + taskDuration > taskBudgetMinutes && allocatedMinutes > 0) {
      break;
    }
    if (allocatedMinutes >= taskBudgetMinutes) break;

    items.push({
      title: t.title,
      type: "RECOMMENDED",
      durationMinutes: Math.min(taskDuration, 90),
      priority: t.priority as any,
      rationale: t.reason,
      taskId: t.id,
    });

    allocatedMinutes += taskDuration;

    // Insert a buffer/break after every 90 minutes of focus
    if (allocatedMinutes >= 90 && allocatedMinutes < taskBudgetMinutes) {
      items.push({
        title: "Cognitive Buffer / Walk & Hydrate",
        type: "BUFFER",
        durationMinutes: 15,
        priority: Priority.LOW,
        rationale: "Rest interval between demanding blocks.",
      });
      allocatedMinutes += 15;
    }
  }

  // Alternatives if the user wants other options
  const alternatives = rankedTasks.slice(items.filter((i) => i.taskId).length, 6).map((t) => ({
    title: t.title,
    projectName: t.project?.name || "General",
    priority: t.priority as any,
    reason: t.reason,
  }));

  const summary = `Today's Plan: ${items.filter((i) => i.type === "RECOMMENDED").length} core focus blocks, ${
    items.filter((i) => i.type === "FIXED").length
  } fixed commitments.`;

  return { summary, items, alternatives };
}

/**
 * Dynamically recomputes and persists a revised daily plan.
 */
export async function replanDay(
  userId: string,
  trigger: string,
  reason: string,
  options: { availableMinutes?: number; tired?: boolean } = {}
) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existingPlan = await prisma.dailyPlan.findFirst({
    where: { userId, date: startOfDay, status: PlanStatus.ACTIVE },
    include: { items: true },
  });

  const generated = await generateDailyPlan(userId, options);

  if (existingPlan) {
    // Record snapshot of previous plan
    await prisma.planRevision.create({
      data: {
        planId: existingPlan.id,
        trigger,
        reason,
        snapshotJson: {
          summary: existingPlan.summary,
          items: existingPlan.items,
        },
      },
    });

    // Replace items with new plan items
    await prisma.planItem.deleteMany({ where: { planId: existingPlan.id } });
    const updated = await prisma.dailyPlan.update({
      where: { id: existingPlan.id },
      data: {
        status: PlanStatus.ACTIVE,
        summary: generated.summary,
        items: {
          create: generated.items.map((item, idx) => ({
            title: item.title,
            type: item.type,
            startAt: item.startAt ? new Date(item.startAt) : null,
            endAt: item.endAt ? new Date(item.endAt) : null,
            durationMinutes: item.durationMinutes,
            priority: item.priority as any,
            rationale: item.rationale,
            taskId: item.taskId,
            calendarEventId: item.calendarEventId,
            order: idx,
          })),
        },
      },
      include: { items: { orderBy: { order: "asc" } } },
    });

    return { plan: updated, alternatives: generated.alternatives };
  } else {
    // Create new plan
    const created = await prisma.dailyPlan.create({
      data: {
        userId,
        date: startOfDay,
        status: PlanStatus.ACTIVE,
        summary: generated.summary,
        generatedBy: "agent",
        items: {
          create: generated.items.map((item, idx) => ({
            title: item.title,
            type: item.type,
            startAt: item.startAt ? new Date(item.startAt) : null,
            endAt: item.endAt ? new Date(item.endAt) : null,
            durationMinutes: item.durationMinutes,
            priority: item.priority as any,
            rationale: item.rationale,
            taskId: item.taskId,
            calendarEventId: item.calendarEventId,
            order: idx,
          })),
        },
      },
      include: { items: { orderBy: { order: "asc" } } },
    });

    return { plan: created, alternatives: generated.alternatives };
  }
}

