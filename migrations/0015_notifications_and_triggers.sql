-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'system',
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Auto-update modtime
CREATE TRIGGER update_notifications_modtime BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TRIGGER 1: Lead Assigned to RM
CREATE OR REPLACE FUNCTION notify_lead_assigned()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assigned_rm_id IS NOT NULL AND (OLD.assigned_rm_id IS NULL OR OLD.assigned_rm_id != NEW.assigned_rm_id) THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
            NEW.assigned_rm_id,
            'New Lead Assigned',
            'Lead ' || NEW.name || ' has been assigned to you.',
            'lead',
            '/admin/leads'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_lead_assigned
AFTER UPDATE ON leads
FOR EACH ROW
EXECUTE PROCEDURE notify_lead_assigned();

-- TRIGGER 2: Demat Request Status Change
CREATE OR REPLACE FUNCTION notify_demat_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
            NEW.user_id,
            'Demat Request Updated',
            'Your Demat request for ' || NEW.company_name || ' is now ' || NEW.status || '.',
            'demat',
            '/dashboard'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_demat_status_change
AFTER UPDATE ON demat_requests
FOR EACH ROW
EXECUTE PROCEDURE notify_demat_status_change();

-- TRIGGER 3: Order Status Change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
            NEW.user_id,
            'Order Status Updated',
            'Your order status has changed to ' || NEW.status || '.',
            'order',
            '/dashboard'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_status_change
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE PROCEDURE notify_order_status_change();
