# Watchtower V2 — Environment Template

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
AUTH_PASSWORD=""
SESSION_SECRET=""

# AI
GEMINI_API_KEY=""
GROQ_API_KEY=""

# Application
NEXT_PUBLIC_APP_URL="https://YOUR_DOMAIN"

# Google Calendar OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="https://YOUR_DOMAIN/api/calendar/callback"

# Optional embeddings
EMBEDDING_PROVIDER=""
EMBEDDING_API_KEY=""

# Optional Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:YOUR_EMAIL"

# Optional scheduled job protection
CRON_SECRET=""
```

## Rules

- Never commit `.env.local`.
- Never expose server-only keys through `NEXT_PUBLIC_*`.
- Use production secrets in hosting settings.
- Rotate secrets if exposed.
- OAuth callback must exactly match the deployed URL.
