-- Migration to add atomic processing for agent payouts and automated KYC flags
-- 1. Atomic Payout Function
CREATE OR REPLACE FUNCTION process_agent_payout(
    p_withdrawal_id UUID,
    p_agent_id UUID,
    p_amount NUMERIC
) RETURNS VOID AS $$
BEGIN
    -- Update withdrawal status
    UPDATE agent_withdrawals
    SET status = 'paid',
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = p_withdrawal_id;

    -- Update agent profile ledger
    UPDATE agent_profiles
    SET withdrawn_earnings = withdrawn_earnings + p_amount,
        updated_at = NOW()
    WHERE agent_id = p_agent_id;

    -- Optional: Log to a transaction table if we had one
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add System Verification Flags to agent_profiles
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS system_pan_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS system_aadhar_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS system_bank_verified BOOLEAN DEFAULT FALSE;
