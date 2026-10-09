# Watchtower V2 — Personal AI Operating System & Autonomous Digital Agent

Watchtower V2 is a private, single-user personal operating system and digital command center. It unifies calendar commitments, project states, ranked tasks, and personal knowledge into an authoritative decision layer:
> **"What should I do now, why should I do it, and can Watchtower take care of the rest?"**

---

## Key Capabilities in V2

1. **Autonomous Agent Orchestrator**:
   - Multi-turn tool calling with Gemini 2.0 Flash (primary), Groq Llama 3.3 70B (fallback), and a transparent deterministic rule engine (offline fallback).
   - Generates user-safe activity traces (`◉ Reading calendar`, `◉ Checking deadlines`) without exposing private model scratchpads.

2. **Server-Side 3-Tier Permission Guardrails**:
   - `READ`: Executes database and context queries directly.
   - `INTERNAL_WRITE`: Automatically updates internal state (tasks, project progress, daily plans) and records activity audit logs.
   - `EXTERNAL_WRITE`: Strictly stages mutations (e.g., Google Calendar create/edit/delete/move) into `AgentActionRequest` records requiring explicit user confirmation before touching external APIs.

3. **Dynamic Daily Planning & Replanning**:
   - Flagship "Plan My Day" engine allocates ordered time blocks (`FIXED`, `RECOMMENDED`, `OPTIONAL`, `BUFFER`, `REST`).
   - Dynamic replanning adjusts to real-world interruptions ("I finished early", "I only have 1 hour", "I'm tired") while archiving plan revisions.
   - End-of-day rest sufficiency check ("Have I done enough today?") provides positive permission to stop and recharge.

4. **Bi-directional Google Calendar Sync**:
   - AES-256-GCM encrypted OAuth refresh tokens and sync tokens stored securely at rest.
   - Two-way sync, scheduling conflict detection, and interactive before/after action confirmation cards.

5. **Memory & Hybrid Semantic Retrieval**:
   - Permanent vs. working vs. historical knowledge hierarchy.
   - Hybrid semantic vector retrieval (`pgvector` / Gemini embedding) with full-text lexical fallback.
   - ChatGPT history ingestion parsing conversation segments, extracting decisions, and staging memory candidates for human review and approval.

6. **Curated Intelligence & Proactive Watchdogs**:
   - Multi-source GDELT + RSS clustering covering AI/ML and broad motorsport disciplines (F1, WEC, IMSA, GT World, MotoGP) with importance and personalized relevance scoring.
   - Background cron endpoints for Morning Sync, Deadline Watchdog, and Evening Reviews.

---

## Local Setup & Quickstart

### Prerequisites
- Node.js 18+ (tested on Node.js 22 LTS)
- PostgreSQL database

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your PostgreSQL connection string to `DATABASE_URL` and generate a 32+ character string for `SESSION_SECRET`.

3. Generate the Prisma client and apply schema:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. *(Optional)* Seed initial development data:
   ```bash
   npm run db:seed
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to access the command center.

On Windows, you can double-click `start-watchtower.bat` or run `.\Start-Watchtower.ps1` from PowerShell to launch the environment automatically.

---

## Test Suite & Verification

Watchtower V2 includes automated test suites covering encryption, deterministic priority math, 3-tier permission guardrails, daily planning, retrieval, and end-to-end acceptance tests:

```bash
# Run unit and acceptance test suite
npm test

# Run Next.js production build verification
npm run build
```

---

## Production Deployment

- **Hosting**: Compatible with Vercel and hosted PostgreSQL (e.g. Neon, Supabase).
- **Security**: Server-only API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, `SESSION_SECRET`, `GOOGLE_CLIENT_SECRET`) are never exposed to browser bundles.
- **Scheduled Automations**: Triggerable via deployment schedulers (e.g., Vercel Cron) targeting `/api/cron/morning-sync`, `/api/cron/deadline-watch`, and `/api/cron/evening-review` using `CRON_SECRET` authentication.

See [`Watchtower_V2_Docs`](Watchtower_V2_Docs/) for in-depth engineering specifications, API contracts, and security guidelines.
