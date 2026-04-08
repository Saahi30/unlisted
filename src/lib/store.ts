import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { MOCK_ORDERS, MOCK_LEADS, Lead, MOCK_COMPANIES, Company, CompanyFinancial, MOCK_USERS, MOCK_BLOGS, MOCK_HISTORICAL_PRICES } from './mock-data';
import { UserRole } from './auth-context';
import { supabase } from './supabase';
import { logAudit } from './audit';
import { createNotification } from './notifications';

export type OrderStatus = 'requested' | 'under_process' | 'mail_sent' | 'in_holding';
export type DematStatus = 'initiated' | 'under_process' | 'completed';

// Manager feature types
export interface Ticket {
    id: string;
    customerId: string;
    customerName: string;
    assignedRmId: string;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'escalated';
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdAt: string;
    updatedAt: string;
    messages: { from: string; text: string; at: string }[];
}

export interface RmActivity {
    id: string;
    rmId: string;
    action: string;
    details: string;
    timestamp: string;
    category: 'login' | 'lead' | 'order' | 'call' | 'document' | 'note';
}

export interface Commission {
    id: string;
    rmId: string;
    orderId: string;
    orderAmount: number;
    commissionRate: number;
    commissionAmount: number;
    status: 'pending' | 'approved' | 'paid';
    createdAt: string;
}

export interface Broadcast {
    id: string;
    from: string;
    to: string[]; // rm IDs or 'all'
    subject: string;
    message: string;
    createdAt: string;
    readBy: string[];
}

export interface AuditEntry {
    id: string;
    userId: string;
    userName: string;
    action: string;
    target: string;
    details: string;
    timestamp: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    rmId?: string;
    date: string;
    time: string;
    type: 'meeting' | 'review' | 'followup' | 'deadline';
    notes: string;
}

export interface OnboardingTask {
    id: string;
    rmId: string;
    task: string;
    completed: boolean;
    dueDate: string;
}

