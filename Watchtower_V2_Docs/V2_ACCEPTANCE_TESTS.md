# Watchtower V2 — Acceptance Tests

## A. Agent

### A1 — Plan My Day
Input:
`Plan my day.`

Expected:
- reads calendar;
- reads tasks;
- considers deadlines/projects;
- produces ordered plan;
- includes breaks/buffer;
- stores plan.

### A2 — Current Recommendation
Input:
`What should I work on now?`

Expected:
- current time considered;
- active calendar event considered;
- ranked tasks considered;
- recommendation includes reason.

### A3 — Internal Task Creation
Input:
`Create a task to finish GT2 preprocessing by Friday.`

Expected:
- task created automatically;
- project linked if known;
- activity recorded.

### A4 — External Calendar
Input:
`Move my ML class to tomorrow.`

Expected:
- proposed change shown;
- no external mutation before confirmation.

### A5 — Rejection
User rejects recommendation.

Expected:
- alternative generated;
- same recommendation is not blindly repeated.

## B. Dynamic Planning

### B1
User finishes a task early.

Expected:
- activity recorded;
- plan can be revised.

### B2
User says:
`I only have one hour.`

Expected:
- plan recalculated around one hour.

### B3
User says:
`I'm tired.`

Expected:
- lower-intensity option or rest;
- no punitive messaging.

## C. Retrieval

Input:
`What did I decide about MedLMP?`

Expected:
- retrieves relevant historical knowledge;
- cites source/context in UI where available;
- does not invent.

## D. Memory

Input:
`I prefer doing deep work in the morning.`

Expected:
- candidate created;
- durable memory only after configured approval policy.

## E. Calendar

- connect;
- sync;
- display;
- conflict detection;
- create proposal;
- confirm;
- execute;
- synchronize result.

## F. Notifications

- deadline notification;
- overdue notification;
- plan deviation;
- evening review;
- deduplication.

## G. Intelligence

- fetch AI/ML;
- fetch motorsport;
- dedupe;
- rank;
- summarize;
- display source.

## H. Analytics

Verify:
- focus hours;
- completion;
- postponed tasks;
- estimate accuracy;
- project velocity;
- plan adherence.

## I. Security

- unauthenticated mutation blocked;
- external action cannot bypass confirmation;
- provider keys absent from browser;
- OAuth tokens encrypted;
- action request auditable.

## J. Failure

- Gemini fails → Groq;
- both fail → deterministic fallback;
- Calendar unavailable → cached/error state;
- news unavailable → cached state;
- vector search unavailable → lexical fallback.

## K. Deployment

- production build;
- migration;
- Vercel;
- mobile PWA;
- browser notifications;
- OAuth callback;
- scheduled jobs.
