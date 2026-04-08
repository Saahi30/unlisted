'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#C8A96E', '#3B82F6', '#10B981', '#F59E0B'];

export default function PipelineForecast() {
    const { orders, rmTargets, users } = useAppStore();

    const formatINR = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        return `₹${val.toLocaleString('en-IN')}`;
    };

    // Pipeline stages with conversion probabilities
    const stages = [
        { name: 'Requested', status: 'requested', probability: 0.3, color: '#F59E0B' },
        { name: 'Under Process', status: 'under_process', probability: 0.6, color: '#3B82F6' },
        { name: 'Mail Sent', status: 'mail_sent', probability: 0.9, color: '#C8A96E' },
        { name: 'Settled', status: 'in_holding', probability: 1.0, color: '#10B981' },
    ];

    const stageData = stages.map(stage => {
        const stageOrders = orders.filter(o => o.status === stage.status);
        const value = stageOrders.reduce((s, o) => s + o.price * o.quantity, 0);
        return {
            ...stage,
            count: stageOrders.length,
            value,
            weighted: value * stage.probability,
        };
    });

    const totalPipeline = stageData.reduce((s, d) => s + d.value, 0);
    const weightedForecast = stageData.reduce((s, d) => s + d.weighted, 0);
    const totalTarget = Object.values(rmTargets).reduce((s, t) => s + t, 0);
    const settled = stageData.find(s => s.status === 'in_holding')?.value || 0;
    const remainingToTarget = Math.max(0, totalTarget - settled);
    const forecastVsTarget = totalTarget > 0 ? (weightedForecast / totalTarget) * 100 : 0;

    // Monthly trend (simulated from order dates)
    const monthlyData = Array.from({ length: 4 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (3 - i));
        const month = d.toLocaleString('default', { month: 'short' });
        const monthOrders = orders.filter(o => {
            const od = new Date(o.createdAt);
            return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        });
        return {
            month,
            value: monthOrders.reduce((s, o) => s + o.price * o.quantity, 0),
            count: monthOrders.length,
        };
    });

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{formatINR(totalPipeline)}</p>
                        <p className="text-xs text-muted uppercase tracking-wider mt-1">Total Pipeline</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4 text-center">
                        <p className="text-2xl font-bold text-accent">{formatINR(weightedForecast)}</p>
                        <p className="text-xs text-muted uppercase tracking-wider mt-1">Weighted Forecast</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{forecastVsTarget.toFixed(0)}%</p>
                        <p className="text-xs text-muted uppercase tracking-wider mt-1">Forecast vs Target</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{formatINR(remainingToTarget)}</p>
                        <p className="text-xs text-muted uppercase tracking-wider mt-1">Gap to Target</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Pipeline Funnel */}
                <Card className="border-border shadow-sm lg:col-span-2">
                    <CardHeader className="border-b border-border/50">
                        <CardTitle className="font-display text-lg font-medium">Pipeline Funnel</CardTitle>
                        <CardDescription className="text-muted">Stage-wise breakdown with weighted conversion probabilities.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {stageData.map((stage, i) => {
                                const maxValue = Math.max(...stageData.map(s => s.value));
                                const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                                return (
                                    <div key={stage.status}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                                                <span className="text-sm font-medium">{stage.name}</span>
                                                <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded border border-border">{stage.count} orders</span>
                                            </div>
                                            <div className="text-right text-xs">
                                                <span className="font-bold">{formatINR(stage.value)}</span>
                                                <span className="text-muted ml-2">({(stage.probability * 100)}% prob)</span>
                                            </div>
                                        </div>
                                        <div className="h-6 bg-surface rounded-lg overflow-hidden border border-border/50">
                                            <div className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                                                style={{ width: `${Math.max(5, width)}%`, backgroundColor: stage.color }}>
                                                <span className="text-[10px] text-white font-bold">{formatINR(stage.weighted)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Stage Distribution Pie */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50">
                        <CardTitle className="font-display text-lg font-medium">Stage Distribution</CardTitle>
                        <CardDescription className="text-muted">Order count by status.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 flex flex-col items-center">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={stageData.filter(s => s.count > 0)} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="count">
                                    {stageData.filter(s => s.count > 0).map((s, i) => <Cell key={i} fill={s.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-3 mt-2 justify-center">
                            {stageData.filter(s => s.count > 0).map(s => (
                                <div key={s.status} className="flex items-center gap-1.5 text-xs text-muted">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                    {s.name} ({s.count})
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Trend */}
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50">
                    <CardTitle className="font-display text-lg font-medium">Monthly Volume Trend</CardTitle>
                    <CardDescription className="text-muted">Order value trend over the last 4 months.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                            <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
                            <Tooltip formatter={(v) => [formatINR(Number(v ?? 0)), 'Volume']} contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }} />
                            <Bar dataKey="value" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </>
    );
}
