'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import CustomerKycForm from '@/components/customer/CustomerKycForm';
import FeedbackDialog from '@/components/customer/FeedbackDialog';

export default function CustomerDashboardPage() {
    const { user, isLoading } = useAuth();
    const { orders, companies, dematRequests } = useAppStore();
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab');

    if (isLoading || !user) return null;

    // Show KYC form when tab=kyc
    if (activeTab === 'kyc') {
        return (
            <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-display font-light tracking-tight text-foreground">KYC Verification</h1>
                    <p className="text-muted mt-1">Complete your identity verification to enable share transfers.</p>
                </div>
                <CustomerKycForm />
            </div>
        );
    }

    // Filter orders & demat requests to only show those for the current customer mapping
    const userOrders = orders.filter(o => o.userId === user.id);
    const userDematRequests = dematRequests.filter(r => r.userId === user.id);

    const activeOrders = userOrders.filter(o => ['requested', 'under_process', 'mail_sent'].includes(o.status));
    const settledOrders = userOrders.filter(o => o.status === 'in_holding');

    // Split demat requests by status
    const activeDematRequests = userDematRequests.filter(r => r.status !== 'completed');
    const completedDematRequests = userDematRequests.filter(r => r.status === 'completed');

    const getCompany = (id: string) => companies.find(c => c.id === id);

    // Group settled orders by company
    const groupedHoldings = settledOrders.reduce((acc, order) => {
        if (!acc[order.companyId]) {
            acc[order.companyId] = {
                companyId: order.companyId,
                companyName: order.companyName,
                totalQuantity: order.quantity,
                totalInvested: order.price * order.quantity,
                orders: [order]
            };
        } else {
            acc[order.companyId].totalQuantity += order.quantity;
            acc[order.companyId].totalInvested += order.price * order.quantity;
            acc[order.companyId].orders.push(order);
        }
        return acc;
    }, {} as Record<string, any>);

    const holdingsList = Object.values(groupedHoldings);

    const formatStatus = (status: string) => {
        switch (status) {
            case 'requested': return 'Requested';
            case 'under_process': return 'Under Process';
            case 'mail_sent': return 'Under Process'; // Customer sees 'Under Process' even if mail sent internally till 5 mins
            case 'in_holding': return 'In Holding';
            case 'initiated': return 'Initiated';
            case 'completed': return 'Completed';
            default: return status.replace('_', ' ');
        }
    };

    const getStatusStyle = (status: string) => {
        if (status === 'in_holding' || status === 'completed') return 'bg-green-50 text-green-600 border-green-100';
        if (status === 'under_process' || status === 'mail_sent') return 'bg-blue-50 text-blue-600 border-blue-100';
        return 'bg-amber-50 text-amber-600 border-amber-100';
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-display font-light tracking-tight text-foreground">My Portfolio</h1>
                    <p className="text-muted mt-1">Welcome back, {user.name}. Here is a summary of your unlisted investments.</p>
                </div>
                <div className="flex flex-col w-full md:w-auto md:flex-row gap-2 md:gap-3">
                    <Button
                        variant="ghost"
                        className="text-primary hover:bg-primary/5 flex items-center gap-2 font-semibold w-full md:w-auto"
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('sharesaathi-chat-trigger', {
                                detail: {
                                    message: "Please analyze my portfolio value, holdings, and suggest any upcoming opportunities based on my current risk.",
                                    companyId: 'general'
                                }
                            }));
                        }}
                    >
                        <Icon name="CpuChipIcon" size={18} />
                        Analyze Portfolio
                    </Button>
                    <Button variant="outline" className="border-border hover:bg-surface w-full md:w-auto" asChild>
                        <Link href="/dashboard/customer/dematerialize">Physical to Digital</Link>
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 w-full md:w-auto" asChild>
                        <Link href="/shares">Explore Listings</Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card className="bg-white border-border shadow-sm group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <Icon name="BriefcaseIcon" size={20} />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-muted mb-1">Total Invested Value</p>
                        <h3 className="text-2xl font-bold text-foreground">₹{settledOrders.reduce((sum, o) => sum + (o.price * o.quantity), 0).toLocaleString()}</h3>
                    </CardContent>
                </Card>

                <Card className="bg-white border-border shadow-sm group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
                                <Icon name="CheckBadgeIcon" size={20} />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-muted mb-1">Active Holdings</p>
                        <h3 className="text-2xl font-bold text-foreground">{holdingsList.length} Companies</h3>
                    </CardContent>
                </Card>

                <Card className="bg-white border-border shadow-sm group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
                                <Icon name="ClockIcon" size={20} />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-muted mb-1">Pending Transfers</p>
                        <h3 className="text-2xl font-bold text-foreground">{activeOrders.length + userDematRequests.filter(r => r.status !== 'completed').length} Reqs</h3>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                {/* Active Orders Section */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Active Orders & Transfers</CardTitle>
                        <CardDescription className="text-muted">Transactions currently in settlement phase.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        {activeOrders.length === 0 && activeDematRequests.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface mb-4">
                                    <Icon name="InboxIcon" size={20} className="text-muted" />
                                </div>
                                <p className="text-muted text-sm font-medium">No active orders or requests found.</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-surface/50 hover:bg-surface/50">
                                                <TableHead className="text-muted font-semibold pl-6">Company / Type</TableHead>
                                                <TableHead className="text-muted font-semibold">Date</TableHead>
                                                <TableHead className="text-muted font-semibold">Details</TableHead>
                                                <TableHead className="text-muted font-semibold">Status</TableHead>
                                                <TableHead className="text-muted font-semibold text-right pr-6">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activeOrders.map(order => {
                                                const comp = getCompany(order.companyId);
                                                const isExpanded = selectedOrderId === order.id;
                                                return (
                                                    <React.Fragment key={order.id}>
                                                        <TableRow className={`border-border hover:bg-surface/30 cursor-pointer ${isExpanded ? 'bg-surface/30' : ''}`} onClick={() => setSelectedOrderId(isExpanded ? null : order.id)}>
                                                            <TableCell className="pl-6">
                                                                <div className="font-medium text-foreground">{comp?.name || order.companyName}</div>
                                                                <div className="text-[10px] text-muted uppercase tracking-wider font-bold">Purchase</div>
                                                            </TableCell>
                                                            <TableCell className="text-muted">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                                            <TableCell className="font-medium">{order.quantity} shares @ ₹{order.price.toLocaleString()}</TableCell>
                                                            <TableCell>
                                                                <span className={`inline-flex items-center text-[10px] uppercase tracking-wide font-bold px-2 py-1 border rounded-md ${getStatusStyle(order.status)}`}>
                                                                    <Icon name="ClockIcon" size={12} className="mr-1" />
                                                                    {formatStatus(order.status)}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6">
                                                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 text-xs tracking-widest uppercase font-bold" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(isExpanded ? null : order.id); }}>
                                                                    {isExpanded ? 'Hide' : 'Details'}
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                        {isExpanded && (
                                                            <TableRow className="bg-slate-50/50">
                                                                <TableCell colSpan={6} className="p-0 border-b">
                                                                    <div className="p-6 grid grid-cols-4 gap-4 text-sm animate-in fade-in slide-in-from-top-2">
                                                                        <div><div className="text-slate-500 mb-1 text-xs">Order ID</div><div className="font-mono font-medium">{order.id}</div></div>
                                                                        <div><div className="text-slate-500 mb-1 text-xs">Payment Method</div><div className="font-medium capitalize">{order.paymentMethod?.replace('_', ' ') || 'direct'}</div></div>
                                                                        <div><div className="text-slate-500 mb-1 text-xs">Share Price</div><div className="font-medium">₹{order.price.toLocaleString()}</div></div>
                                                                        <div><div className="text-slate-500 mb-1 text-xs">Detailed Status</div><div className="font-medium capitalize">{order.status.replace('_', ' ')}</div></div>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </React.Fragment>
                                                )
                                            })}
                                            {activeDematRequests.map(request => {
                                                const isExpanded = selectedOrderId === request.id;
                                                return (
                                                    <React.Fragment key={request.id}>
                                                        <TableRow className={`border-border hover:bg-surface/30 cursor-pointer ${isExpanded ? 'bg-surface/30' : ''}`} onClick={() => setSelectedOrderId(isExpanded ? null : request.id)}>
                                                            <TableCell className="pl-6">
                                                                <div className="font-medium text-foreground">{request.companyName}</div>
                                                                <div className="text-[10px] text-primary uppercase tracking-wider font-bold">Dematerialization</div>
                                                            </TableCell>
                                                            <TableCell className="text-muted">{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                                                            <TableCell className="font-medium">{request.quantity} shares</TableCell>
                                                            <TableCell>
                                                                <span className={`inline-flex items-center text-[10px] uppercase tracking-wide font-bold px-2 py-1 border rounded-md ${getStatusStyle(request.status)}`}>
                                                                    <Icon name="DocumentTextIcon" size={12} className="mr-1" />
                                                                    {formatStatus(request.status)}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6">
                                                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 text-xs tracking-widest uppercase font-bold" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(isExpanded ? null : request.id); }}>
                                                                    {isExpanded ? 'Hide' : 'Details'}
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                        {isExpanded && (
                                                            <TableRow className="bg-slate-50/50">
                                                                <TableCell colSpan={6} className="p-0 border-b">
                                                                    <div className="p-6 grid grid-cols-4 gap-4 text-sm animate-in fade-in slide-in-from-top-2">
                                                                        <div><div className="text-slate-500 mb-1 text-xs">Folio No.</div><div className="font-medium">{request.folioNumber}</div></div>
                                                                        <div><div className="text-slate-500 mb-1 text-xs">Certificates</div><div className="font-medium truncate">{request.certificateNumbers}</div></div>
                                                                        <div className="col-span-2"><div className="text-slate-500 mb-1 text-xs">Next Steps</div><div className="font-medium">{request.status === 'initiated' ? 'Courier physical certificates to our office.' : request.status === 'under_process' ? 'Internal processing in progress.' : 'Shares successfully credited to your Demat.'}</div></div>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </React.Fragment>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden space-y-3 p-4">
                                    {activeOrders.map(order => {
                                        const comp = getCompany(order.companyId);
                                        const isExpanded = selectedOrderId === order.id;
                                        return (
                                            <div key={order.id} className="border border-border rounded-xl p-4 bg-white" onClick={() => setSelectedOrderId(isExpanded ? null : order.id)}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-medium text-foreground">{comp?.name || order.companyName}</p>
                                                        <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Purchase</p>
                                                    </div>
                                                    <span className={`inline-flex items-center text-[10px] uppercase tracking-wide font-bold px-2 py-1 border rounded-md ${getStatusStyle(order.status)}`}>
                                                        <Icon name="ClockIcon" size={12} className="mr-1" />
                                                        {formatStatus(order.status)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-muted mb-1">
                                                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                                    <span className="font-medium text-foreground">{order.quantity} shares @ ₹{order.price.toLocaleString()}</span>
                                                </div>
                                                <button className="w-full text-center text-primary text-xs font-bold uppercase tracking-widest py-2 border-t border-border mt-2 min-h-[44px]">
                                                    {isExpanded ? 'Hide Details' : 'View Details'}
                                                </button>
                                                {isExpanded && (
                                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border text-sm animate-in fade-in slide-in-from-top-2">
                                                        <div><div className="text-slate-500 mb-1 text-xs">Order ID</div><div className="font-mono font-medium text-xs break-all">{order.id}</div></div>
                                                        <div><div className="text-slate-500 mb-1 text-xs">Payment</div><div className="font-medium capitalize text-xs">{order.paymentMethod?.replace('_', ' ') || 'direct'}</div></div>
                                                        <div><div className="text-slate-500 mb-1 text-xs">Share Price</div><div className="font-medium text-xs">₹{order.price.toLocaleString()}</div></div>
                                                        <div><div className="text-slate-500 mb-1 text-xs">Status</div><div className="font-medium capitalize text-xs">{order.status.replace('_', ' ')}</div></div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {activeDematRequests.map(request => {
                                        const isExpanded = selectedOrderId === request.id;
                                        return (
                                            <div key={request.id} className="border border-border rounded-xl p-4 bg-white" onClick={() => setSelectedOrderId(isExpanded ? null : request.id)}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-medium text-foreground">{request.companyName}</p>
                                                        <p className="text-[10px] text-primary uppercase tracking-wider font-bold">Dematerialization</p>
                                                    </div>
                                                    <span className={`inline-flex items-center text-[10px] uppercase tracking-wide font-bold px-2 py-1 border rounded-md ${getStatusStyle(request.status)}`}>
                                                        <Icon name="DocumentTextIcon" size={12} className="mr-1" />
                                                        {formatStatus(request.status)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-muted mb-1">
                                                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                                                    <span className="font-medium text-foreground">{request.quantity} shares</span>
                                                </div>
                                                <button className="w-full text-center text-primary text-xs font-bold uppercase tracking-widest py-2 border-t border-border mt-2 min-h-[44px]">
                                                    {isExpanded ? 'Hide Details' : 'View Details'}
                                                </button>
                                                {isExpanded && (
                                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border text-sm animate-in fade-in slide-in-from-top-2">
                                                        <div><div className="text-slate-500 mb-1 text-xs">Folio No.</div><div className="font-medium text-xs">{request.folioNumber}</div></div>
                                                        <div><div className="text-slate-500 mb-1 text-xs">Certificates</div><div className="font-medium text-xs truncate">{request.certificateNumbers}</div></div>
                                                        <div className="col-span-2"><div className="text-slate-500 mb-1 text-xs">Next Steps</div><div className="font-medium text-xs">{request.status === 'initiated' ? 'Courier physical certificates to our office.' : request.status === 'under_process' ? 'Internal processing in progress.' : 'Shares successfully credited to your Demat.'}</div></div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Holdings Section */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Portfolio Holdings</CardTitle>
                        <CardDescription className="text-muted">Successfully settled dematerialized shares in your account.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        {holdingsList.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface mb-4">
                                    <Icon name="ArchiveBoxIcon" size={20} className="text-muted" />
                                </div>
                                <p className="text-muted text-sm font-medium mb-3">No holdings yet.</p>
                                <Button className="bg-primary hover:bg-primary/90 text-white" asChild>
                                    <Link href="/shares">Explore Listings</Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-surface/50 hover:bg-surface/50">
                                                <TableHead className="text-muted font-semibold pl-6">Company</TableHead>
                                                <TableHead className="text-muted font-semibold">Sector</TableHead>
                                                <TableHead className="text-muted font-semibold">Shares Held</TableHead>
                                                <TableHead className="text-muted font-semibold">Avg Cost</TableHead>
                                                <TableHead className="text-muted font-semibold">Market Value</TableHead>
                                                <TableHead className="text-muted font-semibold text-right pr-6">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {holdingsList.map(holding => {
                                                const comp = getCompany(holding.companyId);
                                                const isExpanded = selectedOrderId === holding.companyId;
                                                const avgCost = holding.totalInvested / holding.totalQuantity;
                                                const marketValue = (comp?.currentAskPrice || avgCost) * holding.totalQuantity;
                                                return (
                                                    <React.Fragment key={holding.companyId}>
                                                        <TableRow className={`border-border hover:bg-surface/30 cursor-pointer ${isExpanded ? 'bg-surface/30' : ''}`} onClick={() => setSelectedOrderId(isExpanded ? null : holding.companyId)}>
                                                            <TableCell className="font-medium text-foreground pl-6">{comp?.name || holding.companyName}</TableCell>
                                                            <TableCell className="text-muted">{comp?.sector || 'Unknown'}</TableCell>
                                                            <TableCell className="font-medium">{holding.totalQuantity}</TableCell>
                                                            <TableCell className="text-muted">₹{avgCost.toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
                                                            <TableCell className="text-accent font-semibold">₹{marketValue.toLocaleString()}</TableCell>
                                                            <TableCell className="text-right pr-6">
                                                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 text-xs tracking-widest uppercase font-bold" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(isExpanded ? null : holding.companyId); }}>
                                                                    {isExpanded ? 'Hide' : 'Details'}
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                        {isExpanded && (
                                                            <TableRow className="bg-slate-50/50">
                                                                <TableCell colSpan={6} className="p-0 border-b">
                                                                    <div className="p-6 text-sm animate-in fade-in slide-in-from-top-2">
                                                                        <h4 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Transaction History</h4>
                                                                        <div className="space-y-3">
                                                                            {holding.orders.map((order: any) => (
                                                                                <div key={order.id} className="grid grid-cols-4 gap-4 bg-white p-3 rounded-lg border border-border">
                                                                                    <div><div className="text-slate-500 mb-1 text-[10px] uppercase">Order ID</div><div className="font-mono text-xs font-medium">{order.id}</div></div>
                                                                                    <div><div className="text-slate-500 mb-1 text-[10px] uppercase">Quantity</div><div className="text-xs font-medium">{order.quantity} @ ₹{order.price.toLocaleString()}</div></div>
                                                                                    {order.deliveryDetails && (<><div><div className="text-slate-500 mb-1 text-[10px] uppercase">ISIN</div><div className="font-mono text-xs font-medium truncate">{order.deliveryDetails.isin}</div></div><div><div className="text-slate-500 mb-1 text-[10px] uppercase">Transferred</div><div className="text-xs font-medium">{order.deliveryDetails.date} at {order.deliveryDetails.time}</div></div></>)}
                                                                                    {!order.deliveryDetails && (<div className="col-span-2"><div className="text-slate-500 mb-1 text-[10px] uppercase">Settled</div><div className="text-xs font-medium">{new Date(order.createdAt).toLocaleDateString()}</div></div>)}
                                                                                    <div className="flex items-center justify-end">
                                                                                        <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 text-[10px] font-bold uppercase tracking-widest" onClick={(e) => { e.stopPropagation(); setFeedbackOrderId(order.id); }}>
                                                                                            <Icon name="StarIcon" size={14} className="mr-1" /> Rate
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </React.Fragment>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden space-y-3 p-4">
                                    {holdingsList.map(holding => {
                                        const comp = getCompany(holding.companyId);
                                        const isExpanded = selectedOrderId === holding.companyId;
                                        const avgCost = holding.totalInvested / holding.totalQuantity;
                                        const marketValue = (comp?.currentAskPrice || avgCost) * holding.totalQuantity;
                                        return (
                                            <div key={holding.companyId} className="border border-border rounded-xl p-4 bg-white" onClick={() => setSelectedOrderId(isExpanded ? null : holding.companyId)}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <p className="font-semibold text-foreground">{comp?.name || holding.companyName}</p>
                                                        <p className="text-xs text-muted">{comp?.sector || 'Unknown'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-accent font-semibold">₹{marketValue.toLocaleString()}</p>
                                                        <p className="text-[10px] text-muted">{holding.totalQuantity} shares</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-muted">
                                                    <span>Avg Cost: ₹{avgCost.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                                </div>
                                                <button className="w-full text-center text-primary text-xs font-bold uppercase tracking-widest py-2 border-t border-border mt-3 min-h-[44px]">
                                                    {isExpanded ? 'Hide Details' : 'View Details'}
                                                </button>
                                                {isExpanded && (
                                                    <div className="pt-3 border-t border-border text-sm animate-in fade-in slide-in-from-top-2">
                                                        <h4 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Transaction History</h4>
                                                        <div className="space-y-3">
                                                            {holding.orders.map((order: any) => (
                                                                <div key={order.id} className="grid grid-cols-2 gap-3 bg-surface/50 p-3 rounded-lg border border-border">
                                                                    <div><div className="text-slate-500 mb-1 text-[10px] uppercase">Order ID</div><div className="font-mono text-xs font-medium break-all">{order.id}</div></div>
                                                                    <div><div className="text-slate-500 mb-1 text-[10px] uppercase">Quantity</div><div className="text-xs font-medium">{order.quantity} @ ₹{order.price.toLocaleString()}</div></div>
                                                                    {order.deliveryDetails && (<><div><div className="text-slate-500 mb-1 text-[10px] uppercase">ISIN</div><div className="font-mono text-xs font-medium break-all">{order.deliveryDetails.isin}</div></div><div><div className="text-slate-500 mb-1 text-[10px] uppercase">Transferred</div><div className="text-xs font-medium">{order.deliveryDetails.date} at {order.deliveryDetails.time}</div></div></>)}
                                                                    {!order.deliveryDetails && (<div className="col-span-2"><div className="text-slate-500 mb-1 text-[10px] uppercase">Settled</div><div className="text-xs font-medium">{new Date(order.createdAt).toLocaleDateString()}</div></div>)}
                                                                    <div className="col-span-2 flex justify-end">
                                                                        <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 text-[10px] font-bold uppercase tracking-widest min-h-[44px]" onClick={(e) => { e.stopPropagation(); setFeedbackOrderId(order.id); }}>
                                                                            <Icon name="StarIcon" size={14} className="mr-1" /> Rate
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Dematerialization History Section */}
                {completedDematRequests.length > 0 && (
                    <Card className="border-border shadow-sm">
                        <CardHeader className="border-b border-border/50 bg-white">
                            <CardTitle className="font-display font-medium text-lg">Resolved Demat Requests</CardTitle>
                            <CardDescription className="text-muted">History of successfully converted physical certificates.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 bg-white">
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-surface/50 hover:bg-surface/50">
                                            <TableHead className="text-muted font-semibold pl-6">Company</TableHead>
                                            <TableHead className="text-muted font-semibold">Processed Date</TableHead>
                                            <TableHead className="text-muted font-semibold">Quantity</TableHead>
                                            <TableHead className="text-muted font-semibold">Status</TableHead>
                                            <TableHead className="text-muted font-semibold text-right pr-6">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {completedDematRequests.map(request => {
                                            const isExpanded = selectedOrderId === request.id;
                                            return (
                                                <React.Fragment key={request.id}>
                                                    <TableRow className={`border-border hover:bg-surface/30 cursor-pointer ${isExpanded ? 'bg-surface/30' : ''}`} onClick={() => setSelectedOrderId(isExpanded ? null : request.id)}>
                                                        <TableCell className="pl-6 font-medium text-foreground">{request.companyName}</TableCell>
                                                        <TableCell className="text-muted">{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                                                        <TableCell className="font-medium">{request.quantity} shares</TableCell>
                                                        <TableCell>
                                                            <span className="inline-flex items-center text-[10px] uppercase tracking-wide font-bold px-2 py-1 border rounded-md bg-green-50 text-green-600 border-green-100">
                                                                <Icon name="CheckCircleIcon" size={12} className="mr-1" />
                                                                Completed
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 text-xs tracking-widest uppercase font-bold" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(isExpanded ? null : request.id); }}>
                                                                {isExpanded ? 'Hide' : 'Details'}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    {isExpanded && (
                                                        <TableRow className="bg-slate-50/50">
                                                            <TableCell colSpan={5} className="p-0 border-b">
                                                                <div className="p-6 grid grid-cols-4 gap-4 text-sm animate-in fade-in slide-in-from-top-2">
                                                                    <div><div className="text-slate-500 mb-1 text-xs">Folio Number</div><div className="font-medium">{request.folioNumber}</div></div>
                                                                    <div><div className="text-slate-500 mb-1 text-xs">Certificate Numbers</div><div className="font-medium">{request.certificateNumbers}</div></div>
                                                                    <div className="col-span-2"><div className="text-slate-500 mb-1 text-xs">Status Message</div><div className="font-medium text-green-600">The shares have been successfully credited to your linked Demat account.</div></div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-3 p-4">
                                {completedDematRequests.map(request => {
                                    const isExpanded = selectedOrderId === request.id;
                                    return (
                                        <div key={request.id} className="border border-border rounded-xl p-4 bg-white" onClick={() => setSelectedOrderId(isExpanded ? null : request.id)}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-medium text-foreground">{request.companyName}</p>
                                                    <p className="text-xs text-muted">{new Date(request.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <span className="inline-flex items-center text-[10px] uppercase tracking-wide font-bold px-2 py-1 border rounded-md bg-green-50 text-green-600 border-green-100">
                                                    <Icon name="CheckCircleIcon" size={12} className="mr-1" />
                                                    Completed
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-foreground">{request.quantity} shares</p>
                                            <button className="w-full text-center text-primary text-xs font-bold uppercase tracking-widest py-2 border-t border-border mt-3 min-h-[44px]">
                                                {isExpanded ? 'Hide Details' : 'View Details'}
                                            </button>
                                            {isExpanded && (
                                                <div className="grid grid-cols-1 gap-3 pt-3 border-t border-border text-sm animate-in fade-in slide-in-from-top-2">
                                                    <div><div className="text-slate-500 mb-1 text-xs">Folio Number</div><div className="font-medium">{request.folioNumber}</div></div>
                                                    <div><div className="text-slate-500 mb-1 text-xs">Certificate Numbers</div><div className="font-medium">{request.certificateNumbers}</div></div>
                                                    <div><div className="text-slate-500 mb-1 text-xs">Status</div><div className="font-medium text-green-600">Shares credited to your linked Demat account.</div></div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Feedback Dialog */}
            {feedbackOrderId && (() => {
                const order = userOrders.find(o => o.id === feedbackOrderId);
                if (!order) return null;
                return (
                    <FeedbackDialog
                        orderId={order.id}
                        userId={user.id}
                        companyName={order.companyName}
                        onClose={() => setFeedbackOrderId(null)}
                        onSubmitted={() => setFeedbackOrderId(null)}
                    />
                );
            })()}
        </div>
    );
}
