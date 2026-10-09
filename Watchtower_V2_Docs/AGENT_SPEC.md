# Watchtower V2 — Agent Specification

## 1. Agent Architecture

```text
Message
  ↓
Intent/context preparation
  ↓
Context Engine
  ├── Live state
  ├── Priority/risk
  ├── Retrieval
  ├── Memory
  └── Recent agent state
  ↓
Gemini
  ↓ fallback
Groq
  ↓
Typed tool calls
  ↓
Permission middleware
  ├── read → execute
  ├── internal write → execute
  └── external → confirmation
  ↓
Tool result
  ↓
Agent response
  ↓
Persistence
```

## 2. Agent Rules

1. Never invent calendar events.
2. Never invent task/project state.
3. Prefer database facts over model assumptions.
4. Use tools when a request requires current state.
5. Do not use the LLM to calculate deterministic deadline facts if the server can calculate them.
6. Ask only necessary clarification questions.
7. If enough context exists, act instead of asking.
8. For external actions, prepare a confirmation.
9. Report failures honestly.
10. Never reveal hidden chain-of-thought.

## 3. Agent Response Structure

Internally generate:

```json
{
  "answer": "...",
  "actions": [],
  "needs_confirmation": false,
  "sources": [],
  "state_changes": [],
  "follow_up": null
}
```

Only expose user-appropriate fields.

## 4. Tool Registry

### calendar.get_today
Returns today's normalized events.

### calendar.get_upcoming
Returns upcoming events.

### calendar.get_free_slots
Calculates free intervals from calendar state.

### tasks.list
Filters by status/project/date/priority.

### tasks.create
Creates an internal task.

### tasks.update
Updates an internal task.

### tasks.complete
Completes an internal task and records activity.

### projects.list
Lists projects.

### projects.get
Returns project details.

### projects.update
Updates internal project state.

### activity.get_recent
Returns recent activity.

### activity.record
Records user activity.

### memory.search
Semantic/keyword search over memory.

### knowledge.search
Searches historical knowledge.

### news.search
Searches stored intelligence.

### news.latest
Returns latest relevant items.

### focus.get_current
Returns active focus state.

### focus.start/end
Manages focus sessions.

### reminders.list/create
Manages internal reminders.

### daily_plan.create/revise
Creates or revises a plan.

### memory.create_candidate
Creates a candidate for durable memory.

### calendar.create/update/delete/move
External tools; confirmation required.

## 5. Permission Middleware

Never rely on prompt instructions alone.

Server code must enforce:

```text
tool.permission === READ
    → execute

tool.permission === INTERNAL_WRITE
    → execute if session authenticated

tool.permission === EXTERNAL_WRITE
    → create AgentActionRequest
    → do not execute
```

## 6. Confirmation Card

Must show:
- action;
- target;
- before state;
- after state;
- affected date/time;
- consequence;
- Confirm;
- Reject.

## 7. Tool Trace

Show user-safe trace:

```text
Reading today's calendar
Checking urgent tasks
Finding GT2 project status
Building today's plan
```

Do not show hidden chain-of-thought.

## 8. Agent Sessions

Each session stores:
- start time;
- end time;
- user;
- title;
- current context hash;
- status.

Messages store:
- role;
- content;
- timestamp;
- tool-call relation;
- model/provider metadata where safe.

## 9. Proactive Agent

Scheduled workflows:
- morning state sync;
- morning plan;
- deadline watch;
- plan deviation watch;
- evening review;
- weekly review.

Proactive execution must still respect permission rules.

## 10. Replanning Triggers

- task completion;
- task delay;
- calendar change;
- meeting cancellation;
- free time increase/decrease;
- user rejects a plan item;
- user reports fatigue;
- deadline becomes high-risk;
- project becomes blocked.

## 11. Alternative Planning

If user rejects a recommendation, Watchtower should not repeat the same recommendation.

It should generate alternatives based on:
- available time;
- deadline risk;
- energy;
- project dependencies;
- fixed commitments.

## 12. Accountability

The agent may use previous plans and activity:

> “You planned to finish preprocessing yesterday, but the task remained open.”

It should remain factual and non-judgmental.
