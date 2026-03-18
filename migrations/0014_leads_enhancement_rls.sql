-- Add missing columns to leads table
ALTER TABLE leads ADD COLUMN email TEXT;
ALTER TABLE leads ADD COLUMN assigned_rm_id UUID REFERENCES profiles(id);
ALTER TABLE leads ADD COLUMN onboarding_token TEXT;
ALTER TABLE leads ADD COLUMN kyc_status TEXT DEFAULT 'pending';

-- Enable RLS for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Leads Policies
CREATE POLICY "Admins can view and manage all leads" ON leads FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "RMs can view and manage assigned leads" ON leads FOR ALL USING (
    assigned_rm_id = auth.uid() OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Orders Policies enhancement
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "RMs can view orders of assigned users" ON orders FOR SELECT USING (
    EXISTS (
        (SELECT 1 FROM profiles WHERE id = orders.user_id AND assigned_rm_id = auth.uid())
    ) OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
