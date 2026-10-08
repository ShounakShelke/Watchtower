# Watchtower V1 — implementation handoff

## Purpose

Watchtower V1 is a private, single-user personal operating system centered on **“What should I do now?”** It is a Next.js + TypeScript application with PostgreSQL/Prisma, a deterministic priority engine, responsive monochrome command-center UI, and a PWA shell.

## Implemented local V1

- Dashboard with adaptive daily briefing, time, ranking, projects, reminders, and calendar-state messaging.
- Agent terminal with deterministic priority scoring, task creation, weekly-review basics, rest recommendations, and confirmation-only external-action proposals.
- Database-backed task and project creation, detailed editing, manual project status/progress, and confirmed deletes.
- Internal reminders, focus sessions, activity recording, weekly analytics, knowledge import/display, and development seed data.
- GDELT-backed AI/ML and motorsport intelligence.
- Single-user signed-session implementation (`AUTH_PASSWORD` + `SESSION_SECRET`) for production.
- Gemini-primary/Groq-fallback provider abstraction, enabled only when real server-side keys are supplied.
- Google OAuth initiation route with read-only Calendar scope; no external event mutation is implemented without confirmation.
- PWA manifest, SVG icon, service worker, offline page, browser-notification permission control, Windows launch scripts, and Vercel-compatible architecture.

## Required owner configuration before calling integrations live

These cannot be completed by source code alone because they need the owner’s provider accounts and secrets:

1. Set `AUTH_PASSWORD` and a 32+ character `SESSION_SECRET` in production hosting settings.
2. Add Gemini and/or Groq API keys and test an agent call.
3. Create Google OAuth credentials; set the exact callback URL as `https://YOUR_DOMAIN/api/calendar/callback`; then click **Connect Google Calendar** from Calendar.
4. Deploy to Vercel or a comparable host, configure production `DATABASE_URL`, and install/test the PWA on phone.
5. Enable and test browser notifications from Settings on each target device.

## Explicit non-claims

- Google Calendar is **disconnected** until an account completes OAuth. The app must never say otherwise.
- No secret is exposed to the browser.
- Live Gemini/Groq behavior cannot be verified without their API keys.
- Production deployment cannot be performed without access to the chosen hosting account.

## V2 planning constraints

Keep the architecture single-user, relational, and deployment-friendly. Do not add Neo4j, Redis, a local LLM, microservices, or a multi-agent swarm unless a concrete V2 requirement proves the need.

High-value V2 candidates:

- Secure encrypted storage of Google OAuth refresh tokens and full read-sync.
- Confirmed Google Calendar event create/edit/delete executor.
- Full AI tool-calling orchestration with persisted interaction traces.
- Better task/project CRUD: milestones, dependencies, drag ordering, bulk actions, rich activity timeline.
- Search and retrieval over knowledge/memory.
- Push notifications and richer daily/weekly review workflows.
- Deployment observability, backups, error tracking, and automated integration tests.
