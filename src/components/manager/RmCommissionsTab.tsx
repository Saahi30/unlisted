'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface CommissionRecord {
    id: string;
    rm_id: string;
    rm_name: string;
    month: string; // YYYY-MM
    settled_orders: number;
    total_volume: number;
    commission_rate: number;
    commission_amount: number;
    status: 'pending' | 'approved' | 'paid';
    created_at: string;
}

const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const statusStyles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-blue-50 text-blue-700 border-blue-200',
    paid: 'bg-green-50 text-green-700 border-green-200',
};

function getMonthOptions() {
    const options: { label: string; value: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
        options.push({ label, value });
    }
    return options;
}

export default function RmCommissionsTab() {
    const { orders, users } = useAppStore();
    const rms = useMemo(() => users.filter(u => u.role === 'rm'), [users]);

    const [dbCommissions, setDbCommissions] = useState<CommissionRecord[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [editingRate, setEditingRate] = useState<Record<string, string>>({});

    const monthOptions = useMemo(() => getMonthOptions(), []);

    const fetchCommissions = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('rm_commissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (data && data.length > 0) {
            const parsed: CommissionRecord[] = data.map(c => ({
                id: c.id,
                rm_id: c.rm_id,
                rm_name: c.rm_name || 'Unknown',
                month: c.month,
                settled_orders: c.settled_orders || 0,
                total_volume: c.total_volume || 0,
                commission_rate: c.commission_rate ?? 0.5,
                commission_amount: c.commission_amount || 0,
                status: c.status || 'pending',
                created_at: c.created_at,
            }));
            setDbCommissions(parsed);
        } else {
            setDbCommissions([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchCommissions();
    }, [fetchCommissions]);

    // Calculate commissions from settled orders for each RM
    const calculatedCommissions = useMemo(() => {
        return rms.map(rm => {
            // Find customers assigned to this RM
            const assignedCustomerIds = users
                .filter(u => u.assignedRmId === rm.id)
                .map(u => u.id);

            // Find settled orders (in_holding) for these customers
            const settledOrders = orders.filter(o =>
                assignedCustomerIds.includes(o.userId) && o.status === 'in_holding'
            );

            // Filter by selected month
            const monthOrders = settledOrders.filter(o => {
                if (!o.createdAt) return false;
                const orderDate = new Date(o.createdAt);
                const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
                return orderMonth === selectedMonth;
            });

            const totalVolume = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
            const rate = 0.5; // default 0.5%
            const commissionAmount = (totalVolume * rate) / 100;

            return {
                rm_id: rm.id,
                rm_name: rm.name,
                settled_orders: monthOrders.length,
                total_volume: totalVolume,
                commission_rate: rate,
                commission_amount: commissionAmount,
            };
        });
    }, [rms, orders, users, selectedMonth]);

    // Merge DB records with calculated data for the selected month
    const commissionRows = useMemo(() => {
        return calculatedCommissions.map(calc => {
            const dbRecord = dbCommissions.find(
                c => c.rm_id === calc.rm_id && c.month === selectedMonth
            );

            if (dbRecord) {
                return {
                    ...dbRecord,
                    settled_orders: calc.settled_orders || dbRecord.settled_orders,
                    total_volume: calc.total_volume || dbRecord.total_volume,
                    commission_amount: calc.total_volume > 0
                        ? (calc.total_volume * dbRecord.commission_rate) / 100
                        : dbRecord.commission_amount,
                };
            }

            return {
                id: '',
                rm_id: calc.rm_id,
                rm_name: calc.rm_name,
                month: selectedMonth,
                settled_orders: calc.settled_orders,
                total_volume: calc.total_volume,
                commission_rate: calc.commission_rate,
                commission_amount: calc.commission_amount,
                status: 'pending' as const,
                created_at: '',
            };
        });
    }, [calculatedCommissions, dbCommissions, selectedMonth]);

    // Summary
    const totalCommissions = commissionRows.reduce((sum, r) => sum + r.commission_amount, 0);
    const pendingPayouts = commissionRows
        .filter(r => r.status === 'pending' || r.status === 'approved')
        .reduce((sum, r) => sum + r.commission_amount, 0);
    const paidThisMonth = commissionRows
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + r.commission_amount, 0);

    const handleApprove = async (row: CommissionRecord) => {
        setActionLoading(prev => ({ ...prev, [`approve_${row.rm_id}`]: true }));

        if (row.id) {
            await supabase
                .from('rm_commissions')
                .update({ status: 'approved' })
                .eq('id', row.id);
        } else {
            await supabase.from('rm_commissions').insert([{
                rm_id: row.rm_id,
                rm_name: row.rm_name,
                month: selectedMonth,
                settled_orders: row.settled_orders,
                total_volume: row.total_volume,
                commission_rate: row.commission_rate,
                commission_amount: row.commission_amount,
                status: 'approved',
            }]);
        }

        await supabase.from('audit_log').insert([{
            entity_type: 'rm_commission',
            entity_id: row.id || row.rm_id,
            action: 'approve_commission',
            old_value: 'pending',
            new_value: 'approved',
            performed_by_name: 'Manager',
            performed_by_role: 'staffmanager',
            metadata: { rm_name: row.rm_name, amount: row.commission_amount, month: selectedMonth }
        }]);

        await fetchCommissions();
        setActionLoading(prev => ({ ...prev, [`approve_${row.rm_id}`]: false }));
    };

    const handleMarkPaid = async (row: CommissionRecord) => {
        if (!row.id) return;
        setActionLoading(prev => ({ ...prev, [`paid_${row.rm_id}`]: true }));

        await supabase
            .from('rm_commissions')
            .update({ status: 'paid' })
            .eq('id', row.id);

        await supabase.from('audit_log').insert([{
            entity_type: 'rm_commission',
            entity_id: row.id,
            action: 'mark_paid',
            old_value: 'approved',
            new_value: 'paid',
            performed_by_name: 'Manager',
            performed_by_role: 'staffmanager',
            metadata: { rm_name: row.rm_name, amount: row.commission_amount, month: selectedMonth }
        }]);

        await fetchCommissions();
        setActionLoading(prev => ({ ...prev, [`paid_${row.rm_id}`]: false }));
    };

    const handleAdjustRate = async (row: CommissionRecord) => {
        const newRate = parseFloat(editingRate[row.rm_id]);
        if (isNaN(newRate) || newRate < 0 || newRate > 10) return;

        setActionLoading(prev => ({ ...prev, [`rate_${row.rm_id}`]: true }));

        const newAmount = (row.total_volume * newRate) / 100;

        if (row.id) {
            await supabase
                .from('rm_commissions')
                .update({ commission_rate: newRate, commission_amount: newAmount })
                .eq('id', row.id);
        } else {
            await supabase.from('rm_commissions').insert([{
                rm_id: row.rm_id,
                rm_name: row.rm_name,
                month: selectedMonth,
                settled_orders: row.settled_orders,
                total_volume: row.total_volume,
                commission_rate: newRate,
                commission_amount: newAmount,
                status: 'pending',
            }]);
        }

        await fetchCommissions();
        setEditingRate(prev => {
            const next = { ...prev };
            delete next[row.rm_id];
            return next;
        });
        setActionLoading(prev => ({ ...prev, [`rate_${row.rm_id}`]: false }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-border shadow-sm">
                    <CardHeader className="pb-2 border-b border-border/50">
                        <CardTitle className="text-sm text-muted font-semibold tracking-wide uppercase flex items-center">
                            <Icon name="CurrencyRupeeIcon" size={16} className="mr-2" />
                            Total Commissions Earned
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-foreground">{formatINR(totalCommissions)}</div>
                        <div className="text-xs text-muted mt-1 font-medium">For {monthOptions.find(m => m.value === selectedMonth)?.label}</div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-border shadow-sm">
                    <CardHeader className="pb-2 border-b border-border/50">
                        <CardTitle className="text-sm text-muted font-semibold tracking-wide uppercase flex items-center">
                            <Icon name="ClockIcon" size={16} className="mr-2" />
                            Pending Payouts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-amber-600">{formatINR(pendingPayouts)}</div>
                        <div className="text-xs text-muted mt-1 font-medium">Awaiting approval or payment</div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-border shadow-sm">
                    <CardHeader className="pb-2 border-b border-border/50">
                        <CardTitle className="text-sm text-muted font-semibold tracking-wide uppercase flex items-center">
                            <Icon name="CheckCircleIcon" size={16} className="mr-2" />
                            Paid This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-green-600">{formatINR(paidThisMonth)}</div>
                        <div className="text-xs text-muted mt-1 font-medium">Successfully disbursed</div>
                    </CardContent>
                </Card>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-muted uppercase tracking-wider">Month</label>
                <select
                    className="text-sm bg-surface border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                >
                    {monthOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Commissions Table */}
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-white">
                    <CardTitle className="font-display font-medium text-lg">RM Commission Breakdown</CardTitle>
                    <CardDescription className="text-muted">Review, approve, and disburse RM commissions based on settled orders.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50 hover:bg-surface/50">
                                    <TableHead className="text-muted font-semibold pl-6">RM Name</TableHead>
                                    <TableHead className="text-center text-muted font-semibold">Settled Orders</TableHead>
                                    <TableHead className="text-right text-muted font-semibold">Total Volume</TableHead>
                                    <TableHead className="text-center text-muted font-semibold">Rate (%)</TableHead>
                                    <TableHead className="text-right text-muted font-semibold">Commission</TableHead>
                                    <TableHead className="text-center text-muted font-semibold">Status</TableHead>
                                    <TableHead className="text-right text-muted font-semibold pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {commissionRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center p-12 text-muted">
                                            <Icon name="BanknotesIcon" size={32} className="mx-auto mb-3 text-muted/50" />
                                            <p>No commission data for this period.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : commissionRows.map(row => {
                                    const isEditingRate = editingRate[row.rm_id] !== undefined;

                                    return (
                                        <TableRow key={row.rm_id} className="border-border hover:bg-surface/30">
                                            <TableCell className="font-medium text-foreground pl-6">{row.rm_name}</TableCell>
                                            <TableCell className="text-center font-medium">{row.settled_orders}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatINR(row.total_volume)}</TableCell>
                                            <TableCell className="text-center">
                                                {isEditingRate ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            max="10"
                                                            className="w-16 text-center text-sm border border-border rounded px-1 py-0.5 outline-none focus:border-primary"
                                                            value={editingRate[row.rm_id]}
                                                            onChange={e => setEditingRate(prev => ({ ...prev, [row.rm_id]: e.target.value }))}
                                                        />
                                                        <button
                                                            className="text-primary hover:text-primary/80"
                                                            onClick={() => handleAdjustRate(row)}
                                                            disabled={actionLoading[`rate_${row.rm_id}`]}
                                                        >
                                                            <Icon name="CheckIcon" size={14} />
                                                        </button>
                                                        <button
                                                            className="text-muted hover:text-foreground"
                                                            onClick={() => setEditingRate(prev => {
                                                                const next = { ...prev };
                                                                delete next[row.rm_id];
                                                                return next;
                                                            })}
                                                        >
                                                            <Icon name="XMarkIcon" size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                                                        onClick={() => setEditingRate(prev => ({ ...prev, [row.rm_id]: String(row.commission_rate) }))}
                                                    >
                                                        {row.commission_rate}%
                                                    </button>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-foreground">{formatINR(row.commission_amount)}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${statusStyles[row.status]}`}>
                                                    {row.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    {row.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-widest"
                                                            onClick={() => handleApprove(row)}
                                                            disabled={actionLoading[`approve_${row.rm_id}`]}
                                                        >
                                                            Approve
                                                        </Button>
                                                    )}
                                                    {row.status === 'approved' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs font-bold uppercase tracking-widest border-green-200 text-green-700 hover:bg-green-50"
                                                            onClick={() => handleMarkPaid(row)}
                                                            disabled={actionLoading[`paid_${row.rm_id}`]}
                                                        >
                                                            Mark Paid
                                                        </Button>
                                                    )}
                                                    {row.status === 'paid' && (
                                                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                                            <Icon name="CheckCircleIcon" size={14} />
                                                            Paid
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
