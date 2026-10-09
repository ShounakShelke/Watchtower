import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ToolDefinition,
  PermissionLevel,
  Priority,
  TaskStatus,
  EventType,
  PlanItemType,
  PlanStatus,
} from "@/lib/types";
import { calculateTaskScore } from "@/lib/priority";

export const tools: ToolDefinition[] = [
  // -------------------------------------------------------------
  // CALENDAR READ TOOLS
  // -------------------------------------------------------------
  {
    name: "calendar_get_today",
    description: "Returns today's normalized scheduled calendar events for the user.",
    permission: "READ",
    schema: z.object({}),
    execute: async (_input, { userId }) => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const events = await prisma.calendarEvent.findMany({
        where: {
          userId,
          startTime: { lte: endOfDay },
          endTime: { gte: startOfDay },
        },
        orderBy: { startTime: "asc" },
      });

      return {
        events: events.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          startTime: e.startTime.toISOString(),
          endTime: e.endTime.toISOString(),
          eventType: e.eventType,
          isFixed: e.isFixed,
        })),
      };
    },
  },

  {
    name: "calendar_get_upcoming",
    description: "Returns upcoming calendar events for the next N days (default 7).",
    permission: "READ",
    schema: z.object({
      days: z.number().int().min(1).max(30).default(7),
    }),
    execute: async ({ days = 7 }, { userId }) => {
      const now = new Date();
      const future = new Date(now.getTime() + days * 86400000);

      const events = await prisma.calendarEvent.findMany({
        where: {
          userId,
          startTime: { gte: now, lte: future },
        },
        orderBy: { startTime: "asc" },
      });

      return {
        events: events.map((e) => ({
          id: e.id,
          title: e.title,
          startTime: e.startTime.toISOString(),
          endTime: e.endTime.toISOString(),
          eventType: e.eventType,
          isFixed: e.isFixed,
        })),
      };
    },
  },

  {
    name: "calendar_get_free_slots",
    description: "Calculates available free time slots between fixed calendar events for today.",
    permission: "READ",
    schema: z.object({
      minDurationMinutes: z.number().int().min(15).default(30),
    }),
    execute: async ({ minDurationMinutes = 30 }, { userId }) => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(22, 0, 0, 0); // Active day ends at 22:00

      const events = await prisma.calendarEvent.findMany({
        where: {
          userId,
          startTime: { lte: endOfDay },
          endTime: { gte: now },
        },
        orderBy: { startTime: "asc" },
      });

      const freeSlots: { start: string; end: string; durationMinutes: number }[] = [];
      let cursor = now.getTime();

      for (const event of events) {
        const evStart = event.startTime.getTime();
        const evEnd = event.endTime.getTime();

        if (evStart > cursor) {
          const gapMinutes = Math.floor((evStart - cursor) / 60000);
          if (gapMinutes >= minDurationMinutes) {
            freeSlots.push({
              start: new Date(cursor).toISOString(),
              end: new Date(evStart).toISOString(),
              durationMinutes: gapMinutes,
            });
          }
        }
        cursor = Math.max(cursor, evEnd);
      }

      if (cursor < endOfDay.getTime()) {
        const remainingMinutes = Math.floor((endOfDay.getTime() - cursor) / 60000);
        if (remainingMinutes >= minDurationMinutes) {
          freeSlots.push({
            start: new Date(cursor).toISOString(),
            end: endOfDay.toISOString(),
            durationMinutes: remainingMinutes,
          });
        }
      }

      return { freeSlots };
    },
  },

  // -------------------------------------------------------------
  // TASKS READ & WRITE TOOLS
  // -------------------------------------------------------------
  {
    name: "tasks_list",
    description: "Lists open or filtered tasks with deterministic priority rankings.",
    permission: "READ",
    schema: z.object({
      status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "ALL"]).optional(),
      projectId: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    execute: async ({ status = "ALL", projectId, limit = 20 }, { userId }) => {
      const where: any = { userId };
      if (status !== "ALL") {
        where.status = status;
      } else {
        where.status = { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED] };
      }
      if (projectId) where.projectId = projectId;

      const tasks = await prisma.task.findMany({
        where,
        include: { project: true },
        take: limit,
      });

      const now = Date.now();
      const ranked = tasks
        .map((t) => {
          const { score, reason } = calculateTaskScore(t, now);
          return {
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            score,
            reason,
            projectName: t.project?.name || "Unassigned",
            projectId: t.projectId,
            dueDate: t.dueDate ? t.dueDate.toISOString() : null,
            estimatedMinutes: t.estimatedMinutes,
            actualMinutes: t.actualMinutes,
          };
        })
        .sort((a, b) => b.score - a.score);

      return { tasks: ranked };
    },
  },

  {
    name: "tasks_create",
    description: "Creates an internal task for the user and logs activity.",
    permission: "INTERNAL_WRITE",
    schema: z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
      projectId: z.string().optional(),
      dueDate: z.string().optional(),
      estimatedMinutes: z.number().int().positive().optional(),
    }),
    execute: async (input, { userId }) => {
      // If projectId not provided, check if title or description matches an existing project name
      let assignedProjectId = input.projectId;
      if (!assignedProjectId) {
        const projects = await prisma.project.findMany({
          where: { userId, status: "ACTIVE" },
        });
        const match = projects.find((p) =>
          input.title.toLowerCase().includes(p.name.toLowerCase())
        );
        if (match) assignedProjectId = match.id;
      }

      const task = await prisma.task.create({
        data: {
          userId,
          title: input.title,
          description: input.description,
          priority: input.priority as any,
          projectId: assignedProjectId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          estimatedMinutes: input.estimatedMinutes,
          source: "agent",
        },
        include: { project: true },
      });

      await prisma.activity.create({
        data: {
          userId,
          taskId: task.id,
          projectId: task.projectId,
          activityType: "TASK_CREATED",
          description: `Created task "${task.title}" via agent.`,
        },
      });

      return {
        task: {
          id: task.id,
          title: task.title,
          priority: task.priority,
          projectName: task.project?.name || null,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          estimatedMinutes: task.estimatedMinutes,
        },
      };
    },
  },

  {
    name: "tasks_update",
    description: "Updates properties of an existing task.",
    permission: "INTERNAL_WRITE",
    schema: z.object({
      taskId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED"]).optional(),
      priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
      dueDate: z.string().nullable().optional(),
      estimatedMinutes: z.number().int().positive().nullable().optional(),
    }),
    execute: async ({ taskId, dueDate, ...data }, { userId }) => {
      const updateData: any = { ...data };
      if (dueDate !== undefined) {
        updateData.dueDate = dueDate ? new Date(dueDate) : null;
      }

      const task = await prisma.task.update({
        where: { id: taskId, userId },
        data: updateData,
        include: { project: true },
      });

      return { task };
    },
  },

  {
    name: "tasks_complete",
    description: "Marks a task as DONE, records completed timestamp and logs user activity.",
    permission: "INTERNAL_WRITE",
    schema: z.object({
      taskId: z.string(),
      actualMinutes: z.number().int().min(0).optional(),
    }),
    execute: async ({ taskId, actualMinutes }, { userId }) => {
      const task = await prisma.task.update({
        where: { id: taskId, userId },
        data: {
          status: TaskStatus.DONE,
          completedAt: new Date(),
          ...(actualMinutes !== undefined ? { actualMinutes } : {}),
        },
        include: { project: true },
      });

      await prisma.activity.create({
        data: {
          userId,
          taskId: task.id,
          projectId: task.projectId,
          activityType: "TASK_COMPLETED",
          description: `Completed task: "${task.title}".`,
          durationMinutes: actualMinutes || task.estimatedMinutes || null,
        },
      });

      return { success: true, taskTitle: task.title };
    },
  },

  // -------------------------------------------------------------
  // PROJECTS READ & WRITE TOOLS
  // -------------------------------------------------------------
  {
    name: "projects_list",
    description: "Lists active and trackable projects with progress and open task counts.",
    permission: "READ",
    schema: z.object({
      status: z.enum(["ACTIVE", "PAUSED", "COMPLETE", "ARCHIVED", "ALL"]).default("ACTIVE"),
    }),
    execute: async ({ status = "ACTIVE" }, { userId }) => {
      const where: any = { userId };
      if (status !== "ALL") where.status = status;

      const projects = await prisma.project.findMany({
        where,
        include: {
          tasks: { where: { status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] } } },
        },
        orderBy: { updatedAt: "desc" },
      });

      return {
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          progress: p.progress,
          priority: p.priority,
          deadline: p.deadline ? p.deadline.toISOString() : null,
          openTaskCount: p.tasks.length,
        })),
      };
    },
  },

  {
    name: "projects_get",
    description: "Returns deep details of a specific project including tasks and milestones.",
    permission: "READ",
    schema: z.object({
      projectId: z.string(),
    }),
    execute: async ({ projectId }, { userId }) => {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        include: {
          milestones: { orderBy: { position: "asc" } },
          tasks: { orderBy: [{ dueDate: "asc" }, { priority: "asc" }] },
        },
      });

      if (!project) throw new Error(`Project with ID ${projectId} not found.`);
      return { project };
    },
  },

  {
    name: "projects_update",
    description: "Updates progress, status, or description of a project.",
    permission: "INTERNAL_WRITE",
    schema: z.object({
      projectId: z.string(),
      progress: z.number().int().min(0).max(100).optional(),
      status: z.enum(["ACTIVE", "PAUSED", "COMPLETE", "ARCHIVED"]).optional(),
      description: z.string().optional(),
    }),
    execute: async ({ projectId, ...data }, { userId }) => {
      const project = await prisma.project.update({
        where: { id: projectId, userId },
        data: data as any,
      });

      await prisma.activity.create({
        data: {
          userId,
          projectId: project.id,
          activityType: "PROJECT_UPDATED",
          description: `Updated project "${project.name}" (progress: ${project.progress}%).`,
        },
      });

      return { project };
    },
  },

  // -------------------------------------------------------------
  // ACTIVITY & FOCUS
  // -------------------------------------------------------------
  {
    name: "activity_get_recent",
    description: "Returns the user's recent recorded activities.",
    permission: "READ",
    schema: z.object({
      limit: z.number().int().min(1).max(50).default(10),
    }),
    execute: async ({ limit = 10 }, { userId }) => {
      const activities = await prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return { activities };
    },
  },

  {
    name: "activity_record",
    description: "Manually records a focus or accomplishment activity entry.",
    permission: "INTERNAL_WRITE",
    schema: z.object({
      description: z.string().min(1),
      activityType: z.string().default("MANUAL_NOTE"),
      durationMinutes: z.number().int().positive().optional(),
      projectId: z.string().optional(),
      taskId: z.string().optional(),
    }),
    execute: async (input, { userId }) => {
      const activity = await prisma.activity.create({
        data: {
          userId,
          description: input.description,
          activityType: input.activityType,
          durationMinutes: input.durationMinutes,
          projectId: input.projectId,
          taskId: input.taskId,
        },
      });
      return { activity };
    },
  },

  {
    name: "focus_get_current",
    description: "Returns the active focus session if one is currently in progress.",
    permission: "READ",
    schema: z.object({}),
    execute: async (_input, { userId }) => {
      const activeSession = await prisma.focusSession.findFirst({
        where: { userId, endedAt: null },
        include: { task: true, project: true },
        orderBy: { startedAt: "desc" },
      });

      if (!activeSession) return { active: null };

      const elapsed = Math.floor((Date.now() - activeSession.startedAt.getTime()) / 60000);
      return {
        active: {
          id: activeSession.id,
          taskTitle: activeSession.task?.title,
          projectName: activeSession.project?.name,
          startedAt: activeSession.startedAt.toISOString(),
          elapsedMinutes: elapsed,
        },
      };
    },
  },

  {
    name: "focus_start",
    description: "Starts a new focus session tied to a task or project.",
    permission: "INTERNAL_WRITE",
    schema: z.object({
      taskId: z.string().optional(),
      projectId: z.string().optional(),
      notes: z.string().optional(),
    }),
    execute: async (input, { userId }) => {
      // Close any dangling open session
      const existing = await prisma.focusSession.findFirst({
        where: { userId, endedAt: null },
      });
      if (existing) {
        const duration = Math.floor((Date.now() - existing.startedAt.getTime()) / 60000);
        await prisma.focusSession.update({
          where: { id: existing.id },
          data: { endedAt: new Date(), durationMinutes: Math.max(duration, 1) },
        });
      }

      const session = await prisma.focusSession.create({
        data: {
          userId,
          taskId: input.taskId,
          projectId: input.projectId,
          notes: input.notes,
        },
        include: { task: true, project: true },
      });

      return { session };
    },
  },

  {
    name: "focus_end",
    description: "Concludes the active focus session and records total duration.",
    permission: "INTERNAL_WRITE",
    schema: z.object({
      notes: z.string().optional(),
    }),
    execute: async ({ notes }, { userId }) => {
      const activeSession = await prisma.focusSession.findFirst({
        where: { userId, endedAt: null },
        include: { task: true },
      });

      if (!activeSession) return { message: "No active focus session found." };

      const durationMinutes = Math.max(
        1,
        Math.floor((Date.now() - activeSession.startedAt.getTime()) / 60000)
      );

      const updated = await prisma.focusSession.update({
        where: { id: activeSession.id },
        data: {
          endedAt: new Date(),
          durationMinutes,
          notes: notes || activeSession.notes,
        },
      });

      await prisma.activity.create({
        data: {
          userId,
          taskId: activeSession.taskId,
          projectId: activeSession.projectId,
          activityType: "FOCUS_SESSION",
          description: `Focused for ${durationMinutes}m on ${
            activeSession.task?.title || "work"
          }.`,
          durationMinutes,
        },
      });

      return { session: updated, durationMinutes };
    },
  },

  // -------------------------------------------------------------
  // MEMORY & KNOWLEDGE
  // -------------------------------------------------------------
  {
    name: "memory_search",
    description: "Searches durable approved memories and preferences.",
    permission: "READ",
    schema: z.object({
      query: z.string().min(1),
    }),
    execute: async ({ query }, { userId }) => {
      const memories = await prisma.memory.findMany({
        where: {
          userId,
          OR: [
            { key: { contains: query, mode: "insensitive" } },
            { value: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 10,
      });
      return { memories };
    },
  },

  {
    name: "knowledge_search",
    description: "Searches imported historical knowledge, documents, and research notes.",
    permission: "READ",
    schema: z.object({
      query: z.string().min(1),
    }),
    execute: async ({ query }, { userId }) => {
      const results = await prisma.knowledge.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 8,
      });
      return {
        results: results.map((r) => ({
          id: r.id,
          title: r.title,
          snippet: r.content.slice(0, 300),
          sourceType: r.sourceType,
        })),
      };
    },
  },

  {
    name: "memory_create_candidate",
    description: "Proposes a new candidate fact or preference for durable memory awaiting approval.",
    permission: "INTERNAL_WRITE",
    schema: z.object({
      category: z.string(),
      key: z.string(),
      value: z.string(),
      reason: z.string(),
      confidence: z.number().min(0).max(1).default(0.7),
    }),
    execute: async (input, { userId }) => {
      const candidate = await prisma.memoryCandidate.create({
        data: {
          userId,
          category: input.category,
          key: input.key,
          value: input.value,
          reason: input.reason,
          confidence: input.confidence,
          sourceType: "agent_inference",
        },
      });
      return { candidateId: candidate.id, status: candidate.status };
    },
  },

  // -------------------------------------------------------------
  // REMINDERS
  // -------------------------------------------------------------
  {
    name: "reminders_list",
    description: "Lists active pending reminders.",
    permission: "READ",
    schema: z.object({}),
    execute: async (_input, { userId }) => {
      const reminders = await prisma.reminder.findMany({
        where: { userId, status: "PENDING" },
        orderBy: { triggerAt: "asc" },
      });
      return { reminders };
    },
  },

  {
    name: "reminders_create",
    description: "Creates an internal reminder with trigger date/time.",
    permission: "INTERNAL_WRITE",
    schema: z.object({
      title: z.string().min(1),
      triggerAt: z.string(),
      description: z.string().optional(),
      priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
    }),
    execute: async (input, { userId }) => {
      const reminder = await prisma.reminder.create({
        data: {
          userId,
          title: input.title,
          triggerAt: new Date(input.triggerAt),
          description: input.description,
          priority: input.priority as any,
        },
      });
      return { reminder };
    },
  },

  // -------------------------------------------------------------
  // DAILY PLANNING TOOLS
  // -------------------------------------------------------------
  {
    name: "daily_plan_create",
    description: "Creates a structured daily plan with ordered time blocks.",
    permission: "INTERNAL_WRITE",
    schema: z.object({
      summary: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          type: z.enum(["FIXED", "RECOMMENDED", "OPTIONAL", "BUFFER", "REST"]),
          startAt: z.string().optional(),
          endAt: z.string().optional(),
          durationMinutes: z.number().int().positive().optional(),
          priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
          rationale: z.string().optional(),
          taskId: z.string().optional(),
          calendarEventId: z.string().optional(),
        })
      ),
    }),
    execute: async ({ summary, items }, { userId }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Mark previous plans for today as REVISED/COMPLETED
      await prisma.dailyPlan.updateMany({
        where: { userId, date: today, status: PlanStatus.ACTIVE },
        data: { status: PlanStatus.REVISED },
      });

      const plan = await prisma.dailyPlan.create({
        data: {
          userId,
          date: today,
          status: PlanStatus.ACTIVE,
          summary,
          generatedBy: "agent",
          items: {
            create: items.map((item: any, idx: number) => ({
              title: item.title,
              type: item.type as any,
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

      return { planId: plan.id, itemCount: plan.items.length };
    },
  },

  {
    name: "daily_plan_revise",
    description: "Revises an existing plan when circumstances or user constraints change.",
    permission: "INTERNAL_WRITE",
    schema: z.object({
      planId: z.string(),
      trigger: z.string(),
      reason: z.string(),
      summary: z.string().optional(),
      items: z.array(
        z.object({
          title: z.string(),
          type: z.enum(["FIXED", "RECOMMENDED", "OPTIONAL", "BUFFER", "REST"]),
          startAt: z.string().optional(),
          endAt: z.string().optional(),
          durationMinutes: z.number().int().positive().optional(),
          priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
          rationale: z.string().optional(),
          taskId: z.string().optional(),
        })
      ),
    }),
    execute: async ({ planId, trigger, reason, summary, items }, { userId }) => {
      const existingPlan = await prisma.dailyPlan.findFirst({
        where: { id: planId, userId },
        include: { items: true },
      });
      if (!existingPlan) throw new Error("Target plan not found.");

      // Save revision snapshot
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

      // Delete old items and insert revised items
      await prisma.planItem.deleteMany({ where: { planId: existingPlan.id } });
      const updated = await prisma.dailyPlan.update({
        where: { id: existingPlan.id },
        data: {
          status: PlanStatus.ACTIVE,
          summary: summary || existingPlan.summary,
          items: {
            create: items.map((item: any, idx: number) => ({
              title: item.title,
              type: item.type as any,
              startAt: item.startAt ? new Date(item.startAt) : null,
              endAt: item.endAt ? new Date(item.endAt) : null,
              durationMinutes: item.durationMinutes,
              priority: item.priority as any,
              rationale: item.rationale,
              taskId: item.taskId,
              order: idx,
            })),
          },
        },
        include: { items: { orderBy: { order: "asc" } } },
      });

      return { plan: updated };
    },
  },

  // -------------------------------------------------------------
  // EXTERNAL CALENDAR WRITE TOOLS (STAGED VIA PERMISSION GUARDRAILS)
  // -------------------------------------------------------------
  {
    name: "calendar_create_event",
    description: "Schedules a new event on external Google Calendar. (Requires confirmation)",
    permission: "EXTERNAL_WRITE",
    schema: z.object({
      title: z.string().min(1),
      startTime: z.string(),
      endTime: z.string(),
      description: z.string().optional(),
      eventType: z.enum([
        "CLASS",
        "MEETING",
        "APPOINTMENT",
        "TRAVEL",
        "STUDY",
        "PROJECT",
        "BREAK",
        "OTHER",
      ]).default("OTHER"),
    }),
    execute: async () => {
      // Handled by permission middleware staging into AgentActionRequest
      return { status: "STAGED_FOR_CONFIRMATION" };
    },
  },

  {
    name: "calendar_update_event",
    description: "Updates an existing event on Google Calendar. (Requires confirmation)",
    permission: "EXTERNAL_WRITE",
    schema: z.object({
      eventId: z.string(),
      title: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      description: z.string().optional(),
    }),
    execute: async () => {
      return { status: "STAGED_FOR_CONFIRMATION" };
    },
  },

  {
    name: "calendar_delete_event",
    description: "Deletes an event from Google Calendar. (Requires confirmation)",
    permission: "EXTERNAL_WRITE",
    schema: z.object({
      eventId: z.string(),
      reason: z.string().optional(),
    }),
    execute: async () => {
      return { status: "STAGED_FOR_CONFIRMATION" };
    },
  },

  {
    name: "calendar_move_event",
    description: "Reschedules or moves an event to a new date/time. (Requires confirmation)",
    permission: "EXTERNAL_WRITE",
    schema: z.object({
      eventId: z.string(),
      newStartTime: z.string(),
      newEndTime: z.string(),
      reason: z.string().optional(),
    }),
    execute: async () => {
      return { status: "STAGED_FOR_CONFIRMATION" };
    },
  },
];
