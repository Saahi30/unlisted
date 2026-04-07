'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';

export default function RmTargetTrackingTab() {
    const { users, orders, leads, rmTargets, updateRmTarget, teams } = useAppStore();
    const [editingRm, setEditingRm] = useState<string | null>(null);
    const [targetValue, setTargetValue] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const rms = users.filter(u => u.role === 'rm');

    const rmStats = rms.map(rm => {
        const rmCustomers = users.filter(u => u.assignedRmId === rm.id);
        const customerIds = new Set(rmCustomers.map(c => c.id));
        const rmOrders = orders.filter(o => customerIds.has(o.userId));
        const settledOrders = rmOrders.filter(o => o.status === 'in_holding');
        const totalValue = rmOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const settledValue = settledOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const target = rmTargets[rm.id] || 0;
        const progress = target > 0 ? Math.min((settledValue / target) * 100, 100) : 0;
        const rmLeads = leads.filter(l => l.assignedRmId === rm.id);
        const convertedLeads = rmLeads.filter(l => l.status === 'converted').length;
        const team = teams.find(t => t.rmIds.includes(rm.id));

        return {
            id: rm.id,
            name: rm.name,
            email: rm.email,
            team: team?.name || 'Unassigned',
            customers: rmCustomers.length,
            totalOrders: rmOrders.length,
            totalValue,
            settledValue,
            target,
            progress,
            leads: rmLeads.length,
            convertedLeads,
            conversionRate: rmLeads.length > 0 ? ((convertedLeads / rmLeads.length) * 100).toFixed(0) : '0',
        };
    }).filter(rm => rm.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const totalTarget = rmStats.reduce((sum, rm) => sum + rm.target, 0);
    const totalSettled = rmStats.reduce((sum, rm) => sum + rm.settledValue, 0);
    const overallProgress = totalTarget > 0 ? ((totalSettled / totalTarget) * 100).toFixed(1) : '0';

    const handleSaveTarget = (rmId: string) => {
        updateRmTarget(rmId, targetValue);
        setEditingRm(null);
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'bg-green-500';
        if (progress >= 75) return 'bg-blue-500';
        if (progress >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Target</div>
                        <div className="text-xl font-bold">₹{(totalTarget / 100000).toFixed(1)}L</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Settled</div>
                        <div className="text-xl font-bold text-green-600">₹{(totalSettled / 100000).toFixed(1)}L</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Overall Progress</div>
                        <div className="text-xl font-bold text-primary">{overallProgress}%</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Active RMs</div>
                        <div className="text-xl font-bold">{rms.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input placeholder="Search RMs..." className="pl-10 h-10 border-border bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            {/* RM Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rmStats.map(rm => (
                    <Card key={rm.id} className="border-border shadow-sm hover:border-primary/30 transition-all">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold border border-primary/20">
                                    {rm.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{rm.name}</div>
                                    <div className="text-xs text-muted">{rm.team}</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-muted">Target Progress</span>
                                    <span className="font-bold">{rm.progress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
                                    <div className={`h-full ${getProgressColor(rm.progress)} rounded-full transition-all`} style={{ width: `${rm.progress}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted mt-1">
                                    <span>₹{(rm.settledValue / 100000).toFixed(1)}L settled</span>
                                    <span>Target: ₹{(rm.target / 100000).toFixed(1)}L</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 text-center mb-4">
                                <div className="p-2 bg-surface/50 rounded-lg">
                                    <div className="text-sm font-bold">{rm.customers}</div>
                                    <div className="text-[10px] text-muted">Clients</div>
                                </div>
                                <div className="p-2 bg-surface/50 rounded-lg">
                                    <div className="text-sm font-bold">{rm.totalOrders}</div>
                                    <div className="text-[10px] text-muted">Orders</div>
                                </div>
                                <div className="p-2 bg-surface/50 rounded-lg">
                                    <div className="text-sm font-bold">{rm.conversionRate}%</div>
                                    <div className="text-[10px] text-muted">Lead Conv.</div>
                                </div>
                            </div>

                            {/* Target Edit */}
                            {editingRm === rm.id ? (
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        className="h-8 text-xs"
                                        value={targetValue}
                                        onChange={e => setTargetValue(Number(e.target.value))}
                                        placeholder="Target in INR"
                                    />
                                    <Button size="sm" className="h-8 text-xs" onClick={() => handleSaveTarget(rm.id)}>Save</Button>
                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditingRm(null)}>Cancel</Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => { setEditingRm(rm.id); setTargetValue(rm.target); }}
                                >
                                    <Icon name="PencilIcon" size={12} className="mr-1" />
                                    Set Target
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {rmStats.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted italic">No RMs found.</div>
                )}
            </div>
        </div>
    );
}
