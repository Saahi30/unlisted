export type CompanyStatus = 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'pre_ipo' | string;

export interface Company {
    id: string;
    name: string;
    sector: string;
    valuation: number; // in crores INR
    status: CompanyStatus;
    category?: string; // e.g. 'Food Tech · Pre-IPO'
    currentAskPrice: number;
    currentBidPrice: number;
    description: string;
    change?: string; // e.g. '+12.4%'
    positive?: boolean;
    minInvest?: string; // e.g. '₹50,000'
    img?: string;
    imgAlt?: string;
    aiContext?: string;
    isFeatured?: boolean;
}

export const MOCK_COMPANIES: Company[] = [
    {
        id: "comp_1",
        name: "Swiggy Ltd.",
        sector: "FoodTech",
        valuation: 85000,
        status: "pre_ipo",
        category: 'Food Tech · Pre-IPO',
        currentAskPrice: 450,
        currentBidPrice: 440,
        change: '+12.4%',
        positive: true,
        minInvest: '₹50,000',
        img: "https://images.unsplash.com/photo-1577596760863-e25afdd02da1",
        imgAlt: 'Food delivery bag on a motorbike in an Indian city',
        description: "Leading food delivery and quick commerce platform in India.",
        isFeatured: true
    },
    {
        id: "comp_2",
        name: "Groww",
        sector: "FinTech",
        valuation: 25000,
        status: "series_c",
        category: 'FinTech · Series C',
        currentAskPrice: 1250,
        currentBidPrice: 1200,
        change: '+8.1%',
        positive: true,
        minInvest: '₹1,00,000',
        img: "/assets/images/groww.jpg",
        imgAlt: 'Investment app on smartphone showing portfolio growth',
        description: "Online investment and trading platform democratizing finance.",
        isFeatured: true
    },
    {
        id: "comp_3",
        name: "Razorpay",
        sector: "FinTech",
        valuation: 60000,
        status: "pre_ipo",
        category: 'FinTech · Pre-IPO',
        currentAskPrice: 3200,
        currentBidPrice: 3100,
        change: '+21.7%',
        positive: true,
        minInvest: '₹75,000',
        img: "https://images.unsplash.com/photo-1654263937085-48fb17a63d66",
        imgAlt: 'Payment terminal on retail counter with card transaction',
        description: "Payments solution provider that allows businesses to accept, process, and disburse payments.",
        isFeatured: true
    },
    {
        id: "comp_5",
        name: "Zepto",
        sector: "Quick Commerce",
        valuation: 51229,
        status: "pre_ipo",
        category: 'Quick Commerce · Pre-IPO',
        currentAskPrice: 54,
        currentBidPrice: 50,
        change: '-6.90%',
        positive: false,
        minInvest: '₹25,000',
        img: "https://images.unsplash.com/photo-1542838132-92c53300491e",
        imgAlt: 'Grocery delivery worker packing fresh produce in a warehouse',
        description: "10-minute grocery delivery service.",
        isFeatured: true
    },
    {
        id: "comp_4",
        name: "Postman",
        sector: "SaaS",
        valuation: 45000,
        status: "series_c",
        category: 'SaaS · Series C',
        currentAskPrice: 5400,
        currentBidPrice: 5200,
        change: '+15.3%',
        positive: true,
        minInvest: '₹50,000',
        img: "https://images.unsplash.com/photo-1556740758-90de374c12ad",
        imgAlt: 'Modern bank branch interior with financial advisors',
        description: "API platform for building and using APIs.",
        isFeatured: true
    }
];

export const MOCK_HISTORICAL_PRICES = [
    { id: 'hp_1', companyId: 'comp_5', priceDate: '2026-02-01', priceValue: 58 },
    { id: 'hp_2', companyId: 'comp_5', priceDate: '2026-02-08', priceValue: 56 },
    { id: 'hp_3', companyId: 'comp_5', priceDate: '2026-02-15', priceValue: 56 },
    { id: 'hp_4', companyId: 'comp_5', priceDate: '2026-02-22', priceValue: 56 },
    { id: 'hp_5', companyId: 'comp_5', priceDate: '2026-03-01', priceValue: 56 },
    { id: 'hp_6', companyId: 'comp_5', priceDate: '2026-03-02', priceValue: 54 },
    { id: 'hp_7', companyId: 'comp_5', priceDate: '2026-03-08', priceValue: 54 },
    { id: 'hp_8', companyId: 'comp_5', priceDate: '2026-03-14', priceValue: 54 }
];

export const HOME_PAGE_DATA = {
    hero: {
        title: "Invest Before the Crowd Does.",
        highlight: "the Crowd",
        description: "Access high-growth Indian companies — Swiggy, NSDL, HDB Financial — before they list. We also help convert your physical shares to digital in your Demat account.",
        img: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f",
        offerPrice: "₹385",
        offerChange: "+12.4%"
    },
    stats: {
        avgReturns: "2.8×",
        totalOrders: "12,000+",
        users: "50,000+"
    }
};


