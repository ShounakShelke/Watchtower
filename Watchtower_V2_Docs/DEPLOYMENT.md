# Watchtower V2 — Deployment

## Target

Vercel-compatible online deployment with hosted PostgreSQL.

The development computer must not be required to remain online.

## Required Environment

```env
DATABASE_URL=
AUTH_PASSWORD=
SESSION_SECRET=

GEMINI_API_KEY=
GROQ_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
NEXT_PUBLIC_APP_URL=

# Optional semantic retrieval
EMBEDDING_PROVIDER=
EMBEDDING_API_KEY=

# Optional Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

## Security

- server-only keys remain server-side;
- never expose OAuth refresh tokens;
- encrypt stored refresh tokens;
- use secure cookies;
- production session secret must be long and random;
- validate all tool arguments with Zod;
- verify authenticated user on every server mutation.

## Database

Run Prisma migrations in deployment pipeline.

If using pgvector:
1. enable extension on hosted PostgreSQL;
2. create embedding storage;
3. verify vector dimension;
4. create vector index appropriate to the provider.

If pgvector is unavailable:
- use lexical/full-text retrieval;
- do not add another database merely for vectors.

## Google OAuth

Production callback:

```text
https://YOUR_DOMAIN/api/calendar/callback
```

The exact deployed domain must be registered in Google Cloud.

Do not use localhost for production.

## Scheduled Jobs

V2 scheduled workflows:
- morning sync;
- morning daily plan;
- deadline watch;
- evening review;
- weekly review.

Use Vercel Cron or another deployment-compatible scheduler.

Scheduled jobs must authenticate server-side and be idempotent.

## Failure Behavior

If:
- Gemini unavailable → try Groq.
- Both unavailable → deterministic fallback agent response.
- Calendar disconnected → explain disconnected state.
- News source unavailable → use cached data.
- Notifications unavailable → store notification event and show in-app.
- embeddings unavailable → lexical retrieval.

Never fabricate successful execution.

## Production Checklist

- [ ] database migration
- [ ] auth configured
- [ ] Gemini/Groq configured
- [ ] OAuth configured
- [ ] callback verified
- [ ] calendar sync tested
- [ ] external confirmation tested
- [ ] scheduled jobs configured
- [ ] notifications tested
- [ ] PWA installed
- [ ] mobile tested
- [ ] production build passed
- [ ] error monitoring enabled
- [ ] backup strategy verified
