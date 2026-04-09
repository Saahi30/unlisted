'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/utils/supabase/client';

interface MFInterest {
    id: string;
    user_id: string;
    name: string;
    email: string;
    phone: string | null;
    investment_range: string | null;
    fund_types: string[];
    message: string | null;
    created_at: string;
}

const FUND_TYPE_LABELS: Record<string, string> = {
    equity: 'Equity',
    debt: 'Debt',
    hybrid: 'Hybrid',
    index: 'Index',
    elss: 'ELSS',
    liquid: 'Liquid',
};

export default function MutualFundInterestsTab() {
    const [interests, setInterests] = useState<MFInterest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadInterests();
    }, []);

    const loadInterests = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
            .from('mutual_fund_interests')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setInterests(data);
        setLoading(false);
    };

    const filtered = interests.filter(i =>
        !filter ||
        i.name.toLowerCase().includes(filter.toLowerCase()) ||
        i.email.toLowerCase().includes(filter.toLowerCase()) ||
        (i.investment_range || '').toLowerCase().includes(filter.toLowerCase())
    );

    // Stats
    const totalInterests = interests.length;
    const rangeCounts: Record<string, number> = {};
    const fundTypeCounts: Record<string, number> = {};
    interests.forEach(i => {
        if (i.investment_range) rangeCounts[i.investment_range] = (rangeCounts[i.investment_range] || 0) + 1;
        (i.fund_types || []).forEach(f => { fundTypeCounts[f] = (fundTypeCounts[f] || 0) + 1; });
    });

    const topRange = Object.entries(rangeCounts).sort((a, b) => b[1] - a[1])[0];
    const topFund = Object.entries(fundTypeCounts).sort((a, b) => b[1] - a[1])[0];

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Investment Range', 'Fund Types', 'Message', 'Date'];
        const rows = interests.map(i => [
            i.name,
            i.email,
            i.phone || '',
            i.investment_range || '',
            (i.fund_types || []).map(f => FUND_TYPE_LABELS[f] || f).join('; '),
            (i.message || '').replace(/,/g, ' '),
            new Date(i.created_at).toLocaleDateString('en-IN'),
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mf_interests_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">Mutual Fund Interests</h2>
                    <p className="text-sm text-muted mt-1">Users who expressed interest in the upcoming MF feature.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadInterests} disabled={loading}>
                        <Icon name="ArrowPathIcon" size={16} className="mr-1" />
                        Refresh
                    </Button>
                    <Button onClick={exportCSV} disabled={interests.length === 0} className="bg-primary text-white hover:bg-primary/90">
                        <Icon name="ArrowDownTrayIcon" size={16} className="mr-1" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border">
                    <CardContent className="p-4">
                        <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Total Interests</p>
                        <p className="text-3xl font-bold text-foreground">{totalInterests}</p>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardContent className="p-4">
                        <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">This Week</p>
                        <p className="text-3xl font-bold text-foreground">
                            {interests.filter(i => new Date(i.created_at) > new Date(Date.now() - 7 * 86400000)).length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardContent className="p-4">
                        <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Top Range</p>
                        <p className="text-sm font-bold text-foreground">{topRange ? topRange[0] : 'N/A'}</p>
                        <p className="text-xs text-muted">{topRange ? `${topRange[1]} users` : ''}</p>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardContent className="p-4">
                        <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Top Fund Type</p>
                        <p className="text-sm font-bold text-foreground">{topFund ? (FUND_TYPE_LABELS[topFund[0]] || topFund[0]) : 'N/A'}</p>
                        <p className="text-xs text-muted">{topFund ? `${topFund[1]} users` : ''}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Fund Type Breakdown */}
            {Object.keys(fundTypeCounts).length > 0 && (
                <Card className="border-border">
                    <CardHeader className="border-b border-border/50 pb-3">
                        <CardTitle className="text-sm font-display font-medium">Interest by Fund Type</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(fundTypeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                                <div key={type} className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                                    <span className="text-xs font-semibold text-foreground">{FUND_TYPE_LABELS[type] || type}</span>
                                    <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">{count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <div className="relative">
                <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                    type="text"
                    placeholder="Search by name, email, or investment range..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                />
            </div>

            {/* Table */}
            <Card className="border-border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted">Loading interests...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center">
                        <Icon name="InboxIcon" size={32} className="mx-auto text-muted mb-2" />
                        <p className="text-sm text-muted">{filter ? 'No matching results.' : 'No interests recorded yet.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-surface/50">
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-muted">User</th>
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-muted">Contact</th>
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-muted">Investment Range</th>
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-muted">Fund Types</th>
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-muted">Message</th>
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-muted">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filtered.map(interest => (
                                    <tr key={interest.id} className="hover:bg-surface/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-foreground">{interest.name}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-foreground">{interest.email}</p>
                                            {interest.phone && <p className="text-xs text-muted">{interest.phone}</p>}
                                        </td>
                                        <td className="px-4 py-3">
                                            {interest.investment_range ? (
                                                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                                    {interest.investment_range}
                                                </span>
                                            ) : (
                                                <span className="text-muted text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(interest.fund_types || []).map(f => (
                                                    <span key={f} className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        {FUND_TYPE_LABELS[f] || f}
                                                    </span>
                                                ))}
                                                {(!interest.fund_types || interest.fund_types.length === 0) && (
                                                    <span className="text-muted text-xs">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            {interest.message ? (
                                                <p className="text-xs text-muted truncate" title={interest.message}>{interest.message}</p>
                                            ) : (
                                                <span className="text-muted text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-xs text-muted">
                                                {new Date(interest.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                            <p className="text-[10px] text-muted/60">
                                                {new Date(interest.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
