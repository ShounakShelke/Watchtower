import { prisma } from "../prisma";
import { ActionRequestStatus } from "../types";

export async function confirmActionRequest(actionId: string, userId: string) {
  const action = await prisma.agentActionRequest.findFirst({
    where: { id: actionId, userId },
  });

  if (!action) {
    throw new Error("Action request not found.");
  }

  if (action.status !== "PENDING") {
    throw new Error(`Action request cannot be confirmed (current status: ${action.status}).`);
  }

  if (action.expiresAt && action.expiresAt.getTime() < Date.now()) {
    await prisma.agentActionRequest.update({
      where: { id: action.id },
      data: { status: "EXPIRED" },
    });
    throw new Error("This action proposal has expired. Please ask the agent again.");
  }

  const proposed = (action.proposedAfterJson as any) || {};

  try {
    if (action.toolName === "calendar_create_event") {
      const created = await prisma.calendarEvent.create({
        data: {
          userId,
          title: proposed.title,
          description: proposed.description || null,
          startTime: new Date(proposed.startTime),
          endTime: new Date(proposed.endTime),
          eventType: proposed.eventType || "OTHER",
          isFixed: true,
        },
      });

      await prisma.activity.create({
        data: {
          userId,
          activityType: "CALENDAR_EVENT_CREATED",
          description: `Confirmed & created calendar event "${created.title}".`,
        },
      });
    } else if (
      action.toolName === "calendar_update_event" ||
      action.toolName === "calendar_move_event"
    ) {
      const targetEventId = proposed.eventId;
      if (targetEventId) {
        const updateData: any = {};
        if (proposed.title) updateData.title = proposed.title;
        if (proposed.description) updateData.description = proposed.description;
        if (proposed.startTime) updateData.startTime = new Date(proposed.startTime);
        if (proposed.newStartTime) updateData.startTime = new Date(proposed.newStartTime);
        if (proposed.endTime) updateData.endTime = new Date(proposed.endTime);
        if (proposed.newEndTime) updateData.endTime = new Date(proposed.newEndTime);

        await prisma.calendarEvent.update({
          where: { id: targetEventId, userId },
          data: updateData,
        });

        await prisma.activity.create({
          data: {
            userId,
            activityType: "CALENDAR_EVENT_UPDATED",
            description: `Confirmed & updated calendar event.`,
          },
        });
      }
    } else if (action.toolName === "calendar_delete_event") {
      const targetEventId = proposed.eventId;
      if (targetEventId) {
        await prisma.calendarEvent.delete({
          where: { id: targetEventId, userId },
        });

        await prisma.activity.create({
          data: {
            userId,
            activityType: "CALENDAR_EVENT_DELETED",
            description: `Confirmed & deleted calendar event.`,
          },
        });
      }
    }

    const updated = await prisma.agentActionRequest.update({
      where: { id: action.id },
      data: {
        status: "EXECUTED",
        confirmedAt: new Date(),
        executedAt: new Date(),
      },
    });

    return { success: true, action: updated };
  } catch (err: any) {
    await prisma.agentActionRequest.update({
      where: { id: action.id },
      data: {
        status: "FAILED",
        failureReason: err.message,
      },
    });
    throw err;
  }
}

export async function rejectActionRequest(actionId: string, userId: string) {
  const action = await prisma.agentActionRequest.findFirst({
    where: { id: actionId, userId },
  });

  if (!action) {
    throw new Error("Action request not found.");
  }

  const updated = await prisma.agentActionRequest.update({
    where: { id: action.id },
    data: {
      status: "REJECTED",
    },
  });

  return { success: true, action: updated };
}

