# Watchtower Database Schema

Use PostgreSQL.

Recommended ORM: Prisma.

## users

- id
- email
- display_name
- timezone
- created_at
- updated_at

## projects

- id
- user_id
- name
- description
- goal
- status
- progress
- priority
- deadline
- created_at
- updated_at

## milestones

- id
- project_id
- title
- description
- status
- progress
- due_date
- position
- created_at
- completed_at

## tasks

- id
- user_id
- project_id nullable
- milestone_id nullable
- title
- description
- status
- priority
- due_date
- estimated_minutes
- actual_minutes
- source
- created_at
- updated_at
- completed_at

## calendar_events

- id
- user_id
- external_id
- provider
- title
- description
- start_time
- end_time
- event_type
- is_fixed
- synced_at

## reminders

- id
- user_id
- title
- description
- trigger_at
- type
- priority
- status
- related_project_id nullable
- related_task_id nullable
- created_at

## activity

- id
- user_id
- project_id nullable
- task_id nullable
- activity_type
- description
- duration_minutes nullable
- metadata
- created_at

## goals

- id
- user_id
- title
- description
- priority
- status
- deadline
- created_at

## memory

- id
- user_id
- category
- key
- value
- confidence
- source
- created_at
- updated_at

## knowledge

- id
- user_id
- title
- content
- source_type
- source_reference
- metadata
- created_at
- updated_at

## documents

- id
- user_id
- filename
- mime_type
- source
- content_reference
- created_at

## news_items

- id
- category
- title
- summary
- source_url
- published_at
- importance
- relevance
- fetched_at

## focus_sessions

- id
- user_id
- project_id nullable
- task_id nullable
- started_at
- ended_at
- duration_minutes
- notes

## ai_interactions

- id
- user_id
- provider
- model
- intent
- user_message
- response_summary
- tool_calls
- created_at

## integrations

- id
- user_id
- provider
- status
- metadata
- created_at
- updated_at

Never store raw OAuth secrets in ordinary application tables unless the chosen integration requires secure encrypted storage.

## notification_preferences

- id
- user_id
- browser_enabled
- email_enabled
- important_enabled
- urgent_enabled
- daily_briefing_enabled
- weekly_review_enabled
