'use client';
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { useAppStore } from '@/lib/store';
import ShareSaathiChat from '@/components/chat/ShareSaathiChat';
import NotificationsMenu from '@/components/ui/NotificationsMenu';
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        }>
            <DashboardContent children={children} />
        </Suspense>
    );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, isLoading, logout } = useAuth();
    const { fetchInitialData, theme, setTheme, language, setLanguage } = useAppStore();

    React.useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // Apply theme on mount
    React.useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'light') {
            root.classList.remove('dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', prefersDark);
        }
    }, [theme]);

    React.useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return <div className="min-h-screen bg-surface flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>;
    }

    // Determine portal type from URL
    let portalType = 'Customer';
    let navItems = [
        { label: 'My Portfolio', href: '/dashboard/customer', icon: 'BriefcaseIcon' },
        { label: 'Market Map', href: '/dashboard/customer/market-map', icon: 'MapIcon' },
        { label: 'News Feed', href: '/dashboard/customer/news', icon: 'NewspaperIcon' },
        { label: 'IPO Scorecard', href: '/dashboard/customer/scorecard', icon: 'SparklesIcon' },
        { label: 'Peer Compare', href: '/dashboard/customer/peers', icon: 'UserGroupIcon' },
        { label: 'Earnings', href: '/dashboard/customer/earnings', icon: 'CalendarDaysIcon' },
        { label: 'Risk & Rebalance', href: '/dashboard/customer/risk', icon: 'ShieldCheckIcon' },
        { label: 'Weekly Digest', href: '/dashboard/customer/digest', icon: 'ChartBarIcon' },
        { label: 'My Orders', href: '/dashboard/customer/orders', icon: 'ClipboardDocumentListIcon' },
        { label: 'Watchlist', href: '/dashboard/customer/watchlist', icon: 'StarIcon' },
        { label: 'RM Chat', href: '/dashboard/customer/rm-chat', icon: 'ChatBubbleLeftRightIcon' },
        { label: 'Support Tickets', href: '/dashboard/customer/tickets', icon: 'TicketIcon' },
        { label: 'Callback', href: '/dashboard/customer/callback', icon: 'PhoneIcon' },
        { label: 'Help Center', href: '/dashboard/customer/help', icon: 'QuestionMarkCircleIcon' },
        { label: 'Learn', href: '/dashboard/customer/learn', icon: 'AcademicCapIcon' },
        { label: 'Achievements', href: '/dashboard/customer/achievements', icon: 'TrophyIcon' },
        { label: 'Sentiment', href: '/dashboard/customer/sentiment', icon: 'ChartBarSquareIcon' },
        { label: 'KYC', href: '/dashboard/customer?tab=kyc', icon: 'IdentificationIcon' },
        { label: 'Refer & Earn', href: '/dashboard/customer/referrals', icon: 'GiftIcon' },
        { label: 'Tax Report', href: '/dashboard/customer/tax', icon: 'DocumentTextIcon' },
        { label: 'Quick Re-Buy', href: '/dashboard/customer/quick-buy', icon: 'ArrowPathIcon' },
        { label: 'Bulk Cart', href: '/dashboard/customer/cart', icon: 'ShoppingCartIcon' },
        { label: 'Nominees', href: '/dashboard/customer/nominee', icon: 'UsersIcon' },
        { label: 'Export', href: '/dashboard/customer/export', icon: 'ArrowDownTrayIcon' },
        { label: 'Dematerialize', href: '/dashboard/customer/dematerialize', icon: 'DocumentArrowUpIcon' },
        { label: 'Explore Shares', href: '/shares', icon: 'MagnifyingGlassIcon' },
    ];

    if (pathname.includes('/admin')) {
        portalType = 'Administrator';
        navItems = [
            { label: 'Overview', href: '/dashboard/admin?tab=overview', icon: 'ChartPieIcon' },
            { label: 'Analytics', href: '/dashboard/admin?tab=analytics', icon: 'ChartBarIcon' },
            { label: 'Orders', href: '/dashboard/admin?tab=orders', icon: 'ClipboardDocumentListIcon' },
            { label: 'Companies', href: '/dashboard/admin?tab=companies', icon: 'BuildingOfficeIcon' },
            { label: 'Price History', href: '/dashboard/admin?tab=price_history', icon: 'ArrowTrendingUpIcon' },
            { label: 'Users', href: '/dashboard/admin?tab=users', icon: 'UsersIcon' },
            { label: 'Teams', href: '/dashboard/admin?tab=teams', icon: 'UserGroupIcon' },
            { label: 'Leads', href: '/dashboard/admin?tab=leads', icon: 'FunnelIcon' },
            { label: 'RM Targets', href: '/dashboard/admin?tab=rm_targets', icon: 'FlagIcon' },
            { label: 'Customer KYC', href: '/dashboard/admin?tab=customer_kyc', icon: 'IdentificationIcon' },
            { label: 'Agents', href: '/dashboard/admin?tab=agents', icon: 'BriefcaseIcon' },
            { label: 'Agent Perf.', href: '/dashboard/admin?tab=agent_performance', icon: 'TrophyIcon' },
            { label: 'Demat Requests', href: '/dashboard/admin?tab=demat', icon: 'DocumentArrowUpIcon' },
            { label: 'Blogs', href: '/dashboard/admin?tab=blogs', icon: 'NewspaperIcon' },
            { label: 'Notifications', href: '/dashboard/admin?tab=notifications', icon: 'BellIcon' },
            { label: 'Feedback', href: '/dashboard/admin?tab=feedback', icon: 'StarIcon' },
            { label: 'Market Intel', href: '/dashboard/admin?tab=market_intel', icon: 'SparklesIcon' },
            { label: 'Audit Log', href: '/dashboard/admin?tab=audit_log', icon: 'ShieldCheckIcon' },
            { label: 'Settings', href: '/dashboard/admin?tab=settings', icon: 'Cog6ToothIcon' },
        ];
    } else if (pathname.includes('/manager')) {
        portalType = 'Sales Manager';
        navItems = [
            { label: 'Team', href: '/dashboard/manager?tab=overview', icon: 'UserGroupIcon' },
            { label: 'Pipeline', href: '/dashboard/manager?tab=transactions', icon: 'ChartBarIcon' },
            { label: 'Leads', href: '/dashboard/manager?tab=leads', icon: 'UserPlusIcon' },
            { label: 'Demat', href: '/dashboard/manager?tab=demat', icon: 'DocumentArrowUpIcon' },
            { label: 'Tickets', href: '/dashboard/manager?tab=tickets', icon: 'TicketIcon' },
            { label: 'Activity', href: '/dashboard/manager?tab=activity', icon: 'ClockIcon' },
            { label: 'Commissions', href: '/dashboard/manager?tab=commissions', icon: 'BanknotesIcon' },
            { label: 'Broadcast', href: '/dashboard/manager?tab=broadcast', icon: 'MegaphoneIcon' },
            { label: 'Documents', href: '/dashboard/manager?tab=documents', icon: 'FolderOpenIcon' },
            { label: 'Leaderboard', href: '/dashboard/manager?tab=leaderboard', icon: 'TrophyIcon' },
            { label: 'Forecast', href: '/dashboard/manager?tab=forecast', icon: 'ArrowTrendingUpIcon' },
            { label: 'AI Digest', href: '/dashboard/manager?tab=digest', icon: 'SparklesIcon' },
            { label: 'Reports', href: '/dashboard/manager?tab=reports', icon: 'ArrowDownTrayIcon' },
            { label: 'OKRs', href: '/dashboard/manager?tab=goals', icon: 'FlagIcon' },
            { label: 'Calendar', href: '/dashboard/manager?tab=calendar', icon: 'CalendarDaysIcon' },
            { label: 'Onboarding', href: '/dashboard/manager?tab=onboarding', icon: 'AcademicCapIcon' },
            { label: 'Audit Log', href: '/dashboard/manager?tab=audit', icon: 'ShieldCheckIcon' },
        ];
    } else if (pathname.includes('/sales')) {
        portalType = 'Relationship Manager';
        navItems = [
            { label: 'My Pipeline', href: '/dashboard/sales', icon: 'PhoneIcon' },
            { label: 'Clients', href: '/dashboard/sales?tab=clients', icon: 'UsersIcon' },
            { label: 'Deals', href: '/dashboard/sales?tab=orders', icon: 'BanknotesIcon' },
            { label: 'Escalations', href: '/dashboard/sales?tab=escalations', icon: 'ArrowUpCircleIcon' },
        ];
    } else if (pathname.includes('/agent')) {
        portalType = 'Partner Agent';
        navItems = [
            { label: 'Marketplace', href: '/dashboard/agent', icon: 'BuildingOfficeIcon' },
            { label: 'My Links', href: '/dashboard/agent?tab=links', icon: 'LinkIcon' },
            { label: 'My Clients', href: '/dashboard/agent?tab=clients', icon: 'UsersIcon' },
            { label: 'Analytics', href: '/dashboard/agent?tab=analytics', icon: 'ChartBarIcon' },
            { label: 'Earnings', href: '/dashboard/agent?tab=earnings', icon: 'BanknotesIcon' },
            { label: 'Statements', href: '/dashboard/agent?tab=statements', icon: 'DocumentTextIcon' },
            { label: 'My Tier', href: '/dashboard/agent?tab=tiers', icon: 'TrophyIcon' },
            { label: 'Training', href: '/dashboard/agent?tab=training', icon: 'AcademicCapIcon' },
            { label: 'Marketing Kit', href: '/dashboard/agent?tab=marketing', icon: 'MegaphoneIcon' },
            { label: 'Client Feedback', href: '/dashboard/agent?tab=feedback', icon: 'StarIcon' },
            { label: 'Leaderboard', href: '/dashboard/agent?tab=leaderboard', icon: 'ChartBarSquareIcon' },
            { label: 'Support Chat', href: '/dashboard/agent?tab=support', icon: 'ChatBubbleLeftRightIcon' },
            { label: 'KYC Profile', href: '/dashboard/agent?tab=kyc', icon: 'IdentificationIcon' },
        ];
    }

    return (
        <div className="min-h-screen bg-surface flex overflow-hidden">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border h-screen sticky top-0 z-10 shadow-sm">
                <div className="h-20 flex items-center px-6 border-b border-border bg-background">
                    <Link href="/">
                        <AppLogo size={24} text="ShareSaathi" />
                    </Link>
                </div>

                <div className="px-6 py-6 border-b border-border/50">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Current Workspace</p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
                        <p className="text-sm font-semibold text-foreground">{portalType} Portal</p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 relative">
                    {navItems.map((item, idx) => {
                        const search = searchParams.toString();
                        const currentFull = search ? `${pathname}?${search}` : pathname;
                        const isActive = currentFull === item.href || (item.href === pathname && !search);
                        return (
                            <Link
                                key={idx}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-primary/5 text-primary'
                                    : 'text-muted hover:text-foreground hover:bg-surface'
                                    }`}
                            >
                                <Icon name={item.icon} size={18} className={isActive ? 'text-primary' : 'text-muted'} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border">
                    <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors cursor-pointer">
                        <Icon name="ArrowLeftOnRectangleIcon" size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header - Mobile & Desktop */}
                <header className="h-20 bg-background border-b border-border flex items-center justify-between px-4 md:px-8 z-20 shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden text-foreground p-2 rounded-md hover:bg-surface"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Icon name="Bars3Icon" size={24} />
                        </button>
                        <div className="hidden md:block">
                            <h2 className="text-lg font-bold text-foreground font-display">Welcome Back</h2>
                            <p className="text-xs text-muted">Here's your update for today.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                            className="px-2 py-1 rounded-lg text-xs font-bold text-muted hover:text-foreground hover:bg-surface transition-colors border border-border"
                            title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                        >
                            {language === 'en' ? 'हि' : 'EN'}
                        </button>

                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <Icon name={theme === 'dark' ? 'SunIcon' : 'MoonIcon'} size={20} />
                        </button>

                        <NotificationsMenu />

                        <div className="h-8 w-px bg-border" />

                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-display border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors uppercase">
                                    {user.name.charAt(0)}
                                </div>
                                {/* KYC Verification Badge */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center" title="KYC Verified">
                                    <Icon name="CheckIcon" size={10} className="text-white" />
                                </div>
                            </div>
                            <div className="hidden sm:block text-left">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-semibold text-foreground leading-none">{user.name}</p>
                                    <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                                        <Icon name="ShieldCheckIcon" size={8} /> Verified
                                    </span>
                                </div>
                                <p className="text-[10px] text-muted mt-1 uppercase tracking-wider">{portalType}</p>
                            </div>
                            <Icon name="ChevronDownIcon" size={14} className="text-muted" />
                        </div>
                    </div>
                </header>

                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
                        <div
                            className="w-64 bg-background h-full flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="h-20 flex items-center justify-between px-6 border-b border-border bg-background">
                                <Link href="/" onClick={() => setSidebarOpen(false)}>
                                    <AppLogo size={24} text="ShareSaathi" />
                                </Link>
                                <button onClick={() => setSidebarOpen(false)} className="text-muted p-2 rounded-md hover:bg-surface">
                                    <Icon name="XMarkIcon" size={20} />
                                </button>
                            </div>

                            <div className="px-6 py-4 border-b border-border/50 bg-surface/30">
                                <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Current Workspace</p>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
                                    <p className="text-sm font-semibold text-foreground">{portalType} Portal</p>
                                </div>
                            </div>

                            <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
                                {navItems.map((item, idx) => {
                                    const search = searchParams.toString();
                                    const currentFull = search ? `${pathname}?${search}` : pathname;
                                    const isActive = currentFull === item.href || (item.href === pathname && !search);
                                    return (
                                        <Link
                                            key={idx}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                                ? 'bg-primary/5 text-primary'
                                                : 'text-muted hover:text-foreground hover:bg-surface'
                                                }`}
                                        >
                                            <Icon name={item.icon} size={18} className={isActive ? 'text-primary' : 'text-muted'} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="p-4 border-t border-border bg-surface/30">
                                <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors cursor-pointer">
                                    <Icon name="ArrowLeftOnRectangleIcon" size={18} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Page Content scrollable area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface pb-12">
                    {children}

                    <div className="max-w-screen-xl mx-auto px-4 md:px-8 mt-12 mb-8">
                        <div className="pt-8 border-t border-border/60 text-[10px] md:text-xs text-muted/60 leading-relaxed text-center md:text-left">
                            <p>
                                <strong>Disclaimer:</strong> Unlisted shares are not traded on any stock exchange and carry higher risk. 
                                Prices are indicative and may vary. Please conduct your own research or consult a financial advisor before investing.
                            </p>
                        </div>
                    </div>
                </main>
            </div>

            {/* Global Chat AI attached to Dashboard */}
            <ShareSaathiChat />
        </div>
    );
}
