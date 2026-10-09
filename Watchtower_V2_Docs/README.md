# Watchtower V2 — Complete Product & Engineering Handoff

## 1. V2 Definition

Watchtower V2 upgrades the existing V1 personal operating system into a **personal AI operating system + autonomous digital agent** while preserving the existing single-user, relational, deployment-friendly architecture.

V1 is explicitly the baseline: dashboard, deterministic priority engine, tasks/projects, reminders, focus, activity, knowledge import, GDELT intelligence, signed-session auth, Gemini/Groq abstraction, Google OAuth initiation, and PWA shell are already implemented locally. V2 extends those foundations rather than rebuilding Watchtower. [V1_COMPLETE.md]

## 2. Core Question

> **What should I do now, why should I do it, and can Watchtower take care of the rest?**

The product loop is:

**Understand me → understand current state → retrieve relevant knowledge → reason → recommend → act safely → observe outcome → learn**

## 3. V2 Product Pillars

1. **Real AI Agent**
   - Gemini primary.
   - Groq fallback.
   - Typed tool calling.
   - Persisted agent sessions, messages, tool calls and action requests.
   - No multi-agent swarm.

2. **Personal Context Engine**
   - Calendar.
   - Tasks.
   - Projects.
   - Deadlines.
   - Focus/activity history.
   - Memory.
   - Knowledge.
   - News/intelligence.
   - Behavioral patterns.
   - Current session state.

3. **Dynamic Planning**
   - Plan My Day.
   - Dynamic replanning.
   - Free-time utilization.
   - Deadline-risk handling.
   - Fixed vs flexible commitments.
   - Recovery/rest recommendations.
   - End-of-day sufficiency check.

4. **Safe Autonomy**
   - Internal analysis and internal state updates can be autonomous.
   - External side effects require confirmation.
   - Every external action is represented as an explicit pending action request.

5. **Memory + Retrieval**
   - Permanent memory.
   - Working memory.
   - Historical knowledge.
   - Semantic retrieval.
   - Memory candidates require confidence and user approval before becoming durable memory.

6. **Integrated Intelligence**
   - AI/ML news.
   - Motorsport news across the user's defined series.
   - Relevance and importance ranking.
   - Deduplication and clustering.

7. **Proactive Watchtower**
   - Scheduled morning sync.
   - Daily plan.
   - Deadline/progress reminders.
   - Evening review.
   - Weekly review.
   - Push/browser notifications.

## 4. V2 Navigation

HOME
AGENT
TASKS
PROJECTS
CALENDAR
KNOWLEDGE
INTELLIGENCE
ANALYTICS
FOCUS
SETTINGS

Do not add a top-level Notes page. Knowledge replaces standalone notes.

## 5. V2 Architecture

```text
                    ┌───────────────────────┐
                    │       HOME / UI       │
                    └──────────┬────────────┘
                               │
                    ┌──────────▼────────────┐
                    │     AGENT TERMINAL    │
                    └──────────┬────────────┘
                               │
                    ┌──────────▼────────────┐
                    │   CONTEXT ENGINE      │
                    │ live + memory + KB    │
                    └──────────┬────────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
      ┌──────▼─────┐   ┌──────▼──────┐   ┌──────▼──────┐
      │ Priority / │   │ Retrieval /  │   │ Planning /  │
      │ Risk Engine│   │ Memory Engine│   │ Replanning  │
      └──────┬─────┘   └──────┬───────┘   └──────┬──────┘
             └─────────────────┼──────────────────┘
                               │
                    ┌──────────▼────────────┐
                    │  AGENT ORCHESTRATOR   │
                    │ Gemini → Groq fallback│
                    └──────────┬────────────┘
                               │
                 ┌─────────────┼──────────────┐
                 │             │              │
          internal tools   retrieval tools  action tools
                 │             │              │
                 └─────────────┼──────────────┘
                               │
                    ┌──────────▼────────────┐
                    │      PostgreSQL       │
                    │ Prisma + pgvector     │
                    └───────────────────────┘
```

## 6. Architecture Constraints

Keep:
- Next.js + TypeScript.
- PostgreSQL + Prisma.
- Vercel-compatible deployment.
- Single-user model.
- Gemini/Groq provider abstraction.
- Existing V1 UI and routes where useful.

Do not add:
- Neo4j.
- Redis.
- Local LLM.
- Microservices.
- Multi-agent swarm.

Use PostgreSQL `pgvector` for semantic retrieval if supported by the selected hosted database. If unavailable, retain lexical retrieval as a fallback rather than adding a second database.

## 7. V2 Success Criteria

A V2 build is successful when the user can:

- ask Watchtower what to do now and receive a context-aware answer;
- ask it to plan the day;
- allow it to create/update internal tasks automatically;
- receive dynamic replanning when circumstances change;
- retrieve relevant project/history knowledge;
- see why a recommendation was made;
- connect Google Calendar and synchronize events;
- prepare and execute confirmed calendar changes;
- receive intelligent reminders and notifications;
- receive daily and weekly reviews;
- import ChatGPT history and turn it into searchable knowledge/memory candidates;
- see agent activity without exposing private chain-of-thought;
- use the same state from desktop and phone;
- run the application online without the development PC running.

## 8. V2 Boundary

V2 is an autonomous personal productivity agent, not a general-purpose unrestricted agent.

The system must:
- never silently perform consequential external actions;
- never claim an integration is connected when it is not;
- never expose provider secrets to the browser;
- never present hidden reasoning/chain-of-thought;
- log tool/action outcomes;
- fail safely when integrations are unavailable.
