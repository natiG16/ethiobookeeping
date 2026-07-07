-- Phone OTP authentication (Telegram/WhatsApp delivery)

-- Extend auth providers to include PHONE
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_auth_provider;
ALTER TABLE users ADD CONSTRAINT chk_users_auth_provider
    CHECK (auth_provider IN ('LOCAL', 'GOOGLE', 'PHONE'));

-- Helpful lookup for phone-based accounts (not enforced unique; users may share numbers in future)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

CREATE TABLE phone_otps (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone           VARCHAR(20) NOT NULL,
    code_hash       VARCHAR(64) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    attempts        INT NOT NULL DEFAULT 0,
    max_attempts    INT NOT NULL DEFAULT 5,
    sent_via        VARCHAR(20) NOT NULL DEFAULT 'TELEGRAM',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_otps_phone_created ON phone_otps(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires ON phone_otps(expires_at);
