# Watchtower V2 — Integration Checklist

## Gemini / Groq

- [ ] Gemini server key configured
- [ ] Groq server key configured
- [ ] Gemini primary call tested
- [ ] Groq fallback tested
- [ ] Tool calling tested
- [ ] timeout handling
- [ ] retry policy
- [ ] rate-limit handling
- [ ] provider errors stored safely
- [ ] secrets never sent to client

## Google Calendar

- [ ] OAuth client created
- [ ] exact production callback configured
- [ ] refresh token encrypted
- [ ] connection status persisted
- [ ] initial full sync
- [ ] incremental sync
- [ ] event normalization
- [ ] conflict detection
- [ ] free-slot calculation
- [ ] create event confirmation
- [ ] edit event confirmation
- [ ] move event confirmation
- [ ] delete event confirmation
- [ ] post-action synchronization

## News

### GDELT
- [ ] fetch
- [ ] normalize
- [ ] dedupe
- [ ] importance
- [ ] relevance
- [ ] store

### Google News RSS
- [ ] source configuration
- [ ] parser
- [ ] dedupe
- [ ] cluster
- [ ] source URL preservation

## YouTube

V2 should treat YouTube as an optional saved-content integration rather than a dependency of the core agent.

Potential uses:
- saved educational videos;
- project/tutorial queue;
- motorsport content queue.

Do not block V2 completion on full YouTube API integration.

## Notifications

- [ ] browser permission
- [ ] PWA notification
- [ ] notification event table
- [ ] dedupe
- [ ] quiet period
- [ ] expiration
- [ ] action URL
- [ ] delivery state

If true server-to-device Web Push is implemented, use VAPID keys and a secure subscription table. Otherwise clearly label browser-local notification limitations.

## ChatGPT History

- [ ] upload
- [ ] parse
- [ ] segment
- [ ] classify
- [ ] project extraction
- [ ] decision extraction
- [ ] preference candidates
- [ ] embeddings
- [ ] ingestion report
- [ ] retrieval
