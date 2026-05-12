-- ============================================================
-- Migration 001 — UK Financial Sector (Local Dev)
-- Same as 001_uk_financial_sector.sql but with edge-case guards
-- for existing seed data and PostgreSQL 17 compatibility.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: consumer_events.event_type — ENUM → VARCHAR(100)
-- ────────────────────────────────────────────────────────────

-- Normalize any old e-commerce event types to 'other' first
-- so the CHECK constraint won't reject existing seed rows.
UPDATE consumer_events
SET event_type = 'other'
WHERE event_type NOT IN (
  'onboarding_started','kyc_initiated','kyc_document_uploaded',
  'kyc_completed','kyc_failed','account_opened','account_rejected',
  'login','payment_initiated','payment_completed','payment_failed',
  'transfer_initiated','transfer_completed','beneficiary_added',
  'open_banking_consent_given','direct_debit_setup','standing_order_created',
  'branch_visit','call_centre_contact','loan_application_started',
  'loan_application_completed','loan_application_rejected','card_activated',
  'feature_discovered','feature_activated','subscription_started',
  'subscription_cancelled','referral_sent','referral_converted',
  'notification_opted_in','biometric_enrolled','other'
);

-- Convert ENUM to VARCHAR(100) using explicit cast
ALTER TABLE consumer_events
  ALTER COLUMN event_type TYPE VARCHAR(100) USING event_type::text;

-- Drop old ENUM type
DROP TYPE IF EXISTS event_type;

-- Add CHECK constraint with all UK financial sector values
ALTER TABLE consumer_events
  DROP CONSTRAINT IF EXISTS ck_consumer_events_event_type;

ALTER TABLE consumer_events
  ADD CONSTRAINT ck_consumer_events_event_type CHECK (
    event_type IN (
      'onboarding_started','kyc_initiated','kyc_document_uploaded',
      'kyc_completed','kyc_failed','account_opened','account_rejected',
      'login','payment_initiated','payment_completed','payment_failed',
      'transfer_initiated','transfer_completed','beneficiary_added',
      'open_banking_consent_given','direct_debit_setup','standing_order_created',
      'branch_visit','call_centre_contact','loan_application_started',
      'loan_application_completed','loan_application_rejected','card_activated',
      'feature_discovered','feature_activated','subscription_started',
      'subscription_cancelled','referral_sent','referral_converted',
      'notification_opted_in','biometric_enrolled','other'
    )
  );


-- ────────────────────────────────────────────────────────────
-- STEP 2: feedback.source — Extend ENUM
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  BEGIN ALTER TYPE feedback_source ADD VALUE 'branch'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE feedback_source ADD VALUE 'call_centre'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE feedback_source ADD VALUE 'chatbot'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE feedback_source ADD VALUE 'nps_survey'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE feedback_source ADD VALUE 'social_media'; EXCEPTION WHEN duplicate_object THEN NULL; END;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- STEP 3: insights.type — ENUM → VARCHAR(100)
-- ────────────────────────────────────────────────────────────

ALTER TABLE insights
  ALTER COLUMN type TYPE VARCHAR(100) USING type::text;

DROP TYPE IF EXISTS insight_type;


-- ────────────────────────────────────────────────────────────
-- STEP 4: financial_products
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE financial_product_type AS ENUM (
    'current_account','savings_account','isa','fixed_deposit',
    'personal_loan','mortgage','credit_card','overdraft',
    'business_account','subscription_free','subscription_premium',
    'bnpl','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

CREATE TABLE IF NOT EXISTS financial_products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id         VARCHAR(255),
  name                VARCHAR(255) NOT NULL,
  product_type        financial_product_type NOT NULL,
  interest_rate_pct   NUMERIC(6, 4),
  credit_limit_gbp    NUMERIC(12, 2),
  term_months         SMALLINT,
  apr_pct             NUMERIC(6, 4),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  attributes          JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL,
  updated_at          TIMESTAMPTZ NOT NULL
);

