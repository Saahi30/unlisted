-- Add IPO tracking fields to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS ipo_status TEXT DEFAULT NULL
    CHECK (ipo_status IN ('rumored', 'drhp_filed', 'sebi_approved', 'date_announced', 'listed', NULL));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS ipo_details JSONB DEFAULT NULL;
-- ipo_details: { "drhp_date": "...", "expected_date": "...", "price_band": "...", "lot_size": ..., "exchange": "BSE/NSE" }
