---
description: Next.js rules for PulseIQ Admin Panel and User Interface (Web)
paths:
  - "admin/**"
  - "frontend/**"
  - "user-interface/**"
  - "web/**"
  - "src/**"
  - "app/**"
  - "components/**"
  - "pages/**"
  - "lib/**"
  - "hooks/**"
---

## Three Distinct Next.js Applications

PulseIQ has three separate Next.js 16+ applications:

### 1. Admin Panel (`/admin`)
- **Audience:** Admin role only
- **Purpose:** Organization management, user management, data source configuration, system monitoring, API key management, audit log viewer, platform settings
- **Access control:** Any non-admin accessing the admin app must be redirected immediately

### 2. User Interface — Web App (`/frontend`)
- **Audience:** Analyst, Marketer, Viewer (and Admin)
- **Purpose:** Interactive dashboards, analytics (funnels, cohorts, heatmaps), AI insights, sentiment results, data export, report generation
- **Access control:** Role-based rendering — Analyst sees full analytics; Marketer sees recommendations + export; Viewer sees read-only assigned dashboards

### 3. Mobile Web App — PWA (`/mobile-web`)
- **Audience:** All roles (Admin, Analyst, Marketer, Viewer)
- **Purpose:** Mobile-optimized KPI dashboards, simplified analytics summaries, AI insights and recommendations, sentiment overviews — designed for small screens and touch
- **Access control:** Same role-based access as the User Interface; simplified views per role
- **PWA:** Installable, offline-capable, Web Push notifications via service worker

---

## Shared Stack (Both Apps)

- Next.js 16+ with App Router
- TypeScript — strict mode (no implicit any, strict null checks enforced in tsconfig)
- Tailwind CSS 4 for all styling
- REST API integration with FastAPI backend at `/api/v1/`
- WebSocket / SSE for real-time dashboard updates (User Interface only)
- JWT auth with refresh token rotation; SSO via OAuth2 (Google, Microsoft)

---

## Frontend Rules (Both Apps)

- TypeScript strict mode must be enforced — no exceptions.
- Keep components small, focused on a single responsibility.
- Keep presentation separate from data-fetching and business logic.
- Use hooks, services, or server actions based on project style — be consistent.
- Handle loading, error, and empty states explicitly in every data-fetching component.
- Preserve design consistency via Tailwind CSS 4 utility classes.
- Never hardcode API URLs — use environment variables.
- Never expose secrets in the browser.
- Validate critical inputs on both client and server.

---

## Preferred Structure

### Admin Panel
```
admin/
  app/               (Next.js App Router)
  components/        (admin-specific UI components)
  features/          (users, data-sources, api-keys, audit-logs, settings, ingestion-monitor)
  hooks/
  lib/               (API client, auth helpers)
  services/          (all backend API calls centralized here)
  types/
  tests/
```

### User Interface (Web)
```
frontend/
  app/               (Next.js App Router)
  components/        (shared UI components, charts, visualization)
  features/          (dashboard, analytics, insights, sentiment, recommendations, export, auth)
  hooks/             (useAuth, useDashboard, useInsights, useRealTime, useFilters, etc.)
  lib/               (API client, auth helpers, formatters, date utils)
  services/          (all backend API calls centralized here)
  types/             (shared TypeScript types and interfaces)
  tests/
```

---

## Admin Panel — Key Screens

- `/admin/users` — list, invite, assign roles, deactivate users
- `/admin/data-sources` — register and configure data sources
- `/admin/api-keys` — create and revoke organization API keys
- `/admin/ingestion` — monitor ingestion jobs, pipeline health
- `/admin/settings` — organization settings, plan info
- `/admin/audit-logs` — view immutable audit trail

## User Interface — Key Screens

- `/dashboard` — customizable KPI dashboard with real-time updates
- `/analytics/behavior` — funnels, cohorts, heatmaps
- `/analytics/trends` — AI-predicted market and product trends
- `/insights` — AI-generated marketing and sales recommendations
- `/sentiment` — sentiment analysis results per product/feedback source
- `/export` — data and report export (Marketer + Analyst)
- `/settings` — user profile and preferences

---

## Role-Based Rendering (User Interface)

- Conditionally render UI elements based on `user.role`.
- **Admin:** Full access to all screens including settings.
- **Analyst:** Dashboards, analytics, insights, sentiment — no export of raw data.
- **Marketer:** Recommendations, sentiment summary, export — no raw analytics drill-down.
- **Viewer:** Read-only access to assigned dashboards only.
- Redirect unauthorized role attempts with a clear "Access Denied" screen — never silently hide them.

---

## UI/UX Rules

- Accessible markup and semantic HTML — WCAG 2.1 compliance.
- Dashboard components must be responsive and support drill-down interactions.
- Data visualization (charts, heatmaps, graphs) must be encapsulated in dedicated components.
- Avoid oversized page components — split by feature and section.

---

## Do Not

- Mix Admin Panel and User Interface code in the same Next.js app.
- Mix many responsibilities into one component.
- Use `any` type in TypeScript anywhere.
- Skip loading/error states in async components.
- Duplicate UI patterns that belong in shared components.
- Render admin-only UI elements in the user interface app.