export interface RmGoal {
    id: string;
    rmId: string;
    quarter: string;
    goals: { label: string; target: number; current: number }[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    assignedRmId?: string;
}

export interface Team {
    id: string;
    name: string;
    description: string;
    rmIds: string[]; // Relationship Manager IDs
    managerId?: string; // Staff Manager ID
    notes: string[]; // Admin notes
}

export interface DematRequest {
    id: string;
    userId: string;
    companyName: string;
    folioNumber: string;
    certificateNumbers: string;
    distinctiveFrom: string;
    distinctiveTo: string;
    quantity: number;
    fileName: string;
    status: DematStatus;
    createdAt: string;
    notes: string[];
}

export interface ExtendedOrder {
    id: string;
    companyId: string;
    userId: string;
    quantity: number;
    price: number;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
    type: 'buy' | 'sell';
    paymentMethod: 'razorpay' | 'rtgs' | 'rm_connect';
    txProofUrl?: string;
    deliveryDetails?: {
        isin: string;
        date: string;
        time: string;
        declared: boolean;
    };
    companyName: string;
    notes: string[];
}

export interface Blog {
    id: string;
    title: string;
    slug: string;
    content: string; // HTML or Markdown
    excerpt: string;
    authorId: string;
    status: 'draft' | 'published' | 'scheduled';
    views: number;
    createdAt: string;
    publishedAt?: string;
    scheduledAt?: string;
}

export interface HistoricalPrice {
    id: string;
    companyId: string;
    priceDate: string;
    priceValue: number;
}

interface AppState {
    orders: ExtendedOrder[];
    leads: Lead[];
    companies: Company[];
    dematRequests: DematRequest[];
    users: User[];
    teams: Team[];
    blogs: Blog[];
    historicalPrices: HistoricalPrice[];
    companyFinancials: CompanyFinancial[];
    homePageData: any;
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    language: string;
    setLanguage: (lang: string) => void;
    addOrder: (order: ExtendedOrder) => void;
    updateOrderStatus: (id: string, status: OrderStatus, deliveryDetails?: any, txProofUrl?: string) => void;
    addOrderNote: (id: string, note: string) => void;
    addLead: (lead: Lead) => void;
    addLeadNote: (id: string, note: string) => void;
    addCompany: (company: Company) => void;
    updateCompany: (company: Company) => void;
    removeCompany: (id: string) => void;
    addDematRequest: (request: DematRequest) => void;
    updateDematStatus: (id: string, status: DematStatus) => void;
    updateLead: (lead: Lead) => void;
    updateRmTarget: (rmId: string, target: number) => void;
    addUser: (user: User) => void;
    addTeam: (team: Team) => void;
    addTeamNote: (id: string, note: string) => void;
    updateTeam: (team: Team) => void;
    removeTeam: (id: string) => void;
    addBlog: (blog: Blog) => void;
    updateBlog: (blog: Blog) => void;
    removeBlog: (id: string) => void;
    incrementBlogViews: (id: string) => void;
    addHistoricalPrice: (companyId: string, date: string, value: number) => Promise<void>;
    removeHistoricalPrice: (id: string) => Promise<void>;
    updateHomePageData: (data: any) => void;
    rmTargets: Record<string, number>;
    // Manager features
    tickets: Ticket[];
    addTicket: (ticket: Ticket) => void;
    updateTicketStatus: (id: string, status: Ticket['status']) => void;
    addTicketMessage: (id: string, msg: { from: string; text: string; at: string }) => void;
    rmActivities: RmActivity[];
    addRmActivity: (activity: RmActivity) => void;
    commissions: Commission[];
    addCommission: (commission: Commission) => void;
    updateCommissionStatus: (id: string, status: Commission['status']) => void;
    broadcasts: Broadcast[];
    addBroadcast: (broadcast: Broadcast) => void;
    markBroadcastRead: (id: string, rmId: string) => void;
    auditLog: AuditEntry[];
    addAuditEntry: (entry: AuditEntry) => void;
    calendarEvents: CalendarEvent[];
    addCalendarEvent: (event: CalendarEvent) => void;
    removeCalendarEvent: (id: string) => void;
    onboardingTasks: OnboardingTask[];
    addOnboardingTask: (task: OnboardingTask) => void;
    toggleOnboardingTask: (id: string) => void;
    rmGoals: RmGoal[];
    setRmGoal: (goal: RmGoal) => void;
    updateRmGoalProgress: (goalId: string, goalLabel: string, current: number) => void;
    reassignLead: (leadId: string, newRmId: string) => void;
    approveOrder: (orderId: string) => void;
    fetchInitialData: () => Promise<void>;
}

import { HOME_PAGE_DATA } from './mock-data';

// Fallback mock orders (to avoid empty screen if DB empty)
const initialOrders: ExtendedOrder[] = MOCK_ORDERS.map(o => {
    const company = MOCK_COMPANIES.find(c => c.id === o.companyId);
    return {
        ...o,
        status: o.status === 'submitted' ? 'requested' : o.status === 'settled' ? 'in_holding' : 'under_process',
        totalAmount: o.quantity * o.price,
        paymentMethod: o.status === 'docs_pending' ? 'rm_connect' : 'razorpay',
        companyName: company?.name || 'Unknown',
        notes: []
    } as ExtendedOrder;
});

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            orders: initialOrders,
            leads: [...MOCK_LEADS],
            companies: [...MOCK_COMPANIES],
            users: [...MOCK_USERS] as User[],
            teams: [],
            dematRequests: [],
            blogs: [],
            historicalPrices: [...MOCK_HISTORICAL_PRICES],
            companyFinancials: [],
            homePageData: HOME_PAGE_DATA,
            theme: 'light' as 'light' | 'dark' | 'system',
            setTheme: (theme) => {
                set({ theme });
                if (typeof window !== 'undefined') {
                    const root = document.documentElement;
                    if (theme === 'dark') {
                        root.classList.add('dark');
                    } else if (theme === 'light') {
                        root.classList.remove('dark');
                    } else {
                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        root.classList.toggle('dark', prefersDark);
                    }
                }
            },
            language: 'en' as string,
            setLanguage: (lang) => set({ language: lang }),
            rmTargets: {
                'sls_1': 6000000,
                'sls_2': 8000000
            },
            // Manager feature state
            tickets: [
                { id: 'tkt_1', customerId: 'cust_1', customerName: 'John Doe', assignedRmId: 'sls_1', subject: 'Order delay inquiry', description: 'My Swiggy share order has been pending for 3 days.', status: 'open', priority: 'high', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), messages: [{ from: 'cust_1', text: 'When will my order be processed?', at: new Date(Date.now() - 86400000).toISOString() }] },
                { id: 'tkt_2', customerId: 'user_2', customerName: 'Alok Sharma', assignedRmId: 'sls_1', subject: 'KYC document rejected', description: 'My PAN card was rejected during verification.', status: 'in_progress', priority: 'medium', createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 43200000).toISOString(), messages: [] },
                { id: 'tkt_3', customerId: 'user_3', customerName: 'Megha Gupta', assignedRmId: 'sls_2', subject: 'Refund request for cancelled order', description: 'I cancelled my Postman shares order but haven\'t received refund.', status: 'escalated', priority: 'critical', createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 3600000).toISOString(), messages: [{ from: 'user_3', text: 'Please escalate this immediately.', at: new Date(Date.now() - 3600000).toISOString() }] },
            ] as Ticket[],
            addTicket: (ticket) => set((state) => ({ tickets: [ticket, ...state.tickets] })),
            updateTicketStatus: (id, status) => set((state) => ({
                tickets: state.tickets.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t)
            })),
            addTicketMessage: (id, msg) => set((state) => ({
                tickets: state.tickets.map(t => t.id === id ? { ...t, messages: [...t.messages, msg], updatedAt: new Date().toISOString() } : t)
            })),
            rmActivities: [
                { id: 'act_1', rmId: 'sls_1', action: 'Logged in', details: 'Web portal login', timestamp: new Date(Date.now() - 3600000).toISOString(), category: 'login' as const },
                { id: 'act_2', rmId: 'sls_1', action: 'Updated lead', details: 'Added note to Rahul Verma', timestamp: new Date(Date.now() - 7200000).toISOString(), category: 'lead' as const },
                { id: 'act_3', rmId: 'sls_2', action: 'Processed order', details: 'Fulfilled ORD-004 for Megha Gupta', timestamp: new Date(Date.now() - 10800000).toISOString(), category: 'order' as const },
                { id: 'act_4', rmId: 'sls_1', action: 'Called customer', details: 'Follow-up call with John Doe', timestamp: new Date(Date.now() - 14400000).toISOString(), category: 'call' as const },
                { id: 'act_5', rmId: 'sls_2', action: 'Uploaded document', details: 'KYC proof for Megha Gupta', timestamp: new Date(Date.now() - 18000000).toISOString(), category: 'document' as const },
                { id: 'act_6', rmId: 'sls_2', action: 'Logged in', details: 'Web portal login', timestamp: new Date(Date.now() - 21600000).toISOString(), category: 'login' as const },
                { id: 'act_7', rmId: 'sls_1', action: 'Created lead', details: 'New lead: Vikram Singh', timestamp: new Date(Date.now() - 25200000).toISOString(), category: 'lead' as const },
            ] as RmActivity[],
            addRmActivity: (activity) => set((state) => ({ rmActivities: [activity, ...state.rmActivities] })),
            commissions: [
                { id: 'comm_1', rmId: 'sls_1', orderId: 'ord_2', orderAmount: 62500, commissionRate: 2.5, commissionAmount: 1562.5, status: 'paid' as const, createdAt: new Date(Date.now() - 806400000).toISOString() },
                { id: 'comm_2', rmId: 'sls_1', orderId: 'ord_1', orderAmount: 45000, commissionRate: 2.5, commissionAmount: 1125, status: 'pending' as const, createdAt: new Date(Date.now() - 86400000).toISOString() },
                { id: 'comm_3', rmId: 'sls_2', orderId: 'ord_4', orderAmount: 108000, commissionRate: 2.0, commissionAmount: 2160, status: 'approved' as const, createdAt: new Date(Date.now() - 7200000).toISOString() },
            ] as Commission[],
            addCommission: (commission) => set((state) => ({ commissions: [commission, ...state.commissions] })),
            updateCommissionStatus: (id, status) => set((state) => ({
                commissions: state.commissions.map(c => c.id === id ? { ...c, status } : c)
            })),
            broadcasts: [
                { id: 'bc_1', from: 'mgr_1', to: ['sls_1', 'sls_2'], subject: 'Monthly targets updated', message: 'Hi team, Q2 targets have been revised upward by 15%. Please check your individual dashboards.', createdAt: new Date(Date.now() - 172800000).toISOString(), readBy: ['sls_1'] },
            ] as Broadcast[],
            addBroadcast: (broadcast) => set((state) => ({ broadcasts: [broadcast, ...state.broadcasts] })),
            markBroadcastRead: (id, rmId) => set((state) => ({
                broadcasts: state.broadcasts.map(b => b.id === id ? { ...b, readBy: [...b.readBy, rmId] } : b)
            })),
            auditLog: [
                { id: 'aud_1', userId: 'mgr_1', userName: 'Sales Director', action: 'Updated RM Target', target: 'Priya Patel', details: 'Changed target from ₹50L to ₹60L', timestamp: new Date(Date.now() - 86400000).toISOString() },
                { id: 'aud_2', userId: 'mgr_1', userName: 'Sales Director', action: 'Approved Order', target: 'ORD-002', details: 'High-value order approved for Alok Sharma', timestamp: new Date(Date.now() - 172800000).toISOString() },
                { id: 'aud_3', userId: 'mgr_1', userName: 'Sales Director', action: 'Reassigned Lead', target: 'Rahul Verma', details: 'Moved from Priya Patel to Amit Kumar', timestamp: new Date(Date.now() - 259200000).toISOString() },
            ] as AuditEntry[],
            addAuditEntry: (entry) => set((state) => ({ auditLog: [entry, ...state.auditLog] })),
            calendarEvents: [
                { id: 'cal_1', title: '1:1 with Priya Patel', rmId: 'sls_1', date: new Date().toISOString().split('T')[0], time: '10:00', type: 'review' as const, notes: 'Discuss Q2 performance' },
                { id: 'cal_2', title: 'Team standup', date: new Date().toISOString().split('T')[0], time: '09:00', type: 'meeting' as const, notes: 'Daily sync' },
                { id: 'cal_3', title: 'Follow up: Rahul Verma deal', rmId: 'sls_1', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '14:00', type: 'followup' as const, notes: 'Close Swiggy deal' },
            ] as CalendarEvent[],
            addCalendarEvent: (event) => set((state) => ({ calendarEvents: [...state.calendarEvents, event] })),
            removeCalendarEvent: (id) => set((state) => ({ calendarEvents: state.calendarEvents.filter(e => e.id !== id) })),
            onboardingTasks: [] as OnboardingTask[],
            addOnboardingTask: (task) => set((state) => ({ onboardingTasks: [...state.onboardingTasks, task] })),
            toggleOnboardingTask: (id) => set((state) => ({
                onboardingTasks: state.onboardingTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
            })),
            rmGoals: [] as RmGoal[],
            setRmGoal: (goal) => set((state) => ({
                rmGoals: state.rmGoals.some(g => g.id === goal.id)
                    ? state.rmGoals.map(g => g.id === goal.id ? goal : g)
                    : [...state.rmGoals, goal]
            })),
            updateRmGoalProgress: (goalId, goalLabel, current) => set((state) => ({
                rmGoals: state.rmGoals.map(g => g.id === goalId ? {
                    ...g, goals: g.goals.map(gl => gl.label === goalLabel ? { ...gl, current } : gl)
                } : g)
            })),
            reassignLead: (leadId, newRmId) => {
                const lead = get().leads.find(l => l.id === leadId);
                const oldRmId = lead?.assignedRmId || 'unassigned';
                set((state) => ({
                    leads: state.leads.map(l => l.id === leadId ? { ...l, assignedRmId: newRmId } : l)
                }));
                supabase.from('leads').update({ assigned_rm_id: newRmId }).eq('id', leadId);

                // Audit trail
                logAudit({
                    entityType: 'lead',
                    entityId: leadId,
                    action: 'assignment',
                    oldValue: oldRmId,
                    newValue: newRmId,
                    metadata: { leadName: lead?.name }
                });

                // Notify the new RM
                const rmUser = get().users.find(u => u.id === newRmId);
                if (rmUser) {
                    createNotification({
                        userId: newRmId,
                        title: 'New Lead Assigned',
                        message: `Lead "${lead?.name}" has been assigned to you.`,
                        type: 'assignment',
                        link: '/dashboard/sales'
                    });
                }
            },
            approveOrder: (orderId) => {
                const order = get().orders.find(o => o.id === orderId);
                set((state) => ({
                    orders: state.orders.map(o => o.id === orderId && o.status === 'requested' ? { ...o, status: 'under_process' as OrderStatus } : o)
                }));
                supabase.from('orders').update({ status: 'under_process' }).eq('id', orderId);

                // Audit trail
                logAudit({
                    entityType: 'order',
                    entityId: orderId,
                    action: 'status_change',
                    oldValue: 'requested',
                    newValue: 'under_process',
                    metadata: { companyName: order?.companyName }
                });

                // Notify customer
                if (order?.userId) {
                    createNotification({
                        userId: order.userId,
                        title: 'Order Approved',
                        message: `Your order for ${order.companyName} has been approved and is under process.`,
                        type: 'order',
                        link: '/dashboard/customer/orders'
                    });
                }
            },
            addOrder: async (order) => {
                const id = order.id.startsWith('ord_') ? uuidv4() : order.id;
                const newOrder = { ...order, id };
                set((state) => ({ orders: [newOrder, ...state.orders] }));

                await supabase.from('orders').insert([{
                    id,
                    company_id: order.companyId,
                    user_id: order.userId,
                    quantity: order.quantity,
                    price: order.price,
                    total_amount: order.totalAmount,
                    status: order.status,
                    type: order.type,
                    payment_method: order.paymentMethod,
                    tx_proof_url: order.txProofUrl,
                    delivery_details: order.deliveryDetails || {},
                    notes: order.notes || []
                }]);
            },
            updateOrderStatus: async (id, status, deliveryDetails, txProofUrl) => {
                const oldOrder = get().orders.find(o => o.id === id);
                const oldStatus = oldOrder?.status || 'unknown';

                set((state) => ({
                    orders: state.orders.map(o => {
                        if (o.id === id) {
                            return {
                                ...o,
                                status,
                                ...(deliveryDetails ? { deliveryDetails } : {}),
                                ...(txProofUrl ? { txProofUrl } : {})
                            };
                        }
                        return o;
                    })
                }));

                await supabase.from('orders').update({
                    status,
                    ...(deliveryDetails ? { delivery_details: deliveryDetails } : {}),
                    ...(txProofUrl ? { tx_proof_url: txProofUrl } : {})
                }).eq('id', id);

                // Audit trail
                logAudit({
                    entityType: 'order',
                    entityId: id,
                    action: 'status_change',
                    oldValue: oldStatus,
                    newValue: status,
                    metadata: { companyName: oldOrder?.companyName, deliveryDetails }
                });

                // Notify customer
                if (oldOrder?.userId) {
                    createNotification({
                        userId: oldOrder.userId,
                        title: `Order ${status === 'in_holding' ? 'Settled' : 'Updated'}`,
                        message: `Your order for ${oldOrder.companyName} has been moved to ${status.replace('_', ' ')}.`,
                        type: 'order',
                        link: '/dashboard/customer/orders'
                    });
                }

                // Auto move mail_sent to in_holding after 5 minutes
                if (status === 'mail_sent') {
                    setTimeout(async () => {
                        const currentOrder = get().orders.find(o => o.id === id);
                        if (currentOrder && currentOrder.status === 'mail_sent') {
                            set((state) => ({
                                orders: state.orders.map(o =>
                                    (o.id === id && o.status === 'mail_sent') ? { ...o, status: 'in_holding' } : o
                                )
                            }));
                            await supabase.from('orders').update({ status: 'in_holding' }).eq('id', id);
                        }
                    }, 5 * 60 * 1000);
                }
            },
            addOrderNote: async (id, note) => {
                set((state) => ({
                    orders: state.orders.map(o => o.id === id ? { ...o, notes: [...o.notes, note] } : o)
                }));
                const currentOrder = get().orders.find(o => o.id === id);
                if (currentOrder) {
                    await supabase.from('orders').update({ notes: currentOrder.notes }).eq('id', id);
                }
            },
            addLead: async (lead) => {
                const id = lead.id.startsWith('lead_') ? uuidv4() : lead.id;
                const newLead = { ...lead, id };
                set((state) => ({ leads: [newLead, ...state.leads] }));

                await supabase.from('leads').insert([{
                    id,
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    company_id: lead.companyId,
                    quantity: lead.quantity,
                    price: lead.price,
                    status: lead.status,
                    assigned_rm_id: lead.assignedRmId,
                    kyc_status: lead.kycStatus || 'pending',
                    onboarding_token: lead.onboardingToken,
                    notes: lead.notes || []
                }]);
            },
            addLeadNote: async (id, note) => {
                set((state) => ({
                    leads: state.leads.map(l => l.id === id ? { ...l, notes: [...l.notes, note] } : l)
                }));
                const currentLead = get().leads.find(l => l.id === id);
                if (currentLead) {
                    await supabase.from('leads').update({ notes: currentLead.notes }).eq('id', id);
                }
            },
            updateLead: async (lead) => {
                set((state) => ({
                    leads: state.leads.map(l => l.id === lead.id ? lead : l)
                }));
                await supabase.from('leads').update({
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    company_id: lead.companyId,
                    quantity: lead.quantity,
                    price: lead.price,
                    status: lead.status,
                    assigned_rm_id: lead.assignedRmId,
                    kyc_status: lead.kycStatus || 'pending',
                    onboarding_token: lead.onboardingToken,
                    notes: lead.notes || []
                }).eq('id', lead.id);
            },
            addCompany: async (company) => {
                const id = company.id.startsWith('comp_') ? uuidv4() : company.id;
                const newCompany = { ...company, id };
                set((state) => ({ companies: [...state.companies, newCompany] }));

                await supabase.from('companies').insert([{
                    id,
                    name: company.name,
                    sector: company.sector,
                    valuation: company.valuation,
                    status: company.status,
                    current_ask_price: company.currentAskPrice,
                    current_bid_price: company.currentBidPrice,
                    description: company.description,
                    ai_context: company.aiContext || '',
                    category: company.category,
                    change: company.change,
                    positive: company.positive,
                    min_invest: company.minInvest,
                    img: company.img,
                    img_alt: company.imgAlt,
                    is_featured: company.isFeatured
                }]);

                // Automatically generate a new graph data point for today
                const today = new Date().toISOString().split('T')[0];
                const newPriceId = uuidv4();
                const newPrice = { id: newPriceId, companyId: id, priceDate: today, priceValue: company.currentAskPrice };
                set((state) => ({ historicalPrices: [...state.historicalPrices, newPrice] }));
                
                await supabase.from('company_historical_prices').insert([{
                    id: newPriceId,
                    company_id: id,
                    price_date: today,
                    price_value: company.currentAskPrice
                }]);
            },
            updateCompany: async (company) => {
                set((state) => ({
                    companies: state.companies.map(c => c.id === company.id ? company : c)
                }));

                await supabase.from('companies').update({
                    name: company.name,
                    sector: company.sector,
                    valuation: company.valuation,
                    status: company.status,
                    current_ask_price: company.currentAskPrice,
                    current_bid_price: company.currentBidPrice,
                    description: company.description,
                    ai_context: company.aiContext || '',
                    category: company.category,
                    change: company.change,
                    positive: company.positive,
                    min_invest: company.minInvest,
                    img: company.img,
                    img_alt: company.imgAlt,
                    is_featured: company.isFeatured
                }).eq('id', company.id);

                // Auto-sync graph: If the company ask price changed, document it historically for today's graph
                const today = new Date().toISOString().split('T')[0];
                const historicalPrices = get().historicalPrices;
                const existingPointToday = historicalPrices.find(p => p.companyId === company.id && p.priceDate === today);
                
                if (company.currentAskPrice > 0) {
                    if (existingPointToday) {
                        // Update today's graph point with the latest value
                        set((state) => ({
                            historicalPrices: state.historicalPrices.map(p => 
                                p.id === existingPointToday.id ? { ...p, priceValue: company.currentAskPrice } : p
                            )
                        }));
                        await supabase.from('company_historical_prices')
                            .update({ price_value: company.currentAskPrice })
                            .eq('id', existingPointToday.id);
                    } else {
                        // Create a new point for the graph
                        const newPriceId = uuidv4();
                        const newPrice = { id: newPriceId, companyId: company.id, priceDate: today, priceValue: company.currentAskPrice };
                        set((state) => ({ historicalPrices: [...state.historicalPrices, newPrice] }));
                        await supabase.from('company_historical_prices').insert([{
                            id: newPriceId,
                            company_id: company.id,
                            price_date: today,
                            price_value: company.currentAskPrice
                        }]);
                    }
                }
            },
            removeCompany: async (id) => {
                set((state) => ({
                    companies: state.companies.filter(c => c.id !== id)
                }));
                await supabase.from('companies').delete().eq('id', id);
            },
            addDematRequest: async (request) => {
                const id = request.id.startsWith('demat_') ? uuidv4() : request.id;
                const newRequest = { ...request, id };
                set((state) => ({ dematRequests: [newRequest, ...state.dematRequests] }));

                await supabase.from('demat_requests').insert([{
                    id,
                    user_id: request.userId,
                    company_name: request.companyName,
                    quantity: request.quantity,
                    certificate_number: request.certificateNumbers,
                    folio_number: request.folioNumber,
                    status: request.status,
                    notes: request.notes || []
                }]);
            },
            updateDematStatus: async (id, status) => {
                set((state) => ({
                    dematRequests: state.dematRequests.map(r => r.id === id ? { ...r, status } : r)
                }));
                await supabase.from('demat_requests').update({ status }).eq('id', id);
            },
            updateRmTarget: (rmId, target) => set((state) => ({
                rmTargets: { ...state.rmTargets, [rmId]: target }
            })),
            addUser: async (user) => {
                const id = user.id.startsWith('usr_') ? uuidv4() : user.id;
                const newUser = { ...user, id };
                set((state) => ({ users: [...state.users, newUser] }));

                await supabase.from('profiles').insert([{
                    id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    assigned_rm_id: user.assignedRmId
                }]);
            },
            addTeam: async (team) => {
                const id = team.id.startsWith('team_') ? uuidv4() : team.id;
                const newTeam = { ...team, id };
                set((state) => ({ teams: [...state.teams, newTeam] }));

                const { error } = await supabase.from('teams').insert([{
                    id,
                    name: team.name,
                    description: team.description,
                    manager_id: team.managerId || null,
                    notes: team.notes || []
                }]);

                if (!error && team.rmIds && team.rmIds.length > 0) {
                    const members = team.rmIds.map(rmId => ({ team_id: id, member_id: rmId }));
                    await supabase.from('team_members').insert(members);
                }
            },
            addTeamNote: async (id, note) => {
                set((state) => ({
                    teams: state.teams.map(t => t.id === id ? { ...t, notes: [...(t.notes || []), note] } : t)
                }));
                const currentTeam = get().teams.find(t => t.id === id);
                if (currentTeam) {
                    await supabase.from('teams').update({ notes: currentTeam.notes }).eq('id', id);
                }
            },
            updateTeam: async (team) => {
                set((state) => ({
                    teams: state.teams.map(t => t.id === team.id ? team : t)
                }));

                await supabase.from('teams').update({
                    name: team.name,
                    description: team.description,
                    manager_id: team.managerId || null
                }).eq('id', team.id);

                // Sync team members (delete all, insert new)
                await supabase.from('team_members').delete().eq('team_id', team.id);
                if (team.rmIds && team.rmIds.length > 0) {
                    const members = team.rmIds.map(rmId => ({ team_id: team.id, member_id: rmId }));
                    await supabase.from('team_members').insert(members);
                }
            },
            removeTeam: async (id) => {
                set((state) => ({
                    teams: state.teams.filter(t => t.id !== id)
                }));
                await supabase.from('teams').delete().eq('id', id);
            },
            addBlog: async (blog) => {
                const id = blog.id.startsWith('blog_') ? uuidv4() : blog.id;
                const newBlog = { ...blog, id };
                set((state) => ({ blogs: [newBlog, ...state.blogs] }));

                await supabase.from('blogs').insert([{
                    id,
                    title: blog.title,
                    slug: blog.slug,
                    content: blog.content,
                    excerpt: blog.excerpt,
                    author_id: blog.authorId,
                    status: blog.status,
                    views: blog.views,
                    published_at: blog.publishedAt,
                    scheduled_at: blog.scheduledAt
                }]);
            },
            updateBlog: async (blog) => {
                set((state) => ({
                    blogs: state.blogs.map(b => b.id === blog.id ? blog : b)
                }));

                await supabase.from('blogs').update({
                    title: blog.title,
                    slug: blog.slug,
                    content: blog.content,
                    excerpt: blog.excerpt,
                    status: blog.status,
                    views: blog.views,
                    published_at: blog.publishedAt,
                    scheduled_at: blog.scheduledAt
                }).eq('id', blog.id);
            },
            removeBlog: async (id) => {
                set((state) => ({
                    blogs: state.blogs.filter(b => b.id !== id)
                }));
                await supabase.from('blogs').delete().eq('id', id);
            },
            incrementBlogViews: async (id) => {
                const blog = get().blogs.find(b => b.id === id);
                if (blog) {
                    const newViews = (blog.views || 0) + 1;
                    set((state) => ({
                        blogs: state.blogs.map(b => b.id === id ? { ...b, views: newViews } : b)
                    }));
                    await supabase.from('blogs').update({ views: newViews }).eq('id', id);
                }
            },
            addHistoricalPrice: async (companyId, date, value) => {
                const id = uuidv4();
                const newPrice = { id, companyId, priceDate: date, priceValue: value };
                set((state) => ({ historicalPrices: [...state.historicalPrices, newPrice] }));

                await supabase.from('company_historical_prices').insert([{
                    id,
                    company_id: companyId,
                    price_date: date,
                    price_value: value
                }]);
            },
            removeHistoricalPrice: async (id) => {
                set((state) => ({
                    historicalPrices: state.historicalPrices.filter(p => p.id !== id)
                }));
                await supabase.from('company_historical_prices').delete().eq('id', id);
            },
            updateHomePageData: (data) => set({ homePageData: data }),
            fetchInitialData: async () => {
                try {
                    // Fetch Profiles (Users)
                    const { data: profiles } = await supabase.from('profiles').select('*');
                    if (profiles && profiles.length > 0) {
                        const parsedUsers = profiles.map(p => ({
                            id: p.id,
                            name: p.name,
                            email: p.email,
                            role: p.role,
                            assignedRmId: p.assigned_rm_id
                        }));
                        set({ users: parsedUsers as unknown as User[] });
                    }

                    // Fetch Companies
                    const { data: companies } = await supabase.from('companies').select('*');
                    if (companies && companies.length > 0) {
                        const parsedCompanies = companies.map(c => ({
                            id: c.id,
                            name: c.name,
                            sector: c.sector,
                            valuation: c.valuation,
                            status: c.status,
                            currentAskPrice: c.current_ask_price,
                            currentBidPrice: c.current_bid_price,
                            description: c.description || '',
                            aiContext: c.ai_context || '',
                            lotSize: c.lot_size,
                            week52High: c.week_52_high,
                            week52Low: c.week_52_low,
                            peRatio: c.pe_ratio,
                            pbRatio: c.pb_ratio,
                            debtToEquity: c.debt_to_equity,
                            roe: c.roe,
                            bookValue: c.book_value,
                            faceValue: c.face_value,
                            totalShares: c.total_shares,
                            isin: c.isin,
                            panNumber: c.pan_number,
                            cin: c.cin,
                            depository: c.depository,
                            rta: c.rta,
                            marketCap: c.market_cap,
                            category: c.category,
                            change: c.change,
                            positive: c.positive,
                            minInvest: c.min_invest,
                            img: c.img,
                            imgAlt: c.img_alt,
                            isFeatured: c.is_featured,
                        }));
                        set({ companies: parsedCompanies as Company[] });
                    }

                    // Fetch Company Financials
                    const { data: financialsData } = await supabase.from('company_financials')
                        .select('*')
                        .order('fiscal_year', { ascending: true });
                    if (financialsData && financialsData.length > 0) {
                        const parsedFinancials = financialsData.map(f => ({
                            id: f.id,
                            companyId: f.company_id,
                            fiscalYear: f.fiscal_year,
                            revenue: f.revenue,
                            costOfMaterial: f.cost_of_material,
                            changeInInventory: f.change_in_inventory,
                            grossMargins: f.gross_margins,
                            employeeExpenses: f.employee_expenses,
                            otherExpenses: f.other_expenses,
                            ebitda: f.ebitda,
                            opm: f.opm,
                            otherIncome: f.other_income,
                            financeCost: f.finance_cost,
                            depreciation: f.depreciation,
                            ebit: f.ebit,
                            ebitMargins: f.ebit_margins,
                            pbt: f.pbt,
                            pbtMargins: f.pbt_margins,
                            tax: f.tax,
                            pat: f.pat,
                            npm: f.npm,
                            eps: f.eps,
                            fixedAssets: f.fixed_assets,
                            cwip: f.cwip,
                            investments: f.investments,
                            tradeReceivables: f.trade_receivables,
                            inventory: f.inventory,
                            otherAssets: f.other_assets,
                            totalAssets: f.total_assets,
                            shareCapital: f.share_capital,
                            reserves: f.reserves,
                            borrowings: f.borrowings,
                            tradePayables: f.trade_payables,
                            otherLiabilities: f.other_liabilities,
                            totalLiabilities: f.total_liabilities,
                            pbtCashflow: f.pbt_cashflow,
                            workingCapitalChange: f.working_capital_change,
                            cashFromOperations: f.cash_from_operations,
                            purchaseOfPpe: f.purchase_of_ppe,
                            cashFromInvestment: f.cash_from_investment,
                        }));
                        set({ companyFinancials: parsedFinancials as CompanyFinancial[] });
                    }

                    // Fetch Teams
                    const { data: teamsData } = await supabase.from('teams').select(`
                        id, name, description, manager_id, notes,
                        team_members ( member_id )
                    `);

                    if (teamsData && teamsData.length > 0) {
                        const parsedTeams = teamsData.map(t => ({
                            id: t.id,
                            name: t.name,
                            description: t.description || '',
                            managerId: t.manager_id || undefined,
                            notes: t.notes || [],
                            rmIds: t.team_members ? t.team_members.map((tm: any) => tm.member_id) : []
                        }));
                        set({ teams: parsedTeams as Team[] });
                    }

                    // Fetch Blogs
                    const { data: blogsData } = await supabase.from('blogs').select('*');
                    if (blogsData && blogsData.length > 0) {
                        const parsedBlogs = blogsData.map(b => ({
                            id: b.id,
                            title: b.title,
                            slug: b.slug,
                            content: b.content,
                            excerpt: b.excerpt,
                            authorId: b.author_id,
                            status: b.status,
                            views: b.views,
                            createdAt: b.created_at,
                            publishedAt: b.published_at
                        }));
                        set({ blogs: parsedBlogs as any[] });
                    } else {
                        // Fallback to MOCK_BLOGS if DB is empty
                        set({ blogs: MOCK_BLOGS as any[] });
                    }
                    // Fetch Orders
                    const { data: ordersData } = await supabase.from('orders').select('*, companies(name)');
                    if (ordersData && ordersData.length > 0) {
                        const parsedOrders = ordersData.map(o => ({
                            id: o.id,
                            companyId: o.company_id,
                            userId: o.user_id,
                            quantity: o.quantity,
                            price: o.price,
                            totalAmount: o.total_amount,
                            status: o.status,
                            createdAt: o.created_at,
                            type: o.type,
                            paymentMethod: o.payment_method,
                            txProofUrl: o.tx_proof_url,
                            deliveryDetails: o.delivery_details,
                            companyName: o.companies?.name || 'Unknown',
                            notes: o.notes || []
                        }));
                        set({ orders: parsedOrders as ExtendedOrder[] });
                    }

                    // Fetch Leads
                    const { data: leadsData } = await supabase.from('leads').select('*, companies(name)');
                    if (leadsData && leadsData.length > 0) {
                        const parsedLeads = leadsData.map(l => ({
                            id: l.id,
                            name: l.name,
                            email: l.email || '',
                            phone: l.phone,
                            companyId: l.company_id,
                            quantity: l.quantity,
                            price: l.price,
                            status: l.status,
                            assignedRmId: l.assigned_rm_id,
                            kycStatus: l.kyc_status || 'pending',
                            onboardingToken: l.onboarding_token,
                            notes: l.notes || [],
                            companyName: l.companies?.name || 'Unknown',
                            createdAt: l.created_at
                        }));
                        set({ leads: parsedLeads as Lead[] });
                    }

                    // Fetch Historical Prices
                    const { data: historicalData } = await supabase.from('company_historical_prices')
                        .select('*')
                        .order('price_date', { ascending: true });
                    if (historicalData && historicalData.length > 0) {
                        const parsedPrices = historicalData.map(hp => ({
                            id: hp.id,
                            companyId: hp.company_id,
                            priceDate: hp.price_date,
                            priceValue: hp.price_value
                        }));
                        set({ historicalPrices: parsedPrices as HistoricalPrice[] });

                        // Auto-compute change % from historical prices
                        const currentCompanies = get().companies;
                        if (currentCompanies.length > 0) {
                            const updatedCompanies = currentCompanies.map(company => {
                                const companyPrices = parsedPrices
                                    .filter(p => p.companyId === company.id)
                                    .sort((a, b) => a.priceDate.localeCompare(b.priceDate));
                                if (companyPrices.length >= 2) {
                                    const previousPrice = companyPrices[companyPrices.length - 2].priceValue;
                                    const currentPrice = company.currentAskPrice || companyPrices[companyPrices.length - 1].priceValue;
                                    if (previousPrice > 0) {
                                        const changePct = ((currentPrice - previousPrice) / previousPrice) * 100;
                                        return { ...company, change: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`, positive: changePct >= 0 };
                                    }
                                } else if (companyPrices.length === 1) {
                                    const previousPrice = companyPrices[0].priceValue;
                                    const currentPrice = company.currentAskPrice;
                                    if (previousPrice > 0 && currentPrice !== previousPrice) {
                                        const changePct = ((currentPrice - previousPrice) / previousPrice) * 100;
                                        return { ...company, change: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`, positive: changePct >= 0 };
                                    }
                                }
                                return company;
                            });
                            set({ companies: updatedCompanies as Company[] });
                        }
                    }
                } catch (error) {
                    console.error('Error fetching initial data from Supabase:', error);
                }
            }
        }),
        {
            name: 'sharesaathi-storage',
            version: 6, // bump for manager features
            partialize: (state) => ({
                orders: state.orders,
                leads: state.leads,
                companies: state.companies,
                historicalPrices: state.historicalPrices,
                companyFinancials: state.companyFinancials,
                dematRequests: state.dematRequests,
                rmTargets: state.rmTargets,
                users: state.users,
                teams: state.teams,
                blogs: state.blogs,
                homePageData: state.homePageData,
                theme: state.theme,
                language: state.language,
                tickets: state.tickets,
                rmActivities: state.rmActivities,
                commissions: state.commissions,
                broadcasts: state.broadcasts,
                auditLog: state.auditLog,
                calendarEvents: state.calendarEvents,
                onboardingTasks: state.onboardingTasks,
                rmGoals: state.rmGoals,
            })
        }
    )
);

