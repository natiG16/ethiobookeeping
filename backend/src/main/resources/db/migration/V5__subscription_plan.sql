-- Subscription plan per business (admin updates manually in DB for now)
ALTER TABLE businesses
    ADD COLUMN subscription_plan VARCHAR(20) NOT NULL DEFAULT 'starter';

ALTER TABLE businesses
    ADD CONSTRAINT chk_businesses_subscription_plan
    CHECK (subscription_plan IN ('starter', 'business', 'pro'));
