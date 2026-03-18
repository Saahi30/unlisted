-- Migration script to add Client Master Report (CMR) support
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS cmr_uploaded BOOLEAN DEFAULT FALSE;
