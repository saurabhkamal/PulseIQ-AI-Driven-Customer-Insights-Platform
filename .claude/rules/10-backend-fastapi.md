---
description: FastAPI backend rules for PulseIQ - AI-Driven Consumer Insights Platform
paths:
  - "backend/**"
  - "api/**"
  - "server/**"
  - "app/**/*.py"
---

Backend stack:
- Python 3.11+, FastAPI 0.115+
- Pydantic v2 for validation and schemas
- SQLAlchemy 2+ or SQLModel for ORM; Supabase (PostgreSQL) as database
- AWS ElastiCache (Redis-compatible) for caching, rate limiting, and session state
- OpenAI API for consumer behavior analysis, sentiment analysis, trend prediction, and marketing recommendations

Backend rules:
- Use clean architecture.
- Routes/controllers should only handle HTTP concerns.
- Business logic must live in services.
- Database access must live in repositories.
- Validation must be done using Pydantic schemas/models.
- Use dependency injection patterns where appropriate.
- Use async I/O where supported and beneficial.
- Use pagination for list endpoints.
- Use consistent response models.
- Use centralized exception handling.

API conventions:
- Follow RESTful naming conventions.
- Version all APIs: /api/v1/.
- Use proper HTTP status codes.
- Return predictable response structure.
- Do not leak internal stack traces or raw database errors.

Preferred backend structure:
- backend/api/routes/ (ingestion, analytics, insights, sentiment, recommendations, auth, users, export)
- backend/api/dependencies/
- backend/services/ (ingestion, behavior_analysis, trend_prediction, sentiment, recommendations, dashboard)
- backend/repositories/
- backend/models/
- backend/schemas/
- backend/core/ (config, OpenAI client, ElastiCache client, logging)
- backend/pipelines/ (ETL workers, data transformation, async ingestion)
- backend/integrations/ (OpenAI, Supabase, AWS services)
- backend/utils/
- backend/tests/

Coding expectations:
- Add type hints to all functions.
- Add docstrings for non-trivial service methods.
- Keep routes thin and declarative.
- Keep service methods focused and testable.
- Reuse existing utilities before creating new ones.

Do not:
- Put SQL or ORM-heavy logic inside route files.
- Put business logic inside Pydantic schemas.
- Put environment variables directly across many files; centralize config.
- Mix unrelated domains in the same service file.
- Call OpenAI directly from route handlers; go through the service layer.
