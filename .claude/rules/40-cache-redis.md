---
description: AWS ElastiCache (Redis-compatible) caching rules for PulseIQ
paths:
  - "backend/**"
  - "pipelines/**"
  - "workers/**"
  - "cache/**"
---

Cache technology:
- AWS ElastiCache (Redis-compatible) is used for caching, rate limiting, ephemeral state, and queue coordination.
- All cache access must go through a dedicated cache utility/service — do not scatter raw Redis calls.

PulseIQ caching use cases:
- Dashboard query result caching (expensive aggregations and KPI computations)
- AI insight caching — cache OpenAI-generated insights with appropriate TTLs to avoid redundant API calls
- Rate limiting for REST API endpoints and data ingestion endpoints
- Session/auth token state for short-lived access
- Real-time data update coordination for live dashboard refresh
- Pipeline coordination — track ingestion job state and deduplication

Rules:
- Choose TTLs intentionally based on data freshness requirements.
  - Dashboard queries: 30–120 seconds depending on data volume
  - AI insights/recommendations: 5–30 minutes (re-generate on significant data change)
  - Rate limiting windows: 1 minute rolling
- Cache only what has a clear, measurable performance benefit.
- Make cache invalidation explicit — invalidate on data write where necessary.
- Use stable, namespaced key naming conventions: `{org_id}:{entity}:{identifier}`.
- Document key patterns when introducing new cache key families.
- Prefer idempotent worker/job behavior when coordinating via cache.
- Use retries carefully; avoid infinite retry loops.

Caching expectations:
- Cache expensive reads: aggregated analytics, trend predictions, top-N recommendations.
- Do not cache raw PII or sensitive user content without encryption and justification.
- Do not rely on cache as the source of truth for critical persistent state — always write through to Supabase.
- Ensure graceful degradation: if ElastiCache is unavailable, fall back to direct DB queries where feasible.

Do not:
- Scatter raw Redis/ElastiCache calls across the codebase.
- Store large unbounded payloads without TTL or cleanup strategy.
- Mix queue coordination semantics and cache semantics without explicit clarity.
- Use ElastiCache as primary storage for any business data.
