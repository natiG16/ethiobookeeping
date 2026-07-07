ALTER TABLE business_payment_methods
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE business_payment_methods
SET updated_at = created_at
WHERE updated_at IS NULL;
