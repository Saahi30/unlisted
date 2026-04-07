-- Add status_timestamps JSONB column to orders for tracking when each status was reached
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_timestamps JSONB DEFAULT '{}'::jsonb;

-- Update the existing trigger to also record timestamps on status change
CREATE OR REPLACE FUNCTION update_order_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.status_timestamps = COALESCE(OLD.status_timestamps, '{}'::jsonb) ||
            jsonb_build_object(NEW.status, NOW()::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_status_timestamp_trigger ON orders;
CREATE TRIGGER order_status_timestamp_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_status_timestamp();
