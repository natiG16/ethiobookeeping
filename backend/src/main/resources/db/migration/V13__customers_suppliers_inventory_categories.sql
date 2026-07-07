-- Customers, suppliers, inventory, and expanded default categories

CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_business ON customers(business_id);
CREATE UNIQUE INDEX idx_customers_business_name ON customers(business_id, lower(name));

ALTER TABLE debts ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX idx_debts_customer ON debts(customer_id);

CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    contact_person  VARCHAR(255),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_business ON suppliers(business_id);
CREATE UNIQUE INDEX idx_suppliers_business_name ON suppliers(business_id, lower(name));

CREATE TABLE supplier_payables (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    supplier_id     UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    total_amount    DECIMAL(18, 2) NOT NULL,
    paid_amount     DECIMAL(18, 2) NOT NULL DEFAULT 0,
    due_date        DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    description     TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_supplier_payables_status CHECK (status IN ('ACTIVE', 'PAID', 'OVERDUE', 'CANCELLED')),
    CONSTRAINT chk_supplier_payables_amounts CHECK (total_amount > 0 AND paid_amount >= 0 AND paid_amount <= total_amount)
);

CREATE INDEX idx_supplier_payables_business ON supplier_payables(business_id);
CREATE INDEX idx_supplier_payables_supplier ON supplier_payables(supplier_id);

CREATE TABLE supplier_payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payable_id      UUID NOT NULL REFERENCES supplier_payables(id) ON DELETE CASCADE,
    amount          DECIMAL(18, 2) NOT NULL,
    payment_method  VARCHAR(50),
    notes           TEXT,
    payment_date    DATE NOT NULL,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_supplier_payments_amount CHECK (amount > 0)
);

CREATE INDEX idx_supplier_payments_payable ON supplier_payments(payable_id);

CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    sku                 VARCHAR(100),
    quantity_on_hand    DECIMAL(18, 3) NOT NULL DEFAULT 0,
    buy_price           DECIMAL(18, 2),
    sell_price          DECIMAL(18, 2),
    low_stock_threshold DECIMAL(18, 3),
    unit                VARCHAR(50) NOT NULL DEFAULT 'pcs',
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_products_qty CHECK (quantity_on_hand >= 0)
);

CREATE INDEX idx_products_business ON products(business_id);
CREATE UNIQUE INDEX idx_products_business_name ON products(business_id, lower(name));

-- Seed missing default expense/income categories per business
INSERT INTO categories (business_id, name, type, color, icon, is_default)
SELECT b.id, v.name, v.type, v.color, v.icon, TRUE
FROM businesses b
CROSS JOIN (VALUES
    ('Sales', 'INCOME', '#10B981', 'cash'),
    ('Services', 'INCOME', '#3B82F6', 'briefcase'),
    ('Other', 'INCOME', '#64748B', 'tag'),
    ('Rent', 'EXPENSE', '#EF4444', 'home'),
    ('Transport', 'EXPENSE', '#8B5CF6', 'truck'),
    ('Salary', 'EXPENSE', '#F97316', 'users'),
    ('Utilities', 'EXPENSE', '#6366F1', 'zap'),
    ('Inventory', 'EXPENSE', '#F59E0B', 'package'),
    ('Marketing', 'EXPENSE', '#EC4899', 'megaphone'),
    ('Other', 'EXPENSE', '#64748B', 'tag')
) AS v(name, type, color, icon)
WHERE NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.business_id = b.id AND lower(c.name) = lower(v.name) AND c.type = v.type
);
