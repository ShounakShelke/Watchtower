# WATCHTOWER V1 — ANTIGRAVITY / CLAUDE BUILD PROMPT

You are the lead product engineer, AI engineer, UX engineer, and deployment engineer for a project called **Watchtower**.

Build a production-quality V1 of the application described below.

Do not merely generate a mockup. Build a functional application with a real database, real authentication/session handling, real agent tools, real project/task state, real calendar integration hooks, real AI provider integration, real PWA behavior, and a deployable architecture.

The application is intended for one user: **Shounak**.

---

# 1. PRODUCT

Watchtower is a personal AI operating system.

Its job is not simply to show tasks.

Its central question is:

> WHAT SHOULD I DO NOW?

Watchtower combines:
- Google Calendar
- user-created tasks
- projects
- milestones
- deadlines
- activity/progress
- persistent memory
- imported ChatGPT history
- AI/ML news
- motorsport news
- reminders
- focus sessions
- analytics
- weekly reviews

The agent uses this context to:
- classify priorities
- dynamically plan flexible work around fixed calendar commitments
- recommend the next action
- offer alternatives when the user rejects a recommendation
- recognize when rest is the correct recommendation
- track project progress
- create/update internal tasks
- generate intelligent reminders
- prepare daily and weekly reviews
- ask for confirmation before external actions

The application should feel like a personal command center, not a generic productivity SaaS.

---

# 2. NON-NEGOTIABLE PRODUCT PRINCIPLES

1. Agent-first.
2. Dashboard-first homepage.
3. Single-user private deployment.
4. PWA.
5. Desktop + mobile responsive.
6. Minimal monochrome design.
7. Pixel/display typography.
8. Black, white, and gray only.
9. AI terminal/control-room interface.
10. Simple relational database.
11. No Neo4j.
12. No Redis.
13. No local LLM.
14. Gemini + Groq only for Watchtower's own agent.
15. External ChatGPT/Gemini/Claude buttons are optional shortcuts, not separate agents.
16. External actions require confirmation.
17. Internal reasoning/actions can be autonomous.
18. Do not spam notifications.
19. Do not invent data.
20. Do not pretend an integration works if it has not been configured.

---

# 3. RECOMMENDED STACK

Prefer:

Frontend:
- Next.js + TypeScript
- Tailwind CSS
- PWA support
- responsive design
- component architecture

Backend:
- Next.js server/API routes or a lightweight integrated backend
- TypeScript

Database:
- PostgreSQL
- Prisma ORM preferred

AI:
- Gemini API
- Groq API

Validation:
- Zod

Authentication:
- simple secure single-user authentication
- use an established auth library if needed
- never hardcode credentials

Deployment:
- Vercel-compatible architecture
- managed PostgreSQL compatible with free/low-cost hosting

Do not introduce a separate backend server unless there is a clear technical reason.

If the chosen stack differs, document why.

---

# 4. APPLICATION NAVIGATION

Main navigation:

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

Do NOT create a top-level Notes page.

Notes/quick capture belong under Knowledge.

---

# 5. HOME PAGE

The homepage must contain all major information relevant to the current day.

Do not make the user choose which widgets they want before seeing the dashboard.

The page should intelligently prioritize information.

Include:

## Header
- Watchtower branding
- current date/time
- system status
- notification indicator
- settings/profile

## Daily briefing
Example:

GOOD MORNING, SHOUNAK

Today:
- calendar commitments
- available time
- important deadlines
- priority projects
- intelligent reminders

## Calendar timeline
Show today's events.

Categorize events:
- Class
- Meeting
- Appointment
- Travel
- Study
- Project
- Break
- Other

Distinguish:
- FIXED commitments
- FLEXIBLE work

Calendar events are commitments; Watchtower should not silently delete or modify them.

## Today's priorities

Show dynamically ranked tasks.

For each:
- task
- project
- priority
- deadline
- estimated time
- reason for ranking

## Watchtower recommendation

Show:

YOUR BEST NEXT ACTION

Example:

