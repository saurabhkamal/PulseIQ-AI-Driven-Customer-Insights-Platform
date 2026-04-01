# PulseIQ — API Specification

**Base URL:** `https://api.pulseiq.io/api/v1`  
**Authentication:** Bearer token (JWT) in `Authorization` header  
**Content-Type:** `application/json`  
**API Version:** v1

**Consumers:**
- Admin Panel (Next.js 16+) — admin-scoped endpoints
- User Interface / Web App (Next.js 16+) — analytics and insights endpoints
- Mobile (Web) — Next.js 16+ PWA — all endpoints plus mobile-specific `/mobile/*` routes

---

## Authentication

### POST /auth/login
Authenticate with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "string"
}
```
**Response `200`:**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "string",
    "role": "admin | analyst | marketer | viewer",
    "organization_id": "uuid"
  }
}
```

### POST /auth/refresh
Refresh an expired access token.

**Request:**
```json
{ "refresh_token": "string" }
```
**Response `200`:** Same as login response.

### POST /auth/sso/{provider}
Initiate OAuth2 SSO flow. `provider` = `google` or `microsoft`.

**Response `302`:** Redirect to OAuth2 provider authorization URL.

### POST /auth/logout
Revoke the current session.

**Response `204`:** No content.

---

## Users

> Admin-only endpoints unless noted.

### GET /users
List all users in the organization.

**Query params:** `page`, `limit`, `role`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "string",
      "name": "string",
      "role": "admin | analyst | marketer | viewer",
      "created_at": "ISO8601"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### POST /users
Create a new user in the organization.

**Request:**
```json
{
  "email": "string",
  "name": "string",
  "role": "analyst | marketer | viewer"
}
```
**Response `201`:** Created user object.

### GET /users/{user_id}
Get a specific user.

### PATCH /users/{user_id}
Update user role or name.

**Request:** `{ "role": "string", "name": "string" }`

### DELETE /users/{user_id}
Deactivate a user (soft delete).

**Response `204`:** No content.

---

## Data Ingestion

### POST /ingestion/sales
Ingest sales transaction records.

**Request:**
```json
{
  "records": [
    {
      "external_id": "string",
      "product_id": "string",
      "customer_id": "string",
      "amount": 99.99,
      "currency": "USD",
      "quantity": 2,
      "transaction_at": "ISO8601",
      "metadata": {}
    }
  ]
}
```
**Response `202`:**
```json
{
  "job_id": "uuid",
  "accepted": 100,
  "rejected": 2,
  "errors": [{ "index": 1, "reason": "string" }]
}
```

### POST /ingestion/products
Ingest product catalog data.

**Request:**
```json
{
  "records": [
    {
      "external_id": "string",
      "name": "string",
      "category": "string",
      "price": 49.99,
      "currency": "USD",
      "attributes": {}
    }
  ]
}
```
**Response `202`:** Same structure as sales ingestion.

### POST /ingestion/customers
Ingest customer profile data.

**Request:**
```json
{
  "records": [
    {
      "external_id": "string",
      "email_hash": "string",
      "segment": "string",
      "region": "string",
      "attributes": {}
    }
  ]
}
```
**Response `202`:** Same structure as sales ingestion.

### POST /ingestion/events
Ingest consumer behavioral events (clicks, views, add-to-cart, etc.).

**Request:**
```json
{
  "records": [
    {
      "external_id": "string",
      "customer_id": "string",
      "event_type": "view | click | add_to_cart | purchase | review",
      "product_id": "string",
      "occurred_at": "ISO8601",
      "properties": {}
    }
  ]
}
```
**Response `202`:** Same structure as sales ingestion.

### POST /ingestion/feedback
Ingest customer feedback and reviews for sentiment analysis.

**Request:**
```json
{
  "records": [
    {
      "external_id": "string",
      "customer_id": "string",
      "product_id": "string",
      "text": "string",
      "rating": 4,
      "source": "website | email | survey",
      "submitted_at": "ISO8601"
    }
  ]
}
```
**Response `202`:** Same structure as sales ingestion.

