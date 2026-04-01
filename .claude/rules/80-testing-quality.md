---
description: Testing and code quality rules for PulseIQ
---

Testing philosophy:
- Write production-quality code with tests for all critical behavior.
- Prefer deterministic unit tests for business logic (services, repositories, pipeline stages).
- Add integration tests for APIs, repositories, pipelines, and workflows that cross boundaries.
- Mock OpenAI API, Supabase, and AWS ElastiCache in unit tests — never call live external services.

Testing expectations:
- Add tests for all non-trivial service methods (behavior analysis, trend prediction, sentiment, recommendations).
- Add tests for auth and permission-sensitive flows (role enforcement, org scoping).
- Add tests for data pipeline stages: ingestion validation, transformation, deduplication, enrichment triggers.
- Add tests for agentic-AI orchestration at the workflow/orchestration level.
- Cover validation, failure, edge cases, and partial failure scenarios in pipelines.
- Keep tests readable, isolated, and fast.

Backend test structure:
- backend/tests/unit/ — service, repository, pipeline stage unit tests
- backend/tests/integration/ — API endpoint integration tests (with test DB)
- backend/tests/agents/ — agent orchestration and tool-level tests

Frontend test structure:
- frontend/tests/ — component tests, hook tests, service layer tests
- Use TypeScript in all frontend tests.

Code quality:
- Enforce Python linting (Ruff or Flake8) and formatting (Black) in CI.
- Enforce TypeScript strict mode and ESLint in CI.
- Use types/type hints wherever the stack supports them — no implicit any on the frontend.
- Keep functions focused and single-purpose.
- Refactor repeated logic into shared utilities when justified.
- All PRs must pass lint, type-check, and test suites before merge.

Do not:
- Add major logic or pipeline stages without at least basic tests.
- Create brittle tests tied to unstable implementation details or model outputs.
- Depend on live OpenAI API, live Supabase, or live ElastiCache in normal test flows.
- Skip testing for role-based access control logic.
- Test against production data or production environments.
