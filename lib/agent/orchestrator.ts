import { prisma } from "../prisma";
import { assembleUserContext } from "../context-engine";
import { executeToolCall, getGeminiFunctionDeclarations, getGroqToolSchemas, findTool } from "../tools/registry";
import { AgentResponsePayload, Priority, TaskStatus } from "../types";
import { replanDay } from "../planning/engine";

interface ToolTraceItem {
  toolName: string;
  label: string;
  status: "executing" | "completed" | "needs_confirmation" | "failed";
}

function toolLabel(toolName: string): string {
  switch (toolName) {
    case "calendar_get_today":
      return "Reading today's calendar";
    case "calendar_get_upcoming":
      return "Checking upcoming commitments";
    case "calendar_get_free_slots":
      return "Analyzing available free intervals";
    case "tasks_list":
      return "Checking prioritized tasks";
    case "tasks_create":
      return "Creating internal task";
    case "tasks_update":
      return "Updating task state";
    case "tasks_complete":
      return "Recording task completion";
    case "projects_list":
    case "projects_get":
      return "Reviewing active project state";
    case "daily_plan_create":
    case "daily_plan_revise":
      return "Constructing day plan";
    case "calendar_create_event":
    case "calendar_update_event":
    case "calendar_move_event":
    case "calendar_delete_event":
      return "Staging calendar change for confirmation";
    case "memory_search":
      return "Searching personal memory";
    case "knowledge_search":
      return "Retrieving knowledge records";
    default:
      return `Executing ${toolName.replace(/_/g, " ")}`;
  }
}

/**
 * Primary Gemini Orchestration Call with Function Calling
 */
async function callGemini(
  systemPrompt: string,
  userMessage: string,
  tools: any[],
  apiKey: string
): Promise<{ text?: string; functionCalls?: { name: string; args: any }[] }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
    tools: [
      {
        function_declarations: tools,
      },
    ],
    generation_config: {
      temperature: 0.2,
      max_output_tokens: 1000,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join("\n");
  const fnCalls: { name: string; args: any }[] = [];

  for (const part of parts) {
    if (part.functionCall) {
      fnCalls.push({
        name: part.functionCall.name,
        args: part.functionCall.args || {},
      });
    }
  }

  return { text: textParts || undefined, functionCalls: fnCalls };
}

/**
 * Groq Fallback Call with Tool Calling
 */
async function callGroq(
  systemPrompt: string,
  userMessage: string,
  tools: any[],
  apiKey: string
): Promise<{ text?: string; functionCalls?: { name: string; args: any }[] }> {
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const body = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    tools,
    tool_choice: "auto",
    temperature: 0.2,
    max_tokens: 1000,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const message = choice?.message;

  const fnCalls: { name: string; args: any }[] = [];
  if (message?.tool_calls) {
    for (const tc of message.tool_calls) {
      try {
        fnCalls.push({
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments || "{}"),
        });
      } catch {
        // ignore malformed args
      }
    }
  }

  return { text: message?.content || undefined, functionCalls: fnCalls };
}

/**
 * Deterministic Agent Fallback when no LLM API is configured or all providers fail.
 */
