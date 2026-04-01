---
description: ETL data ingestion pipeline rules for PulseIQ
paths:
  - "backend/pipelines/**"
  - "backend/workers/**"
  - "backend/ingestion/**"
  - "pipelines/**"
---

Pipeline architecture:
- PulseIQ ingests sales, product, and customer data via two paths:
  1. Real-time REST API ingestion (push from client systems)
  2. Batch CSV/file upload ingestion (async processing)
- The pipeline follows: Ingest → Validate → Transform → Normalize → Persist → Trigger AI analysis
- Pipeline stages must be decoupled and independently testable.
- Use async workers for heavy transformation and AI enrichment stages.

Pipeline rules:
- Validate all incoming data at the ingestion boundary before any processing.
- Normalize field names, data types, and date formats at the transform stage.
- Deduplicate records using deterministic keys (e.g. external_id + org_id).
- Persist raw ingested data before transformation (for auditability and replay).
- All pipeline stages must emit structured logs with job_id, org_id, record_count, and status.
- Support partial failure: log failed records without failing the entire batch.
- Emit pipeline status events so the dashboard can reflect ingestion progress in real-time.

Data ingestion rules:
- Enforce organization-scoped ingestion — every record must be tagged with org_id at ingest time.
- Rate-limit ingestion endpoints per organization to prevent abuse.
- Support idempotent re-ingestion — re-processing the same source file must not create duplicates.
- Validate schema of incoming data; reject malformed records with descriptive errors.

ETL worker rules:
- Keep workers stateless where possible.
- Store job state and progress in ElastiCache (TTL-bound) for real-time status polling.
- On failure, write error details to a dead-letter queue or error log table in Supabase.
- Workers should be containerized and horizontally scalable.

AI enrichment in pipeline:
- After data normalization and persistence, trigger async AI enrichment:
  - Consumer behavior analysis (cohort detection, funnel computation)
  - Sentiment scoring on new feedback records (OpenAI)
  - Trend signal extraction from new sales data
- AI enrichment must never block the primary ingestion path.
- Store enrichment results linked to source records with enrichment_status and enrichment_at timestamps.

Do not:
- Run synchronous AI calls inside the ingestion request-response cycle.
- Mix ingestion logic with dashboard query logic.
- Silently drop failed records without logging.
- Assume all ingested data is clean; always validate at the boundary.
