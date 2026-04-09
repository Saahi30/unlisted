'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, ChevronDown, Plus, Sparkles, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CHART_COLORS = ['#1C2B3A', '#C8A96E', '#3B82F6'];

export default function ComparePage() {
    const { companies, historicalPrices, companyFinancials, fetchInitialData } = useAppStore();
    const [selectedIds, setSelectedIds] = useState<(string | null)[]>([null, null, null]);
    const [openSlot, setOpenSlot] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const selectedCompanies = selectedIds.map(id => id ? companies.find(c => c.id === id) : null);

    const handleSelect = (slot: number, companyId: string) => {
        const newIds = [...selectedIds];
        newIds[slot] = companyId;
        setSelectedIds(newIds);
        setOpenSlot(null);
        setSearch('');
    };

    const handleRemove = (slot: number) => {
        const newIds = [...selectedIds];
        newIds[slot] = null;
        setSelectedIds(newIds);
    };

    const filteredCompanies = companies.filter(c => {
        const alreadySelected = selectedIds.includes(c.id);
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
        return !alreadySelected && matchesSearch;
    });

    const activeCompanies = selectedCompanies.filter(Boolean) as NonNullable<typeof selectedCompanies[0]>[];

    // Build chart data from historical prices
    const chartData = useMemo(() => {
        if (activeCompanies.length === 0) return [];
        const dateMap: Record<string, Record<string, number>> = {};

        activeCompanies.forEach(company => {
            const prices = historicalPrices.filter(p => p.companyId === company.id);
            prices.forEach(p => {
                if (!dateMap[p.priceDate]) dateMap[p.priceDate] = {};
                dateMap[p.priceDate][company.name] = p.priceValue;
            });
        });

        return Object.entries(dateMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, values]) => ({ date, ...values }));
    }, [activeCompanies, historicalPrices]);

    const metrics = [
        { label: 'Sector', key: 'sector', format: (v: any) => v || '-' },
        { label: 'Status', key: 'status', format: (v: any) => (v || '').replace('_', ' ') },
        { label: 'Valuation (Cr)', key: 'valuation', format: (v: any) => v ? `₹${Number(v).toLocaleString()}` : '-' },
        { label: 'Ask Price', key: 'currentAskPrice', format: (v: any) => v ? `₹${Number(v).toLocaleString()}` : '-' },
        { label: 'Bid Price', key: 'currentBidPrice', format: (v: any) => v ? `₹${Number(v).toLocaleString()}` : '-' },
        { label: 'P/E Ratio', key: 'peRatio', format: (v: any) => v ? Number(v).toFixed(1) : '-' },
        { label: 'P/B Ratio', key: 'pbRatio', format: (v: any) => v ? Number(v).toFixed(1) : '-' },
        { label: 'ROE', key: 'roe', format: (v: any) => v ? `${Number(v).toFixed(1)}%` : '-' },
        { label: 'Debt/Equity', key: 'debtToEquity', format: (v: any) => v ? Number(v).toFixed(2) : '-' },
        { label: 'Book Value', key: 'bookValue', format: (v: any) => v ? `₹${Number(v).toLocaleString()}` : '-' },
        { label: 'Market Cap', key: 'marketCap', format: (v: any) => v ? `₹${Number(v).toLocaleString()} Cr` : '-' },
        { label: 'Min Investment', key: 'minInvest', format: (v: any) => v || '-' },
    ];

    // Get latest financials for each company
    const getFinancials = (companyId: string) => {
        const fin = companyFinancials.filter(f => f.companyId === companyId);
        return fin.length > 0 ? fin[fin.length - 1] : null;
    };

    const fetchAiComparison = async () => {
        if (activeCompanies.length < 2) return;
        setAiLoading(true);
        setAiAnalysis(null);
        try {
            const payload = activeCompanies.map(c => {
                const fin = getFinancials(c.id);
                return {
                    name: c.name, sector: c.sector, valuation: c.valuation,
                    askPrice: c.currentAskPrice, bidPrice: c.currentBidPrice,
                    peRatio: c.peRatio, pbRatio: c.pbRatio, roe: c.roe,
                    debtToEquity: c.debtToEquity, marketCap: c.marketCap,
                    financials: fin ? { revenue: fin.revenue, pat: fin.pat, ebitda: fin.ebitda, eps: fin.eps } : null,
                };
            });
            const res = await fetch('/api/ai/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'compare', companies: payload }),
            });
            const data = await res.json();
            setAiAnalysis(data.analysis || 'Unable to generate analysis.');
        } catch {
            setAiAnalysis('Failed to generate AI comparison. Please try again.');
        } finally {
            setAiLoading(false);
        }
    };

    const financialMetrics = [
        { label: 'Revenue', key: 'revenue', format: (v: any) => v ? `₹${Number(v).toLocaleString()} Cr` : '-' },
        { label: 'PAT', key: 'pat', format: (v: any) => v ? `₹${Number(v).toLocaleString()} Cr` : '-' },
        { label: 'EBITDA', key: 'ebitda', format: (v: any) => v ? `₹${Number(v).toLocaleString()} Cr` : '-' },
        { label: 'EPS', key: 'eps', format: (v: any) => v ? `₹${Number(v).toFixed(2)}` : '-' },
        { label: 'NPM', key: 'npm', format: (v: any) => v ? `${Number(v).toFixed(1)}%` : '-' },
        { label: 'Total Assets', key: 'totalAssets', format: (v: any) => v ? `₹${Number(v).toLocaleString()} Cr` : '-' },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Link href="/shares" className="inline-flex items-center text-sm font-medium text-muted hover:text-primary mb-6 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground mb-2">Compare Companies</h1>
                <p className="text-muted">Select up to 3 companies for side-by-side comparison.</p>
            </div>

            {/* Company Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[0, 1, 2].map(slot => {
                    const company = selectedCompanies[slot];
                    return (
                        <div key={slot} className="relative">
                            {company ? (
                                <Card className="border-border shadow-sm">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-foreground">{company.name}</div>
                                            <div className="text-xs text-muted">{company.sector}</div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(slot)}
                                            className="p-1 rounded-md text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <button
                                    onClick={() => setOpenSlot(openSlot === slot ? null : slot)}
                                    className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center text-muted hover:border-primary/50 hover:text-primary transition-colors"
                                >
                                    <Plus className="h-5 w-5 mx-auto mb-1" />
                                    <span className="text-sm font-medium">Add Company</span>
                                </button>
                            )}

                            {openSlot === slot && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                                    <div className="p-2 border-b border-border">
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            placeholder="Search companies..."
                                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:border-primary"
                                            autoFocus
                                        />
                                    </div>
                                    {filteredCompanies.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelect(slot, c.id)}
                                            className="w-full text-left px-4 py-3 hover:bg-surface transition-colors flex justify-between items-center"
                                        >
                                            <div>
                                                <div className="text-sm font-medium text-foreground">{c.name}</div>
                                                <div className="text-xs text-muted">{c.sector}</div>
                                            </div>
                                            <div className="text-xs font-semibold text-primary">₹{c.currentAskPrice.toLocaleString()}</div>
                                        </button>
                                    ))}
                                    {filteredCompanies.length === 0 && (
                                        <div className="p-4 text-center text-sm text-muted">No companies found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {activeCompanies.length >= 2 && (
                <>
                    {/* Price Chart */}
                    {chartData.length > 0 && (
                        <Card className="border-border shadow-sm mb-8">
                            <CardHeader className="border-b border-border/50">
                                <CardTitle className="font-display text-lg font-medium">Price History</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                                            tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickFormatter={v => `₹${v}`} />
                                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        {activeCompanies.map((company, i) => (
                                            <Line
                                                key={company.id}
                                                type="monotone"
                                                dataKey={company.name}
                                                stroke={CHART_COLORS[i]}
                                                strokeWidth={2}
                                                dot={{ r: 3 }}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Comparison Table */}
                    <Card className="border-border shadow-sm mb-8">
                        <CardHeader className="border-b border-border/50">
                            <CardTitle className="font-display text-lg font-medium">Company Fundamentals</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-surface/50 border-b border-border">
                                            <th className="text-left p-4 text-xs font-semibold text-muted uppercase tracking-wider">Metric</th>
                                            {activeCompanies.map((c, i) => (
                                                <th key={c.id} className="text-right p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: CHART_COLORS[i] }}>
                                                    {c.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.map(metric => (
                                            <tr key={metric.key} className="border-b border-border/50 hover:bg-surface/30">
                                                <td className="p-4 text-sm font-medium text-muted">{metric.label}</td>
                                                {activeCompanies.map(c => (
                                                    <td key={c.id} className="p-4 text-sm font-semibold text-foreground text-right">
                                                        {metric.format((c as any)[metric.key])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Comparison */}
                    {activeCompanies.some(c => getFinancials(c.id)) && (
                        <Card className="border-border shadow-sm">
                            <CardHeader className="border-b border-border/50">
                                <CardTitle className="font-display text-lg font-medium">Financial Performance (Latest FY)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-surface/50 border-b border-border">
                                                <th className="text-left p-4 text-xs font-semibold text-muted uppercase tracking-wider">Metric</th>
                                                {activeCompanies.map((c, i) => (
                                                    <th key={c.id} className="text-right p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: CHART_COLORS[i] }}>
                                                        {c.name}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {financialMetrics.map(metric => (
                                                <tr key={metric.key} className="border-b border-border/50 hover:bg-surface/30">
                                                    <td className="p-4 text-sm font-medium text-muted">{metric.label}</td>
                                                    {activeCompanies.map(c => {
                                                        const fin = getFinancials(c.id);
                                                        return (
                                                            <td key={c.id} className="p-4 text-sm font-semibold text-foreground text-right">
                                                                {fin ? metric.format((fin as any)[metric.key]) : '-'}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* AI Comparison Analysis */}
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-amber-600" />
                                    <CardTitle className="font-display text-lg font-medium">AI Comparison Analysis</CardTitle>
                                </div>
                                <Button
                                    onClick={fetchAiComparison}
                                    disabled={aiLoading}
                                    size="sm"
                                    className="bg-primary text-white hover:bg-primary/90 gap-2"
                                >
                                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    {aiLoading ? 'Analyzing...' : aiAnalysis ? 'Regenerate' : 'Generate Analysis'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {aiAnalysis ? (
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{aiAnalysis}</p>
                            ) : aiLoading ? (
                                <div className="flex items-center justify-center py-8 text-muted">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    <span className="text-sm">Analyzing {activeCompanies.map(c => c.name).join(' vs ')}...</span>
                                </div>
                            ) : (
                                <p className="text-sm text-muted text-center py-4">Click &ldquo;Generate Analysis&rdquo; for an AI-powered narrative comparison of these companies.</p>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {activeCompanies.length < 2 && (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4 opacity-20">&#x2696;</div>
                    <h2 className="text-xl font-display font-medium text-foreground mb-2">Select at least 2 companies</h2>
                    <p className="text-muted">Choose companies above to see a side-by-side comparison of their fundamentals and financials.</p>
                </div>
            )}
        </div>
    );
}
