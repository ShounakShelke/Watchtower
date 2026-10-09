import { ToolDefinition, ToolExecutionContext, ActionRequestStatus } from "../types";
import { prisma } from "../prisma";

export interface ToolExecutionOutcome {
  status: "SUCCESS" | "ERROR" | "NEEDS_CONFIRMATION";
  result?: any;
  actionRequest?: {
    id: string;
    toolName: string;
    actionType: string;
    target: any;
    before: any;
    proposedAfter: any;
    consequence: string;
  };
  error?: string;
}

export async function executeWithPermissions(
  tool: ToolDefinition,
  input: any,
  context: ToolExecutionContext
): Promise<ToolExecutionOutcome> {
  const { userId, sessionId } = context;

  // Level 0: READ - execute immediately
  if (tool.permission === "READ") {
    try {
      const result = await tool.execute(input, context);
      return { status: "SUCCESS", result };
    } catch (err: any) {
      return { status: "ERROR", error: err.message || "Failed to execute read tool" };
    }
  }

  // Level 1: INTERNAL_WRITE - execute immediately if authenticated
  if (tool.permission === "INTERNAL_WRITE") {
    if (!userId) {
      return { status: "ERROR", error: "Unauthorized: Missing user authentication." };
    }
    try {
      const result = await tool.execute(input, context);
      return { status: "SUCCESS", result };
    } catch (err: any) {
      return { status: "ERROR", error: err.message || "Failed to execute internal write" };
    }
  }

  // Level 2: EXTERNAL_WRITE - MUST halt and create an AgentActionRequest
  if (tool.permission === "EXTERNAL_WRITE") {
    if (!userId) {
      return { status: "ERROR", error: "Unauthorized: Missing user authentication." };
    }

    let beforeJson: any = null;
    let consequence = "Modifies external calendar state.";

    if (tool.name === "calendar_update_event" || tool.name === "calendar_move_event" || tool.name === "calendar_delete_event") {
      const existing = await prisma.calendarEvent.findFirst({
        where: { id: input.eventId, userId },
      });
      if (existing) {
        beforeJson = {
          title: existing.title,
          startTime: existing.startTime.toISOString(),
          endTime: existing.endTime.toISOString(),
          description: existing.description,
        };
      }
    }

    if (tool.name === "calendar_create_event") {
      consequence = `Will schedule "${input.title}" on your Google Calendar from ${new Date(
        input.startTime
      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to ${new Date(
        input.endTime
      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;
    } else if (tool.name === "calendar_move_event") {
      consequence = `Will reschedule event to ${new Date(
        input.newStartTime
      ).toLocaleString()} - ${new Date(input.newEndTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}.`;
    } else if (tool.name === "calendar_delete_event") {
      consequence = `Will remove event from your calendar.`;
    }

    // Persist staged action in AgentActionRequest table
    const expiresAt = new Date(Date.now() + 2 * 3600 * 1000); // 2 hours
    const actionRequest = await prisma.agentActionRequest.create({
      data: {
        userId,
        sessionId: sessionId || null,
        toolName: tool.name,
        actionType: tool.name.replace("calendar_", "").toUpperCase(),
        targetJson: { eventId: input.eventId || null },
        beforeJson,
        proposedAfterJson: input,
        status: "PENDING",
        expiresAt,
      },
    });

    return {
      status: "NEEDS_CONFIRMATION",
      actionRequest: {
        id: actionRequest.id,
        toolName: tool.name,
        actionType: actionRequest.actionType,
        target: actionRequest.targetJson,
        before: beforeJson,
        proposedAfter: input,
        consequence,
      },
    };
  }

  return { status: "ERROR", error: "Unknown permission level." };
}

