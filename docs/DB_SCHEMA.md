# PulseIQ — Database Schema

**Database:** Supabase (PostgreSQL 15+)  
**Extensions:** `pgvector`, `uuid-ossp`  
**Multi-tenancy:** All tables scoped by `organization_id`  
**Conventions:** UUID primary keys, `created_at` + `updated_at` on every table, soft-delete via `deleted_at` where applicable.

---

## Tables

### organizations
Represents an e-commerce or retail business (tenant).

```sql
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  plan            VARCHAR(50) NOT NULL DEFAULT 'starter', -- starter, pro, enterprise
  settings        JSONB DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### users
Platform users with role-based access.

```sql
CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'marketer', 'viewer');

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  role            user_role NOT NULL DEFAULT 'viewer',
  avatar_url      VARCHAR(500),
  sso_provider    VARCHAR(50),           -- google, microsoft, null (email/pass)
  sso_subject     VARCHAR(255),          -- provider's subject/user ID
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_users_org (organization_id),
  INDEX idx_users_email (email)
);
```

---

### api_keys
Organization-level API keys for external REST API access.

```sql
CREATE TABLE api_keys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  key_hash        VARCHAR(255) UNIQUE NOT NULL, -- bcrypt/SHA-256 hash of the key
  key_prefix      VARCHAR(10) NOT NULL,         -- first 8 chars for display
  scopes          TEXT[] NOT NULL DEFAULT '{}',
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_api_keys_org (organization_id)
);
```

---

### data_sources
Registered data sources per organization (API connections, CSV upload configs).

```sql
CREATE TYPE source_type AS ENUM ('api_push', 'csv_upload', 'webhook');
CREATE TYPE source_status AS ENUM ('active', 'paused', 'error');

CREATE TABLE data_sources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  type            source_type NOT NULL,
  status          source_status NOT NULL DEFAULT 'active',
  config          JSONB DEFAULT '{}',   -- connection config (no secrets stored here)
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_data_sources_org (organization_id)
);
```

---

### products
Product catalog data per organization.

```sql
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id     VARCHAR(255) NOT NULL,
  name            VARCHAR(500) NOT NULL,
  category        VARCHAR(255),
  subcategory     VARCHAR(255),
  price           NUMERIC(12, 2),
  currency        CHAR(3) DEFAULT 'USD',
  attributes      JSONB DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (organization_id, external_id),
  INDEX idx_products_org (organization_id),
  INDEX idx_products_category (organization_id, category)
);
```

---

### customers
Customer profiles per organization (no raw PII — use hashed identifiers).

```sql
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id     VARCHAR(255) NOT NULL,
  email_hash      VARCHAR(255),          -- SHA-256 of email for deduplication, no raw email
  segment         VARCHAR(100),
  region          VARCHAR(100),
  attributes      JSONB DEFAULT '{}',
  first_seen_at   TIMESTAMPTZ,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (organization_id, external_id),
  INDEX idx_customers_org (organization_id),
  INDEX idx_customers_segment (organization_id, segment)
);
```

---

### sales_data
Ingested transactional sales records.

```sql
CREATE TABLE sales_data (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id     VARCHAR(255) NOT NULL,
  product_id      UUID REFERENCES products(id),
  customer_id     UUID REFERENCES customers(id),
  amount          NUMERIC(12, 2) NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  quantity        INTEGER NOT NULL DEFAULT 1,
  transaction_at  TIMESTAMPTZ NOT NULL,
  metadata        JSONB DEFAULT '{}',
  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (organization_id, external_id),
  INDEX idx_sales_org_date (organization_id, transaction_at),
  INDEX idx_sales_product (product_id),
  INDEX idx_sales_customer (customer_id)
) PARTITION BY RANGE (transaction_at);  -- partition by month for performance
```

---

### consumer_events
Behavioral event stream (views, clicks, add-to-cart, etc.).

```sql
CREATE TYPE event_type AS ENUM ('view', 'click', 'add_to_cart', 'remove_from_cart', 'purchase', 'review', 'search', 'other');

CREATE TABLE consumer_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id     VARCHAR(255),
  customer_id     UUID REFERENCES customers(id),
  product_id      UUID REFERENCES products(id),
  event_type      event_type NOT NULL,
  properties      JSONB DEFAULT '{}',
  occurred_at     TIMESTAMPTZ NOT NULL,
  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_events_org_date (organization_id, occurred_at),
  INDEX idx_events_customer (customer_id),
  INDEX idx_events_product (product_id),
  INDEX idx_events_type (organization_id, event_type)
) PARTITION BY RANGE (occurred_at);
```

---

### feedback
Customer reviews and feedback text for sentiment analysis.

```sql
CREATE TYPE feedback_source AS ENUM ('website', 'email', 'survey', 'app', 'other');

CREATE TABLE feedback (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id     VARCHAR(255),
  customer_id     UUID REFERENCES customers(id),
  product_id      UUID REFERENCES products(id),
  text            TEXT NOT NULL,
  rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
  source          feedback_source NOT NULL DEFAULT 'website',
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (organization_id, external_id),
  INDEX idx_feedback_org (organization_id),
  INDEX idx_feedback_product (product_id)
);
```

---

### sentiment_results
OpenAI-generated sentiment analysis results linked to feedback.

```sql
CREATE TYPE sentiment_label AS ENUM ('positive', 'neutral', 'negative');

