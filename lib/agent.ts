import { Priority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { user } from "@/lib/data";
import { calculateTaskScore } from "@/lib/priority";
import { processAgentMessage } from "@/lib/agent/orchestrator";

export type Recommendation = {
  id: string;
  title: string;
  project: string;
  priority: Priority;
  score: number;
  reason: string;
  estimatedMinutes: number | null;
};

export async function rankedTasks(): Promise<Recommendation[]> {
  const u = await user();
  const tasks = await prisma.task.findMany({
    where: {
      userId: u.id,
      status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
    },
    include: { project: true },
  });

  const now = Date.now();
  return tasks
    .map((t) => {
      const { score, reason } = calculateTaskScore(
        {
          priority: t.priority as any,
          dueDate: t.dueDate,
          status: t.status as any,
          estimatedMinutes: t.estimatedMinutes,
        },
        now
      );

      return {
        id: t.id,
        title: t.title,
        project: t.project?.name || "Unassigned",
        priority: t.priority,
        score,
        estimatedMinutes: t.estimatedMinutes,
        reason,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export async function handleAgent(message: string) {
  const u = await user();
  const res = await processAgentMessage(u.id, message);
  return {
    kind: res.pendingConfirmations && res.pendingConfirmations.length > 0 ? "confirmation" : "answer",
    message: res.message,
    recommendation: res.recommendation,
    alternatives: res.alternatives,
    externalAction: res.pendingConfirmations?.[0] ? { status: "PENDING_CONFIRMATION" } : undefined,
  };
}
