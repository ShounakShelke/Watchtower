import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateDailyPlan } from "../lib/planning/engine";
import { calculateTaskScore } from "../lib/priority";
import { executeWithPermissions } from "../lib/agent/permissions";
import { tools } from "../lib/tools/definitions";
import { hybridSearch } from "../lib/retrieval/engine";
import { Priority, TaskStatus } from "../lib/types";
import { prisma } from "../lib/prisma";

describe("Watchtower V2 Acceptance Test Suite", () => {
  // A1: Plan My Day
  it("A1 — Plan My Day: generates ordered plan with buffer and fixed slots", async () => {
    const origFindManyEvents = prisma.calendarEvent.findMany;
    const origFindManyTasks = prisma.task.findMany;
    const origAggActivity = prisma.activity.aggregate;

    prisma.calendarEvent.findMany = (async () => [
      {
        id: "ev-ml",
        userId: "test-user",
        title: "ML Seminar",
        startTime: new Date("2026-10-09T09:30:00Z"),
        endTime: new Date("2026-10-09T11:00:00Z"),
        eventType: "CLASS",
        isFixed: true,
        syncedAt: new Date(),
      },
    ]) as any;

    prisma.task.findMany = (async () => [
      {
        id: "task-gt2",
        userId: "test-user",
        title: "Finish GT2 preprocessing",
        priority: Priority.CRITICAL,
        dueDate: new Date("2026-10-10T12:00:00Z"),
        status: TaskStatus.IN_PROGRESS,
        estimatedMinutes: 75,
        project: { name: "GT2" },
      },
    ]) as any;

    prisma.activity.aggregate = (async () => ({ _sum: { durationMinutes: 45 } })) as any;

    try {
      const plan = await generateDailyPlan("test-user", { maxWorkHours: 4 });
      assert.ok(plan.items.length >= 2);
      assert.ok(plan.items.some((i) => i.type === "FIXED"));
      assert.ok(plan.items.some((i) => i.type === "RECOMMENDED"));
      assert.ok(plan.summary.includes("Today's Plan"));
    } finally {
      prisma.calendarEvent.findMany = origFindManyEvents;
      prisma.task.findMany = origFindManyTasks;
      prisma.activity.aggregate = origAggActivity;
    }
  });

  // A2: Current Recommendation with Reason
  it("A2 — Current Recommendation: selects highest score and provides rationale", () => {
    const now = new Date("2026-10-09T08:00:00Z").getTime();
    const taskUrgent = {
      priority: Priority.CRITICAL,
      dueDate: new Date("2026-10-09T17:00:00Z"),
      status: TaskStatus.IN_PROGRESS,
    };
    const taskNormal = {
      priority: Priority.MEDIUM,
      dueDate: new Date("2026-10-25T17:00:00Z"),
      status: TaskStatus.TODO,
    };

    const scoreUrgent = calculateTaskScore(taskUrgent, now);
    const scoreNormal = calculateTaskScore(taskNormal, now);

    assert.ok(scoreUrgent.score > scoreNormal.score);
    assert.ok(scoreUrgent.reason.includes("critical"));
    assert.ok(scoreUrgent.reason.includes("due today"));
  });

  // A3: Internal Task Creation
  it("A3 — Internal Task Creation: auto-executes and logs activity", async () => {
    const taskCreateTool = tools.find((t) => t.name === "tasks_create");
    assert.ok(taskCreateTool);
    assert.equal(taskCreateTool?.permission, "INTERNAL_WRITE");

    const origCreateTask = prisma.task.create;
    const origCreateActivity = prisma.activity.create;
    const origFindProjects = prisma.project.findMany;

    let createdTaskTitle = "";
    let activityLogged = false;

    prisma.project.findMany = (async () => [{ id: "p-gt2", name: "GT2" }]) as any;
    prisma.task.create = (async (args: any) => {
      createdTaskTitle = args.data.title;
      return { id: "t-1", ...args.data, project: { name: "GT2" } };
    }) as any;
    prisma.activity.create = (async () => {
      activityLogged = true;
      return {};
    }) as any;

    try {
      const outcome = await executeWithPermissions(
        taskCreateTool!,
        { title: "GT2 telemetry data cleanup", priority: "HIGH" },
        { userId: "test-user" }
      );

      assert.equal(outcome.status, "SUCCESS");
      assert.equal(createdTaskTitle, "GT2 telemetry data cleanup");
      assert.equal(activityLogged, true);
    } finally {
      prisma.task.create = origCreateTask;
      prisma.activity.create = origCreateActivity;
      prisma.project.findMany = origFindProjects;
    }
  });

  // A4: External Calendar Mutation requires confirmation
  it("A4 — External Calendar: stages action without external mutation", async () => {
    const calendarMoveTool = tools.find((t) => t.name === "calendar_move_event");
    assert.ok(calendarMoveTool);
    assert.equal(calendarMoveTool?.permission, "EXTERNAL_WRITE");

    const origActionCreate = prisma.agentActionRequest.create;
    const origCalFind = prisma.calendarEvent.findFirst;

    prisma.calendarEvent.findFirst = (async () => ({
      id: "ev-ml",
      title: "ML Class",
      startTime: new Date("2026-10-09T09:00:00Z"),
      endTime: new Date("2026-10-09T10:00:00Z"),
    })) as any;

    prisma.agentActionRequest.create = (async (args: any) => ({
      id: "action-req-999",
      ...args.data,
    })) as any;

    try {
      const outcome = await executeWithPermissions(
        calendarMoveTool!,
        {
          eventId: "ev-ml",
          newStartTime: "2026-10-10T09:00:00Z",
          newEndTime: "2026-10-10T10:00:00Z",
          reason: "Rescheduling class",
        },
        { userId: "test-user" }
      );

      assert.equal(outcome.status, "NEEDS_CONFIRMATION");
      assert.ok(outcome.actionRequest);
      assert.equal(outcome.actionRequest?.actionType, "MOVE_EVENT");
      assert.ok(outcome.actionRequest?.before);
    } finally {
      prisma.agentActionRequest.create = origActionCreate;
      prisma.calendarEvent.findFirst = origCalFind;
    }
  });

  // B2: Limited Time Constraint (One Hour)
  it("B2 — Limited Time: restricts scheduled tasks to available minute budget", async () => {
    const origFindManyEvents = prisma.calendarEvent.findMany;
    const origFindManyTasks = prisma.task.findMany;
    const origAggActivity = prisma.activity.aggregate;

    prisma.calendarEvent.findMany = (async () => []) as any;
    prisma.task.findMany = (async () => [
      {
        id: "t-1",
        title: "Task One",
        priority: Priority.HIGH,
        estimatedMinutes: 45,
        status: TaskStatus.TODO,
        dueDate: null,
      },
      {
        id: "t-2",
        title: "Task Two",
        priority: Priority.HIGH,
        estimatedMinutes: 60,
        status: TaskStatus.TODO,
        dueDate: null,
      },
    ]) as any;
    prisma.activity.aggregate = (async () => ({ _sum: { durationMinutes: 0 } })) as any;

    try {
      // User only has 50 minutes
      const plan = await generateDailyPlan("test-user", { availableMinutes: 50 });
      const recs = plan.items.filter((i) => i.type === "RECOMMENDED");
      // Only Task One should fit inside 50 minutes
      assert.equal(recs.length, 1);
      assert.equal(recs[0].title, "Task One");
      // Task Two is presented as an alternative
      assert.ok(plan.alternatives?.some((a) => a.title === "Task Two"));
    } finally {
      prisma.calendarEvent.findMany = origFindManyEvents;
      prisma.task.findMany = origFindManyTasks;
      prisma.activity.aggregate = origAggActivity;
    }
  });

  // B3: Rest & Recovery
  it("B3 — Fatigue / Rest Advice: advises rest without negative messaging", async () => {
    const origFindManyEvents = prisma.calendarEvent.findMany;
    const origFindManyTasks = prisma.task.findMany;
    const origAggActivity = prisma.activity.aggregate;

    prisma.calendarEvent.findMany = (async () => []) as any;
    prisma.task.findMany = (async () => []) as any;
    prisma.activity.aggregate = (async () => ({ _sum: { durationMinutes: 380 } })) as any;

    try {
      const plan = await generateDailyPlan("test-user", { tired: true });
      assert.equal(plan.restAdvised, true);
      assert.ok(plan.items.some((i) => i.type === "REST"));
      assert.ok(plan.summary.includes("Rest & Recovery"));
    } finally {
      prisma.calendarEvent.findMany = origFindManyEvents;
      prisma.task.findMany = origFindManyTasks;
      prisma.activity.aggregate = origAggActivity;
    }
  });

  // C1: Historical Knowledge Retrieval
  it("C1 — Historical Knowledge: retrieves decisions accurately", async () => {
    const origKnowledge = prisma.knowledge.findMany;
    const origMemory = prisma.memory.findMany;
    const origProject = prisma.project.findMany;

    prisma.knowledge.findMany = (async () => [
      {
        id: "k-med",
        userId: "test-user",
        title: "MedLMP Zero-Shot Evaluation Decision",
        content: "Decided to evaluate PubMedQA on 70B parameter models with chain-of-thought verification.",
        sourceType: "chatgpt_import",
        embeddings: [],
      },
    ]) as any;
    prisma.memory.findMany = (async () => []) as any;
    prisma.project.findMany = (async () => []) as any;

    try {
      const searchRes = await hybridSearch("test-user", "What did I decide about MedLMP?");
      assert.ok(searchRes.length > 0);
      assert.equal(searchRes[0].id, "k-med");
      assert.ok(searchRes[0].snippet.includes("PubMedQA"));
    } finally {
      prisma.knowledge.findMany = origKnowledge;
      prisma.memory.findMany = origMemory;
      prisma.project.findMany = origProject;
    }
  });
});

