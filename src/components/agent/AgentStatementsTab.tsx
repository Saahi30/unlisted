'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/button';

export default function AgentStatementsTab({ kycData }: { kycData: any }) {
    const { user } = useAuth();
    const supabase = createClient();
    const [orders, setOrders] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        const fetch = async () => {
            if (!user) return;
            const { data: oData } = await supabase
                .from('agent_client_orders')
                .select('*, companies(name)')
                .eq('agent_id', user.id)
                .eq('status', 'paid')
                .order('created_at', { ascending: false });

            const { data: wData } = await supabase
                .from('agent_withdrawals')
                .select('*')
                .eq('agent_id', user.id)
                .order('created_at', { ascending: false });

            if (oData) setOrders(oData);
            else if (user.id === 'agt_1') {
                const now = Date.now();
                setOrders([
                    { id: '1', companies: { name: 'TechCorp India' }, quantity: 50, selling_price: 180, base_price: 150, fixed_markup: 5, agent_earnings: 1250, platform_cut: 250, created_at: new Date(now - 86400000 * 5).toISOString() },
                    { id: '2', companies: { name: 'FinServ Ltd' }, quantity: 100, selling_price: 340, base_price: 300, fixed_markup: 5, agent_earnings: 3500, platform_cut: 700, created_at: new Date(now - 86400000 * 10).toISOString() },
                    { id: '3', companies: { name: 'GreenEnergy Pvt' }, quantity: 200, selling_price: 150, base_price: 130, fixed_markup: 5, agent_earnings: 3000, platform_cut: 600, created_at: new Date(now - 86400000 * 20).toISOString() },
                    { id: '4', companies: { name: 'TechCorp India' }, quantity: 80, selling_price: 185, base_price: 150, fixed_markup: 5, agent_earnings: 2400, platform_cut: 480, created_at: new Date(now - 86400000 * 35).toISOString() },
                ]);
            }

            if (wData) setWithdrawals(wData);
            else if (user.id === 'agt_1') {
                setWithdrawals([
                    { id: 'w1', amount: 5000, status: 'paid', paid_at: new Date(Date.now() - 86400000 * 7).toISOString(), created_at: new Date(Date.now() - 86400000 * 10).toISOString() },
                ]);
            }
            setLoading(false);
        };
        fetch();
    }, [user]);

    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const monthOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= monthStart && d <= monthEnd;
    });

    const monthWithdrawals = withdrawals.filter(w => {
        const d = new Date(w.created_at);
        return d >= monthStart && d <= monthEnd;
    });

    const totalEarnings = monthOrders.reduce((s, o) => s + Number(o.agent_earnings || 0), 0);
    const totalPlatformCut = monthOrders.reduce((s, o) => s + Number(o.platform_cut || 0), 0);
    const totalWithdrawn = monthWithdrawals.filter(w => w.status === 'paid').reduce((s, w) => s + Number(w.amount || 0), 0);
    const tdsRate = 0.05; // 5% TDS on commission income
    const estimatedTds = totalEarnings * tdsRate;
    const netEarnings = totalEarnings - estimatedTds;

    const generateMonthOptions = () => {
        const options = [];
        for (let i = 0; i < 12; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            options.push({
                value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
            });
        }
        return options;
    };

    const handleDownload = () => {
        // Generate CSV
        const header = 'Date,Company,Quantity,Selling Price,Base Price,Markup,Gross Earnings,Platform Cut,Net Earnings\n';
        const rows = monthOrders.map(o =>
            `${new Date(o.created_at).toLocaleDateString()},${o.companies?.name || 'N/A'},${o.quantity},${o.selling_price},${o.base_price},${o.fixed_markup},${o.agent_earnings},${o.platform_cut},${Number(o.agent_earnings) - Number(o.agent_earnings) * tdsRate}`
        ).join('\n');

        const summary = `\n\nSummary\nPeriod,${new Date(monthStart).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}\nTotal Orders,${monthOrders.length}\nGross Earnings,${totalEarnings}\nEstimated TDS (5%),${estimatedTds.toFixed(2)}\nNet Earnings,${netEarnings.toFixed(2)}\nWithdrawals,${totalWithdrawn}\n\nAgent Details\nName,${user?.name}\nPAN,${kycData?.pan_number || 'N/A'}\nEmail,${user?.email}`;

        const csv = header + rows + summary;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `commission_statement_${selectedMonth}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <div className="text-center p-8 text-muted">Loading Statements...</div>;

    return (
        <div className="space-y-6">
            {/* Month selector & download */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-display font-bold text-lg text-foreground">Commission Statement</h3>
                    <p className="text-sm text-muted">Monthly earnings breakdown with TDS estimates</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm">
                        {generateMonthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <Button onClick={handleDownload} variant="outline" className="text-sm">
                        <Icon name="ArrowDownTrayIcon" size={16} className="mr-1" /> Download CSV
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Orders</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{monthOrders.length}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Gross Earnings</p>
                    <p className="text-2xl font-bold text-foreground mt-2">₹{totalEarnings.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-5 border border-red-200 shadow-sm">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Est. TDS (5%)</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">₹{estimatedTds.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-5 border border-green-200 shadow-sm">
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Net Earnings</p>
                    <p className="text-2xl font-bold text-green-700 mt-2">₹{netEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Withdrawn</p>
                    <p className="text-2xl font-bold text-foreground mt-2">₹{totalWithdrawn.toLocaleString()}</p>
                </div>
            </div>

            {/* Tax Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Icon name="InformationCircleIcon" size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-blue-800">TDS Information</p>
                    <p className="text-xs text-blue-700 mt-1">
                        TDS at 5% is deducted on commission income as per Section 194H of the Income Tax Act.
                        The actual TDS certificate (Form 16A) will be issued quarterly by ShareSaathi.
                        PAN on file: <span className="font-mono font-bold">{kycData?.pan_number || 'Not submitted'}</span>
                    </p>
                </div>
            </div>

            {/* Detailed Orders Table */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-surface/30">
                    <h4 className="font-display font-bold">Order-wise Breakdown</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-muted uppercase bg-surface/50 border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Date</th>
                                <th className="px-4 py-3 text-left font-semibold">Company</th>
                                <th className="px-4 py-3 text-right font-semibold">Qty</th>
                                <th className="px-4 py-3 text-right font-semibold">Sell Price</th>
                                <th className="px-4 py-3 text-right font-semibold">Cost Price</th>
                                <th className="px-4 py-3 text-right font-semibold">Gross Earn</th>
                                <th className="px-4 py-3 text-right font-semibold">TDS</th>
                                <th className="px-4 py-3 text-right font-semibold">Net</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {monthOrders.length === 0 ? (
                                <tr><td colSpan={8} className="text-center p-8 text-muted italic">No transactions this month.</td></tr>
                            ) : monthOrders.map(o => {
                                const gross = Number(o.agent_earnings || 0);
                                const tds = gross * tdsRate;
                                return (
                                    <tr key={o.id} className="hover:bg-surface/30">
                                        <td className="px-4 py-3 text-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-medium">{o.companies?.name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-right">{o.quantity}</td>
                                        <td className="px-4 py-3 text-right">₹{Number(o.selling_price).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-muted">₹{(Number(o.base_price) + Number(o.fixed_markup)).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-green-700">₹{gross.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-red-500">₹{tds.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td className="px-4 py-3 text-right font-bold">₹{(gross - tds).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {monthOrders.length > 0 && (
                            <tfoot className="bg-surface/50 border-t-2 border-border font-bold text-sm">
                                <tr>
                                    <td colSpan={5} className="px-4 py-3 text-right uppercase text-muted tracking-wider">Totals</td>
                                    <td className="px-4 py-3 text-right text-green-700">₹{totalEarnings.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-red-500">₹{estimatedTds.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 text-right">₹{netEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
