-- Migration to enhance Client Master Report (CMR) tracking for agents
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS cmr_url TEXT;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS cmr_status TEXT DEFAULT 'not_uploaded'; -- 'not_uploaded', 'pending', 'verified', 'rejected'
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS cmr_rejection_reason TEXT;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS cmr_verified_at TIMESTAMPTZ;