### POST /ingestion/upload
Upload a CSV file for batch ingestion.

**Content-Type:** `multipart/form-data`

**Form fields:**
- `file`: CSV file
- `type`: `sales | products | customers | events | feedback`

**Response `202`:**
```json
{
  "job_id": "uuid",
  "status": "queued",
  "filename": "string",
  "row_count": 5000
}
```

### GET /ingestion/jobs/{job_id}
Poll the status of an ingestion job.

**Response `200`:**
```json
{
  "job_id": "uuid",
  "status": "queued | processing | completed | failed",
  "progress_pct": 75,
  "accepted": 4900,
  "rejected": 100,
  "completed_at": "ISO8601 | null"
}
```

---

## Analytics

### GET /analytics/behavior
Get consumer behavior summary for the organization.

**Query params:** `start_date`, `end_date`, `segment`, `product_id`

**Response `200`:**
```json
{
  "period": { "start": "ISO8601", "end": "ISO8601" },
  "funnel": [
    { "stage": "view", "count": 10000, "drop_off_pct": 0 },
    { "stage": "add_to_cart", "count": 3000, "drop_off_pct": 70 },
    { "stage": "purchase", "count": 1200, "drop_off_pct": 60 }
  ],
  "cohorts": [],
  "top_products": [],
  "heatmap_url": "string | null"
}
```

### GET /analytics/trends
Get AI-predicted market and product trends.

**Query params:** `category`, `horizon` (days), `limit`

**Response `200`:**
```json
{
  "generated_at": "ISO8601",
  "trends": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "confidence": 0.87,
      "category": "string",
      "signal_strength": "high | medium | low",
      "predicted_at": "ISO8601"
    }
  ]
}
```

### GET /analytics/cohorts
Get cohort analysis data.

**Query params:** `start_date`, `end_date`, `cohort_by` (`week | month`), `metric` (`retention | revenue`)

**Response `200`:** Cohort matrix with retention/revenue percentages.

---

## Insights & Recommendations

### GET /insights
Get AI-generated marketing and sales recommendations.

**Query params:** `type` (`marketing | sales | product`), `limit`, `page`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "marketing | sales | product",
      "title": "string",
      "description": "string",
      "priority": "high | medium | low",
      "supporting_data": {},
      "generated_at": "ISO8601"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

### POST /insights/refresh
Trigger a fresh AI insight generation run for the organization.

**Response `202`:**
```json
{ "job_id": "uuid", "status": "queued" }
```

---

## Sentiment Analysis

### GET /sentiment
Get sentiment analysis results.

**Query params:** `start_date`, `end_date`, `product_id`, `sentiment` (`positive | neutral | negative`), `page`, `limit`

**Response `200`:**
```json
{
  "summary": {
    "positive_pct": 72.5,
    "neutral_pct": 18.0,
    "negative_pct": 9.5,
    "average_score": 0.64
  },
  "data": [
    {
      "id": "uuid",
      "feedback_id": "uuid",
      "sentiment": "positive | neutral | negative",
      "score": 0.91,
      "product_id": "uuid",
      "analyzed_at": "ISO8601"
    }
  ],
  "total": 200,
  "page": 1,
  "limit": 20
}
```

---

## Dashboards

### GET /dashboards
List all dashboards for the user's organization.

**Response `200`:** Array of dashboard objects.

### POST /dashboards
Create a new dashboard.

**Request:**
```json
{
  "name": "string",
  "description": "string",
  "layout": {},
  "widgets": []
}
```
**Response `201`:** Created dashboard object.

### GET /dashboards/{dashboard_id}
Get a specific dashboard with its widget config.

### PATCH /dashboards/{dashboard_id}
Update dashboard name, layout, or widgets.

### DELETE /dashboards/{dashboard_id}
Delete a dashboard.

**Response `204`:** No content.

---

## Export

### POST /export/report
Generate and download an insights report.

