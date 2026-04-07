'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';

export default function ManagerReports() {
    const { orders, leads, users, commissions, tickets, rmTargets } = useAppStore();
    const [generating, setGenerating] = useState<string | null>(null);

    const rms = users.filter(u => u.role === 'rm');
    const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    const generateCSV = (type: string) => {
        setGenerating(type);
        let csv = '';
        let filename = '';

        if (type === 'orders') {
            csv = 'Order ID,Customer,Company,Type,Quantity,Price,Total,Status,Date\n';
            orders.forEach(o => {
                const userName = users.find(u => u.id === o.userId)?.name || o.userId;
                csv += `${o.id},${userName},${o.companyName},${o.type},${o.quantity},${o.price},${o.quantity * o.price},${o.status},${o.createdAt}\n`;
            });
            filename = 'orders_report.csv';
        } else if (type === 'leads') {
            csv = 'Lead ID,Name,Email,Phone,Status,KYC Status,Assigned RM,Created\n';
            leads.forEach(l => {
                const rmName = users.find(u => u.id === l.assignedRmId)?.name || l.assignedRmId;
                csv += `${l.id},${l.name},${l.email},${l.phone},${l.status},${l.kycStatus},${rmName},${l.createdAt}\n`;
            });
            filename = 'leads_report.csv';
        } else if (type === 'rm_performance') {
            csv = 'RM Name,Assigned Deals,Settled,Volume,Target,Achievement %,Commission Earned\n';
            rms.forEach(rm => {
                const assignedCustomers = users.filter(u => u.assignedRmId === rm.id).map(u => u.id);
                const rmOrders = orders.filter(o => assignedCustomers.includes(o.userId));
                const settled = rmOrders.filter(o => o.status === 'in_holding');
                const volume = settled.reduce((s, o) => s + o.price * o.quantity, 0);
                const target = rmTargets[rm.id] || 0;
                const commission = commissions.filter(c => c.rmId === rm.id).reduce((s, c) => s + c.commissionAmount, 0);
                csv += `${rm.name},${rmOrders.length},${settled.length},${volume},${target},${target > 0 ? ((volume / target) * 100).toFixed(1) : 0}%,${commission}\n`;
            });
            filename = 'rm_performance_report.csv';
        } else if (type === 'commissions') {
            csv = 'RM,Order ID,Order Amount,Rate,Commission,Status,Date\n';
            commissions.forEach(c => {
                const rmName = users.find(u => u.id === c.rmId)?.name || c.rmId;
                csv += `${rmName},${c.orderId},${c.orderAmount},${c.commissionRate}%,${c.commissionAmount},${c.status},${c.createdAt}\n`;
            });
            filename = 'commissions_report.csv';
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        setTimeout(() => setGenerating(null), 1000);
    };

    const reports = [
        { id: 'orders', title: 'Orders Report', description: 'All platform transactions with customer, company, type, and status details.', icon: 'ClipboardDocumentListIcon', color: 'bg-blue-50 text-blue-600', count: `${orders.length} orders` },
        { id: 'leads', title: 'Leads Report', description: 'Complete lead pipeline with KYC status, RM assignment, and contact info.', icon: 'UserPlusIcon', color: 'bg-green-50 text-green-600', count: `${leads.length} leads` },
        { id: 'rm_performance', title: 'RM Performance Report', description: 'Per-RM breakdown of deals, volume, target achievement, and commissions.', icon: 'ChartBarIcon', color: 'bg-purple-50 text-purple-600', count: `${rms.length} RMs` },
        { id: 'commissions', title: 'Commission Report', description: 'Detailed commission ledger with approval status and payout tracking.', icon: 'BanknotesIcon', color: 'bg-amber-50 text-amber-600', count: `${commissions.length} entries` },
    ];

    // Quick stats
    const totalOrderVolume = orders.reduce((s, o) => s + o.price * o.quantity, 0);
    const conversionRate = leads.length > 0 ? ((leads.filter(l => l.status === 'onboarded').length / leads.length) * 100).toFixed(1) : '0';
    const avgDealSize = orders.length > 0 ? totalOrderVolume / orders.length : 0;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{formatINR(totalOrderVolume)}</p>
                        <p className="text-xs text-muted uppercase tracking-wider mt-1">Total Order Volume</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
                        <p className="text-xs text-muted uppercase tracking-wider mt-1">Lead Conversion Rate</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{formatINR(avgDealSize)}</p>
                        <p className="text-xs text-muted uppercase tracking-wider mt-1">Avg Deal Size</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{tickets.filter(t => t.status !== 'resolved').length}</p>
                        <p className="text-xs text-muted uppercase tracking-wider mt-1">Active Tickets</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map(report => (
                    <Card key={report.id} className="border-border shadow-sm bg-white hover:shadow-md transition-shadow">
                        <CardContent className="pt-6 pb-5">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${report.color}`}>
                                    <Icon name={report.icon} size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
                                    <p className="text-xs text-muted mb-3">{report.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-muted font-medium uppercase tracking-wider bg-surface px-2 py-1 rounded border border-border">{report.count}</span>
                                        <Button size="sm" variant="outline" className="text-xs font-bold uppercase tracking-wider"
                                            onClick={() => generateCSV(report.id)}
                                            disabled={generating === report.id}>
                                            <Icon name="ArrowDownTrayIcon" size={14} className="mr-1.5" />
                                            {generating === report.id ? 'Generating...' : 'Export CSV'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    );
}
