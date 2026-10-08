# Watchtower Agent Specification

## Purpose

The Watchtower Agent is a single orchestrated AI agent with typed tools.

It is not a swarm.

## Input

Natural language from the user.

Examples:
- plan my day
- what should I do now?
- I don't want to attend this class
- update GT2
- create a reminder
- review my week
- show important AI news

## Context retrieval

The agent should retrieve:
- current time
- calendar
- deadlines
- tasks
- projects
- progress
- activity
- relevant memory
- relevant knowledge
- user preferences

Only relevant context should be sent to the model.

## Decision process

1. Interpret request.
2. Determine intent.
3. Retrieve context.
4. Determine whether tools are required.
5. Execute safe internal tools.
6. Prepare external actions.
7. Ask confirmation for external mutations.
8. Respond clearly.
9. Record useful interaction/activity.
10. Update working state where appropriate.

## Priority reasoning

Suggested factors:
- urgency
- deadline proximity
- importance
- project priority
- progress
- blockers
- duration
- available time
- explicit user preferences
- recent activity

The agent must explain the reason behind important recommendations.

## Rejection handling

If the user rejects a recommendation:
- do not argue
- do not repeatedly recommend the same task
- offer alternatives
- include rest when appropriate
- use the user's choice as contextual evidence

## Rest behavior

If important work is complete:
- explicitly allow stopping
- do not manufacture tasks
- recommend rest when appropriate

## External actions

Require confirmation for:
- calendar mutation
- email
- external messages
- destructive actions

## AI providers

Primary: Gemini
Fallback: Groq

Keys must remain server-side.

## External AI shortcuts

ChatGPT, Gemini, Claude can be shown as external shortcuts.

They are not part of Watchtower's internal agent architecture.
