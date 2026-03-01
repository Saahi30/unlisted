'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeIndianRupee, TrendingUp, Building2, ChevronDown, ArrowUpDown, Filter, ArrowLeft } from 'lucide-react';

export default function SharesPage() {
    const { companies } = useAppStore();
    const [selectedSector, setSelectedSector] = useState<string>('All');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');

    const sectors = useMemo(() => {
        const uniqueSectors = Array.from(new Set(companies.map(c => c.sector)));
        return ['All', ...uniqueSectors];
    }, [companies]);

    const filteredAndSortedCompanies = useMemo(() => {
        let result = [...companies];

        // Filter by sector
        if (selectedSector !== 'All') {
            result = result.filter(c => c.sector === selectedSector);
        }

        // Sort by valuation
        if (sortOrder === 'asc') {
            result.sort((a, b) => a.valuation - b.valuation);
        } else if (sortOrder === 'desc') {
            result.sort((a, b) => b.valuation - a.valuation);
        }

        return result;
    }, [companies, selectedSector, sortOrder]);

    const toggleSort = () => {
        if (sortOrder === 'none') setSortOrder('desc');
        else if (sortOrder === 'desc') setSortOrder('asc');
        else setSortOrder('none');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/dashboard/customer" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Unlisted Shares Catalog</h1>
                    <p className="text-slate-600">Browse and invest in high-growth private companies and pre-IPO equities.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="relative">
                        <select
                            value={selectedSector}
                            onChange={(e) => setSelectedSector(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 rounded-md px-4 py-2 pr-10 text-sm font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer h-10"
                        >
                            {sectors.map(sector => (
                                <option key={sector} value={sector}>
                                    {sector === 'All' ? 'All Sectors' : sector}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>

                    <Button
                        variant={sortOrder !== 'none' ? 'secondary' : 'outline'}
                        onClick={toggleSort}
                        className="gap-2 h-10"
                    >
                        <ArrowUpDown className="h-4 w-4" />
                        {sortOrder === 'none' ? 'Sort by Valuation' : sortOrder === 'asc' ? 'Valuation: Low to High' : 'Valuation: High to Low'}
                    </Button>

                    {(selectedSector !== 'All' || sortOrder !== 'none') && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSelectedSector('All');
                                setSortOrder('none');
                            }}
                            className="text-slate-500 text-xs h-10"
                        >
                            Reset Filters
                        </Button>
                    )}
                </div>
            </div>

            {filteredAndSortedCompanies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedCompanies.map((company) => (
                        <Card key={company.id} className="flex flex-col hover:border-blue-200 hover:shadow-md transition-all group overflow-hidden">
                            <CardHeader className="pb-4 border-b border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">{company.name}</CardTitle>
                                    <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                                        {company.sector}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2">{company.description}</p>
                            </CardHeader>
                            <CardContent className="pt-4 flex-1 flex flex-col">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Building2 className="h-3 w-3" /> Valuation</div>
                                        <div className="font-semibold text-slate-900">₹{company.valuation.toLocaleString()} Cr</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Status</div>
                                        <div className="font-semibold text-slate-900 capitalize">{company.status.replace('_', ' ')}</div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-3 mb-6 border border-slate-100 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
                                    <div>
                                        <div className="text-xs text-slate-500 mb-1">Current Ask</div>
                                        <div className="font-bold text-lg text-blue-700 flex items-center">
                                            <BadgeIndianRupee className="h-4 w-4 mr-0.5" />
                                            {company.currentAskPrice.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500 mb-1">Current Bid</div>
                                        <div className="font-medium text-slate-700 flex items-center justify-end">
                                            <BadgeIndianRupee className="h-4 w-4 mr-0.5" />
                                            {company.currentBidPrice.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-3">
                                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700" asChild>
                                        <Link href={`/dashboard/customer/buy/${company.id}`}>Buy Shares</Link>
                                    </Button>
                                    <Button variant="outline" className="flex-1" asChild>
                                        <Link href={`/shares/${company.id}`}>View Details</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Filter className="h-12 w-12 text-slate-200 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900">No companies found</h2>
                    <p className="text-slate-500 mt-1">Try adjusting your filters to find what you're looking for.</p>
                    <Button
                        variant="link"
                        onClick={() => {
                            setSelectedSector('All');
                            setSortOrder('none');
                        }}
                        className="mt-4 text-blue-600"
                    >
                        Clear all filters
                    </Button>
                </div>
            )}
        </div>
    );
}
