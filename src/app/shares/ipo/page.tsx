'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { ArrowLeft } from 'lucide-react';

const IPO_STATUS_CONFIG: Record<string, { label: string; color: string; order: number }> = {
    rumored: { label: 'Rumored', color: 'bg-surface text-muted border-border', order: 1 },
    drhp_filed: { label: 'DRHP Filed', color: 'bg-amber-50 text-amber-600 border-amber-200', order: 2 },
    sebi_approved: { label: 'SEBI Approved', color: 'bg-blue-50 text-blue-600 border-blue-200', order: 3 },
    date_announced: { label: 'Date Announced', color: 'bg-green-50 text-green-600 border-green-200', order: 4 },
    listed: { label: 'Listed', color: 'bg-purple-50 text-purple-600 border-purple-200', order: 5 },
};

export default function IpoTrackerPage() {
    const { companies, fetchInitialData } = useAppStore();

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // Filter companies with IPO status and sort by proximity to listing
    const ipoCompanies = companies
        .filter(c => (c as any).ipoStatus)
        .sort((a, b) => {
            const aOrder = IPO_STATUS_CONFIG[(a as any).ipoStatus]?.order || 0;
            const bOrder = IPO_STATUS_CONFIG[(b as any).ipoStatus]?.order || 0;
            return bOrder - aOrder;
        });

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Link href="/shares" className="inline-flex items-center text-sm font-medium text-muted hover:text-primary mb-6 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground mb-2">IPO Tracker</h1>
                <p className="text-muted">Track unlisted companies that are filing for IPO on NSE/BSE.</p>
            </div>

            {/* IPO Pipeline */}
            <div className="flex flex-wrap gap-3 mb-8">
                {Object.entries(IPO_STATUS_CONFIG).map(([key, config]) => {
                    const count = ipoCompanies.filter(c => (c as any).ipoStatus === key).length;
                    return (
                        <div key={key} className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-semibold ${config.color}`}>
                            {config.label} ({count})
                        </div>
                    );
                })}
            </div>

            {ipoCompanies.length > 0 ? (
                <div className="space-y-4">
                    {ipoCompanies.map(company => {
                        const status = (company as any).ipoStatus;
                        const details = (company as any).ipoDetails || {};
                        const config = IPO_STATUS_CONFIG[status] || IPO_STATUS_CONFIG.rumored;

                        return (
                            <Card key={company.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-foreground">{company.name}</h3>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${config.color}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted">
                                                <span>{company.sector}</span>
                                                <span>Valuation: ₹{company.valuation?.toLocaleString()} Cr</span>
                                                <span>Ask: ₹{company.currentAskPrice?.toLocaleString()}</span>
                                                {details.expected_date && <span>Expected: {details.expected_date}</span>}
                                                {details.price_band && <span>Price Band: {details.price_band}</span>}
                                                {details.lot_size && <span>Lot Size: {details.lot_size}</span>}
                                                {details.exchange && <span>Exchange: {details.exchange}</span>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/shares/${company.id}`}>View Details</Link>
                                            </Button>
                                            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" asChild>
                                                <Link href={`/dashboard/customer/buy/${company.id}`}>Buy Pre-IPO</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="border-border shadow-sm">
                    <CardContent className="p-12 text-center">
                        <Icon name="RocketLaunchIcon" size={48} className="mx-auto text-muted/30 mb-4" />
                        <h2 className="text-xl font-display font-medium text-foreground mb-2">No IPO filings yet</h2>
                        <p className="text-muted mb-4">Companies will appear here when they file for IPO. Browse all companies in the catalog.</p>
                        <Button asChild><Link href="/shares">Browse Catalog</Link></Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
