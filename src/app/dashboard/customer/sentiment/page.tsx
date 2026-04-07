'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';

interface PollEntry {
    companyId: string;
    bullish: number;
    bearish: number;
    userVote?: 'bullish' | 'bearish';
}

// Seed initial sentiment from company data
function seedSentiment(companies: any[]): Record<string, PollEntry> {
    const polls: Record<string, PollEntry> = {};
    companies.forEach(company => {
        const change = parseFloat(company.change?.replace('%', '').replace('+', '') || '0');
        // Higher positive change = more bullish votes
        const baseBullish = Math.round(50 + change * 2 + Math.random() * 20);
        const baseBearish = Math.round(100 - baseBullish + Math.random() * 15);
        polls[company.id] = {
            companyId: company.id,
            bullish: Math.max(10, baseBullish),
            bearish: Math.max(5, baseBearish),
        };
    });
    return polls;
}

export default function SentimentPage() {
    const { user } = useAuth();
    const { companies, orders } = useAppStore();
    const [polls, setPolls] = useState<Record<string, PollEntry>>(() => seedSentiment(companies));
    const [filter, setFilter] = useState<'all' | 'portfolio' | 'bullish' | 'bearish'>('all');

    const userOrders = orders.filter(o => o.userId === user?.id && o.status === 'in_holding');
    const heldCompanyIds = new Set(userOrders.map(o => o.companyId));

    const vote = (companyId: string, sentiment: 'bullish' | 'bearish') => {
        setPolls(prev => {
            const current = prev[companyId];
            if (!current || current.userVote) return prev; // Already voted
            return {
                ...prev,
                [companyId]: {
                    ...current,
                    bullish: current.bullish + (sentiment === 'bullish' ? 1 : 0),
                    bearish: current.bearish + (sentiment === 'bearish' ? 1 : 0),
                    userVote: sentiment,
                },
            };
        });
    };

    const sortedCompanies = useMemo(() => {
        let result = [...companies];

        if (filter === 'portfolio') {
            result = result.filter(c => heldCompanyIds.has(c.id));
        } else if (filter === 'bullish') {
            result = result.filter(c => {
                const p = polls[c.id];
                return p && p.bullish > p.bearish;
            });
        } else if (filter === 'bearish') {
            result = result.filter(c => {
                const p = polls[c.id];
                return p && p.bearish >= p.bullish;
            });
        }

        // Sort by total votes (engagement)
        return result.sort((a, b) => {
            const pa = polls[a.id];
            const pb = polls[b.id];
            return ((pb?.bullish || 0) + (pb?.bearish || 0)) - ((pa?.bullish || 0) + (pa?.bearish || 0));
        });
    }, [companies, filter, polls, heldCompanyIds]);

    // Overall market sentiment
    const overallBullish = Object.values(polls).reduce((s, p) => s + p.bullish, 0);
    const overallBearish = Object.values(polls).reduce((s, p) => s + p.bearish, 0);
    const overallTotal = overallBullish + overallBearish;
    const bullishPct = overallTotal > 0 ? (overallBullish / overallTotal) * 100 : 50;
    const votedCount = Object.values(polls).filter(p => p.userVote).length;

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Market Sentiment</h1>
            </div>
            <p className="text-muted mt-1 mb-8">Vote bullish or bearish on companies and see what the community thinks.</p>

            {/* Overall Sentiment Gauge */}
            <Card className="border-border shadow-sm mb-8 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 via-white to-red-50 p-6">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-4 text-center">Overall Market Sentiment</p>
                    <div className="flex items-center gap-4 max-w-lg mx-auto">
                        <div className="text-center">
                            <Icon name="ArrowTrendingUpIcon" size={24} className="mx-auto text-green-600 mb-1" />
                            <p className="text-xl font-bold text-green-600">{bullishPct.toFixed(0)}%</p>
                            <p className="text-[10px] font-bold text-green-600 uppercase">Bullish</p>
                        </div>
                        <div className="flex-1">
                            <div className="w-full h-4 rounded-full overflow-hidden flex bg-surface">
                                <div className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500" style={{ width: `${bullishPct}%` }} />
                                <div className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500" style={{ width: `${100 - bullishPct}%` }} />
                            </div>
                            <p className="text-[10px] text-muted text-center mt-1">{overallTotal.toLocaleString()} total votes</p>
                        </div>
                        <div className="text-center">
                            <Icon name="ArrowTrendingDownIcon" size={24} className="mx-auto text-red-600 mb-1" />
                            <p className="text-xl font-bold text-red-600">{(100 - bullishPct).toFixed(0)}%</p>
                            <p className="text-[10px] font-bold text-red-600 uppercase">Bearish</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted text-center mt-3">You've voted on {votedCount}/{companies.length} companies</p>
                </div>
            </Card>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {([
                    { key: 'all', label: 'All Companies' },
                    { key: 'portfolio', label: 'My Holdings' },
                    { key: 'bullish', label: 'Most Bullish' },
                    { key: 'bearish', label: 'Most Bearish' },
                ] as const).map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === f.key ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-border hover:border-primary/30'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Company Polls */}
            <div className="space-y-3">
                {sortedCompanies.length === 0 ? (
                    <div className="py-16 text-center">
                        <Icon name="ChartBarIcon" size={32} className="mx-auto text-muted mb-3" />
                        <p className="text-muted font-medium">No companies match your filter.</p>
                    </div>
                ) : (
                    sortedCompanies.map(company => {
                        const poll = polls[company.id];
                        if (!poll) return null;

                        const total = poll.bullish + poll.bearish;
                        const bullPct = total > 0 ? (poll.bullish / total) * 100 : 50;
                        const change = parseFloat(company.change?.replace('%', '').replace('+', '') || '0');
                        const hasVoted = !!poll.userVote;
                        const isHeld = heldCompanyIds.has(company.id);

                        return (
                            <Card key={company.id} className={`border-border shadow-sm ${isHeld ? 'ring-1 ring-primary/10' : ''}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        {/* Company Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Link href={`/shares/${company.id}`} className="text-sm font-semibold text-foreground hover:text-primary truncate">{company.name}</Link>
                                                <span className="text-[10px] text-muted font-bold uppercase">{company.sector}</span>
                                                {isHeld && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Held</span>}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted">
                                                <span>₹{company.currentAskPrice.toLocaleString()}</span>
                                                <span className={`font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{company.change}</span>
                                                <span>{total} votes</span>
                                            </div>
                                        </div>

                                        {/* Sentiment Bar */}
                                        <div className="w-40 hidden md:block">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-bold text-green-600">{bullPct.toFixed(0)}%</span>
                                                <span className="text-[10px] font-bold text-red-600">{(100 - bullPct).toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface">
                                                <div className="h-full bg-green-500 transition-all" style={{ width: `${bullPct}%` }} />
                                                <div className="h-full bg-red-500 transition-all" style={{ width: `${100 - bullPct}%` }} />
                                            </div>
                                        </div>

                                        {/* Vote Buttons */}
                                        <div className="flex gap-2 shrink-0">
                                            {hasVoted ? (
                                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg ${poll.userVote === 'bullish' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    <Icon name={poll.userVote === 'bullish' ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'} size={14} />
                                                    {poll.userVote === 'bullish' ? 'Bullish' : 'Bearish'}
                                                </span>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => vote(company.id, 'bullish')}
                                                        className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                                                    >
                                                        <Icon name="ArrowTrendingUpIcon" size={14} />
                                                        Bull
                                                    </button>
                                                    <button
                                                        onClick={() => vote(company.id, 'bearish')}
                                                        className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Icon name="ArrowTrendingDownIcon" size={14} />
                                                        Bear
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
