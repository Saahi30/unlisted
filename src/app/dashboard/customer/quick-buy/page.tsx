'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';

export default function QuickBuyPage() {
    const { user } = useAuth();
    const { orders, companies } = useAppStore();
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [reorderedIds, setReorderedIds] = useState<Set<string>>(new Set());

    // Get unique previously purchased companies with last order details
    const previousPurchases = useMemo(() => {
        const userOrders = orders.filter(o => o.userId === user?.id && o.type === 'buy');
        const seen = new Map<string, typeof userOrders[0]>();

        // Keep the most recent order per company
        userOrders.forEach(order => {
            const existing = seen.get(order.companyId);
            if (!existing || new Date(order.createdAt) > new Date(existing.createdAt)) {
                seen.set(order.companyId, order);
            }
        });

        return Array.from(seen.values())
            .map(order => {
                const company = companies.find(c => c.id === order.companyId);
                return {
                    order,
                    company,
                    currentPrice: company?.currentAskPrice || order.price,
                    priceChange: company ? ((company.currentAskPrice - order.price) / order.price) * 100 : 0,
                };
            })
            .sort((a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime());
    }, [orders, companies, user]);

    const handleReorder = (companyId: string) => {
        setReorderedIds(prev => new Set([...prev, companyId]));
        setConfirmingId(null);
        // In production this would call addOrder — for now show confirmation
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days} days ago`;
        const months = Math.floor(days / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-4xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Quick Re-Buy</h1>
            </div>
            <p className="text-muted mt-1 mb-8">One-tap reorder for previously purchased companies.</p>

            {previousPurchases.length === 0 ? (
                <div className="py-20 text-center">
                    <Icon name="ArrowPathIcon" size={40} className="mx-auto text-muted mb-4" />
                    <p className="text-muted font-medium mb-2">No previous purchases found.</p>
                    <p className="text-xs text-muted mb-4">Buy your first shares to enable quick re-buy.</p>
                    <Button className="bg-primary text-white hover:bg-primary/90" asChild>
                        <Link href="/shares">Explore Shares</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {previousPurchases.map(({ order, company, currentPrice, priceChange }) => {
                        const isConfirming = confirmingId === order.companyId;
                        const isReordered = reorderedIds.has(order.companyId);

                        return (
                            <Card key={order.companyId} className={`border-border shadow-sm transition-all ${isReordered ? 'ring-1 ring-green-200' : ''}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        {/* Company Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <Link href={`/shares/${order.companyId}`} className="text-sm font-semibold text-foreground hover:text-primary truncate">
                                                    {company?.name || order.companyName}
                                                </Link>
                                                <span className="text-[10px] text-muted font-bold uppercase">{company?.sector}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted">
                                                <span>Last: {order.quantity} shares @ ₹{order.price.toLocaleString()}</span>
                                                <span>{timeAgo(order.createdAt)}</span>
                                            </div>
                                        </div>

                                        {/* Current Price */}
                                        <div className="text-right shrink-0 hidden sm:block">
                                            <p className="text-sm font-bold text-foreground">₹{currentPrice.toLocaleString()}</p>
                                            <p className={`text-xs font-semibold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}% since last buy
                                            </p>
                                        </div>

                                        {/* Action */}
                                        <div className="shrink-0">
                                            {isReordered ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-green-100 text-green-700">
                                                    <Icon name="CheckCircleIcon" size={14} /> Ordered
                                                </span>
                                            ) : isConfirming ? (
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => setConfirmingId(null)} className="text-xs">Cancel</Button>
                                                    <Button size="sm" onClick={() => handleReorder(order.companyId)} className="bg-green-600 text-white hover:bg-green-700 text-xs">
                                                        Confirm
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => setConfirmingId(order.companyId)}
                                                    className="bg-primary text-white hover:bg-primary/90 text-xs"
                                                >
                                                    <Icon name="ArrowPathIcon" size={14} className="mr-1" /> Re-Buy
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Confirm Drawer */}
                                    {isConfirming && (
                                        <div className="mt-3 pt-3 border-t border-border animate-in fade-in slide-in-from-top-2">
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Quantity</p>
                                                    <p className="text-sm font-bold text-foreground">{order.quantity} shares</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Price</p>
                                                    <p className="text-sm font-bold text-foreground">₹{currentPrice.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Total</p>
                                                    <p className="text-sm font-bold text-primary">₹{(currentPrice * order.quantity).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-muted text-center mt-2">Same quantity as your last order. You can modify on the buy page.</p>
                                            <div className="flex justify-center mt-2">
                                                <Link href={`/dashboard/customer/buy/${order.companyId}`} className="text-xs text-primary hover:underline font-semibold">
                                                    Modify quantity instead →
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
