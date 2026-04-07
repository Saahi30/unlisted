'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAppStore, ExtendedOrder, OrderStatus } from '@/lib/store';

export default function OrderManagementTab() {
    const { orders, updateOrderStatus, addOrderNote, users, companies } = useAppStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [page, setPage] = useState(1);
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const [assignRmId, setAssignRmId] = useState('');
    const [bulkAction, setBulkAction] = useState<'' | OrderStatus>('');
    const PAGE_SIZE = 20;

    const rms = users.filter(u => u.role === 'rm');

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        const matchesType = typeFilter === 'all' || o.type === typeFilter;
        const matchesDateFrom = !dateRange.from || o.createdAt >= dateRange.from;
        const matchesDateTo = !dateRange.to || o.createdAt <= dateRange.to + 'T23:59:59';
        return matchesSearch && matchesStatus && matchesType && matchesDateFrom && matchesDateTo;
    });

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    const paginatedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const statusCounts = {
        all: orders.length,
        requested: orders.filter(o => o.status === 'requested').length,
        under_process: orders.filter(o => o.status === 'under_process').length,
        mail_sent: orders.filter(o => o.status === 'mail_sent').length,
        in_holding: orders.filter(o => o.status === 'in_holding').length,
    };

    const totalValue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const toggleSelect = (id: string) => {
        setSelectedOrders(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedOrders.size === paginatedOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(paginatedOrders.map(o => o.id)));
        }
    };

    const handleBulkAction = () => {
        if (!bulkAction || selectedOrders.size === 0) return;
        if (!confirm(`Update ${selectedOrders.size} orders to "${bulkAction.replace('_', ' ')}"?`)) return;
        selectedOrders.forEach(id => updateOrderStatus(id, bulkAction));
        setSelectedOrders(new Set());
        setBulkAction('');
    };

    const handleAddNote = (orderId: string) => {
        if (!noteText.trim()) return;
        addOrderNote(orderId, `[${new Date().toLocaleString()}] ${noteText.trim()}`);
        setNoteText('');
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'requested': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'under_process': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'mail_sent': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'in_holding': return 'bg-green-50 text-green-600 border-green-200';
        }
    };

    const nextStatus: Record<OrderStatus, OrderStatus | null> = {
        requested: 'under_process',
        under_process: 'mail_sent',
        mail_sent: 'in_holding',
        in_holding: null,
    };

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || userId.slice(0, 8);

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(['all', 'requested', 'under_process', 'mail_sent', 'in_holding'] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => { setStatusFilter(s === 'all' ? 'all' : s); setPage(1); }}
                        className={`p-4 rounded-xl border transition-all text-left ${statusFilter === s ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-white hover:border-primary/30'}`}
                    >
                        <div className="text-xs font-bold uppercase tracking-widest text-muted mb-1">
                            {s === 'all' ? 'Total' : s.replace('_', ' ')}
                        </div>
                        <div className="text-2xl font-bold text-foreground">{statusCounts[s]}</div>
                    </button>
                ))}
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                    <div>
                        <CardTitle className="font-display font-medium text-lg">Order Management</CardTitle>
                        <CardDescription className="text-muted">
                            {filteredOrders.length} orders | Total Value: ₹{totalValue.toLocaleString()}
                        </CardDescription>
                    </div>
                    {selectedOrders.size > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">{selectedOrders.size} selected</span>
                            <select
                                className="h-8 px-2 bg-white border border-border rounded-lg text-xs font-semibold"
                                value={bulkAction}
                                onChange={e => setBulkAction(e.target.value as any)}
                            >
                                <option value="">Bulk Action...</option>
                                <option value="under_process">Move to Under Process</option>
                                <option value="mail_sent">Move to Mail Sent</option>
                                <option value="in_holding">Move to In Holding</option>
                            </select>
                            <Button size="sm" className="h-8 text-xs" onClick={handleBulkAction} disabled={!bulkAction}>
                                Apply
                            </Button>
                        </div>
                    )}
                </CardHeader>

                {/* Filters */}
                <div className="p-4 border-b border-border bg-surface/20 flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1">
                        <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <Input placeholder="Search by company, user, or order ID..." className="pl-10 h-10 border-border bg-white" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} />
                    </div>
                    <select className="h-10 px-3 bg-white border border-border rounded-lg text-xs font-semibold" value={typeFilter} onChange={e => { setTypeFilter(e.target.value as any); setPage(1); }}>
                        <option value="all">ALL TYPES</option>
                        <option value="buy">BUY</option>
                        <option value="sell">SELL</option>
                    </select>
                    <Input type="date" className="h-10 w-40 border-border bg-white text-xs" value={dateRange.from} onChange={e => { setDateRange({ ...dateRange, from: e.target.value }); setPage(1); }} />
                    <span className="text-xs text-muted">to</span>
                    <Input type="date" className="h-10 w-40 border-border bg-white text-xs" value={dateRange.to} onChange={e => { setDateRange({ ...dateRange, to: e.target.value }); setPage(1); }} />
                </div>

                <CardContent className="p-0 bg-white">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50 hover:bg-surface/50">
                                    <TableHead className="w-10 pl-4">
                                        <input type="checkbox" className="h-4 w-4 rounded border-border" checked={selectedOrders.size === paginatedOrders.length && paginatedOrders.length > 0} onChange={toggleSelectAll} />
                                    </TableHead>
                                    <TableHead className="text-muted font-semibold">Order ID</TableHead>
                                    <TableHead className="text-muted font-semibold">Company</TableHead>
                                    <TableHead className="text-muted font-semibold">Customer</TableHead>
                                    <TableHead className="text-muted font-semibold">Type</TableHead>
                                    <TableHead className="text-muted font-semibold text-right">Qty</TableHead>
                                    <TableHead className="text-muted font-semibold text-right">Amount</TableHead>
                                    <TableHead className="text-muted font-semibold">Payment</TableHead>
                                    <TableHead className="text-muted font-semibold">Status</TableHead>
                                    <TableHead className="text-muted font-semibold">Date</TableHead>
                                    <TableHead className="text-right text-muted font-semibold pr-4">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center py-12 text-muted italic">No orders match your filters.</TableCell>
                                    </TableRow>
                                ) : paginatedOrders.map(order => (
                                    <React.Fragment key={order.id}>
                                        <TableRow className={`border-border hover:bg-surface/30 cursor-pointer ${expandedOrder === order.id ? 'bg-primary/5' : ''}`}>
                                            <TableCell className="pl-4" onClick={e => e.stopPropagation()}>
                                                <input type="checkbox" className="h-4 w-4 rounded border-border" checked={selectedOrders.has(order.id)} onChange={() => toggleSelect(order.id)} />
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                                                {order.id.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell className="font-medium" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                                                {order.companyName}
                                            </TableCell>
                                            <TableCell className="text-muted text-xs" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                                                {getUserName(order.userId)}
                                            </TableCell>
                                            <TableCell onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${order.type === 'buy' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    {order.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{order.quantity}</TableCell>
                                            <TableCell className="text-right font-semibold">₹{order.totalAmount.toLocaleString()}</TableCell>
                                            <TableCell className="text-xs text-muted uppercase">{order.paymentMethod}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${getStatusColor(order.status)}`}>
                                                    {order.status.replace('_', ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted whitespace-nowrap">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                {nextStatus[order.status] && (
                                                    <Button size="sm" className="h-7 text-[10px] font-bold" onClick={() => updateOrderStatus(order.id, nextStatus[order.status]!)}>
                                                        {nextStatus[order.status]!.replace('_', ' ')}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Detail Row */}
                                        {expandedOrder === order.id && (
                                            <TableRow className="bg-surface/20">
                                                <TableCell colSpan={11} className="p-0">
                                                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                        {/* Order Details */}
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Order Details</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted">Full ID</span>
                                                                    <span className="font-mono text-xs">{order.id}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted">Price/Share</span>
                                                                    <span className="font-semibold">₹{order.price.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted">Payment Method</span>
                                                                    <span className="uppercase font-medium">{order.paymentMethod}</span>
                                                                </div>
                                                                {order.txProofUrl && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted">TX Proof</span>
                                                                        <a href={order.txProofUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline">View</a>
                                                                    </div>
                                                                )}
                                                                {order.deliveryDetails && (
                                                                    <>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted">ISIN</span>
                                                                            <span className="font-mono text-xs">{order.deliveryDetails.isin}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted">Transfer Date</span>
                                                                            <span>{order.deliveryDetails.date}</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                            {/* Status Progression */}
                                                            <div className="pt-3 border-t border-border/50">
                                                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-2">Status Flow</h4>
                                                                <div className="flex items-center gap-1">
                                                                    {(['requested', 'under_process', 'mail_sent', 'in_holding'] as OrderStatus[]).map((s, i) => (
                                                                        <React.Fragment key={s}>
                                                                            <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${
                                                                                s === order.status ? 'bg-primary text-white' :
                                                                                (['requested', 'under_process', 'mail_sent', 'in_holding'].indexOf(s) < ['requested', 'under_process', 'mail_sent', 'in_holding'].indexOf(order.status))
                                                                                    ? 'bg-green-100 text-green-700' : 'bg-surface text-muted'
                                                                            }`}>
                                                                                {s.replace('_', ' ')}
                                                                            </div>
                                                                            {i < 3 && <Icon name="ChevronRightIcon" size={12} className="text-muted" />}
                                                                        </React.Fragment>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Notes */}
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Notes ({order.notes.length})</h4>
                                                            <div className="max-h-40 overflow-y-auto space-y-2">
                                                                {order.notes.length === 0 ? (
                                                                    <p className="text-xs text-muted italic">No notes yet.</p>
                                                                ) : order.notes.map((note, i) => (
                                                                    <div key={i} className="text-xs p-2 bg-white rounded border border-border/50">{note}</div>
                                                                ))}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    placeholder="Add a note..."
                                                                    className="h-8 text-xs"
                                                                    value={expandedOrder === order.id ? noteText : ''}
                                                                    onChange={e => setNoteText(e.target.value)}
                                                                    onKeyDown={e => { if (e.key === 'Enter') handleAddNote(order.id); }}
                                                                />
                                                                <Button size="sm" className="h-8 text-xs" onClick={() => handleAddNote(order.id)}>Add</Button>
                                                            </div>
                                                        </div>

                                                        {/* Quick Actions */}
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Quick Actions</h4>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <label className="text-xs text-muted block mb-1">Change Status</label>
                                                                    <select
                                                                        className="w-full h-8 px-2 bg-white border border-border rounded-lg text-xs"
                                                                        value={order.status}
                                                                        onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                                                    >
                                                                        <option value="requested">Requested</option>
                                                                        <option value="under_process">Under Process</option>
                                                                        <option value="mail_sent">Mail Sent</option>
                                                                        <option value="in_holding">In Holding</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface/20">
                            <span className="text-xs text-muted">{filteredOrders.length} orders</span>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                                <span className="text-xs text-muted">Page {page} of {totalPages}</span>
                                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
