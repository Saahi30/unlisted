"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAppStore, User, Team } from '@/lib/store';
import { Company } from '@/lib/mock-data';
import { UserRole } from '@/lib/auth-context';
import AgentKycTab from '@/components/admin/AgentKycTab';
import AgentSettingsConfig from '@/components/admin/AgentSettingsConfig';
import AgentPayoutsTab from '@/components/admin/AgentPayoutsTab';
import CustomerKycTab from '@/components/admin/CustomerKycTab';
import FeedbackTab from '@/components/admin/FeedbackTab';
import OrderManagementTab from '@/components/admin/OrderManagementTab';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import NotificationManagementTab from '@/components/admin/NotificationManagementTab';
import LeadManagementTab from '@/components/admin/LeadManagementTab';
import RmTargetTrackingTab from '@/components/admin/RmTargetTrackingTab';
import AuditLogTab from '@/components/admin/AuditLogTab';
import PriceHistoryCharts from '@/components/admin/PriceHistoryCharts';
import AgentPerformanceTab from '@/components/admin/AgentPerformanceTab';
import MarketIntelTab from '@/components/admin/MarketIntelTab';
import MutualFundInterestsTab from '@/components/admin/MutualFundInterestsTab';

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        }>
            <AdminDashboardContent />
        </Suspense>
    );
}

