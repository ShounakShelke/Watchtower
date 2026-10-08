# Agent architecture

`lib/agent.ts` first interprets predictable intents, retrieves only the necessary relational state, applies a transparent priority score, then performs safe internal actions. External actions return `PENDING_CONFIRMATION` and never mutate Calendar directly. Gemini is primary and Groq fallback once their server-side provider adapters are configured.