// Realtime subscription: sync company price changes across all clients
supabase
    .channel('companies-price-sync')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'companies' }, (payload) => {
        const c = payload.new as any;
        useAppStore.setState((state) => ({
            companies: state.companies.map(existing =>
                existing.id === c.id
                    ? {
                        ...existing,
                        currentAskPrice: c.current_ask_price,
                        currentBidPrice: c.current_bid_price,
                        name: c.name,
                        sector: c.sector,
                        valuation: c.valuation,
                        status: c.status,
                        description: c.description || '',
                        aiContext: c.ai_context || '',
                        category: c.category,
                        change: c.change,
                        positive: c.positive,
                        minInvest: c.min_invest,
                        img: c.img,
                        imgAlt: c.img_alt,
                        isFeatured: c.is_featured,
                    }
                    : existing
            )
        }));
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'companies' }, (payload) => {
        const c = payload.new as any;
        const newCompany: Company = {
            id: c.id,
            name: c.name,
            sector: c.sector,
            valuation: c.valuation,
            status: c.status,
            currentAskPrice: c.current_ask_price,
            currentBidPrice: c.current_bid_price,
            description: c.description || '',
            aiContext: c.ai_context || '',
            category: c.category,
            change: c.change,
            positive: c.positive,
            minInvest: c.min_invest,
            img: c.img,
            imgAlt: c.img_alt,
            isFeatured: c.is_featured,
        } as Company;
        useAppStore.setState((state) => {
            if (state.companies.some(existing => existing.id === c.id)) return state;
            return { companies: [...state.companies, newCompany] };
        });
    })
    .subscribe();
