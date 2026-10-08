# Database schema

The Prisma schema in `prisma/schema.prisma` is the authoritative schema. Core relational entities are user, project, milestone, task, calendar event, reminder, activity, memory, knowledge, focus session, news item, integration, and notification preference. User-owned records cascade on user deletion; optional project/task links are set null to preserve historical activity.
