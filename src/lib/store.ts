import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { MOCK_ORDERS, MOCK_LEADS, Lead, MOCK_COMPANIES, Company, MOCK_USERS, MOCK_BLOGS } from './mock-data';
import { UserRole } from './auth-context';
import { supabase } from './supabase';

export type OrderStatus = 'requested' | 'under_process' | 'mail_sent' | 'in_holding';
export type DematStatus = 'initiated' | 'under_process' | 'completed';

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
    status: 'draft' | 'published';
    views: number;
    createdAt: string;
    publishedAt?: string;
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
    rmTargets: Record<string, number>;
    fetchInitialData: () => Promise<void>;
}

// Map existing mock orders to new structure
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
            historicalPrices: [],
            rmTargets: {
                'sls_1': 6000000,
                'sls_2': 8000000
            },
            addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
            updateOrderStatus: (id, status, deliveryDetails, txProofUrl) => {
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

                // Auto move mail_sent to in_holding after 5 minutes
                if (status === 'mail_sent') {
                    setTimeout(() => {
                        set((state) => ({
                            orders: state.orders.map(o =>
                                (o.id === id && o.status === 'mail_sent') ? { ...o, status: 'in_holding' } : o
                            )
                        }));
                    }, 5 * 60 * 1000);
                }
            },
            addOrderNote: (id, note) => set((state) => ({
                orders: state.orders.map(o => o.id === id ? { ...o, notes: [...o.notes, note] } : o)
            })),
            addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
            addLeadNote: (id, note) => set((state) => ({
                leads: state.leads.map(l => l.id === id ? { ...l, notes: [...l.notes, note] } : l)
            })),
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
                    ai_context: company.aiContext || ''
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
                    ai_context: company.aiContext || ''
                }).eq('id', company.id);
            },
            removeCompany: async (id) => {
                set((state) => ({
                    companies: state.companies.filter(c => c.id !== id)
                }));
                await supabase.from('companies').delete().eq('id', id);
            },
            addDematRequest: (request) => set((state) => ({
                dematRequests: [request, ...state.dematRequests]
            })),
            updateDematStatus: (id, status) => set((state) => ({
                dematRequests: state.dematRequests.map(r => r.id === id ? { ...r, status } : r)
            })),
            updateLead: (lead) => set((state) => ({
                leads: state.leads.map(l => l.id === lead.id ? lead : l)
            })),
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
                    published_at: blog.publishedAt
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
                    published_at: blog.publishedAt
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
                            aiContext: c.ai_context || ''
                        }));
                        set({ companies: parsedCompanies as Company[] });
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
                    // Fetch Historical Prices
                    const { data: historicalData } = await supabase.from('company_historical_prices').select('*').order('price_date', { ascending: true });
                    if (historicalData) {
                        const parsedPrices = historicalData.map(hp => ({
                            id: hp.id,
                            companyId: hp.company_id,
                            priceDate: hp.price_date,
                            priceValue: hp.price_value
                        }));
                        set({ historicalPrices: parsedPrices as HistoricalPrice[] });
                    }
                } catch (error) {
                    console.error('Error fetching initial data from Supabase:', error);
                }
            }
        }),
        {
            name: 'sharesaathi-storage',
            partialize: (state) => ({
                orders: state.orders,
                leads: state.leads,
                companies: state.companies,
                dematRequests: state.dematRequests,
                rmTargets: state.rmTargets,
                users: state.users,
                teams: state.teams,
                blogs: state.blogs,
                historicalPrices: state.historicalPrices
            })
        }
    )
);
