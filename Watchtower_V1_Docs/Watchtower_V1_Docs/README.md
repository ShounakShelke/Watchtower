# Watchtower V1 — Build Documentation

Watchtower is a personal AI operating system / command center.

## Core idea

Watchtower should:

1. Understand the user's current state.
2. Read calendar, tasks, projects, deadlines, memory, and activity.
3. Determine priorities.
4. Recommend the best next action.
5. Ask for confirmation before external actions.
6. Track progress.
7. Generate intelligent reminders and reviews.
8. Surface personalized AI/ML and motorsport intelligence.
9. Work as a responsive PWA on desktop and phone.
10. Be deployable without the user's PC running.

## V1 priorities

The most important V1 feature is the personalized Watchtower Agent.

Everything else exists to give the agent useful context or to act on its recommendations.

## Documentation

- `BUILD_PROMPT.md` — paste this into Antigravity/Claude as the main implementation prompt.
- `PROJECT_DETAILS.md` — product and architecture specification.
- `AGENT_SPEC.md` — agent behavior, tools, permissions, planning, and memory.
- `DATABASE_SCHEMA.md` — relational database design.
- `UI_UX_SPEC.md` — visual and interaction requirements.
- `INTEGRATION_CHECKLIST.md` — things the owner must configure/connect.
- `DEPLOYMENT.md` — deployment and environment setup.
- `V1_ACCEPTANCE_TESTS.md` — functional acceptance checklist.
- `FUTURE_ROADMAP.md` — intentionally deferred features.
- `ENV_TEMPLATE.md` — environment variables that must be configured.

## Important implementation rule

Do not over-engineer V1.

No Neo4j.
No Redis.
No local LLM.
No multi-agent swarm.
No unnecessary microservices.

Use one application, one primary relational database, one agent orchestration layer, and two AI providers: Gemini + Groq.
