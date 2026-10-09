import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateDailyPlan } from "../lib/planning/engine";
import { prisma } from "../lib/prisma";

describe("Daily Planning Engine", () => {
  it("should recommend rest when user indicates fatigue", async () => {
    // Mock prisma calls
    const origFindManyEvents = prisma.calendarEvent.findMany;
    const origFindManyTasks = prisma.task.findMany;
    const origAggActivity = prisma.activity.aggregate;

    prisma.calendarEvent.findMany = (async () => []) as any;
    prisma.task.findMany = (async () => []) as any;
    prisma.activity.aggregate = (async () => ({ _sum: { durationMinutes: 120 } })) as any;

    try {
      const plan = await generateDailyPlan("test-user", { tired: true });
      assert.equal(plan.restAdvised, true);
      assert.ok(plan.items.some((i) => i.type === "REST"));
      assert.ok(plan.summary.includes("Rest & Recovery Plan"));
    } finally {
      prisma.calendarEvent.findMany = origFindManyEvents;
      prisma.task.findMany = origFindManyTasks;
      prisma.activity.aggregate = origAggActivity;
    }
  });

  it("should allocate fixed calendar commitments and recommended task blocks", async () => {
    const origFindManyEvents = prisma.calendarEvent.findMany;
    const origFindManyTasks = prisma.task.findMany;
    const origAggActivity = prisma.activity.aggregate;

    const mockEvent = {
      id: "ev-1",
      userId: "test-user",
      title: "Team Standup",
      startTime: new Date("2026-10-08T10:00:00Z"),
      endTime: new Date("2026-10-08T10:30:00Z"),
      eventType: "MEETING",
      isFixed: true,
      syncedAt: new Date(),
    };

    const mockTask = {
      id: "task-1",
      userId: "test-user",
      title: "Write documentation",
      priority: "HIGH",
      status: "TODO",
      dueDate: new Date("2026-10-08T18:00:00Z"),
      estimatedMinutes: 60,
      actualMinutes: 0,
      project: { name: "Watchtower" },
    };

    prisma.calendarEvent.findMany = (async () => [mockEvent]) as any;
    prisma.task.findMany = (async () => [mockTask]) as any;
    prisma.activity.aggregate = (async () => ({ _sum: { durationMinutes: 30 } })) as any;

    try {
      const plan = await generateDailyPlan("test-user", { availableMinutes: 120 });
      assert.ok(plan.items.length >= 2);
      const fixedItem = plan.items.find((i) => i.type === "FIXED");
      const recItem = plan.items.find((i) => i.type === "RECOMMENDED");

      assert.ok(fixedItem);
      assert.equal(fixedItem?.title, "Team Standup");

      assert.ok(recItem);
      assert.equal(recItem?.title, "Write documentation");
    } finally {
      prisma.calendarEvent.findMany = origFindManyEvents;
      prisma.task.findMany = origFindManyTasks;
      prisma.activity.aggregate = origAggActivity;
    }
  });
});

