# PulseIQ — System Architecture

## Overview

PulseIQ is a cloud-native, multi-tenant SaaS platform built on a modular architecture. It ingests e-commerce and retail data, processes it through an ETL pipeline, enriches it with agentic-AI (OpenAI), and surfaces actionable insights through interactive dashboards.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                   Clients                                         │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────────┐  ┌──────────────────────────────┐ │
│  │  Admin Panel    │  │  User Interface     │  │  Mobile (Web)                │ │
│  │  (Next.js 16+)  │  │  (Next.js 16+)      │  │  Next.js 16+ PWA             │ │
│  │  Admin role     │  │  All roles          │  │  Mobile browser / All roles  │ │
│  └────────┬────────┘  └──────────┬──────────┘  └──────────────┬───────────────┘ │
│           │                      │                             │                 │
│           │                      │               Web Push API (service worker)   │
└───────────┼──────────────────────┼─────────────────────────────┼─────────────────┘
            │                      │                             │
            └──────────────────────┴─────────────────────────────┘
                                   │ HTTPS / REST API
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            AWS ALB (HTTPS 443)                                    │
└────────────────────────────────────┬─────────────────────────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
┌─────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│  Next.js Admin      │  │  Next.js User UI     │  │  FastAPI 0.115+  │
│  (ECS Fargate)      │  │  (ECS Fargate)       │  │  Backend API     │
│  admin.pulseiq.io   │  │  app.pulseiq.io      │  │  (ECS Fargate)   │
└─────────────────────┘  └──────────────────────┘  └────────┬─────────┘
                                                             │
                          ┌──────────────────────────────────┼──────────────────────┐
                          ▼                                  ▼                      ▼
               ┌─────────────────┐              ┌───────────────────┐  ┌─────────────────┐
               │   Supabase      │              │  AWS ElastiCache  │  │  Pipeline       │
               │  (PostgreSQL)   │              │  (Redis-compat.)  │  │  Workers        │
               │  + pgvector     │              │                   │  │  (ECS Fargate)  │
               └─────────────────┘              └───────────────────┘  └────────┬────────┘
                                                                                 │
                                                                                 ▼
                                                                       ┌─────────────────┐
                                                                       │  OpenAI API     │
                                                                       │  (GPT-4o +      │
                                                                       │  Embeddings)    │
                                                                       └─────────────────┘
```

---

## Layers & Responsibilities

### 1. Admin Panel — Next.js 16+

| Concern | Detail |
|---|---|
| Framework | Next.js 16+ with App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| Audience | Admin role only |
| Auth | JWT + OAuth2 SSO via backend; non-admin access denied |
| Deployment | ECS Fargate — `admin.pulseiq.io` |

**Key screens:**
- `/admin/users` — invite, assign roles, deactivate users
- `/admin/data-sources` — register and configure data ingestion sources
- `/admin/api-keys` — create and revoke organization API keys
- `/admin/ingestion` — monitor pipeline jobs, view ingestion health
- `/admin/settings` — organization settings and plan management
- `/admin/audit-logs` — immutable audit trail viewer

---

### 2. User Interface (Web) — Next.js 16+

| Concern | Detail |
|---|---|
| Framework | Next.js 16+ with App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| Audience | Analyst, Marketer, Viewer (and Admin) |
| Auth | JWT + OAuth2 SSO via backend; role-based rendering |
| Real-time | WebSocket / SSE for live dashboard updates |
| Deployment | ECS Fargate — `app.pulseiq.io` |

**Key screens:**
- `/dashboard` — customizable KPI dashboard with real-time updates
- `/analytics/behavior` — funnels, cohorts, heatmaps
- `/analytics/trends` — AI-predicted market and product trends
- `/insights` — AI-generated marketing and sales recommendations
- `/sentiment` — sentiment results per product and feedback source
- `/export` — data and report export (Analyst + Marketer)

---

### 3. Mobile (Web) — Next.js 16+ PWA

| Concern | Detail |
|---|---|
| Framework | Next.js 16+ with App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 — mobile-first responsive design |
| Audience | All roles (Admin, Analyst, Marketer, Viewer) |
| Auth | JWT in httpOnly cookies; SSO via OAuth2 (Google, Microsoft) |
| Push Notifications | Web Push API via service worker (PWA) |
| Deployment | ECS Fargate or S3 + CloudFront — `m.pulseiq.io` |
| PWA | Installable, offline-capable, web app manifest + service worker |

**Key screens:**
- Dashboard — simplified KPI cards (revenue, top products, trend signals)
- Insights — scrollable AI recommendations with priority badges
- Analytics — funnel summary and cohort cards (simplified for mobile)
- Sentiment — sentiment score summary with recent feedback previews
- Notifications — Web Push alert history and preferences
- Settings — profile, notification preferences, logout

**Mobile-specific rules:**
- Tokens stored in httpOnly cookies — never in localStorage
- Web Push subscriptions registered via `POST /api/v1/mobile/device-tokens` on opt-in
- Cache last-fetched data for offline viewing; display offline banner
- No write operations while offline
- All interactive elements have minimum 44×44px touch targets

---

### 2. Backend API — FastAPI 0.115+

| Concern | Detail |
|---|---|
| Framework | FastAPI 0.115+, Python 3.11+ |
| Structure | Clean architecture: routes → services → repositories |
| Auth | JWT validation, RBAC middleware |
| API versioning | /api/v1/ |
| Deployment | ECS Fargate |

**Route groups:**
- `/api/v1/auth` — login, OAuth2 SSO, token refresh
- `/api/v1/users` — user management (Admin)
- `/api/v1/ingestion` — data push (sales, products, customers), CSV upload
- `/api/v1/analytics` — behavior analysis, funnels, cohorts
- `/api/v1/insights` — AI-generated recommendations and trends
- `/api/v1/sentiment` — sentiment results per feedback source
- `/api/v1/dashboards` — dashboard config CRUD
- `/api/v1/export` — data and report export
- `/api/v1/health` — health check

---

### 3. Data Pipeline — ETL Workers

Containerized async workers (ECS Fargate) that handle:

```
Ingest → Validate → Normalize → Deduplicate → Persist (raw)
       → Transform → Persist (structured)
       → Trigger AI Enrichment (async)