**Request:**
```json
{
  "type": "behavior | sentiment | trends | recommendations",
  "format": "csv | json | pdf",
  "start_date": "ISO8601",
  "end_date": "ISO8601"
}
```
**Response `202`:**
```json
{
  "export_id": "uuid",
  "status": "processing",
  "download_url": null
}
```

### GET /export/{export_id}
Poll export status and get download URL when ready.

**Response `200`:**
```json
{
  "export_id": "uuid",
  "status": "completed",
  "download_url": "https://...",
  "expires_at": "ISO8601"
}
```

---

## Mobile

> Used exclusively by the Mobile (Web) — Next.js 16+ PWA.

### POST /mobile/device-tokens
Register a Web Push subscription after the user grants notification permission in the browser.

**Request:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "string",
    "auth": "string"
  },
  "device_id": "string"
}
```
**Response `201`:**
```json
{ "id": "uuid", "registered_at": "ISO8601" }
```

### DELETE /mobile/device-tokens/{token}
Deregister a push token on logout or when the user disables notifications.

**Response `204`:** No content.

### GET /mobile/dashboard/summary
Returns a mobile-optimized KPI summary — simplified subset of the full dashboard for small screens.

**Response `200`:**
```json
{
  "period": { "start": "ISO8601", "end": "ISO8601" },
  "kpis": {
    "total_revenue": 128450.00,
    "revenue_change_pct": 12.5,
    "top_product": { "id": "uuid", "name": "string", "revenue": 24300.00 },
    "active_customers": 3420,
    "top_trend": { "title": "string", "signal_strength": "high" },
    "sentiment_score": 0.72
  },
  "high_priority_insights": [
    {
      "id": "uuid",
      "title": "string",
      "type": "marketing | sales | product",
      "priority": "high"
    }
  ]
}
```

### GET /mobile/notifications
Get push notification history for the authenticated user.

**Query params:** `page`, `limit`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "body": "string",
      "type": "insight | trend | pipeline",
      "entity_id": "uuid",
      "read": false,
      "sent_at": "ISO8601"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20
}
```

### PATCH /mobile/notifications/{notification_id}/read
Mark a push notification as read.

**Response `204`:** No content.

### GET /mobile/preferences
Get user mobile preferences (notification settings, biometric enabled).

**Response `200`:**
```json
{
  "push_enabled": true,
  "notify_on_insights": true,
  "notify_on_trends": true,
  "notify_on_pipeline": false,
  "biometric_enabled": true
}
```

### PATCH /mobile/preferences
Update mobile notification and biometric preferences.

**Request:** Partial object of preferences fields above.

**Response `200`:** Updated preferences object.

---

## Health

### GET /health
Backend health check (public, no auth required).

**Response `200`:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "database": "ok",
  "cache": "ok"
}
```

---

## Error Responses

All errors follow a consistent structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | RATE_LIMITED | INTERNAL_ERROR",
    "message": "Human-readable description",
    "details": {}
  }
}
```

| Status | Code | Meaning |
|---|---|---|
| 400 | VALIDATION_ERROR | Invalid request body or params |
| 401 | UNAUTHORIZED | Missing or invalid JWT |
| 403 | FORBIDDEN | Insufficient role permissions |
| 404 | NOT_FOUND | Resource does not exist |
| 422 | UNPROCESSABLE_ENTITY | Schema validation failed |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server-side error |

---

## Rate Limits

| Endpoint group | Limit |
|---|---|
| Auth endpoints | 10 req/min per IP |
| Ingestion endpoints | 100 req/min per organization |
| Analytics / Insights | 60 req/min per organization |
| Export | 10 req/min per organization |
| Mobile endpoints | 120 req/min per user |
| General API | 300 req/min per organization |

## Client-Specific Notes

| Interface | Notes |
|---|---|
| Admin Panel | Uses `/users`, `/data-sources`, `/api-keys`, `/ingestion/jobs`, `/audit-logs` heavily |
| User Interface (Web) | Uses `/analytics`, `/insights`, `/sentiment`, `/dashboards`, `/export` |
| Mobile (Web) | Uses `/mobile/*` routes + subset of analytics/insights; tokens in httpOnly cookies |
