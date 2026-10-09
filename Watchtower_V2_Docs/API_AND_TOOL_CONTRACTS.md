# Watchtower V2 — API and Tool Contracts

## General

All mutation endpoints:
- authenticate session;
- validate Zod schema;
- authorize operation;
- execute transaction;
- record activity;
- return normalized result.

## Agent Endpoint

`POST /api/agent`

Input:

```json
{
  "message": "Plan my day",
  "sessionId": "optional"
}
```

Output:

```json
{
  "sessionId": "...",
  "message": "...",
  "actions": [],
  "pendingConfirmations": []
}
```

## Action Confirmation

`POST /api/agent/actions/:id/confirm`

`POST /api/agent/actions/:id/reject`

The server revalidates the action before execution.

## Daily Plan

`GET /api/plans/today`

`POST /api/plans`

`POST /api/plans/:id/revise`

## Knowledge

`POST /api/knowledge/import`

`GET /api/knowledge/search`

## Memory

`GET /api/memory/search`

`POST /api/memory/candidates/:id/approve`

`POST /api/memory/candidates/:id/reject`

## Calendar

`POST /api/calendar/sync`

`GET /api/calendar/status`

External mutation routes must only accept an action request or an explicitly confirmed action.

## Notifications

`GET /api/notifications`

`POST /api/notifications/:id/read`

## Tool Contract

Every tool definition should include:

```ts
{
  name: string
  description: string
  permission: "READ" | "INTERNAL_WRITE" | "EXTERNAL_WRITE"
  inputSchema: ZodSchema
  execute: async (input, context) => result
}
```

The registry must be the only supported route for agent tool execution.
