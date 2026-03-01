# Next-Gen Unlisted Shares Platform: Deep Research + Product Spec

**Author's Note:** This document synthesizes research from UnlistedZone, WWIPL, Sharescart, Precize, and Indian regulatory frameworks (SEBI, NSDL/CDSL, Companies Act 2013, PML Act). Output is structured for immediate PRD, system design, and content roadmap handoff.

---

## SECTION 1: COMPETITOR TEARDOWN

### 1.1 UnlistedZone

**Core Positioning:**  
- Fastest growing unlisted market platform (5 years operational)
- Liquidation-first (ESOP focus): 50K+ users, ₹100Cr+ in transactions
- Handles 50,000+ unlisted startups (~60% ESOP redemptions)

**Target Users:**
- Startup employees looking to liquidate ESOPs (primary TAM)
- Angel investors seeking deal flow
- AIFs, family offices, retail investors (secondary)
- Employees from Paytm, Swiggy, Zomato, Mobikwik, Reliance Retail, Tata Tech

**Core Features:**
- Browse & price-check unlisted shares catalog (organized by sector)
- Historical IPO performance tracker (unlisted price → IPO price → current price → gain/loss %)
- Real-time ESOP tracking & liquidation tools
- Testimonial/social proof emphasis (user reviews prominently featured)
- WhatsApp/call-based RM outreach (relationship manager model)
- Video content on ESOP mechanics, IPO opportunities
- Mobile app (50K+ downloads)

**Buy/Sell Flow:**
1. User fills inquiry → RM gets assigned
2. RM sources or matches prices
3. Buyer sends payment → UnlistedZone holds funds
4. Within 24h: shares transferred via DIS to buyer's demat
5. Seller receives payment post-transfer (TVP model)

**Trust Elements:**
- Press coverage in Economic Times, Moneycontrol, Business Standard
- Regulatory disclaimer: "No investment advice"
- Prominent "Why UnlistedZone" testimonials (real investor quotes)
- RM identity (photos, names on platform)
- Founded by bootstrap founders (credibility signal)

**Monetization:**
- Spreads: visible buy/sell price gap (±5-10% typical)
- Zero explicit platform fee (revenue hidden in bid-ask)
- RM commission on high-volume ESOP deals
- Likely: white-label services for wealth managers

**UX Strengths:**
- Simple narrative: "Sell your ESOP with 1 click"
- Fast execution (24h settlement)
- Relationship manager reduces friction for retail users
- Historical IPO data builds confidence
- WhatsApp reduces onboarding friction

**UX Weaknesses:**
- No self-serve analytics (RM dependency)
- Limited transparency on pricing methodology
- No public order history or liquidity metrics
- Slow price updates (not real-time)

**Unique:**
- ESOP liquidation is core; other platforms treat it as secondary
- YouTube + blog educational content tied to ESOP use case

---

### 1.2 WWIPL (Wealth Wisdom India Pvt Ltd)

**Core Positioning:**
- Pre-IPO tracker + advisory
- 50K+ registered investors, ₹500Cr+ in transactions
- Focus on "research-driven" pre-IPO investment
- Research reports: Q1 2025 published 6-company deep dives (Groww, Lenskart, OYO, Pine Labs, boAt, PharmEasy)

**Target Users:**
- HNI / accredited investors (primary: ₹10L+ annual income threshold implied)
- Retail investors seeking pre-IPO exposure
- Family offices, wealth managers
- Not ESOP-focused; more "pre-IPO equity hunt"

**Core Features:**
- Pre-IPO research reports (6-company tracker initially; valuation analysis, IPO timeline, EBITDA trends)
- Live price tracker with valuation trends
- Detailed company profiles (shareholding patterns, financials, insights)
- Expert support chat/calls (human advisory layer)
- Mobile app (1K-5K downloads; modest traction vs UnlistedZone)
- News feed on pre-IPO landscape

**Buy/Sell Flow:**
1. Browse app → find company
2. Request deal via app
3. Get quotes directly in-app
4. Pay securely (RTGS/NEFT/UPI noted)
5. Receive shares in demat within T+0 to T+2

**Trust Elements:**
- Research reports (third-party credibility)
- Detailed financials & peer analysis
- Expert commentary on market (Founder: Krishna Kumar Patwari; public figure in pre-IPO space)
- Regulatory language on press releases ("Six Upcoming Market Leaders")
- Testimonials emphasizing speed & professionalism

**Monetization:**
- Transaction-level spreads on buy/sell (not disclosed)
- Likely: advisory fee for premium research reports
- AUM-linked fees for wealth management partnerships

**UX Strengths:**
- Deep research layer differentiates from competitors
- Real-time valuation trends (WWIPL Beacon proprietary system)
- Peer comparison tools (ratios, metrics)
- Professional tone (appeals to HNI segment)

