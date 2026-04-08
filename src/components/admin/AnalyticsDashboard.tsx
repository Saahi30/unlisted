'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';

export default function AnalyticsDashboard() {
    const { orders, users, companies, leads } = useAppStore();
    const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

    const now = new Date();
    const periodMs = period === '7d' ? 7 * 86400000 : period === '30d' ? 30 * 86400000 : period === '90d' ? 90 * 86400000 : Infinity;
    const cutoff = new Date(now.getTime() - periodMs);

    const periodOrders = useMemo(() =>
        period === 'all' ? orders : orders.filter(o => new Date(o.createdAt) >= cutoff),
        [orders, period]
    );

    // Revenue metrics
    const totalRevenue = periodOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const settledRevenue = periodOrders.filter(o => o.status === 'in_holding').reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = periodOrders.length > 0 ? totalRevenue / periodOrders.length : 0;

    // Conversion: requested -> in_holding
    const completedOrders = periodOrders.filter(o => o.status === 'in_holding').length;
    const conversionRate = periodOrders.length > 0 ? ((completedOrders / periodOrders.length) * 100).toFixed(1) : '0';

    // Orders by company
    const companyVolume = useMemo(() => {
        const map: Record<string, { name: string; count: number; value: number }> = {};
        periodOrders.forEach(o => {
            if (!map[o.companyId]) map[o.companyId] = { name: o.companyName, count: 0, value: 0 };
            map[o.companyId].count++;
            map[o.companyId].value += o.totalAmount;
        });
        return Object.values(map).sort((a, b) => b.value - a.value);
    }, [periodOrders]);

    // Top RMs by order value
    const rmPerformance = useMemo(() => {
        const rmOrders: Record<string, { name: string; orders: number; value: number }> = {};
        const customerRmMap: Record<string, string> = {};
        users.forEach(u => { if (u.assignedRmId) customerRmMap[u.id] = u.assignedRmId; });

        periodOrders.forEach(o => {
            const rmId = customerRmMap[o.userId];
            if (rmId) {
                const rm = users.find(u => u.id === rmId);
                if (!rmOrders[rmId]) rmOrders[rmId] = { name: rm?.name || rmId, orders: 0, value: 0 };
                rmOrders[rmId].orders++;
                rmOrders[rmId].value += o.totalAmount;
            }
        });
        return Object.values(rmOrders).sort((a, b) => b.value - a.value);
    }, [periodOrders, users]);

    // Orders over time (group by date)
    const orderTimeline = useMemo(() => {
        const map: Record<string, { date: string; count: number; value: number }> = {};
        periodOrders.forEach(o => {
            const date = o.createdAt.split('T')[0];
            if (!map[date]) map[date] = { date, count: 0, value: 0 };
            map[date].count++;
            map[date].value += o.totalAmount;
        });
        return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    }, [periodOrders]);

    // Customer acquisition
    const customerCount = users.filter(u => u.role === 'customer').length;
    const leadCount = leads.length;
    const convertedLeads = leads.filter(l => l.status === 'onboarded').length;
    const leadConversionRate = leadCount > 0 ? ((convertedLeads / leadCount) * 100).toFixed(1) : '0';

    // Status distribution
    const statusDist = [
        { status: 'Requested', count: periodOrders.filter(o => o.status === 'requested').length, color: 'bg-amber-500' },
        { status: 'Under Process', count: periodOrders.filter(o => o.status === 'under_process').length, color: 'bg-blue-500' },
        { status: 'Mail Sent', count: periodOrders.filter(o => o.status === 'mail_sent').length, color: 'bg-purple-500' },
        { status: 'In Holding', count: periodOrders.filter(o => o.status === 'in_holding').length, color: 'bg-green-500' },
    ];
    const maxBarVal = Math.max(...orderTimeline.map(d => d.value), 1);

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
                {(['7d', '30d', '90d', 'all'] as const).map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${period === p ? 'bg-primary text-white shadow-sm' : 'bg-white border border-border text-muted hover:border-primary/30'}`}
                    >
                        {p === 'all' ? 'All Time' : p}
                    </button>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-green-50 rounded-lg"><Icon name="BanknotesIcon" size={16} className="text-green-600" /></div>
                        </div>
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Revenue</div>
                        <div className="text-xl font-bold">₹{(totalRevenue / 100000).toFixed(1)}L</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-blue-50 rounded-lg"><Icon name="CheckCircleIcon" size={16} className="text-blue-600" /></div>
                        </div>
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Settled</div>
                        <div className="text-xl font-bold">₹{(settledRevenue / 100000).toFixed(1)}L</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-purple-50 rounded-lg"><Icon name="ShoppingCartIcon" size={16} className="text-purple-600" /></div>
                        </div>
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Orders</div>
                        <div className="text-xl font-bold">{periodOrders.length}</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-amber-50 rounded-lg"><Icon name="ReceiptPercentIcon" size={16} className="text-amber-600" /></div>
                        </div>
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Avg Order</div>
                        <div className="text-xl font-bold">₹{avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-green-50 rounded-lg"><Icon name="ArrowTrendingUpIcon" size={16} className="text-green-600" /></div>
                        </div>
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Conversion</div>
                        <div className="text-xl font-bold">{conversionRate}%</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-indigo-50 rounded-lg"><Icon name="UsersIcon" size={16} className="text-indigo-600" /></div>
                        </div>
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Customers</div>
                        <div className="text-xl font-bold">{customerCount}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Timeline (Bar Chart) */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Revenue Timeline</CardTitle>
                        <CardDescription>Daily order volume</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {orderTimeline.length === 0 ? (
                            <p className="text-sm text-muted italic text-center py-8">No orders in this period.</p>
                        ) : (
                            <div className="space-y-2">
                                {orderTimeline.slice(-15).map(d => (
                                    <div key={d.date} className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono text-muted w-20 shrink-0">{d.date.slice(5)}</span>
                                        <div className="flex-1 h-6 bg-surface/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary/80 rounded-full transition-all"
                                                style={{ width: `${(d.value / maxBarVal) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold w-20 text-right">₹{(d.value / 1000).toFixed(0)}K</span>
                                        <span className="text-[10px] text-muted w-8 text-right">{d.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Order Status Distribution */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Order Status Distribution</CardTitle>
                        <CardDescription>Current pipeline breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {statusDist.map(s => (
                                <div key={s.status}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">{s.status}</span>
                                        <span className="text-sm font-bold">{s.count}</span>
                                    </div>
                                    <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
                                        <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${periodOrders.length > 0 ? (s.count / periodOrders.length) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Funnel */}
                        <div className="mt-8 pt-6 border-t border-border/50">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Customer Acquisition Funnel</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-full bg-blue-100 rounded-lg py-3 px-4 text-center">
                                        <span className="text-sm font-bold text-blue-700">Leads: {leadCount}</span>
                                    </div>
                                </div>
                                <div className="flex justify-center"><Icon name="ChevronDownIcon" size={16} className="text-muted" /></div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4/5 mx-auto bg-green-100 rounded-lg py-3 px-4 text-center">
                                        <span className="text-sm font-bold text-green-700">Converted: {convertedLeads} ({leadConversionRate}%)</span>
                                    </div>
                                </div>
                                <div className="flex justify-center"><Icon name="ChevronDownIcon" size={16} className="text-muted" /></div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3/5 mx-auto bg-primary/10 rounded-lg py-3 px-4 text-center">
                                        <span className="text-sm font-bold text-primary">Active Customers: {customerCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Companies */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Top Companies by Volume</CardTitle>
                        <CardDescription>Ranked by total order value</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {companyVolume.slice(0, 10).map((c, i) => (
                                <div key={c.name} className="flex items-center gap-4 px-6 py-3 hover:bg-surface/30">
                                    <span className="text-xs font-bold text-muted w-6">{i + 1}</span>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{c.name}</div>
                                        <div className="text-xs text-muted">{c.count} orders</div>
                                    </div>
                                    <span className="font-bold text-sm">₹{(c.value / 100000).toFixed(1)}L</span>
                                </div>
                            ))}
                            {companyVolume.length === 0 && (
                                <div className="px-6 py-8 text-center text-sm text-muted italic">No data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top RMs */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Top Performing RMs</CardTitle>
                        <CardDescription>Ranked by transaction value</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {rmPerformance.slice(0, 10).map((rm, i) => (
                                <div key={rm.name} className="flex items-center gap-4 px-6 py-3 hover:bg-surface/30">
                                    <span className="text-xs font-bold text-muted w-6">{i + 1}</span>
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                                        {rm.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{rm.name}</div>
                                        <div className="text-xs text-muted">{rm.orders} orders</div>
                                    </div>
                                    <span className="font-bold text-sm">₹{(rm.value / 100000).toFixed(1)}L</span>
                                </div>
                            ))}
                            {rmPerformance.length === 0 && (
                                <div className="px-6 py-8 text-center text-sm text-muted italic">No RM data available</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