GT2 — Competitor Analysis

Priority: HIGH
Deadline: tomorrow
Progress: 67%
Suggested session: 90 minutes

Reason:
This is currently your highest-impact unfinished work.

Buttons:
- START
- CHOOSE SOMETHING ELSE
- TAKE A BREAK

## Project status
Show active projects and progress.

## Intelligence
Compact sections:
- AI / ML
- Motorsport

## Intelligent reminders
Not just clock reminders.

Examples:
- deadline approaching
- project stalled
- planned work not started
- upcoming class
- important news
- progress review
- rest recommendation

## End-of-day state
When appropriate, show:
- completed priorities
- remaining work
- whether the user has done enough for the day

---

# 6. ADAPTIVE HOME

The homepage should change its emphasis according to time of day.

Morning:
- daily briefing
- schedule
- priorities
- recommended plan

Midday:
- current progress
- next action
- remaining priorities

Evening:
- completed work
- unfinished work
- day review
- tomorrow preview

Do not implement this as three unrelated pages. Use one dashboard whose content emphasis changes.

---

# 7. AGENT PAGE

This is the signature Watchtower experience.

Make it look like a premium command terminal/control room.

It should feel inspired by a modern terminal, but remain readable and usable.

Example:

WATCHTOWER TERMINAL

SYSTEM ONLINE
CONTEXT LOADED
CALENDAR SYNCED
PROJECT STATE SYNCED
MEMORY LOADED

> what should i work on now?

ANALYZING...

CALENDAR ✓
DEADLINES ✓
PROJECTS ✓
PROGRESS ✓
PRIORITIES ✓

RECOMMENDATION:
GT2 — Competitor Analysis

Then provide reasoning and actions.

The user can type natural language.

Support examples:

- plan my day
- what should i work on now
- i have 2 hours free
- create a task to finish GT2 by Friday
- remind me tomorrow at 8
- update GT2, I finished preprocessing
- what did I accomplish this week
- review my projects
- why am I behind
- show me important AI news
- show me motorsport news
- what did I decide about MedLMP?
- give me my weekly review
- I'm tired
- I don't want to attend this class

The agent must interpret intent and call appropriate tools.

---

# 8. CLASS-CONFLICT BEHAVIOR

If the user says:

"I don't want to attend this class."

Do not automatically delete the event.

The agent should:
1. identify the relevant calendar event
2. check whether attendance is important/known
3. calculate the newly available time
4. check priorities
5. suggest alternatives

Example:

CLASS CONFLICT

10:00–11:00 Machine Learning

If you skip this class, you have 1 hour available.

Best alternatives:
1. Work on GT2 — milestone tomorrow.
2. DMAT preparation — behind planned pace.
3. Take a break — you have already completed 3h 10m focused work.

Actions:
[ KEEP CLASS ]
[ WORK ON GT2 ]
[ TAKE A BREAK ]

Only modify external calendar state after confirmation.

---

# 9. AGENT PERMISSIONS

Autonomous:
- analyze state
- classify priorities
- reorder internal tasks
- generate recommendations
- update internal project progress from user input
- create internal tasks
- generate summaries
- detect conflicts
- suggest breaks
- create internal reminders

Confirmation required:
- create calendar events
- edit calendar events
- delete calendar events
- send emails
- send external messages
- perform significant external changes

Always show a clear confirmation UI before an external mutation.

---

# 10. TASKS

Allow:
- manual task creation
- natural-language task creation
- agent-generated internal tasks

Task fields:
- title
- description
- project
- milestone
- status
- priority
- due date
- estimated duration
- actual duration
- source
- created at
- completed at

Statuses:
- TODO
- IN_PROGRESS
- BLOCKED
- DONE
- CANCELLED

Priorities:
- CRITICAL
- HIGH
- MEDIUM
- LOW

Allow natural language:

"I need to finish the report by Friday."

Agent should create a task after parsing the statement.

---

# 11. PROJECTS

A project contains:
- name
- description
- goal
- status
- progress
- milestones
- tasks
- deadlines
- activity
- AI observations
- history