CREATE TABLE sentiment_results (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feedback_id     UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  sentiment       sentiment_label NOT NULL,
  score           NUMERIC(4, 3) NOT NULL CHECK (score BETWEEN -1 AND 1),
  confidence      NUMERIC(4, 3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  model_used      VARCHAR(100) NOT NULL,
  analyzed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (feedback_id),
  INDEX idx_sentiment_org (organization_id),
  INDEX idx_sentiment_label (organization_id, sentiment)
);
```

---

### trend_predictions
AI-generated trend forecasts per organization.

```sql
CREATE TYPE signal_strength AS ENUM ('high', 'medium', 'low');

CREATE TABLE trend_predictions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           VARCHAR(500) NOT NULL,
  description     TEXT NOT NULL,
  category        VARCHAR(255),
  confidence      NUMERIC(4, 3) CHECK (confidence BETWEEN 0 AND 1),
  signal_strength signal_strength NOT NULL,
  supporting_data JSONB DEFAULT '{}',   -- aggregated signals used for prediction
  model_used      VARCHAR(100) NOT NULL,
  horizon_days    INTEGER,              -- forecast horizon in days
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,

  INDEX idx_trends_org_date (organization_id, generated_at)
);
```

---

### insights
AI-generated actionable marketing and sales recommendations.

```sql
CREATE TYPE insight_type AS ENUM ('marketing', 'sales', 'product', 'retention');
CREATE TYPE insight_priority AS ENUM ('high', 'medium', 'low');

CREATE TABLE insights (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type            insight_type NOT NULL,
  priority        insight_priority NOT NULL DEFAULT 'medium',
  title           VARCHAR(500) NOT NULL,
  description     TEXT NOT NULL,
  supporting_data JSONB DEFAULT '{}',
  source_agent    VARCHAR(100),         -- which agent generated this
  model_used      VARCHAR(100),
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,

  INDEX idx_insights_org_type (organization_id, type),
  INDEX idx_insights_org_date (organization_id, generated_at)
);
```

---

### insight_embeddings
Vector embeddings for AI-powered semantic search over insights and trends.

```sql
CREATE TABLE insight_embeddings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type     VARCHAR(50) NOT NULL,  -- 'insight', 'trend', 'feedback'
  entity_id       UUID NOT NULL,
  embedding       VECTOR(3072),          -- text-embedding-3-large dimension
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_embeddings_org (organization_id),
  INDEX idx_embeddings_entity (entity_type, entity_id)
);

-- pgvector IVFFlat index for ANN search
CREATE INDEX idx_embeddings_vector ON insight_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

### dashboards
User-configured dashboard layouts and widget configs.

```sql
CREATE TABLE dashboards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES users(id),
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  layout          JSONB DEFAULT '{}',   -- grid layout config
  widgets         JSONB DEFAULT '[]',   -- array of widget definitions
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dashboards_org (organization_id)
);
```

---

### device_tokens
Web Push API subscriptions per user browser session (mobile web PWA).

```sql
CREATE TABLE device_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  endpoint        VARCHAR(1000) NOT NULL,         -- Web Push subscription endpoint URL
  p256dh_key      VARCHAR(500) NOT NULL,          -- ECDH public key
  auth_key        VARCHAR(255) NOT NULL,           -- Auth secret
  device_id       VARCHAR(255),                   -- client-side browser/device identifier
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, endpoint),
  INDEX idx_device_tokens_user (user_id),
  INDEX idx_device_tokens_org (organization_id)
);
```

---

### mobile_notifications
Push notification history per user for mobile notification inbox.

```sql
CREATE TYPE notification_type AS ENUM ('insight', 'trend', 'pipeline', 'system');

CREATE TABLE mobile_notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  body            TEXT NOT NULL,
  type            notification_type NOT NULL,
  entity_id       UUID,                           -- deep-link target (insight_id, trend_id, etc.)
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_notifications_user (user_id, sent_at),
  INDEX idx_notifications_org (organization_id)
);
```

---

### mobile_preferences
Per-user mobile app preferences (notification settings, biometric).

```sql
CREATE TABLE mobile_preferences (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_insights    BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_trends      BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_pipeline    BOOLEAN NOT NULL DEFAULT FALSE,
  pwa_installed         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### audit_logs
Immutable audit trail for GDPR compliance.

```sql
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id         UUID REFERENCES users(id),
  action          VARCHAR(100) NOT NULL,   -- e.g. 'user.created', 'insight.exported'
  entity_type     VARCHAR(100),
  entity_id       UUID,
  ip_address      INET,
  user_agent      TEXT,
  metadata        JSONB DEFAULT '{}',
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_audit_org_date (organization_id, occurred_at),
  INDEX idx_audit_user (user_id)
);
-- Note: No DELETE or UPDATE on this table — append-only enforced via RLS policy
```

---

## Row-Level Security (RLS)

All tables enforce RLS policies in Supabase to prevent cross-organization data access:

```sql
-- Example for sales_data
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON sales_data
  USING (organization_id = current_setting('app.current_org_id')::UUID);
```

The FastAPI backend sets `app.current_org_id` on each database session from the authenticated JWT claim.

---

## Entity Relationship Summary

```
organizations
  ├── users (many)
  │     ├── device_tokens (many)          ← mobile push tokens
  │     ├── mobile_notifications (many)   ← push notification history
  │     └── mobile_preferences (1:1)      ← notification + biometric settings
  ├── api_keys (many)
  ├── data_sources (many)
  ├── products (many)
  ├── customers (many)
  ├── sales_data (many) → products, customers
  ├── consumer_events (many) → products, customers
  ├── feedback (many) → products, customers
  │     └── sentiment_results (1:1)
  ├── trend_predictions (many)
  ├── insights (many)
  ├── insight_embeddings (many)
  ├── dashboards (many) → users
  └── audit_logs (many) → users
```