DO $$ BEGIN
  ALTER TABLE financial_products ADD CONSTRAINT financial_products_org_ext_id_unique
    UNIQUE (organization_id, external_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END; $$;

CREATE INDEX IF NOT EXISTS idx_fin_products_org  ON financial_products (organization_id);
CREATE INDEX IF NOT EXISTS idx_fin_products_type ON financial_products (organization_id, product_type);


-- ────────────────────────────────────────────────────────────
-- STEP 5: product_holdings
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE holding_status AS ENUM ('active','closed','suspended','pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

CREATE TABLE IF NOT EXISTS product_holdings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  financial_product_id  UUID NOT NULL REFERENCES financial_products(id) ON DELETE CASCADE,
  status                holding_status NOT NULL DEFAULT 'active',
  opened_at             TIMESTAMPTZ,
  closed_at             TIMESTAMPTZ,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL,
  updated_at            TIMESTAMPTZ NOT NULL,
  UNIQUE (organization_id, customer_id, financial_product_id)
);

CREATE INDEX IF NOT EXISTS idx_holdings_org_customer ON product_holdings (organization_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_holdings_org_product  ON product_holdings (organization_id, financial_product_id);


-- ────────────────────────────────────────────────────────────
-- STEP 6: kyc_sessions
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM (
    'initiated','in_progress','completed','failed','expired','abandoned'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

DO $$ BEGIN
  CREATE TYPE kyc_document_type AS ENUM (
    'passport','driving_licence','national_id','utility_bill',
    'bank_statement','proof_of_address','selfie','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

CREATE TABLE IF NOT EXISTS kyc_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id         UUID REFERENCES customers(id),
  external_session_id VARCHAR(255),
  status              kyc_status NOT NULL DEFAULT 'initiated',
  document_type       kyc_document_type,
  attempt_number      INTEGER NOT NULL DEFAULT 1,
  failure_reason      VARCHAR(500),
  failure_code        VARCHAR(100),
  duration_seconds    INTEGER,
  drop_off_step       VARCHAR(100),
  provider            VARCHAR(100),
  metadata            JSONB NOT NULL DEFAULT '{}',
  initiated_at        TIMESTAMPTZ NOT NULL,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kyc_org_customer ON kyc_sessions (organization_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_kyc_org_status   ON kyc_sessions (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_kyc_org_date     ON kyc_sessions (organization_id, initiated_at);


-- ────────────────────────────────────────────────────────────
-- STEP 7: compliance_signals
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE compliance_signal_type AS ENUM (
    'vulnerable_customer_cluster','complaint_spike','poor_outcome_indicator',
    'consumer_duty_alert','tcf_breach_signal','psd2_consent_issue','none_detected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

DO $$ BEGIN
  CREATE TYPE compliance_severity AS ENUM ('high','medium','low','none');
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

CREATE TABLE IF NOT EXISTS compliance_signals (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  signal_type                   compliance_signal_type NOT NULL,
  severity                      compliance_severity NOT NULL,
  description                   TEXT NOT NULL,
  affected_population_estimate  VARCHAR(255),
  recommended_review_action     TEXT NOT NULL,
  regulatory_reference          VARCHAR(255),
  supporting_data               JSONB NOT NULL DEFAULT '{}',
  model_used                    VARCHAR(100),
  reviewed                      BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by                   UUID REFERENCES users(id),
  reviewed_at                   TIMESTAMPTZ,
  generated_at                  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compliance_org_date     ON compliance_signals (organization_id, generated_at);
CREATE INDEX IF NOT EXISTS idx_compliance_org_severity ON compliance_signals (organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_compliance_org_type     ON compliance_signals (organization_id, signal_type);


-- ────────────────────────────────────────────────────────────
-- STEP 8: ai_audit_logs
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id                     UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id                  VARCHAR(128),
  feature                     VARCHAR(64) NOT NULL DEFAULT 'analyst',
  user_input                  TEXT NOT NULL,
  sanitized_input             TEXT,
  pii_detected                BOOLEAN NOT NULL DEFAULT FALSE,
  pii_redacted_fields         JSONB NOT NULL DEFAULT '[]',
  prompt_injection_detected   BOOLEAN NOT NULL DEFAULT FALSE,
  injection_pattern_matched   VARCHAR(255),
  input_classification        VARCHAR(64),
  policy_violations           JSONB NOT NULL DEFAULT '[]',
  policy_action               VARCHAR(32),
  system_prompt_version       VARCHAR(64),
  system_prompt_hash          VARCHAR(64),
  tools_allowed               JSONB NOT NULL DEFAULT '[]',
  tools_called                JSONB NOT NULL DEFAULT '[]',
  tools_blocked               JSONB NOT NULL DEFAULT '[]',
  tool_call_count             SMALLINT NOT NULL DEFAULT 0,
  tool_call_details           JSONB NOT NULL DEFAULT '{}',
  model_used                  VARCHAR(64),
  prompt_tokens               INTEGER,
  completion_tokens           INTEGER,
  latency_ms                  INTEGER,
  llm_response_raw            TEXT,
  output_pii_detected         BOOLEAN NOT NULL DEFAULT FALSE,
  output_pii_fields           JSONB NOT NULL DEFAULT '[]',
  hallucination_flags         JSONB NOT NULL DEFAULT '[]',
  hallucination_score         FLOAT,
  content_filter_triggered    BOOLEAN NOT NULL DEFAULT FALSE,
  content_filter_reason       VARCHAR(255),
  final_response              TEXT,
  guardrail_layer_triggered   VARCHAR(32),
  overall_status              VARCHAR(32) NOT NULL DEFAULT 'completed',
  error_message               TEXT,
  created_at                  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_org_created ON ai_audit_logs (organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_audit_org_status  ON ai_audit_logs (organization_id, overall_status);
CREATE INDEX IF NOT EXISTS idx_ai_audit_user        ON ai_audit_logs (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_audit_session     ON ai_audit_logs (session_id);
