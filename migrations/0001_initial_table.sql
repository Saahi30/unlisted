-- ENUMS for consistent state
CREATE TYPE user_role AS ENUM ('admin', 'staffmanager', 'rm', 'customer');
CREATE TYPE order_status AS ENUM ('requested', 'under_process', 'mail_sent', 'in_holding');
CREATE TYPE demat_status AS ENUM ('initiated', 'under_process', 'completed');
CREATE TYPE order_type AS ENUM ('buy', 'sell');
CREATE TYPE payment_method AS ENUM ('razorpay', 'rtgs', 'rm_connect');

-- 1. COMPANIES TABLE
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    valuation NUMERIC DEFAULT 0,
    status TEXT NOT NULL,
    current_ask_price NUMERIC DEFAULT 0,
    current_bid_price NUMERIC DEFAULT 0,
    description TEXT,
    ai_context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES TABLE (Extends Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'customer',
    assigned_rm_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEAMS TABLE
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes JSONB DEFAULT '[]'::jsonb, -- Internal admin reference notes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEAM MEMBERS (Junction for RMs)
CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, member_id)
);

-- 5. ORDERS TABLE
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES profiles(id),
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL,
    status order_status DEFAULT 'requested',
    type order_type NOT NULL,
    payment_method payment_method NOT NULL,
    tx_proof_url TEXT,
    delivery_details JSONB DEFAULT '{}'::jsonb,
    notes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LEADS TABLE
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    company_id UUID REFERENCES companies(id),
    quantity INTEGER,
    price NUMERIC,
    status TEXT DEFAULT 'new',
    notes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DEMAT REQUESTS TABLE
CREATE TABLE demat_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    company_name TEXT NOT NULL,
    folio_number TEXT,
    certificate_numbers TEXT,
    distinctive_from TEXT,
    distinctive_to TEXT,
    quantity INTEGER NOT NULL,
    file_name TEXT,
    status demat_status DEFAULT 'initiated',
    notes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RM TARGETS TABLE
CREATE TABLE rm_targets (
    rm_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_amount NUMERIC NOT NULL,
    month_year DATE NOT NULL,
    PRIMARY KEY (rm_id, month_year)
);

-- TRIGGERS FOR AUTO UPDATING UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_modtime BEFORE UPDATE ON companies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_teams_modtime BEFORE UPDATE ON teams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_demat_requests_modtime BEFORE UPDATE ON demat_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS (ROW LEVEL SECURITY) BASIC SETUP
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE demat_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
-- Policy: Admins can view everything
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
-- Policy: Owners can view their orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
