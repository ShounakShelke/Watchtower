# Watchtower V2 — UI/UX Specification

## Design Direction

Reference language:
- monochrome;
- black/white/gray;
- pixel/display/editorial typography;
- dense but readable information hierarchy;
- Apple/Linear polish;
- terminal/control-room agent feel.

Do not copy any external design literally.

## Global Navigation

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

## Home

### Header
- date
- time
- system state
- notification state
- agent status

### Morning
```text
GOOD MORNING
What matters today
------------------
Fixed commitments
Top priorities
Deadline risks
Daily plan
```

### Midday
```text
CURRENT STATE
Now
Next
Behind
Free time
Recommendation
```

### Evening
```text
DAY REVIEW
Done
Deferred
Project movement
Tomorrow
Have I done enough?
```

## Recommendation Card

Must contain:
- recommendation;
- why;
- expected duration;
- impact;
- actions.

Example:

```text
RECOMMENDATION
Finish GT2 preprocessing

WHY
Deadline is approaching and this is blocking analysis.

TIME
75 min

[START FOCUS] [CHOOSE ALTERNATIVE]
```

## Agent

Visual structure:

```text
┌───────────────────────────────────────────────┐
│ WATCHTOWER AGENT                              │
├───────────────────────────────────────────────┤
│ user> plan my day                             │
│                                               │
│ ◉ Reading calendar                            │
│ ◉ Checking deadlines                          │
│ ◉ Ranking projects                            │
│                                               │
│ PLAN READY                                    │
│ ...                                           │
│                                               │
│ >                                            │
└───────────────────────────────────────────────┘
```

Use tool-status indicators, not hidden reasoning.

## Action Center

Pending external actions:
- exact action;
- target;
- old/new state;
- confirmation controls.

## Tasks

Support:
- list;
- filters;
- priority;
- status;
- project;
- due date;
- duration;
- drag ordering;
- bulk actions;
- dependency visualization.

## Projects

Each project page:
- progress;
- status;
- risk;
- milestone timeline;
- tasks;
- activity;
- knowledge;
- agent observations.

## Calendar

Show:
- synchronized status;
- last sync;
- fixed/flexible classification;
- conflicts;
- overloaded periods;
- proposed changes.

## Knowledge

Sections:
- Imported history
- Documents
- Research
- Project knowledge
- Decisions
- Memory
- Saved intelligence

## Intelligence

Tabs:
- AI/ML
- Motorsport
- Personalized

Each card:
- headline;
- source;
- date;
- summary;
- importance;
- relevance;
- why it matters if personalized.

## Analytics

Avoid excessive charts.

Prioritize:
- focus hours;
- completion;
- plan adherence;
- deadline risk;
- estimate accuracy;
- project velocity.

## Focus Mode

Minimal screen:
- objective;
- timer;
- task;
- stop/pause;
- current progress.

## Mobile

Mobile must preserve:
- agent;
- daily recommendation;
- calendar;
- tasks;
- confirmations;
- notifications.

Use bottom navigation only if it improves usability; otherwise use the existing responsive navigation pattern.

## Accessibility

- keyboard navigation;
- focus states;
- semantic controls;
- adequate contrast;
- readable type;
- reduced-motion support.