function AdminDashboardContent() {
    const { 
        orders, updateOrderStatus, 
        companies, addCompany, updateCompany, removeCompany, 
        users, teams, addUser, addTeam, updateTeam, removeTeam, addTeamNote, 
        blogs, addBlog, updateBlog, removeBlog,
        dematRequests, updateDematStatus,
        homePageData, updateHomePageData
    } = useAppStore();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users' | 'teams' | 'blogs' | 'settings' | 'agents' | 'demat' | 'customer_kyc' | 'feedback' | 'analytics' | 'orders' | 'notifications' | 'leads' | 'rm_targets' | 'audit_log' | 'price_history' | 'agent_performance' | 'market_intel' | 'mf_interests'>('overview');

    useEffect(() => {
        const tab = searchParams.get('tab');
        const validTabs = ['overview', 'companies', 'users', 'teams', 'blogs', 'settings', 'agents', 'demat', 'customer_kyc', 'feedback', 'analytics', 'orders', 'notifications', 'leads', 'rm_targets', 'audit_log', 'price_history', 'agent_performance', 'market_intel', 'mf_interests'];
        if (tab && validTabs.includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [isAddMode, setIsAddMode] = useState(false);

    const [formValues, setFormValues] = useState<Partial<Company>>({});
    const [companyDetails, setCompanyDetails] = useState({ overview: '', financials: '', funding: '', faq: '' });

    // Delivery confirmation state for admin overrides
    const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null);
    const [deliveryDetails, setDeliveryDetails] = useState({
        isin: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        declared: false
    });

    // User creation state
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
    const [userFormValues, setUserFormValues] = useState<Partial<User>>({
        role: 'rm'
    });

    // Team creation state
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [teamFormValues, setTeamFormValues] = useState<Partial<Team>>({
        rmIds: []
    });
    // Team detail state
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    // User directory search & filter state
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');

    // Company search & filter state
    const [companySearchQuery, setCompanySearchQuery] = useState('');
    const [companySectorFilter, setCompanySectorFilter] = useState('all');

    // Blog search & filter state
    const [blogSearchQuery, setBlogSearchQuery] = useState('');
    const [blogStatusFilter, setBlogStatusFilter] = useState<'all' | 'draft' | 'published'>('all');

    // Order search & filter state (overview)
    const [orderSearchQuery, setOrderSearchQuery] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | string>('all');

    // Pagination state
    const [companyPage, setCompanyPage] = useState(1);
    const [userPage, setUserPage] = useState(1);
    const [blogPage, setBlogPage] = useState(1);
    const [orderPage, setOrderPage] = useState(1);
    const PAGE_SIZE = 20;

    // Blog management state
    const [editingBlog, setEditingBlog] = useState<any | null>(null);
    const [isBlogAddMode, setIsBlogAddMode] = useState(false);
    const [blogFormValues, setBlogFormValues] = useState<any>({});
    const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
    const [aiBlogPrompt, setAiBlogPrompt] = useState({ topic: '', keywords: '', referenceText: '', length: '500', creativity: 0.6 });

    // Historical prices management
    const { historicalPrices, addHistoricalPrice, removeHistoricalPrice } = useAppStore();
    const [managingPricesForCompanyId, setManagingPricesForCompanyId] = useState<string | null>(null);
    const [priceEntry, setPriceEntry] = useState({ date: new Date().toISOString().split('T')[0], value: 0 });

    const settledVal = orders.filter(o => o.status === 'in_holding').reduce((sum, o) => sum + o.totalAmount, 0);

    const openEdit = (comp: Company) => {
        setIsAddMode(false);
        setEditingCompany(comp);
        setFormValues({ ...comp });
        let details = { overview: comp.description || '', financials: '', funding: '', faq: '' };
        if (comp.aiContext) {
            try { 
                const parsed = JSON.parse(comp.aiContext);
                if (typeof parsed === 'object') details = { ...details, ...parsed };
            } catch (e) {
                details.overview = comp.aiContext;
            }
        }
        setCompanyDetails(details);
    };

    const openAdd = () => {
        setIsAddMode(true);
        setEditingCompany({ id: `comp_${Date.now()}` } as Company);
        setFormValues({
            name: '',
            sector: '',
            valuation: 0,
            status: 'series_a',
            currentAskPrice: 0,
            description: '',
            aiContext: '',
            isFeatured: false,
            category: '',
            minInvest: '₹50,000'
        });
        setCompanyDetails({ overview: '', financials: '', funding: '', faq: '' });
    };

    const handleSave = () => {
        if (!editingCompany) return;

        if (isAddMode) {
            const newCompany: Company = {
                id: editingCompany.id,
                name: formValues.name || 'New Company',
                sector: formValues.sector || 'Various',
                valuation: formValues.valuation || 0,
                status: formValues.status || 'series_a',
                currentAskPrice: formValues.currentAskPrice || 0,
                currentBidPrice: (formValues.currentAskPrice || 0) * 0.95,
                description: formValues.description || '',
                aiContext: JSON.stringify(companyDetails),
                isFeatured: formValues.isFeatured || false,
                category: formValues.category || '',
                change: formValues.change || '+0%',
                positive: formValues.positive ?? true,
                minInvest: formValues.minInvest || '₹50,000',
                img: formValues.img,
                imgAlt: formValues.imgAlt
            };
            addCompany(newCompany);
        } else {
            updateCompany({ ...editingCompany, ...formValues, aiContext: JSON.stringify(companyDetails) } as Company);
        }
        setEditingCompany(null);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to remove this listing?")) {
            removeCompany(id);
        }
    };

    const handleCreateUser = () => {
        if (!userFormValues.name || !userFormValues.email) {
            alert("Name and Email are required.");
            return;
        }
        const newUser: User = {
            id: `usr_${Date.now()}`,
            name: userFormValues.name,
            email: userFormValues.email,
            role: userFormValues.role as UserRole
        };
        addUser(newUser);
        setIsCreateUserModalOpen(false);
        setUserFormValues({ role: 'rm' });
    };

    const handleCreateTeam = () => {
        if (!teamFormValues.name) {
            alert("Team Name is required.");
            return;
        }
        const newTeam: Team = {
            id: `team_${Date.now()}`,
            name: teamFormValues.name,
            description: teamFormValues.description || '',
            rmIds: teamFormValues.rmIds || [],
            managerId: teamFormValues.managerId,
            notes: []
        };
        addTeam(newTeam);
        setIsCreateTeamModalOpen(false);
        setTeamFormValues({ rmIds: [] });
    };

    const handlePromoteToMailSent = () => {
        if (!deliveryOrderId) return;
        if (!deliveryDetails.declared) {
            alert('You must declare that the shares have been transferred.');
            return;
        }
        updateOrderStatus(deliveryOrderId, 'mail_sent', deliveryDetails);
        setDeliveryOrderId(null);
        setDeliveryDetails({
            isin: '',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0].substring(0, 5),
            declared: false
        });
    };

    const openBlogEdit = (blog: any) => {
        setIsBlogAddMode(false);
        setEditingBlog(blog);
        setBlogFormValues({ ...blog });
    };

    const openBlogAdd = () => {
        setIsBlogAddMode(true);
        setEditingBlog({ id: `blog_${Date.now()}` });
        setBlogFormValues({
            title: '',
            slug: '',
            content: '',
            excerpt: '',
            status: 'draft',
            views: 0
        });
        setAiBlogPrompt({ topic: '', keywords: '', referenceText: '', length: '500', creativity: 0.6 });
    };

    const handleAiGenerateBlog = async () => {
        if (!aiBlogPrompt.topic) return;
        setIsGeneratingBlog(true);
        try {
            const res = await fetch('/api/admin/generate-blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiBlogPrompt)
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setBlogFormValues({
                ...blogFormValues,
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt,
                content: data.content
            });
        } catch (err: any) {
            alert("Generation failed: " + err.message);
        } finally {
            setIsGeneratingBlog(false);
        }
    };

    const handleBlogSave = () => {
        if (!editingBlog) return;

        const blogData = {
            ...editingBlog,
            ...blogFormValues,
            slug: blogFormValues.slug || blogFormValues.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
            authorId: users.find(u => u.role === 'admin')?.id || 'admin-id', // Fallback
            createdAt: editingBlog.createdAt || new Date().toISOString(),
            publishedAt: blogFormValues.status === 'published' ? (editingBlog.publishedAt || new Date().toISOString()) : null,
            scheduledAt: blogFormValues.status === 'scheduled' ? blogFormValues.scheduledAt : null
        };

        if (isBlogAddMode) {
            addBlog(blogData);
        } else {
            updateBlog(blogData);
        }
        setEditingBlog(null);
    };

    const handleBlogDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this blog post?")) {
            removeBlog(id);
        }
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 relative">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-display font-light tracking-tight text-foreground">
                        {{ overview: 'Platform Overview', companies: 'Company Listings', users: 'User Directory', teams: 'Team Management', blogs: 'Blog Posts', agents: 'Agent Onboarding', customer_kyc: 'Customer KYC', feedback: 'Customer Feedback', settings: 'Portal Settings', orders: 'Order Management', analytics: 'Analytics Dashboard', notifications: 'Notifications', leads: 'Lead Pipeline', rm_targets: 'RM Targets', audit_log: 'Audit Log', price_history: 'Price History', agent_performance: 'Agent Performance', demat: 'Demat Requests', market_intel: 'Market Intelligence', mf_interests: 'MF Interests'}[activeTab]}
                    </h1>
                    <p className="text-muted mt-1">
                        {{ overview: 'Manage platform metrics and global orders.', companies: 'Add, edit or remove companies from the marketplace.', users: 'Manage platform access and user roles.', teams: 'Create teams and assign Relationship Managers.', blogs: 'Create, edit and publish articles for customers.', agents: 'Review and manage Partner Agent KYC submissions.', settings: 'Configure global parameters and Home Page CMS.', orders: 'Process orders, update statuses, and manage the transaction pipeline.', analytics: 'Revenue trends, conversion rates, and performance metrics.', notifications: 'Send and manage notifications to platform users.', leads: 'Bird\'s-eye view of the entire lead pipeline.', rm_targets: 'Set and track RM sales targets vs. quota.', audit_log: 'Track all admin actions for compliance.', price_history: 'Visualize and manage company price history data.', agent_performance: 'Agent-wise performance, earnings, and conversion rates.', customer_kyc: 'Review and approve customer KYC submissions.', feedback: 'View and manage customer feedback.', demat: 'Process dematerialization requests.', market_intel: 'AI-powered news, IPO scores, and earnings data via Claude research.', mf_interests: 'Track and manage mutual fund interest submissions.' }[activeTab]}
                    </p>
                </div>
                {(activeTab === 'overview' || activeTab === 'companies') && (
                    <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 text-white rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-md shadow-primary/20">
                        <Icon name="PlusIcon" size={16} className="mr-2" />
                        Add Company
                    </Button>
                )}
                {activeTab === 'users' && (
                    <Button onClick={() => setIsCreateUserModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-md shadow-primary/20">
                        <Icon name="UserPlusIcon" size={16} className="mr-2" />
                        Create Account
                    </Button>
                )}
                {activeTab === 'teams' && (
                    <Button onClick={() => setIsCreateTeamModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-md shadow-primary/20">
                        <Icon name="PlusIcon" size={16} className="mr-2" />
                        Create Team
                    </Button>
                )}
                {activeTab === 'blogs' && (
                    <Button onClick={openBlogAdd} className="bg-primary hover:bg-primary/90 text-white rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-md shadow-primary/20">
                        <Icon name="PlusIcon" size={16} className="mr-2" />
                        Create Article
                    </Button>
                )}
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
                        <Card className="border-border shadow-sm group cursor-pointer hover:border-primary/30 transition-all" onClick={() => router.push('?tab=users')}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-surface text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Icon name="UsersIcon" size={20} />
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-muted mb-1">Total Platform Users</div>
                                <div className="text-2xl font-bold text-foreground">{users.length}</div>
                                <p className="text-xs text-green-600 mt-2 flex items-center font-medium">
                                    <Icon name="ArrowTrendingUpIcon" size={12} className="mr-1" />
                                    Live Data
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm group cursor-pointer hover:border-primary/30 transition-all" onClick={() => router.push('?tab=teams')}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-surface text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Icon name="UserGroupIcon" size={20} />
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-muted mb-1">Active Teams</div>
                                <div className="text-2xl font-bold text-foreground">{teams.length}</div>
                                <p className="text-xs text-muted mt-2">RM Squads</p>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm group">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-surface text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Icon name="BanknotesIcon" size={20} />
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-muted mb-1">Total AUM Settled</div>
                                <div className="text-2xl font-bold text-foreground">₹{(settledVal + 15000000).toLocaleString()}</div>
                                <p className="text-xs text-green-600 mt-2 flex items-center font-medium">
                                    <Icon name="ArrowTrendingUpIcon" size={12} className="mr-1" />
                                    +5% this week
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm group cursor-pointer hover:border-primary/30 transition-all" onClick={() => router.push('?tab=agents')}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
                                        <Icon name="IdentificationIcon" size={20} />
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-muted mb-1">Partner Agents</div>
                                <div className="text-2xl font-bold text-amber-600">KYC</div>
                                <p className="text-xs text-muted mt-2">Manage sub-brokers</p>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm group cursor-pointer hover:border-primary/30 transition-all" onClick={() => router.push('?tab=companies')}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-surface text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Icon name="BuildingOfficeIcon" size={20} />
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-muted mb-1">Active Listings</div>
                                <div className="text-2xl font-bold text-foreground">{companies.length}</div>
                                <p className="text-xs text-muted mt-2">Companies available</p>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm group cursor-pointer hover:border-primary/30 transition-all" onClick={() => router.push('?tab=settings')}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Icon name="SparklesIcon" size={20} />
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-muted mb-1">Home Page CMS</div>
                                <div className="text-2xl font-bold text-foreground">Edit</div>
                                <p className="text-xs text-muted mt-2">Hero & Stats</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Navigation to New Features */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
                        <button onClick={() => router.push('?tab=analytics')} className="p-3 rounded-xl border border-border bg-white hover:border-primary/30 transition-all text-left group">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon name="ChartBarIcon" size={16} className="text-primary" />
                                <span className="text-xs font-bold text-foreground">Analytics</span>
                            </div>
                            <span className="text-[10px] text-muted">Revenue & trends</span>
                        </button>
                        <button onClick={() => router.push('?tab=orders')} className="p-3 rounded-xl border border-border bg-white hover:border-primary/30 transition-all text-left group">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon name="ClipboardDocumentListIcon" size={16} className="text-blue-600" />
                                <span className="text-xs font-bold text-foreground">Orders</span>
                            </div>
                            <span className="text-[10px] text-muted">{orders.length} total</span>
                        </button>
                        <button onClick={() => router.push('?tab=leads')} className="p-3 rounded-xl border border-border bg-white hover:border-primary/30 transition-all text-left group">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon name="FunnelIcon" size={16} className="text-purple-600" />
                                <span className="text-xs font-bold text-foreground">Leads</span>
                            </div>
                            <span className="text-[10px] text-muted">Pipeline view</span>
                        </button>
                        <button onClick={() => router.push('?tab=rm_targets')} className="p-3 rounded-xl border border-border bg-white hover:border-primary/30 transition-all text-left group">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon name="FlagIcon" size={16} className="text-green-600" />
                                <span className="text-xs font-bold text-foreground">RM Targets</span>
                            </div>
                            <span className="text-[10px] text-muted">Quota tracking</span>
                        </button>
                        <button onClick={() => router.push('?tab=notifications')} className="p-3 rounded-xl border border-border bg-white hover:border-primary/30 transition-all text-left group">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon name="BellIcon" size={16} className="text-amber-600" />
                                <span className="text-xs font-bold text-foreground">Notifications</span>
                            </div>
                            <span className="text-[10px] text-muted">Send & manage</span>
                        </button>
                        <button onClick={() => router.push('?tab=audit_log')} className="p-3 rounded-xl border border-border bg-white hover:border-primary/30 transition-all text-left group">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon name="ShieldCheckIcon" size={16} className="text-slate-600" />
                                <span className="text-xs font-bold text-foreground">Audit Log</span>
                            </div>
                            <span className="text-[10px] text-muted">Compliance trail</span>
                        </button>
                    </div>

                    {(() => {
                        const filteredOrders = orders.filter(o => {
                            const matchesSearch = o.companyName.toLowerCase().includes(orderSearchQuery.toLowerCase()) || o.userId.toLowerCase().includes(orderSearchQuery.toLowerCase());
                            const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                            return matchesSearch && matchesStatus;
                        });
                        const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
                        const paginatedOrders = filteredOrders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE);
                        return (
                    <Card className="border-border shadow-sm mb-10">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                            <div>
                                <CardTitle className="font-display font-medium text-lg">Global Transactions</CardTitle>
                                <CardDescription className="text-muted">Monitor all platform deal flow across all Relationship Managers.</CardDescription>
                            </div>
                        </CardHeader>
                        <div className="p-4 border-b border-border bg-surface/20 flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1">
                                <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <Input placeholder="Search by company or user..." className="pl-10 h-10 border-border bg-white" value={orderSearchQuery} onChange={e => { setOrderSearchQuery(e.target.value); setOrderPage(1); }} />
                            </div>
                            <select className="h-10 px-3 bg-white border border-border rounded-lg text-xs font-semibold focus:ring-1 focus:ring-primary outline-none" value={orderStatusFilter} onChange={e => { setOrderStatusFilter(e.target.value); setOrderPage(1); }}>
                                <option value="all">ALL STATUS</option>
                                <option value="requested">REQUESTED</option>
                                <option value="under_process">UNDER PROCESS</option>
                                <option value="mail_sent">MAIL SENT</option>
                                <option value="in_holding">IN HOLDING</option>
                            </select>
                        </div>
                        <CardContent className="p-0 bg-white">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-surface/50 hover:bg-surface/50">
                                            <TableHead className="text-muted font-semibold pl-6">Company</TableHead>
                                            <TableHead className="text-muted font-semibold">User ID</TableHead>
                                            <TableHead className="text-muted font-semibold">Qty</TableHead>
                                            <TableHead className="text-muted font-semibold">Amount</TableHead>
                                            <TableHead className="text-muted font-semibold">Status</TableHead>
                                            <TableHead className="text-right text-muted font-semibold pr-6">Override</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedOrders.map(order => (
                                            <TableRow key={order.id} className="border-border hover:bg-surface/30">
                                                <TableCell className="font-medium text-foreground pl-6">{order.companyName}</TableCell>
                                                <TableCell className="text-muted whitespace-nowrap">{order.userId}</TableCell>
                                                <TableCell className="font-medium whitespace-nowrap">{order.quantity} Shares</TableCell>
                                                <TableCell className="font-semibold whitespace-nowrap">₹{order.totalAmount.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${order.status === 'requested' ? 'bg-amber-50 text-amber-600' :
                                                        order.status === 'under_process' || order.status === 'mail_sent' ? 'bg-blue-50 text-blue-600' :
                                                            'bg-green-50 text-green-600'}`}>
                                                        {order.status.replace('_', ' ')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    {order.status === 'under_process' && (
                                                        <Button
                                                            size="sm"
                                                            className="text-xs font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 text-white whitespace-nowrap"
                                                            onClick={() => setDeliveryOrderId(order.id)}
                                                        >
                                                            Fulfill Delivery
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {totalOrderPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface/20">
                                    <span className="text-xs text-muted">{filteredOrders.length} orders</span>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" disabled={orderPage <= 1} onClick={() => setOrderPage(p => p - 1)}>Previous</Button>
                                        <span className="text-xs text-muted">Page {orderPage} of {totalOrderPages}</span>
                                        <Button variant="outline" size="sm" disabled={orderPage >= totalOrderPages} onClick={() => setOrderPage(p => p + 1)}>Next</Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                        );
                    })()}
                </>
            )}

            {activeTab === 'companies' && (() => {
                const sectors = Array.from(new Set(companies.map(c => c.sector)));
                const filteredCompanies = companies.filter(c => {
                    const matchesSearch = c.name.toLowerCase().includes(companySearchQuery.toLowerCase()) || c.sector.toLowerCase().includes(companySearchQuery.toLowerCase());
                    const matchesSector = companySectorFilter === 'all' || c.sector === companySectorFilter;
                    return matchesSearch && matchesSector;
                });
                const totalCompanyPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));
                const paginatedCompanies = filteredCompanies.slice((companyPage - 1) * PAGE_SIZE, companyPage * PAGE_SIZE);
                return (
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                        <div>
                            <CardTitle className="font-display font-medium text-lg">Company Management</CardTitle>
                            <CardDescription className="text-muted">Manage active listings, current prices, and funding updates.</CardDescription>
                        </div>
                    </CardHeader>
                    <div className="p-4 border-b border-border bg-surface/20 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1">
                            <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <Input placeholder="Search by name or sector..." className="pl-10 h-10 border-border bg-white" value={companySearchQuery} onChange={e => { setCompanySearchQuery(e.target.value); setCompanyPage(1); }} />
                        </div>
                        <select className="h-10 px-3 bg-white border border-border rounded-lg text-xs font-semibold focus:ring-1 focus:ring-primary outline-none" value={companySectorFilter} onChange={e => { setCompanySectorFilter(e.target.value); setCompanyPage(1); }}>
                            <option value="all">ALL SECTORS</option>
                            {sectors.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <CardContent className="p-0 bg-white">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="text-muted font-semibold pl-6">Company</TableHead>
                                        <TableHead className="text-muted font-semibold">Sector</TableHead>
                                        <TableHead className="text-muted font-semibold">Status</TableHead>
                                        <TableHead className="text-muted font-semibold">Featured</TableHead>
                                        <TableHead className="text-muted font-semibold">Ask Price</TableHead>
                                        <TableHead className="text-right text-muted font-semibold pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedCompanies.map(company => (
                                        <TableRow key={company.id} className="border-border hover:bg-surface/30">
                                            <TableCell className="font-medium text-foreground pl-6">{company.name}</TableCell>
                                            <TableCell className="text-muted">{company.sector}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-primary/5 text-primary border border-primary/10 tracking-wide uppercase">
                                                    {company.status.replace('_', ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {company.isFeatured ? (
                                                    <span className="flex items-center text-amber-500 gap-1 text-[10px] font-bold uppercase">
                                                        <Icon name="StarIcon" size={12} variant="solid" /> Yes
                                                    </span>
                                                ) : (
                                                    <span className="text-muted text-[10px] font-bold uppercase">No</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-semibold">₹{company.currentAskPrice.toLocaleString()}</TableCell>
                                            <TableCell className="text-right pr-6 whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:text-primary hover:bg-primary/10 transition-colors uppercase tracking-widest text-[10px] font-bold mr-1"
                                                    onClick={() => setManagingPricesForCompanyId(company.id)}
                                                >
                                                    Price History
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-accent hover:text-accent hover:bg-accent/10 transition-colors uppercase tracking-widest text-[10px] font-bold mr-1"
                                                    onClick={() => openEdit(company)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors uppercase tracking-widest text-[10px] font-bold"
                                                    onClick={() => handleDelete(company.id)}
                                                >
                                                    Remove
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {totalCompanyPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface/20">
                                <span className="text-xs text-muted">{filteredCompanies.length} companies</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled={companyPage <= 1} onClick={() => setCompanyPage(p => p - 1)}>Previous</Button>
                                    <span className="text-xs text-muted">Page {companyPage} of {totalCompanyPages}</span>
                                    <Button variant="outline" size="sm" disabled={companyPage >= totalCompanyPages} onClick={() => setCompanyPage(p => p + 1)}>Next</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                );
            })()}

            {activeTab === 'users' && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                        <div>
                            <CardTitle className="font-display font-medium text-lg">Global User Directory</CardTitle>
                            <CardDescription className="text-muted">Manage all platform users, their roles, and system access.</CardDescription>
                        </div>
                    </CardHeader>
                    <div className="p-4 border-b border-border bg-surface/20 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1">
                            <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-10 h-10 border-border bg-white"
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted uppercase tracking-widest whitespace-nowrap">Filter Role:</span>
                            <select
                                className="h-10 px-3 bg-white border border-border rounded-lg text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                                value={userRoleFilter}
                                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                            >
                                <option value="all">ALL ROLES</option>
                                <option value="admin">ADMIN</option>
                                <option value="staffmanager">STAFF MANAGER</option>
                                <option value="rm">RELATIONSHIP MANAGER</option>
                                <option value="customer">CUSTOMER</option>
                            </select>
                        </div>
                    </div>
                    <CardContent className="p-0 bg-white">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="text-muted font-semibold pl-6">Name</TableHead>
                                        <TableHead className="text-muted font-semibold">Email</TableHead>
                                        <TableHead className="text-muted font-semibold">System Role</TableHead>
                                        <TableHead className="text-right text-muted font-semibold pr-6">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.filter(user => {
                                        const matchesSearch = user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                            user.email.toLowerCase().includes(userSearchQuery.toLowerCase());
                                        const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
                                        return matchesSearch && matchesRole;
                                    }).map(user => (
                                        <TableRow key={user.id} className="border-border hover:bg-surface/30">
                                            <TableCell className="font-medium text-foreground pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-display border border-primary/20">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    {user.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted">{user.email}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${user.role === 'admin' ? 'bg-red-50 text-red-600 border-red-200' :
                                                    user.role === 'staffmanager' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                        user.role === 'rm' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                            'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                                                    Active
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
            {activeTab === 'demat' && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                        <div>
                            <CardTitle className="font-display font-medium text-lg">Physical Share Conversion</CardTitle>
                            <CardDescription className="text-muted">Process and track dematerialization requests from physical certificates.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50">
                                        <TableHead className="pl-6 font-semibold">Client ID</TableHead>
                                        <TableHead className="font-semibold">Company</TableHead>
                                        <TableHead className="font-semibold text-right">Quantity</TableHead>
                                        <TableHead className="font-semibold">Folio</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dematRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center p-8 text-muted italic">No conversion requests found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        dematRequests.map(req => (
                                            <TableRow key={req.id}>
                                                <TableCell className="pl-6 font-mono text-xs">{req.userId}</TableCell>
                                                <TableCell className="font-medium">{req.companyName}</TableCell>
                                                <TableCell className="text-right">{req.quantity}</TableCell>
                                                <TableCell className="font-mono text-xs">{req.folioNumber}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
                                                        req.status === 'completed' ? 'bg-green-50 text-green-600' :
                                                        req.status === 'under_process' ? 'bg-blue-50 text-blue-600' :
                                                        'bg-amber-50 text-amber-600'
                                                    }`}>
                                                        {req.status.replace('_', ' ')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                   <div className="flex justify-end gap-2">
                                                        {req.status === 'initiated' && (
                                                            <Button size="sm" className="h-7 text-[10px] font-bold" onClick={() => updateDematStatus(req.id, 'under_process')}>Start Processing</Button>
                                                        )}
                                                        {req.status === 'under_process' && (
                                                            <Button size="sm" className="h-7 text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white" onClick={() => updateDematStatus(req.id, 'completed')}>Complete</Button>
                                                        )}
                                                   </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
            {activeTab === 'teams' && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                        <div>
                            <CardTitle className="font-display font-medium text-lg">Platform Teams</CardTitle>
                            <CardDescription className="text-muted">Manage teams of Relationship Managers and assign them to Staff Managers.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="text-muted font-semibold pl-6">Team Name</TableHead>
                                        <TableHead className="text-muted font-semibold">Staff Manager</TableHead>
                                        <TableHead className="text-muted font-semibold">RM Count</TableHead>
                                        <TableHead className="text-right text-muted font-semibold pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teams.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center p-8 text-muted italic">No teams created yet.</TableCell>
                                        </TableRow>
                                    ) : teams.map(team => (
                                        <TableRow key={team.id} className="border-border hover:bg-surface/30">
                                            <TableCell className="font-medium text-foreground pl-6 cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedTeamId(team.id)}>
                                                {team.name}
                                            </TableCell>
                                            <TableCell className="text-muted">
                                                {users.find(u => u.id === team.managerId)?.name || 'Unassigned'}
                                            </TableCell>
                                            <TableCell>{team.rmIds.length} RMs</TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" className="text-primary text-[10px] uppercase font-bold tracking-widest" onClick={() => setSelectedTeamId(team.id)}>View Details</Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] uppercase font-bold tracking-widest"
                                                        onClick={() => removeTeam(team.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'blogs' && (() => {
                const filteredBlogs = blogs.filter(b => {
                    const matchesSearch = b.title.toLowerCase().includes(blogSearchQuery.toLowerCase());
                    const matchesStatus = blogStatusFilter === 'all' || b.status === blogStatusFilter;
                    return matchesSearch && matchesStatus;
                });
                const totalBlogPages = Math.max(1, Math.ceil(filteredBlogs.length / PAGE_SIZE));
                const paginatedBlogs = filteredBlogs.slice((blogPage - 1) * PAGE_SIZE, blogPage * PAGE_SIZE);
                return (
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                        <div>
                            <CardTitle className="font-display font-medium text-lg">Blog Management</CardTitle>
                            <CardDescription className="text-muted">Manage company news, market updates, and educational articles.</CardDescription>
                        </div>
                    </CardHeader>
                    <div className="p-4 border-b border-border bg-surface/20 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1">
                            <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <Input placeholder="Search by title..." className="pl-10 h-10 border-border bg-white" value={blogSearchQuery} onChange={e => { setBlogSearchQuery(e.target.value); setBlogPage(1); }} />
                        </div>
                        <select className="h-10 px-3 bg-white border border-border rounded-lg text-xs font-semibold focus:ring-1 focus:ring-primary outline-none" value={blogStatusFilter} onChange={e => { setBlogStatusFilter(e.target.value as any); setBlogPage(1); }}>
                            <option value="all">ALL STATUS</option>
                            <option value="draft">DRAFT</option>
                            <option value="published">PUBLISHED</option>
                        </select>
                    </div>
                    <CardContent className="p-0 bg-white">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="text-muted font-semibold pl-6">Title</TableHead>
                                        <TableHead className="text-muted font-semibold">Status</TableHead>
                                        <TableHead className="text-muted font-semibold">Views</TableHead>
                                        <TableHead className="text-muted font-semibold">Published</TableHead>
                                        <TableHead className="text-right text-muted font-semibold pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedBlogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center p-8 text-muted italic">No blog posts found.</TableCell>
                                        </TableRow>
                                    ) : paginatedBlogs.map(blog => (
                                        <TableRow key={blog.id} className="border-border hover:bg-surface/30">
                                            <TableCell className="font-medium text-foreground pl-6 max-w-xs truncate">
                                                {blog.title}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${blog.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'}`}>
                                                    {blog.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted">
                                                <div className="flex items-center gap-1">
                                                    <Icon name="EyeIcon" size={14} />
                                                    {blog.views}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted text-xs">
                                                {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : '-'}
                                            </TableCell>
                                            <TableCell className="text-right pr-6 whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:bg-primary/5 text-[10px] font-bold uppercase tracking-widest mr-1"
                                                    onClick={() => openBlogEdit(blog)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest"
                                                    onClick={() => handleBlogDelete(blog.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {totalBlogPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface/20">
                                <span className="text-xs text-muted">{filteredBlogs.length} posts</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled={blogPage <= 1} onClick={() => setBlogPage(p => p - 1)}>Previous</Button>
                                    <span className="text-xs text-muted">Page {blogPage} of {totalBlogPages}</span>
                                    <Button variant="outline" size="sm" disabled={blogPage >= totalBlogPages} onClick={() => setBlogPage(p => p + 1)}>Next</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                );
            })()}

            {activeTab === 'settings' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="border-b border-border/50 bg-white">
                                <CardTitle className="font-display font-medium text-lg">Platform Parameters</CardTitle>
                                <CardDescription>Configure global transaction limits and fees.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Global Buy Fee (%)</label>
                                    <Input defaultValue="1.5" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Minimum Transaction (INR)</label>
                                    <Input defaultValue="100,000" />
                                </div>
                                <Button className="w-full bg-primary text-white mt-4">Save Platform Settings</Button>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm">
                            <CardHeader className="border-b border-border/50 bg-white">
                                <CardTitle className="font-display font-medium text-lg">System Health</CardTitle>
                                <CardDescription>Monitor platform performance and uptime.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                    <span className="text-sm">API Connectivity</span>
                                    <span className="text-xs font-bold text-green-600">Stable</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                    <span className="text-sm">Database Load</span>
                                    <span className="text-xs font-bold text-primary">12% Normal</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm">Last Backup</span>
                                    <span className="text-xs text-muted">2 hours ago</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="pt-8 border-t border-border mt-8">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <Icon name="SparklesIcon" size={24} />
                            <h3 className="font-display text-xl font-medium">Home Page CMS</h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Hero Section Config */}
                            <Card className="border-border shadow-sm overflow-hidden">
                                <CardHeader className="bg-white border-b border-border/50">
                                    <CardTitle className="font-display font-medium text-lg flex items-center gap-2">
                                        <Icon name="SparklesIcon" size={20} className="text-primary" /> Hero Management
                                    </CardTitle>
                                    <CardDescription>Update the primary headline and visual content for the home page.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4 bg-white">
                                    <div>
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Headline Text</label>
                                        <Input 
                                            value={homePageData.hero.title} 
                                            onChange={(e) => updateHomePageData({...homePageData, hero: {...homePageData.hero, title: e.target.value}})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Highlight Word</label>
                                        <Input 
                                            value={homePageData.hero.highlight} 
                                            onChange={(e) => updateHomePageData({...homePageData, hero: {...homePageData.hero, highlight: e.target.value}})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Sub-headline Description</label>
                                        <textarea 
                                            className="w-full h-24 p-3 text-sm border border-border rounded-lg bg-surface/10 focus:ring-1 focus:ring-primary outline-none resize-none"
                                            value={homePageData.hero.description}
                                            onChange={(e) => updateHomePageData({...homePageData, hero: {...homePageData.hero, description: e.target.value}})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Offer Title</label>
                                            <Input 
                                                value={homePageData.hero.offerPrice} 
                                                onChange={(e) => updateHomePageData({...homePageData, hero: {...homePageData.hero, offerPrice: e.target.value}})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Offer Change Badge</label>
                                            <Input 
                                                value={homePageData.hero.offerChange} 
                                                onChange={(e) => updateHomePageData({...homePageData, hero: {...homePageData.hero, offerChange: e.target.value}})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Hero Backdrop URL</label>
                                        <Input 
                                            value={homePageData.hero.img} 
                                            onChange={(e) => updateHomePageData({...homePageData, hero: {...homePageData.hero, img: e.target.value}})}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Platform Statistics */}
                            <Card className="border-border shadow-sm flex flex-col">
                                <CardHeader className="bg-white border-b border-border/50">
                                    <CardTitle className="font-display font-medium text-lg flex items-center gap-2">
                                        <Icon name="ArrowTrendingUpIcon" size={20} className="text-primary" /> Authority Stats
                                    </CardTitle>
                                    <CardDescription>Manage the credibility numbers shown to new visitors.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6 flex-1 bg-white">
                                    <div className="p-4 bg-surface/30 rounded-xl border border-border/50">
                                        <label className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-3">Average Returns (%)</label>
                                        <Input 
                                            className="text-2xl font-bold h-14"
                                            value={homePageData.stats.avgReturns} 
                                            onChange={(e) => updateHomePageData({...homePageData, stats: {...homePageData.stats, avgReturns: e.target.value}})}
                                        />
                                        <p className="text-[10px] text-muted mt-2 uppercase font-medium">Displayed in: How it Works & Stats Section</p>
                                    </div>

                                    <div className="p-4 bg-surface/30 rounded-xl border border-border/50">
                                        <label className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-3">Total Orders (Value)</label>
                                        <Input 
                                            className="text-2xl font-bold h-14"
                                            value={homePageData.stats.totalOrders} 
                                            onChange={(e) => updateHomePageData({...homePageData, stats: {...homePageData.stats, totalOrders: e.target.value}})}
                                        />
                                    </div>

                                    <div className="p-4 bg-surface/30 rounded-xl border border-border/50">
                                        <label className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-3">Registered Investors</label>
                                        <Input 
                                            className="text-2xl font-bold h-14"
                                            value={homePageData.stats.users} 
                                            onChange={(e) => updateHomePageData({...homePageData, stats: {...homePageData.stats, users: e.target.value}})}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <AgentSettingsConfig />
                </div>
            )}

            {activeTab === 'agents' && (
                <div className="space-y-6">
                    <AgentKycTab />
                    <AgentPayoutsTab />
                </div>
            )}

            {activeTab === 'customer_kyc' && <CustomerKycTab />}

            {activeTab === 'feedback' && <FeedbackTab />}

            {activeTab === 'analytics' && <AnalyticsDashboard />}

            {activeTab === 'orders' && <OrderManagementTab />}

            {activeTab === 'notifications' && <NotificationManagementTab />}

            {activeTab === 'leads' && <LeadManagementTab />}

            {activeTab === 'rm_targets' && <RmTargetTrackingTab />}

            {activeTab === 'audit_log' && <AuditLogTab />}

            {activeTab === 'price_history' && <PriceHistoryCharts />}

            {activeTab === 'agent_performance' && <AgentPerformanceTab />}

            {activeTab === 'market_intel' && <MarketIntelTab />}

            {activeTab === 'mf_interests' && <MutualFundInterestsTab />}

            {/* Delivery Details Modal */}
            {deliveryOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-xl font-medium text-foreground">
                                Transfer Shares Confirmation
                            </h3>
                            <button onClick={() => setDeliveryOrderId(null)} className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg transition-colors">
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-muted mb-4 block">Please ensure you have sent the necessary mails to finalize the transfer. Details logged here mark the transaction as 'mail_sent', transitioning to 'in_holding' automatically after 5 minutes.</p>

                            <div className="grid gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Asset ISIN Code</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. INE01O101011"
                                        value={deliveryDetails.isin}
                                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, isin: e.target.value })}
                                        className="h-10 border-border"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-foreground mb-1 block">Transfer Date</label>
                                        <Input
                                            type="date"
                                            value={deliveryDetails.date}
                                            onChange={(e) => setDeliveryDetails({ ...deliveryDetails, date: e.target.value })}
                                            className="h-10 border-border text-muted"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-foreground mb-1 block">Transfer Time</label>
                                        <Input
                                            type="time"
                                            value={deliveryDetails.time}
                                            onChange={(e) => setDeliveryDetails({ ...deliveryDetails, time: e.target.value })}
                                            className="h-10 border-border text-muted"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 mt-4 bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="declare-transfer"
                                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                        checked={deliveryDetails.declared}
                                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, declared: e.target.checked })}
                                    />
                                    <label htmlFor="declare-transfer" className="text-sm text-foreground">
                                        I formally declare that I have executed the necessary email communications and external transfers to assign these shares definitively to the client's DEMAT. This action is verifiable.
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setDeliveryOrderId(null)}>Cancel</Button>
                            <Button variant="default" className="bg-primary hover:bg-primary/90 text-white" onClick={handlePromoteToMailSent}>
                                Confirm Delivery Transfer
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit / Add Modal */}
            {editingCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-xl font-medium text-foreground">
                                {isAddMode ? 'Add New Listing' : `Edit ${editingCompany.name}`}
                            </h3>
                            <button onClick={() => setEditingCompany(null)} className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg transition-colors">
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Company Name</label>
                                    <input
                                        type="text"
                                        value={formValues.name || ''}
                                        onChange={e => setFormValues({ ...formValues, name: e.target.value })}
                                        className="w-full p-2.5 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none"
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Sector</label>
                                    <input
                                        type="text"
                                        value={formValues.sector || ''}
                                        onChange={e => setFormValues({ ...formValues, sector: e.target.value })}
                                        className="w-full p-2.5 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none"
                                        placeholder="e.g. FinTech"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Ask Price (INR)</label>
                                    <input
                                        type="number"
                                        value={formValues.currentAskPrice || 0}
                                        onChange={e => setFormValues({ ...formValues, currentAskPrice: Number(e.target.value) })}
                                        className="w-full p-2.5 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Status</label>
                                    <div className="space-y-2">
                                        <select
                                            value={['pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'pre_ipo'].includes(formValues.status || '') ? formValues.status : 'custom'}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setFormValues({ ...formValues, status: val === 'custom' ? '' : val as any });
                                            }}
                                            className="w-full p-2.5 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none uppercase font-semibold text-xs tracking-wider"
                                        >
                                            <option value="pre_seed">Pre Seed</option>
                                            <option value="seed">Seed</option>
                                            <option value="series_a">Series A</option>
                                            <option value="series_b">Series B</option>
                                            <option value="series_c">Series C</option>
                                            <option value="pre_ipo">Pre IPO</option>
                                            <option value="custom">Other / Custom</option>
                                        </select>

                                        {(!['pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'pre_ipo'].includes(formValues.status || '') || formValues.status === '') && (
                                            <input
                                                type="text"
                                                value={formValues.status || ''}
                                                onChange={e => setFormValues({ ...formValues, status: e.target.value })}
                                                placeholder="Enter custom status (e.g. Series D+)"
                                                className="w-full p-2.5 text-xs border border-primary/30 rounded-lg bg-white focus-visible:ring-1 focus-visible:ring-primary outline-none font-medium animate-in slide-in-from-top-2 duration-200"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Valuation (Cr INR)</label>
                                <input
                                    type="number"
                                    value={formValues.valuation || 0}
                                    onChange={e => setFormValues({ ...formValues, valuation: Number(e.target.value) })}
                                    className="w-full p-2.5 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none font-semibold"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Description</label>
                                <textarea
                                    value={formValues.description || ''}
                                    onChange={e => setFormValues({ ...formValues, description: e.target.value })}
                                    className="w-full h-24 p-2.5 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none resize-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-border flex flex-col gap-4">
                                <h4 className="text-sm font-bold text-foreground mb-2">Detailed Sections (Markdown Supported)</h4>
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Overview / AI Context</label>
                                    <textarea
                                        value={companyDetails.overview}
                                        placeholder="Add general overview and intelligence context for ShareX AI..."
                                        onChange={e => setCompanyDetails({ ...companyDetails, overview: e.target.value })}
                                        className="w-full h-24 p-2.5 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none resize-none"
                                    />
                                    <p className="text-[10px] text-muted mt-1">This context is used for the Overview tab and by the AI agent.</p>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Financials</label>
                                    <textarea
                                        value={companyDetails.financials}
                                        placeholder="Revenue, EBITDA, PAT, EPS..."
                                        onChange={e => setCompanyDetails({ ...companyDetails, financials: e.target.value })}
                                        className="w-full h-24 p-2.5 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none resize-none"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-foreground mb-1 block">Funding & Peers</label>
                                        <textarea
                                            value={companyDetails.funding}
                                            placeholder="Funding rounds, competitors..."
                                            onChange={e => setCompanyDetails({ ...companyDetails, funding: e.target.value })}
                                            className="w-full h-24 p-2.5 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-foreground mb-1 block">FAQs</label>
                                        <textarea
                                            value={companyDetails.faq}
                                            placeholder="Frequently asked questions..."
                                            onChange={e => setCompanyDetails({ ...companyDetails, faq: e.target.value })}
                                            className="w-full h-24 p-2.5 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        id="is-featured"
                                        className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                                        checked={formValues.isFeatured || false}
                                        onChange={e => setFormValues({...formValues, isFeatured: e.target.checked})}
                                    />
                                    <label htmlFor="is-featured" className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Icon name="StarIcon" size={16} className="text-amber-500" variant="solid" /> Featured on Homepage Slider
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Company Category (Label)</label>
                                        <input
                                            type="text"
                                            value={formValues.category || ''}
                                            onChange={e => setFormValues({ ...formValues, category: e.target.value })}
                                            className="w-full p-2.5 text-xs border border-border rounded-lg bg-surface/30"
                                            placeholder="e.g. Fintech · Pre-IPO"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Minimum Investment</label>
                                        <input
                                            type="text"
                                            value={formValues.minInvest || ''}
                                            onChange={e => setFormValues({ ...formValues, minInvest: e.target.value })}
                                            className="w-full p-2.5 text-xs border border-border rounded-lg bg-surface/30"
                                            placeholder="₹50,000"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Price Change Badge</label>
                                        <input
                                            type="text"
                                            value={formValues.change || ''}
                                            onChange={e => setFormValues({ ...formValues, change: e.target.value })}
                                            className="w-full p-2.5 text-xs border border-border rounded-lg bg-surface/30"
                                            placeholder="+12.4%"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 pt-4">
                                        <input 
                                            type="checkbox" 
                                            id="is-positive"
                                            className="h-4 w-4 rounded border-border text-green-600 focus:ring-green-500"
                                            checked={formValues.positive ?? true}
                                            onChange={e => setFormValues({...formValues, positive: e.target.checked})}
                                        />
                                        <label htmlFor="is-positive" className="text-xs font-semibold text-foreground">Is Positive Change?</label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Logo URL (Optional)</label>
                                        <input
                                            type="text"
                                            value={formValues.img || ''}
                                            onChange={e => setFormValues({ ...formValues, img: e.target.value })}
                                            className="w-full p-2.5 text-xs border border-border rounded-lg bg-surface/30"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Brand Color / Theme</label>
                                        <input
                                            type="text"
                                            value={formValues.imgAlt || ''}
                                            onChange={e => setFormValues({ ...formValues, imgAlt: e.target.value })}
                                            className="w-full p-2.5 text-xs border border-border rounded-lg bg-surface/30"
                                            placeholder="Light Blue"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setEditingCompany(null)}>Cancel</Button>
                            <Button variant="default" className="bg-primary hover:bg-primary/90 text-white" onClick={handleSave}>
                                {isAddMode ? 'Confirm Listing' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {isCreateUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-xl font-medium text-foreground">Create New Internal Account</h3>
                            <button onClick={() => setIsCreateUserModalOpen(false)} className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg transition-colors">
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Full Name</label>
                                <Input
                                    placeholder="John Doe"
                                    value={userFormValues.name || ''}
                                    onChange={e => setUserFormValues({ ...userFormValues, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="john@preipo.com"
                                    value={userFormValues.email || ''}
                                    onChange={e => setUserFormValues({ ...userFormValues, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">System Role</label>
                                <select
                                    className="w-full p-2.5 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none"
                                    value={userFormValues.role}
                                    onChange={e => setUserFormValues({ ...userFormValues, role: e.target.value as UserRole })}
                                >
                                    <option value="staffmanager">Staff Manager</option>
                                    <option value="rm">Relationship Manager</option>
                                    <option value="admin">System Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsCreateUserModalOpen(false)}>Cancel</Button>
                            <Button className="bg-primary text-white" onClick={handleCreateUser}>Create Account</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Team Modal */}
            {isCreateTeamModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-xl font-medium text-foreground">Build New Team</h3>
                            <button onClick={() => setIsCreateTeamModalOpen(false)} className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg transition-colors">
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Team Name</label>
                                <Input
                                    placeholder="Diamond Squad"
                                    value={teamFormValues.name || ''}
                                    onChange={e => setTeamFormValues({ ...teamFormValues, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Staff Manager Assignment</label>
                                <select
                                    className="w-full p-2.5 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none"
                                    value={teamFormValues.managerId || ''}
                                    onChange={e => setTeamFormValues({ ...teamFormValues, managerId: e.target.value })}
                                >
                                    <option value="">Select a Manager</option>
                                    {users.filter(u => u.role === 'staffmanager').map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Relationship Managers</label>
                                <p className="text-[10px] text-muted mb-2 uppercase tracking-widest">Select members for this team</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-border rounded-lg bg-surface/10">
                                    {users.filter(u => u.role === 'rm').map(rm => (
                                        <div key={rm.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`rm-${rm.id}`}
                                                checked={teamFormValues.rmIds?.includes(rm.id)}
                                                onChange={e => {
                                                    const current = teamFormValues.rmIds || [];
                                                    if (e.target.checked) {
                                                        setTeamFormValues({ ...teamFormValues, rmIds: [...current, rm.id] });
                                                    } else {
                                                        setTeamFormValues({ ...teamFormValues, rmIds: current.filter(id => id !== rm.id) });
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`rm-${rm.id}`} className="text-sm">{rm.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsCreateTeamModalOpen(false)}>Cancel</Button>
                            <Button className="bg-primary text-white" onClick={handleCreateTeam}>Confirm Team Structure</Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Team Detail Modal */}
            {selectedTeamId && (
                (() => {
                    const team = teams.find(t => t.id === selectedTeamId);
                    if (!team) return null;
                    const manager = users.find(u => u.id === team.managerId);
                    const teamRms = users.filter(u => team.rmIds.includes(u.id));

                    // Aggregate Performance
                    const teamOrders = orders.filter(order => {
                        const customer = users.find(u => u.id === order.userId);
                        return customer && team.rmIds.includes(customer.assignedRmId || '');
                    });

                    const totalVolume = teamOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                    const settledVolume = teamOrders.filter(o => o.status === 'in_holding').reduce((sum, o) => sum + o.totalAmount, 0);
                    const activeDeals = teamOrders.filter(o => o.status !== 'in_holding').length;

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                                <div className="flex items-center justify-between p-6 border-b border-border bg-surface/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
                                            <Icon name="UserGroupIcon" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-display text-2xl font-medium text-foreground leading-tight">{team.name}</h3>
                                            <p className="text-xs text-muted font-medium uppercase tracking-widest mt-0.5">Performance Analysis & Team Roster</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedTeamId(null)} className="text-muted hover:text-foreground hover:bg-surface p-2 rounded-full transition-colors">
                                        <Icon name="XMarkIcon" size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                    {/* Scorecards */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card className="bg-primary/5 border-primary/10 p-5 shadow-none">
                                            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">Total Sales Volume</p>
                                            <p className="text-xl font-bold text-primary">₹{(totalVolume / 100000).toFixed(1)}L</p>
                                        </Card>
                                        <Card className="bg-green-50 border-green-100 p-5 shadow-none">
                                            <p className="text-[10px] font-bold text-green-600/70 uppercase tracking-widest mb-1">Settled AUM</p>
                                            <p className="text-xl font-bold text-green-700">₹{(settledVolume / 100000).toFixed(1)}L</p>
                                        </Card>
                                        <Card className="bg-amber-50 border-amber-100 p-5 shadow-none">
                                            <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest mb-1">Active Pipeline</p>
                                            <p className="text-xl font-bold text-amber-700">{activeDeals} Deals</p>
                                        </Card>
                                        <Card className="bg-slate-50 border-slate-200 p-5 shadow-none">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Team Size</p>
                                            <p className="text-xl font-bold text-slate-700">{team.rmIds.length} RMs</p>
                                        </Card>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Left Side: Manager & RMs */}
                                        <div className="lg:col-span-2 space-y-6">
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 border-l-2 border-primary pl-3">Team Structure</h4>
                                                <div className="space-y-4">
                                                    <div className="p-4 rounded-xl border border-border bg-white shadow-sm flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm border border-amber-200">SM</div>
                                                            <div>
                                                                <p className="text-sm font-bold text-foreground">{manager?.name || 'No Manager Assigned'}</p>
                                                                <p className="text-[10px] text-muted uppercase font-semibold">Staff Manager</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-muted">{manager?.email}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4">
                                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 pl-1">Relationship Managers</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {teamRms.map(rm => {
                                                                const rmVolume = orders.filter(o => {
                                                                    const customer = users.find(u => u.id === o.userId);
                                                                    return customer?.assignedRmId === rm.id;
                                                                }).reduce((sum, o) => sum + o.totalAmount, 0);

                                                                return (
                                                                    <div key={rm.id} className="p-3.5 rounded-xl border border-border/60 bg-surface/20 flex items-center justify-between hover:bg-surface/50 transition-colors">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">RM</div>
                                                                            <div>
                                                                                <p className="text-xs font-bold text-foreground">{rm.name}</p>
                                                                                <p className="text-[9px] text-muted">{rm.email}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[10px] font-bold text-primary">₹{(rmVolume / 100000).toFixed(1)}L</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Quick Stats/Description */}
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 border-l-2 border-primary pl-3">About Team</h4>
                                                <div className="p-5 rounded-xl border border-border bg-slate-50/50 text-sm text-muted leading-relaxed">
                                                    {team.description || "This team is responsible for managing strategic relationship and platform deal flow. No additional description provided."}
                                                </div>
                                            </div>

                                            <div className="p-5 rounded-xl bg-primary/5 border border-primary/10">
                                                <h5 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Goal Progress</h5>
                                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
                                                    <div className="h-full bg-primary" style={{ width: '65%' }}></div>
                                                </div>
                                                <p className="text-[10px] text-muted text-right font-medium">65% of monthly target met</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Internal Notes Section */}
                                    <div className="pt-8 border-t border-border">
                                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 border-l-2 border-primary pl-3">Personal Reference Notes</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2">
                                                {team.notes && team.notes.length > 0 ? (
                                                    team.notes.map((note, idx) => (
                                                        <div key={idx} className="p-3 bg-slate-50 border border-border rounded-lg shadow-sm">
                                                            <p className="text-xs text-foreground leading-relaxed">{note}</p>
                                                            <div className="text-[9px] text-muted mt-1 uppercase font-semibold">Admin Record • Platform Insight</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="h-full flex items-center justify-center p-8 bg-surface/30 rounded-xl border border-dashed border-border">
                                                        <p className="text-xs text-muted italic">No private notes for this team yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
                                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Add New Insight</p>
                                                <textarea
                                                    className="w-full h-24 p-3 bg-surface/30 border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary outline-none resize-none mb-3"
                                                    placeholder="Type personal reference note here..."
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            const val = e.currentTarget.value.trim();
                                                            if (val) {
                                                                addTeamNote(team.id, val);
                                                                e.currentTarget.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <p className="text-[9px] text-muted italic leading-tight">These notes are only visible to platform administrators and are not shared with the staff managers or RMs. Press Enter to save.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 py-5 border-t border-border bg-surface/50 flex justify-end gap-3">
                                    <Button variant="outline" className="h-10 text-xs font-bold uppercase tracking-widest px-6" onClick={() => setSelectedTeamId(null)}>Close View</Button>
                                    <Button variant="default" className="bg-primary text-white h-10 text-xs font-bold uppercase tracking-widest px-6" onClick={() => {
                                        setTeamFormValues({ ...team });
                                        setIsCreateTeamModalOpen(true);
                                        setSelectedTeamId(null);
                                    }}>Edit Structure</Button>
                                </div>
                            </div>
                        </div>
                    );
                })()
            )}
            {/* Blog Edit / Add Modal */}
            {editingBlog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-xl font-medium text-foreground">
                                {isBlogAddMode ? 'Create New Article' : `Edit Article`}
                            </h3>
                            <button onClick={() => setEditingBlog(null)} className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg transition-colors">
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {/* AI Generation Section */}
                            <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl animate-in slide-in-from-top-4 duration-500">
                                <label className="text-xs font-bold text-primary mb-3 flex items-center gap-2 uppercase tracking-widest">
                                    <Icon name="CpuChipIcon" size={16} variant="solid" /> Generate with ShareX AI Intel
                                </label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            placeholder="Topic: e.g. Swiggy Pre-IPO Secondary Analysis"
                                            value={aiBlogPrompt.topic}
                                            onChange={e => setAiBlogPrompt({ ...aiBlogPrompt, topic: e.target.value })}
                                            className="bg-white border-primary/20 pr-32 h-10"
                                        />
                                        <Button
                                            size="sm"
                                            className="absolute right-1 top-1 h-8 bg-primary text-white hover:bg-primary/90 min-w-[100px]"
                                            onClick={handleAiGenerateBlog}
                                            disabled={isGeneratingBlog || !aiBlogPrompt.topic}
                                        >
                                            {isGeneratingBlog ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Thinking
                                                </div>
                                            ) : 'Generate Blog'}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Input
                                                placeholder="Specific Keywords: e.g. EBITDA, DRHP"
                                                value={aiBlogPrompt.keywords}
                                                onChange={e => setAiBlogPrompt({ ...aiBlogPrompt, keywords: e.target.value })}
                                                className="bg-white border-primary/10 text-xs h-8"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <select 
                                                className="w-full text-xs h-8 border border-primary/10 rounded-lg px-2 bg-white"
                                                value={aiBlogPrompt.length}
                                                onChange={e => setAiBlogPrompt({ ...aiBlogPrompt, length: e.target.value })}
                                            >
                                                <option value="300">Short (~300 Words)</option>
                                                <option value="500">Medium (~500 Words)</option>
                                                <option value="1000">In-Depth (~1000 Words)</option>
                                                <option value="1500">Comprehensive (~1500 Words)</option>
                                            </select>
                                            <select 
                                                className="w-full text-xs h-8 border border-primary/10 rounded-lg px-2 bg-white"
                                                value={aiBlogPrompt.creativity}
                                                onChange={e => setAiBlogPrompt({ ...aiBlogPrompt, creativity: parseFloat(e.target.value) })}
                                            >
                                                <option value="0.2">Strict & Factual</option>
                                                <option value="0.6">Balanced Analyst</option>
                                                <option value="0.9">Engaging Journalist</option>
                                                <option value="1.2">Highly Creative Speculation</option>
                                            </select>
                                        </div>
                                    </div>
                                    <textarea
                                        placeholder="Reference text, facts, or source article to ground the generation..."
                                        value={aiBlogPrompt.referenceText}
                                        onChange={e => setAiBlogPrompt({ ...aiBlogPrompt, referenceText: e.target.value })}
                                        className="w-full h-24 p-2 text-xs border border-primary/10 rounded-lg bg-white focus-visible:ring-1 focus-visible:ring-primary outline-none resize-none"
                                    />
                                    <p className="text-[10px] text-muted leading-relaxed">
                                        Our AI adopts a senior financial research persona. It will generate a title, slug, summary, and deep-dive technical content based on the details provided.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-border/50">
                                <label className="text-sm font-semibold text-foreground mb-1 block">Title</label>
                                <Input
                                    value={blogFormValues.title || ''}
                                    onChange={e => setBlogFormValues({ ...blogFormValues, title: e.target.value })}
                                    placeholder="e.g. Swiggy Pre-IPO: Is it the right time to buy?"
                                    className="h-10 border-border"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Slug (URL)</label>
                                    <Input
                                        value={blogFormValues.slug || ''}
                                        onChange={e => setBlogFormValues({ ...blogFormValues, slug: e.target.value })}
                                        placeholder="swiggy-pre-ipo-buy-guide"
                                        className="h-10 border-border"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Status</label>
                                    <select
                                        className="w-full h-10 px-3 bg-white border border-border rounded-lg text-sm font-semibold"
                                        value={blogFormValues.status}
                                        onChange={e => setBlogFormValues({ ...blogFormValues, status: e.target.value })}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="scheduled">Scheduled</option>
                                    </select>
                                </div>
                                {blogFormValues.status === 'scheduled' && (
                                    <div>
                                        <label className="text-sm font-semibold text-foreground mb-1 block">Schedule Date & Time</label>
                                        <Input
                                            type="datetime-local"
                                            className="h-10 border-border"
                                            value={blogFormValues.scheduledAt || ''}
                                            onChange={e => setBlogFormValues({ ...blogFormValues, scheduledAt: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Excerpt (Summary)</label>
                                <textarea
                                    className="w-full h-20 p-3 text-sm border border-border rounded-lg bg-surface/30 focus-visible:ring-1 focus-visible:ring-primary outline-none resize-none"
                                    value={blogFormValues.excerpt || ''}
                                    onChange={e => setBlogFormValues({ ...blogFormValues, excerpt: e.target.value })}
                                    placeholder="Brief summary for the blog list page..."
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Content (HTML/Markdown Supported)</label>
                                <textarea
                                    className="w-full h-64 p-3 text-sm border border-border rounded-lg bg-white focus-visible:ring-1 focus-visible:ring-primary outline-none resize-none font-mono"
                                    value={blogFormValues.content || ''}
                                    onChange={e => setBlogFormValues({ ...blogFormValues, content: e.target.value })}
                                    placeholder="Write your article here..."
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setEditingBlog(null)}>Cancel</Button>
                            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleBlogSave}>
                                {isBlogAddMode ? 'Publish Article' : 'Update Article'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Historical Prices Management Modal */}
            {managingPricesForCompanyId && (
                (() => {
                    const company = companies.find(c => c.id === managingPricesForCompanyId);
                    const prices = historicalPrices.filter(p => p.companyId === managingPricesForCompanyId)
                        .sort((a, b) => new Date(a.priceDate).getTime() - new Date(b.priceDate).getTime());

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                                    <h3 className="font-display text-xl font-medium text-foreground">
                                        Price History: {company?.name}
                                    </h3>
                                    <button onClick={() => setManagingPricesForCompanyId(null)} className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg transition-colors">
                                        <Icon name="XMarkIcon" size={20} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Add New Entry */}
                                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Add Data Point</p>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-muted uppercase block mb-1">Date</label>
                                                <Input
                                                    type="date"
                                                    className="h-9 text-xs"
                                                    value={priceEntry.date}
                                                    onChange={e => setPriceEntry({ ...priceEntry, date: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-muted uppercase block mb-1">Value (INR)</label>
                                                <Input
                                                    type="number"
                                                    className="h-9 text-xs"
                                                    value={priceEntry.value}
                                                    onChange={e => setPriceEntry({ ...priceEntry, value: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full bg-primary text-white h-9 text-xs"
                                            onClick={async () => {
                                                if (priceEntry.value <= 0) return alert('Value must be greater than 0');
                                                await addHistoricalPrice(managingPricesForCompanyId, priceEntry.date, priceEntry.value);
                                                setPriceEntry({ ...priceEntry, value: 0 });
                                            }}
                                        >
                                            Add Point
                                        </Button>
                                    </div>

                                    {/* Existing Prices List */}
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Historical Records</p>
                                        {prices.length === 0 ? (
                                            <p className="text-xs italic text-muted text-center py-4">No historical data points yet.</p>
                                        ) : prices.map(price => (
                                            <div key={price.id} className="flex justify-between items-center p-3 bg-surface/50 border border-border rounded-lg group">
                                                <div>
                                                    <p className="text-xs font-semibold text-foreground">{new Date(price.priceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                    <p className="text-[10px] text-muted uppercase font-bold tracking-wider">₹{price.priceValue.toLocaleString()}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeHistoricalPrice(price.id)}
                                                >
                                                    <Icon name="XMarkIcon" size={16} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end">
                                    <Button variant="outline" onClick={() => setManagingPricesForCompanyId(null)}>Close</Button>
                                </div>
                            </div>
                        </div>
                    );
                })()
            )}
        </div>
    );
}
