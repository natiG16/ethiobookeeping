-- Single flat category list (no income/expense type on categories)

DELETE FROM categories WHERE type = 'INCOME';

DELETE FROM categories c
WHERE c.id NOT IN (
    SELECT DISTINCT ON (business_id, lower(name)) id
    FROM categories
    ORDER BY business_id, lower(name), is_default DESC, created_at ASC
);

ALTER TABLE categories DROP CONSTRAINT IF EXISTS chk_categories_type;
ALTER TABLE categories DROP COLUMN type;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_business_name ON categories(business_id, lower(name));

INSERT INTO categories (business_id, name, color, icon, is_default)
SELECT b.id, v.name, v.color, v.icon, TRUE
FROM businesses b
CROSS JOIN (VALUES
    ('Rent', '#EF4444', 'home'),
    ('Transport', '#8B5CF6', 'truck'),
    ('Salary', '#F97316', 'users'),
    ('Utilities', '#6366F1', 'zap'),
    ('Inventory', '#F59E0B', 'package'),
    ('Marketing', '#EC4899', 'megaphone'),
    ('Other', '#64748B', 'tag')
) AS v(name, color, icon)
WHERE NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.business_id = b.id AND lower(c.name) = lower(v.name)
);
