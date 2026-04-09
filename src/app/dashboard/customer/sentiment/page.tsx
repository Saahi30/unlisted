'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    category: string;
    company_id: string | null;
    published_at: string;
}

interface SentimentStats {
    bullish: number;
    bearish: number;
    neutral: number;
}

export default function SentimentPage() {
    const { user } = useAuth();
    const { companies, orders } = useAppStore();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'portfolio' | 'bullish' | 'bearish'>('all');
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    const userOrders = orders.filter(o => o.userId === user?.id && o.status === 'in_holding');
    const heldCompanyIds = new Set(userOrders.map(o => o.companyId));

    // Fetch real news from market_news table
    useEffect(() => {
        async function fetchNews() {
            const { data } = await supabase
                .from('market_news')
                .select('id, title, summary, sentiment, category, company_id, published_at')
                .order('published_at', { ascending: false })
                .limit(50);
            setNews((data as NewsItem[]) || []);
            setLoading(false);
        }
        fetchNews();
    }, []);

    // Compute per-company sentiment stats
    const companySentiment = useMemo(() => {
        const map: Record<string, SentimentStats> = {};
        companies.forEach(c => { map[c.id] = { bullish: 0, bearish: 0, neutral: 0 }; });
        news.forEach(n => {
            if (n.company_id && map[n.company_id]) {
                map[n.company_id][n.sentiment]++;
            }
        });
        return map;
    }, [companies, news]);

    // Overall stats
    const overallStats = useMemo(() => {
        const stats = { bullish: 0, bearish: 0, neutral: 0 };
        news.forEach(n => { stats[n.sentiment]++; });
        return stats;
    }, [news]);

    const overallTotal = overallStats.bullish + overallStats.bearish + overallStats.neutral;
    const bullishPct = overallTotal > 0 ? (overallStats.bullish / overallTotal) * 100 : 50;

    // Filter companies
    const filteredCompanies = useMemo(() => {
        let result = [...companies];
        if (filter === 'portfolio') {
            result = result.filter(c => heldCompanyIds.has(c.id));
        } else if (filter === 'bullish') {
            result = result.filter(c => {
                const s = companySentiment[c.id];
                return s && s.bullish > s.bearish;
            });
        } else if (filter === 'bearish') {
            result = result.filter(c => {
                const s = companySentiment[c.id];
                return s && s.bearish >= s.bullish;
            });
        }
        // Sort by total news mentions
        return result.sort((a, b) => {
            const sa = companySentiment[a.id];
            const sb = companySentiment[b.id];
            return ((sb?.bullish || 0) + (sb?.bearish || 0) + (sb?.neutral || 0)) - ((sa?.bullish || 0) + (sa?.bearish || 0) + (sa?.neutral || 0));
        });
    }, [companies, filter, companySentiment, heldCompanyIds]);

    // AI sentiment analysis
    const fetchAiSentiment = useCallback(async (companyId?: string | null) => {
        setAiLoading(true);
        setAiAnalysis(null);
        const company = companyId ? companies.find(c => c.id === companyId) : null;
        try {
            const res = await fetch('/api/ai/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'sentiment',
                    companyId: companyId || undefined,
                    companyName: company?.name || undefined,
                }),
            });
            const data = await res.json();
            setAiAnalysis(data.analysis || null);
        } catch {
            setAiAnalysis('Failed to generate sentiment analysis.');
        } finally {
            setAiLoading(false);
        }
    }, [companies]);

    // Auto-fetch overall sentiment on mount
    useEffect(() => {
        if (news.length > 0 && !aiAnalysis && !aiLoading) {
            fetchAiSentiment(null);
        }
    }, [news.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCompanyClick = (companyId: string) => {
        setSelectedCompany(selectedCompany === companyId ? null : companyId);
        fetchAiSentiment(companyId);
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Market Sentiment</h1>
            </div>
            <p className="text-muted mt-1 mb-8">AI-powered sentiment analysis from real market news and intelligence.</p>

            {/* Overall Sentiment Gauge */}
            <Card className="border-border shadow-sm mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 via-white to-red-50 p-6">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-4 text-center">Overall Market Sentiment</p>
                    {loading ? (
                        <div className="flex items-center justify-center py-4 text-muted text-sm">
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                            Loading market data...
                        </div>
                    ) : (
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
                                <p className="text-[10px] text-muted text-center mt-1">{overallTotal} news articles analyzed</p>
                            </div>
                            <div className="text-center">
                                <Icon name="ArrowTrendingDownIcon" size={24} className="mx-auto text-red-600 mb-1" />
                                <p className="text-xl font-bold text-red-600">{(100 - bullishPct).toFixed(0)}%</p>
                                <p className="text-[10px] font-bold text-red-600 uppercase">Bearish</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* AI Sentiment Summary */}
            <Card className="border-border shadow-sm mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/60 px-6 pt-5 pb-2">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Icon name="SparklesIcon" size={18} className="text-amber-600" />
                            <p className="text-[10px] uppercase tracking-widest font-bold text-amber-800">
                                {selectedCompany ? `AI Analysis: ${companies.find(c => c.id === selectedCompany)?.name}` : 'AI Market Overview'}
                            </p>
                        </div>
                        <button
                            onClick={() => fetchAiSentiment(selectedCompany)}
                            disabled={aiLoading}
                            className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 disabled:opacity-50 transition-colors"
                        >
                            {aiLoading ? 'Analyzing...' : 'Refresh'}
                        </button>
                    </div>
                </div>
                <CardContent className="px-6 pb-5 pt-3">
                    {aiLoading && !aiAnalysis ? (
                        <div className="flex items-center gap-2 text-sm text-muted py-4 justify-center">
                            <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            Analyzing sentiment...
                        </div>
                    ) : aiAnalysis ? (
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{aiAnalysis}</p>
                    ) : (
                        <p className="text-sm text-muted text-center py-2">No news data available for analysis.</p>
                    )}
                </CardContent>
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

            {/* Company Sentiment Cards */}
            <div className="space-y-3">
                {loading ? (
                    <div className="py-16 text-center text-muted text-sm">Loading...</div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="py-16 text-center">
                        <Icon name="ChartBarIcon" size={32} className="mx-auto text-muted mb-3" />
                        <p className="text-muted font-medium">No companies match your filter.</p>
                    </div>
                ) : (
                    filteredCompanies.map(company => {
                        const stats = companySentiment[company.id];
                        if (!stats) return null;
                        const total = stats.bullish + stats.bearish + stats.neutral;
                        const bullPct = total > 0 ? (stats.bullish / total) * 100 : 50;
                        const isHeld = heldCompanyIds.has(company.id);
                        const isSelected = selectedCompany === company.id;
                        const companyNews = news.filter(n => n.company_id === company.id);

                        return (
                            <Card key={company.id} className={`border-border shadow-sm transition-all ${isHeld ? 'ring-1 ring-primary/10' : ''} ${isSelected ? 'border-amber-300' : ''}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <button onClick={() => handleCompanyClick(company.id)} className="text-sm font-semibold text-foreground hover:text-primary truncate text-left">
                                                    {company.name}
                                                </button>
                                                <span className="text-[10px] text-muted font-bold uppercase">{company.sector}</span>
                                                {isHeld && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Held</span>}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted">
                                                <span>₹{company.currentAskPrice.toLocaleString()}</span>
                                                <span>{total} articles</span>
                                                {total === 0 && <span className="text-amber-500">No news yet</span>}
                                            </div>
                                        </div>

                                        {total > 0 && (
                                            <div className="w-40 hidden md:block">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-bold text-green-600">{bullPct.toFixed(0)}%</span>
                                                    <span className="text-[10px] font-bold text-red-600">{(100 - bullPct - (stats.neutral / total) * 100).toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface">
                                                    <div className="h-full bg-green-500 transition-all" style={{ width: `${bullPct}%` }} />
                                                    <div className="h-full bg-gray-300 transition-all" style={{ width: `${(stats.neutral / total) * 100}%` }} />
                                                    <div className="h-full bg-red-500 transition-all" style={{ width: `${(stats.bearish / total) * 100}%` }} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-1 shrink-0">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-green-50 text-green-700">
                                                <Icon name="ArrowTrendingUpIcon" size={12} /> {stats.bullish}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-gray-50 text-gray-600">
                                                {stats.neutral}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-700">
                                                <Icon name="ArrowTrendingDownIcon" size={12} /> {stats.bearish}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expandable news list */}
                                    {isSelected && companyNews.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-border space-y-2">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Recent Headlines</p>
                                            {companyNews.slice(0, 5).map(n => (
                                                <div key={n.id} className="flex items-start gap-2 text-xs">
                                                    <span className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${n.sentiment === 'bullish' ? 'bg-green-500' : n.sentiment === 'bearish' ? 'bg-red-500' : 'bg-gray-400'}`} />
                                                    <div>
                                                        <p className="font-medium text-foreground">{n.title}</p>
                                                        {n.summary && <p className="text-muted mt-0.5 line-clamp-1">{n.summary}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
