# Watchtower V1

Watchtower is a private, single-user personal operating system. It ranks local tasks against deadlines and project state, provides a terminal-first agent interface, records focus, and is designed to add Gemini/Groq, Google Calendar, and news providers without exposing keys to the browser.

## Run locally

1. Copy `.env.example` to `.env.local` and supply a PostgreSQL `DATABASE_URL`.
2. Install packages: `npm install`.
3. Generate and migrate the database: `npm run db:generate`, then `npm run db:migrate`.
4. Optional development data: `npm run db:seed`.
5. Start: `npm run dev`.

On Windows, you can instead double-click `start-watchtower.bat` or run `./Start-Watchtower.ps1` from PowerShell. Both launchers validate the environment and start the app without applying database migrations or destructive resets.

## What works without external credentials

- Responsive dashboard and command-terminal UI
- PostgreSQL-backed projects, tasks, activity, memories, knowledge and focus sessions schema
- Deterministic, transparent priority ranking
- Agent recommendations, rest behavior, weekly review, task creation, and confirmation-only calendar actions
- Markdown history segmentation/import endpoint
- Focus timer and PWA manifest

## Integration state

Google Calendar, Gemini, Groq, live news, browser notifications, and production authentication each have environment-variable/configuration placeholders but are deliberately shown as disconnected until configured. This prevents fake success states. The agent’s deterministic database path remains available without AI keys.

## Architecture

One Next.js app uses Prisma/PostgreSQL and server-only API routes. `lib/agent.ts` is the context/priority orchestration seam; provider clients should be added there or in `lib/providers/`, using only server-side environment variables. Calendar mutations must first create a pending confirmation record.

## Configuration-gated production checks

The local V1 is functional with PostgreSQL and GDELT. Before public deployment, configure a single-user authentication provider, Gemini/Groq keys, Google OAuth, notification permissions, and PWA icons. These integrations are intentionally marked disconnected until their secrets and permissions are actually supplied; Watchtower never reports a fabricated connection.

See [docs/INTEGRATION_CHECKLIST.md](docs/INTEGRATION_CHECKLIST.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), and [docs/V1_ACCEPTANCE_TESTS.md](docs/V1_ACCEPTANCE_TESTS.md).