async function handleDeterministicFallback(
  userId: string,
  message: string,
  contextSnapshot: any
): Promise<AgentResponsePayload> {
  const lower = message.toLowerCase().trim();
  const ranked = contextSnapshot.tasks.ranked;
  const best = ranked[0];

  if (/what should|work on now|next task|recommend/.test(lower)) {
    if (best) {
      return {
        sessionId: "",
        message: `Your highest priority task right now is "${best.title}" (${best.projectName}). ${best.reason}`,
        toolTraces: [{ toolName: "tasks_list", label: "Checking prioritized tasks", status: "completed" }],
        recommendation: {
          id: best.id,
          title: best.title,
          project: best.projectName,
          priority: best.priority,
          reason: best.reason,
          estimatedMinutes: best.estimatedMinutes,
        },
        alternatives: ranked.slice(1, 3).map((t: any) => ({
          id: t.id,
          title: t.title,
          project: t.projectName,
          priority: t.priority,
        })),
      };
    } else {
      return {
        sessionId: "",
        message: "No open tasks are currently scheduled. You have permission to rest, take a walk, or capture your next objective.",
        toolTraces: [],
      };
    }
  }

  if (/plan my day|daily plan|schedule today/.test(lower)) {
    const planResult = await replanDay(userId, "user_request", "Daily plan requested");
    return {
      sessionId: "",
      message: `Plan prepared: ${planResult.plan.summary}`,
      toolTraces: [{ toolName: "daily_plan_create", label: "Constructing day plan", status: "completed" }],
      alternatives: planResult.alternatives?.map((a) => ({
        title: a.title,
        project: a.projectName,
        priority: a.priority,
      })),
    };
  }

  if (/tired|take a break|rest|exhausted/.test(lower)) {
    return {
      sessionId: "",
      message: "You have permission to stop and recharge. Sustained deep work requires disciplined recovery. Take a break, hydrate, and return when ready.",
      toolTraces: [],
    };
  }

  if (/i only have (\d+) (?:min|hour|hours)/.test(lower)) {
    const match = lower.match(/i only have (\d+) (hour|hours|min|minutes)/);
    let mins = 60;
    if (match) {
      const val = parseInt(match[1]);
      mins = match[2].startsWith("hour") ? val * 60 : val;
    }
    const replanned = await replanDay(userId, "time_constraint", `User constrained to ${mins} minutes`, {
      availableMinutes: mins,
    });
    return {
      sessionId: "",
      message: `Adjusted plan for a ${mins}-minute window. Top focus items allocated.`,
      toolTraces: [{ toolName: "daily_plan_revise", label: "Revising day plan", status: "completed" }],
    };
  }

  const createMatch = lower.match(/(?:create (?:a )?task|need to|remind me to)\s+(.+)/i);
  if (createMatch) {
    const title = createMatch[1].replace(/\s+by\s+.+$/i, "").trim();
    const task = await prisma.task.create({
      data: {
        userId,
        title,
        source: "agent",
        priority: Priority.MEDIUM,
      },
    });
    await prisma.activity.create({
      data: {
        userId,
        taskId: task.id,
        activityType: "TASK_CREATED",
        description: `Created task "${task.title}" via agent.`,
      },
    });
    return {
      sessionId: "",
      message: `Created internal task: "${task.title}". You can assign a deadline or project in Tasks.`,
      toolTraces: [{ toolName: "tasks_create", label: "Creating internal task", status: "completed" }],
    };
  }

  return {
    sessionId: "",
    message: "I am Watchtower, your personal AI operating system. I can plan your day, recommend your next action, create tasks, and manage your focus. Try: 'Plan my day' or 'What should I work on now?'",
    toolTraces: [],
  };
}

/**
 * Main Master Agent Orchestrator
 */
