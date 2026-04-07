-- Customer feedback and ratings table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    type TEXT DEFAULT 'transaction' CHECK (type IN ('transaction', 'agent', 'platform')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, order_id)
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own feedback" ON feedback
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins view all feedback" ON feedback
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
