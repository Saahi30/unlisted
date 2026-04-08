'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { Company, CompanyFinancial } from '@/lib/mock-data';

interface Scorecard {
    companyId: string;
    companyName: string;
    sector: string;
    ipoLikelihood: number;  // 1-10
    growthPotential: number; // 1-10
    riskLevel: number;       // 1-10 (10 = lowest risk)
    overallScore: number;    // 1-10
    signals: string[];
    status: string;
    valuation: number;
    price: number;
    change: string;
}

function generateScorecard(company: Company, financials: CompanyFinancial[]): Scorecard {
    const companyFinancials = financials.filter(f => f.companyId === company.id);
    const change = parseFloat(company.change?.replace('%', '').replace('+', '') || '0');

    // IPO Likelihood Score
    let ipoScore = 5;
    const signals: string[] = [];

    if (company.status === 'pre_ipo') { ipoScore += 3; signals.push('Pre-IPO stage — DRHP filing likely'); }
    else if (company.status === 'series_c') { ipoScore += 1; signals.push('Late-stage funding completed'); }

    if (company.valuation >= 50000) { ipoScore += 1; signals.push('Valuation exceeds ₹50,000 Cr — IPO-ready scale'); }
    if (company.valuation >= 20000 && company.valuation < 50000) { ipoScore += 0.5; }

    // Revenue growth signal from financials
    if (companyFinancials.length >= 2) {
        const sorted = companyFinancials.sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));
        const latest = sorted[sorted.length - 1];
        const prev = sorted[sorted.length - 2];
        if (latest.revenue && prev.revenue && latest.revenue > prev.revenue) {
            const revenueGrowth = ((latest.revenue - prev.revenue) / prev.revenue) * 100;
            if (revenueGrowth > 30) { signals.push(`Revenue growing ${revenueGrowth.toFixed(0)}% YoY — strong trajectory`); }
        }
        if (latest.pat && latest.pat > 0) { signals.push('Profitable — positive PAT'); }
        else { signals.push('Not yet profitable — pre-profit stage'); }
    }

    ipoScore = Math.min(10, Math.max(1, Math.round(ipoScore)));

    // Growth Potential Score
    let growthScore = 5;
    if (change > 15) { growthScore += 3; signals.push('Strong momentum — 15%+ price movement'); }
    else if (change > 5) { growthScore += 1.5; }
    else if (change < -5) { growthScore -= 1; }

    if (company.valuation >= 30000) growthScore += 1;
    growthScore = Math.min(10, Math.max(1, Math.round(growthScore)));

    // Risk Level Score (higher = safer)
    let riskScore = 5;
    if (company.status === 'pre_ipo') riskScore += 2; // More established
    if (company.valuation >= 50000) riskScore += 1;
    if (change < -10) { riskScore -= 2; signals.push('Elevated risk — significant price decline'); }
    if (companyFinancials.length > 0) {
        const latest = companyFinancials[companyFinancials.length - 1];
        const equity = (latest.shareCapital ?? 0) + (latest.reserves ?? 0);
        const debtToEquity = equity > 0 ? (latest.borrowings ?? 0) / equity : 0;
        if (debtToEquity > 1.5) { riskScore -= 1; signals.push('High debt-to-equity ratio'); }
    }
    riskScore = Math.min(10, Math.max(1, Math.round(riskScore)));

    const overallScore = Math.round((ipoScore * 0.4 + growthScore * 0.35 + riskScore * 0.25));

    return {
        companyId: company.id,
        companyName: company.name,
        sector: company.sector,
        ipoLikelihood: ipoScore,
        growthPotential: growthScore,
        riskLevel: riskScore,
        overallScore: Math.min(10, Math.max(1, overallScore)),
        signals: signals.slice(0, 4),
        status: company.status,
        valuation: company.valuation,
        price: company.currentAskPrice,
        change: company.change || '0%',
    };
}

function ScoreBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${(value / max) * 100}%` }} />
            </div>
            <span className="text-xs font-bold text-foreground w-6 text-right">{value}</span>
        </div>
    );
}

function getOverallColor(score: number) {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 6) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 4) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
}

function getOverallLabel(score: number) {
    if (score >= 8) return 'Strong Buy';
    if (score >= 6) return 'Promising';
    if (score >= 4) return 'Moderate';
    return 'High Risk';
}

export default function ScorecardPage() {
    const { companies, companyFinancials } = useAppStore();
    const [sortBy, setSortBy] = useState<'overall' | 'ipo' | 'growth' | 'risk'>('overall');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const scorecards = useMemo(() => {
        const cards = companies.map(c => generateScorecard(c, companyFinancials));
        switch (sortBy) {
            case 'ipo': return cards.sort((a, b) => b.ipoLikelihood - a.ipoLikelihood);
            case 'growth': return cards.sort((a, b) => b.growthPotential - a.growthPotential);
            case 'risk': return cards.sort((a, b) => b.riskLevel - a.riskLevel);
            default: return cards.sort((a, b) => b.overallScore - a.overallScore);
        }
    }, [companies, companyFinancials, sortBy]);

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                            <Icon name="ArrowLeftIcon" size={18} />
                        </Link>
                        <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Pre-IPO Scorecard</h1>
                    </div>
                    <p className="text-muted mt-1">AI-generated ratings on IPO likelihood, growth potential, and risk level.</p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-lg">
                    <Icon name="SparklesIcon" size={14} className="text-primary ml-2" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider mr-2">AI Powered</span>
                </div>
            </div>

            {/* Sort Controls */}
            <div className="flex gap-2 mb-6">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider self-center mr-2">Rank by:</span>
                {([
                    { key: 'overall', label: 'Overall Score' },
                    { key: 'ipo', label: 'IPO Likelihood' },
                    { key: 'growth', label: 'Growth' },
                    { key: 'risk', label: 'Safety' },
                ] as const).map(s => (
                    <button
                        key={s.key}
                        onClick={() => setSortBy(s.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${sortBy === s.key ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-border hover:border-primary/30'}`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Scorecard List */}
            <div className="space-y-3">
                {scorecards.map((card, idx) => {
                    const overallStyle = getOverallColor(card.overallScore);
                    const isExpanded = expandedId === card.companyId;
                    const change = parseFloat(card.change.replace('%', '').replace('+', '') || '0');

                    return (
                        <Card key={card.companyId} className="border-border shadow-sm hover:shadow-md transition-all">
                            <CardContent className="p-0">
                                <div
                                    className="flex items-center gap-4 p-4 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : card.companyId)}
                                >
                                    {/* Rank */}
                                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shrink-0">
                                        <span className="text-sm font-bold text-foreground">#{idx + 1}</span>
                                    </div>

                                    {/* Company Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-semibold text-foreground text-sm truncate">{card.companyName}</h3>
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{card.sector}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted">
                                            <span>₹{card.price.toLocaleString()}</span>
                                            <span className={`font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{card.change}</span>
                                            <span>₹{card.valuation.toLocaleString()} Cr</span>
                                        </div>
                                    </div>

                                    {/* Mini Scores */}
                                    <div className="hidden md:flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-[10px] text-muted font-bold uppercase tracking-wider">IPO</p>
                                            <p className="text-sm font-bold text-purple-600">{card.ipoLikelihood}/10</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Growth</p>
                                            <p className="text-sm font-bold text-blue-600">{card.growthPotential}/10</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Safety</p>
                                            <p className="text-sm font-bold text-green-600">{card.riskLevel}/10</p>
                                        </div>
                                    </div>

                                    {/* Overall Score Badge */}
                                    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 shrink-0 ${overallStyle}`}>
                                        <span className="text-xl font-bold">{card.overallScore}</span>
                                        <span className="text-[8px] font-bold uppercase tracking-wider">{getOverallLabel(card.overallScore)}</span>
                                    </div>

                                    <Icon name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} className="text-muted shrink-0" />
                                </div>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <div className="border-t border-border bg-surface/30 p-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">IPO Likelihood</p>
                                                <ScoreBar value={card.ipoLikelihood} color="bg-purple-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Growth Potential</p>
                                                <ScoreBar value={card.growthPotential} color="bg-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Safety Rating</p>
                                                <ScoreBar value={card.riskLevel} color="bg-green-500" />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">AI Signals</p>
                                            <div className="flex flex-wrap gap-2">
                                                {card.signals.map((signal, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-white border border-border rounded-lg px-2.5 py-1.5">
                                                        <Icon name="SparklesIcon" size={12} className="text-primary shrink-0" />
                                                        {signal}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button size="sm" className="bg-primary text-white hover:bg-primary/90" asChild>
                                                <Link href={`/shares/${card.companyId}`}>View Details</Link>
                                            </Button>
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/dashboard/customer/buy/${card.companyId}`}>Buy Shares</Link>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Disclaimer */}
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-2">
                    <Icon name="ExclamationTriangleIcon" size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                        <strong>Disclaimer:</strong> These scores are AI-generated estimates based on available data and should not be considered investment advice.
                        Unlisted shares carry high risk. Always conduct your own due diligence and consult a qualified financial advisor before investing.
                    </p>
                </div>
            </div>
        </div>
    );
}