export interface Order {
    id: string;
    companyId: string;
    userId: string;
    quantity: number;
    price: number;
    status: 'submitted' | 'docs_pending' | 'settled';
    createdAt: string;
    type: 'buy' | 'sell';
}

export const MOCK_ORDERS: Order[] = [
    {
        id: "ord_1",
        companyId: "comp_1",
        userId: "cust_1",
        quantity: 100,
        price: 450,
        status: "docs_pending",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        type: 'buy'
    },
    {
        id: "ord_2",
        companyId: "comp_2",
        userId: "cust_1",
        quantity: 50,
        price: 1250,
        status: "settled",
        createdAt: new Date(Date.now() - 806400000).toISOString(),
        type: 'buy'
    },
    {
        id: "ord_3",
        companyId: "comp_3",
        userId: "user_2",
        quantity: 500,
        price: 3200,
        status: "submitted",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        type: 'buy'
    },
    {
        id: "ord_4",
        companyId: "comp_4",
        userId: "user_3",
        quantity: 20,
        price: 5400,
        status: "submitted",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        type: 'sell'
    }
];

export type LeadStatus = 'new' | 'contacted' | 'kyc_pending' | 'onboarded';

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    assignedRmId: string; // 'sls_1', 'sls_2' etc
    notes: string[];
    status: LeadStatus;
    onboardingToken?: string;
    kycStatus: 'pending' | 'documents_uploaded' | 'verified';
    pan?: string;
    bank?: string;
    address?: string;
    companyId?: string;
    companyName?: string;
    quantity?: number;
    price?: number;
    createdAt: string;
}

export const MOCK_LEADS: Lead[] = [
    {
        id: "lead_1",
        name: "Rahul Verma",
        email: "rahul@example.com",
        phone: "+91 9876543210",
        assignedRmId: "sls_1",
        notes: ["Wants to buy Swiggy shares", "Call arranged for tomorrow"],
        status: "contacted",
        kycStatus: "pending",
        createdAt: new Date(Date.now() - 172800000).toISOString()
    }
];

export const MOCK_USERS = [
    { id: 'cust_1', name: 'John Doe', email: 'customer@sharesaathi.com', role: 'customer', assignedRmId: 'sls_1' },
    { id: 'user_2', name: 'Alok Sharma', email: 'alok@example.com', role: 'customer', assignedRmId: 'sls_1' },
    { id: 'user_3', name: 'Megha Gupta', email: 'megha@test.com', role: 'customer', assignedRmId: 'sls_2' },
    { id: 'adm_1', name: 'Admin Supervisor', email: 'admin@sharesaathi.com', role: 'admin' },
    { id: 'mgr_1', name: 'Sales Director', email: 'manager@sharesaathi.com', role: 'staffmanager' },
    { id: 'sls_1', name: 'Priya Patel', email: 'agent@sharesaathi.com', role: 'rm' },
    { id: 'sls_2', name: 'Amit Kumar', email: 'amit@sharesaathi.com', role: 'rm' }
];

export const MOCK_BLOGS = [
    {
        id: "blog_1",
        title: "NSE Pre-IPO Analysis: The Crown Jewel of Indian Exchanges",
        slug: "nse-pre-ipo-analysis",
        excerpt: "As the National Stock Exchange (NSE) gears up for its much-awaited IPO, we analyze the current secondary market premiums.",
        content: `The National Stock Exchange of India (NSE) remains the most sought-after asset in the Indian unlisted space. With a near-total dominance in the derivatives segment...

### The Thesis: A Monopolistic Moat
NSE’s competitive advantage isn't just technology; it’s liquidity. In the exchange business, liquidity begets liquidity.

### Valuation Mechanics
In the secondary market, NSE shares have consistently traded at a premium. Currently, the valuation multiples are being reassessed against global peers...`,
        status: "published" as const,
        views: 1240,
        authorId: "adm_1",
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        publishedAt: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
        id: "blog_2",
        title: "Zepto's Path to Profitability in Quick Commerce",
        slug: "zepto-quick-commerce-analysis",
        excerpt: "Zepto has defied the skeptics by demonstrating a path to EBITDA positivity. We deep-dive into its dark store network.",
        content: `Zepto’s rise in the Indian Quick Commerce (QC) space has been nothing short of meteoric. While initial skepticism focused on the high cost of 10-minute delivery...

### The Thesis: Dark Store Throughput
The secret to Zepto’s success lies in the throughput of its dark stores. Unlike traditional retail, these micro-hubs operate 24/7.

### Risk Assessment: Burn and Churn
High cash burn remains the elephant in the room. While certain clusters are profitable, the overall enterprise still requires capital.`,
        status: "published" as const,
        views: 875,
        authorId: "adm_1",
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        publishedAt: new Date(Date.now() - 10 * 86400000).toISOString()
    }
];