The user can simply tell the agent:

"I'm building Watchtower."

The agent should create a project and ask only the necessary follow-up questions.

Project page should show:
- overall progress
- milestones
- open tasks
- activity
- recent updates
- blockers
- next recommended action

---

# 12. PROGRESS TRACKING

Users can report progress naturally.

Example:

"I worked on GT2 for 2 hours and finished competitor preprocessing."

The agent should:
- create activity entry
- update project/milestone state
- update task state where appropriate
- update progress
- store the report

Do not require manual percentage entry for every update.

---

# 13. KNOWLEDGE

Knowledge contains:
- ChatGPT history
- documents
- saved articles
- bookmarks
- project knowledge
- important decisions
- research
- persistent memory

No separate Notes navigation item.

Provide quick capture under Knowledge.

---

# 14. CHATGPT HISTORY IMPORT

Support importing a single `.md` file containing ChatGPT history.

The ingestion pipeline should:
1. read the markdown
2. segment conversations
3. extract project mentions
4. extract goals
5. extract preferences
6. extract important decisions
7. extract recurring topics
8. store the raw source
9. create searchable knowledge entries
10. populate initial persistent memory where confidence is high
11. avoid inventing facts

Show an ingestion report:
- conversations processed
- knowledge entries created
- memory candidates extracted
- projects detected
- warnings/errors

Allow the user to rerun ingestion.

Do not blindly put the entire file into one giant database text field as the only retrieval mechanism.

---

# 15. MEMORY MODEL

Use three conceptual layers.

PERMANENT MEMORY:
- preferences
- long-term goals
- projects
- important decisions
- recurring workflow information

WORKING MEMORY:
- today's schedule
- current priorities
- active task
- current project
- current progress
- current session

HISTORICAL KNOWLEDGE:
- imported conversations
- documents
- articles
- old project information
- research

Use retrieval to provide only relevant context to the model.

---

# 16. CALENDAR

V1 integration:
- Google Calendar

Read:
- events
- event time
- title
- description where available
- calendar/source metadata

Classify events internally.

Do not assume every calendar event is a task.

Calendar events are external commitments.

Allow Watchtower to use calendar free/busy information when planning.

Any calendar mutation requires user confirmation.

---

# 17. INTELLIGENCE

V1:
- AI/ML news
- motorsport news

AI/ML:
- model releases
- research
- tools
- frameworks
- major company developments
- important ecosystem news

Motorsport:
- F1
- F2
- F3
- MotoGP
- Moto2
- Moto3
- WSBK
- WEC
- IMSA
- GT World
- ELMS
- NLS
- Le Mans
- Nürburgring 24H
- Spa 24H
- Daytona 24H
- Sebring
- endurance events
- Formula E
- IndyCar
- other major motorsport series/events

The intelligence layer should:
1. collect current information
2. summarize it
3. rank importance
4. explain why it matters
5. optionally connect it to the user's projects/interests

Do not fabricate current news.

Use reliable sources and clearly store source URLs.

---

# 18. ANALYTICS

Implement:
- daily activity
- weekly activity
- completed tasks
- postponed tasks
- project progress
- focus time
- deadlines
- project milestones
- workload distribution

Weekly Review should answer:
- what happened?
- what was completed?
- what was postponed?
- what projects progressed?
- what is behind?
- what should be prioritized next?
- where did the user do well?
- what should the user stop doing?

Also include:
"Have I done enough today?"

If the user completed high-priority work and no urgent work remains, Watchtower should explicitly recommend stopping.

---

# 19. FOCUS MODE

Implement:
- select project/task
- timer
- pause
- stop
- complete
- session notes
- activity recording

At the end ask:
"What did you accomplish?"

Use the answer to update project/task activity.

---

# 20. NOTIFICATIONS

V1 notification target:
- browser/PWA notifications

Architecture should leave room for:
- email
- desktop notifications
- phone notifications

Do not create a notification every time something changes.

