'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function AgentLinksTab() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const supabase = createClient();

    useEffect(() => {
        fetchOrders();
    }, [user, supabase]);

    const fetchOrders = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('agent_client_orders')
            .select('*, companies(name)')
            .eq('agent_id', user.id)
            .order('created_at', { ascending: false });

        if (data) setOrders(data);

        if (!data && user.id === 'agt_1') {
            setOrders([
                {
                    id: 'link_1', client_name: 'Alice Brown', client_email: 'alice@example.com', client_phone: '9876543210',
                    quantity: 50, selling_price: 120, status: 'pending', link_token: 'mock_token_123',
                    companies: { name: 'Simulated Corp' }, created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 86400000 * 7).toISOString(), reminder_count: 0
                },
                {
                    id: 'link_2', client_name: 'Bob Smith', client_email: 'bob@example.com', client_phone: '9876543211',
                    quantity: 200, selling_price: 340, status: 'paid', link_token: 'mock_token_456',
                    companies: { name: 'Fake Industries' }, created_at: new Date(Date.now() - 86400000).toISOString(),
                    expires_at: null, reminder_count: 1
                },
                {
                    id: 'link_3', client_name: 'Carol Davis', client_email: 'carol@example.com', client_phone: '9876543212',
                    quantity: 100, selling_price: 250, status: 'pending', link_token: 'mock_token_789',
                    companies: { name: 'TechFin Ltd' }, created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
                    expires_at: new Date(Date.now() - 86400000 * 3).toISOString(), reminder_count: 2
                }
            ]);
        }
        setLoading(false);
    };

    const isExpired = (order: any) => {
        if (!order.expires_at || order.status !== 'pending') return false;
        return new Date(order.expires_at) < new Date();
    };

    const getEffectiveStatus = (order: any) => {
        if (isExpired(order)) return 'expired';
        return order.status;
    };

    const handleCopy = (token: string) => {
        const url = `${window.location.origin}/checkout/${token}`;
        navigator.clipboard.writeText(url);
        alert('Payment link copied to clipboard!');
    };

    const handleWhatsAppShare = (order: any) => {
        const url = `${window.location.origin}/checkout/${order.link_token}`;
        const text = `Hi ${order.client_name}!\n\nYour payment link for ${order.quantity} shares of ${order.companies?.name || 'Company'} at ₹${order.selling_price}/share is ready:\n\n${url}\n\nTotal: ₹${(order.quantity * order.selling_price).toLocaleString()}\n\nPlease complete the payment at your earliest convenience.${order.expires_at ? `\n\nLink expires: ${new Date(order.expires_at).toLocaleDateString()}` : ''}`;
        window.open(`https://wa.me/${order.client_phone ? order.client_phone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleSendReminder = async (order: any) => {
        if (order.reminder_count >= 3) {
            alert('Maximum 3 reminders can be sent per link.');
            return;
        }
        // Update reminder count
        await supabase.from('agent_client_orders').update({
            reminder_count: (order.reminder_count || 0) + 1,
            reminder_sent_at: new Date().toISOString(),
        }).eq('id', order.id);

        // Share via WhatsApp as reminder
        const url = `${window.location.origin}/checkout/${order.link_token}`;
        const text = `Hi ${order.client_name}!\n\nFriendly reminder - your payment link for ${order.quantity} shares of ${order.companies?.name || 'Company'} is still pending:\n\n${url}\n\nTotal: ₹${(order.quantity * order.selling_price).toLocaleString()}\n\nDon't miss out!`;
        window.open(`https://wa.me/${order.client_phone ? order.client_phone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(text)}`, '_blank');

        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, reminder_count: (o.reminder_count || 0) + 1 } : o));
    };

    const handleCancelLink = async (orderId: string) => {
        if (!confirm('Are you sure you want to cancel this link? This cannot be undone.')) return;
        const { error } = await supabase.from('agent_client_orders').update({ status: 'cancelled', cancelled_reason: 'Cancelled by agent' }).eq('id', orderId);
        if (!error || user?.id === 'agt_1') {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
        }
    };

    const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => {
        if (filterStatus === 'expired') return isExpired(o);
        return getEffectiveStatus(o) === filterStatus;
    });

    const pendingCount = orders.filter(o => o.status === 'pending' && !isExpired(o)).length;
    const paidCount = orders.filter(o => o.status === 'paid').length;
    const expiredCount = orders.filter(o => isExpired(o)).length;

    if (loading) return <div className="text-center p-8 text-muted">Loading Links...</div>;

    return (
        <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3">
                <button onClick={() => setFilterStatus('all')} className={`text-left p-3 rounded-xl border transition-all ${filterStatus === 'all' ? 'bg-primary/5 border-primary/30' : 'bg-white border-border'}`}>
                    <p className="text-[10px] font-bold text-muted uppercase">Total</p>
                    <p className="text-xl font-bold text-foreground">{orders.length}</p>
                </button>
                <button onClick={() => setFilterStatus('pending')} className={`text-left p-3 rounded-xl border transition-all ${filterStatus === 'pending' ? 'bg-amber-50 border-amber-200' : 'bg-white border-border'}`}>
                    <p className="text-[10px] font-bold text-muted uppercase">Pending</p>
                    <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
                </button>
                <button onClick={() => setFilterStatus('paid')} className={`text-left p-3 rounded-xl border transition-all ${filterStatus === 'paid' ? 'bg-green-50 border-green-200' : 'bg-white border-border'}`}>
                    <p className="text-[10px] font-bold text-muted uppercase">Paid</p>
                    <p className="text-xl font-bold text-green-600">{paidCount}</p>
                </button>
                <button onClick={() => setFilterStatus('expired')} className={`text-left p-3 rounded-xl border transition-all ${filterStatus === 'expired' ? 'bg-red-50 border-red-200' : 'bg-white border-border'}`}>
                    <p className="text-[10px] font-bold text-muted uppercase">Expired</p>
                    <p className="text-xl font-bold text-red-500">{expiredCount}</p>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border bg-surface/30 flex justify-between items-center">
                    <div>
                        <h3 className="font-display text-lg font-bold">Client Payment Links</h3>
                        <p className="text-sm text-muted">Share links, send reminders, and track conversions.</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-surface/50">
                                <TableHead className="pl-6 font-semibold">Client</TableHead>
                                <TableHead className="font-semibold">Company</TableHead>
                                <TableHead className="font-semibold">Details</TableHead>
                                <TableHead className="font-semibold">Date / Expiry</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center p-8 text-muted italic">No links found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map(order => {
                                    const effectiveStatus = getEffectiveStatus(order);
                                    const expired = isExpired(order);
                                    return (
                                        <TableRow key={order.id} className={`hover:bg-surface/30 ${expired ? 'opacity-60' : ''}`}>
                                            <TableCell className="pl-6">
                                                <p className="font-bold text-foreground">{order.client_name}</p>
                                                <p className="text-xs text-muted">{order.client_email}</p>
                                                {order.client_phone && <p className="text-[10px] text-muted">{order.client_phone}</p>}
                                            </TableCell>
                                            <TableCell className="font-medium">{order.companies?.name || 'Unknown'}</TableCell>
                                            <TableCell>
                                                <p className="font-bold text-slate-700">{order.quantity} Shares</p>
                                                <p className="text-xs font-semibold text-primary">@ ₹{order.selling_price}/share</p>
                                                <p className="text-[10px] text-muted">Total: ₹{(order.quantity * order.selling_price).toLocaleString()}</p>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted">
                                                <p>{new Date(order.created_at).toLocaleDateString()}</p>
                                                {order.expires_at && (
                                                    <p className={`text-[10px] font-medium mt-1 ${expired ? 'text-red-500' : 'text-muted'}`}>
                                                        {expired ? 'Expired' : 'Expires'}: {new Date(order.expires_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                                {order.reminder_count > 0 && (
                                                    <p className="text-[10px] text-blue-500 mt-0.5">{order.reminder_count} reminder{order.reminder_count > 1 ? 's' : ''} sent</p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                                                    effectiveStatus === 'paid' ? 'bg-green-50 text-green-600 border border-green-200' :
                                                    effectiveStatus === 'cancelled' ? 'bg-red-50 text-red-600 border border-red-200' :
                                                    effectiveStatus === 'expired' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                                    'bg-amber-50 text-amber-600 border border-amber-200'
                                                }`}>
                                                    {effectiveStatus}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {order.status === 'pending' && !expired && (
                                                        <>
                                                            <button onClick={() => handleCopy(order.link_token)} className="w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center" title="Copy Link">
                                                                <Icon name="DocumentDuplicateIcon" size={14} />
                                                            </button>
                                                            <button onClick={() => handleWhatsAppShare(order)} className="w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-colors flex items-center justify-center" title="Share via WhatsApp">
                                                                <Icon name="ChatBubbleLeftIcon" size={14} />
                                                            </button>
                                                            <button onClick={() => handleSendReminder(order)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center" title={`Send Reminder (${order.reminder_count || 0}/3)`} disabled={order.reminder_count >= 3}>
                                                                <Icon name="BellAlertIcon" size={14} />
                                                            </button>
                                                            <button onClick={() => handleCancelLink(order.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center" title="Cancel Link">
                                                                <Icon name="XMarkIcon" size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {order.status === 'paid' && (
                                                        <span className="text-[10px] text-green-600 font-bold">Completed</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
