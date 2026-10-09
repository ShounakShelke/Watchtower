# Watchtower V2 — Project Details

## Product

Watchtower is a private single-user personal operating system.

Core problem:
The user has calendar commitments, academic work, software projects, deadlines, news, research, learning goals and personal energy constraints spread across different places. Watchtower should consolidate them into one continuously updated decision layer.

## Product Promise

> Tell Watchtower what is happening. It understands the context, tells you what matters, and helps you execute it.

## User Modes

### 1. Dashboard mode
See current state without opening the agent.

### 2. Agent mode
Natural-language interaction and execution.

### 3. Focus mode
One clear objective with minimal distraction.

### 4. Review mode
Daily/weekly reflection and planning.

## Core Objects

- User
- Task
- Project
- Milestone
- CalendarEvent
- Reminder
- FocusSession
- Activity
- Memory
- MemoryCandidate
- Knowledge
- DailyPlan
- PlanItem
- PlanRevision
- AgentSession
- AgentMessage
- AgentToolCall
- AgentActionRequest
- AgentObservation
- BehaviorPattern
- NewsItem
- NewsCluster
- NewsSource
- NotificationEvent
- CalendarSyncState

## Task Model

A task has:
- title;
- description;
- project;
- status;
- priority;
- due date;
- estimated duration;
- actual duration;
- ordering;
- dependency links;
- completion state;
- postponement count.

## Project Model

A project has:
- title;
- description;
- status;
- progress;
- milestones;
- tasks;
- risk;
- target date;
- activity history;
- knowledge references.

## Priority

The deterministic engine remains authoritative for base signals.

Example conceptual score:

```text
priority =
  priority_weight
+ deadline_urgency
+ project_risk
+ dependency_impact
+ in_progress_bonus
+ overdue_bonus
- blocked_penalty
```

The exact V1 scoring should be preserved unless tests justify changes.

The LLM interprets the score rather than inventing the underlying facts.

## Risk States

- ON_TRACK
- WATCH
- AT_RISK
- OVERDUE
- BLOCKED

## Plan States

- DRAFT
- ACTIVE
- REVISED
- COMPLETED
- ABANDONED

## Agent Philosophy

Watchtower should not merely answer questions.

It should:
- understand intent;
- inspect context;
- use tools;
- execute safe actions;
- request confirmation for external actions;
- observe results;
- update state;
- explain concise reasons.

## “I Don't Want To Do This” Behavior

Never silently delete a commitment.

Example:

User:
> I don't want to attend my ML class.

Watchtower:
1. identifies the calendar event;
2. explains the conflict/opportunity cost;
3. presents alternatives;
4. offers to modify the calendar only after confirmation.

Possible options:
- Keep class.
- Work on GT2.
- Use the time for another priority.
- Take a break.

## Rest Behavior

Rest is a legitimate recommendation.

If workload and activity indicate enough work has been completed, Watchtower may explicitly say:
- you have done enough today;
- stop;
- take a walk;
- drink water;
- rest;
- resume tomorrow.

This is not a failure state.

## External Action Rule

Every external action must be:
- explicit;
- previewable;
- confirmable;
- auditable;
- reversible where possible.
