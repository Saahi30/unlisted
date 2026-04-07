'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { Company } from '@/lib/mock-data';

type HeatLevel = 'hot' | 'warm' | 'neutral' | 'cold';

function getHeatLevel(company: Company): HeatLevel {
    const change = parseFloat(company.change?.replace('%', '').replace('+', '') || '0');
    if (change >= 15) return 'hot';
    if (change >= 5) return 'warm';
    if (change >= 0) return 'neutral';
    return 'cold';
}

function getHeatStyle(heat: HeatLevel) {
    switch (heat) {
        case 'hot': return { bg: 'bg-red-50 border-red-200 hover:border-red-300', dot: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700' };
        case 'warm': return { bg: 'bg-orange-50 border-orange-200 hover:border-orange-300', dot: 'bg-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' };
        case 'neutral': return { bg: 'bg-blue-50 border-blue-200 hover:border-blue-300', dot: 'bg-blue-400', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' };
        case 'cold': return { bg: 'bg-slate-50 border-slate-200 hover:border-slate-300', dot: 'bg-slate-400', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-600' };
    }
}

function getHeatLabel(heat: HeatLevel) {
    switch (heat) {
        case 'hot': return 'Trending';
        case 'warm': return 'Rising';
        case 'neutral': return 'Stable';
        case 'cold': return 'Cooling';
    }
}

function getSectorIcon(sector: string) {
    const map: Record<string, string> = {
        'FoodTech': 'FireIcon',
        'FinTech': 'BanknotesIcon',
        'Quick Commerce': 'BoltIcon',
        'SaaS': 'CloudIcon',
        'HealthTech': 'HeartIcon',
        'EdTech': 'AcademicCapIcon',
        'Logistics': 'TruckIcon',
        'E-Commerce': 'ShoppingCartIcon',
        'Gaming': 'PuzzlePieceIcon',
        'Mobility': 'TruckIcon',
    };
    return map[sector] || 'BuildingOfficeIcon';
}

export default function MarketMapPage() {
    const { companies, historicalPrices } = useAppStore();
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'treemap'>('grid');

    const sectorGroups = useMemo(() => {
        const groups: Record<string, { companies: Company[]; totalValuation: number; avgChange: number; companyCount: number }> = {};
        companies.forEach(company => {
            const sector = company.sector || 'Other';
            if (!groups[sector]) {
                groups[sector] = { companies: [], totalValuation: 0, avgChange: 0, companyCount: 0 };
            }
            groups[sector].companies.push(company);
            groups[sector].totalValuation += company.valuation;
            groups[sector].companyCount++;
            const change = parseFloat(company.change?.replace('%', '').replace('+', '') || '0');
            groups[sector].avgChange += change;
        });

        Object.keys(groups).forEach(sector => {
            groups[sector].avgChange = groups[sector].avgChange / groups[sector].companyCount;
        });

        return groups;
    }, [companies]);

    const sectors = Object.keys(sectorGroups).sort((a, b) => sectorGroups[b].totalValuation - sectorGroups[a].totalValuation);

    const getSectorHeat = (avgChange: number): HeatLevel => {
        if (avgChange >= 15) return 'hot';
        if (avgChange >= 5) return 'warm';
        if (avgChange >= 0) return 'neutral';
        return 'cold';
    };

    const filteredSectors = selectedSector ? [selectedSector] : sectors;

    // Summary stats
    const totalCompanies = companies.length;
    const totalValuation = companies.reduce((s, c) => s + c.valuation, 0);
    const trendingCount = companies.filter(c => getHeatLevel(c) === 'hot').length;

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                            <Icon name="ArrowLeftIcon" size={18} />
                        </Link>
                        <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Sector Market Map</h1>
                    </div>
                    <p className="text-muted mt-1">Visual overview of all unlisted companies grouped by sector with momentum indicators.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-surface border border-border rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === 'grid' ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('treemap')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === 'treemap' ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                        >
                            Treemap
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Total Sectors</p>
                    <p className="text-2xl font-bold text-foreground">{sectors.length}</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Companies Listed</p>
                    <p className="text-2xl font-bold text-foreground">{totalCompanies}</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Combined Valuation</p>
                    <p className="text-2xl font-bold text-foreground">₹{(totalValuation / 1000).toFixed(0)}K Cr</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Trending Now</p>
                    <p className="text-2xl font-bold text-red-600">{trendingCount} stocks</p>
                </div>
            </div>

            {/* Heat Legend */}
            <div className="flex flex-wrap gap-3 mb-6">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider mr-2">Heat:</span>
                {(['hot', 'warm', 'neutral', 'cold'] as HeatLevel[]).map(level => {
                    const style = getHeatStyle(level);
                    return (
                        <span key={level} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                            {getHeatLabel(level)}
                        </span>
                    );
                })}
            </div>

            {/* Sector Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-8">
                <button
                    onClick={() => setSelectedSector(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${!selectedSector ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-border hover:border-primary/30 hover:text-foreground'}`}
                >
                    All Sectors
                </button>
                {sectors.map(sector => {
                    const heat = getSectorHeat(sectorGroups[sector].avgChange);
                    const style = getHeatStyle(heat);
                    return (
                        <button
                            key={sector}
                            onClick={() => setSelectedSector(selectedSector === sector ? null : sector)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selectedSector === sector ? 'bg-primary text-white border-primary' : `bg-white ${style.text} border-border hover:border-primary/30`}`}
                        >
                            {sector} ({sectorGroups[sector].companyCount})
                        </button>
                    );
                })}
            </div>

            {/* Sector Grid / Treemap */}
            {viewMode === 'grid' ? (
                <div className="space-y-8">
                    {filteredSectors.map(sector => {
                        const group = sectorGroups[sector];
                        const sectorHeat = getSectorHeat(group.avgChange);
                        const sectorStyle = getHeatStyle(sectorHeat);

                        return (
                            <Card key={sector} className="border-border shadow-sm overflow-hidden">
                                <CardHeader className="border-b border-border/50 bg-white pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${sectorStyle.badge}`}>
                                                <Icon name={getSectorIcon(sector)} size={20} />
                                            </div>
                                            <div>
                                                <CardTitle className="font-display font-medium text-lg">{sector}</CardTitle>
                                                <p className="text-xs text-muted mt-0.5">
                                                    {group.companyCount} {group.companyCount === 1 ? 'company' : 'companies'} · ₹{(group.totalValuation / 1000).toFixed(0)}K Cr combined
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${sectorStyle.badge}`}>
                                            <span className={`w-2 h-2 rounded-full ${sectorStyle.dot} animate-pulse`} />
                                            {getHeatLabel(sectorHeat)} · Avg {group.avgChange >= 0 ? '+' : ''}{group.avgChange.toFixed(1)}%
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 bg-surface/30">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {group.companies
                                            .sort((a, b) => b.valuation - a.valuation)
                                            .map(company => {
                                                const heat = getHeatLevel(company);
                                                const style = getHeatStyle(heat);
                                                const change = parseFloat(company.change?.replace('%', '').replace('+', '') || '0');

                                                return (
                                                    <Link key={company.id} href={`/shares/${company.id}`}>
                                                        <div className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${style.bg}`}>
                                                            {/* Heat indicator dot */}
                                                            <div className="absolute top-3 right-3">
                                                                <span className={`w-2.5 h-2.5 rounded-full ${style.dot} block ${heat === 'hot' ? 'animate-pulse' : ''}`} />
                                                            </div>

                                                            <div className="mb-3">
                                                                <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate pr-6">{company.name}</h3>
                                                                <p className="text-[10px] text-muted uppercase tracking-wider font-bold mt-0.5">{company.status?.replace('_', ' ')}</p>
                                                            </div>

                                                            <div className="flex items-end justify-between">
                                                                <div>
                                                                    <p className="text-lg font-bold text-foreground">₹{company.currentAskPrice.toLocaleString()}</p>
                                                                    <p className="text-[10px] text-muted font-medium">₹{company.valuation.toLocaleString()} Cr</p>
                                                                </div>
                                                                <div className={`text-right`}>
                                                                    <span className={`text-sm font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {company.change || '0%'}
                                                                    </span>
                                                                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${style.text}`}>
                                                                        {getHeatLabel(heat)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                /* Treemap View - proportional boxes based on valuation */
                <div className="bg-white border border-border rounded-xl p-4">
                    <div className="grid grid-cols-12 gap-1.5 auto-rows-[80px]">
                        {companies
                            .sort((a, b) => b.valuation - a.valuation)
                            .map((company, i) => {
                                const heat = getHeatLevel(company);
                                const style = getHeatStyle(heat);
                                const change = parseFloat(company.change?.replace('%', '').replace('+', '') || '0');
                                // Larger companies get more grid cells
                                const span = company.valuation >= 60000 ? 4 : company.valuation >= 30000 ? 3 : 2;
                                const rowSpan = company.valuation >= 60000 ? 2 : 1;

                                return (
                                    <Link
                                        key={company.id}
                                        href={`/shares/${company.id}`}
                                        className={`rounded-lg border-2 p-3 flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer ${style.bg}`}
                                        style={{ gridColumn: `span ${span}`, gridRow: `span ${rowSpan}` }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <span className="text-xs font-bold text-foreground truncate">{company.name}</span>
                                            <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0 ${heat === 'hot' ? 'animate-pulse' : ''}`} />
                                        </div>
                                        <div className="flex items-end justify-between mt-auto">
                                            <span className="text-[10px] text-muted font-semibold">{company.sector}</span>
                                            <span className={`text-xs font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{company.change}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
}
