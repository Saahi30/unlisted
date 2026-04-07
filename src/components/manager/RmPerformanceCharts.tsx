'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

interface RMPerformance {
    id: string;
    name: string;
    assignedDeals: number;
    pendingDocs: number;
    settledDeals: number;
    volume: number;
    target: number;
}

const COLORS = ['#C8A96E', '#1C2B3A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const formatINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
};

export default function RmPerformanceCharts({ rms }: { rms: RMPerformance[] }) {
    const barData = rms.map(rm => ({
        name: rm.name.split(' ')[0],
        actual: rm.volume,
        target: rm.target,
        percent: rm.target > 0 ? Math.round((rm.volume / rm.target) * 100) : 0,
    }));

    const statusData = rms.reduce(
        (acc, rm) => {
            acc[0].value += rm.settledDeals;
            acc[1].value += rm.pendingDocs;
            acc[2].value += rm.assignedDeals - rm.settledDeals - rm.pendingDocs;
            return acc;
        },
        [
            { name: 'Settled', value: 0 },
            { name: 'Pending Docs', value: 0 },
            { name: 'In Process', value: 0 },
        ]
    ).filter(d => d.value > 0);

    if (rms.length === 0) {
        return (
            <Card className="border-border shadow-sm">
                <CardContent className="p-12 text-center text-muted">
                    No RM data available yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-border shadow-sm lg:col-span-2">
                <CardHeader className="border-b border-border/50">
                    <CardTitle className="font-display text-lg font-medium">Actual vs Target</CardTitle>
                    <CardDescription className="text-muted">Revenue performance by RM against monthly targets.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                            <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
                            <Tooltip
                                formatter={(value: number, name: string) => [formatINR(value), name === 'actual' ? 'Actual' : 'Target']}
                                contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }}
                            />
                            <Legend
                                formatter={(value) => value === 'actual' ? 'Actual Volume' : 'Target'}
                                wrapperStyle={{ fontSize: 12 }}
                            />
                            <Bar dataKey="target" fill="var(--color-border)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="actual" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50">
                    <CardTitle className="font-display text-lg font-medium">Deal Status</CardTitle>
                    <CardDescription className="text-muted">Distribution across all RMs.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {statusData.map((_, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-4 mt-2 justify-center">
                        {statusData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2 text-xs font-medium text-muted">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                {entry.name} ({entry.value})
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
