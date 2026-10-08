# Watchtower V1 — Deployment

## Target

A Vercel-compatible deployment that works without the user's PC running.

## Architecture

Phone/Desktop
    ↓
Vercel-hosted PWA
    ↓
Server-side API/functions
    ↓
PostgreSQL
    ↓
Gemini / Groq
    ↓
Google Calendar / News APIs

## Requirements

- Git repository
- Vercel account
- PostgreSQL provider
- Gemini API key
- Groq API key
- Google Calendar OAuth credentials
- news provider credentials if required

## Deployment process

1. Push repository to Git.
2. Create PostgreSQL database.
3. Configure DATABASE_URL.
4. Configure AI keys.
5. Configure Google OAuth.
6. Configure news API keys.
7. Deploy to Vercel.
8. Run database migrations.
9. Open production URL.
10. Create/verify single user.
11. Connect Google Calendar.
12. Import ChatGPT history.
13. Test agent.
14. Install PWA on phone.
15. Test notifications.

## Important

Do not assume a local `.env` file is available in production.

Set production secrets in the hosting provider.

## Health checks

Provide a settings/system status page showing:
- database
- Gemini
- Groq
- Google Calendar
- news
- notification capability

Never expose secret values.
Only show:
CONNECTED / DISCONNECTED / ERROR
