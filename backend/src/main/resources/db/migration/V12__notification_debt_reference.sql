-- Link notifications to debts and dedupe daily reminders
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reminder_key VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_notifications_debt_dedupe
    ON notifications(user_id, reference_id, reminder_key)
    WHERE reference_id IS NOT NULL AND reminder_key IS NOT NULL;
