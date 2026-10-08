# Watchtower V1 — Owner Integration Checklist

These are the things the owner must configure personally.

## 1. Gemini

Create a Gemini API key.

Add it as a server-side environment variable.

Example:
GEMINI_API_KEY=...

Never place it in client-side code.

## 2. Groq

Create a Groq API key.

Example:
GROQ_API_KEY=...

Use as fallback or configurable secondary provider.

## 3. Google Calendar

Create/configure Google OAuth credentials.

Required:
- client ID
- client secret
- authorized redirect URI
- production domain redirect URI

Grant only the required Calendar permissions.

After deployment:
- connect Google account
- authorize Watchtower
- verify calendar sync

## 4. News

Choose the actual news providers/search APIs used by the implementation.

Configure their API keys if required.

The implementation must store:
- source
- title
- URL
- publication time
- summary
- importance

## 5. Notifications

For browser/PWA notifications:
- configure service worker
- request notification permission
- test on phone and desktop

Email notifications are an extension, not required for the first functional MVP unless an email provider is configured.

## 6. Database

Create a hosted PostgreSQL database.

Set:
DATABASE_URL=...

Run migrations.

## 7. Authentication

Configure the chosen authentication/session solution.

For a single-user deployment:
- restrict access
- do not create public signup unless deliberately implemented

## 8. Vercel

Connect Git repository.

Configure environment variables.

Deploy.

Test:
- desktop
- mobile
- PWA installation
- database persistence
- agent
- calendar

## 9. ChatGPT History

Prepare:
chatgpt_history.md

Upload it through Knowledge Import.

Review extracted memory before relying on it.

## 10. Domain

Optional:
Connect a custom domain such as:
watchtower.example.com

## Security checklist

- no API keys in frontend
- no secrets in Git
- no OAuth secrets committed
- production redirect URLs configured
- database credentials private
- authentication enabled
