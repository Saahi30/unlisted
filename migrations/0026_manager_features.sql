-- =============================================
-- MANAGER FEATURES: New enums and tables
-- =============================================

-- Enums (safe create)
DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'escalated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE commission_status AS ENUM ('pending', 'approved', 'paid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE activity_category AS ENUM ('login', 'lead', 'order', 'call', 'document', 'note'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE calendar_event_type AS ENUM ('meeting', 'review', 'followup', 'deadline'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. SUPPORT TICKETS
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    assigned_rm_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    description TEXT,
    status ticket_status DEFAULT 'open',
    priority ticket_priority DEFAULT 'medium',
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RM ACTIVITY LOG
CREATE TABLE rm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rm_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    category activity_category DEFAULT 'note',
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COMMISSIONS
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rm_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    order_amount NUMERIC NOT NULL DEFAULT 0,
    commission_rate NUMERIC NOT NULL DEFAULT 0,
    commission_amount NUMERIC NOT NULL DEFAULT 0,
    status commission_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BROADCASTS
CREATE TABLE broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    to_rm_ids UUID[] DEFAULT '{}',
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    read_by UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CALENDAR EVENTS
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    rm_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    event_type calendar_event_type DEFAULT 'meeting',
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RM ONBOARDING TASKS
CREATE TABLE onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rm_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RM GOALS / OKRs
CREATE TABLE rm_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rm_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    quarter TEXT NOT NULL,
    goals JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_rm ON tickets(assigned_rm_id);
CREATE INDEX idx_rm_activities_rm_id ON rm_activities(rm_id);
CREATE INDEX idx_rm_activities_performed_at ON rm_activities(performed_at DESC);
CREATE INDEX idx_commissions_rm_id ON commissions(rm_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX idx_onboarding_tasks_rm ON onboarding_tasks(rm_id);
CREATE INDEX idx_rm_goals_rm ON rm_goals(rm_id);

-- AUTO-UPDATE triggers
CREATE TRIGGER update_tickets_modtime BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_commissions_modtime BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rm_goals_modtime BEFORE UPDATE ON rm_goals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rm_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "mgr_admin_tickets" ON tickets FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staffmanager')
);
CREATE POLICY "rm_view_tickets" ON tickets FOR SELECT USING (assigned_rm_id = auth.uid());
CREATE POLICY "cust_view_tickets" ON tickets FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "mgr_admin_rm_activities" ON rm_activities FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staffmanager')
);
CREATE POLICY "rm_view_activities" ON rm_activities FOR SELECT USING (rm_id = auth.uid());

CREATE POLICY "mgr_admin_commissions" ON commissions FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staffmanager')
);
CREATE POLICY "rm_view_commissions" ON commissions FOR SELECT USING (rm_id = auth.uid());

CREATE POLICY "mgr_admin_broadcasts" ON broadcasts FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staffmanager')
);
CREATE POLICY "rm_view_broadcasts" ON broadcasts FOR SELECT USING (auth.uid() = ANY(to_rm_ids));

CREATE POLICY "mgr_admin_calendar" ON calendar_events FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staffmanager')
);
CREATE POLICY "rm_view_calendar" ON calendar_events FOR SELECT USING (rm_id = auth.uid());

CREATE POLICY "mgr_admin_onboarding" ON onboarding_tasks FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staffmanager')
);
CREATE POLICY "rm_view_onboarding" ON onboarding_tasks FOR SELECT USING (rm_id = auth.uid());

CREATE POLICY "mgr_admin_goals" ON rm_goals FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staffmanager')
);
CREATE POLICY "rm_view_goals" ON rm_goals FOR SELECT USING (rm_id = auth.uid());