Implement priority levels:
- INFO
- IMPORTANT
- URGENT

Allow notification preferences.

---

# 21. EXTERNAL AI SHORTCUTS

Provide optional shortcut buttons:
- ChatGPT
- Gemini
- Claude

These are not Watchtower agents.

They are simple external links/buttons.

Watchtower's own agent uses:
- Gemini API
- Groq API

---

# 22. AI PROVIDERS

Settings should allow:
- Gemini API key
- Groq API key
- active provider
- fallback provider

Never store keys in client-side localStorage.

Use server-side environment variables/secrets.

Default:
Gemini primary
Groq fallback

Make provider abstraction so switching models is easy.

---

# 23. DATABASE

Use PostgreSQL.

Use Prisma or an equivalent ORM.

Expected core tables:

users
projects
milestones
tasks
calendar_events
reminders
activity
goals
deadlines
memory
knowledge
documents
news_items
preferences
focus_sessions
ai_interactions
integrations
notification_preferences

Use normal foreign keys.

Do NOT use Neo4j.

Do NOT use a separate graph database.

---

# 24. AGENT TOOL ARCHITECTURE

Implement the agent with typed tools.

Suggested tools:

get_current_state
get_today_calendar
get_upcoming_deadlines
get_active_projects
get_tasks
create_task
update_task
complete_task
create_project
update_project
record_activity
get_project_progress
create_internal_reminder
get_memory
search_knowledge
get_recent_activity
get_news
generate_daily_plan
generate_weekly_review
start_focus_session
end_focus_session
prepare_calendar_action
prepare_external_action

External mutation tools should return a confirmation request instead of directly executing.

---

# 25. CONTEXT ENGINE

Create a deterministic context-building layer.

Given a user request, retrieve only relevant information.

For:
"what should I work on now?"

retrieve:
- current time
- today's calendar
- free slots
- overdue tasks
- deadlines
- active projects
- project progress
- recent activity
- preferences
- current working state

Do not send the entire database to the LLM.

---

# 26. PRIORITY ENGINE

Priority should be based on factors such as:
- deadline proximity
- importance
- project priority
- current progress
- dependency/blocker state
- estimated duration
- available time
- calendar commitments
- recent activity
- user's explicit preferences

Make the scoring transparent enough to debug.

The UI should explain why an item was ranked highly.

---

# 27. REST / WELLBEING LOGIC

Keep it simple.

The agent may recommend:
- break
- walk
- stop for the day
- water
- resume later

Do not present medical claims.

The important rule is:

If high-priority work is complete and no urgent work remains, the agent should be allowed to recommend REST instead of inventing another productivity task.

---

# 28. UI DESIGN

Reference direction: the user supplied a monochrome editorial website screenshot.

Improve it rather than copying it.

Visual rules:
- white/black/gray only
- no colored accents
- pixel/display typography for major UI
- readable body font
- subtle grid background
- thin borders
- strong typography hierarchy
- editorial layouts
- terminal-inspired agent page
- minimal cards
- restrained rounding
- minimal shadows
- subtle transitions
- responsive mobile layouts

Avoid:
- colorful gradients
- generic SaaS purple
- excessive glassmorphism
- excessive rounded cards
- emoji-based UI
- dashboard clutter
- stock illustrations

Use CSS variables/design tokens.

---

# 29. PWA

Implement:
- manifest
- service worker
- installability
- mobile responsive shell
- icons
- offline shell/cache where safe

Offline should support graceful access to:
- cached UI
- locally cached read-only data if implemented safely

Do not pretend that live AI/calendar/news works offline.

When offline:
- show offline status
- preserve safe local interactions
- sync when possible

---

# 30. SECURITY

Important:
- secrets only server-side
- validate all API inputs
- sanitize external content
- protect database access
- use secure auth/session handling
- never expose API keys to browser
- do not log API keys
- do not log full sensitive prompts unnecessarily
- provide logout
- protect agent action endpoints
- confirm external mutations

---

# 31. ERROR HANDLING

The app must fail gracefully.

