# V1 acceptance checklist

- [x] PostgreSQL schema, demo data, dashboard, responsive navigation and adaptive morning/midday/evening state.
- [x] Database-backed task and project creation, deterministic prioritisation, terminal recommendation, rest response and weekly summary.
- [x] Calendar read model with a clear disconnected state; external calendar requests stop at confirmation.
- [x] ChatGPT Markdown segmentation/import and stored knowledge display.
- [x] GDELT-backed AI/ML and motorsport intelligence route and Intelligence page.
- [x] Focus timer persists a session and records activity on completion.
- [x] Analytics readout, integration status panel, manifest, service-worker shell and offline page.
- [x] Production build passes.

## Owner configuration-gated verification before deployment

- [ ] Configure and test a production single-user authentication provider.
- [ ] Add Gemini and Groq server keys, then test the live provider/fallback path.
- [ ] Configure Google OAuth credentials, verify calendar read sync, then test a confirmed external mutation in a non-production calendar.
- [ ] Test browser-notification permission and delivery on target desktop and phone.
- [ ] Add production PWA icons and test installation/offline cache on a physical phone.
