'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';

export default function DigestPage() {
    const { user } = useAuth();
    const { orders, companies, historicalPrices, blogs } = useAppStore();

    const userOrders = orders.filter(o => o.userId === user?.id);
    const settledOrders = userOrders.filter(o => o.status === 'in_holding');
    const activeOrders = userOrders.filter(o => ['requested', 'under_process', 'mail_sent'].includes(o.status));

    const digest = useMemo(() => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 86400000);

        // Holdings summary
        const holdings: Record<string, { name: string; sector: string; qty: number; invested: number; currentPrice: number; prevPrice: number }> = {};
        settledOrders.forEach(order => {
            const company = companies.find(c => c.id === order.companyId);
            if (!holdings[order.companyId]) {
                // Find price from ~7 days ago
                const companyPrices = historicalPrices
                    .filter(p => p.companyId === order.companyId)
                    .sort((a, b) => new Date(b.priceDate).getTime() - new Date(a.priceDate).getTime());
                const prevPrice = companyPrices.find(p => new Date(p.priceDate) <= weekAgo)?.priceValue || company?.currentAskPrice || order.price;

                holdings[order.companyId] = {
                    name: company?.name || order.companyName,
                    sector: company?.sector || 'Unknown',
                    qty: 0,
                    invested: 0,
                    currentPrice: company?.currentAskPrice || order.price,
                    prevPrice,
                };
            }
            holdings[order.companyId].qty += order.quantity;
            holdings[order.companyId].invested += order.price * order.quantity;
        });

        const holdingsList = Object.values(holdings);
        const totalInvested = holdingsList.reduce((s, h) => s + h.invested, 0);
        const currentValue = holdingsList.reduce((s, h) => s + (h.currentPrice * h.qty), 0);
        const prevValue = holdingsList.reduce((s, h) => s + (h.prevPrice * h.qty), 0);
        const weeklyChange = prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;
        const totalPnL = currentValue - totalInvested;
        const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

        // Price movers this week
        const movers = holdingsList.map(h => ({
            ...h,
            weekChange: h.prevPrice > 0 ? ((h.currentPrice - h.prevPrice) / h.prevPrice) * 100 : 0,
        })).sort((a, b) => Math.abs(b.weekChange) - Math.abs(a.weekChange));

        // Recent orders this week
        const recentOrders = userOrders.filter(o => new Date(o.createdAt) >= weekAgo);

        // Recent blogs
        const recentBlogs = blogs.filter(b => b.status === 'published' && new Date(b.publishedAt || b.createdAt) >= weekAgo);

        // News highlights (sector-based)
        const heldSectors = new Set(holdingsList.map(h => h.sector));

        return {
            holdingsList,
            totalInvested,
            currentValue,
            weeklyChange,
            totalPnL,
            totalPnLPct,
            movers,
            recentOrders,
            recentBlogs,
            heldSectors: [...heldSectors],
            activeOrdersCount: activeOrders.length,
            weekStart: weekAgo.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            weekEnd: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        };
    }, [settledOrders, companies, historicalPrices, userOrders, blogs, activeOrders]);

    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    const fetchAiDigest = useCallback(async () => {
        if (digest.holdingsList.length === 0) return;
        setAiLoading(true);
        try {
            const res = await fetch('/api/ai/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'digest',
                    portfolio: digest.holdingsList.map(h => ({
                        name: h.name, qty: h.qty, invested: h.invested,
                        currentPrice: h.currentPrice, weekChange: ((h.currentPrice - h.prevPrice) / h.prevPrice) * 100,
                    })),
                    movers: digest.movers.slice(0, 3).map(m => ({ name: m.name, weekChange: m.weekChange })),
                    weeklyChange: digest.weeklyChange,
                    totalPnL: digest.totalPnL,
                    totalPnLPct: digest.totalPnLPct,
                    activeOrders: digest.activeOrdersCount,
                    sectors: digest.heldSectors,
                }),
            });
            const data = await res.json();
            setAiSummary(data.analysis || null);
        } catch {
            setAiSummary('Unable to generate AI summary. Please try again.');
        } finally {
            setAiLoading(false);
        }
    }, [digest]);

    useEffect(() => {
        if (digest.holdingsList.length > 0 && !aiSummary && !aiLoading) {
            fetchAiDigest();
        }
    }, [digest.holdingsList.length]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-4xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Weekly Portfolio Digest</h1>
            </div>
            <p className="text-muted mt-1 mb-8">{digest.weekStart} — {digest.weekEnd}</p>

            {/* Portfolio Snapshot */}
            <Card className="border-border shadow-sm mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/5 to-blue-50 p-6">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-4">Portfolio Snapshot</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs text-muted font-medium mb-1">Current Value</p>
                            <p className="text-2xl font-bold text-foreground">₹{digest.currentValue.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted font-medium mb-1">Weekly Change</p>
                            <p className={`text-2xl font-bold ${digest.weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {digest.weeklyChange >= 0 ? '+' : ''}{digest.weeklyChange.toFixed(2)}%
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted font-medium mb-1">Total P&L</p>
                            <p className={`text-2xl font-bold ${digest.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {digest.totalPnL >= 0 ? '+' : ''}₹{Math.abs(digest.totalPnL).toLocaleString()}
                            </p>
                            <p className={`text-xs ${digest.totalPnLPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({digest.totalPnLPct >= 0 ? '+' : ''}{digest.totalPnLPct.toFixed(1)}%)
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted font-medium mb-1">Active Orders</p>
                            <p className="text-2xl font-bold text-foreground">{digest.activeOrdersCount}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* AI Weekly Briefing */}
            {digest.holdingsList.length > 0 && (
                <Card className="border-border shadow-sm mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/60 px-6 pt-5 pb-2">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Icon name="SparklesIcon" size={18} className="text-amber-600" />
                                <p className="text-[10px] uppercase tracking-widest font-bold text-amber-800">AI Weekly Briefing</p>
                            </div>
                            <button
                                onClick={fetchAiDigest}
                                disabled={aiLoading}
                                className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 disabled:opacity-50 transition-colors"
                            >
                                {aiLoading ? 'Generating...' : 'Refresh'}
                            </button>
                        </div>
                    </div>
                    <CardContent className="px-6 pb-5 pt-3">
                        {aiLoading && !aiSummary ? (
                            <div className="flex items-center gap-2 text-sm text-muted py-4 justify-center">
                                <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                Analyzing your portfolio...
                            </div>
                        ) : aiSummary ? (
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{aiSummary}</p>
                        ) : (
                            <p className="text-sm text-muted text-center py-2">Start investing to unlock your personalized AI digest.</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Price Movers */}
            {digest.movers.length > 0 && (
                <Card className="border-border shadow-sm mb-6">
                    <CardHeader className="border-b border-border/50 bg-white pb-3">
                        <div className="flex items-center gap-2">
                            <Icon name="ArrowsUpDownIcon" size={18} className="text-blue-600" />
                            <CardTitle className="font-display font-medium text-lg">Price Movers This Week</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {digest.movers.map((h, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border bg-white">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.weekChange >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <Icon name={h.weekChange >= 0 ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'} size={16} className={h.weekChange >= 0 ? 'text-green-600' : 'text-red-600'} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{h.name}</p>
                                        <p className="text-xs text-muted">{h.qty} shares · {h.sector}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-foreground">₹{h.currentPrice.toLocaleString()}</p>
                                    <p className={`text-xs font-semibold ${h.weekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {h.weekChange >= 0 ? '+' : ''}{h.weekChange.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Recent Orders */}
            {digest.recentOrders.length > 0 && (
                <Card className="border-border shadow-sm mb-6">
                    <CardHeader className="border-b border-border/50 bg-white pb-3">
                        <div className="flex items-center gap-2">
                            <Icon name="ClipboardDocumentListIcon" size={18} className="text-purple-600" />
                            <CardTitle className="font-display font-medium text-lg">Orders This Week</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        {digest.recentOrders.map(order => (
                            <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-white">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{order.companyName}</p>
                                    <p className="text-xs text-muted">
                                        {order.type.toUpperCase()} · {order.quantity} shares @ ₹{order.price.toLocaleString()}
                                    </p>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${order.status === 'in_holding' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {order.status.replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Sector Exposure */}
            <Card className="border-border shadow-sm mb-6">
                <CardHeader className="border-b border-border/50 bg-white pb-3">
                    <div className="flex items-center gap-2">
                        <Icon name="ChartPieIcon" size={18} className="text-amber-600" />
                        <CardTitle className="font-display font-medium text-lg">Sector Exposure</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {digest.holdingsList.length === 0 ? (
                        <p className="text-sm text-muted text-center py-4">No holdings yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {(() => {
                                const sectorTotals: Record<string, number> = {};
                                digest.holdingsList.forEach(h => {
                                    sectorTotals[h.sector] = (sectorTotals[h.sector] || 0) + (h.currentPrice * h.qty);
                                });
                                const total = Object.values(sectorTotals).reduce((s, v) => s + v, 0);

                                return Object.entries(sectorTotals)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([sector, amount]) => {
                                        const pct = total > 0 ? (amount / total) * 100 : 0;
                                        return (
                                            <div key={sector}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-foreground">{sector}</span>
                                                    <span className="text-sm font-bold text-foreground">{pct.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                                                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    });
                            })()}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Articles */}
            {digest.recentBlogs.length > 0 && (
                <Card className="border-border shadow-sm mb-6">
                    <CardHeader className="border-b border-border/50 bg-white pb-3">
                        <div className="flex items-center gap-2">
                            <Icon name="NewspaperIcon" size={18} className="text-blue-600" />
                            <CardTitle className="font-display font-medium text-lg">Articles Published This Week</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        {digest.recentBlogs.map(blog => (
                            <Link key={blog.id} href={`/blogs/${blog.slug}`}>
                                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-white hover:border-primary/20 transition-colors cursor-pointer">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{blog.title}</p>
                                        <p className="text-xs text-muted line-clamp-1">{blog.excerpt}</p>
                                    </div>
                                    <Icon name="ArrowRightIcon" size={14} className="text-muted shrink-0 ml-2" />
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
                <Button className="bg-primary text-white hover:bg-primary/90" asChild>
                    <Link href="/dashboard/customer/risk">View Risk Analysis</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/customer/scorecard">IPO Scorecard</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/shares">Explore Shares</Link>
                </Button>
            </div>
        </div>
    );
}