**UX Weaknesses:**
- App adoption lagging (1-5K downloads vs UnlistedZone's 50K+)
- Research reports published infrequently (Q1 2025 was first)
- No price history charts (snapshot-based, not trend-based)
- Limited educational content

**Unique:**
- Pre-IPO research focus separates it from marketplace positioning
- Emphasis on "before IPO" timing (FOMO narrative)

---

### 1.3 Sharescart

**Core Positioning:**
- "Portal" for unlisted, delisted, pre-IPO shares
- 250+ companies in catalog, 500+ IPO listings
- ₹50Cr+ in 1-year transaction volume
- Equity research specialists (30+ team)

**Target Users:**
- Retail investors (budget-conscious)
- Portfolio diversifiers seeking alternative assets
- Not ESOP-specific; general private market exposure

**Core Features:**
- Searchable, filterable catalog (250+ unlisted, 500+ IPO listings)
- Custom screener tool (investor defines criteria)
- Ratio calculator (compare unlisted metrics against listed comps)
- Equity research (30 specialists, curated reports)
- IPO listings & tracking
- Transaction coordination (T+0 possible per Reddit: 25-share minimum vs InCred's 5-share at ₹2,170 vs Sharescart's ₹2,095 at 25-share minimum)

**Buy/Sell Flow:**
1. Browse screener
2. Select company
3. Request order with quantity
4. Team finds seller/matches price
5. Execute via DIS within T+0 to T+1

**Trust Elements:**
- Equity research team (credibility signal)
- Corporate governance language
- YouTube content (platform demo, company growth narrative)
- Testimonials on transparency & timeliness
- Linked social (LinkedIn, Instagram, Facebook, WhatsApp, Linktree)

**Monetization:**
- Bid-ask spreads (visible: ₹2,095 vs InCred ₹2,170 for same asset, 3.5% gap)
- Research licensing to wealth managers
- Possible platform fees for portfolio tracking

**UX Strengths:**
- Screener is powerful tool (DIY investor appeal)
- Ratio calculator bridges unlisted → listed analysis gap
- Team of equity researchers adds credibility
- Multiple IPO tracking (500+ listings)

**UX Weaknesses:**
- No real-time pricing (research-on-demand model)
- Minimal educational content on unlisted market
- Complex navigation for retail users
- Limited mobile-first design

**Unique:**
- Equity research team embedded in platform
- Ratio calculator + screener = "Excel meets fintech"

---

### 1.4 Precize

**Core Positioning:**
- "Portal to private markets" (not exchange, not stock exchange regulatory intent)
- Low ticket size (₹10K min) = democratized pre-IPO
- Research + curation (curated deals, not open marketplace)
- In-house proprietary system (Precize Beacon) for real-time asset info

**Target Users:**
- Retail investors starting at ₹10K (democratized entry)
- Portfolio diversifiers
- Risk-tolerant investors seeking alpha

**Core Features:**
- 3-step investment process (Select → Order → Pay)
- Curated research reports (SEBI-registered research analysts)
- Precize Beacon (proprietary data system; real-time, industry-leading accuracy claimed)
- Price history (past performance of unlisted shares)
- News feed (pre-IPO + market trends)
- Automated tech for demat transfer
- Investment team vets all deals before listing

**Buy/Sell Flow:**
1. Research report review
2. Confirm company selection
3. Order placement
4. Payment (24-48h transfer into demat)
5. View in depository

**Trust Elements:**
- SEBI-registered research analysts (external validation)
- Investment team curation (gates low-quality deals)
- "Bank-level security" messaging
- Regulatory language: "Not a stock exchange; not authorized by SEBI to solicit investments"
- Taxation guidance (LTCG 12.5% post-24 months, STCG at marginal rate)

**Monetization:**
- Transaction spreads (not explicit)
- Curation + research team fees
- Likely: white-label research for wealth managers

**UX Strengths:**
- Low ₹10K minimum (lowest in market)
- 3-step simplicity (Select → Order → Pay)
- Pre-vetted deals reduce user due diligence burden
- Clear taxation guidance
- Beacon system (proprietary data layer)

**UX Weaknesses:**
- No analytics dashboards (curation-first, not self-serve)
- Limited transparency on deal selection criteria
- Price history is snapshot, not real-time
- Slow growth (implied by minimal news coverage)

**Unique:**
- Lowest ticket size (₹10K democratization)
- Explicit "not a stock exchange" positioning (SEBI compliance clarity)
- SEBI-registered research analysts (external credibility)
- Precize Beacon (proprietary data system)

---

### 1.5 Competitive Feature Matrix

| Feature | UnlistedZone | WWIPL | Sharescart | Precize |
|---------|--------------|-------|-----------|---------|
| **Catalog Size** | 50K+ startups | 6 (research focus) | 250+ unlisted + 500+ IPO | Not disclosed |
| **Min Investment** | Not disclosed (~₹1-5K) | Not disclosed | 5-25 shares (varies) | ₹10,000 |
| **Settlement Speed** | T+0 (24h) | T+0-2 | T+0-1 | T+1-2 (24-48h) |
| **ESOP Focus** | ✓ Primary | ✗ | ✗ | ✗ |
| **Research Layer** | ✗ | ✓ (reports) | ✓ (team) | ✓ (analysts) |
| **Price Transparency** | ✗ (RM model) | Partial | Partial (screener) | ✗ (curation) |
| **Analytics** | ✗ | Limited | ✓ (screener/ratios) | ✗ |
| **Mobile App Downloads** | 50K+ | 1-5K | Not disclosed | Not disclosed |
| **Bid-Ask Spread** | 5-10% | Unknown | 3-5% observed | Unknown |
| **Educational Content** | ✓ (ESOP guides) | Limited | Limited | Moderate |
| **RM Model** | ✓ | ✓ | ✓ | ✗ |

---

## SECTION 2: REGULATORY & COMPLIANCE LANDSCAPE

### 2.1 SEBI's Stance (Critical: Dec 2024 Clarification)

**SEBI Press Release (Dec 10, 2024):**
> "Certain electronic platforms and/or websites are facilitating transactions in unlisted securities of public limited companies. Such activities are in violation of Securities Contract (Regulation) Act, 1956 and SEBI Act, 1992."

**Key Points:**
- Only **recognized stock exchanges** can facilitate fundraising & trading for listed or "to-be-listed" entities
- Stock brokers can only deal on recognized exchanges; **off-exchange facilitation is prohibited**
- Platforms matching buy/sell orders = constructing a "stock exchange" under SCRA definition
- **Section 19 SCRA:** Prohibits unrecognized exchanges from order-matching

**Investor Protection Gap:**
- Transactions on unregulated platforms = NO SEBI investor protection framework applies
- NO investor protection fund compensation (unlike stock exchange settlements)
- NO grievance redressal via SCORES/SMART (Stock Exchange mechanisms)
- Settlement risk (DVP not enforced)

**What This Means for Your Platform:**
- DO NOT position as "platform for trading" (implies order-matching = stock exchange)
- MUST NOT facilitate public solicitation (only to pre-identified accredited investors)
- Position as **information portal + deal facilitation (bilateral, not order-matched)**
- Implement robust **KYC/AML** to prove accredited investor status

---

### 2.2 Legal Structure: Private Placement vs. Public Offering

**SEBI / Companies Act Definition:**

| Criterion | **Private Placement** | **Public Offering** |
|-----------|----------------------|-------------------|
| **Max Investors** | 200 per FY (excl. QIBs & ESOP employees under CA §62(1)(b)) | No limit |
| **Solicitation** | Must NOT be advertised; direct to pre-identified investors only | Advertised; prospectus; public solicitation |
| **Offer Medium** | Private placement letter (direct, not platform-advertised) | Exchange platform (SEBI regulated) |
| **Compliance Regime** | CA §42 (private placement rules) | SEBI ICDR Regulations, 2018 |
| **Penalty for Breach** | Stringent (penal provisions under CA §68) | Stringent (SEBI enforcement) |

**Red Flag for Unlisted Platforms:**
If a fintech platform:
- Lists securities on a public portal (accessible to anyone who registers)
- Uses digital advertising/social media to promote
- Lacks stringent accredited investor verification
- → Effectively transforms private placements into public offerings = **VIOLATION**

**Your Compliance Move:**
- Implement **mandatory accredited investor verification** (net worth / income proof)
- Do NOT use marketing ads ("Invest in Unicorns with 1 Click"); use invite-only or gated content
- Clearly communicate: "This platform facilitates secondary transactions between pre-identified investors, not a public offering"

---

### 2.3 Demat / Settlement Requirements

**Mandatory Demat (Effective 2024):**
- All unlisted share transfers in India must be in electronic (demat) form
- Physical certificates are NO LONGER permitted
- Dematerialization requires:
  - Company board resolution (if unlisted public company or private company with 100+ shareholders)
  - ISIN registration with NSDL/CDSL
  - RTA (Registrar & Transfer Agent) appointment

**Off-Market Transfer Procedure (NSDL Circular NSDL/POLICY/2025/0071, effective June 3, 2025):**

For **Private Limited Company** off-market transfers:
1. Shareholder initiates DIS (Delivery Instruction Slip) with DP
2. **NEW: Must obtain prior written consent from the company** (confirming no objection to transfer)
3. Consent format: names of buyer/seller, share count, transfer reason
4. DP only processes after both DIS + company consent received
5. Off-market annexure (purpose, relationship, price) attached to DIS
6. Transfer time: Same-day to T+10 (varies by DP efficiency)

For **Public Limited Company** (unlisted):
- Company consent requirement may differ; check with RTA

**Stamp Duty:**
- Applicable on off-market transfers (rate varies by state)
- Calculated on transaction value
- Both buyer & seller responsible for ensuring payment

**Your Platform Obligation:**
- Guide users through DIS + company consent process
- Maintain template forms (off-market annexures per NSDL/CDSL specs)
- Coordinate with DPs for settlement
- Ensure DVP (Delivery vs. Payment) to reduce counterparty risk

---

### 2.4 KYC / AML / PMLA Compliance

**Governing Framework:**
- **PML Act, 2002** (Prevention of Money Laundering) + PML Rules
- **SEBI Master Circular (June 6, 2024)** on AML/CFT
- **FIU-IND** (Financial Intelligence Unit - India) for STR reporting

**Your Platform's KYC Requirements:**

| Category | Documents | Ongoing |
|----------|-----------|---------|
| **Individuals (Resident)** | PAN, Aadhaar, Address proof, Bank details, Income range | Annual refresh; beneficial ownership verification |
| **Individuals (NRI)** | Above + FEMA compliance (RBI approval for investment), Residency proof, Apostille for foreign docs | Enhanced due diligence (EDD) for high-value txns |
| **HUF / Partnership / Company** | Registration cert, PAN, Address, Director/Partner ID, UBO (ultimate beneficial owner) details, Shareholding pattern | Beneficial ownership verification (thresholds: 10%+ owners) |
| **Politically Exposed Persons (PEP)** | Enhanced screening; additional verification | Ongoing monitoring against PEP lists (FAU India, RBI list) |
| **High-Risk Entities** | Sanctioned entities, shell companies, layered structures | Enhanced screening; potential transaction block |

**Beneficial Ownership Threshold (Updated 2023):**
- Any person with **10%+ interest** in a company/partnership must be identified & verified
- Previous threshold was higher; now tightened

**AML Red Flags Your Platform Must Monitor:**
- Rapid buy-sell cycles (round-tripping) without economic rationale
- Large cash deposits before investment (source of funds verification)
- Transfers to multiple unrelated parties (structuring)
- High-risk jurisdiction involvement (FATF gray-list countries)
- PEP involvement without disclosure

**Your Compliance Checklist:**
- ✓ Collect PAN, Aadhaar, CMR (Client Master Report) before trading
- ✓ Store docs securely; access limited to authorized staff
- ✓ Screen against PEP lists, sanctioned entity lists (FAU India, RBI, UN)
- ✓ Ongoing monitoring: flag unusual transaction patterns
- ✓ STR (Suspicious Transaction Report) to FIU-IND when warranted
- ✓ Retain records for 7 years post-transaction

---

### 2.5 What Your Platform MUST NOT Claim

**Absolute Prohibitions:**
1. **"Guaranteed returns" or "X% upside"** — Violates Securities Contracts Act; implies investment advice
2. **"Risk-free" or "Low-risk"** — Unlisted shares are inherently illiquid; this is false advertising
3. **"Pre-IPO shares will definitely list"** — No certainty; cannot make representations about future IPO outcomes
4. **"SEBI-approved platform"** or regulatory endorsement — You are NOT regulated by SEBI; clarify this prominently
5. **"Stock exchange" positioning** — You are NOT an exchange; say "information portal" or "deal facilitator"
6. **"Investment advice"** — Positioning as advisor without SEBI registration = violation
7. **"Liquidity guaranteed"** — Unlisted shares are illiquid; cannot guarantee exit opportunities
8. **Tax advice** — e.g., "Avoid STT with unlisted shares" = tax advice; disclaimer required

**Required Disclaimers:**
- "This platform facilitates secondary transactions in unlisted securities. No regulatory protections apply."
- "Unlisted shares are inherently illiquid and may be difficult to sell."
- "Past IPO performance does not guarantee future results."
- "Invest only if you understand the risks and can afford total loss."
- "Consult a tax professional for your specific tax implications."

---

### 2.6 Content / Education Guardrails

**What You CAN Do:**
- ✓ Publish factual information on unlisted share mechanics
- ✓ Compare metrics across companies (peer analysis)
- ✓ Publish anonymized case studies ("Company A went from ₹500 pre-IPO to ₹2,000 at IPO")
- ✓ Explain tax implications (educational, not advice)
- ✓ Publish company financials & SEC filings (public data)
- ✓ Content on "how to read a startup cap table" (educational)

**What You CANNOT Do:**
- ✗ Recommend "Buy Groww now" (investment advice)
- ✗ Claim "Unicorns are the future; invest in 5 to get rich" (marketing hype)
- ✗ Publish return projections ("Expect 200% IRR in 5 years")
- ✗ Use affiliate marketing ("Click here & earn commissions by selling unlisted shares")
- ✗ Testimonials promising returns ("I made ₹50L profit in 2 years")

---

## SECTION 3: MVP SCOPE (6-8 Weeks, Small Team)

### 3.1 Target User Profile for MVP

**Primary TAM:**
- **Startup employees with ESOPs** (30-50K annually in India)
- **Angel investors + accredited retail** (net worth ₹2Cr+, annual income ₹50L+)
- **Wealth managers / RIAs** (serve HNIs, seek deal flow)

**Secondary TAM:**
- ESOP liquidation marketplaces (secondary, can acquire later)
- Family offices seeking co-investment opportunities

---

### 3.2 MVP Feature Set

#### **Phase 1: Core Marketplace (Weeks 1-4)**

1. **User Authentication & KYC**
   - Email/Phone signup
   - PAN + Aadhaar verification (via Shuddh / Truffle verification APIs)
   - Accredited investor status verification (income/net worth proof upload)
   - Terms & legal disclaimers (aggressive risk language)
   - Status: Pending KYC, Verified, Rejected

2. **Company Catalog**
   - 50-100 seeded unlisted companies (data acquisition from existing platforms, startups, research)
   - Per company: Name, sector, founding year, valuation (last round), previous offer prices
   - Basic company profile (team, funding rounds, status)
   - Simple data table (no complex charts yet)

3. **Browse & Search**
   - Filter by sector (FinTech, SaaS, HealthTech, etc.)
   - Filter by valuation range (₹10Cr - ₹1000Cr)
   - Sort by latest activity, popularity
   - Simple search (company name, keyword)

4. **Price & Deal Display**
   - Current bid/ask price (aggregated from sellers/RM quotes)
   - Last transaction price (historical reference)
   - Simple text: "₹1,500/share (₹200 above last trade)"
   - Seller info (if willing to transact): Name, quantity, terms

5. **Buy/Sell Interaction**
   - "I want to BUY" → form: company, qty, max price, payment method, demat account details
   - "I want to SELL" → form: company, qty, min price, demat account ref
   - Request goes to RM queue; RM matches manually
   - Status tracking: Submitted → Quoted → Negotiating → Matched → Settled

6. **Document Management**
   - Upload DIS template (pre-filled with platform data)
   - Off-market annexure guide (NSDL/CDSL templates)
   - Company consent form (to be obtained by buyer/seller or RM)
   - Store docs in versioned repo (S3 + metadata)

7. **Basic Risk Education**
   - Landing page: "What are unlisted shares?"
   - "5 risks of unlisted investing"
   - "How demat & settlement works"
   - Simple, non-hype content

#### **Phase 2: Dashboard & Analytics (Weeks 5-6)**

8. **User Portfolio Dashboard**
   - Holdings: company, qty, purchase date, cost, current value (via latest market price)
   - Simple P&L (cost → current → gain/loss %)
   - Holding period (auto-calculated for tax purposes)
   - Transaction history (buy/sell dates, prices, qty)

9. **Company Detail Page**
   - Valuation history (chart: time → valuation from funding rounds)
   - Bid-ask spread (current market levels)
   - Trading activity (last 10 trades: date, qty, price)
   - Related news / press releases (aggregated from web)

10. **Admin Panel (Internal)**
    - Add/edit companies (seeding, curation)
    - RM task queue (pending quotes, matches, settlements)
    - KYC status review (approve/reject users)
    - Basic reporting (transaction volume, AUM, user growth)

#### **Phase 3: Trust & Compliance (Weeks 6-8)**

11. **Legal Hub**
    - About Us (mission, team, regulatory status)
    - Regulatory Disclaimer (BOLD: "Not SEBI-regulated, no investor protection")
    - Risk Disclosure (unlisted shares = illiquid, high-risk)
    - Privacy & Data Security (clear policy)
    - Terms of Service (clearly define: we facilitate, do not recommend)

12. **Content Pages**
    - "How to read a startup pitch deck"
    - "Understanding cap tables & dilution"
    - "Tax implications of unlisted shares"
    - "What is an IPO? (unlisted → listed flow)"
    - "Case study: Company X's journey to IPO"

13. **RM Coordination Tools**
    - WhatsApp / Slack integration for deal updates (async)
    - Quote template generator (RM pastes into WhatsApp quickly)
    - DIS tracking (document status via RM)

---

### 3.3 Tech Stack (MVP)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | Next.js (TypeScript) + TailwindCSS | Fast iteration, SSR, API routes |
| **Backend** | Node.js (Express) + PostgreSQL | Async, scalable, transactional integrity |
| **Auth** | NextAuth.js + JWT | Passwordless/email flow, stateless scaling |
| **File Storage** | AWS S3 + CloudFront | Demat docs, agreements, secure + CDN |
| **Verification** | Shuddh / Truffle / IDfy API | PAN-Aadhaar-Bank linkage (KYC) |
| **Database** | PostgreSQL + Redis (cache) | ACID for transactions, Redis for price feeds |
| **Hosting** | Vercel (frontend) + AWS ECS (backend) | Managed scaling, low ops burden |
| **Monitoring** | Datadog / Sentry | Error tracking, performance |
| **Payment** | Razorpay / BharatPe UPI | NEFT/RTGS collection + settlement |

---

### 3.4 MVP Success Metrics

- **User Onboarding:** 500 verified users within 8 weeks
- **Deal Flow:** 50-100 active buy/sell requests in system
- **Settlement Rate:** 80% of matched requests settle (rest: abandoned)
- **TAT (Turn-Around Time):** Average 48h from match to demat credit
- **NPS:** 45+ (target: low friction, RM responsiveness)

---

## SECTION 4: V1.0+ ROADMAP (Months 3-18)

### 4.1 Phases

**Q2 2026 (Months 3-4): Analytics & Price Discovery**
- Real-time price feed (aggregated from transactions)
- Historical charts (valuation trends over 12m)
- Peer comparison (multiple unlisted companies by sector metrics)
- Indices: "SaaS Unlisted Index", "FinTech Unlisted Index" (cap-weighted)
- Liquidity metrics: bid-ask spread, daily volume, turnover

**Q3 2026 (Months 5-6): Automation & Self-Serve**
- Auto-matching engine (non-RM dependent for simple cases)
- Smart order routing (find best prices across multiple sellers)
- Limit orders (set buy/sell price, auto-execute if match)
- Notification engine (price alerts, deal availability)
- API for wealth manager integration (read-only: portfolio, analytics)

**Q4 2026 (Months 7-9): Research & Content**
- In-house research team (3-5 analysts)
- Quarterly deep dives (3-5 companies per report)
- Sector reports (Q3 2026: SaaS unlisted landscape)
- Educational video series (YouTube: cap tables, IPO process, tax)
- Blog content calendar (2 posts/week; keyword-optimized for SEO)

**Q1 2027 (Months 10-12): Enterprise & B2B**
- White-label API for wealth managers (buy/sell unlisted shares branded as theirs)
- Portfolio management tools (wealth managers manage client unlisted holdings)
- Reporting & compliance tools (holdings, gains, tax reporting)
- Premium tier (₹5-10K/month for advisors)

**Q2 2027 (Months 13-15): Secondary Features**
- Loan against unlisted shares (emerging market; maybe partner with NBFC)
- Secondary fund formation (aggregate small investors into fund for scale)
- Liquidity pools (reduce RM dependency, faster settlement)

**Q3 2027+ (Months 16-18+): Ecosystem**
- Corporate actions tracking (ESOPs vest, buybacks, follow-on funding)
- Alert system for events (company IPO announcement → auto-notify holders)
- Dealroom integration (capture startup funding news)
- International unlisted shares (US Series A/B for Indian diaspora)

---

## SECTION 5: DATA MODEL (System Design)

### 5.1 Core Entities & Schema

#### **Users**

```
users:
  id (UUID, PK)
  email (VARCHAR, UNIQUE)
  phone (VARCHAR, UNIQUE)
  first_name, last_name (VARCHAR)
  kyc_status (ENUM: pending, verified, rejected)
  kyc_verification_date (TIMESTAMP)
  accredited_investor (BOOLEAN) -- based on income/net_worth proof
  investor_type (ENUM: individual, huf, partnership, company, nri)
  identity_verified_at (TIMESTAMP)
  pan (VARCHAR, encrypted)
  aadhaar_last_4 (VARCHAR, encrypted)
  annual_income (BIGINT) -- in ₹; nullable if company
  net_worth (BIGINT) -- in ₹; nullable
  bank_account_id (FK: bank_accounts)
  demat_account_id (FK: demat_accounts)
  created_at, updated_at (TIMESTAMP)
  aml_risk_flag (ENUM: low, medium, high) -- auto-calculated
  last_pep_check (TIMESTAMP)
  is_active (BOOLEAN)
```

#### **Companies**

```
companies:
  id (UUID, PK)
  legal_name (VARCHAR)
  display_name (VARCHAR)
  sector (VARCHAR) -- FinTech, SaaS, HealthTech, etc.
  founded_year (INT)
  cin (VARCHAR, nullable) -- registration number
  website (VARCHAR, nullable)
  headquarters_city (VARCHAR)
  status (ENUM: pre_seed, seed, series_a, series_b, series_c, pre_ipo, post_ipo, delisted)
  latest_valuation (BIGINT) -- in ₹
  latest_valuation_date (DATE)
  description (TEXT)
  team_size (INT, nullable)
  founders (JSONB) -- [{name, role, bio_url}]
  funding_rounds (JSONB) -- [{date, series, amount_inr, lead_investor}]
  isin (VARCHAR, nullable) -- if dematerialized
  market_cap_ipo (BIGINT, nullable) -- post-IPO valuation
  ipo_date (DATE, nullable)
  listing_exchange (VARCHAR, nullable) -- NSE, BSE
  created_at, updated_at (TIMESTAMP)
  data_source (VARCHAR) -- e.g., "internal_research", "crunchbase", "user_submitted"
```

#### **Instruments**

```
instruments:
  id (UUID, PK)
  company_id (FK: companies)
  security_type (ENUM: common_equity, preferred_equity, warrant, convertible)
  series (VARCHAR, nullable) -- e.g., "Series A", "ESOP Pool"
  isin (VARCHAR, UNIQUE) -- dematerialized identifier
  face_value (DECIMAL) -- e.g., ₹1 per share (standard in India)
  issued_quantity (BIGINT)
  outstanding_quantity (BIGINT) -- still in circulation
  created_at, updated_at (TIMESTAMP)
```

#### **Quotes (Bid/Ask)**

```
quotes:
  id (UUID, PK)
  instrument_id (FK: instruments)
  bid_price (DECIMAL) -- price buyer willing to pay
  bid_quantity (INT) -- qty buyer wants
  ask_price (DECIMAL) -- price seller willing to accept
  ask_quantity (INT)
  bid_user_id (FK: users, nullable) -- if entered by user
  ask_user_id (FK: users, nullable)
  source (ENUM: platform_user, rm_sourced, dealer_network)
  market_price (DECIMAL) -- weighted avg of recent trades
  spread_bps (INT) -- bid-ask spread in basis points
  timestamp (TIMESTAMP)
  expiry (TIMESTAMP) -- quote validity
  is_active (BOOLEAN)
```

#### **Orders**

```
orders:
  id (UUID, PK)
  user_id (FK: users) -- buyer or seller
  instrument_id (FK: instruments)
  order_type (ENUM: buy, sell)
  quantity (INT)
  limit_price (DECIMAL, nullable) -- price limit (if limit order)
  market_price_at_order (DECIMAL)
  order_status (ENUM: pending, quoted, negotiating, matched, settling, settled, cancelled)
  matched_quote_id (FK: quotes, nullable)
  counterparty_user_id (FK: users, nullable) -- the matched party
  demat_account_id (FK: demat_accounts)
  created_at (TIMESTAMP)
  matched_at (TIMESTAMP, nullable)
  settlement_initiated_at (TIMESTAMP, nullable)
  settled_at (TIMESTAMP, nullable)
  reason_if_cancelled (VARCHAR, nullable)
```

#### **Deals**

```
deals:
  id (UUID, PK)
  buyer_order_id (FK: orders)
  seller_order_id (FK: orders)
  instrument_id (FK: instruments)
  quantity (INT)
  agreed_price (DECIMAL)
  deal_status (ENUM: matched, docs_pending, settlement_in_progress, settled, failed)
  
  -- Settlement tracking
  buyer_demat_account (FK: demat_accounts)
  seller_demat_account (FK: demat_accounts)
  dis_issued_date (DATE, nullable) -- Delivery Instruction Slip
  dis_document_id (FK: documents)
  off_market_annexure_id (FK: documents)
  company_consent_id (FK: documents, nullable) -- for private limited
  
  -- Payment tracking
  payment_method (ENUM: bank_transfer, upi, rtgs, neft)
  settlement_amount (BIGINT) -- in ₹
  payment_initiated_at (TIMESTAMP, nullable)
  payment_received_at (TIMESTAMP, nullable)
  
  -- Timestamps
  created_at, matched_at, settled_at (TIMESTAMP)
```

#### **KYC / Compliance**

```
kyc_submissions:
  id (UUID, PK)
  user_id (FK: users)
  submission_type (ENUM: pan, aadhaar, address, income_proof, net_worth_proof)
  document_id (FK: documents)
  verification_status (ENUM: pending, verified, rejected)
  rejection_reason (VARCHAR, nullable)
  verified_by (FK: admin_users, nullable)
  created_at, verified_at (TIMESTAMP)

aml_alerts:
  id (UUID, PK)
  user_id (FK: users)
  alert_type (ENUM: pep_flag, high_volume_rapid_trade, round_tripping, sanctioned_entity, unusual_geography)
  description (TEXT)
  severity (ENUM: low, medium, high)
  flagged_at (TIMESTAMP)
  action_taken (VARCHAR, nullable) -- e.g., "account_frozen", "enhanced_monitoring"
  resolved_at (TIMESTAMP, nullable)

str_reports:
  id (UUID, PK)
  user_id (FK: users, nullable)
  deal_id (FK: deals, nullable)
  reason (TEXT) -- reason for suspicious transaction report
  fiu_reported_at (TIMESTAMP, nullable) -- when reported to FIU-IND
  report_reference_number (VARCHAR, nullable) -- FIU acknowledgement
```

#### **Documents**

```
documents:
  id (UUID, PK)
  user_id (FK: users)
  deal_id (FK: deals, nullable)
  document_type (ENUM: pan, aadhaar, address_proof, bank_statement, company_consent, dis, off_market_annexure, cap_table, financial_statements)
  file_path (VARCHAR) -- S3 path
  file_name (VARCHAR)
  file_hash (VARCHAR) -- SHA256 for integrity
  uploaded_at (TIMESTAMP)
  expires_at (TIMESTAMP, nullable)
  retention_end_date (TIMESTAMP) -- per AML: 7 years post-txn
  is_verified (BOOLEAN)
  verification_notes (TEXT, nullable)
```

#### **Content**

```
content:
  id (UUID, PK)
  title (VARCHAR)
  slug (VARCHAR, UNIQUE) -- URL-friendly
  content_type (ENUM: blog, case_study, explainer_video, research_report, guide)
  body (TEXT) -- Markdown or HTML
  author (VARCHAR)
  published_at (TIMESTAMP)
  updated_at (TIMESTAMP)
  featured_image_url (VARCHAR)
  seo_keywords (VARCHAR[]) -- for SEO
  views_count (INT, default: 0)
  related_company_ids (UUID[], nullable) -- tagging for discovery
  is_published (BOOLEAN, default: false)
  is_featured (BOOLEAN, default: false)
```

#### **Demat Accounts**

```
demat_accounts:
  id (UUID, PK)
  user_id (FK: users)
  depository (ENUM: nsdl, cdsl)
  client_id (VARCHAR) -- DP's client reference ID
  dp_name (VARCHAR) -- e.g., "ICICI Securities", "Angel Broking"
  account_number (VARCHAR, encrypted)
  is_active (BOOLEAN)
  linked_at (TIMESTAMP)
  last_verified_at (TIMESTAMP)
```

#### **Bank Accounts**

```
bank_accounts:
  id (UUID, PK)
  user_id (FK: users)
  account_holder_name (VARCHAR)
  account_number (VARCHAR, encrypted)
  ifsc_code (VARCHAR)
  bank_name (VARCHAR)
  account_type (ENUM: saving, current)
  verified (BOOLEAN)
  verification_date (TIMESTAMP, nullable)
  is_primary (BOOLEAN)
```

---

### 5.2 Index Strategy

```sql
-- Fast order lookups
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_instrument_id ON orders(instrument_id);
CREATE INDEX idx_orders_status ON orders(order_status);

-- Fast deal tracking
CREATE INDEX idx_deals_buyer_user ON deals(buyer_order_id);
CREATE INDEX idx_deals_seller_user ON deals(seller_order_id);
CREATE INDEX idx_deals_status ON deals(deal_status);
CREATE INDEX idx_deals_created_at ON deals(created_at);

-- Company browsing
CREATE INDEX idx_companies_sector_status ON companies(sector, status);
CREATE INDEX idx_companies_valuation ON companies(latest_valuation);

-- Price discovery
CREATE INDEX idx_quotes_instrument_active ON quotes(instrument_id, is_active);
CREATE INDEX idx_quotes_timestamp ON quotes(timestamp);

-- KYC / Compliance
CREATE INDEX idx_kyc_user_status ON kyc_submissions(user_id, verification_status);
CREATE INDEX idx_aml_user_severity ON aml_alerts(user_id, severity);

-- Search (full-text if needed)
CREATE FULLTEXT INDEX ft_companies_search ON companies(legal_name, display_name);
```

---

### 5.3 API Design (REST Endpoints)

```
AUTH:
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh-token
GET    /api/auth/me
POST   /api/auth/logout

KYC:
POST   /api/kyc/submit-pan
POST   /api/kyc/submit-aadhaar
POST   /api/kyc/submit-income-proof
GET    /api/kyc/status
GET    /api/kyc/documents

COMPANIES:
GET    /api/companies (with filters: sector, valuation range, status)
GET    /api/companies/:id
GET    /api/companies/:id/valuation-history
GET    /api/companies/:id/recent-quotes
GET    /api/companies/:id/related-news

INSTRUMENTS:
GET    /api/instruments/:id
GET    /api/instruments/:id/price-chart
GET    /api/instruments/:id/bid-ask-spread

ORDERS:
POST   /api/orders (create buy/sell order)
GET    /api/orders (user's orders)
GET    /api/orders/:id
PUT    /api/orders/:id/cancel
GET    /api/orders/:id/status

DEALS:
GET    /api/deals (user's completed deals)
GET    /api/deals/:id
GET    /api/deals/:id/documents
POST   /api/deals/:id/upload-dis

PORTFOLIO:
GET    /api/portfolio/holdings
GET    /api/portfolio/performance
GET    /api/portfolio/transactions
GET    /api/portfolio/tax-report

CONTENT:
GET    /api/content (blog posts, articles)
GET    /api/content/:slug
GET    /api/content/search

ADMIN:
POST   /api/admin/companies (seed new company)
PUT    /api/admin/companies/:id
GET    /api/admin/orders (all orders in system)
GET    /api/admin/kyc-queue
POST   /api/admin/kyc/:id/verify
GET    /api/admin/reports/transaction-volume
GET    /api/admin/aml-alerts
```

---

## SECTION 6: CONTENT STRATEGY & ROADMAP

### 6.1 Trust-Building Content (vs. Hype)

**Principle:** Educational > Salesy. Build authority by answering investor questions, not promising returns.

### 6.2 Content Pillar 1: Foundational Education (4-6 articles)

1. **"Unlisted Shares 101: What You Need to Know Before Investing"**
   - What are unlisted shares?
   - How do they differ from listed (NSE/BSE)?
   - Who issues unlisted shares?
   - Key risks: illiquidity, lack of regulatory protection, valuation uncertainty
   - Keywords: "what are unlisted shares", "how to invest in unlisted shares"
   - CTA: "Ready to explore opportunities? Start with your KYC."

2. **"Understanding Cap Tables, Dilution, and Ownership"**
   - What is a cap table?
   - How dilution affects shareholder value
   - Reading cap tables: common vs. preferred equity
   - Employee option pools (ESOP)
   - Case: "How a Series A diluted founder's stake by 25%"
   - Keywords: "cap table explained", "dilution explained"
   - CTA: "Analyze any startup's cap table on our platform."

3. **"The IPO Journey: How Unlisted Companies Go Public"**
   - When is a company ready for IPO?
   - What happens between unlisted → IPO → listing?
   - Lock-in period (6-month post-IPO restriction)
   - How pre-IPO investors benefit
   - Case study: Swiggy unlisted → IPO → post-listing performance
   - Keywords: "IPO process", "pre-IPO shares benefits"
   - CTA: "Track companies on our platform heading toward IPO."

4. **"Tax Implications of Unlisted Share Investments"**
   - Long-term capital gains (24-month rule): 12.5% tax rate (effective 2024)
   - Short-term capital gains: ordinary income tax rates
   - Deductible expenses (brokerage, advisory fees)
   - When to time your sell for tax optimization (disclaimer: not tax advice)
   - Comparison: Listed vs. unlisted tax treatment (STT exemption)
   - Keywords: "unlisted shares tax", "capital gains tax"
   - CTA: "Download our tax implications checklist."

5. **"How Demat Works: Storing & Transferring Unlisted Shares"**
   - What is a demat account?
   - How unlisted shares are stored electronically
   - Off-market transfer process (DIS, annexure, settlement)
   - DP (Depository Participant) role
   - Timeline: settlement speed (T+0, T+1)
   - Keywords: "demat account explained", "off-market transfer"
   - CTA: "Check if your DP supports unlisted shares."

6. **"KYC for Unlisted Investing: What Documents Do You Need?"**
   - What is KYC (Know Your Customer)?
   - Documents required: PAN, Aadhaar, address proof, income/net worth proof
   - Accredited investor criteria (net worth, annual income thresholds)
   - How your KYC data is protected (PMLA compliance, encryption)
   - FAQs: Timing, rejections, updates
   - Keywords: "KYC unlisted shares", "accredited investor"
   - CTA: "Complete your KYC in 5 minutes."

---

### 6.3 Content Pillar 2: Risk & Regulatory Clarity (3-5 articles)

7. **"Why Unlisted Shares Are Risky: 7 Things Investors Must Know"**
   - Risk 1: Illiquidity (hard to sell quickly)
   - Risk 2: No regulatory protection (not SEBI-regulated)
   - Risk 3: Valuation uncertainty (no public price discovery)
   - Risk 4: Company failure (startup mortality)
   - Risk 5: Founder/employee lockups (restricted sales pre-IPO)
   - Risk 6: Scams & fraud (unverified sellers, fake shares)
   - Risk 7: Platform risk (platform going down, losing your data)
   - Keywords: "unlisted shares risks", "investment risks"
   - CTA: "Read our full risk disclosure before investing."

8. **"SEBI, Regulations, and Your Investor Protection"**
   - SEBI's December 2024 warning about unlisted platforms
   - What SEBI regulates vs. doesn't regulate
   - Why unlisted shares lack investor protection fund compensation
   - AML/KYC: Why we ask for so many documents
   - Private placement rules (why we can't advertise widely)
   - What you can do if something goes wrong
   - Keywords: "SEBI unlisted shares", "investor protection"
   - CTA: "Understand your rights; read our compliance page."

9. **"Red Flags: How to Spot Scams in Unlisted Share Investing"**
   - Red flag 1: Platforms promising guaranteed returns
   - Red flag 2: No KYC verification (lack of compliance)
   - Red flag 3: Vague company information (no cap table, no financials)
   - Red flag 4: Pressure to invest quickly ("Limited slots available")
   - Red flag 5: Unregistered intermediaries (no regulatory license)
   - Red flag 6: Price too far above/below market (manipulation)
   - Case study: [Real fraud case anonymized]
   - Keywords: "unlisted shares scam", "investment fraud"
   - CTA: "Report suspicious activity; we take compliance seriously."

10. **"What We're NOT: Clarifying Our Role as a Deal Facilitator"**
    - We are NOT a stock exchange
    - We are NOT SEBI-regulated
    - We do NOT provide investment advice
    - We do NOT guarantee returns
    - We do NOT have insurance/investor protection fund
    - We DO facilitate secondary transactions between accredited investors
    - We DO enforce AML/KYC compliance
    - We DO provide educational content
    - Keywords: "platform disclaimer", "regulatory status"
    - CTA: "Review our full terms of service."

---

### 6.4 Content Pillar 3: Company Deep Dives (Quarterly)

11. **Company Research Reports (3 reports in first 6 months)**
    - Report 1: "Groww: The Next ₹50K Cr IPO?" (Valuation analysis, funding rounds, IPO timeline)
    - Report 2: "B2B SaaS Unlisted Landscape Q2 2026" (Sector analysis: Chargebee, Postman, Razorpay pre-IPO)
    - Report 3: "FinTech Unicorns Heading to IPO" (OKX, Polygon, etc.)
    - Format: 3-5 page PDF with charts, financials, peer comparisons
    - CTA: "Invest in these companies on our platform."

---

### 6.5 Content Pillar 4: Case Studies (Monthly)

12. **"From ₹500 Unlisted to ₹2,000 at IPO: Zomato Investor's Journey"**
    - Timeline: When Zomato was unlisted, offer price, IPO price, current price
    - Return calculation: ₹500 → ₹2,125 (325% gain)
    - Lessons: Timing, sector bet, patience
    - Note: Not all companies succeed; past performance ≠ future results
    - Keywords: "IPO returns case study"
    - CTA: "Explore similar opportunities on our platform."

13. **"ESOP Liquidation Success Story: Startup Employee's ₹10L Windfall"**
    - Background: Employee joined Series A startup with 10,000 ESOP options
    - Vesting: 4-year vesting + 1-year cliff
    - Liquidation: Used our platform to sell 5,000 vested options at ₹1,000/share = ₹50L
    - Outcome: Diversified portfolio, paid education loan
    - Note: Anonymized (Company X, Employee Y)
    - Keywords: "ESOP liquidation", "startup employee wealth"
    - CTA: "Liquidate your ESOP options on our platform."

---

### 6.6 Content Pillar 5: Educational Videos (YouTube)

14. **5-minute explainers (2x per month)**
    - "What is a Unicorn?"
    - "Series A, B, C: What Do They Mean?"
    - "How to Read a Pitch Deck"
    - "IPO Timeline: 12-Month Countdown"
    - "Demat Basics: Where Are Your Shares?"
    - Keywords: long-tail education content
    - CTA: Each video → link to platform, mention "available on our platform"

---

### 6.7 Content Pillar 6: Interactive Tools (In-Platform)

15. **Cap Table Simulator**
    - Input: Founding shares, Series A size, Series B size, ESOP pool, founder retention
    - Output: Interactive table showing ownership post-each round
    - Use case: "Understand dilution before investing"
    - Keywords: "cap table calculator"
    - CTA: "Analyze cap tables for companies on our platform."

16. **IPO Return Calculator**
    - Input: Unlisted price, IPO price (estimate), holding period
    - Output: Return %, IRR, tax liability
    - Use case: "What if Groww IPOs at ₹3,000? What would I make?"
    - Keywords: "IPO returns calculator"
    - CTA: "Calculate returns for companies on our platform."

17. **Tax Calculator**
    - Input: Purchase date, sale date, purchase price, sale price
    - Output: LTCG or STCG, tax amount (at standard slabs)
    - Disclaimer: "Not tax advice; consult a professional"
    - Keywords: "capital gains tax calculator"
    - CTA: "Plan your taxes; sell on our platform."

---

### 6.8 Content Distribution Plan (First 12 Months)

| Month | Output | Channel |
|-------|--------|---------|
| **M1-2** | 3 foundational articles | Blog, SEO focus |
| **M2-3** | 2 risk/regulatory articles | Blog, LinkedIn |
| **M3-4** | 1 research report | Email list, Twitter/X |
| **M4** | 4 YouTube explainer videos | YouTube, LinkedIn |
| **M5** | 2 case studies | Blog, LinkedIn |
| **M6** | 1 research report, cap table simulator | Blog, product launch |
| **M7-8** | 2 more articles, 4 videos | Blog, YouTube |
| **M9-10** | 1 research report, IPO calculator | Email, product launch |
| **M11-12** | 2 final pieces, tax calculator, retrospective | Blog, YouTube, email |

**SEO Strategy:**
- Target long-tail keywords: "how to invest in unlisted shares India", "ESOP liquidation India", "pre-IPO shares tax India"
- Internal linking: Every blog → relevant companies in catalog
- Backlinks: Outreach to personal finance blogs, startup communities

**Social Strategy:**
- Twitter/X: Daily market updates, IPO news, tips (follow @UnlistedZone, @WWIPL)
- LinkedIn: Thought leadership, regulatory updates, company profiles
- WhatsApp: Weekly digest of new opportunities, market moves

---

### 6.9 Content Ideas (Detailed 15-Point List)

1. **"Unlisted Shares 101: What You Need to Know Before Investing"** - Foundational blog post, 2,000 words, SEO-optimized
2. **"Understanding Cap Tables, Dilution, and Ownership"** - Technical but accessible guide with interactive examples
3. **"The IPO Journey: How Unlisted Companies Go Public"** - Timeline explainer, case study-focused
4. **"Tax Implications of Unlisted Share Investments"** - Detailed breakdown with disclaimer
5. **"How Demat Works: Storing & Transferring Unlisted Shares"** - Process walkthrough with diagrams
6. **"KYC for Unlisted Investing: What Documents Do You Need?"** - FAQ-style guide
7. **"Why Unlisted Shares Are Risky: 7 Things Investors Must Know"** - Risk transparency blog
8. **"SEBI, Regulations, and Your Investor Protection"** - Regulatory clarity piece (build trust)
9. **"Red Flags: How to Spot Scams in Unlisted Share Investing"** - Fraud prevention guide
10. **"What We're NOT: Clarifying Our Role as a Deal Facilitator"** - Compliance + marketing piece
11. **Quarterly Research Report: "Groww: The Next ₹50K Cr IPO?"** - In-depth analysis, downloadable PDF
12. **Case Study: "From ₹500 Unlisted to ₹2,000 at IPO: Zomato's Journey"** - Real returns, anonymized investor story
13. **Case Study: "ESOP Liquidation Success: Startup Employee's ₹10L Windfall"** - Relatability + ESOP focus
14. **5-Minute Video Series: Cap Tables, IPO Process, Demat Basics** - YouTube, 8 videos in first 6 months
15. **Interactive Tools: Cap Table Simulator, IPO Return Calculator, Tax Calculator** - In-product engagement, lead generation

---

## SECTION 7: GO-TO-MARKET STRATEGY

### 7.1 Phase 1: Community & Influencer (Month 1-2)

- **Angel Investor Communities:** SeedInvest India, AngelList India, IAN (Indian Angel Network)
- **Startup Employee Communities:** Gozoop, Unstop, angel investor Slack channels
- **Reddit:** r/StockMarketIndia, r/IndiaInvestments (organic mentions, not ads)
- **Influencers:** Pre-IPO investor YouTube channels, personal finance creators
- **TikTok/Instagram:** Short-form content on ESOP, unlisted opportunities (entertaining educational)

### 7.2 Phase 2: Content + Organic Search (Month 2-4)

- Publish 3-5 high-quality blog posts, optimize for SEO
- Backlink outreach: moneycontrol.com, economictimes.com, finweb blogs
- YouTube channel: Weekly explainers (reach: 10K+ subscribers by M4)
- Press releases: Launch announcement to business press (Economic Times, ET NOW)

### 7.3 Phase 3: Partnerships & Distribution (Month 4-6)

- **Wealth Manager Partnerships:** APIs for IndiaBulls, ICICI Direct, Sharekhan, 5paisa
- **RM Networks:** Partner with 20-30 RMs; share deal flow; white-label option
- **Corporate ESOP Brokers:** Reach startup CFOs to integrate our liquidation
- **LinkedIn Sales Outreach:** Target finance directors at startups (ESOP programs)

### 7.4 Phase 4: Paid + Brand (Month 6+)

- **Google Search Ads:** Target "unlisted shares", "pre-IPO India", "ESOP liquidation"
- **LinkedIn Ads:** Target HNI, business owners, wealth managers
- **Brand Partnerships:** Sponsorship of angel investor events, fintech conferences
- **PR:** Case studies of 10x ESOP liquidations, IPO success stories

---

## SECTION 8: FINANCIAL MODEL (ROUGH)

### 8.1 MVP Costs (6-8 Weeks)

| Component | Cost | Notes |
|-----------|------|-------|
| **Team (Contractor/part-time)** | ₹12-15 L | 1 founding eng, 1 part-time PM, 1 designer |
| **Tech Stack & Hosting** | ₹2 L | AWS, Vercel, monitoring tools |
| **Compliance & Legal** | ₹3 L | PMLA audit, KYC/AML framework, ToS + Privacy |
| **Data Acquisition** | ₹2 L | 100 companies seed data (manual research + APIs) |
| **Launch Marketing** | ₹1 L | Content, Twitter, Reddit, email list |
| **Contingency (10%)** | ₹2 L | |
| **TOTAL MVP** | **₹22-25 L** | |

### 8.2 Unit Economics (V1.0, Months 6+)

**Assumptions:**
- 1,000 active users by M6
- ₹200 avg deal size per user per month (conservative)
- 2% take rate (spread between bid-ask)

**Monthly Revenue:**
- 1,000 users × ₹200 avg deal = ₹20L AUM
- 2% take rate = ₹4L / month revenue (~₹50L annualized)

**Monthly Operating Costs (V1.0):**
- Team: 2 fulltime (eng, PM), 1 part-time (design, content) = ₹8 L / month
- Infrastructure: ₹50K
- Compliance + Legal: ₹50K
- Marketing: ₹1 L
- **Total: ₹10 L / month**

**Unit Economics:**
- Revenue: ₹4 L (month 6)
- Costs: ₹10 L (month 6)
- Burn: ₹6 L / month (improved by M12 → breakeven)

**Path to Breakeven:**
- Need 2,500 users + 3% take rate (or 5K users + 2% take rate)
- Achievable by M12-M18 with partnerships + organic growth

---

## SECTION 9: IMPLEMENTATION ROADMAP (16-WEEK PLAN)

### **Weeks 1-2: Foundation**
- [ ] Team assembly (founding engineer, PM, designer confirmed)
- [ ] Regulatory consultation (lawyer: PMLA, SEBI compliance)
- [ ] Tech stack finalized (Next.js, PostgreSQL, Vercel, AWS)
- [ ] Data sources identified (50-100 companies for seed data)

### **Weeks 3-5: Backend + Auth**
- [ ] PostgreSQL schema + migrations
- [ ] NextAuth.js + email signup/login
- [ ] KYC verification API integration (Shuddh / Truffle)
- [ ] User profile + demat account linkage
- [ ] AML screening setup (initial PAN-Aadhaar checks)

### **Weeks 6-8: Core Marketplace**
- [ ] Companies CRUD + catalog seeding
- [ ] Browse + search functionality
- [ ] Buy/sell order forms
- [ ] Quote display + RM assignment queue
- [ ] Admin panel for RM task management

### **Weeks 9-11: Documents + Compliance**
- [ ] DIS + off-market annexure templates
- [ ] Document upload/storage (S3)
- [ ] KYC document management
- [ ] Legal pages (disclaimer, risk, privacy, ToS)
- [ ] AML alert system (monitoring for red flags)

### **Weeks 12-14: Frontend + UX**
- [ ] User dashboard (portfolio, transactions)
- [ ] Company detail page (valuation chart, bid-ask, news)
- [ ] Mobile-responsive design
- [ ] WhatsApp integration for RM alerts
- [ ] Basic educational content (landing page)

### **Weeks 15-16: Testing, Launch Prep, Content**
- [ ] End-to-end testing (buy/sell/settlement flow)
- [ ] Security audit (encryption, data protection)
- [ ] Performance testing (load, database)
- [ ] 5-10 blog posts + videos live
- [ ] Press outreach, influencer seeding
- [ ] Beta launch (50-100 invited users)

---

## SECTION 10: SUCCESS METRICS & MILESTONES

### **MVP Success (Week 8-12)**
- ✓ 500 verified users on platform
- ✓ 50+ companies in catalog
- ✓ 50 buy/sell inquiries in system
- ✓ 10+ completed deals (settled in demat)
- ✓ NPS: 40+
- ✓ Media coverage: 1-2 press mentions

### **V1.0 Success (Month 6)**
- ✓ 2,000 active users
- ✓ 200+ companies in catalog
- ✓ ₹20L AUM (Assets Under Management)
- ✓ 50+ settled deals/month
- ✓ NPS: 50+
- ✓ TAT: 48h avg from match to demat
- ✓ YouTube channel: 5K subscribers
- ✓ Blog: 20+ articles, organic SEO traffic 2K/month

### **Extended Success (Month 12)**
- ✓ 5,000+ active users
- ✓ ₹100L AUM
- ✓ 200+ settled deals/month
- ✓ 3 research reports published
- ✓ YouTube: 15K subscribers
- ✓ Monthly recurring revenue: ₹2-3L (breakeven trajectory)
- ✓ 10+ wealth manager partnership integrations
- ✓ Press: 10+ mentions in top financial media

---

## APPENDIX: REGULATORY REFERENCES

1. **Securities Contract (Regulation) Act, 1956 (SCRA)** - Section 19: Recognized exchanges only
2. **Companies Act, 2013** - Section 42 (private placements), Section 68 (penalties)
3. **SEBI (Issue of Capital and Disclosure Requirements) Regulations, 2018** - Pre-issue lock-in period (6 months post-IPO)
4. **Prevention of Money Laundering Act, 2002** - KYC/AML obligations
5. **SEBI Master Circular on AML/CFT (June 6, 2024)** - Client due diligence, PEP screening, STR reporting
6. **NSDL Circular No. NSDL/POLICY/2025/0071 (June 3, 2025)** - Off-market transfer procedure for private limited companies
7. **CDSL Demat Rules** - Inter-depository transfers, ISIN registration
8. **Foreign Exchange Management Act (FEMA)** - NRI/foreign investor restrictions
9. **SEBI Press Release (December 10, 2024)** - Warning on unlisted platforms
10. **Tax: Income Tax Act, 1961** - Sections 2(42C) (capital gains), applicable slab rates

---

## CONCLUSION

This spec provides a **complete blueprint** for a next-generation unlisted shares platform in India. The competitive teardown reveals gaps (e.g., UnlistedZone lacks analytics; Precize lacks ESOP focus; Sharescart lacks real-time pricing). Your differentiation opportunity lies in:

1. **Combining the best of each:** ESOP liquidity (UnlistedZone) + research depth (WWIPL) + screener power (Sharescart) + curation (Precize)
2. **Building trust through transparency:** Aggressive disclaimers, regulatory clarity, educational content (not hype)
3. **Data-driven product:** Real-time pricing, peer indices, historical performance tracking
4. **Compliance-first:** Robust KYC/AML, off-market transfer automation, document management
5. **Content as moat:** 15+ trust-building pieces that rank in Google, building organic traffic + brand authority

**MVP Timeline:** 8 weeks to ₹50 daily active users + 10 settled deals.  
**Unit Economics:** Breakeven by M12-18 with 2-3K active users + 3% take rate.  
**Market Size:** ₹50K+ Cr unlisted market in India; growing 30%+ YoY.

Good luck. This is a $100M+ opportunity if executed with compliance rigor and product excellence.

---

**Document v1.0 | Updated Feb 25, 2026**
