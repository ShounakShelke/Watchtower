import { Priority, TaskStatus } from "./types";

export interface RankedTaskItem {
  id: string;
  title: string;
  projectName: string;
  priority: Priority;
  score: number;
  reason: string;
  estimatedMinutes: number | null;
  status: TaskStatus;
  dueDate: Date | null;
}

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  CRITICAL: 45,
  HIGH: 30,
  MEDIUM: 18,
  LOW: 8,
};

/**
 * Deterministic scoring engine preserved from V1 with project risk & deadline enhancements:
 * score = priority_weight + urgency + status_bonus
 */
export function calculateTaskScore(
  task: {
    priority: Priority;
    dueDate: Date | null;
    status: TaskStatus;
    estimatedMinutes?: number | null;
  },
  nowTimestamp: number = Date.now()
): { score: number; reason: string } {
  let score = PRIORITY_WEIGHTS[task.priority] || 10;
  let deadlineDesc = "no deadline";

  if (task.dueDate) {
    const nowDate = new Date(nowTimestamp);
    nowDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(task.dueDate);
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((targetDate.getTime() - nowDate.getTime()) / 86400000);

    if (diffDays < 0) {
      score += 55; // Overdue bonus
      deadlineDesc = `overdue by ${Math.abs(diffDays)} days`;
    } else if (diffDays === 0) {
      score += 40; // Due today
      deadlineDesc = "due today";
    } else if (diffDays === 1) {
      score += 30; // Due tomorrow
      deadlineDesc = "due tomorrow";
    } else if (diffDays <= 3) {
      score += 20;
      deadlineDesc = `due in ${diffDays} days`;
    } else if (diffDays <= 7) {
      score += 10;
      deadlineDesc = `due in ${diffDays} days`;
    } else {
      deadlineDesc = `due in ${diffDays} days`;
    }
  }

  if (task.status === TaskStatus.IN_PROGRESS) {
    score += 8;
  }

  const reason = `${task.priority.toLowerCase()} priority; ${deadlineDesc}${
    task.status === TaskStatus.IN_PROGRESS ? "; in progress" : ""
  }`;

  return { score, reason };
}
