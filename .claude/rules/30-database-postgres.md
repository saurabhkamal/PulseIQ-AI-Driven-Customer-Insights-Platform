---
description: Supabase (PostgreSQL) and persistence rules for PulseIQ
paths:
  - "backend/models/**"
  - "backend/repositories/**"
  - "backend/migrations/**"
  - "db/**"
  - "sql/**"
---

Database rules:
- Supabase (PostgreSQL) is the source of truth for all structured application data.
- Use migrations for all schema changes; never alter production tables manually.
- Design tables with clear ownership, timestamps, and constraints.
- Add indexes for common filters and joins.
- Use foreign keys where appropriate.
- Prefer soft-delete (is_deleted / deleted_at) only when audit trails or recovery are required.

Core entities for PulseIQ:
- organizations — multi-tenant isolation (each e-commerce/retail business is a tenant)
- users — platform users with role (admin, analyst, marketer, viewer) and org association
- data_sources — registered data sources (API connections, CSV upload configs)
- sales_data — ingested transactional sales records
- products — product catalog data per organization
- customers — customer profiles and metadata
- consumer_events — behavioral events (views, clicks, purchases, funnel steps)
- feedback — customer reviews and feedback text
- sentiment_results — OpenAI-generated sentiment scores linked to feedback
- trend_predictions — AI-generated trend forecasts with metadata and timestamps
- insights — AI-generated actionable recommendations per organization
- dashboards — user-configured dashboard layouts and widget configs
- audit_logs — immutable logs of user and system actions for GDPR compliance
- api_keys — for external REST API access tokens per organization

Schema design expectations:
- Every core entity must have: id (UUID), created_at, updated_at.
- All data must be scoped to organization_id for multi-tenant isolation.
- Use enums or constrained fields for finite states (e.g. user role, event type, sentiment label).
- Use JSONB for flexible metadata fields where schema is variable (e.g. dashboard widget config, event properties).
- Keep schemas normalized unless denormalization is justified by performance.
- consumer_events and sales_data may be large; partition by date or org where necessary.
- Use pgvector extension (via Supabase) for storing embeddings for AI-powered similarity search.

Repository rules:
- All DB access must go through repositories/data-access layer.
- Keep query code out of routes and services unless trivial and already patterned.
- Parameterize all queries.
- Avoid N+1 query patterns; use joins or batch fetches.
- Use transactions when multiple writes must succeed together.

Do not:
- Write raw SQL inside controllers/routes.
- Make schema changes without migration files.
- Query across organizations without explicit org scoping.
- Store secrets or API keys as plain text in the database.