```

- **Ingestion sources:** REST API push, CSV/file upload
- **AI enrichment triggers:** sentiment scoring, behavior analysis, trend signal extraction
- **State tracking:** ElastiCache (job progress), Supabase (error logs, enrichment status)
- **Fault tolerance:** partial failure logging, dead-letter table, replay support

---

### 4. Agentic-AI Layer — OpenAI

| Agent | Responsibility | Model |
|---|---|---|
| BehaviorAnalysisAgent | Funnel metrics, cohort summaries, heatmap signals | GPT-4o |
| TrendPredictionAgent | Forecast emerging product/market trends | GPT-4o |
| SentimentAgent | Classify feedback sentiment with confidence score | GPT-4o / gpt-4o-mini |
| RecommendationAgent | Prioritized marketing and sales recommendations | GPT-4o |

- All agents access data via a tool layer — never directly from DB.
- Outputs persisted to Supabase: `insights`, `trend_predictions`, `sentiment_results`.
- Embeddings (text-embedding-3-large) stored via Supabase pgvector for semantic search.

---

### 5. Database — Supabase (PostgreSQL)

- Hosted Supabase instance (PostgreSQL 15+)
- pgvector extension enabled for embedding storage and similarity search
- Multi-tenant: all data scoped by `organization_id`
- Row-level security (RLS) enforced per organization
- See `docs/DB_SCHEMA.md` for full schema

---

### 6. Cache — AWS ElastiCache (Redis-compatible)

| Use case | Key pattern | TTL |
|---|---|---|
| Dashboard query cache | `{org_id}:dashboard:{hash}` | 30–120s |
| AI insight cache | `{org_id}:insight:{type}` | 5–30 min |
| Rate limiting | `ratelimit:{org_id}:{endpoint}` | 60s rolling |
| Pipeline job state | `pipeline:{job_id}:status` | 1 hour |
| Auth session state | `session:{user_id}` | 15 min |

---

## Data Flow

```
External System / CSV Upload
        │
        ▼
FastAPI Ingestion API (/api/v1/ingestion)
        │
        ├── Validate & authenticate (org_id, schema check)
        ├── Persist raw record to Supabase (sales_data / products / customers / consumer_events)
        └── Enqueue enrichment job → ElastiCache job queue
                │
                ▼
        Pipeline Worker (ECS)
                │
                ├── Transform & normalize
                ├── Deduplicate
                └── Trigger AI enrichment (async)
                        │
                        ▼
                Agentic-AI Engine (OpenAI GPT-4o)
                        │
                        ├── Sentiment scoring → sentiment_results
                        ├── Behavior analysis → insights
                        ├── Trend prediction → trend_predictions
                        └── Recommendations → insights
                                │
                                ▼
                        Supabase (persisted results)
                                │
                                ▼
                FastAPI Insights API (/api/v1/insights)
                                │
                                ▼
                        Next.js Dashboard (real-time update)
```

---

## Security Architecture

- All services run in AWS VPC private subnets
- Only ALB is publicly accessible
- Supabase and ElastiCache are not publicly exposed
- JWT-based auth with refresh token rotation
- SSO via OAuth2 (Google, Microsoft)
- RBAC enforced at FastAPI middleware and repository layers
- All secrets in AWS Secrets Manager
- GDPR: audit logs, data export, right-to-erasure workflows
- TLS everywhere; Supabase encryption at rest

---

## Deployment Model

See `docs/DEPLOYMENT.md` for full details.

| Service | AWS Resource / Platform |
|---|---|
| Backend API | ECS Fargate (with ALB) |
| Admin Panel | ECS Fargate (`admin.pulseiq.io`) |
| User Interface (Web) | ECS Fargate (`app.pulseiq.io`) |
| Pipeline Workers | ECS Fargate (task-based) |
| Mobile (Web) | ECS Fargate or S3 + CloudFront (`m.pulseiq.io`) |
| Database | Supabase (hosted, external) |
| Cache | AWS ElastiCache (Redis mode) |
| Container Registry | AWS ECR |
| Secrets | AWS Secrets Manager |
| Observability | AWS CloudWatch (logs + metrics + alarms) |
| CI/CD (Web) | GitHub Actions → ECR → ECS deploy |
| CI/CD (Mobile Web) | GitHub Actions → ECR → ECS deploy (same as web) |
