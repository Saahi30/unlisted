-- Migration: Agent Features Expansion
-- Adds: CRM/Clients, Tiers, Training, Feedback, Chat, Marketing, Link Expiry, Rate Limiting

-- 1. AGENT CLIENTS TABLE (CRM)
CREATE TABLE IF NOT EXISTS agent_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agent_profiles(agent_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'prospect'
    last_contacted_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    total_invested NUMERIC DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AGENT FOLLOW-UPS TABLE
CREATE TABLE IF NOT EXISTS agent_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agent_profiles(agent_id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES agent_clients(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'call', -- 'call', 'whatsapp', 'email', 'meeting', 'other'
    notes TEXT,
    outcome TEXT, -- 'interested', 'not_interested', 'callback', 'converted', 'no_response'
    completed_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AGENT TIERS TABLE
CREATE TABLE IF NOT EXISTS agent_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'bronze', 'silver', 'gold', 'platinum'
    min_revenue NUMERIC DEFAULT 0,
    min_orders INTEGER DEFAULT 0,
    commission_bonus_pct NUMERIC DEFAULT 0, -- extra % on top of normal commission
    badge_color TEXT DEFAULT '#CD7F32',
    perks TEXT[] DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default tiers
INSERT INTO agent_tiers (name, min_revenue, min_orders, commission_bonus_pct, badge_color, perks, sort_order) VALUES
('Bronze', 0, 0, 0, '#CD7F32', ARRAY['Basic marketplace access', 'Standard support'], 1),
('Silver', 50000, 10, 5, '#C0C0C0', ARRAY['Priority support', '5% bonus commission', 'Marketing toolkit'], 2),
('Gold', 200000, 50, 10, '#FFD700', ARRAY['Dedicated account manager', '10% bonus commission', 'Premium marketing kit', 'Early access to IPOs'], 3),
('Platinum', 500000, 100, 15, '#E5E4E2', ARRAY['VIP support', '15% bonus commission', 'Custom marketing materials', 'Exclusive deals', 'Sub-agent management'], 4)
ON CONFLICT (name) DO NOTHING;

-- 4. AGENT TRAINING MODULES TABLE
CREATE TABLE IF NOT EXISTS agent_training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general', -- 'general', 'compliance', 'product', 'sales'
    content_type TEXT DEFAULT 'article', -- 'article', 'video', 'quiz'
    content_url TEXT,
    content_body TEXT, -- markdown content for articles
    duration_minutes INTEGER DEFAULT 10,
    passing_score INTEGER DEFAULT 70, -- for quizzes
    is_mandatory BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AGENT TRAINING PROGRESS TABLE
CREATE TABLE IF NOT EXISTS agent_training_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agent_profiles(agent_id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES agent_training_modules(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'failed'
    score INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, module_id)
);

-- Seed training modules
INSERT INTO agent_training_modules (title, description, category, content_type, content_body, duration_minutes, is_mandatory, sort_order) VALUES
('Welcome to ShareSaathi Partner Program', 'Learn the basics of being a partner agent', 'general', 'article',
 '## Welcome Partner!\n\nAs a ShareSaathi partner agent, you are the bridge between investors and unlisted share opportunities.\n\n### Your Role\n- Generate custom payment links for clients\n- Set your own selling price above cost\n- Earn margins on every successful transaction\n\n### Getting Started\n1. Complete your KYC verification\n2. Explore the marketplace\n3. Generate your first client link\n4. Share and earn!',
 5, true, 1),
('SEBI Compliance Fundamentals', 'Understanding regulatory requirements for unlisted shares', 'compliance', 'article',
 '## SEBI Compliance for Unlisted Shares\n\n### Key Regulations\n- Unlisted shares are not regulated by stock exchanges\n- Transactions must comply with Companies Act 2013\n- Transfer of shares requires proper documentation\n\n### Your Responsibilities\n- Always provide accurate information to clients\n- Never guarantee returns\n- Maintain proper records of all transactions\n- Report suspicious activities immediately',
 15, true, 2),
('Effective Sales Techniques', 'Master the art of selling unlisted shares', 'sales', 'article',
 '## Sales Techniques for Partner Agents\n\n### Understanding Your Client\n- Assess risk appetite\n- Understand investment goals\n- Check investment horizon\n\n### Pitch Framework\n1. **Identify** - Understand client needs\n2. **Educate** - Explain unlisted shares\n3. **Present** - Show relevant opportunities\n4. **Address** - Handle objections\n5. **Close** - Generate payment link',
 20, false, 3),
('Product Knowledge: IPOs & Pre-IPO Shares', 'Deep dive into IPO process and pre-IPO investing', 'product', 'article',
 '## IPOs & Pre-IPO Investing\n\n### What are Pre-IPO Shares?\nShares of companies that plan to go public but havent listed yet.\n\n### Why Invest Pre-IPO?\n- Potential for listing gains\n- Access to high-growth companies early\n- Portfolio diversification\n\n### Risks\n- No guaranteed listing date\n- Limited liquidity\n- Higher risk than listed shares\n- Price discovery challenges',
 15, false, 4),
('Anti-Money Laundering (AML) Guidelines', 'AML compliance training for agents', 'compliance', 'quiz',
 '## AML Quiz\n\nThis quiz tests your knowledge of Anti-Money Laundering guidelines.',
 10, true, 5)
ON CONFLICT DO NOTHING;

-- 6. AGENT CLIENT FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS agent_client_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agent_profiles(agent_id) ON DELETE CASCADE,
    order_id UUID REFERENCES agent_client_orders(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    feedback_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AGENT CHAT MESSAGES TABLE (Agent <-> Admin support)
CREATE TABLE IF NOT EXISTS agent_support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agent_profiles(agent_id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL, -- 'agent' or 'admin'
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MARKETING MATERIALS TABLE
CREATE TABLE IF NOT EXISTS agent_marketing_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'image', -- 'image', 'video', 'template', 'document'
    category TEXT DEFAULT 'general', -- 'general', 'whatsapp', 'social', 'email'
    file_url TEXT,
    template_body TEXT, -- for WhatsApp/email templates with {{placeholders}}
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    min_tier TEXT DEFAULT 'Bronze', -- minimum tier required
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed marketing templates
INSERT INTO agent_marketing_materials (title, description, type, category, template_body, min_tier) VALUES
('WhatsApp: General Investment Pitch', 'Standard WhatsApp forward for prospecting', 'template', 'whatsapp',
 'Hi {{client_name}}! \n\nAre you looking to invest in high-growth unlisted companies before they go public? \n\nI can help you access pre-IPO shares of top companies at competitive prices. \n\nBenefits:\n- Potential listing gains\n- Portfolio diversification\n- Expert guidance\n\nInterested? Reply YES or call me to know more!\n\nRegards,\n{{agent_name}}\nShareSaathi Partner',
 'Bronze'),
('WhatsApp: Company-Specific Pitch', 'Template for promoting a specific company', 'template', 'whatsapp',
 'Hi {{client_name}}!\n\n*{{company_name}}* shares are now available!\n\nPrice: {{price}} per share\nMin Investment: {{min_qty}} shares\n\nKey Highlights:\n- Strong financials\n- IPO expected soon\n- Limited availability\n\nSecure your shares now: {{payment_link}}\n\nRegards,\n{{agent_name}}',
 'Bronze'),
('Email: Monthly Newsletter Template', 'Professional email template for monthly updates', 'template', 'email',
 'Subject: Monthly Unlisted Shares Update - {{month}}\n\nDear {{client_name}},\n\nHere are this months top unlisted share opportunities:\n\n{{company_list}}\n\nMarket Insights:\n{{insights}}\n\nFor personalized recommendations, reply to this email.\n\nBest regards,\n{{agent_name}}\nShareSaathi Certified Partner',
 'Silver'),
('Social Media: Investment Tips Post', 'Social media post template', 'template', 'social',
 'Did you know? Pre-IPO investing can offer significant returns when companies go public.\n\nHere are 3 things to consider:\n1. Company fundamentals\n2. IPO timeline\n3. Your risk appetite\n\nWant to explore unlisted shares? DM me for details!\n\n#UnlistedShares #PreIPO #Investment #ShareSaathi',
 'Bronze')
ON CONFLICT DO NOTHING;

-- 9. ADD LINK EXPIRY TO AGENT CLIENT ORDERS
ALTER TABLE agent_client_orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE agent_client_orders ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;
ALTER TABLE agent_client_orders ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
ALTER TABLE agent_client_orders ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- 10. ADD TIER TO AGENT PROFILES
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'Bronze';
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMPTZ;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS last_withdrawal_at TIMESTAMPTZ;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS avg_rating NUMERIC DEFAULT 0;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS total_clients INTEGER DEFAULT 0;

-- RLS for new tables
ALTER TABLE agent_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_client_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_marketing_materials ENABLE ROW LEVEL SECURITY;

-- Agent Clients policies
CREATE POLICY "Agents can manage own clients" ON agent_clients FOR ALL USING (auth.uid() = agent_id);
CREATE POLICY "Admins can view all agent clients" ON agent_clients FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Follow-ups policies
CREATE POLICY "Agents can manage own followups" ON agent_followups FOR ALL USING (auth.uid() = agent_id);

-- Tiers policies (public read)
CREATE POLICY "Anyone can view tiers" ON agent_tiers FOR SELECT USING (true);
CREATE POLICY "Admins can manage tiers" ON agent_tiers FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Training modules (public read)
CREATE POLICY "Anyone can view training modules" ON agent_training_modules FOR SELECT USING (true);
CREATE POLICY "Admins can manage training" ON agent_training_modules FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Training progress
CREATE POLICY "Agents can manage own progress" ON agent_training_progress FOR ALL USING (auth.uid() = agent_id);
CREATE POLICY "Admins can view all progress" ON agent_training_progress FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Client feedback
CREATE POLICY "Agents can view own feedback" ON agent_client_feedback FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Anyone can submit feedback" ON agent_client_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view feedback by token" ON agent_client_feedback FOR SELECT USING (true);

-- Support messages
CREATE POLICY "Agents can manage own messages" ON agent_support_messages FOR ALL USING (auth.uid() = agent_id);
CREATE POLICY "Admins can manage all messages" ON agent_support_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Marketing materials (read based on tier)
CREATE POLICY "Anyone can view marketing materials" ON agent_marketing_materials FOR SELECT USING (true);
CREATE POLICY "Admins can manage marketing" ON agent_marketing_materials FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- TRIGGERS
DO $$ BEGIN
    CREATE TRIGGER update_agent_clients_modtime BEFORE UPDATE ON agent_clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
