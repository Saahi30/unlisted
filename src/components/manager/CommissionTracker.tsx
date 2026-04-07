'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';

export default function CommissionTracker() {
    const { commissions, updateCommissionStatus, users } = useAppStore();
    const [filterRm, setFilterRm] = useState<string>('all');

    const rms = users.filter(u => u.role === 'rm');
    const getRmName = (id: string) => users.find(u => u.id === id)?.name || id;

    const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    const filtered = filterRm === 'all' ? commissions : commissions.filter(c => c.rmId === filterRm);

    const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0);
    const totalApproved = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + c.commissionAmount, 0);
    const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);

    // Per-RM summary
    const rmSummary = rms.map(rm => {
        const rmComms = commissions.filter(c => c.rmId === rm.id);
        return {
            ...rm,
            totalEarned: rmComms.reduce((s, c) => s + c.commissionAmount, 0),
            paid: rmComms.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0),
            pending: rmComms.filter(c => c.status !== 'paid').reduce((s, c) => s + c.commissionAmount, 0),
            deals: rmComms.length,
        };
    });

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Icon name="ClockIcon" size={20} className="text-amber-600" /></div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{formatINR(totalPending)}</p>
                                <p className="text-xs text-muted font-medium uppercase tracking-wider">Pending Approval</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Icon name="CheckIcon" size={20} className="text-blue-600" /></div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{formatINR(totalApproved)}</p>
                                <p className="text-xs text-muted font-medium uppercase tracking-wider">Approved (Unpaid)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><Icon name="BanknotesIcon" size={20} className="text-green-600" /></div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{formatINR(totalPaid)}</p>
                                <p className="text-xs text-muted font-medium uppercase tracking-wider">Total Paid Out</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RM Commission Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {rmSummary.map(rm => (
                    <Card key={rm.id} className="bg-white border-border shadow-sm">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{rm.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-semibold text-sm">{rm.name}</p>
                                        <p className="text-[10px] text-muted">{rm.deals} commission entries</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-foreground">{formatINR(rm.totalEarned)}</p>
                                    <p className="text-[10px] text-muted uppercase">Total Earned</p>
                                </div>
                            </div>
                            <div className="flex gap-4 text-xs">
                                <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                                    <p className="font-bold text-green-700">{formatINR(rm.paid)}</p>
                                    <p className="text-green-600/70 text-[10px]">Paid</p>
                                </div>
                                <div className="flex-1 bg-amber-50 rounded-lg p-2 text-center">
                                    <p className="font-bold text-amber-700">{formatINR(rm.pending)}</p>
                                    <p className="text-amber-600/70 text-[10px]">Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-white">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div>
                            <CardTitle className="font-display font-medium text-lg">Commission Ledger</CardTitle>
                            <CardDescription className="text-muted">All commission entries with approval workflow.</CardDescription>
                        </div>
                        <select className="text-xs bg-surface border border-border rounded-lg px-3 py-2 outline-none w-fit"
                            value={filterRm} onChange={e => setFilterRm(e.target.value)}>
                            <option value="all">All RMs</option>
                            {rms.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                        </select>
                    </div>
                </CardHeader>
                <CardContent className="p-0 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50 hover:bg-surface/50">
                                    <TableHead className="text-muted font-semibold pl-6">RM</TableHead>
                                    <TableHead className="text-muted font-semibold">Order ID</TableHead>
                                    <TableHead className="text-right text-muted font-semibold">Order Amt</TableHead>
                                    <TableHead className="text-center text-muted font-semibold">Rate</TableHead>
                                    <TableHead className="text-right text-muted font-semibold">Commission</TableHead>
                                    <TableHead className="text-center text-muted font-semibold">Status</TableHead>
                                    <TableHead className="pr-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(c => (
                                    <TableRow key={c.id} className="border-border hover:bg-surface/30">
                                        <TableCell className="font-medium pl-6">{getRmName(c.rmId)}</TableCell>
                                        <TableCell className="text-xs text-muted font-mono">{c.orderId}</TableCell>
                                        <TableCell className="text-right font-medium">{formatINR(c.orderAmount)}</TableCell>
                                        <TableCell className="text-center text-sm">{c.commissionRate}%</TableCell>
                                        <TableCell className="text-right font-bold text-foreground">{formatINR(c.commissionAmount)}</TableCell>
                                        <TableCell className="text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === 'paid' ? 'bg-green-50 text-green-600' : c.status === 'approved' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {c.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            {c.status === 'pending' && (
                                                <Button variant="ghost" size="sm" className="text-xs text-primary font-bold" onClick={() => updateCommissionStatus(c.id, 'approved')}>Approve</Button>
                                            )}
                                            {c.status === 'approved' && (
                                                <Button variant="ghost" size="sm" className="text-xs text-green-600 font-bold" onClick={() => updateCommissionStatus(c.id, 'paid')}>Mark Paid</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
