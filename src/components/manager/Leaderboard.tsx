'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';

export default function Leaderboard() {
    const { orders, leads, users, rmTargets, commissions } = useAppStore();

    const rms = users.filter(u => u.role === 'rm');
    const formatINR = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        return `₹${val.toLocaleString('en-IN')}`;
    };

    const leaderboard = rms.map(rm => {
        const assignedCustomers = users.filter(u => u.assignedRmId === rm.id).map(u => u.id);
        const rmOrders = orders.filter(o => assignedCustomers.includes(o.userId));
        const settled = rmOrders.filter(o => o.status === 'in_holding');
        const volume = settled.reduce((s, o) => s + o.price * o.quantity, 0);
        const target = rmTargets[rm.id] || 0;
        const achievement = target > 0 ? (volume / target) * 100 : 0;
        const rmLeads = leads.filter(l => l.assignedRmId === rm.id);
        const converted = rmLeads.filter(l => l.status === 'onboarded').length;
        const convRate = rmLeads.length > 0 ? (converted / rmLeads.length) * 100 : 0;
        const totalCommission = commissions.filter(c => c.rmId === rm.id).reduce((s, c) => s + c.commissionAmount, 0);

        // Composite score: 40% target achievement + 30% conversion + 30% volume weighted
        const score = (achievement * 0.4) + (convRate * 0.3) + (Math.min(100, (volume / 1000000) * 10) * 0.3);

        return {
            ...rm,
            volume,
            target,
            achievement,
            deals: rmOrders.length,
            settled: settled.length,
            leadsTotal: rmLeads.length,
            converted,
            convRate,
            totalCommission,
            score,
        };
    }).sort((a, b) => b.score - a.score);

    const medals = ['🥇', '🥈', '🥉'];
    const podiumColors = ['bg-amber-50 border-amber-200', 'bg-gray-50 border-gray-200', 'bg-orange-50 border-orange-200'];

    return (
        <>
            {/* Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {leaderboard.slice(0, 3).map((rm, i) => (
                    <Card key={rm.id} className={`border shadow-sm ${podiumColors[i] || 'bg-white border-border'} ${i === 0 ? 'md:order-2 md:scale-105' : i === 1 ? 'md:order-1' : 'md:order-3'}`}>
                        <CardContent className="pt-6 pb-5 text-center">
                            <div className="text-3xl mb-2">{medals[i]}</div>
                            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mx-auto mb-3 border-2 border-primary/20">
                                {rm.name.charAt(0)}
                            </div>
                            <h3 className="font-bold text-foreground mb-1">{rm.name}</h3>
                            <p className="text-xs text-muted mb-4">Score: {rm.score.toFixed(0)} pts</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white/80 rounded-lg p-2 border border-border/50">
                                    <p className="font-bold text-foreground">{formatINR(rm.volume)}</p>
                                    <p className="text-[10px] text-muted">Volume</p>
                                </div>
                                <div className="bg-white/80 rounded-lg p-2 border border-border/50">
                                    <p className="font-bold text-foreground">{rm.achievement.toFixed(0)}%</p>
                                    <p className="text-[10px] text-muted">Target</p>
                                </div>
                                <div className="bg-white/80 rounded-lg p-2 border border-border/50">
                                    <p className="font-bold text-foreground">{rm.settled}/{rm.deals}</p>
                                    <p className="text-[10px] text-muted">Settled</p>
                                </div>
                                <div className="bg-white/80 rounded-lg p-2 border border-border/50">
                                    <p className="font-bold text-foreground">{rm.convRate.toFixed(0)}%</p>
                                    <p className="text-[10px] text-muted">Conv. Rate</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Full Rankings Table */}
            {leaderboard.length > 3 && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Full Rankings</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        <div className="divide-y divide-border">
                            {leaderboard.slice(3).map((rm, i) => (
                                <div key={rm.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface/30">
                                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-sm font-bold text-muted">{i + 4}</div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{rm.name}</p>
                                        <p className="text-[10px] text-muted">{rm.deals} deals &middot; {formatINR(rm.volume)} volume</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">{rm.score.toFixed(0)} pts</p>
                                        <p className="text-[10px] text-muted">{rm.achievement.toFixed(0)}% target</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    );
}
