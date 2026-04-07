'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import OrderTracker from '@/components/customer/OrderTracker';

export default function CustomerOrdersPage() {
    const { user, isLoading } = useAuth();
    const { orders, companies } = useAppStore();
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | string>('all');

    if (isLoading || !user) return null;

    const userOrders = orders.filter(o => o.userId === user.id);
    const filteredOrders = statusFilter === 'all'
        ? userOrders
        : userOrders.filter(o => o.status === statusFilter);

    const statusCounts = {
        all: userOrders.length,
        requested: userOrders.filter(o => o.status === 'requested').length,
        under_process: userOrders.filter(o => o.status === 'under_process' || o.status === 'mail_sent').length,
        in_holding: userOrders.filter(o => o.status === 'in_holding').length,
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'requested': return 'Placed';
            case 'under_process': return 'Processing';
            case 'mail_sent': return 'Processing';
            case 'in_holding': return 'Completed';
            default: return status.replace('_', ' ');
        }
    };

    const getStatusStyle = (status: string) => {
        if (status === 'in_holding') return 'bg-green-50 text-green-600 border-green-100';
        if (status === 'under_process' || status === 'mail_sent') return 'bg-blue-50 text-blue-600 border-blue-100';
        return 'bg-amber-50 text-amber-600 border-amber-100';
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-display font-light tracking-tight text-foreground">My Orders</h1>
                    <p className="text-muted mt-1">Track the status of all your share transactions.</p>
                </div>
            </div>

            {/* Status filter cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { key: 'all', label: 'All Orders', icon: 'ClipboardDocumentListIcon', color: 'text-foreground' },
                    { key: 'requested', label: 'Placed', icon: 'ClockIcon', color: 'text-amber-600' },
                    { key: 'under_process', label: 'Processing', icon: 'ArrowPathIcon', color: 'text-blue-600' },
                    { key: 'in_holding', label: 'Completed', icon: 'CheckBadgeIcon', color: 'text-green-600' },
                ].map(item => (
                    <Card
                        key={item.key}
                        className={`cursor-pointer transition-all border-border shadow-sm hover:shadow-md ${statusFilter === item.key ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setStatusFilter(item.key)}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-surface ${item.color}`}>
                                <Icon name={item.icon} size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-foreground">{statusCounts[item.key as keyof typeof statusCounts] || 0}</div>
                                <div className="text-xs text-muted font-medium">{item.label}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Orders list */}
            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-12 text-center">
                            <Icon name="InboxIcon" size={48} className="mx-auto text-muted/30 mb-4" />
                            <p className="text-muted font-medium">No orders found</p>
                            <Button variant="outline" className="mt-4" asChild>
                                <Link href="/shares">Browse Shares</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : filteredOrders.map(order => {
                    const company = companies.find(c => c.id === order.companyId);
                    const isExpanded = expandedOrderId === order.id;

                    return (
                        <Card key={order.id} className="border-border shadow-sm overflow-hidden">
                            <div
                                className="p-4 md:p-6 cursor-pointer hover:bg-surface/30 transition-colors"
                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold font-display text-sm">
                                            {order.type === 'buy' ? 'B' : 'S'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{order.companyName}</h3>
                                            <p className="text-xs text-muted">
                                                {order.quantity} shares at ₹{order.price.toLocaleString()} each
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="font-bold text-foreground">₹{order.totalAmount.toLocaleString()}</div>
                                            <div className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${getStatusStyle(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                        <Icon
                                            name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                                            size={16}
                                            className="text-muted"
                                        />
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="border-t border-border bg-surface/20 p-4 md:p-6">
                                    <OrderTracker
                                        currentStatus={order.status}
                                        statusTimestamps={(order as any).statusTimestamps}
                                        createdAt={order.createdAt}
                                    />
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Order ID</span>
                                            <span className="text-foreground font-mono text-xs">{order.id.substring(0, 12)}...</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Type</span>
                                            <span className={`font-semibold ${order.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>{order.type.toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Payment</span>
                                            <span className="text-foreground">{order.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                                        </div>
                                        {order.deliveryDetails?.isin && (
                                            <div>
                                                <span className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">ISIN</span>
                                                <span className="text-foreground font-mono text-xs">{order.deliveryDetails.isin}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
