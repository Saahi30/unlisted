export type CompanyStatus = 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'pre_ipo' | string;

export interface Company {
    id: string;
    name: string;
    sector: string;
    valuation: number; // in crores INR
    status: CompanyStatus;
    currentAskPrice: number;
    currentBidPrice: number;
    description: string;
    aiContext?: string;
}

export const MOCK_COMPANIES: Company[] = [
    {
        id: "comp_1",
        name: "Swiggy",
        sector: "FoodTech",
        valuation: 85000,
        status: "pre_ipo",
        currentAskPrice: 450,
        currentBidPrice: 440,
        description: "Leading food delivery and quick commerce platform in India."
    },
    {
        id: "comp_2",
        name: "Groww",
        sector: "FinTech",
        valuation: 25000,
        status: "series_c",
        currentAskPrice: 1250,
        currentBidPrice: 1200,
        description: "Online investment and trading platform democratizing finance."
    },
    {
        id: "comp_3",
        name: "Razorpay",
        sector: "FinTech",
        valuation: 60000,
        status: "pre_ipo",
        currentAskPrice: 3200,
        currentBidPrice: 3100,
        description: "Payments solution provider that allows businesses to accept, process, and disburse payments."
    },
    {
        id: "comp_4",
        name: "Postman",
        sector: "SaaS",
        valuation: 45000,
        status: "series_c",
        currentAskPrice: 5400,
        currentBidPrice: 5200,
        description: "API platform for building and using APIs."
    },
    {
        id: "comp_5",
        name: "Zepto",
        sector: "Quick Commerce",
        valuation: 11000,
        status: "series_c",
        currentAskPrice: 850,
        currentBidPrice: 820,
        description: "10-minute grocery delivery service."
    }
];


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
