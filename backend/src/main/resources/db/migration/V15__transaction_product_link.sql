ALTER TABLE transactions
    ADD COLUMN product_id UUID REFERENCES products (id) ON DELETE SET NULL,
    ADD COLUMN product_quantity NUMERIC(18, 3);

CREATE INDEX idx_transactions_product_id ON transactions (product_id);
