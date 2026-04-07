'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';

export default function TaxStatementPage() {
    const { user } = useAuth();
    const { orders, companies } = useAppStore();

    // Financial year: April to March
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-indexed
    const defaultFY = currentMonth >= 3 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;

    const [selectedFY, setSelectedFY] = useState(defaultFY);

    // Generate available FY options
    const fyOptions = useMemo(() => {
        const years = new Set<string>();
        orders.forEach(o => {
            const d = new Date(o.createdAt);
            const fy = d.getMonth() >= 3
                ? `${d.getFullYear()}-${d.getFullYear() + 1}`
                : `${d.getFullYear() - 1}-${d.getFullYear()}`;
            years.add(fy);
        });
        return Array.from(years).sort().reverse();
    }, [orders]);

    if (!user) return null;

    const userOrders = orders.filter(o => o.userId === user.id && o.status === 'in_holding');

    // Filter by FY
    const [fyStart, fyEnd] = selectedFY.split('-').map(Number);
    const fyStartDate = new Date(fyStart, 3, 1); // April 1
    const fyEndDate = new Date(fyEnd, 2, 31, 23, 59, 59); // March 31

    const fyOrders = userOrders.filter(o => {
        const d = new Date(o.createdAt);
        return d >= fyStartDate && d <= fyEndDate;
    });

    // Compute P&L
    const buyOrders = fyOrders.filter(o => o.type === 'buy');
    const sellOrders = fyOrders.filter(o => o.type === 'sell');

    const totalBuyValue = buyOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalSellValue = sellOrders.reduce((s, o) => s + o.totalAmount, 0);
    const netPL = totalSellValue - totalBuyValue;

    // Per-company breakdown
    const companyBreakdown = useMemo(() => {
        const map: Record<string, { name: string; buys: number; sells: number; buyQty: number; sellQty: number; avgBuyPrice: number }> = {};
        fyOrders.forEach(o => {
            if (!map[o.companyId]) {
                map[o.companyId] = { name: o.companyName, buys: 0, sells: 0, buyQty: 0, sellQty: 0, avgBuyPrice: 0 };
            }
            if (o.type === 'buy') {
                map[o.companyId].buys += o.totalAmount;
                map[o.companyId].buyQty += o.quantity;
            } else {
                map[o.companyId].sells += o.totalAmount;
                map[o.companyId].sellQty += o.quantity;
            }
        });
        return Object.entries(map).map(([id, data]) => ({
            companyId: id,
            ...data,
            avgBuyPrice: data.buyQty > 0 ? data.buys / data.buyQty : 0,
            pl: data.sells - data.buys,
        }));
    }, [fyOrders]);

    // For unlisted shares: LTCG if held > 24 months
    const totalSTCG = companyBreakdown.filter(c => c.pl > 0).reduce((s, c) => s + c.pl, 0);
    const totalLTCG = 0; // Would need sell date - buy date comparison; simplified here

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Tax Statement</h1>
                    <p className="text-muted mt-1">Capital gains summary for income tax filing.</p>
                </div>
                <select
                    className="h-10 px-4 border border-border rounded-lg text-sm font-semibold bg-background focus:ring-1 focus:ring-primary outline-none"
                    value={selectedFY}
                    onChange={e => setSelectedFY(e.target.value)}
                >
                    {fyOptions.length === 0 && <option value={defaultFY}>FY {defaultFY}</option>}
                    {fyOptions.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
                </select>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Total Purchases</div>
                        <div className="text-2xl font-bold text-foreground">₹{totalBuyValue.toLocaleString()}</div>
                        <div className="text-xs text-muted mt-1">{buyOrders.length} transactions</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Total Sales</div>
                        <div className="text-2xl font-bold text-foreground">₹{totalSellValue.toLocaleString()}</div>
                        <div className="text-xs text-muted mt-1">{sellOrders.length} transactions</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Net P&L</div>
                        <div className={`text-2xl font-bold ${netPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {netPL >= 0 ? '+' : ''}₹{netPL.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                        <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">STCG (Estimated)</div>
                        <div className="text-2xl font-bold text-foreground">₹{totalSTCG.toLocaleString()}</div>
                        <div className="text-xs text-muted mt-1">At slab rate</div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction breakdown */}
            <Card className="border-border shadow-sm mb-8">
                <CardHeader className="border-b border-border/50">
                    <CardTitle className="font-display text-lg font-medium">Company-wise Breakdown</CardTitle>
                    <CardDescription className="text-muted">FY {selectedFY} settled transactions.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-surface/50 hover:bg-surface/50">
                                <TableHead className="text-muted font-semibold pl-6">Company</TableHead>
                                <TableHead className="text-right text-muted font-semibold">Buy Value</TableHead>
                                <TableHead className="text-right text-muted font-semibold">Buy Qty</TableHead>
                                <TableHead className="text-right text-muted font-semibold">Sell Value</TableHead>
                                <TableHead className="text-right text-muted font-semibold">Sell Qty</TableHead>
                                <TableHead className="text-right text-muted font-semibold pr-6">P&L</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companyBreakdown.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center p-8 text-muted italic">No transactions in this financial year.</TableCell>
                                </TableRow>
                            ) : companyBreakdown.map(c => (
                                <TableRow key={c.companyId} className="border-border hover:bg-surface/30">
                                    <TableCell className="pl-6 font-medium text-foreground">{c.name}</TableCell>
                                    <TableCell className="text-right">₹{c.buys.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-muted">{c.buyQty}</TableCell>
                                    <TableCell className="text-right">₹{c.sells.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-muted">{c.sellQty}</TableCell>
                                    <TableCell className={`text-right pr-6 font-bold ${c.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {c.pl >= 0 ? '+' : ''}₹{c.pl.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* All transactions */}
            <Card className="border-border shadow-sm mb-8">
                <CardHeader className="border-b border-border/50">
                    <CardTitle className="font-display text-lg font-medium">All Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-surface/50 hover:bg-surface/50">
                                <TableHead className="text-muted font-semibold pl-6">Date</TableHead>
                                <TableHead className="text-muted font-semibold">Company</TableHead>
                                <TableHead className="text-muted font-semibold">Type</TableHead>
                                <TableHead className="text-right text-muted font-semibold">Qty</TableHead>
                                <TableHead className="text-right text-muted font-semibold">Price</TableHead>
                                <TableHead className="text-right text-muted font-semibold pr-6">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fyOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center p-8 text-muted italic">No transactions found.</TableCell>
                                </TableRow>
                            ) : fyOrders.map(o => (
                                <TableRow key={o.id} className="border-border hover:bg-surface/30">
                                    <TableCell className="pl-6 text-muted text-sm">{new Date(o.createdAt).toLocaleDateString('en-IN')}</TableCell>
                                    <TableCell className="font-medium text-foreground">{o.companyName}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${o.type === 'buy' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {o.type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">{o.quantity}</TableCell>
                                    <TableCell className="text-right">₹{o.price.toLocaleString()}</TableCell>
                                    <TableCell className="text-right pr-6 font-semibold">₹{o.totalAmount.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Disclaimer:</strong> This is an indicative summary for reference only. Capital gains classification (STCG/LTCG) for unlisted shares depends on the holding period (24 months for LTCG). Please consult a chartered accountant for accurate tax computation and filing.
            </div>
        </div>
    );
}
