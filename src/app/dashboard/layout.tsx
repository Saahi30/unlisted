'use client';
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { useAppStore } from '@/lib/store';
import ShareSaathiChat from '@/components/chat/ShareSaathiChat';

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
    const { fetchInitialData } = useAppStore();

    React.useEffect(() => {
        // Fetch real data from Supabase
        fetchInitialData();
    }, [fetchInitialData]);

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
        { label: 'Dematerialize', href: '/dashboard/customer/dematerialize', icon: 'DocumentArrowUpIcon' },
        { label: 'Explore Shares', href: '/shares', icon: 'MagnifyingGlassIcon' },
    ];

    if (pathname.includes('/admin')) {
        portalType = 'Administrator';
        navItems = [
            { label: 'Overview', href: '/dashboard/admin?tab=overview', icon: 'ChartPieIcon' },
            { label: 'Companies', href: '/dashboard/admin?tab=companies', icon: 'BuildingOfficeIcon' },
            { label: 'Users', href: '/dashboard/admin?tab=users', icon: 'UsersIcon' },
            { label: 'Teams', href: '/dashboard/admin?tab=teams', icon: 'UserGroupIcon' },
            { label: 'Settings', href: '/dashboard/admin?tab=settings', icon: 'Cog6ToothIcon' },
        ];
    } else if (pathname.includes('/manager')) {
        portalType = 'Sales Manager';
        navItems = [
            { label: 'Pipeline', href: '/dashboard/manager?tab=transactions', icon: 'ChartBarIcon' },
            { label: 'Team', href: '/dashboard/manager?tab=overview', icon: 'UserGroupIcon' },
            { label: 'Leads', href: '/dashboard/manager?tab=leads', icon: 'UserPlusIcon' },
        ];
    } else if (pathname.includes('/sales')) {
        portalType = 'Relationship Manager';
        navItems = [
            { label: 'My Pipeline', href: '/dashboard/sales', icon: 'PhoneIcon' },
            { label: 'Clients', href: '/dashboard/sales?tab=clients', icon: 'UsersIcon' },
            { label: 'Deals', href: '/dashboard/sales?tab=orders', icon: 'BanknotesIcon' },
        ];
    }

    return (
        <div className="min-h-screen bg-surface flex overflow-hidden">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border h-screen sticky top-0 z-10 shadow-sm">
                <div className="h-20 flex items-center px-6 border-b border-border bg-white">
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
                <header className="h-20 bg-white border-b border-border flex items-center justify-between px-4 md:px-8 z-20 shadow-sm shrink-0">
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
                        <button className="relative p-2 text-muted hover:text-foreground rounded-full hover:bg-surface transition-colors">
                            <Icon name="BellIcon" size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        </button>

                        <div className="h-8 w-px bg-border" />

                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-display border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors uppercase">
                                {user.name.charAt(0)}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-semibold text-foreground leading-none">{user.name}</p>
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
                            className="w-64 bg-white h-full flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="h-20 flex items-center justify-between px-6 border-b border-border bg-white">
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
                </main>
            </div>

            {/* Global Chat AI attached to Dashboard */}
            <ShareSaathiChat />
        </div>
    );
}
