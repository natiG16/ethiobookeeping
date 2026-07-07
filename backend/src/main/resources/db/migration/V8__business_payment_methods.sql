CREATE TABLE business_payment_methods (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    name        VARCHAR(80) NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_business_payment_method_name UNIQUE (business_id, name)
);

CREATE INDEX idx_business_payment_methods_business ON business_payment_methods (business_id);

-- Seed defaults for existing businesses
INSERT INTO business_payment_methods (business_id, name, sort_order)
SELECT b.id, m.name, m.sort_order
FROM businesses b
CROSS JOIN (
    VALUES ('Cash', 0), ('Telebirr', 1), ('CBE', 2), ('Other Bank', 3)
) AS m(name, sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM business_payment_methods pm WHERE pm.business_id = b.id
);
