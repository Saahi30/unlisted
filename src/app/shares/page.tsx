'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeIndianRupee, TrendingUp, Building2, ChevronDown, ArrowUpDown, Filter, ArrowLeft, Search, X, GitCompareArrows, Sparkles, Loader2 } from 'lucide-react';

export default function SharesPage() {
    const { companies, fetchInitialData } = useAppStore();

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);
    const [selectedSector, setSelectedSector] = useState<string>('All');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [nlQuery, setNlQuery] = useState('');
    const [nlLoading, setNlLoading] = useState(false);
    const [nlActive, setNlActive] = useState(false);
    const [nlFilters, setNlFilters] = useState<any>(null);

    const sectors = useMemo(() => {
        const uniqueSectors = Array.from(new Set(companies.map(c => c.sector)));
        return ['All', ...uniqueSectors];
    }, [companies]);

    const handleNlSearch = async () => {
        if (!nlQuery.trim()) return;
        setNlLoading(true);
        setNlActive(true);
        try {
            const prices = companies.map(c => c.currentAskPrice);
            const res = await fetch('/api/ai/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'search',
                    query: nlQuery,
                    sectors: Array.from(new Set(companies.map(c => c.sector))),
                    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
                    companies: companies.map(c => ({
                        id: c.id, name: c.name, sector: c.sector, status: c.status,
                        valuation: c.valuation, price: c.currentAskPrice, description: c.description,
                    })),
                }),
            });
            const data = await res.json();
            setNlFilters(data.filters || null);
        } catch {
            setNlFilters(null);
        } finally {
            setNlLoading(false);
        }
    };

    const clearNlSearch = () => {
        setNlQuery('');
        setNlActive(false);
        setNlFilters(null);
    };

    const filteredAndSortedCompanies = useMemo(() => {
        let result = [...companies];

        // Apply NL filters if active
        if (nlActive && nlFilters) {
            const f = nlFilters;

            // Priority 1: If AI matched specific companies by name, use those directly
            if (f.matchedCompanies?.length) {
                const matched = f.matchedCompanies.map((n: string) => n.toLowerCase());
                const directMatches = result.filter(c => matched.some((m: string) => c.name.toLowerCase().includes(m) || m.includes(c.name.toLowerCase())));
                // If we got good direct matches, use them; otherwise fall through to filters
                if (directMatches.length > 0) {
                    result = directMatches;
                }
            }

            // Apply sector filter
            if (f.sectors?.length) {
                result = result.filter(c => f.sectors.some((s: string) => c.sector.toLowerCase().includes(s.toLowerCase())));
            }
            // Apply status filter (pre_ipo, series_c, etc.)
            if (f.statuses?.length) {
                result = result.filter(c => f.statuses.some((s: string) => c.status.toLowerCase() === s.toLowerCase()));
            }
            // Apply price filters
            if (f.minPrice != null) result = result.filter(c => c.currentAskPrice >= f.minPrice);
            if (f.maxPrice != null) result = result.filter(c => c.currentAskPrice <= f.maxPrice);
            // Apply valuation filters
            if (f.minValuation != null) result = result.filter(c => c.valuation >= f.minValuation);
            if (f.maxValuation != null) result = result.filter(c => c.valuation <= f.maxValuation);
            // Keyword fallback for text search
            if (f.keywords?.length && !f.matchedCompanies?.length) {
                const kws = f.keywords.map((k: string) => k.toLowerCase());
                result = result.filter(c =>
                    kws.some((k: string) => c.name.toLowerCase().includes(k) || c.description.toLowerCase().includes(k) || c.sector.toLowerCase().includes(k))
                );
            }

            // Sort by various criteria
            const dir = f.sortDir === 'asc' ? 1 : -1;
            if (f.sortBy === 'valuation') result.sort((a, b) => dir * (a.valuation - b.valuation));
            else if (f.sortBy === 'price') result.sort((a, b) => dir * (a.currentAskPrice - b.currentAskPrice));

            return result;
        }

        // Filter by name search
        if (searchQuery.trim()) {
            result = result.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

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
    }, [companies, searchQuery, selectedSector, sortOrder, nlActive, nlFilters]);

    const toggleSort = () => {
        if (sortOrder === 'none') setSortOrder('desc');
        else if (sortOrder === 'desc') setSortOrder('asc');
        else setSortOrder('none');
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <Link href="/dashboard/customer" className="inline-flex items-center text-sm font-medium text-muted hover:text-accent mb-6 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
                {/* AI Natural Language Search */}
                <div className="mb-6">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                            <input
                                type="text"
                                value={nlQuery}
                                onChange={e => setNlQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleNlSearch()}
                                placeholder='Search with AI: "high-growth fintech under ₹500" or "companies likely to IPO soon"...'
                                className="w-full bg-surface border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                            {nlQuery && (
                                <button onClick={clearNlSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button
                            onClick={handleNlSearch}
                            disabled={nlLoading || !nlQuery.trim()}
                            className="bg-primary text-white hover:bg-primary/90 gap-2 rounded-xl px-5"
                        >
                            {nlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            {nlLoading ? 'Searching...' : 'AI Search'}
                        </Button>
                    </div>
                    {nlActive && nlFilters && (
                        <div className="mt-3 space-y-2">
                            {nlFilters.summary && (
                                <div className="flex items-start gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                                    <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                    <p className="text-sm text-foreground">{nlFilters.summary}</p>
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                                <span className="font-medium">{filteredAndSortedCompanies.length} result{filteredAndSortedCompanies.length !== 1 ? 's' : ''}</span>
                                {nlFilters.sectors?.length > 0 && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">Sectors: {nlFilters.sectors.join(', ')}</span>}
                                {nlFilters.statuses?.length > 0 && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">Stage: {nlFilters.statuses.map((s: string) => s.replace('_', ' ')).join(', ')}</span>}
                                {nlFilters.minPrice != null && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">Min ₹{nlFilters.minPrice.toLocaleString()}</span>}
                                {nlFilters.maxPrice != null && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">Max ₹{nlFilters.maxPrice.toLocaleString()}</span>}
                                {nlFilters.minIpoScore && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">IPO Score ≥{nlFilters.minIpoScore}</span>}
                                {nlFilters.minGrowthScore && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">Growth ≥{nlFilters.minGrowthScore}</span>}
                                {nlFilters.sentiment && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">Sentiment: {nlFilters.sentiment}</span>}
                                {nlFilters.matchedCompanies?.length > 0 && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">AI picked {nlFilters.matchedCompanies.length} companies</span>}
                                <button onClick={clearNlSearch} className="ml-auto text-primary hover:text-primary/80 font-semibold">Clear AI filter</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground font-display mb-2">Unlisted Shares Catalog</h1>
                        <p className="text-foreground-secondary">Browse and invest in high-growth private companies and pre-IPO equities.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name..."
                                className="bg-surface-elevated border border-border rounded-md pl-9 pr-8 py-2 text-sm font-medium text-foreground placeholder:text-muted hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all h-10 w-52"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <select
                                value={selectedSector}
                                onChange={(e) => setSelectedSector(e.target.value)}
                                className="appearance-none bg-surface-elevated border border-border rounded-md px-4 py-2 pr-10 text-sm font-medium text-foreground hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer h-10"
                            >
                                {sectors.map(sector => (
                                    <option key={sector} value={sector}>
                                        {sector === 'All' ? 'All Sectors' : sector}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                        </div>

                        <Button
                            variant={sortOrder !== 'none' ? 'secondary' : 'outline'}
                            onClick={toggleSort}
                            className="gap-2 h-10"
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            {sortOrder === 'none' ? 'Sort by Valuation' : sortOrder === 'asc' ? 'Valuation: Low to High' : 'Valuation: High to Low'}
                        </Button>

                        <Button variant="outline" className="gap-2 h-10" asChild>
                            <Link href="/shares/compare">
                                <GitCompareArrows className="h-4 w-4" />
                                Compare
                            </Link>
                        </Button>

                        <Button variant="outline" className="gap-2 h-10" asChild>
                            <Link href="/shares/ipo">
                                <TrendingUp className="h-4 w-4" />
                                IPO Tracker
                            </Link>
                        </Button>

                        {(selectedSector !== 'All' || sortOrder !== 'none' || searchQuery) && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSelectedSector('All');
                                    setSortOrder('none');
                                    setSearchQuery('');
                                }}
                                className="text-xs h-10"
                            >
                                Reset Filters
                            </Button>
                        )}
                    </div>
                </div>

                {filteredAndSortedCompanies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedCompanies.map((company) => (
                            <Card key={company.id} className="flex flex-col hover:border-accent/40 transition-all group overflow-hidden">
                                <CardHeader className="pb-4 border-b border-border">
                                    <div className="flex justify-between items-start mb-2">
                                        <CardTitle className="text-xl group-hover:text-accent transition-colors">{company.name}</CardTitle>
                                        <div className="inline-flex items-center rounded-full bg-badge-bg px-2.5 py-0.5 text-xs font-semibold text-badge-text">
                                            {company.sector}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted line-clamp-2">{company.description}</p>
                                </CardHeader>
                                <CardContent className="pt-4 flex-1 flex flex-col">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <div className="text-xs text-muted mb-1 flex items-center gap-1"><Building2 className="h-3 w-3" /> Valuation</div>
                                            <div className="font-semibold text-foreground">₹{company.valuation.toLocaleString()} Cr</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted mb-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Status</div>
                                            <div className="font-semibold text-foreground capitalize">{company.status.replace('_', ' ')}</div>
                                        </div>
                                    </div>

                                    <div className="bg-price-bg rounded-lg p-3 mb-6 border border-border flex justify-between items-center group-hover:border-accent/30 transition-colors">
                                        <div>
                                            <div className="text-xs text-muted mb-1">Current Ask</div>
                                            <div className="font-bold text-lg text-price-highlight flex items-center">
                                                <BadgeIndianRupee className="h-4 w-4 mr-0.5" />
                                                {company.currentAskPrice.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-muted mb-1">Current Bid</div>
                                            <div className="font-medium text-foreground-secondary flex items-center justify-end">
                                                <BadgeIndianRupee className="h-4 w-4 mr-0.5" />
                                                {company.currentBidPrice.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex gap-3">
                                        <Button className="flex-1" asChild>
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
                        <Filter className="h-12 w-12 text-border mb-4" />
                        <h2 className="text-xl font-semibold text-foreground">No companies found</h2>
                        <p className="text-muted mt-1">Try adjusting your filters to find what you're looking for.</p>
                        <Button
                            variant="link"
                            onClick={() => {
                                setSelectedSector('All');
                                setSortOrder('none');
                                setSearchQuery('');
                            }}
                            className="mt-4"
                        >
                            Clear all filters
                        </Button>
                    </div>
                )}
                {/* Disclaimer at the bottom */}
                <div className="mt-16 pt-8 border-t border-border text-[10px] md:text-xs text-muted leading-relaxed text-center max-w-3xl mx-auto">
                    <p>
                        <strong>Disclaimer:</strong> Unlisted shares are not traded on any stock exchange and carry higher risk.
                        Prices are indicative and may vary. Please conduct your own research or consult a financial advisor before investing.
                    </p>
                </div>
            </div>
        </div>
    );
}
