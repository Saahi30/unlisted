-- Create historical prices table
CREATE TABLE company_historical_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    price_date DATE NOT NULL,
    price_value NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, price_date)
);

-- Enable RLS
ALTER TABLE company_historical_prices ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view historical prices
CREATE POLICY "Public read access for historical prices" ON company_historical_prices FOR SELECT USING (true);

-- Policy: Admins can manage historical prices
CREATE POLICY "Admins can manage historical prices" ON company_historical_prices FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
