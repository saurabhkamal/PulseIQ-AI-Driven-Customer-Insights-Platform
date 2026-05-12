-- Migration 002: User MFA columns + GDPR deletion requests table
-- Apply against: pulseiq database
-- Run in PgAdmin Query Tool or psql

-- Step 1: Add MFA and account lockout columns to users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mfa_enabled        BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS failed_login_count INTEGER     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until       TIMESTAMPTZ;

-- Step 2: Create GDPR deletion requests table
CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by    UUID        REFERENCES users(id),
    status          VARCHAR(50) NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','processing','completed','rejected')),
    reason          TEXT,
    completed_at    TIMESTAMPTZ,
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_org ON gdpr_deletion_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_user ON gdpr_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_status ON gdpr_deletion_requests(status);
