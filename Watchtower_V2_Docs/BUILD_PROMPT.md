# Watchtower V2 — Master Build Prompt

## Role

You are implementing **Watchtower V2 inside the existing Watchtower repository**.

Repository:
`https://github.com/ShounakShelke/Watchtower`

Do NOT rebuild the application from scratch.

Read the current repository, current Prisma schema, current routes/components, `V1_COMPLETE.md`, and existing V1 documentation before modifying anything.

## Primary Objective

Transform the current V1 implementation into V2:

> **A personal AI operating system and autonomous digital agent that understands the user's current state, recommends what to do next, can safely execute internal actions, requires confirmation for external actions, retrieves personal knowledge, dynamically replans the day, and proactively monitors important changes.**

## Non-Negotiable Constraints

- Keep Next.js + TypeScript.
- Keep PostgreSQL + Prisma.
- Keep the application single-user.
- Keep Vercel-compatible architecture.
- Keep Gemini + Groq provider abstraction.
- Do not introduce Neo4j.
- Do not introduce Redis.
- Do not introduce a local LLM.
- Do not introduce microservices.
- Do not build a multi-agent swarm.
- Do not expose API keys to the browser.
- Do not expose hidden chain-of-thought.
- Do not silently mutate external systems.
- Do not remove working V1 features unless necessary and documented.
- Prefer extending existing files over parallel duplicate implementations.

## Phase 0 — Audit

Before coding:
1. Inspect the repository structure.
2. Inspect `package.json`.
3. Inspect `prisma/schema.prisma`.
4. Inspect `lib/agent.ts`.
5. Inspect provider code under `lib/providers`.
6. Inspect calendar routes.
7. Inspect task/project APIs.
8. Inspect knowledge/memory code.
9. Inspect notification/PWA code.
10. Inspect current UI and responsive behavior.
11. Read `V1_COMPLETE.md`.

Create a short internal implementation checklist and then execute it.

## Phase 1 — Agent Foundation

Replace the regex-first agent behavior with an AI orchestration layer.

Required flow:

```text
User message
  ↓
Load session context
  ↓
Retrieve relevant memory/knowledge
  ↓
Compute deterministic priority/risk signals
  ↓
Send compact context + typed tools to LLM
  ↓
LLM chooses response/tool calls
  ↓
Validate tool arguments with Zod
  ↓
Execute safe tools
  ↓
Queue confirmation for external tools
  ↓
Persist trace
  ↓
Return user-facing result
```

Gemini is primary. Groq is fallback.

The deterministic priority engine must remain and become a reliable signal available to the LLM. Do not let an LLM invent deadline priority when deterministic data is available.

## Phase 2 — Tool System

Create a typed server-side tool registry.

Minimum tools:

### Read
- `calendar.get_today`
- `calendar.get_upcoming`
- `calendar.get_free_slots`
- `tasks.list`
- `projects.list`
- `projects.get`
- `activity.get_recent`
- `memory.search`
- `knowledge.search`
- `news.search`
- `news.latest`
- `focus.get_current`
- `reminders.list`

### Internal write
- `tasks.create`
- `tasks.update`
- `tasks.complete`
- `projects.update`
- `activity.record`
- `reminders.create`
- `focus.start`
- `focus.end`
- `daily_plan.create`
- `daily_plan.revise`
- `memory.create_candidate`

### External/confirmation
- `calendar.create_event`
- `calendar.update_event`
- `calendar.delete_event`
- `calendar.move_event`
- future external messaging/email actions

External tools must never execute directly from an unconfirmed LLM tool call.

## Phase 3 — Permission Model

Implement:

### Level 0 — Read
No confirmation.

### Level 1 — Internal state
Can execute automatically:
- internal task creation/update/completion;
- internal project updates;
- activity recording;
- internal reminders;
- plan revisions;
- focus state;
- memory candidates.

### Level 2 — External side effects
Always confirmation:
- Google Calendar create/edit/delete/move;
- emails;
- messages;
- other third-party mutations.

Use an `AgentActionRequest` record.

States:
`PENDING`, `CONFIRMED`, `REJECTED`, `EXECUTED`, `FAILED`, `EXPIRED`.

## Phase 4 — Context Engine

Build one server-side context assembler.

Inputs:
- current date/time/timezone;
- today's calendar;
- upcoming deadlines;
- ranked tasks;
- project progress;
- recent activity;
- current focus;
- reminders;
- relevant memory;
- relevant knowledge;
- behavioral patterns;
- recent agent conversation;
- current news/intelligence when relevant.

The context assembler must be compact and deterministic. Do not dump the entire database into every LLM request.

## Phase 5 — Retrieval

Use PostgreSQL + pgvector where available.

Create embeddings for:
- imported conversation segments;
- knowledge documents;
- memory items;
- project knowledge;
- selected activity summaries.

Store embedding vectors with metadata.

Retrieval should combine:
- semantic similarity;
- recency;
- project relevance;
- source confidence;
- entity/topic match.

If pgvector is unavailable in the selected deployment, implement lexical retrieval fallback.

## Phase 6 — Memory

Separate:

### Permanent memory
Stable preferences, goals, recurring workflows, important decisions.

### Working memory
Today/current session/current priority/current project state.

