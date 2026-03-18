-- Migration script to add Agent Withdrawals

CREATE TABLE IF NOT EXISTS agent_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agent_profiles(agent_id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'rejected'
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- TRIGGERS
DO $$ BEGIN
    CREATE TRIGGER update_agent_withdrawals_modtime BEFORE UPDATE ON agent_withdrawals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS
ALTER TABLE agent_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can view own withdrawals" ON agent_withdrawals;
DROP POLICY IF EXISTS "Agents can request own withdrawals" ON agent_withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON agent_withdrawals;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON agent_withdrawals;

CREATE POLICY "Agents can view own withdrawals" ON agent_withdrawals FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents can request own withdrawals" ON agent_withdrawals FOR INSERT WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Admins can view all withdrawals" ON agent_withdrawals FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all withdrawals" ON agent_withdrawals FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
