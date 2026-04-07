'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'portfolio' | 'trading' | 'learning' | 'engagement';
    unlocked: boolean;
    progress: number; // 0-100
    target: string;
    reward?: string;
    unlockedAt?: string;
}

export default function AchievementsPage() {
    const { user } = useAuth();
    const { orders, companies, dematRequests } = useAppStore();

    const userOrders = orders.filter(o => o.userId === user?.id);
    const settledOrders = userOrders.filter(o => o.status === 'in_holding');
    const heldCompanyIds = new Set(settledOrders.map(o => o.companyId));
    const heldSectors = new Set(
        settledOrders.map(o => companies.find(c => c.id === o.companyId)?.sector).filter(Boolean)
    );
    const totalInvested = settledOrders.reduce((s, o) => s + o.price * o.quantity, 0);

    const achievements = useMemo<Achievement[]>(() => [
        // Portfolio milestones
        {
            id: 'first_buy',
            title: 'First Steps',
            description: 'Make your first share purchase',
            icon: 'RocketLaunchIcon',
            category: 'trading',
            unlocked: userOrders.length > 0,
            progress: userOrders.length > 0 ? 100 : 0,
            target: '1 order placed',
            reward: 'Welcome Badge',
            unlockedAt: userOrders.length > 0 ? userOrders[userOrders.length - 1]?.createdAt : undefined,
        },
        {
            id: 'portfolio_3',
            title: 'Diversifier',
            description: 'Hold shares in 3 different companies',
            icon: 'ArrowsPointingOutIcon',
            category: 'portfolio',
            unlocked: heldCompanyIds.size >= 3,
            progress: Math.min(100, (heldCompanyIds.size / 3) * 100),
            target: `${heldCompanyIds.size}/3 companies`,
        },
        {
            id: 'sector_3',
            title: 'Sector Explorer',
            description: 'Diversify across 3 different sectors',
            icon: 'GlobeAltIcon',
            category: 'portfolio',
            unlocked: heldSectors.size >= 3,
            progress: Math.min(100, (heldSectors.size / 3) * 100),
            target: `${heldSectors.size}/3 sectors`,
            reward: 'Risk-Smart Badge',
        },
        {
            id: 'invested_1l',
            title: 'Serious Investor',
            description: 'Total invested value crosses ₹1,00,000',
            icon: 'BanknotesIcon',
            category: 'portfolio',
            unlocked: totalInvested >= 100000,
            progress: Math.min(100, (totalInvested / 100000) * 100),
            target: `₹${totalInvested.toLocaleString()}/₹1,00,000`,
        },
        {
            id: 'invested_5l',
            title: 'High Roller',
            description: 'Total invested value crosses ₹5,00,000',
            icon: 'TrophyIcon',
            category: 'portfolio',
            unlocked: totalInvested >= 500000,
            progress: Math.min(100, (totalInvested / 500000) * 100),
            target: `₹${totalInvested.toLocaleString()}/₹5,00,000`,
            reward: 'Priority Support',
        },
        {
            id: 'five_orders',
            title: 'Active Trader',
            description: 'Complete 5 buy orders',
            icon: 'ArrowPathIcon',
            category: 'trading',
            unlocked: userOrders.filter(o => o.type === 'buy').length >= 5,
            progress: Math.min(100, (userOrders.filter(o => o.type === 'buy').length / 5) * 100),
            target: `${userOrders.filter(o => o.type === 'buy').length}/5 orders`,
        },
        {
            id: 'pre_ipo',
            title: 'IPO Hunter',
            description: 'Invest in a Pre-IPO company',
            icon: 'SparklesIcon',
            category: 'trading',
            unlocked: settledOrders.some(o => {
                const c = companies.find(comp => comp.id === o.companyId);
                return c?.status === 'pre_ipo';
            }),
            progress: settledOrders.some(o => companies.find(c => c.id === o.companyId)?.status === 'pre_ipo') ? 100 : 0,
            target: 'Hold a pre-IPO share',
            reward: 'IPO Hunter Badge',
        },
        {
            id: 'demat_done',
            title: 'Digital First',
            description: 'Complete a dematerialization request',
            icon: 'DocumentCheckIcon',
            category: 'trading',
            unlocked: dematRequests.filter(d => d.userId === user?.id && d.status === 'completed').length > 0,
            progress: dematRequests.filter(d => d.userId === user?.id && d.status === 'completed').length > 0 ? 100 : 0,
            target: '1 demat completed',
        },
        {
            id: 'explorer',
            title: 'Market Explorer',
            description: 'View the Market Map and Earnings Calendar',
            icon: 'MapIcon',
            category: 'engagement',
            unlocked: false, // Would track via analytics
            progress: 0,
            target: 'Visit 2 market tools',
        },
        {
            id: 'learner',
            title: 'Knowledge Seeker',
            description: 'Complete your first learning module',
            icon: 'AcademicCapIcon',
            category: 'learning',
            unlocked: false, // Would track via learning module state
            progress: 0,
            target: '1 module completed',
            reward: 'Scholar Badge',
        },
        {
            id: 'all_modules',
            title: 'Market Scholar',
            description: 'Complete all 5 learning modules',
            icon: 'StarIcon',
            category: 'learning',
            unlocked: false,
            progress: 0,
            target: '0/5 modules',
            reward: 'Expert Badge + Priority RM Access',
        },
    ], [userOrders, settledOrders, heldCompanyIds, heldSectors, totalInvested, companies, dematRequests, user]);

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalPoints = achievements.filter(a => a.unlocked).length * 100;

    const categoryConfig = {
        portfolio: { label: 'Portfolio', color: 'text-blue-600', bg: 'bg-blue-50' },
        trading: { label: 'Trading', color: 'text-green-600', bg: 'bg-green-50' },
        learning: { label: 'Learning', color: 'text-purple-600', bg: 'bg-purple-50' },
        engagement: { label: 'Engagement', color: 'text-orange-600', bg: 'bg-orange-50' },
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Achievements</h1>
            </div>
            <p className="text-muted mt-1 mb-8">Track your milestones and unlock rewards as you build your portfolio.</p>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-primary/5 to-blue-50 border border-primary/10 rounded-xl p-5 text-center">
                    <Icon name="TrophyIcon" size={28} className="mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold text-foreground">{unlockedCount}/{achievements.length}</p>
                    <p className="text-xs text-muted font-medium">Unlocked</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-5 text-center">
                    <Icon name="FireIcon" size={28} className="mx-auto text-orange-500 mb-2" />
                    <p className="text-2xl font-bold text-foreground">{totalPoints}</p>
                    <p className="text-xs text-muted font-medium">Points Earned</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-5 text-center">
                    <Icon name="ChartBarIcon" size={28} className="mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-foreground">{Math.round((unlockedCount / achievements.length) * 100)}%</p>
                    <p className="text-xs text-muted font-medium">Completion</p>
                </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Overall Progress</span>
                    <span className="text-xs font-bold text-primary">{unlockedCount}/{achievements.length}</span>
                </div>
                <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-700" style={{ width: `${(unlockedCount / achievements.length) * 100}%` }} />
                </div>
            </div>

            {/* Achievement Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map(achievement => {
                    const cat = categoryConfig[achievement.category];
                    return (
                        <Card key={achievement.id} className={`border-border shadow-sm transition-all ${achievement.unlocked ? 'ring-1 ring-green-200' : 'opacity-80'}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${achievement.unlocked ? 'bg-gradient-to-br from-primary/10 to-blue-50' : 'bg-surface'}`}>
                                        <Icon name={achievement.icon} size={22} className={achievement.unlocked ? 'text-primary' : 'text-muted'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className={`text-sm font-semibold ${achievement.unlocked ? 'text-foreground' : 'text-muted'}`}>{achievement.title}</h3>
                                            {achievement.unlocked && <Icon name="CheckBadgeIcon" size={16} className="text-green-500" />}
                                        </div>
                                        <p className="text-xs text-muted mb-2">{achievement.description}</p>

                                        {/* Progress Bar */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex-1 bg-surface rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-500 ${achievement.unlocked ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${achievement.progress}%` }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-muted">{Math.round(achievement.progress)}%</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-muted">{achievement.target}</span>
                                            {achievement.reward && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${achievement.unlocked ? 'bg-green-100 text-green-700' : 'bg-surface text-muted'}`}>
                                                    {achievement.reward}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