export async function processAgentMessage(
  userId: string,
  userMessage: string,
  existingSessionId?: string
): Promise<AgentResponsePayload> {
  const startTime = Date.now();

  // 1. Resolve or Create Agent Session
  let session = existingSessionId
    ? await prisma.agentSession.findFirst({ where: { id: existingSessionId, userId } })
    : null;

  if (!session) {
    session = await prisma.agentSession.create({
      data: {
        userId,
        title: userMessage.slice(0, 40) + (userMessage.length > 40 ? "..." : ""),
        status: "ACTIVE",
      },
    });
  }

  // 2. Persist User Message
  await prisma.agentMessage.create({
    data: {
      sessionId: session.id,
      role: "user",
      content: userMessage,
    },
  });

  // 3. Assemble Context
  const { snapshot, promptText, contextHash } = await assembleUserContext(userId);
  await prisma.agentSession.update({
    where: { id: session.id },
    data: { contextHash },
  });

  const toolTraces: ToolTraceItem[] = [];
  const pendingConfirmations: any[] = [];
  let answerText = "";
  let providerUsed = "deterministic";

  const systemPrompt = `You are Watchtower, a private, authoritative personal AI operating system and autonomous digital agent.
Your primary role is to answer: "What should I do now, why should I do it, and can Watchtower take care of the rest?"

CORE RULES:
1. Always base decisions on facts in the live context below. Never invent calendar events or tasks.
2. For internal state changes (creating/completing tasks, recording activity, planning the day), use the available tools directly.
3. For external changes (calendar events), call the appropriate calendar tool. The system will stage it for user confirmation.
4. If the user rejects a recommendation, do not repeat it; offer a valid alternative.
5. If the user has worked enough or asks to rest, recommend rest and explain why recovery matters.
6. Provide concise, direct, high-signal explanations. Do not reveal raw internal scratchpads.

LIVE CONTEXT:
${promptText}`;

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  let modelResult: { text?: string; functionCalls?: { name: string; args: any }[] } | null = null;

  // Try Gemini Primary
  if (geminiKey) {
    try {
      const geminiTools = getGeminiFunctionDeclarations();
      modelResult = await callGemini(systemPrompt, userMessage, geminiTools, geminiKey);
      providerUsed = "gemini";
    } catch (err: any) {
      console.warn("Gemini call failed, checking Groq fallback:", err.message);
    }
  }

  // Fallback to Groq
  if (!modelResult && groqKey) {
    try {
      const groqTools = getGroqToolSchemas();
      modelResult = await callGroq(systemPrompt, userMessage, groqTools, groqKey);
      providerUsed = "groq";
    } catch (err: any) {
      console.warn("Groq fallback call failed:", err.message);
    }
  }

  // Fallback to Deterministic Engine if no AI succeeded
  if (!modelResult) {
    const fallbackRes = await handleDeterministicFallback(userId, userMessage, snapshot);
    fallbackRes.sessionId = session.id;

    await prisma.agentMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: fallbackRes.message,
        provider: "deterministic",
      },
    });

    return fallbackRes;
  }

  // 4. Process Function Calls if any
  if (modelResult.functionCalls && modelResult.functionCalls.length > 0) {
    for (const call of modelResult.functionCalls) {
      const trace: ToolTraceItem = {
        toolName: call.name,
        label: toolLabel(call.name),
        status: "executing",
      };

      const callStart = Date.now();
      try {
        const execution = await executeToolCall(call.name, call.args, {
          userId,
          sessionId: session.id,
        });

        const latencyMs = Date.now() - callStart;

        if (execution.status === "NEEDS_CONFIRMATION" && execution.actionRequest) {
          trace.status = "needs_confirmation";
          pendingConfirmations.push({
            actionRequestId: execution.actionRequest.id,
            toolName: execution.actionRequest.toolName,
            actionType: execution.actionRequest.actionType,
            target: execution.actionRequest.target,
            before: execution.actionRequest.before,
            proposedAfter: execution.actionRequest.proposedAfter,
            consequence: execution.actionRequest.consequence,
            createdAt: new Date().toISOString(),
          });
        } else if (execution.status === "SUCCESS") {
          trace.status = "completed";
        } else {
          trace.status = "failed";
        }

        toolTraces.push(trace);

        // Record tool call
        await prisma.agentToolCall.create({
          data: {
            sessionId: session.id,
            toolName: call.name,
            argumentsJson: call.args,
            resultJson: execution.result || execution.actionRequest || null,
            permissionLevel: findTool(call.name)?.permission || "READ",
            status: execution.status,
            latencyMs,
          },
        });
      } catch (err: any) {
        trace.status = "failed";
        toolTraces.push(trace);
      }
    }
  }

  answerText = modelResult.text || "";

  if (!answerText && toolTraces.length > 0) {
    if (pendingConfirmations.length > 0) {
      answerText = `I have staged the requested calendar action for your confirmation. Please review the details below.`;
    } else {
      answerText = `Executed ${toolTraces.map((t) => t.label).join(", ")}.`;
    }
  }

  if (!answerText) {
    answerText = "Action completed based on current state.";
  }

  // Persist Assistant Message
  await prisma.agentMessage.create({
    data: {
      sessionId: session.id,
      role: "assistant",
      content: answerText,
      provider: providerUsed,
    },
  });

  const bestRanked = snapshot.tasks.ranked[0];

  return {
    sessionId: session.id,
    message: answerText,
    answer: answerText,
    toolTraces,
    pendingConfirmations,
    recommendation: bestRanked
      ? {
          id: bestRanked.id,
          title: bestRanked.title,
          project: bestRanked.projectName,
          priority: bestRanked.priority,
          reason: bestRanked.reason,
          estimatedMinutes: bestRanked.estimatedMinutes,
        }
      : undefined,
    alternatives: snapshot.tasks.ranked.slice(1, 4).map((t) => ({
      id: t.id,
      title: t.title,
      project: t.projectName,
      priority: t.priority,
    })),
  };
}

