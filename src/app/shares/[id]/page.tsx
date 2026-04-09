'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, ShieldAlert, LineChart } from 'lucide-react';
import CompanyPriceChart from '@/components/CompanyPriceChart';
import CompanyDetails from '@/components/CompanyDetails';
import ShareSaathiChat from '@/components/chat/ShareSaathiChat';

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { companies, historicalPrices, companyFinancials, fetchInitialData } = useAppStore();

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);
    const [showChart, setShowChart] = useState(true);
    const company = companies.find(c => c.id === id);

    if (!company) {
        return <div className="p-8 text-center text-muted font-medium text-lg">Listing not found or removed.</div>;
    }

    const week52High = company.week52High;
    const week52Low = company.week52Low;
    const priceInRange = week52High && week52Low
        ? ((company.currentAskPrice - week52Low) / (week52High - week52Low)) * 100
        : null;

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <Link href="/shares" className="inline-flex items-center text-sm font-medium text-muted hover:text-accent mb-6 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to listings
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-bold tracking-tight text-foreground font-display">{company.name}</h1>
                                <span className="inline-flex items-center rounded-full bg-badge-bg px-3 py-1 text-xs font-semibold text-badge-text">
                                    {company.sector}
                                </span>
                            </div>
                            <p className="text-lg text-foreground-secondary">{company.description}</p>
                            {company.isin && (
                                <p className="text-xs text-muted mt-1">ISIN: {company.isin}</p>
                            )}
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-surface border-border">
                                <CardContent className="p-4">
                                    <div className="text-xs text-muted mb-1">Market Cap</div>
                                    <div className="text-xl font-bold text-foreground">
                                        {company.marketCap ? `₹${company.marketCap.toLocaleString('en-IN')} Cr` : `₹${company.valuation.toLocaleString('en-IN')} Cr`}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-surface border-border">
                                <CardContent className="p-4">
                                    <div className="text-xs text-muted mb-1">P/E Ratio</div>
                                    <div className="text-xl font-bold text-foreground">{company.peRatio != null ? company.peRatio : 'N/A'}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-surface border-border">
                                <CardContent className="p-4">
                                    <div className="text-xs text-muted mb-1">Current Price</div>
                                    <div className="text-xl font-bold text-price-highlight">₹{company.currentAskPrice.toLocaleString('en-IN')}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-surface border-border">
                                <CardContent className="p-4">
                                    <div className="text-xs text-muted mb-1">ROE</div>
                                    <div className={`text-xl font-bold ${company.roe != null ? (company.roe >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-foreground-secondary'}`}>
                                        {company.roe != null ? `${company.roe}%` : 'N/A'}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* 52-Week Range Bar */}
                        {week52High && week52Low && (
                            <Card className="bg-surface border-border">
                                <CardContent className="p-4">
                                    <div className="flex justify-between text-xs text-muted mb-2">
                                        <span>52-Week Low: ₹{week52Low.toLocaleString('en-IN')}</span>
                                        <span>52-Week High: ₹{week52High.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="relative h-2 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 dark:from-red-900 dark:via-yellow-900 dark:to-green-900 rounded-full">
                                        {priceInRange !== null && (
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-accent border-2 border-surface-elevated rounded-full shadow-md"
                                                style={{ left: `${Math.min(Math.max(priceInRange, 0), 100)}%` }}
                                            />
                                        )}
                                    </div>
                                    <div className="text-center text-xs text-muted mt-1.5">
                                        Current: ₹{company.currentAskPrice.toLocaleString('en-IN')}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader className="border-b border-border pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center">
                                        <LineChart className="mr-2 h-5 w-5 text-accent" /> Valuation History
                                    </CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowChart(!showChart)}
                                        className="h-8 text-xs font-medium"
                                    >
                                        {showChart ? 'Hide Graph' : 'Show Graph'}
                                    </Button>
                                </div>
                            </CardHeader>
                            {showChart && (
                                <CardContent className="pt-6 animate-in fade-in duration-300 slide-in-from-top-2">
                                    <CompanyPriceChart
                                        data={historicalPrices
                                            .filter(p => p.companyId === company.id)
                                            .map(p => ({ date: p.priceDate, value: p.priceValue }))
                                        }
                                        color="#C8A96E"
                                    />
                                </CardContent>
                            )}
                        </Card>

                        <CompanyDetails company={company} financials={companyFinancials} />

                        <div className="bg-surface border border-border rounded-xl p-5">
                            <h4 className="flex items-center font-semibold text-foreground mb-3">
                                <ShieldAlert className="mr-2 h-5 w-5 text-muted" /> Investment Risks
                            </h4>
                            <ul className="list-disc pl-5 text-sm text-muted space-y-1.5">
                                <li>Unlisted shares are illiquid and may take time to sell.</li>
                                <li>There is no SEBI mandated investor protection fund for unlisted markets.</li>
                                <li>Valuations can be subjective and vary significantly from listed equities.</li>
                            </ul>
                        </div>
                    </div>

                    <div>
                        <Card className="sticky top-24 border-accent/30 shadow-md">
                            <CardHeader className="bg-accent-subtle pb-4 border-b border-accent/20">
                                <CardTitle className="text-xl">Trade {company.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="flex justify-between items-center bg-price-bg p-4 rounded-lg border border-border">
                                    <div className="text-sm font-medium text-muted">Fixed Offer Price</div>
                                    <div className="text-2xl font-bold text-foreground">₹{company.currentAskPrice.toLocaleString('en-IN')}</div>
                                </div>

                                {company.lotSize && (
                                    <div className="flex justify-between items-center text-sm text-muted px-1">
                                        <span>Lot Size</span>
                                        <span className="font-medium text-foreground-secondary">{company.lotSize} Shares</span>
                                    </div>
                                )}
                                {company.lotSize && company.currentAskPrice > 0 && (
                                    <div className="flex justify-between items-center text-sm text-muted px-1">
                                        <span>Min. Investment</span>
                                        <span className="font-medium text-foreground-secondary">₹{(company.lotSize * company.currentAskPrice).toLocaleString('en-IN')}</span>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <Button className="w-full h-12 text-base" asChild>
                                        <Link href={`/dashboard/customer/buy/${company.id}`}>Buy {company.name} Shares</Link>
                                    </Button>
                                    <p className="text-xs text-center text-muted">
                                        Minimum lot size applies. Settlement T+1.
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <h4 className="font-medium text-sm text-foreground mb-3">Why invest?</h4>
                                    <ul className="text-sm text-foreground-secondary space-y-2">
                                        <li className="flex gap-2">
                                            <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
                                            <span>Pre-IPO entry before public listing premium</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
                                            <span>Access to high-growth private markets</span>
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <ShareSaathiChat />

                {/* Disclaimer at the bottom */}
                <div className="mt-16 pt-8 border-t border-border text-[10px] md:text-xs text-muted leading-relaxed text-center">
                    <p>
                        <strong>Disclaimer:</strong> Unlisted shares are not traded on any stock exchange and carry higher risk.
                        Prices are indicative and may vary. Please conduct your own research or consult a financial advisor before investing.
                    </p>
                </div>
            </div>
        </div>
    );
}
