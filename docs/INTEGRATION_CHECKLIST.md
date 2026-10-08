# Integration checklist

- Configure hosted PostgreSQL and `DATABASE_URL`.
- Set a long `AUTH_SECRET` and implement/enable the single-user auth gate before public deployment.
- Add Gemini and Groq keys only to server environment settings.
- Create Google OAuth credentials and scoped redirect URI before enabling sync.
- Choose a news provider and cache source URL/timestamp.
- Test browser notification permission and PWA installation on target devices.
