# Watchtower V2 — Database Schema

## Strategy

Extend the existing Prisma/PostgreSQL schema. Do not replace V1 tables.

## New/Expanded Models

### AgentSession
- id
- userId
- title
- status
- contextHash
- startedAt
- endedAt
- createdAt
- updatedAt

### AgentMessage
- id
- sessionId
- role
- content
- provider
- model
- token metadata if available
- createdAt

### AgentToolCall
- id
- sessionId
- messageId
- toolName
- argumentsJson
- resultJson
- permissionLevel
- status
- latencyMs
- createdAt

### AgentActionRequest
- id
- userId
- sessionId
- toolName
- actionType
- targetJson
- beforeJson
- proposedAfterJson
- status
- expiresAt
- confirmedAt
- executedAt
- failureReason
- createdAt

### AgentObservation
- id
- userId
- type
- summary
- source
- confidence
- metadata
- observedAt

### MemoryCandidate
- id
- userId
- category
- key
- value
- confidence
- reason
- sourceType
- sourceReference
- status
- createdAt
- reviewedAt

Statuses:
`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`

### UserPreference
- id
- userId
- key
- value
- source
- confidence
- updatedAt

### BehaviorPattern
- id
- userId
- patternType
- valueJson
- confidence
- sampleCount
- lastObservedAt
- updatedAt

Examples:
- preferred_focus_hours
- average_task_duration
- estimate_error
- common_postponement_window
- productive_weekdays

### CalendarSyncState
- id
- userId
- provider
- accountReference
- lastFullSyncAt
- lastIncrementalSyncAt
- syncTokenEncrypted
- status
- lastError

### DailyPlan
- id
- userId
- date
- status
- summary
- generatedBy
- createdAt
- updatedAt

### PlanItem
- id
- planId
- taskId
- calendarEventId
- type
- startAt
- endAt
- durationMinutes
- priority
- rationale
- status
- order

Types:
`FIXED`, `RECOMMENDED`, `OPTIONAL`, `BUFFER`, `REST`

### PlanRevision
- id
- planId
- trigger
- reason
- snapshotJson
- createdAt

### NewsSource
- id
- name
- type
- url
- enabled
- configJson
- createdAt

### NewsCluster
- id
- canonicalTitle
- summary
- importance
- relevance
- topic
- firstSeenAt
- lastSeenAt

### NewsClusterItem
- clusterId
- newsItemId

### NotificationEvent
- id
- userId
- type
- title
- body
- priority
- reason
- status
- scheduledAt
- sentAt
- expiresAt
- dedupeKey
- metadata

### KnowledgeEmbedding
Use pgvector if supported:
- id
- knowledgeId
- embedding
- model
- createdAt

Likewise support embeddings for memory where useful.

## Relationships

```text
User
 ├── Projects
 ├── Tasks
 ├── CalendarEvents
 ├── Reminders
 ├── Activity
 ├── FocusSessions
 ├── Memory
 ├── MemoryCandidates
 ├── Knowledge
 ├── AgentSessions
 │    ├── AgentMessages
 │    ├── AgentToolCalls
 │    └── AgentActionRequests
 ├── DailyPlans
 │    ├── PlanItems
 │    └── PlanRevisions
 ├── BehaviorPatterns
 ├── NotificationEvents
 └── CalendarSyncState
```

## Migration Rules

- Preserve existing IDs.
- Do not destructive-migrate existing user data.
- Add nullable fields first where needed.
- Backfill.
- Add constraints after backfill.
- Create indexes for userId, date, status, dueDate, projectId, sessionId.
- Use JSON only for genuinely variable integration metadata.
- Keep core queryable fields relational.

## Security

OAuth refresh tokens and sync tokens must be encrypted at rest.

Never store provider secrets in regular knowledge/memory fields.
