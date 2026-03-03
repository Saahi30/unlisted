'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AgentLinksTab() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('agent_client_orders')
                .select('*, companies(name)')
                .eq('agent_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setOrders(data);

            // Simulator mock setup
            if (!data && user.id === 'agt_1') {
                setOrders([
                    {
                        id: 'link_1', client_name: 'Alice Brown', client_email: 'alice@example.com',
                        quantity: 50, selling_price: 120, status: 'pending', link_token: 'mock_token_123',
                        companies: { name: 'Simulated Corp' }, created_at: new Date().toISOString()
                    },
                    {
                        id: 'link_2', client_name: 'Bob Smith', client_email: 'bob@example.com',
                        quantity: 200, selling_price: 340, status: 'paid', link_token: 'mock_token_456',
                        companies: { name: 'Fake Industries' }, created_at: new Date(Date.now() - 86400000).toISOString()
                    }
                ]);
            }
            setLoading(false);
        };
        fetchOrders();
    }, [user, supabase]);

    const handleCopy = (token: string) => {
        const url = `${window.location.origin}/checkout/${token}`;
        navigator.clipboard.writeText(url);
        alert('Payment link copied to clipboard!');
    };

    if (loading) return <div className="text-center p-8 text-muted">Loading Links...</div>;

    return (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-surface/30 flex justify-between items-center">
                <div>
                    <h3 className="font-display text-lg font-bold">Generated Client Links</h3>
                    <p className="text-sm text-muted">Share these unique checkout links with your clients.</p>
                </div>
                <div className="text-2xl font-bold text-primary">{orders.length} <span className="text-xs text-muted uppercase tracking-widest font-bold">Total Links</span></div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-surface/50">
                            <TableHead className="pl-6 font-semibold">Client Name</TableHead>
                            <TableHead className="font-semibold">Company</TableHead>
                            <TableHead className="font-semibold">Details</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="text-right pr-6 font-semibold">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center p-8 text-muted italic">No links generated yet. Go to Marketplace to create one.</TableCell>
                            </TableRow>
                        ) : (
                            orders.map(order => (
                                <TableRow key={order.id} className="hover:bg-surface/30">
                                    <TableCell className="pl-6">
                                        <p className="font-bold text-foreground">{order.client_name}</p>
                                        <p className="text-xs text-muted">{order.client_email}</p>
                                    </TableCell>
                                    <TableCell className="font-medium">{order.companies?.name || 'Unknown'}</TableCell>
                                    <TableCell>
                                        <p className="font-bold text-slate-700">{order.quantity} Shares</p>
                                        <p className="text-xs font-semibold text-primary">@ ₹{order.selling_price}/share</p>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${order.status === 'paid' ? 'bg-green-50 text-green-600 border border-green-200' :
                                                order.status === 'cancelled' ? 'bg-red-50 text-red-600 border border-red-200' :
                                                    'bg-amber-50 text-amber-600 border border-amber-200'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 whitespace-nowrap">
                                        <button
                                            onClick={() => handleCopy(order.link_token)}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                                            title="Copy Link"
                                        >
                                            <Icon name="DocumentDuplicateIcon" size={16} />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
