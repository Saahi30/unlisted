'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';

export default function ExportPage() {
    const { user } = useAuth();
    const { orders, companies } = useAppStore();

    const settledOrders = orders.filter(o => o.userId === user?.id && o.status === 'in_holding');

    const holdings = useMemo(() => {
        const map: Record<string, { companyId: string; companyName: string; sector: string; qty: number; invested: number; currentPrice: number; orders: typeof settledOrders }> = {};
        settledOrders.forEach(order => {
            const company = companies.find(c => c.id === order.companyId);
            if (!map[order.companyId]) {
                map[order.companyId] = {
                    companyId: order.companyId,
                    companyName: company?.name || order.companyName,
                    sector: company?.sector || 'Unknown',
                    qty: 0,
                    invested: 0,
                    currentPrice: company?.currentAskPrice || order.price,
                    orders: [],
                };
            }
            map[order.companyId].qty += order.quantity;
            map[order.companyId].invested += order.price * order.quantity;
            map[order.companyId].orders.push(order);
        });
        return Object.values(map);
    }, [settledOrders, companies]);

    const totalInvested = holdings.reduce((s, h) => s + h.invested, 0);
    const currentValue = holdings.reduce((s, h) => s + h.currentPrice * h.qty, 0);

    const generateCSV = () => {
        const headers = ['Company', 'Sector', 'Shares Held', 'Avg Cost (₹)', 'Current Price (₹)', 'Invested (₹)', 'Current Value (₹)', 'P&L (₹)', 'P&L (%)'];
        const rows = holdings.map(h => {
            const avgCost = h.invested / h.qty;
            const value = h.currentPrice * h.qty;
            const pnl = value - h.invested;
            const pnlPct = h.invested > 0 ? (pnl / h.invested) * 100 : 0;
            return [h.companyName, h.sector, h.qty, avgCost.toFixed(2), h.currentPrice, h.invested, value, pnl.toFixed(2), pnlPct.toFixed(2)].join(',');
        });

        // Summary row
        rows.push('');
        rows.push(`Total,,${holdings.reduce((s, h) => s + h.qty, 0)},,, ${totalInvested}, ${currentValue}, ${(currentValue - totalInvested).toFixed(2)}, ${totalInvested > 0 ? (((currentValue - totalInvested) / totalInvested) * 100).toFixed(2) : '0'}`);

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ShareSaathi_Portfolio_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateDetailedCSV = () => {
        const headers = ['Order ID', 'Company', 'Sector', 'Type', 'Quantity', 'Price (₹)', 'Total (₹)', 'Status', 'Payment Method', 'Date'];
        const allOrders = orders.filter(o => o.userId === user?.id);
        const rows = allOrders.map(o => {
            const company = companies.find(c => c.id === o.companyId);
            return [
                o.id,
                company?.name || o.companyName,
                company?.sector || '',
                o.type.toUpperCase(),
                o.quantity,
                o.price,
                o.totalAmount || o.price * o.quantity,
                o.status.replace('_', ' '),
                o.paymentMethod || '',
                new Date(o.createdAt).toLocaleDateString('en-IN'),
            ].join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ShareSaathi_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generatePDFContent = () => {
        // Generate a printable HTML page that can be saved as PDF
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>ShareSaathi Portfolio Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 24px; font-weight: 300; margin-bottom: 5px; }
        .subtitle { color: #666; font-size: 12px; margin-bottom: 30px; }
        .summary { display: flex; gap: 30px; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .summary-item { flex: 1; }
        .summary-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
        .summary-value { font-size: 20px; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f1f3f5; padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; border-bottom: 2px solid #dee2e6; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; }
        .positive { color: #16a34a; }
        .negative { color: #dc2626; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 10px; color: #999; }
    </style>
</head>
<body>
    <h1>Portfolio Report</h1>
    <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · ${user?.name || 'Investor'}</div>

    <div class="summary">
        <div class="summary-item">
            <div class="summary-label">Total Invested</div>
            <div class="summary-value">₹${totalInvested.toLocaleString()}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Current Value</div>
            <div class="summary-value">₹${currentValue.toLocaleString()}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">P&L</div>
            <div class="summary-value ${currentValue >= totalInvested ? 'positive' : 'negative'}">${currentValue >= totalInvested ? '+' : ''}₹${Math.abs(currentValue - totalInvested).toLocaleString()}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Companies</div>
            <div class="summary-value">${holdings.length}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Company</th>
                <th>Sector</th>
                <th>Shares</th>
                <th>Avg Cost</th>
                <th>Current</th>
                <th>Invested</th>
                <th>Value</th>
                <th>P&L</th>
            </tr>
        </thead>
        <tbody>
            ${holdings.map(h => {
                const avgCost = h.invested / h.qty;
                const value = h.currentPrice * h.qty;
                const pnl = value - h.invested;
                const pnlPct = h.invested > 0 ? (pnl / h.invested) * 100 : 0;
                return `<tr>
                    <td><strong>${h.companyName}</strong></td>
                    <td>${h.sector}</td>
                    <td>${h.qty}</td>
                    <td>₹${avgCost.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                    <td>₹${h.currentPrice.toLocaleString()}</td>
                    <td>₹${h.invested.toLocaleString()}</td>
                    <td>₹${value.toLocaleString()}</td>
                    <td class="${pnl >= 0 ? 'positive' : 'negative'}">${pnl >= 0 ? '+' : ''}₹${Math.abs(pnl).toLocaleString()} (${pnlPct.toFixed(1)}%)</td>
                </tr>`;
            }).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p><strong>Disclaimer:</strong> This report is for personal record-keeping only. Prices are indicative and may vary. Unlisted shares carry higher risk. Consult a financial advisor before making investment decisions.</p>
        <p>Generated by ShareSaathi · ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) {
            win.onload = () => { win.print(); };
        }
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-4xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Export Portfolio</h1>
            </div>
            <p className="text-muted mt-1 mb-8">Download your holdings and transaction history as CSV or PDF.</p>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="border-border shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={generateCSV}>
                    <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                            <Icon name="TableCellsIcon" size={28} className="text-green-600" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Holdings CSV</h3>
                        <p className="text-xs text-muted mb-3">Current portfolio with P&L calculations</p>
                        <Button variant="outline" className="text-xs w-full">
                            <Icon name="ArrowDownTrayIcon" size={14} className="mr-1" /> Download CSV
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={generateDetailedCSV}>
                    <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                            <Icon name="ClipboardDocumentListIcon" size={28} className="text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Transactions CSV</h3>
                        <p className="text-xs text-muted mb-3">All buy/sell orders with full details</p>
                        <Button variant="outline" className="text-xs w-full">
                            <Icon name="ArrowDownTrayIcon" size={14} className="mr-1" /> Download CSV
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={generatePDFContent}>
                    <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <Icon name="DocumentTextIcon" size={28} className="text-red-600" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Portfolio PDF</h3>
                        <p className="text-xs text-muted mb-3">Printable report for CA or records</p>
                        <Button variant="outline" className="text-xs w-full">
                            <Icon name="PrinterIcon" size={14} className="mr-1" /> Print / Save PDF
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Preview Table */}
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-white pb-3">
                    <CardTitle className="font-display font-medium text-lg">Portfolio Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {holdings.length === 0 ? (
                        <div className="py-12 text-center">
                            <Icon name="ArchiveBoxIcon" size={28} className="mx-auto text-muted mb-3" />
                            <p className="text-muted font-medium mb-1">No holdings to export.</p>
                            <p className="text-xs text-muted">Purchase shares to generate export data.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-surface/50 border-b border-border">
                                        <th className="text-left px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">Company</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">Sector</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">Shares</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">Avg Cost</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">Current</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">Invested</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">Value</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">P&L</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.map(h => {
                                        const avgCost = h.invested / h.qty;
                                        const value = h.currentPrice * h.qty;
                                        const pnl = value - h.invested;
                                        const pnlPct = h.invested > 0 ? (pnl / h.invested) * 100 : 0;
                                        return (
                                            <tr key={h.companyId} className="border-b border-border/50 hover:bg-surface/30">
                                                <td className="px-4 py-3 font-semibold text-foreground">{h.companyName}</td>
                                                <td className="px-4 py-3 text-muted">{h.sector}</td>
                                                <td className="px-4 py-3 text-right font-medium">{h.qty}</td>
                                                <td className="px-4 py-3 text-right text-muted">₹{avgCost.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                                                <td className="px-4 py-3 text-right font-medium">₹{h.currentPrice.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-muted">₹{h.invested.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-semibold">₹{value.toLocaleString()}</td>
                                                <td className={`px-4 py-3 text-right font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString()} ({pnlPct.toFixed(1)}%)
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-surface/50 font-bold">
                                        <td className="px-4 py-3 text-foreground" colSpan={5}>Total</td>
                                        <td className="px-4 py-3 text-right text-foreground">₹{totalInvested.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-foreground">₹{currentValue.toLocaleString()}</td>
                                        <td className={`px-4 py-3 text-right ${currentValue >= totalInvested ? 'text-green-600' : 'text-red-600'}`}>
                                            {currentValue >= totalInvested ? '+' : ''}₹{Math.abs(currentValue - totalInvested).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
