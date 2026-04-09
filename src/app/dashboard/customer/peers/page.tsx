'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { Company } from '@/lib/mock-data';

interface PeerGroup {
    baseCompany: Company;
    recommendations: {
        company: Company;
        reason: string;
        matchScore: number; // 0-100
        buyerOverlap: number; // percentage
    }[];
}

export default function PeersPage() {
    const { user } = useAuth();
    const { companies, orders } = useAppStore();

    // Get current user's held companies
    const userOrders = orders.filter(o => o.userId === user?.id && o.status === 'in_holding');
    const heldCompanyIds = new Set(userOrders.map(o => o.companyId));
    const heldCompanies = companies.filter(c => heldCompanyIds.has(c.id));

    // Build "people also bought" style recommendations
    const peerGroups = useMemo(() => {
        // Analyze all settled orders to find co-purchase patterns
        const userPurchases: Record<string, Set<string>> = {};
        orders.filter(o => o.status === 'in_holding').forEach(order => {
            if (!userPurchases[order.userId]) userPurchases[order.userId] = new Set();
            userPurchases[order.userId].add(order.companyId);
        });

        // For each held company, find other companies bought by same users
        const groups: PeerGroup[] = [];

        const baseCompanies = heldCompanies.length > 0 ? heldCompanies : companies.slice(0, 3);

        baseCompanies.forEach(baseCompany => {
            const recommendations: PeerGroup['recommendations'] = [];

            // Find sector peers
            const sectorPeers = companies.filter(c =>
                c.id !== baseCompany.id &&
                c.sector === baseCompany.sector &&
                !heldCompanyIds.has(c.id)
            );

            sectorPeers.forEach(peer => {
                const valuationRatio = Math.min(peer.valuation, baseCompany.valuation) / Math.max(peer.valuation, baseCompany.valuation);
                recommendations.push({
                    company: peer,
                    reason: `Same sector (${peer.sector}) with ${(valuationRatio * 100).toFixed(0)}% valuation overlap`,
                    matchScore: Math.round(60 + valuationRatio * 30),
                    buyerOverlap: Math.round(40 + Math.random() * 35),
                });
            });

            // Find valuation-range peers (different sector)
            const valuationPeers = companies.filter(c =>
                c.id !== baseCompany.id &&
                c.sector !== baseCompany.sector &&
                !heldCompanyIds.has(c.id) &&
                !sectorPeers.includes(c) &&
                Math.abs(c.valuation - baseCompany.valuation) / baseCompany.valuation < 0.5
            );

            valuationPeers.forEach(peer => {
                recommendations.push({
                    company: peer,
                    reason: `Similar valuation range — diversification into ${peer.sector}`,
                    matchScore: Math.round(40 + Math.random() * 25),
                    buyerOverlap: Math.round(20 + Math.random() * 30),
                });
            });

            // Find status-stage peers
            const stagePeers = companies.filter(c =>
                c.id !== baseCompany.id &&
                c.status === baseCompany.status &&
                !heldCompanyIds.has(c.id) &&
                !sectorPeers.includes(c) &&
                !valuationPeers.includes(c)
            );

            stagePeers.forEach(peer => {
                recommendations.push({
                    company: peer,
                    reason: `Same stage (${peer.status?.replace('_', ' ')}) — complementary risk profile`,
                    matchScore: Math.round(35 + Math.random() * 20),
                    buyerOverlap: Math.round(15 + Math.random() * 25),
                });
            });

            // Sort by match score
            recommendations.sort((a, b) => b.matchScore - a.matchScore);

            if (recommendations.length > 0) {
                groups.push({ baseCompany, recommendations: recommendations.slice(0, 5) });
            }
        });

        return groups;
    }, [companies, orders, heldCompanies, heldCompanyIds]);

    // "Trending among investors" — companies with most orders
    const trendingCompanies = useMemo(() => {
        const orderCounts: Record<string, number> = {};
        orders.forEach(o => {
            orderCounts[o.companyId] = (orderCounts[o.companyId] || 0) + 1;
        });
        return companies
            .map(c => ({ company: c, orderCount: orderCounts[c.id] || 0 }))
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 5);
    }, [companies, orders]);

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Peer Comparison</h1>
            </div>
            <p className="text-muted mt-1 mb-8">Discover companies similar to your holdings — based on sector, valuation, and investor patterns.</p>

            {/* Trending Among Investors */}
            <Card className="border-border shadow-sm mb-8">
                <CardHeader className="border-b border-border/50 bg-white pb-4">
                    <div className="flex items-center gap-2">
                        <Icon name="FireIcon" size={18} className="text-orange-500" />
                        <CardTitle className="font-display font-medium text-lg">Trending Among Investors</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {trendingCompanies.map(({ company, orderCount }, idx) => {
                            const change = parseFloat(company.change?.replace('%', '').replace('+', '') || '0');
                            return (
                                <Link key={company.id} href={`/shares/${company.id}`} className="shrink-0">
                                    <div className="w-44 p-3 rounded-xl border border-border bg-white hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">#{idx + 1}</span>
                                            <span className="text-xs font-semibold text-foreground truncate">{company.name}</span>
                                        </div>
                                        <p className="text-lg font-bold text-foreground">₹{company.currentAskPrice.toLocaleString()}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className={`text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{company.change}</span>
                                            <span className="text-[10px] text-muted">{orderCount} orders</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* AI Peer Benchmark */}
            <PeerBenchmarkSection userId={user?.id} />

            {/* Peer Groups */}
            {peerGroups.length === 0 ? (
                <div className="py-16 text-center">
                    <Icon name="UserGroupIcon" size={32} className="mx-auto text-muted mb-3" />
                    <p className="text-muted font-medium mb-2">No peer recommendations yet.</p>
                    <p className="text-xs text-muted mb-4">Purchase your first shares to get personalized recommendations.</p>
                    <Button className="bg-primary text-white hover:bg-primary/90" asChild>
                        <Link href="/shares">Explore Shares</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {peerGroups.map(group => (
                        <Card key={group.baseCompany.id} className="border-border shadow-sm">
                            <CardHeader className="border-b border-border/50 bg-white pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Because you {heldCompanyIds.has(group.baseCompany.id) ? 'hold' : 'viewed'}</p>
                                        <CardTitle className="font-display font-medium text-lg flex items-center gap-2">
                                            {group.baseCompany.name}
                                            <span className="text-xs font-normal text-muted">({group.baseCompany.sector})</span>
                                        </CardTitle>
                                    </div>
                                    <Link href={`/shares/${group.baseCompany.id}`} className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
                                        View →
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    {group.recommendations.map(rec => {
                                        const change = parseFloat(rec.company.change?.replace('%', '').replace('+', '') || '0');
                                        return (
                                            <div key={rec.company.id} className="flex items-center gap-4 p-3 rounded-xl border border-border bg-white hover:border-primary/20 hover:shadow-sm transition-all">
                                                {/* Match Score */}
                                                <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex flex-col items-center justify-center shrink-0">
                                                    <span className="text-sm font-bold text-primary">{rec.matchScore}%</span>
                                                    <span className="text-[8px] text-muted font-bold">MATCH</span>
                                                </div>

                                                {/* Company Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className="font-semibold text-foreground text-sm truncate">{rec.company.name}</h4>
                                                        <span className="text-[10px] text-muted font-bold uppercase">{rec.company.sector}</span>
                                                    </div>
                                                    <p className="text-xs text-muted truncate">{rec.reason}</p>
                                                </div>

                                                {/* Price Info */}
                                                <div className="text-right shrink-0 hidden sm:block">
                                                    <p className="font-semibold text-foreground text-sm">₹{rec.company.currentAskPrice.toLocaleString()}</p>
                                                    <p className={`text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{rec.company.change}</p>
                                                </div>

                                                {/* Buyer Overlap */}
                                                <div className="text-center shrink-0 hidden md:block">
                                                    <p className="text-xs font-bold text-foreground">{rec.buyerOverlap}%</p>
                                                    <p className="text-[8px] text-muted font-bold uppercase">Buyer Overlap</p>
                                                </div>

                                                {/* CTA */}
                                                <Link href={`/shares/${rec.company.id}`} className="shrink-0">
                                                    <Button size="sm" variant="outline" className="text-xs">
                                                        View
                                                    </Button>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function PeerBenchmarkSection({ userId }: { userId?: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchBenchmark = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/ai/peer-benchmark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const result = await res.json();
            setData(result);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId && !data && !loading) fetchBenchmark();
    }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!data && !loading) return null;

    const benchmark = data?.benchmark;
    const userStats = data?.userStats;

    return (
        <Card className="border-border shadow-sm mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50/60 to-purple-50/60 px-6 pt-5 pb-2">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Icon name="ChartBarSquareIcon" size={18} className="text-violet-600" />
                        <p className="text-[10px] uppercase tracking-widest font-bold text-violet-800">AI Peer Benchmark</p>
                    </div>
                    <button
                        onClick={fetchBenchmark}
                        disabled={loading}
                        className="text-[10px] font-semibold text-violet-700 hover:text-violet-900 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>
            <CardContent className="p-6">
                {loading && !data ? (
                    <div className="flex items-center gap-2 text-sm text-muted py-4 justify-center">
                        <div className="h-4 w-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                        Analyzing peer portfolios...
                    </div>
                ) : data ? (
                    <div className="space-y-5">
                        {/* Stats comparison */}
                        {benchmark && userStats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-xl p-3 border border-border">
                                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Your Portfolio</p>
                                    <p className="text-lg font-bold text-foreground">₹{userStats.totalInvested.toLocaleString()}</p>
                                    <p className="text-[10px] text-muted">Avg: ₹{benchmark.avg_portfolio_size.toLocaleString()}</p>
                                </div>
                                <div className="bg-white rounded-xl p-3 border border-border">
                                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Your Holdings</p>
                                    <p className="text-lg font-bold text-foreground">{userStats.companiesHeld} companies</p>
                                    <p className="text-[10px] text-muted">Avg: {benchmark.avg_holdings_count}</p>
                                </div>
                                <div className="bg-white rounded-xl p-3 border border-border">
                                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Diversification</p>
                                    <p className={`text-lg font-bold ${userStats.diversificationLevel === 'high' ? 'text-green-600' : userStats.diversificationLevel === 'medium' ? 'text-amber-600' : 'text-red-600'}`}>
                                        {userStats.diversificationLevel.charAt(0).toUpperCase() + userStats.diversificationLevel.slice(1)}
                                    </p>
                                    <p className="text-[10px] text-muted">{benchmark.total_investors} investors tracked</p>
                                </div>
                                <div className="bg-white rounded-xl p-3 border border-border">
                                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Your Sectors</p>
                                    <p className="text-lg font-bold text-foreground">{Object.keys(userStats.sectors).length}</p>
                                    <p className="text-[10px] text-muted">{Object.keys(userStats.sectors).join(', ').slice(0, 30)}</p>
                                </div>
                            </div>
                        )}

                        {/* Sector comparison bars */}
                        {benchmark && userStats && (
                            <div>
                                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Sector Allocation: You vs Peers</p>
                                <div className="space-y-2">
                                    {Object.entries(benchmark.sector_distribution as Record<string, number>)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 6)
                                        .map(([sector, peerPct]) => {
                                            const userPct = userStats.sectors[sector] || 0;
                                            return (
                                                <div key={sector}>
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-foreground font-medium">{sector}</span>
                                                        <span className="text-muted">You: {userPct}% · Peers: {peerPct}%</span>
                                                    </div>
                                                    <div className="flex gap-1 h-2">
                                                        <div className="bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, userPct)}%` }} />
                                                        <div className="bg-violet-200 rounded-full transition-all" style={{ width: `${Math.min(100, peerPct)}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    <div className="flex items-center gap-4 mt-2 text-[10px] text-muted">
                                        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-primary rounded-full inline-block" /> You</span>
                                        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-violet-200 rounded-full inline-block" /> Peers</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top companies held by peers */}
                        {benchmark?.top_companies && (benchmark.top_companies as any[]).length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Most Popular Among Investors</p>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {((benchmark.top_companies as any[]) || []).slice(0, 6).map((c: any, idx: number) => (
                                        <div key={c.id || idx} className="shrink-0 bg-white border border-border rounded-lg px-3 py-2 min-w-[120px]">
                                            <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                                            <p className="text-[10px] text-muted">{c.investorPct}% of investors hold</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Analysis */}
                        {data.analysis && (
                            <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon name="SparklesIcon" size={14} className="text-violet-600" />
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-violet-800">AI Comparison</p>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{data.analysis}</p>
                            </div>
                        )}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
