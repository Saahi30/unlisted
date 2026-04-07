'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/utils/supabase/client';

interface AgentProfile {
    id: string;
    user_id: string;
    full_name: string;
    pan_number: string;
    kyc_status: string;
    total_earnings: number;
    total_withdrawn: number;
    created_at: string;
}

interface AgentClientOrder {
    id: string;
    agent_id: string;
    company_id: string;
    company_name: string;
    price_per_share: number;
    quantity: number;
    status: string;
    created_at: string;
}

export default function AgentPerformanceTab() {
    const [agents, setAgents] = useState<AgentProfile[]>([]);
    const [clientOrders, setClientOrders] = useState<AgentClientOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const [agentRes, orderRes] = await Promise.all([
                supabase.from('agent_profiles').select('*').order('total_earnings', { ascending: false }),
                supabase.from('agent_client_orders').select('*').order('created_at', { ascending: false }),
            ]);
            if (agentRes.data) setAgents(agentRes.data);
            if (orderRes.data) setClientOrders(orderRes.data);
            setLoading(false);
        };
        fetchData();
    }, []);

    const agentStats = useMemo(() =>
        agents.map(agent => {
            const orders = clientOrders.filter(o => o.agent_id === agent.user_id);
            const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'paid');
            const totalOrderValue = orders.reduce((sum, o) => sum + (o.price_per_share * o.quantity), 0);
            const completedValue = completedOrders.reduce((sum, o) => sum + (o.price_per_share * o.quantity), 0);
            const conversionRate = orders.length > 0 ? (completedOrders.length / orders.length * 100).toFixed(0) : '0';
            const uniqueClients = new Set(orders.map(o => o.id)).size; // approximate

            return {
                ...agent,
                totalOrders: orders.length,
                completedOrders: completedOrders.length,
                totalOrderValue,
                completedValue,
                conversionRate,
                uniqueClients,
                orders,
            };
        }).filter(a => a.full_name.toLowerCase().includes(searchQuery.toLowerCase())),
        [agents, clientOrders, searchQuery]
    );

    const totalEarnings = agents.reduce((sum, a) => sum + (a.total_earnings || 0), 0);
    const totalWithdrawn = agents.reduce((sum, a) => sum + (a.total_withdrawn || 0), 0);
    const totalOrders = clientOrders.length;
    const approvedAgents = agents.filter(a => a.kyc_status === 'approved').length;

    if (loading) {
        return <div className="flex justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Agents</div>
                        <div className="text-2xl font-bold">{agents.length}</div>
                        <div className="text-[10px] text-green-600 mt-1">{approvedAgents} approved</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Earnings</div>
                        <div className="text-2xl font-bold">₹{(totalEarnings / 1000).toFixed(1)}K</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Withdrawn</div>
                        <div className="text-2xl font-bold text-amber-600">₹{(totalWithdrawn / 1000).toFixed(1)}K</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Client Orders</div>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Pending Balance</div>
                        <div className="text-2xl font-bold text-primary">₹{((totalEarnings - totalWithdrawn) / 1000).toFixed(1)}K</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input placeholder="Search agents..." className="pl-10 h-10 border-border bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            {/* Agent Table */}
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-white">
                    <CardTitle className="font-display font-medium text-lg">Agent Performance Leaderboard</CardTitle>
                    <CardDescription>Ranked by total earnings</CardDescription>
                </CardHeader>
                <CardContent className="p-0 bg-white">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50 hover:bg-surface/50">
                                    <TableHead className="pl-6 font-semibold w-8">#</TableHead>
                                    <TableHead className="font-semibold">Agent</TableHead>
                                    <TableHead className="font-semibold">KYC</TableHead>
                                    <TableHead className="font-semibold text-right">Orders</TableHead>
                                    <TableHead className="font-semibold text-right">Order Value</TableHead>
                                    <TableHead className="font-semibold text-right">Earnings</TableHead>
                                    <TableHead className="font-semibold text-right">Withdrawn</TableHead>
                                    <TableHead className="font-semibold text-right">Conv. Rate</TableHead>
                                    <TableHead className="text-right pr-6 font-semibold">Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agentStats.length === 0 ? (
                                    <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted italic">No agents found.</TableCell></TableRow>
                                ) : agentStats.map((agent, i) => (
                                    <React.Fragment key={agent.id}>
                                        <TableRow
                                            className={`border-border hover:bg-surface/30 cursor-pointer ${expandedAgent === agent.id ? 'bg-primary/5' : ''}`}
                                            onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                                        >
                                            <TableCell className="pl-6 font-bold text-muted">{i + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                                                        {agent.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">{agent.full_name}</div>
                                                        <div className="text-[10px] text-muted font-mono">{agent.user_id.slice(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                                    agent.kyc_status === 'approved' ? 'bg-green-50 text-green-600' :
                                                    agent.kyc_status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-red-50 text-red-600'
                                                }`}>{agent.kyc_status}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{agent.totalOrders}</TableCell>
                                            <TableCell className="text-right font-semibold">₹{(agent.totalOrderValue / 1000).toFixed(1)}K</TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">₹{(agent.total_earnings / 1000).toFixed(1)}K</TableCell>
                                            <TableCell className="text-right font-medium text-muted">₹{((agent.total_withdrawn || 0) / 1000).toFixed(1)}K</TableCell>
                                            <TableCell className="text-right">
                                                <span className={`text-xs font-bold ${Number(agent.conversionRate) >= 50 ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {agent.conversionRate}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 text-xs text-muted">
                                                {new Date(agent.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                        {expandedAgent === agent.id && (
                                            <TableRow className="bg-surface/20">
                                                <TableCell colSpan={9} className="p-0">
                                                    <div className="p-6">
                                                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Recent Client Orders</h4>
                                                        {agent.orders.length === 0 ? (
                                                            <p className="text-xs text-muted italic">No orders yet.</p>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {agent.orders.slice(0, 6).map(order => (
                                                                    <div key={order.id} className="p-3 bg-white rounded-lg border border-border/50">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <span className="font-medium text-sm">{order.company_name}</span>
                                                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                                                                order.status === 'completed' || order.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                                                            }`}>{order.status}</span>
                                                                        </div>
                                                                        <div className="text-xs text-muted">
                                                                            {order.quantity} shares x ₹{order.price_per_share}
                                                                        </div>
                                                                        <div className="text-xs font-semibold mt-1">
                                                                            ₹{(order.quantity * order.price_per_share).toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
