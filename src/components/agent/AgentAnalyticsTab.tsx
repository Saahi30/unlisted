'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';

export default function AgentAnalyticsTab() {
    const { user } = useAuth();
    const supabase = createClient();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('agent_client_orders')
                .select('*')
                .eq('agent_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setOrders(data);
            } else if (user.id === 'agt_1') {
                const now = Date.now();
                setOrders([
                    { id: '1', status: 'paid', selling_price: 180, quantity: 50, agent_earnings: 2500, created_at: new Date(now - 86400000 * 1).toISOString() },
                    { id: '2', status: 'paid', selling_price: 340, quantity: 100, agent_earnings: 5000, created_at: new Date(now - 86400000 * 3).toISOString() },
                    { id: '3', status: 'pending', selling_price: 220, quantity: 75, agent_earnings: 0, created_at: new Date(now - 86400000 * 5).toISOString() },
                    { id: '4', status: 'paid', selling_price: 150, quantity: 200, agent_earnings: 10000, created_at: new Date(now - 86400000 * 8).toISOString() },
                    { id: '5', status: 'cancelled', selling_price: 280, quantity: 30, agent_earnings: 0, created_at: new Date(now - 86400000 * 12).toISOString() },
                    { id: '6', status: 'paid', selling_price: 420, quantity: 60, agent_earnings: 3600, created_at: new Date(now - 86400000 * 15).toISOString() },
                    { id: '7', status: 'pending', selling_price: 190, quantity: 100, agent_earnings: 0, created_at: new Date(now - 86400000 * 20).toISOString() },
                    { id: '8', status: 'paid', selling_price: 310, quantity: 80, agent_earnings: 4800, created_at: new Date(now - 86400000 * 25).toISOString() },
                    { id: '9', status: 'paid', selling_price: 250, quantity: 150, agent_earnings: 7500, created_at: new Date(now - 86400000 * 45).toISOString() },
                    { id: '10', status: 'cancelled', selling_price: 170, quantity: 50, agent_earnings: 0, created_at: new Date(now - 86400000 * 60).toISOString() },
                ]);
            }
            setLoading(false);
        };
        fetchOrders();
    }, [user]);

    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 99999;
    const cutoff = new Date(Date.now() - 86400000 * periodDays);
    const filtered = orders.filter(o => new Date(o.created_at) >= cutoff);

    const totalLinks = filtered.length;
    const paidOrders = filtered.filter(o => o.status === 'paid');
    const pendingOrders = filtered.filter(o => o.status === 'pending');
    const cancelledOrders = filtered.filter(o => o.status === 'cancelled');

    const conversionRate = totalLinks > 0 ? ((paidOrders.length / totalLinks) * 100).toFixed(1) : '0';
    const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.selling_price || 0) * Number(o.quantity || 0), 0);
    const totalEarnings = paidOrders.reduce((s, o) => s + Number(o.agent_earnings || 0), 0);
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // Generate daily data for chart
    const dailyData: Record<string, { links: number; paid: number; earnings: number }> = {};
    const chartDays = Math.min(periodDays, 30);
    for (let i = chartDays - 1; i >= 0; i--) {
        const d = new Date(Date.now() - 86400000 * i);
        const key = d.toISOString().split('T')[0];
        dailyData[key] = { links: 0, paid: 0, earnings: 0 };
    }
    filtered.forEach(o => {
        const key = new Date(o.created_at).toISOString().split('T')[0];
        if (dailyData[key]) {
            dailyData[key].links++;
            if (o.status === 'paid') {
                dailyData[key].paid++;
                dailyData[key].earnings += Number(o.agent_earnings || 0);
            }
        }
    });

    const chartEntries = Object.entries(dailyData);
    const maxEarnings = Math.max(...chartEntries.map(([, v]) => v.earnings), 1);
    const maxLinks = Math.max(...chartEntries.map(([, v]) => v.links), 1);

    if (loading) return <div className="text-center p-8 text-muted">Loading Analytics...</div>;

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
                {(['7d', '30d', '90d', 'all'] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === p ? 'bg-primary text-white shadow-sm' : 'bg-white text-muted border border-border hover:text-foreground'}`}>
                        {p === 'all' ? 'All Time' : p}
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Links Generated</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{totalLinks}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Paid Orders</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">{paidOrders.length}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Conversion Rate</p>
                    <p className="text-2xl font-bold text-primary mt-2">{conversionRate}%</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground mt-2">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-5 border border-primary/20 shadow-sm">
                    <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">My Earnings</p>
                    <p className="text-2xl font-bold text-primary mt-2">₹{totalEarnings.toLocaleString()}</p>
                </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                <h3 className="font-display font-bold text-lg mb-6">Conversion Funnel</h3>
                <div className="flex items-end justify-center gap-8">
                    {[
                        { label: 'Links Generated', value: totalLinks, color: 'bg-blue-500' },
                        { label: 'Pending', value: pendingOrders.length, color: 'bg-amber-500' },
                        { label: 'Converted', value: paidOrders.length, color: 'bg-green-500' },
                        { label: 'Cancelled', value: cancelledOrders.length, color: 'bg-red-400' },
                    ].map((step, i) => {
                        const height = totalLinks > 0 ? Math.max((step.value / totalLinks) * 200, 20) : 20;
                        return (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                                <span className="text-xl font-bold text-foreground">{step.value}</span>
                                <div className={`w-full rounded-t-lg ${step.color} transition-all duration-500`} style={{ height: `${height}px` }} />
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider text-center">{step.label}</span>
                                {i < 3 && totalLinks > 0 && (
                                    <span className="text-[9px] text-muted">
                                        {((step.value / totalLinks) * 100).toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Earnings Chart (CSS-based bar chart) */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                <h3 className="font-display font-bold text-lg mb-2">Daily Earnings Trend</h3>
                <p className="text-xs text-muted mb-6">Earnings per day over the selected period</p>
                <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                    {chartEntries.map(([date, data]) => (
                        <div key={date} className="flex flex-col items-center gap-1 flex-1 min-w-[20px] group relative">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-white text-[9px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                ₹{data.earnings.toLocaleString()} | {data.links} links
                            </div>
                            <div className="w-full bg-primary/80 rounded-t transition-all duration-300 hover:bg-primary" style={{ height: `${(data.earnings / maxEarnings) * 140}px`, minHeight: data.earnings > 0 ? '4px' : '0px' }} />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-[9px] text-muted">{chartEntries[0]?.[0]?.slice(5)}</span>
                    <span className="text-[9px] text-muted">{chartEntries[chartEntries.length - 1]?.[0]?.slice(5)}</span>
                </div>
            </div>

            {/* Links Activity Chart */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                <h3 className="font-display font-bold text-lg mb-2">Daily Link Activity</h3>
                <p className="text-xs text-muted mb-6">Links generated vs converted per day</p>
                <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
                    {chartEntries.map(([date, data]) => (
                        <div key={date} className="flex flex-col items-center gap-0 flex-1 min-w-[20px] group relative">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-white text-[9px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {date.slice(5)}: {data.links} links, {data.paid} paid
                            </div>
                            <div className="w-full flex flex-col items-center gap-0">
                                <div className="w-full bg-blue-200 rounded-t" style={{ height: `${(data.links / maxLinks) * 100}px`, minHeight: data.links > 0 ? '3px' : '0px' }} />
                                <div className="w-full bg-green-500 rounded-b" style={{ height: `${(data.paid / maxLinks) * 100}px`, minHeight: data.paid > 0 ? '3px' : '0px' }} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-6 mt-4 justify-center">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-200" /><span className="text-xs text-muted">Generated</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500" /><span className="text-xs text-muted">Converted</span></div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Avg. Order Value</p>
                    <p className="text-xl font-bold text-foreground mt-2">₹{avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Pending Value</p>
                    <p className="text-xl font-bold text-amber-600 mt-2">₹{pendingOrders.reduce((s, o) => s + Number(o.selling_price || 0) * Number(o.quantity || 0), 0).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Avg. Earnings/Order</p>
                    <p className="text-xl font-bold text-foreground mt-2">₹{paidOrders.length > 0 ? (totalEarnings / paidOrders.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}</p>
                </div>
            </div>
        </div>
    );
}
