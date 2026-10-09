import { z } from "zod";

export const Priority = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const EventType = {
  CLASS: "CLASS",
  MEETING: "MEETING",
  APPOINTMENT: "APPOINTMENT",
  TRAVEL: "TRAVEL",
  STUDY: "STUDY",
  PROJECT: "PROJECT",
  BREAK: "BREAK",
  OTHER: "OTHER",
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

export type PermissionLevel = "READ" | "INTERNAL_WRITE" | "EXTERNAL_WRITE";

export const ActionRequestStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  EXECUTED: "EXECUTED",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
} as const;
export type ActionRequestStatus = (typeof ActionRequestStatus)[keyof typeof ActionRequestStatus];

export const PlanItemType = {
  FIXED: "FIXED",
  RECOMMENDED: "RECOMMENDED",
  OPTIONAL: "OPTIONAL",
  BUFFER: "BUFFER",
  REST: "REST",
} as const;
export type PlanItemType = (typeof PlanItemType)[keyof typeof PlanItemType];

export const PlanStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  REVISED: "REVISED",
  COMPLETED: "COMPLETED",
  ABANDONED: "ABANDONED",
} as const;
export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus];

export const MemoryCandidateStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
} as const;
export type MemoryCandidateStatus = (typeof MemoryCandidateStatus)[keyof typeof MemoryCandidateStatus];

export type RiskState =
  | "ON_TRACK"
  | "WATCH"
  | "AT_RISK"
  | "OVERDUE"
  | "BLOCKED";

export interface ToolExecutionContext {
  userId: string;
  sessionId?: string;
}

export interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  permission: PermissionLevel;
  schema: z.ZodSchema<TInput>;
  execute: (input: TInput, context: ToolExecutionContext) => Promise<TOutput>;
}

export interface UserContextSnapshot {
  user: {
    id: string;
    email: string;
    displayName: string;
    timezone: string;
  };
  now: string;
  currentDayOfWeek: string;
  currentTimeStr: string;
  calendar: {
    todayEvents: {
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      eventType: string;
      isFixed: boolean;
    }[];
    upcomingEvents: {
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      eventType: string;
    }[];
    freeSlots: {
      start: string;
      end: string;
      durationMinutes: number;
    }[];
    isConnected: boolean;
  };
  tasks: {
    ranked: {
      id: string;
      title: string;
      projectName: string;
      priority: Priority;
      score: number;
      reason: string;
      estimatedMinutes: number | null;
      status: TaskStatus;
      dueDate: string | null;
    }[];
    urgentCount: number;
    totalOpenCount: number;
  };
  projects: {
    id: string;
    name: string;
    status: string;
    progress: number;
    priority: Priority;
    deadline: string | null;
    openTaskCount: number;
  }[];
  activeFocusSession: {
    id: string;
    taskTitle?: string;
    projectName?: string;
    startedAt: string;
    elapsedMinutes: number;
  } | null;
  recentActivity: {
    id: string;
    activityType: string;
    description: string;
    durationMinutes: number | null;
    createdAt: string;
  }[];
  activePlan: {
    id: string;
    status: PlanStatus;
    summary: string | null;
    items: {
      id: string;
      title: string;
      type: PlanItemType;
      startAt: string | null;
      endAt: string | null;
      durationMinutes: number | null;
      priority: Priority;
      rationale: string | null;
      status: string;
    }[];
  } | null;
  memories: {
    id: string;
    category: string;
    key: string;
    value: string;
  }[];
  behaviorPatterns: {
    patternType: string;
    value: Record<string, any>;
    confidence: number;
  }[];
}

export interface AgentActionDiff {
  toolName: string;
  actionType: string;
  target: Record<string, any>;
  before: Record<string, any>;
  proposedAfter: Record<string, any>;
  affectedDateTime?: string;
  consequence: string;
}

export interface AgentResponsePayload {
  sessionId: string;
  message: string;
  answer?: string;
  toolTraces: {
    toolName: string;
    label: string;
    status: "executing" | "completed" | "needs_confirmation" | "failed";
  }[];
  actions?: AgentActionDiff[];
  pendingConfirmations?: {
    actionRequestId: string;
    toolName: string;
    actionType: string;
    target: Record<string, any>;
    before: Record<string, any>;
    proposedAfter: Record<string, any>;
    consequence: string;
    createdAt: string;
  }[];
  recommendation?: {
    id?: string;
    title: string;
    project: string;
    priority: string;
    reason: string;
    estimatedMinutes?: number | null;
  };
  alternatives?: {
    id?: string;
    title: string;
    project: string;
    priority: string;
  }[];
  sources?: {
    id?: string;
    title: string;
    type: string;
    reference?: string;
  }[];
}
