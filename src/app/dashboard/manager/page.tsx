'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { MOCK_USERS } from '@/lib/mock-data';

interface RMPerformance {
    id: string;
    name: string;
    assignedDeals: number;
    pendingDocs: number;
    settledDeals: number;
    volume: number;
    target: number;
}

export default function ManagerDashboardPage() {
    const { orders, leads, updateOrderStatus, dematRequests, updateDematStatus, rmTargets, updateRmTarget } = useAppStore();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'transactions' | 'demat'>('overview');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'overview' || tab === 'leads' || tab === 'transactions' || tab === 'demat') {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    const rms = React.useMemo<RMPerformance[]>(() => {
        const salesStaff = MOCK_USERS.filter(u => u.role === 'rm');

        return salesStaff.map(staff => {
            // Find all customers assigned to this RM
            const assignedCustomers = MOCK_USERS.filter(u => u.assignedRmId === staff.id).map(u => u.id);

            // Find all orders for these customers
            const rmOrders = orders.filter(o => assignedCustomers.includes(o.userId));

            const assignedDeals = rmOrders.length;
            const pendingDocs = rmOrders.filter(o => o.status === 'requested').length;
            const settledDeals = rmOrders.filter(o => o.status === 'in_holding').length;
            const volume = rmOrders.filter(o => o.status === 'in_holding').reduce((sum, o) => sum + (o.price * o.quantity), 0);

            return {
                id: staff.id,
                name: staff.name,
                assignedDeals,
                pendingDocs,
                settledDeals,
                volume,
                target: rmTargets[staff.id] || 0
            };
        });
    }, [orders, rmTargets]);

    const [selectedRm, setSelectedRm] = useState<RMPerformance | null>(null);
    const [adjustTargetVal, setAdjustTargetVal] = useState('');

    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterShare, setFilterShare] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Delivery confirmation state
    const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null);
    const [deliveryDetails, setDeliveryDetails] = useState({
        isin: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        declared: false
    });

    const totalVolume = rms.reduce((sum, rm) => sum + rm.volume, 0);
    const totalTarget = rms.reduce((sum, rm) => sum + rm.target, 0);
    const progressPercent = totalTarget > 0 ? (totalVolume / totalTarget) * 100 : 0;

    const formattedVolume = `₹${(totalVolume / 10000000).toFixed(2)} Cr`;
    const totalDeals = rms.reduce((sum, rm) => sum + rm.assignedDeals, 0);
    const avgDeals = rms.length > 0 ? Math.round(totalDeals / rms.length) : 0;

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const handleViewDetails = (rm: RMPerformance) => {
        setSelectedRm(rm);
        setAdjustTargetVal(rm.target.toString());
    };

    const saveTarget = () => {
        if (!selectedRm) return;
        const newTarget = parseInt(adjustTargetVal, 10);
        if (!isNaN(newTarget) && newTarget > 0) {
            updateRmTarget(selectedRm.id, newTarget);
        }
        setSelectedRm(null);
    };

    const getUserName = (userId: string) => {
        const u = MOCK_USERS.find(user => user.id === userId);
        if (u) return u.name;
        const lead = leads.find(l => l.id === userId);
        return lead ? lead.name : userId;
    };

    const filteredOrders = orders.filter(o => {
        const userName = getUserName(o.userId).toLowerCase();
        const shareName = o.companyName.toLowerCase();
        const dateMatch = filterDate ? o.createdAt.includes(filterDate) : true;

        return userName.includes(filterCustomer.toLowerCase()) &&
            shareName.includes(filterShare.toLowerCase()) &&
            dateMatch;
    });

    const handlePromoteToMailSent = () => {
        if (!deliveryOrderId) return;
        if (!deliveryDetails.declared) {
            alert('You must declare that the shares have been transferred.');
            return;
        }
        updateOrderStatus(deliveryOrderId, 'mail_sent', deliveryDetails);
        setDeliveryOrderId(null);
        setDeliveryDetails({
            isin: '',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0].substring(0, 5),
            declared: false
        });
    };

    const handleDematStatusUpdate = (id: string, status: any) => {
        updateDematStatus(id, status);
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Sales Leadership</h1>
                    <p className="text-muted mt-1">Track pipeline, RM performance, and platform lead flow.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-border/50 mb-8 overflow-x-auto pb-px">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-3 text-sm font-semibold tracking-wide uppercase whitespace-nowrap border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                >
                    Team Performance
                </button>
                <button
                    onClick={() => setActiveTab('leads')}
                    className={`px-4 py-3 text-sm font-semibold tracking-wide uppercase whitespace-nowrap border-b-2 transition-colors ${activeTab === 'leads' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                >
                    Lead Management
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-4 py-3 text-sm font-semibold tracking-wide uppercase whitespace-nowrap border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                >
                    Orders View
                </button>
                <button
                    onClick={() => setActiveTab('demat')}
                    className={`px-4 py-3 text-sm font-semibold tracking-wide uppercase whitespace-nowrap border-b-2 transition-colors ${activeTab === 'demat' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                >
                    Demat Requests
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <Card className="bg-white border-border shadow-sm group">
                            <CardHeader className="pb-2 border-b border-border/50">
                                <CardTitle className="text-sm text-muted font-semibold tracking-wide uppercase flex items-center">
                                    <Icon name="ChartBarIcon" size={16} className="mr-2" />
                                    Monthly Volume
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold text-foreground">{formattedVolume} <span className="text-sm font-medium text-muted line-through ml-2">{formatINR(totalTarget)} Target</span></div>
                                <div className="mt-6 h-2 w-full bg-surface rounded-full overflow-hidden flex relative">
                                    <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${Math.min(100, progressPercent)}%` }}></div>
                                </div>
                                <div className="flex text-xs text-muted mt-4 gap-6 font-medium uppercase tracking-wider">
                                    <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-accent mr-2" /> Settled Vol</div>
                                    <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-surface border border-border mr-2" /> Remaining</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-border shadow-sm group">
                            <CardHeader className="pb-2 border-b border-border/50">
                                <CardTitle className="text-sm text-muted font-semibold tracking-wide uppercase flex items-center">
                                    <Icon name="UserGroupIcon" size={16} className="mr-2" />
                                    Active Relationship Managers
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold text-foreground">{rms.length}</div>
                                <div className="text-xs text-muted mt-2 font-medium bg-surface inline-block px-3 py-1 rounded-md border border-border">
                                    Avg {avgDeals} deals per RM
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-border shadow-sm">
                        <CardHeader className="border-b border-border/50 bg-white flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-display text-lg font-medium">Team Performance</CardTitle>
                                <CardDescription className="text-muted">Track deal assignment and settlement ratios per RM.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 bg-white overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-surface/50 hover:bg-surface/50">
                                            <TableHead className="text-muted font-semibold pl-6">RM Name</TableHead>
                                            <TableHead className="text-center text-muted font-semibold">Assigned Deals</TableHead>
                                            <TableHead className="text-center text-muted font-semibold">Pending Docs</TableHead>
                                            <TableHead className="text-center text-muted font-semibold">Settled</TableHead>
                                            <TableHead className="text-right text-muted font-semibold">Volume (INR)</TableHead>
                                            <TableHead className="text-center text-muted font-semibold">Goal</TableHead>
                                            <TableHead className="pr-6"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rms.map(rm => {
                                            const percent = Math.min(100, (rm.volume / rm.target) * 100);
                                            return (
                                                <TableRow key={rm.id} className="border-border hover:bg-surface/30 group">
                                                    <TableCell className="font-medium text-foreground pl-6">{rm.name}</TableCell>
                                                    <TableCell className="text-center font-medium">{rm.assignedDeals}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                                                            {rm.pendingDocs}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-600 border border-green-100">
                                                            {rm.settledDeals}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">{formatINR(rm.volume)}</TableCell>
                                                    <TableCell className="text-center text-muted text-xs font-medium">
                                                        <div className="w-16 h-1.5 bg-surface rounded-full mx-auto mb-1 border border-border/50 overflow-hidden">
                                                            <div className="h-full bg-accent" style={{ width: `${percent}%` }}></div>
                                                        </div>
                                                        {percent.toFixed(0)}%
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-primary hover:bg-primary/10 hover:text-primary transition-colors text-xs uppercase tracking-widest font-bold"
                                                            onClick={() => handleViewDetails(rm)}
                                                        >
                                                            View Details
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {activeTab === 'leads' && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Lead Management</CardTitle>
                        <CardDescription className="text-muted">Monitor sign-ups, KYC progression, and RM notes.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="text-muted font-semibold pl-6">Lead Name</TableHead>
                                        <TableHead className="text-muted font-semibold">Contact</TableHead>
                                        <TableHead className="text-muted font-semibold">Status</TableHead>
                                        <TableHead className="text-muted font-semibold">Assigned To</TableHead>
                                        <TableHead className="text-muted font-semibold pr-6">Latest Note</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leads.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center p-8 text-muted">No leads available</TableCell>
                                        </TableRow>
                                    ) : leads.map(lead => {
                                        const rmName = getUserName(lead.assignedRmId);
                                        const latestNote = lead.notes.length > 0 ? lead.notes[lead.notes.length - 1] : 'No notes yet';
                                        return (
                                            <TableRow key={lead.id} className="border-border hover:bg-surface/30">
                                                <TableCell className="font-medium text-foreground pl-6">{lead.name}</TableCell>
                                                <TableCell className="text-muted text-sm pb-1 pt-3">
                                                    <div>{lead.email}</div>
                                                    <div className="text-xs text-muted/70">{lead.phone}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                        {lead.status.replace('_', ' ')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted font-medium text-sm">{rmName}</TableCell>
                                                <TableCell className="text-xs text-muted pr-6 italic max-w-[250px] truncate">
                                                    "{latestNote}"
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'transactions' && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                                <CardTitle className="font-display font-medium text-lg">Platform Transactions</CardTitle>
                                <CardDescription className="text-muted">Live view of all buy and sell orders. Fulfill orders marked 'Under Process'.</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm">
                                <input
                                    className="border border-border rounded-lg bg-surface/50 px-3 py-1.5 focus:outline-none focus:border-primary"
                                    placeholder="Customer Name..."
                                    value={filterCustomer}
                                    onChange={e => setFilterCustomer(e.target.value)}
                                />
                                <input
                                    className="border border-border rounded-lg bg-surface/50 px-3 py-1.5 focus:outline-none focus:border-primary"
                                    placeholder="Share Name..."
                                    value={filterShare}
                                    onChange={e => setFilterShare(e.target.value)}
                                />
                                <input
                                    type="date"
                                    className="border border-border rounded-lg bg-surface/50 px-3 py-1.5 focus:outline-none focus:border-primary text-muted"
                                    value={filterDate}
                                    onChange={e => setFilterDate(e.target.value)}
                                />
                                <Button variant="ghost" onClick={() => { setFilterCustomer(''); setFilterShare(''); setFilterDate(''); }} className="text-xs">
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="text-muted font-semibold pl-6">Date</TableHead>
                                        <TableHead className="text-muted font-semibold">Customer</TableHead>
                                        <TableHead className="text-muted font-semibold">Type</TableHead>
                                        <TableHead className="text-muted font-semibold">Asset</TableHead>
                                        <TableHead className="text-right text-muted font-semibold">Valuation</TableHead>
                                        <TableHead className="text-center text-muted font-semibold">Status</TableHead>
                                        <TableHead className="text-right text-muted font-semibold pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center p-8 text-muted">No transactions match your filters.</TableCell>
                                        </TableRow>
                                    ) : filteredOrders.map(order => {
                                        return (
                                            <TableRow key={order.id} className="border-border hover:bg-surface/30">
                                                <TableCell className="text-muted pl-6">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-medium text-foreground">
                                                    {getUserName(order.userId)}
                                                    {order.txProofUrl && <span className="block text-[10px] text-blue-500 underline mt-0.5 cursor-pointer">View Proof</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${order.type === 'buy' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                                        {order.type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <span className="font-semibold block">{order.companyName}</span>
                                                    <span className="text-xs text-muted">{order.quantity} Shares</span>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">{formatINR(order.quantity * order.price)}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${order.status === 'requested' ? 'bg-amber-50 text-amber-600' :
                                                        order.status === 'under_process' || order.status === 'mail_sent' ? 'bg-blue-50 text-blue-600' :
                                                            'bg-green-50 text-green-600'}`}>
                                                        {order.status.replace('_', ' ')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    {order.status === 'under_process' && (
                                                        <Button
                                                            size="sm"
                                                            className="text-xs font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 text-white"
                                                            onClick={() => setDeliveryOrderId(order.id)}
                                                        >
                                                            Fulfill Delivery
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'demat' && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Demat Requests Tracker</CardTitle>
                        <CardDescription className="text-muted">Manage physical-to-digital share conversion requests.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="text-muted font-semibold pl-6">Customer</TableHead>
                                        <TableHead className="text-muted font-semibold">Company</TableHead>
                                        <TableHead className="text-muted font-semibold">Quantity</TableHead>
                                        <TableHead className="text-muted font-semibold">Folio / Certificates</TableHead>
                                        <TableHead className="text-center text-muted font-semibold">Status</TableHead>
                                        <TableHead className="text-right text-muted font-semibold pr-6">Update Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dematRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center p-12 text-muted">No demat requests yet.</TableCell>
                                        </TableRow>
                                    ) : dematRequests.map(request => (
                                        <TableRow key={request.id} className="border-border hover:bg-surface/30">
                                            <TableCell className="font-medium text-foreground pl-6">{getUserName(request.userId)}</TableCell>
                                            <TableCell className="font-semibold">{request.companyName}</TableCell>
                                            <TableCell>{request.quantity}</TableCell>
                                            <TableCell className="text-xs text-muted">
                                                <div>Folio: {request.folioNumber}</div>
                                                <div className="truncate max-w-[150px]">Certs: {request.certificateNumbers}</div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase ${request.status === 'initiated' ? 'bg-amber-50 text-amber-600' : request.status === 'under_process' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                    {request.status.replace('_', ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <select
                                                    className="text-xs bg-surface border border-border rounded px-2 py-1 outline-none"
                                                    value={request.status}
                                                    onChange={(e) => handleDematStatusUpdate(request.id, e.target.value)}
                                                >
                                                    <option value="initiated">Initiated</option>
                                                    <option value="under_process">Under Process</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Delivery Details Modal */}
            {deliveryOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-xl font-medium text-foreground">
                                Transfer Shares Confirmation
                            </h3>
                            <button onClick={() => setDeliveryOrderId(null)} className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg transition-colors">
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-muted mb-4 block">Please ensure you have sent the necessary mails to finalize the transfer. Details logged here mark the transaction as 'mail_sent', transitioning to 'in_holding' automatically after 5 minutes.</p>

                            <div className="grid gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Asset ISIN Code</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. INE01O101011"
                                        value={deliveryDetails.isin}
                                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, isin: e.target.value })}
                                        className="h-10 border-border"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-foreground mb-1 block">Transfer Date</label>
                                        <Input
                                            type="date"
                                            value={deliveryDetails.date}
                                            onChange={(e) => setDeliveryDetails({ ...deliveryDetails, date: e.target.value })}
                                            className="h-10 border-border text-muted"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-foreground mb-1 block">Transfer Time</label>
                                        <Input
                                            type="time"
                                            value={deliveryDetails.time}
                                            onChange={(e) => setDeliveryDetails({ ...deliveryDetails, time: e.target.value })}
                                            className="h-10 border-border text-muted"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 mt-4 bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="declare-transfer"
                                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                        checked={deliveryDetails.declared}
                                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, declared: e.target.checked })}
                                    />
                                    <label htmlFor="declare-transfer" className="text-sm text-foreground">
                                        I formally declare that I have executed the necessary email communications and external transfers to assign these shares definitively to the client's DEMAT. This action is verifiable.
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setDeliveryOrderId(null)}>Cancel</Button>
                            <Button variant="default" className="bg-primary hover:bg-primary/90 text-white" onClick={handlePromoteToMailSent}>
                                Confirm Delivery Transfer
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* RM Details Modal */}
            {selectedRm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-xl font-medium text-foreground">
                                {selectedRm.name}
                            </h3>
                            <button onClick={() => setSelectedRm(null)} className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg transition-colors">
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-surface rounded-xl border border-border">
                                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Performance Rate</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {((selectedRm.settledDeals / selectedRm.assignedDeals) * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="p-4 bg-surface rounded-xl border border-border">
                                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Total Volume</p>
                                    <p className="text-2xl font-bold text-foreground">{formatINR(selectedRm.volume)}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Monthly Target (INR)</label>
                                    <p className="text-xs text-muted mb-2">Adjust this user's monthly revenue target expectations.</p>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted font-medium">₹</span>
                                        <input
                                            type="number"
                                            value={adjustTargetVal}
                                            onChange={e => setAdjustTargetVal(e.target.value)}
                                            className="w-full pl-8 p-2.5 text-sm border border-border rounded-lg bg-white focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setSelectedRm(null)}>Cancel</Button>
                            <Button variant="default" className="bg-primary hover:bg-primary/90 text-white" onClick={saveTarget}>
                                Save Assessment
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

