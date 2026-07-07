-- Google OAuth support

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

UPDATE users SET auth_provider = 'LOCAL' WHERE auth_provider IS NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_auth_provider;
ALTER TABLE users ADD CONSTRAINT chk_users_auth_provider
    CHECK (auth_provider IN ('LOCAL', 'GOOGLE'));

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
