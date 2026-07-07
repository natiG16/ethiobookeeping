-- EthioBooks Bookkeeping Platform - Initial Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'OWNER',
    locale          VARCHAR(5) NOT NULL DEFAULT 'en',
    theme           VARCHAR(10) NOT NULL DEFAULT 'light',
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_role CHECK (role IN ('OWNER', 'STAFF')),
    CONSTRAINT chk_users_locale CHECK (locale IN ('en', 'am')),
    CONSTRAINT chk_users_theme CHECK (theme IN ('light', 'dark'))
);

CREATE INDEX idx_users_email ON users(email);

-- Businesses
CREATE TABLE businesses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    business_type   VARCHAR(100),
    tin_number      VARCHAR(50),
    address         TEXT,
    city            VARCHAR(100),
    currency        VARCHAR(3) NOT NULL DEFAULT 'ETB',
    logo_url        VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_businesses_owner ON businesses(owner_id);

-- Business staff membership
CREATE TABLE business_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'STAFF',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, user_id),
    CONSTRAINT chk_members_role CHECK (role IN ('OWNER', 'STAFF'))
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Categories
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    type            VARCHAR(20) NOT NULL,
    color           VARCHAR(7) DEFAULT '#10B981',
    icon            VARCHAR(50),
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_categories_type CHECK (type IN ('INCOME', 'EXPENSE'))
);

CREATE INDEX idx_categories_business ON categories(business_id);

-- Transactions
CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_by      UUID NOT NULL REFERENCES users(id),
    type            VARCHAR(20) NOT NULL,
    amount          DECIMAL(18, 2) NOT NULL,
    description     TEXT,
    payment_method  VARCHAR(50),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    client_id       VARCHAR(100),
    synced          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_transactions_type CHECK (type IN ('INCOME', 'EXPENSE')),
    CONSTRAINT chk_transactions_amount CHECK (amount > 0)
);

CREATE INDEX idx_transactions_business_date ON transactions(business_id, transaction_date DESC);
CREATE INDEX idx_transactions_type ON transactions(business_id, type);
CREATE INDEX idx_transactions_client ON transactions(client_id) WHERE client_id IS NOT NULL;

-- Debts
CREATE TABLE debts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_name   VARCHAR(255) NOT NULL,
    customer_phone  VARCHAR(20),
    total_amount    DECIMAL(18, 2) NOT NULL,
    paid_amount     DECIMAL(18, 2) NOT NULL DEFAULT 0,
    due_date        DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_debts_status CHECK (status IN ('ACTIVE', 'PAID', 'OVERDUE', 'CANCELLED')),
    CONSTRAINT chk_debts_amounts CHECK (total_amount > 0 AND paid_amount >= 0 AND paid_amount <= total_amount)
);

CREATE INDEX idx_debts_business ON debts(business_id);
CREATE INDEX idx_debts_status ON debts(business_id, status);
CREATE INDEX idx_debts_due_date ON debts(due_date) WHERE status = 'ACTIVE';

-- Repayments
CREATE TABLE repayments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id         UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    amount          DECIMAL(18, 2) NOT NULL,
    payment_method  VARCHAR(50),
    notes           TEXT,
    repayment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_repayments_amount CHECK (amount > 0)
);

CREATE INDEX idx_repayments_debt ON repayments(debt_id);

-- Notifications
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id     UUID REFERENCES businesses(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    read            BOOLEAN NOT NULL DEFAULT FALSE,
    scheduled_at    TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_notifications_type CHECK (type IN (
        'DEBT_REMINDER', 'PAYMENT_REMINDER', 'DAILY_SUMMARY', 'SYSTEM'
    ))
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- Future-ready: branches placeholder
CREATE TABLE branches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    address         TEXT,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default categories function (called per business on creation via app)
