'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';

interface Tier {
    id: string;
    name: string;
    min_revenue: number;
    min_orders: number;
    commission_bonus_pct: number;
    badge_color: string;
    perks: string[];
    sort_order: number;
}

export default function AgentTiersTab({ kycData }: { kycData: any }) {
    const { user } = useAuth();
    const supabase = createClient();
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderCount, setOrderCount] = useState(0);

    useEffect(() => {
        const fetch = async () => {
            if (!user) return;

            const { data: tierData } = await supabase.from('agent_tiers').select('*').order('sort_order');
            if (tierData) setTiers(tierData);
            else {
                setTiers([
                    { id: '1', name: 'Bronze', min_revenue: 0, min_orders: 0, commission_bonus_pct: 0, badge_color: '#CD7F32', perks: ['Basic marketplace access', 'Standard support'], sort_order: 1 },
                    { id: '2', name: 'Silver', min_revenue: 50000, min_orders: 10, commission_bonus_pct: 5, badge_color: '#C0C0C0', perks: ['Priority support', '5% bonus commission', 'Marketing toolkit'], sort_order: 2 },
                    { id: '3', name: 'Gold', min_revenue: 200000, min_orders: 50, commission_bonus_pct: 10, badge_color: '#FFD700', perks: ['Dedicated account manager', '10% bonus commission', 'Premium marketing kit', 'Early access to IPOs'], sort_order: 3 },
                    { id: '4', name: 'Platinum', min_revenue: 500000, min_orders: 100, commission_bonus_pct: 15, badge_color: '#E5E4E2', perks: ['VIP support', '15% bonus commission', 'Custom marketing materials', 'Exclusive deals', 'Sub-agent management'], sort_order: 4 },
                ]);
            }

            const { count } = await supabase.from('agent_client_orders').select('*', { count: 'exact', head: true }).eq('agent_id', user.id).eq('status', 'paid');
            setOrderCount(count || (user.id === 'agt_1' ? 12 : 0));
            setLoading(false);
        };
        fetch();
    }, [user]);

    const totalEarned = Number(kycData?.total_earnings || 0);
    const currentTierName = kycData?.current_tier || 'Bronze';
    const currentTier = tiers.find(t => t.name === currentTierName) || tiers[0];
    const currentTierIdx = tiers.findIndex(t => t.name === currentTierName);
    const nextTier = currentTierIdx < tiers.length - 1 ? tiers[currentTierIdx + 1] : null;

    const revenueProgress = nextTier ? Math.min((totalEarned / nextTier.min_revenue) * 100, 100) : 100;
    const ordersProgress = nextTier ? Math.min((orderCount / nextTier.min_orders) * 100, 100) : 100;

    if (loading) return <div className="text-center p-8 text-muted">Loading Tiers...</div>;

    return (
        <div className="space-y-6">
            {/* Current Tier Card */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 flex items-center gap-6" style={{ background: `linear-gradient(135deg, ${currentTier?.badge_color}15, ${currentTier?.badge_color}05)` }}>
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${currentTier?.badge_color}, ${currentTier?.badge_color}CC)` }}>
                        <Icon name="TrophyIcon" size={36} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Your Current Tier</p>
                        <h2 className="text-3xl font-bold font-display text-foreground">{currentTierName}</h2>
                        {currentTier && currentTier.commission_bonus_pct > 0 && (
                            <p className="text-sm text-primary font-bold mt-1">+{currentTier.commission_bonus_pct}% Bonus Commission Active</p>
                        )}
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-sm text-muted">₹{totalEarned.toLocaleString()} earned</p>
                        <p className="text-sm text-muted">{orderCount} orders</p>
                    </div>
                </div>

                {/* Progress to Next Tier */}
                {nextTier && (
                    <div className="p-6 border-t border-border">
                        <h4 className="text-sm font-bold text-foreground mb-4">
                            Progress to <span style={{ color: nextTier.badge_color }}>{nextTier.name}</span>
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-muted font-medium">Revenue (₹{totalEarned.toLocaleString()} / ₹{nextTier.min_revenue.toLocaleString()})</span>
                                    <span className="font-bold text-foreground">{revenueProgress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${revenueProgress}%`, backgroundColor: nextTier.badge_color }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-muted font-medium">Orders ({orderCount} / {nextTier.min_orders})</span>
                                    <span className="font-bold text-foreground">{ordersProgress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${ordersProgress}%`, backgroundColor: nextTier.badge_color }} />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted mt-3">
                            {nextTier.min_revenue - totalEarned > 0 ? `₹${(nextTier.min_revenue - totalEarned).toLocaleString()} more revenue` : 'Revenue target met!'}
                            {' & '}
                            {nextTier.min_orders - orderCount > 0 ? `${nextTier.min_orders - orderCount} more orders` : 'Order target met!'}
                            {' needed to reach '}{nextTier.name}.
                        </p>
                    </div>
                )}
            </div>

            {/* All Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tiers.map(tier => {
                    const isCurrent = tier.name === currentTierName;
                    const isLocked = tier.sort_order > (currentTier?.sort_order || 0);

                    return (
                        <div key={tier.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isCurrent ? 'border-primary ring-2 ring-primary/20' : 'border-border'} ${isLocked ? 'opacity-70' : ''}`}>
                            <div className="p-5 text-center" style={{ background: `linear-gradient(135deg, ${tier.badge_color}20, transparent)` }}>
                                <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: `${tier.badge_color}30` }}>
                                    <Icon name={isLocked ? 'LockClosedIcon' : 'TrophyIcon'} size={24} style={{ color: tier.badge_color }} />
                                </div>
                                <h3 className="text-lg font-bold font-display text-foreground">{tier.name}</h3>
                                {isCurrent && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block">Current</span>}
                            </div>
                            <div className="p-5 border-t border-border space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Min Revenue</span>
                                    <span className="font-bold">₹{tier.min_revenue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Min Orders</span>
                                    <span className="font-bold">{tier.min_orders}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Bonus Commission</span>
                                    <span className="font-bold text-primary">+{tier.commission_bonus_pct}%</span>
                                </div>
                                <div className="pt-3 border-t border-border">
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Perks</p>
                                    <ul className="space-y-1.5">
                                        {tier.perks.map((perk, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-foreground">
                                                <Icon name="CheckCircleIcon" size={14} className="text-green-500 shrink-0" />
                                                {perk}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
