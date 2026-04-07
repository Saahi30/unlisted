'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';

interface ConcentrationRisk {
    type: 'company' | 'sector';
    name: string;
    percentage: number;
    amount: number;
    level: 'critical' | 'high' | 'moderate' | 'healthy';
    suggestion: string;
}

interface RebalanceSuggestion {
    action: 'reduce' | 'increase' | 'diversify';
    companyName?: string;
    sector?: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
}

const riskLevelConfig = {
    critical: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', icon: 'ExclamationTriangleIcon' },
    high: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: 'ExclamationCircleIcon' },
    moderate: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: 'InformationCircleIcon' },
    healthy: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', icon: 'CheckCircleIcon' },
};

function getRiskLevel(pct: number): ConcentrationRisk['level'] {
    if (pct >= 60) return 'critical';
    if (pct >= 40) return 'high';
    if (pct >= 25) return 'moderate';
    return 'healthy';
}

export default function RiskPage() {
    const { user } = useAuth();
    const { orders, companies } = useAppStore();

    const userOrders = orders.filter(o => o.userId === user?.id && o.status === 'in_holding');

    const analysis = useMemo(() => {
        if (userOrders.length === 0) return null;

        // Build holdings
        const holdings: Record<string, { companyId: string; companyName: string; sector: string; quantity: number; invested: number }> = {};
        userOrders.forEach(order => {
            const company = companies.find(c => c.id === order.companyId);
            if (!holdings[order.companyId]) {
                holdings[order.companyId] = {
                    companyId: order.companyId,
                    companyName: order.companyName || company?.name || 'Unknown',
                    sector: company?.sector || 'Unknown',
                    quantity: 0,
                    invested: 0,
                };
            }
            holdings[order.companyId].quantity += order.quantity;
            holdings[order.companyId].invested += order.price * order.quantity;
        });

        const holdingsList = Object.values(holdings);
        const totalInvested = holdingsList.reduce((s, h) => s + h.invested, 0);

        if (totalInvested === 0) return null;

        // Company concentration
        const companyRisks: ConcentrationRisk[] = holdingsList.map(h => {
            const pct = (h.invested / totalInvested) * 100;
            const level = getRiskLevel(pct);
            return {
                type: 'company' as const,
                name: h.companyName,
                percentage: pct,
                amount: h.invested,
                level,
                suggestion: level === 'critical' ? `Consider reducing exposure to ${h.companyName} — over 60% concentration is very risky.`
                    : level === 'high' ? `${h.companyName} makes up ${pct.toFixed(0)}% of your portfolio. Consider diversifying.`
                    : level === 'moderate' ? `${h.companyName} is at a manageable level but monitor closely.`
                    : `${h.companyName} allocation looks healthy.`,
            };
        }).sort((a, b) => b.percentage - a.percentage);

        // Sector concentration
        const sectorTotals: Record<string, number> = {};
        holdingsList.forEach(h => {
            sectorTotals[h.sector] = (sectorTotals[h.sector] || 0) + h.invested;
        });

        const sectorRisks: ConcentrationRisk[] = Object.entries(sectorTotals).map(([sector, amount]) => {
            const pct = (amount / totalInvested) * 100;
            const level = getRiskLevel(pct);
            return {
                type: 'sector' as const,
                name: sector,
                percentage: pct,
                amount,
                level,
                suggestion: level === 'critical' ? `Over 60% in ${sector} — high sector-specific risk. Diversify into other sectors.`
                    : level === 'high' ? `${sector} is ${pct.toFixed(0)}% of portfolio. Add exposure to other sectors.`
                    : level === 'moderate' ? `${sector} concentration is manageable.`
                    : `${sector} allocation is well-balanced.`,
            };
        }).sort((a, b) => b.percentage - a.percentage);

        // Rebalancing suggestions
        const suggestions: RebalanceSuggestion[] = [];

        // Check for over-concentrated companies
        companyRisks.filter(r => r.level === 'critical' || r.level === 'high').forEach(r => {
            suggestions.push({
                action: 'reduce',
                companyName: r.name,
                reason: `Reduce ${r.name} from ${r.percentage.toFixed(0)}% to below 25% for better risk management.`,
                priority: r.level === 'critical' ? 'high' : 'medium',
            });
        });

        // Check for missing sectors
        const allSectors = new Set(companies.map(c => c.sector));
        const heldSectors = new Set(holdingsList.map(h => h.sector));
        const missingSectors = [...allSectors].filter(s => !heldSectors.has(s));

        if (missingSectors.length > 0) {
            suggestions.push({
                action: 'diversify',
                sector: missingSectors.join(', '),
                reason: `Consider adding exposure to ${missingSectors.join(', ')} for better diversification.`,
                priority: holdingsList.length <= 2 ? 'high' : 'medium',
            });
        }

        // Check if portfolio is too small
        if (holdingsList.length < 3) {
            suggestions.push({
                action: 'diversify',
                reason: `You hold only ${holdingsList.length} ${holdingsList.length === 1 ? 'company' : 'companies'}. A minimum of 3-5 is recommended for basic diversification.`,
                priority: 'high',
            });
        }

        // Suggest increasing winners
        const growingCompanies = holdingsList.filter(h => {
            const company = companies.find(c => c.id === h.companyId);
            const change = parseFloat(company?.change?.replace('%', '').replace('+', '') || '0');
            return change > 10 && (h.invested / totalInvested) < 0.2;
        });

        growingCompanies.forEach(h => {
            suggestions.push({
                action: 'increase',
                companyName: h.companyName,
                reason: `${h.companyName} is showing strong momentum but is only ${((h.invested / totalInvested) * 100).toFixed(0)}% of your portfolio.`,
                priority: 'low',
            });
        });

        // Overall health score
        const criticalCount = [...companyRisks, ...sectorRisks].filter(r => r.level === 'critical').length;
        const highCount = [...companyRisks, ...sectorRisks].filter(r => r.level === 'high').length;
        let healthScore = 100 - (criticalCount * 30) - (highCount * 15);
        if (holdingsList.length < 3) healthScore -= 20;
        healthScore = Math.max(0, Math.min(100, healthScore));

        return {
            companyRisks,
            sectorRisks,
            suggestions: suggestions.sort((a, b) => {
                const p = { high: 0, medium: 1, low: 2 };
                return p[a.priority] - p[b.priority];
            }),
            totalInvested,
            holdingsCount: holdingsList.length,
            sectorCount: heldSectors.size,
            healthScore,
        };
    }, [userOrders, companies]);

    if (!analysis) {
        return (
            <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
                <div className="flex items-center gap-2 mb-1">
                    <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                        <Icon name="ArrowLeftIcon" size={18} />
                    </Link>
                    <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Portfolio Risk & Rebalancing</h1>
                </div>
                <div className="py-20 text-center">
                    <Icon name="ShieldCheckIcon" size={40} className="mx-auto text-muted mb-4" />
                    <p className="text-muted font-medium mb-2">No holdings to analyze.</p>
                    <p className="text-xs text-muted mb-4">Purchase shares to see risk analysis and rebalancing suggestions.</p>
                    <Button className="bg-primary text-white hover:bg-primary/90" asChild>
                        <Link href="/shares">Explore Shares</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const healthColor = analysis.healthScore >= 70 ? 'text-green-600' : analysis.healthScore >= 40 ? 'text-amber-600' : 'text-red-600';
    const healthBg = analysis.healthScore >= 70 ? 'bg-green-50 border-green-200' : analysis.healthScore >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Portfolio Risk & Rebalancing</h1>
            </div>
            <p className="text-muted mt-1 mb-8">AI-driven concentration risk analysis and rebalancing suggestions.</p>

            {/* Health Score + Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className={`rounded-xl border-2 p-5 flex flex-col items-center justify-center ${healthBg}`}>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Health Score</p>
                    <p className={`text-4xl font-bold ${healthColor}`}>{analysis.healthScore}</p>
                    <p className="text-xs font-medium text-muted mt-1">/100</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Total Invested</p>
                    <p className="text-2xl font-bold text-foreground">₹{analysis.totalInvested.toLocaleString()}</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Companies Held</p>
                    <p className="text-2xl font-bold text-foreground">{analysis.holdingsCount}</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Sectors</p>
                    <p className="text-2xl font-bold text-foreground">{analysis.sectorCount}</p>
                </div>
            </div>

            {/* Rebalancing Suggestions */}
            {analysis.suggestions.length > 0 && (
                <Card className="border-border shadow-sm mb-8">
                    <CardHeader className="border-b border-border/50 bg-white pb-4">
                        <div className="flex items-center gap-2">
                            <Icon name="SparklesIcon" size={18} className="text-primary" />
                            <CardTitle className="font-display font-medium text-lg">AI Rebalancing Suggestions</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {analysis.suggestions.map((s, idx) => {
                            const priorityStyle = s.priority === 'high' ? 'border-red-200 bg-red-50' : s.priority === 'medium' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50';
                            const priorityBadge = s.priority === 'high' ? 'bg-red-100 text-red-700' : s.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';
                            const actionIcon = s.action === 'reduce' ? 'ArrowTrendingDownIcon' : s.action === 'increase' ? 'ArrowTrendingUpIcon' : 'ArrowsPointingOutIcon';
                            const actionColor = s.action === 'reduce' ? 'text-red-600' : s.action === 'increase' ? 'text-green-600' : 'text-blue-600';

                            return (
                                <div key={idx} className={`flex items-start gap-3 p-4 rounded-xl border ${priorityStyle}`}>
                                    <Icon name={actionIcon} size={18} className={`${actionColor} mt-0.5 shrink-0`} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityBadge}`}>
                                                {s.priority} priority
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                                                {s.action}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground">{s.reason}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            {/* Company Concentration */}
            <Card className="border-border shadow-sm mb-6">
                <CardHeader className="border-b border-border/50 bg-white pb-4">
                    <CardTitle className="font-display font-medium text-lg">Company Concentration</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {analysis.companyRisks.map(risk => {
                        const style = riskLevelConfig[risk.level];
                        return (
                            <div key={risk.name} className="flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-foreground truncate">{risk.name}</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}>
                                                {risk.level}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-foreground">{risk.percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${risk.level === 'critical' ? 'bg-red-500' : risk.level === 'high' ? 'bg-orange-500' : risk.level === 'moderate' ? 'bg-amber-400' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(100, risk.percentage)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted mt-1">{risk.suggestion}</p>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Sector Concentration */}
            <Card className="border-border shadow-sm mb-6">
                <CardHeader className="border-b border-border/50 bg-white pb-4">
                    <CardTitle className="font-display font-medium text-lg">Sector Concentration</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {analysis.sectorRisks.map(risk => {
                        const style = riskLevelConfig[risk.level];
                        return (
                            <div key={risk.name} className="flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-foreground">{risk.name}</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}>
                                                {risk.level}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-foreground">{risk.percentage.toFixed(1)}%</span>
                                            <span className="text-xs text-muted ml-2">₹{risk.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${risk.level === 'critical' ? 'bg-red-500' : risk.level === 'high' ? 'bg-orange-500' : risk.level === 'moderate' ? 'bg-amber-400' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(100, risk.percentage)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted mt-1">{risk.suggestion}</p>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-2">
                    <Icon name="ExclamationTriangleIcon" size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                        <strong>Disclaimer:</strong> These suggestions are AI-generated based on portfolio composition and should not be considered financial advice.
                        Consult a qualified financial advisor before making investment decisions.
                    </p>
                </div>
            </div>
        </div>
    );
}