Examples:

Google Calendar disconnected:
"Calendar connection unavailable. Your local Watchtower data is still available."

Gemini unavailable:
"Primary AI unavailable. Switching to Groq."

Both unavailable:
"AI unavailable. Dashboard and stored data remain accessible."

News unavailable:
"Intelligence feed unavailable. Showing last successfully cached items with timestamps."

Database unavailable:
Show a useful error state, not a blank page.

---

# 32. SEED / DEMO DATA

Provide development seed data.

Example projects:
- Watchtower
- GT2
- MedLMP

Example tasks and milestones.

But make it easy to delete all seed data before deployment.

Never mix seed data into production automatically.

---

# 33. SETTINGS

Include:

Profile
AI Providers
Google Calendar
Notifications
Memory
Knowledge Import
Theme
PWA
Data Management
External AI Shortcuts

Data Management:
- export data
- clear demo data
- clear imported history
- reset Watchtower state

---

# 34. DEVELOPMENT REQUIREMENTS

Before finishing:

1. Build the complete app shell.
2. Build database schema and migrations.
3. Implement authentication.
4. Implement task/project CRUD.
5. Implement memory/knowledge model.
6. Implement ChatGPT markdown ingestion.
7. Implement agent context retrieval.
8. Implement Gemini/Groq provider layer.
9. Implement typed agent tools.
10. Implement agent terminal.
11. Implement calendar integration structure.
12. Implement news/intelligence structure.
13. Implement reminders.
14. Implement focus mode.
15. Implement analytics.
16. Implement PWA.
17. Add seed data.
18. Add error states.
19. Add loading states.
20. Add responsive mobile UI.
21. Test the critical flows.
22. Write setup documentation.

Do not stop at static frontend screens.

---

# 35. ACCEPTANCE TEST

The following must work locally:

A. Create a project.
B. Create a task manually.
C. Create a task through natural language.
D. Update project progress through natural language.
E. Ask "what should I work on now?"
F. Agent retrieves real database state.
G. Agent ranks priorities.
H. Agent explains recommendation.
I. User rejects recommendation.
J. Agent suggests alternatives.
K. User chooses rest.
L. Focus session can start and end.
M. Progress is recorded.
N. Weekly review can be generated.
O. ChatGPT markdown can be imported.
P. Imported knowledge can be searched.
Q. Gemini works.
R. Groq fallback works.
S. Google Calendar integration can be configured.
T. External calendar mutations require confirmation.
U. PWA can install.
V. UI works on phone width.
W. No API key is exposed to browser.
X. Application can be deployed to Vercel-compatible hosting.

---

# 36. IMPORTANT IMPLEMENTATION BEHAVIOR

When you encounter a choice:
- choose the simplest maintainable solution
- do not introduce infrastructure just because it is technically interesting
- prioritize the agent
- prioritize reliability over visual complexity
- preserve user control over external actions
- keep the database relational
- make the application easy to deploy

If a feature requires credentials the developer cannot provide, implement:
1. the integration interface
2. environment variable support
3. configuration UI
4. graceful disconnected state
5. setup instructions

Do not fake a successful connection.

---

# 37. OUTPUT REQUIRED FROM YOU

At the end of implementation, produce:

1. working application
2. README
3. `.env.example`
4. database schema documentation
5. integration instructions
6. deployment instructions
7. agent architecture documentation
8. test checklist
9. known limitations
10. V2 recommendations

Also create:
- `docs/PROJECT_DETAILS.md`
- `docs/AGENT_SPEC.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/UI_UX_SPEC.md`
- `docs/INTEGRATION_CHECKLIST.md`
- `docs/DEPLOYMENT.md`
- `docs/V1_ACCEPTANCE_TESTS.md`
- `docs/FUTURE_ROADMAP.md`

Do not claim something is implemented if it is only mocked.

Begin by inspecting the existing repository and preserving useful existing work. If this is an empty repository, initialize the project cleanly.

Do not ask unnecessary questions. Make sensible implementation decisions and document them.