### Historical knowledge
Imported chats, documents, old research, articles and archived project information.

The LLM may propose a `MemoryCandidate`, but permanent memory requires:
- confidence threshold;
- source;
- reason;
- user approval for durable/high-impact facts.

## Phase 7 — Plan My Day

Implement a flagship planning workflow.

Inputs:
- calendar;
- fixed commitments;
- flexible commitments;
- deadlines;
- task priority;
- project risk;
- estimated task duration;
- available time;
- focus preferences;
- energy/rest state.

Output:
- ordered plan items;
- time blocks;
- rationale;
- alternative if the plan is rejected;
- breaks;
- contingency buffer.

The plan must distinguish:
`FIXED`, `RECOMMENDED`, `OPTIONAL`, `BUFFER`, `REST`.

## Phase 8 — Dynamic Replanning

When the user says:
- “I finished early”
- “I am late”
- “I have only one hour”
- “I don't want to do this”
- “class got cancelled”
- “I am tired”
- “meeting moved”

Watchtower should recompute the plan.

It must not erase history. Store plan revisions.

## Phase 9 — Google Calendar V2

Implement:
- encrypted OAuth refresh-token storage;
- calendar connection state;
- incremental/full sync;
- event normalization;
- sync timestamps;
- two-way read/write architecture.

Write operations:
1. agent proposes;
2. action request is created;
3. user sees exact change;
4. user confirms/rejects;
5. executor performs mutation;
6. result is logged;
7. local state is synchronized.

## Phase 10 — Intelligent Reminders

Support:
- time-based reminders;
- deadline-based reminders;
- progress-based reminders;
- inactivity reminders;
- overdue reminders;
- plan-deviation reminders;
- calendar conflict reminders.

Avoid notification spam.

Each notification should have:
- reason;
- priority;
- suppression window;
- expiration;
- actionable CTA.

## Phase 11 — Intelligence

### AI/ML
Use GDELT + Google News RSS and optional additional providers.

Pipeline:
fetch → normalize → deduplicate → cluster → classify → score importance → score personal relevance → summarize → store.

### Motorsport
Support the user's broad motorsport scope including:
F1, F2, F3, MotoGP, Moto2, Moto3, WSBK, WEC, IMSA, GT World, ELMS, NLS, Le Mans, Nürburgring 24H, Spa 24H, Daytona 24H, Sebring, Formula E, IndyCar and endurance racing.

Motorsport can remain straightforward news-first; AI relevance ranking is optional.

## Phase 12 — ChatGPT History

Pipeline:

```text
.md upload
 ↓
parser
 ↓
conversation segmentation
 ↓
topic/project/entity extraction
 ↓
decision/preference detection
 ↓
knowledge records
 ↓
embeddings
 ↓
memory candidates
 ↓
ingestion report
```

Never blindly turn every historical statement into permanent memory.

## Phase 13 — Agent UX

Agent page should feel like:
**Mac Terminal + control room + personal command center.**

Show:
- conversation;
- tool/action status;
- concise reasons;
- confirmation cards;
- activity trace;
- source/context chips;
- current plan;
- no chain-of-thought.

## Phase 14 — Home UX

Home must answer four questions:

1. What is happening?
2. What matters?
3. What should I do?
4. Have I done enough?

Morning:
- daily brief;
- calendar;
- top priorities;
- plan.

Midday:
- current task;
- progress;
- replanning;
- next action.

Evening:
- completed;
- missed/deferred;
- project movement;
- “have I done enough?”;
- tomorrow preview.

## Phase 15 — Analytics

Implement:
- productive focus hours;
- completion rate;
- postponed tasks;
- deadline risk;
- estimate vs actual;
- project velocity;
- plan adherence;
- planning accuracy;
- activity by day/time.

Analytics should support decisions, not become a vanity dashboard.

## Phase 16 — Observability

Add:
- structured server logs;
- provider latency/error metrics;
- tool success/failure;
- calendar sync status;
- notification delivery status;
- integration health;
- safe error messages.

Never log secrets or sensitive tokens.

## Phase 17 — Testing

Add:
- unit tests for priority/risk;
- unit tests for permission enforcement;
- tool schema validation tests;
- agent orchestration tests;
- calendar confirmation tests;
- retrieval tests;
- memory candidate tests;
- plan/replan tests;
- integration tests;
- production build test.

## Phase 18 — Deployment

Keep Vercel-compatible.

Required environment configuration is documented in `ENV_TEMPLATE.md`.

The final implementation must include:
- migration instructions;
- pgvector setup/fallback;
- OAuth callback configuration;
- notification setup;
- deployment checklist;
- rollback notes.

## Definition of Done

Do not stop at UI mockups.

V2 is complete only when the existing application contains:
- functioning AI orchestration;
- typed tools;
- permission enforcement;
- persistent agent traces;
- retrieval;
- memory candidates;
- day planning;
- replanning;
- calendar sync/write confirmation;
- intelligent reminders;
- daily/weekly reviews;
- intelligence improvements;
- tests;
- production-safe configuration.

If a provider/account cannot be configured in the development environment, implement the complete code path and a deterministic mock/test adapter, clearly label the integration as unconfigured, and do not fake successful external execution.
