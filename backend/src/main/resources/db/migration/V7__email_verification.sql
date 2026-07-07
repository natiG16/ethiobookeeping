ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN email_verified_at TIMESTAMPTZ;

-- Grandfather existing accounts so they are not locked out
UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE email_verified = FALSE;

CREATE TABLE email_verification_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_verification_user ON email_verification_tokens (user_id);
CREATE INDEX idx_email_verification_hash ON email_verification_tokens (token_hash);
