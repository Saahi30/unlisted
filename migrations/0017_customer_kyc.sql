-- Customer KYC table for identity verification
CREATE TABLE IF NOT EXISTS customer_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    pan_number TEXT,
    aadhar_number TEXT,
    bank_details JSONB DEFAULT '{}'::jsonb,
    demat_details JSONB DEFAULT '{}'::jsonb,
    cmr_url TEXT,
    cmr_status TEXT DEFAULT 'not_uploaded' CHECK (cmr_status IN ('not_uploaded', 'pending', 'verified', 'rejected')),
    kyc_status TEXT DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_kyc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own kyc" ON customer_kyc
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all kyc" ON customer_kyc
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
