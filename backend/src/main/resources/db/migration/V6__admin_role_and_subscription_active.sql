-- Admin role + subscription activation flag
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('OWNER', 'STAFF', 'ADMIN'));

ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS support_notes TEXT;
