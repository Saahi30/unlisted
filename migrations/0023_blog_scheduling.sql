-- Add scheduling support to blogs
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL;
