-- Migration script to update agent_settings for granular (per-agent/per-company) markups

DO $$ BEGIN
    -- 1. Drop old constraint if exists
    ALTER TABLE agent_settings DROP CONSTRAINT IF EXISTS agent_settings_company_id_key;
    ALTER TABLE agent_settings DROP CONSTRAINT IF EXISTS agent_settings_agent_id_company_id_key;
    
    -- 2. Add the agent_id column if it doesn't exist
    ALTER TABLE agent_settings ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agent_profiles(agent_id) ON DELETE CASCADE;

    -- 3. Add the unique constraint combining both fields
    ALTER TABLE agent_settings ADD CONSTRAINT agent_settings_agent_id_company_id_key UNIQUE NULLS NOT DISTINCT (agent_id, company_id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
