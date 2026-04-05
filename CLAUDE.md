# CLAUDE.md — PulseIQ Build Reference

**PulseIQ - AI-Driven Consumer Insights Platform**  
Single source of truth for architecture, engineering rules, UX standards, and implementation guidance.  
Every feature built in this project must align with this document.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Architecture](#3-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Frontend — Three Applications](#5-frontend--three-applications)
6. [UX & Design System](#6-ux--design-system)
7. [Backend — FastAPI](#7-backend--fastapi)
8. [Database — Supabase](#8-database--supabase)
9. [Cache — AWS ElastiCache](#9-cache--aws-elasticache)
10. [Data Pipeline — ETL Workers](#10-data-pipeline--etl-workers)
11. [Agentic-AI Layer](#11-agentic-ai-layer)
12. [OpenAI Integration](#12-openai-integration)
13. [Security](#13-security)
14. [Testing & Quality](#14-testing--quality)
15. [Deployment & DevOps](#15-deployment--devops)
16. [Key Documents Reference](#16-key-documents-reference)

---

## 1. Project Overview

PulseIQ is a **multi-tenant SaaS platform** for e-commerce and retail businesses. It uses agentic-AI to analyze consumer behavior, predict market trends, and generate actionable marketing insights — surfaced through interactive dashboards.

### Core Capabilities

| Capability | Description |
|---|---|
| Real-Time Data Ingestion | Sales, product, customer data via REST API and CSV upload |
| Consumer Behavior Analysis | Funnels, cohorts, heatmaps, event stream analytics |
| Trend Prediction | AI-forecast of emerging product and market trends |
| Sentiment Analysis | Classify customer feedback/reviews (positive/neutral/negative) |
| Marketing Recommendations | Prioritized AI-generated marketing and sales actions |
| Interactive Dashboards | Customizable KPI dashboards with drill-downs and real-time updates |
| Role-Based User Management | Admin, Analyst, Marketer, Viewer with SSO (Google, Microsoft) |
| REST API Access | External API for data and insights access |
| Audit & GDPR Compliance | Immutable audit logs, data export, right-to-erasure |

### User Roles

| Role | Access |
|---|---|
| **Admin** | Full platform access — user management, org settings, data sources, audit logs |
| **Analyst** | Dashboards, analytics, insights, sentiment — no user/settings management |
| **Marketer** | Recommendations, export, sentiment summary — no raw analytics or admin access |
| **Viewer** | Read-only access to assigned dashboards only |

---

## 2. Repository Structure

```
pulseiq/
├── admin/              Next.js 16+ — Admin Panel (Admin role only)
├── frontend/           Next.js 16+ — User Interface (Analyst, Marketer, Viewer, Admin)
├── mobile-web/         Next.js 16+ PWA — Mobile Web (all roles, mobile-first)
├── backend/            Python 3.11+, FastAPI 0.115+ — API server + pipeline workers
│   ├── api/
│   │   ├── routes/         ingestion, analytics, insights, sentiment, auth, users, export, mobile
│   │   └── dependencies/
│   ├── services/           behavior_analysis, trend_prediction, sentiment, recommendations, dashboard
│   ├── repositories/       all DB access layer
│   ├── models/             SQLAlchemy/SQLModel ORM models
│   ├── schemas/            Pydantic v2 request/response schemas
│   ├── core/               config, OpenAI client, ElastiCache client, logging
│   ├── pipelines/          ETL workers, data transformation, async ingestion
│   ├── agents/             BehaviorAnalysisAgent, TrendPredictionAgent, SentimentAgent, RecommendationAgent
│   ├── integrations/       OpenAI, Supabase, AWS services
│   ├── utils/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── agents/
├── docs/               All project documentation
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── API_SPEC.md
│   ├── DB_SCHEMA.md
│   ├── DEPLOYMENT.md
│   ├── HLD.md
│   └── LLD.md
└── .claude/rules/      Claude engineering rules (per-domain)
```

---

## 3. Architecture

PulseIQ is a **cloud-native, modular, multi-tenant** platform. All services are containerized (Docker) and deployed on AWS (ECS Fargate).

### High-Level Flow

```
[Admin Panel]  [User Interface]  [Mobile Web PWA]
       │               │                │
       └───────────────┴────────────────┘
                       │ HTTPS / REST
                       ▼
              AWS ALB (HTTPS 443)
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  Next.js Admin   Next.js Web   FastAPI Backend
  (ECS Fargate)  (ECS Fargate)  (ECS Fargate)
                                      │
               ┌──────────────────────┼──────────────┐
               ▼                      ▼              ▼
          Supabase            AWS ElastiCache   Pipeline Workers
         (PostgreSQL)         (Redis-compat.)   (ECS Fargate)
                                                      │
                                                      ▼
                                              OpenAI API (GPT-4o)
```

### Layers

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend (3 apps) | Next.js 16+, TypeScript, Tailwind CSS 4 | UI, auth, role rendering |
| Backend API | Python 3.11+, FastAPI 0.115+ | REST API, business logic, RBAC |
| AI/Agents | OpenAI GPT-4o, text-embedding-3-large | Analysis, prediction, recommendations |
| Database | Supabase (PostgreSQL 15+, pgvector) | Persistent storage, RLS, embeddings |
| Cache | AWS ElastiCache (Redis-compatible) | Caching, rate limiting, job state |
| Pipeline | Python, Docker (ETL workers) | Data ingestion, enrichment, async AI |
| Auth | JWT + OAuth2 / SSO | User authentication, role management |
| Infra | AWS ECS, ALB, ECR, Secrets Manager, CloudWatch | Orchestration, routing, observability |

---

## 4. Tech Stack

| Concern | Technology |
|---|---|
| Frontend (all 3 apps) | Next.js 16+, TypeScript (strict), Tailwind CSS 4 |
| Backend API | Python 3.11+, FastAPI 0.115+, Pydantic v2 |
| ORM | SQLAlchemy 2+ or SQLModel |
| AI/ML | OpenAI API — GPT-4o, gpt-4o-mini, text-embedding-3-large |
| Database | Supabase (PostgreSQL 15+, pgvector, uuid-ossp) |
| Cache | AWS ElastiCache (Redis-compatible) |
| Containerization | Docker (multi-stage builds) |
| Orchestration | AWS ECS Fargate (Kubernetes-ready via EKS) |
| Auth | JWT + OAuth2 (Google, Microsoft SSO) |
| Push Notifications | Web Push API (VAPID) via service worker |
| CI/CD | GitHub Actions → AWS ECR → ECS deploy |
| Secrets | AWS Secrets Manager |
| Observability | AWS CloudWatch (logs, metrics, alarms) |
| CDN | AWS CloudFront + S3 (optional for mobile web) |

---

## 5. Frontend — Three Applications

### Architecture Rule
**Each of the three Next.js apps is a separate, independent application.** Never mix code between them.

---

### 5.1 Admin Panel (`/admin`)

- **Audience:** Admin role only. Redirect all other roles immediately.
- **Domain:** `admin.pulseiq.io`
- **Purpose:** Org management, user management, data sources, API keys, ingestion monitoring, audit logs

**Key screens:**
- `/admin/users` — invite, assign roles, deactivate users
- `/admin/data-sources` — register and configure ingestion sources
- `/admin/api-keys` — create and revoke organization API keys
- `/admin/ingestion` — monitor pipeline jobs, view ingestion health
- `/admin/settings` — organization settings and plan management
- `/admin/audit-logs` — immutable audit trail viewer

**Structure:**
```
admin/
  app/
  components/
  features/          (users, data-sources, api-keys, audit-logs, settings, ingestion-monitor)
  hooks/
  lib/               (API client, auth helpers)
  services/
  types/
  tests/
```

---

### 5.2 User Interface — Web App (`/frontend`)

- **Audience:** Analyst, Marketer, Viewer, Admin
- **Domain:** `app.pulseiq.io`
- **Purpose:** Dashboards, analytics, AI insights, sentiment, export

**Key screens:**
- `/dashboard` — customizable KPI dashboard with real-time updates
- `/analytics/behavior` — funnels, cohorts, heatmaps
- `/analytics/trends` — AI-predicted market and product trends
- `/insights` — AI-generated marketing and sales recommendations
- `/sentiment` — sentiment results per product and feedback source
- `/export` — data and report export (Analyst + Marketer only)
- `/settings` — user profile and preferences

**Role-based rendering:**
- **Admin:** Full access to all screens
- **Analyst:** Dashboards, analytics, insights, sentiment — no export of raw data
- **Marketer:** Recommendations, sentiment summary, export — no raw analytics drill-down
- **Viewer:** Read-only assigned dashboards only
- Redirect unauthorized role access with a clear "Access Denied" screen — never silently hide

**Structure:**
```
frontend/
  app/
  components/        (shared UI components, charts, visualization)
  features/          (dashboard, analytics, insights, sentiment, recommendations, export, auth)
  hooks/             (useAuth, useDashboard, useInsights, useRealTime, useFilters, etc.)
  lib/               (API client, auth helpers, formatters, date utils)
  services/          (all backend API calls centralized here)
  types/
  tests/
```

---

### 5.3 Mobile Web App — PWA (`/mobile-web`)

- **Audience:** All roles
- **Domain:** `m.pulseiq.io`
- **Purpose:** Mobile-optimized KPI dashboards, simplified analytics, AI insights, Web Push notifications
- **Type:** Progressive Web App (installable, offline-capable)

**Key screens:**
- Dashboard — simplified KPI cards (revenue, top products, trend signals)
- Insights — scrollable AI recommendations with priority badges
- Analytics — funnel summary and cohort cards (simplified for mobile)
- Sentiment — sentiment score summary with recent feedback previews
- Notifications — Web Push alert history and preferences
- Settings — profile, notification preferences, logout

**Mobile-specific rules:**
- Tokens in **httpOnly cookies** — never localStorage
- Web Push subscriptions via `POST /api/v1/mobile/device-tokens` on opt-in
- Cache last-fetched dashboard data for offline viewing; display offline banner
- No write or export operations while offline
- All interactive elements: minimum 44×44px touch targets
- Bottom navigation bar for primary sections

**PWA requirements:**
- Valid `manifest.json` (name, icons, theme color, `display: standalone`)
- Service worker for offline support and asset caching
- Installable on Android Chrome and iOS Safari (Add to Home Screen)
- Target Lighthouse PWA score ≥ 90, mobile performance score ≥ 80

**Structure:**
```
mobile-web/
  app/
  components/        (mobile-optimized cards, bottom nav, etc.)
  features/          (dashboard, insights, analytics, sentiment, notifications)
  hooks/             (useAuth, useDashboard, useInsights, useWebPush, etc.)
  lib/               (API client, formatters, pwa utils)
  services/
  types/
  public/
    manifest.json
    sw.js
  tests/
```

---

### 5.4 Frontend Engineering Rules (All Three Apps)

- TypeScript strict mode enforced — no `any`, no implicit types, strict null checks in tsconfig
- Never hardcode API URLs — use environment variables
- Never expose secrets in the browser
- Handle loading, error, and empty states explicitly in every data-fetching component
- Keep components small and single-responsibility
- Keep presentation separate from data-fetching and business logic
- All API calls go through the centralized `services/` layer
- Validate critical inputs on both client and server
- Semantic HTML — WCAG 2.1 compliance
- Dashboard/visualization components must be encapsulated in dedicated components
- Do not mix Admin Panel and User Interface or Mobile Web code

---

## 6. UX & Design System

PulseIQ's UI must feel **enterprise-grade, trustworthy, and calm** — the kind of interface a business analyst or CMO opens every morning with confidence. The design is inspired by LinkedIn's professional aesthetic: structured, information-dense without being cluttered, and visually authoritative.

---

### 6.1 Design Principles

| Principle | Application |
|---|---|
| **Professional calm** | Low visual noise; muted base palette with intentional accent color for actions |
| **Data first** | Content drives layout — chrome is minimal; data fills the space |
| **Hierarchy clarity** | Clear typographic and spatial hierarchy so users scan before they read |
| **Trustworthy precision** | Numbers, labels, and status indicators are always accurate, formatted, and consistent |
| **Purposeful motion** | Transitions are subtle and fast (150–200ms); never decorative |
| **Role-aware surfaces** | UI adapts to the user's role — no exposed actions the user can't take |

---

### 6.2 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-bg-base` | `#F3F2EF` | App background (warm off-white, LinkedIn-inspired) |
| `--color-bg-surface` | `#FFFFFF` | Cards, panels, modals |
| `--color-bg-subtle` | `#EAE9E4` | Sidebar, table zebra rows, section dividers |
| `--color-border` | `#D9D8D3` | Card borders, dividers, input borders |
| `--color-text-primary` | `#1A1A1A` | Headings, primary labels |
| `--color-text-secondary` | `#4A4A4A` | Body text, metadata |
| `--color-text-muted` | `#8A8A8A` | Placeholder text, secondary labels, timestamps |
| `--color-brand` | `#0A66C2` | Primary CTA, links, active nav (LinkedIn blue) |
| `--color-brand-hover` | `#004182` | Hover state for primary brand elements |
| `--color-success` | `#2D9E6B` | Positive sentiment, success states, upward trends |
| `--color-warning` | `#E8940A` | Medium priority, warnings |
| `--color-danger` | `#CC3333` | Negative sentiment, critical alerts, errors |
| `--color-neutral` | `#6B7280` | Neutral sentiment, inactive states |
| `--color-ai-accent` | `#7C3AED` | AI-generated content badges, insight cards, agent outputs |

**Rules:**
- Background is always warm off-white (`#F3F2EF`) — never pure white for page backgrounds
- Cards and panels are pure white (`#FFFFFF`) — this creates a clean lifted hierarchy
- Brand blue is used sparingly — only for primary actions, active states, and links
- AI-generated content is always distinguished with the purple AI accent
- Never use more than 3 colors in a single chart series without a legend

---

### 6.3 Typography

| Level | Style | Usage |
|---|---|---|
| Page Title (H1) | 24px, semibold, `#1A1A1A` | Page headings |
| Section Title (H2) | 18px, semibold, `#1A1A1A` | Card headers, section labels |
| Subsection (H3) | 15px, semibold, `#1A1A1A` | Widget titles, table section headers |
| Body | 14px, regular, `#4A4A4A` | Default text, descriptions |
| Small / Meta | 12px, regular, `#8A8A8A` | Timestamps, labels, helper text |
| KPI Value | 28–36px, bold, `#1A1A1A` | Dashboard metric numbers |
| KPI Label | 12px, medium, `#6B7280` | Metric labels below values |
| Code / Data | 13px, monospace | Inline data values, IDs |

**Font family:** System UI stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

---

### 6.4 Layout & Spacing

- **Max content width:** 1280px centered on wide screens
- **Sidebar width:** 240px (collapsed: 64px icon-only mode)
- **Card padding:** 24px
- **Section gap:** 24px between cards; 16px within card sections
- **Base spacing unit:** 4px grid (use multiples: 4, 8, 12, 16, 20, 24, 32, 40, 48)
- **Border radius:** 8px for cards and modals; 6px for buttons and inputs; 4px for badges/tags
- **Box shadow (cards):** `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)` — subtle lift

---

### 6.5 Navigation

**Top navigation bar (all apps):**
- Fixed at top, white background with 1px bottom border (`#D9D8D3`)
- Left: PulseIQ logo + app name
- Center (desktop): global search or empty
- Right: notifications bell, user avatar + role badge, org name

**Left sidebar (Admin Panel + User Interface):**
- 240px wide, `#FFFFFF` background, 1px right border
- Active item: brand blue left border (3px) + brand blue text + light blue background tint
- Inactive item: secondary text, no background
- Icons + labels on desktop; icon-only on collapse
- Grouped sections with muted section labels (12px uppercase, `#8A8A8A`)

**Bottom navigation (Mobile Web PWA only):**
- Fixed at bottom, white, 1px top border
- 4–5 items with icon + short label
- Active item: brand blue icon + label

---

### 6.6 Component Standards

#### Cards
- White background, 8px border radius, subtle box shadow
- 24px padding
- Header row: section title (H3) left, optional action/badge right
- Divider line (1px, `#D9D8D3`) between header and content when needed

#### KPI Metric Cards
- White card with a subtle left border accent (color-coded by status)
- Large bold metric value (28–36px)
- Trend indicator: green arrow up / red arrow down / grey dash
- Sub-label: 12px muted text
- Sparkline (optional, 60×24px) in bottom right

#### Data Tables
- White background, 1px border, 8px radius
- Header: 12px uppercase, semibold, muted color, 1px bottom border
- Row height: 48px (desktop), 44px (mobile)
- Zebra rows: alternate subtle background (`#F9F9F7`)
- Hover row: light blue tint (`#F0F7FF`)
- Pagination at bottom: page count + prev/next controls

#### Charts & Visualizations
- Prefer clean, minimal chart styles — no heavy gridlines
- Use the brand/semantic color palette for data series
- Always include axis labels and a legend when multiple series exist
- Show a loading skeleton during data fetch
- Show an empty state illustration + message when no data
- Wrap every chart in a dedicated, reusable component

#### AI Insight Cards
- Slight purple tint border-left (4px, `--color-ai-accent`)
- "AI-generated" badge (purple, 11px, pill shape) in top-right corner
- Priority badge: `High` (red), `Medium` (amber), `Low` (grey)
- Expandable — collapsed shows title + priority; expanded shows full description + supporting data

#### Badges & Tags
- Pill shape, 4px radius
- Sentiment: green (positive), grey (neutral), red (negative)
- Priority: red/amber/grey
- Role: blue pill on user avatar/profile
- AI: purple pill

#### Buttons
- **Primary:** Brand blue background, white text, 6px radius — for the single primary action per view
- **Secondary:** White background, 1px brand blue border, brand blue text — supporting actions
- **Ghost:** Transparent background, secondary text color — low-emphasis actions
- **Danger:** Red background, white text — destructive actions only
- Minimum touch target: 44px height on mobile
- Never more than one primary button visible per view

#### Forms & Inputs
- 14px text, 40px height, 6px border radius, `#D9D8D3` border
- Focus state: brand blue border (2px), light blue shadow
- Error state: red border, red helper text below
- Label: 13px semibold, above input
- Helper text: 12px muted, below input

#### Empty States
- Centered illustration (SVG, neutral tones) + heading + short description
- Optional CTA button (primary) if action is available
- Do not show blank white space — every empty state must communicate

#### Loading States
- Use skeleton loaders (grey animated shimmer) for cards, tables, and chart areas
- Never use a full-page spinner for partial content loads
- Skeleton shapes should match the layout of the actual content

#### Modals & Drawers
- Centered modal for confirmations and short forms (max 480px wide)
- Right-side drawer (480px) for detail panels, edit forms, and inspectors
- Backdrop: `rgba(0,0,0,0.4)`, blurred
- Close button (top-right X) and ESC key support always
- Destructive confirmation modals: red primary button, explicit text ("Yes, delete")

---

### 6.7 Data Visualization Guidelines

| Chart Type | Use Case |
|---|---|
| Line chart | Revenue over time, trend prediction timelines |
| Bar chart (vertical) | Category comparisons, top products |
| Bar chart (horizontal) | Ranked lists (top customers, segments) |
| Donut chart | Sentiment distribution, category breakdown (max 5 segments) |
| Funnel chart | Conversion funnel (view → cart → purchase) |
| Heatmap | Behavioral activity by hour/day |
| Cohort retention table | User retention over weeks/months |
| Sparkline | KPI card trend indicator |
| Scatter plot | Correlation analysis |

**Chart rules:**
- Always show a loading skeleton during data fetch
- Always show an empty state when no data is available
- Animate in on first load only (no re-animate on filter change)
- Use consistent color tokens across all charts — never random colors
- Truncate long labels; show full text in tooltip on hover
- All interactive charts must have accessible tooltips

---

### 6.8 Responsive Breakpoints (Tailwind CSS 4)

| Breakpoint | Min Width | Layout |
|---|---|---|
| `sm` | 640px | Mobile: single column, stacked layout |
| `md` | 768px | Tablet: 2-column grid starts |
| `lg` | 1024px | Desktop: sidebar visible, full layout |
| `xl` | 1280px | Wide desktop: max content width |

- Mobile-first: design small screens first, scale up
- Admin Panel and User Interface are primarily desktop-first (but must work on tablet)
- Mobile Web is strictly mobile-first

---

### 6.9 Accessibility

- WCAG 2.1 Level AA compliance required across all three apps
- All interactive elements must have visible focus states
- Color alone must never convey meaning — use icons or labels alongside color
- All images and icons must have `alt` text or `aria-label`
- Form inputs must have associated labels
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text
- Keyboard-navigable: all interactions reachable via keyboard

---

### 6.10 Motion & Animation

- Transition duration: 150ms for micro-interactions (hover, focus); 200ms for panel slides
- Easing: `ease-out` for elements entering, `ease-in` for elements leaving
- Never animate layout shifts or content reflows
- Respect `prefers-reduced-motion` — disable all non-essential animation
- Loading skeletons use a 1.5s shimmer loop (CSS animation)

---

## 7. Backend — FastAPI

### Structure

```
backend/
  api/
    routes/         (ingestion, analytics, insights, sentiment, auth, users, dashboards, export, mobile, health)
    dependencies/   (auth, org_id, rate limiter)
  services/         (behavior_analysis, trend_prediction, sentiment, recommendations, dashboard, ingestion)
  repositories/     (all DB access — one file per entity)
  models/           (SQLAlchemy/SQLModel ORM models)
  schemas/          (Pydantic v2 request/response schemas)
  core/             (config, openai_client, elasticache_client, logging, exceptions)
  pipelines/        (ETL workers, transformation, async ingestion)
  agents/           (BehaviorAnalysisAgent, TrendPredictionAgent, SentimentAgent, RecommendationAgent)
  integrations/     (openai, supabase, aws)
  utils/
  tests/
    unit/
    integration/
    agents/
```

### Rules

- **Routes/controllers:** HTTP concerns only — no business logic
- **Services:** All business logic — thin and testable
- **Repositories:** All database access — no raw SQL outside this layer
- **Schemas:** Pydantic v2 validation — no business logic
- **Config:** Centralized in `core/config.py` — never scatter env vars across files
- All routes versioned at `/api/v1/`
- Async I/O throughout (`async def` routes and services)
- Pagination on all list endpoints
- Consistent response model structure
- Centralized exception handling — never leak stack traces to clients
- Type hints on all functions; docstrings on non-trivial service methods

### API Conventions

- RESTful naming: nouns for resources, HTTP verbs for actions
- `GET` for reads, `POST` for creates, `PATCH` for partial updates, `DELETE` for deletes
- `202 Accepted` for async operations with `job_id` in response
- Structured error responses: `{ error: { code, message, details } }`
- HTTP status codes used correctly (400, 401, 403, 404, 422, 429, 500, 503)

---

## 8. Database — Supabase

**PostgreSQL 15+, pgvector, uuid-ossp extensions**

### Core Tables

`organizations`, `users`, `api_keys`, `data_sources`, `products`, `customers`, `sales_data`, `consumer_events`, `feedback`, `sentiment_results`, `trend_predictions`, `insights`, `insight_embeddings`, `dashboards`, `device_tokens`, `mobile_notifications`, `mobile_preferences`, `audit_logs`

See `docs/DB_SCHEMA.md` for full DDL.

### Schema Rules

- Every entity: `id` (UUID), `created_at`, `updated_at`
- All data scoped by `organization_id` — multi-tenant isolation at schema level
- Row-Level Security (RLS) enforced in Supabase per organization
- FastAPI sets `app.current_org_id` on each DB session from JWT claim
- Enums for finite states (user role, event type, sentiment label, signal strength)
- JSONB for flexible metadata (widget config, event properties, attributes)
- `sales_data` and `consumer_events` partitioned by date for performance
- pgvector (`VECTOR(3072)`) for `text-embedding-3-large` embeddings in `insight_embeddings`
- `audit_logs` is append-only — no UPDATE or DELETE via RLS policy

### Repository Rules

- All DB access through repositories — no raw SQL in routes or services
- Parameterize all queries — no string interpolation
- Use transactions when multiple writes must succeed together
- Avoid N+1 patterns; use joins or batch fetches
- Use migrations for all schema changes — never alter production tables manually
- Never query across organizations without explicit `org_id` scoping

---

## 9. Cache — AWS ElastiCache

**Redis-compatible; all access through a centralized `CacheService`**

### Use Cases & TTLs

| Use Case | Key Pattern | TTL |
|---|---|---|
| Dashboard query cache | `{org_id}:dashboard:{hash}` | 30–120s |
| AI insight cache | `{org_id}:insight:{type}` | 5–30 min |
| Rate limiting | `ratelimit:{org_id}:{endpoint}` | 60s rolling |
| Pipeline job state | `pipeline:{job_id}:status` | 1 hour |
| Auth session state | `session:{user_id}` | 15 min |

### Rules

- Never scatter raw Redis calls — use the `CacheService` abstraction
- Choose TTLs intentionally based on data freshness requirements
- Invalidate cache explicitly on relevant data writes
- Use stable namespaced key patterns: `{org_id}:{entity}:{identifier}`
- Do not cache raw PII or sensitive user content without justification
- Cache is never source of truth — always write through to Supabase
- Graceful degradation: if ElastiCache is unavailable, fall back to direct DB query
- Do not use ElastiCache as primary storage for any business data

---

## 10. Data Pipeline — ETL Workers

### Flow

```
Ingest → Validate → Transform → Normalize → Deduplicate → Persist (raw)
       → Trigger AI Enrichment (async) → Sentiment / Behavior / Trends
       → Persist enrichment results → Update job state
```

### Ingestion Sources

- REST API push: `POST /api/v1/ingestion/{sales|products|customers|events|feedback}`
- CSV/file upload: `POST /api/v1/ingestion/upload`
- All ingestion returns `202 Accepted` with `job_id`

### Pipeline Rules

- Validate all data at the ingestion boundary before processing (Pydantic)
- Normalize field names, data types, and date formats at transform stage
- Deduplicate using deterministic keys (`external_id + org_id`)
- Persist raw data before transformation (for auditability and replay)
- Support partial failure: log failed records without failing the entire batch
- All stages emit structured logs: `job_id`, `org_id`, `record_count`, `status`
- Store job state in ElastiCache (TTL-bound); write dead-letter errors to Supabase
- Workers are stateless, containerized, horizontally scalable
- AI enrichment must never block the primary ingestion request-response path
- Rate-limit ingestion endpoints per organization

---

## 11. Agentic-AI Layer

### Agents

| Agent | Responsibility | Model |
|---|---|---|
| `BehaviorAnalysisAgent` | Funnel metrics, cohort summaries, heatmap signals | GPT-4o |
| `TrendPredictionAgent` | Forecast emerging product/market trends | GPT-4o |
| `SentimentAgent` | Classify feedback sentiment with confidence score | GPT-4o / gpt-4o-mini |
| `RecommendationAgent` | Prioritized marketing and sales recommendations | GPT-4o |

### Architecture Rules

- Agents never directly access the database — all data access goes through a **tool layer**
- Tools have: single purpose, Pydantic input schema, Pydantic output schema, explicit error behavior
- Prompts are stored as versioned templates — never inlined in service code
- An **orchestrator** routes tasks to the appropriate agent based on trigger type
- Triggers: new data ingested, scheduled analysis, user-requested insight refresh
- All agent outputs persisted to Supabase: `insights`, `trend_predictions`, `sentiment_results`
- Use structured output (JSON mode) for all production agent outputs
- Validate all OpenAI outputs before storing or returning — never trust raw model output
- Agents run asynchronously — never inside synchronous API request handlers
- Short-term agent state in ElastiCache (TTL-bound); long-term in Supabase
- Each insight must trace back to: source data, agent, model, timestamp (provenance)

### Orchestration Triggers

```
New data ingested → Pipeline Worker completes → Orchestrator triggered
Scheduled (daily/weekly) → Orchestrator triggered
User clicks "Refresh Insights" → POST /api/v1/insights/refresh → Orchestrator triggered
```

---

## 12. OpenAI Integration

### Model Usage

| Task | Model |
|---|---|
| Sentiment analysis | `gpt-4o-mini` (high volume) |
| Behavior summarization | `gpt-4o` |
| Trend prediction | `gpt-4o` |
| Marketing recommendations | `gpt-4o` |
| Embeddings (semantic search) | `text-embedding-3-large` |

### Rules

- All OpenAI access through a centralized client in `backend/core/` or `backend/integrations/openai/`
- Never call OpenAI from routes, repositories, or pipeline workers directly
- Prompts are versioned templates; parameterized with org context and data summaries
- System prompts define scope and constraints to reduce hallucination risk
- Use JSON mode / structured output for all structured downstream use
- Log every OpenAI call: model, prompt_tokens, completion_tokens, latency, org_id, task_type
- Handle refusals, empty outputs, and malformed JSON explicitly
- Cache AI outputs in ElastiCache to avoid redundant API calls
- Prefer batch processing for bulk sentiment analysis
- Anonymize/pseudonymize customer PII before sending to OpenAI
- API key stored exclusively in AWS Secrets Manager — never in code or committed config

### RAG (Retrieval-Augmented Generation)

- Separate ingestion, chunking, embedding, retrieval, reranking, and answer generation stages
- Embeddings via `text-embedding-3-large` stored in Supabase pgvector (`insight_embeddings` table)
- Maintain chunk metadata: source, entity_type, entity_id, org_id, timestamp
- Support configurable retrieval parameters: `top_k`, filters, score thresholds
- Preserve source attribution in outputs
- Never dump raw full documents into prompts when chunking is appropriate
- Do not mix ingestion code with runtime answer generation in the same module

---

## 13. Security

### Authentication & Authorization

- JWT-based authentication with refresh token rotation
- JWT expiry enforced; short-lived access tokens (1 hour), longer refresh tokens
- SSO via OAuth2 (Google, Microsoft) — validate tokens server-side
- All protected routes require `AuthMiddleware` — no exceptions
- RBAC enforced at both FastAPI middleware and repository layers
- Organization API keys hashed before storage (`api_keys.key_hash`)

### Multi-Tenant Data Isolation

- **Every query must include `org_id` scoping** — enforced at service and repository layers
- Supabase RLS policies enforce org isolation at the DB level as a second layer
- Cross-tenant data access attempt → `403` + logged as critical security event

### Input & Output Security

- Validate and sanitize all user inputs at every system boundary
- Sanitize user-provided text before injecting into LLM prompts (prompt injection resistance)
- Validate OpenAI tool inputs and outputs — never trust raw model output in critical paths
- Never return internal exception details or stack traces to API consumers
- Treat all uploads, URLs, and user-submitted data as untrusted

### Sensitive Data

- Never hardcode secrets, API keys, or credentials anywhere
- Never log passwords, tokens, raw secrets, or sensitive user content
- Anonymize/pseudonymize customer PII before sending to OpenAI
- Do not store raw PII in logs — mask or hash where needed
- Encrypt all data in transit (TLS/HTTPS) and at rest (Supabase encryption, AWS KMS)

### GDPR Compliance

- Immutable audit logs for all user-initiated write actions (`audit_logs` table)
- Support data export per user/org
- Support data deletion workflows (right to erasure)
- Audit log access is Admin-only

### AWS Security

- All secrets in AWS Secrets Manager — never in environment files committed to version control
- Least-privilege IAM roles per ECS service
- VPC isolation: backend, ElastiCache, and pipeline workers in private subnets
- Only ALB exposed publicly
- CloudTrail and CloudWatch enabled for infrastructure-level audit logging

---

## 14. Testing & Quality

### Philosophy

- Write production-quality code with tests for all critical behavior
- Deterministic unit tests for business logic (services, repositories, pipeline stages)
- Integration tests for APIs, repositories, and workflows that cross boundaries
- Mock OpenAI, Supabase, and ElastiCache in unit tests — never call live external services

### Test Structure

```
backend/tests/
  unit/         service, repository, pipeline stage unit tests
  integration/  API endpoint integration tests (with test DB)
  agents/       agent orchestration and tool-level tests

frontend/tests/
  component tests, hook tests, service layer tests (TypeScript)

mobile-web/tests/
  same pattern as frontend tests
```

### What Must Be Tested

- All non-trivial service methods: behavior analysis, trend prediction, sentiment, recommendations
- Auth and permission-sensitive flows: role enforcement, org scoping
- Data pipeline stages: ingestion validation, transformation, deduplication, enrichment triggers
- Agentic-AI orchestration at workflow level
- Validation, failure, edge cases, and partial failure scenarios in pipelines
- Role-based access control logic — never skip

### Code Quality

- Python: Ruff (linting) + Black (formatting) enforced in CI
- TypeScript: strict mode + ESLint enforced in CI
- No `any` type in TypeScript
- Functions are focused and single-purpose
- All PRs must pass lint, type-check, and test suites before merge
- Never add major logic without at least basic tests
- Never test against production data or production environments

---

## 15. Deployment & DevOps

### Environments

| | Dev | Staging | Prod |
|---|---|---|---|
| Branch | `feature/*` | `main` | `main` (manual approval) |
| Admin Panel | `admin.dev.pulseiq.io` | `admin.staging.pulseiq.io` | `admin.pulseiq.io` |
| User Interface | `dev.pulseiq.io` | `staging.pulseiq.io` | `app.pulseiq.io` |
| Mobile Web | `m.dev.pulseiq.io` | `m.staging.pulseiq.io` | `m.pulseiq.io` |
| API | `api.dev.pulseiq.io` | `api.staging.pulseiq.io` | `api.pulseiq.io` |

### ECS Services

| Service | Image | Port | Domain |
|---|---|---|---|
| `pulseiq-backend` | `pulseiq-backend:{sha}` | 8000 | `api.pulseiq.io` |
| `pulseiq-admin` | `pulseiq-admin:{sha}` | 3001 | `admin.pulseiq.io` |
| `pulseiq-frontend` | `pulseiq-frontend:{sha}` | 3000 | `app.pulseiq.io` |
| `pulseiq-mobile` | `pulseiq-mobile:{sha}` | 3002 | `m.pulseiq.io` |
| `pulseiq-worker` | `pulseiq-worker:{sha}` | — | private only |

### Secrets (AWS Secrets Manager)

| Secret | Contents |
|---|---|
| `pulseiq/{env}/database-url` | Supabase connection string |
| `pulseiq/{env}/openai-api-key` | OpenAI API key |
| `pulseiq/{env}/jwt-secret` | JWT signing secret |
| `pulseiq/{env}/elasticache-url` | ElastiCache URL |
| `pulseiq/{env}/supabase-anon-key` | Supabase anon key |
| `pulseiq/{env}/supabase-service-key` | Supabase service role key |
| `pulseiq/{env}/vapid-private-key` | Web Push VAPID private key |

### CI/CD Flow (GitHub Actions)

```
PR opened → Lint + Type-check + Tests → Pass/Fail
Merge to main → Build Docker → Push to ECR → Deploy to Staging (auto)
Manual approval → Deploy to Production (blue/green)
```

### Docker Rules

- Multi-stage builds for backend and all frontends
- Never bake secrets or `.env` into images
- Pin base image versions: `python:3.11-slim`, `node:20-alpine`
- Push to ECR; tag with git SHA and `latest`

### Observability

- All services emit structured JSON logs to CloudWatch
- Log entry includes: `service`, `environment`, `request_id`, `org_id`, `level`, `message`
- Log groups: `/pulseiq/{env}/backend`, `/pulseiq/{env}/frontend`, `/pulseiq/{env}/worker`
- Alarms: backend CPU >80%, 5xx error rate >1%, worker queue depth >1000, ALB p99 >2s

---

## 16. Key Documents Reference

| Document | Purpose |
|---|---|
| `docs/PRD.md` | Product requirements, objectives, functional/non-functional specs |
| `docs/ARCHITECTURE.md` | Full system architecture with diagrams |
| `docs/API_SPEC.md` | Complete REST API specification (all endpoints, request/response schemas) |
| `docs/DB_SCHEMA.md` | Full Supabase/PostgreSQL DDL with all tables, indexes, and RLS |
| `docs/DEPLOYMENT.md` | AWS infrastructure, ECS services, CI/CD, secrets, observability |
| `docs/HLD.md` | High Level Design — system modules and data flow |
| `docs/LLD.md` | Low Level Design — components, classes, algorithms |

---

## Quick Rules Summary

**Always:**
- Scope all data to `org_id` — every query, every service
- Enforce RBAC at middleware and repository layers
- Run async for OpenAI calls and heavy pipeline stages
- Use centralized service/repository/cache layers
- Handle loading, error, and empty states in every UI component
- Validate all inputs at system boundaries
- Write tests for all critical business logic
- Follow the UX design system defined in Section 6

**Never:**
- Hardcode secrets, tokens, credentials, or environment-specific URLs
- Return stack traces or internal errors to API consumers
- Query across organizations without explicit org scoping
- Call OpenAI directly from routes or repositories
- Store raw PII in logs or send it to OpenAI
- Use `any` type in TypeScript
- Mix Admin Panel, User Interface, and Mobile Web codebases
- Skip audit logging for user-initiated write actions
- Start AI enrichment synchronously inside ingestion request handlers
- Make schema changes without migration files

---

*This document is the authoritative build reference for PulseIQ. All features, components, and services must conform to the standards defined here.*

---

## Prompt Logging

Every prompt sent in any Claude session for this project must be appended to `docs/prompt-log.md`.

**Format:**
```
## [YYYY-MM-DD HH:MM] Session prompt
**Prompt:** <full prompt text verbatim>
---
```

**Rules:**
- Log every prompt before doing any other work in the session turn
- If `docs/prompt-log.md` does not exist, create it with header: `# PulseIQ — Prompt Log`
- Append entries only — never overwrite previous entries
- Include the full prompt text verbatim — do not summarize or truncate
- This maintains a complete audit trail of all instructions given to Claude across sessions
