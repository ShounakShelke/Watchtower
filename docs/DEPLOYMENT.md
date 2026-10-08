# Deployment

Deploy the Next.js app to Vercel-compatible hosting with a managed PostgreSQL database. Configure every variable from `.env.example` in hosting settings, run Prisma migrations against production, verify the auth gate, then connect Calendar and AI providers. Do not rely on `.env.local` in production.

## Final V1 hardening setup

Set the following in the deployment host’s encrypted environment settings (never in `NEXT_PUBLIC_*` variables):

- `DATABASE_URL`
- `AUTH_PASSWORD` — a long, unique single-user login password
- `SESSION_SECRET` — at least 32 random characters
- `GEMINI_API_KEY` and/or `GROQ_API_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`

Use `https://YOUR_DOMAIN/api/calendar/callback` as the Google redirect URI. Calendar access is intentionally read-only in V1; any future mutation must first be confirmed in Watchtower.

After deployment, visit `/login`, verify the dashboard, install the PWA from the browser menu, and enable notifications only from Settings. Test AI and Calendar using non-sensitive data first.
