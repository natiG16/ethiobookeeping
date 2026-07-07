ALTER TABLE business_payment_methods
    ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
