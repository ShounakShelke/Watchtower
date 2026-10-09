# Watchtower V1 → V2 Migration Plan

## Principle

V2 is an extension of the current V1 repository.

Do not throw away working V1 features.

## Preserve

- User/session authentication.
- Task/project data.
- Calendar events.
- Reminders.
- Activity.
- Focus sessions.
- Knowledge.
- Memory.
- News.
- PWA.
- Existing provider abstraction.
- Existing deterministic priority engine.
- Existing UI shell.

## Add

### Agent
- sessions
- messages
- tool calls
- action requests
- observations

### Planning
- daily plans
- plan items
- plan revisions

### Memory
- memory candidates
- preferences
- behavior patterns
- embeddings

### Calendar
- encrypted credentials
- sync state
- bidirectional executor

### Intelligence
- sources
- clusters
- richer scoring

### Notifications
- notification events
- delivery metadata

## Migration Order

1. Database schema additions.
2. Prisma migration.
3. Context engine.
4. Tool registry.
5. Permission layer.
6. Agent orchestration.
7. Agent UI.
8. Retrieval.
9. Planning.
10. Calendar sync/write.
11. Notifications.
12. Intelligence.
13. Analytics.
14. Tests.
15. Deployment hardening.

## Rollback

Every migration must be reversible where practical.

New V2 functionality should fail closed without destroying V1 state.

If AI is unavailable:
- retain deterministic V1 agent fallback.

If retrieval is unavailable:
- retain keyword search.

If Calendar write integration is unavailable:
- keep read-only calendar behavior.

## Data Safety

Before production migration:
- backup PostgreSQL;
- run migration against staging;
- verify existing task/project/calendar counts;
- verify login;
- verify existing PWA;
- verify existing news.
