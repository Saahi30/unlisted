'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, ShieldAlert, LineChart } from 'lucide-react';
import CompanyPriceChart from '@/components/CompanyPriceChart';
import CompanyDetails from '@/components/CompanyDetails';

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { companies, historicalPrices, companyFinancials } = useAppStore();
    const [showChart, setShowChart] = useState(true);
    const company = companies.find(c => c.id === id);

    if (!company) {
        return <div className="p-8 text-center text-slate-500 font-medium text-lg">Listing not found or removed.</div>;
    }

    const week52High = company.week52High;
    const week52Low = company.week52Low;
    const priceInRange = week52High && week52Low
        ? ((company.currentAskPrice - week52Low) / (week52High - week52Low)) * 100
        : null;

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/shares" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to listings
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900">{company.name}</h1>
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                                {company.sector}
                            </span>
                        </div>
                        <p className="text-lg text-slate-600">{company.description}</p>
                        {company.isin && (
                            <p className="text-xs text-slate-400 mt-1">ISIN: {company.isin}</p>
                        )}
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-slate-50 border-slate-100">
                            <CardContent className="p-4">
                                <div className="text-xs text-slate-500 mb-1">Market Cap</div>
                                <div className="text-xl font-bold">
                                    {company.marketCap ? `₹${company.marketCap.toLocaleString('en-IN')} Cr` : `₹${company.valuation.toLocaleString('en-IN')} Cr`}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-50 border-slate-100">
                            <CardContent className="p-4">
                                <div className="text-xs text-slate-500 mb-1">P/E Ratio</div>
                                <div className="text-xl font-bold">{company.peRatio != null ? company.peRatio : 'N/A'}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-50 border-slate-100">
                            <CardContent className="p-4">
                                <div className="text-xs text-slate-500 mb-1">Current Price</div>
                                <div className="text-xl font-bold text-blue-700">₹{company.currentAskPrice.toLocaleString('en-IN')}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-50 border-slate-100">
                            <CardContent className="p-4">
                                <div className="text-xs text-slate-500 mb-1">ROE</div>
                                <div className={`text-xl font-bold ${company.roe != null ? (company.roe >= 0 ? 'text-green-700' : 'text-red-600') : 'text-slate-700'}`}>
                                    {company.roe != null ? `${company.roe}%` : 'N/A'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 52-Week Range Bar */}
                    {week52High && week52Low && (
                        <Card className="bg-slate-50 border-slate-100">
                            <CardContent className="p-4">
                                <div className="flex justify-between text-xs text-slate-500 mb-2">
                                    <span>52-Week Low: ₹{week52Low.toLocaleString('en-IN')}</span>
                                    <span>52-Week High: ₹{week52High.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="relative h-2 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full">
                                    {priceInRange !== null && (
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md"
                                            style={{ left: `${Math.min(Math.max(priceInRange, 0), 100)}%` }}
                                        />
                                    )}
                                </div>
                                <div className="text-center text-xs text-slate-500 mt-1.5">
                                    Current: ₹{company.currentAskPrice.toLocaleString('en-IN')}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center">
                                    <LineChart className="mr-2 h-5 w-5 text-blue-600" /> Valuation History
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowChart(!showChart)}
                                    className="h-8 text-xs font-medium text-slate-600 hover:text-blue-600"
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
                                    color="#2563eb"
                                />
                            </CardContent>
                        )}
                    </Card>

                    <CompanyDetails company={company} financials={companyFinancials} />

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                        <h4 className="flex items-center font-semibold text-amber-900 mb-2">
                            <ShieldAlert className="mr-2 h-5 w-5" /> Investment Risks
                        </h4>
                        <ul className="list-disc pl-5 text-sm text-amber-800 space-y-1">
                            <li>Unlisted shares are illiquid and may take time to sell.</li>
                            <li>There is no SEBI mandated investor protection fund for unlisted markets.</li>
                            <li>Valuations can be subjective and vary significantly from listed equities.</li>
                        </ul>
                    </div>
                </div>

                <div>
                    <Card className="sticky top-24 border-blue-100 shadow-md">
                        <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-50">
                            <CardTitle className="text-xl">Trade {company.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="text-sm font-medium text-slate-500">Fixed Offer Price</div>
                                <div className="text-2xl font-bold text-slate-900">₹{company.currentAskPrice.toLocaleString('en-IN')}</div>
                            </div>

                            {company.lotSize && (
                                <div className="flex justify-between items-center text-sm text-slate-500 px-1">
                                    <span>Lot Size</span>
                                    <span className="font-medium text-slate-700">{company.lotSize} Shares</span>
                                </div>
                            )}
                            {company.lotSize && company.currentAskPrice > 0 && (
                                <div className="flex justify-between items-center text-sm text-slate-500 px-1">
                                    <span>Min. Investment</span>
                                    <span className="font-medium text-slate-700">₹{(company.lotSize * company.currentAskPrice).toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            <div className="space-y-3">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base" asChild>
                                    <Link href={`/dashboard/customer/buy/${company.id}`}>Buy {company.name} Shares</Link>
                                </Button>
                                <p className="text-xs text-center text-slate-500">
                                    Minimum lot size applies. Settlement T+1.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="font-medium text-sm text-slate-900 mb-3">Why invest?</h4>
                                <ul className="text-sm text-slate-600 space-y-2">
                                    <li className="flex gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>Pre-IPO entry before public listing premium</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>Access to high-growth private markets</span>
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Disclaimer at the bottom */}
            <div className="mt-16 pt-8 border-t border-slate-100 text-[10px] md:text-xs text-slate-400 leading-relaxed text-center">
                <p>
                    <strong>Disclaimer:</strong> Unlisted shares are not traded on any stock exchange and carry higher risk.
                    Prices are indicative and may vary. Please conduct your own research or consult a financial advisor before investing.
                </p>
            </div>
        </div>
    );
}
