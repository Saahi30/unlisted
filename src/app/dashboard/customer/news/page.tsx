'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    source: string;
    date: string;
    companyId?: string;
    companyName?: string;
    sector?: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    category: 'ipo' | 'earnings' | 'funding' | 'regulatory' | 'general';
    isBreaking?: boolean;
}

// Generate contextual news from company data + blogs
function generateNewsFromData(companies: any[], blogs: any[], orders: any[]): NewsItem[] {
    const news: NewsItem[] = [];
    const now = Date.now();

    // Generate company-specific news
    companies.forEach((company, idx) => {
        const change = parseFloat(company.change?.replace('%', '').replace('+', '') || '0');

        if (company.status === 'pre_ipo') {
            news.push({
                id: `news_ipo_${company.id}`,
                title: `${company.name} IPO preparation intensifies — DRHP expected soon`,
                summary: `${company.name}, valued at ₹${company.valuation.toLocaleString()} Cr, is reportedly in advanced stages of IPO preparation. The company has appointed investment banks and is expected to file its DRHP within the coming quarters.`,
                source: 'ShareSaathi Intelligence',
                date: new Date(now - idx * 86400000 * 2).toISOString(),
                companyId: company.id,
                companyName: company.name,
                sector: company.sector,
                sentiment: 'positive',
                category: 'ipo',
                isBreaking: idx === 0,
            });
        }

        if (Math.abs(change) > 10) {
            news.push({
                id: `news_price_${company.id}`,
                title: `${company.name} shares ${change > 0 ? 'surge' : 'drop'} ${company.change} in secondary market`,
                summary: `Secondary market prices for ${company.name} have ${change > 0 ? 'risen sharply' : 'declined'} with current ask price at ₹${company.currentAskPrice.toLocaleString()}. ${change > 0 ? 'Strong demand from institutional investors is driving prices higher.' : 'Profit booking and sector rotation appear to be key drivers.'}`,
                source: 'Market Watch',
                date: new Date(now - idx * 86400000 - 43200000).toISOString(),
                companyId: company.id,
                companyName: company.name,
                sector: company.sector,
                sentiment: change > 0 ? 'positive' : 'negative',
                category: 'general',
            });
        }

        news.push({
            id: `news_funding_${company.id}`,
            title: `${company.name} sector update: ${company.sector} sees renewed investor interest`,
            summary: `The ${company.sector} sector continues to attract significant private equity and venture capital interest. ${company.name} with its current valuation of ₹${company.valuation.toLocaleString()} Cr remains a key player in this space.`,
            source: 'Sector Insights',
            date: new Date(now - (idx + 3) * 86400000).toISOString(),
            companyId: company.id,
            companyName: company.name,
            sector: company.sector,
            sentiment: 'neutral',
            category: 'funding',
        });
    });

    // Convert blogs to news items
    blogs.filter((b: any) => b.status === 'published').forEach((blog: any, idx: number) => {
        news.push({
            id: `news_blog_${blog.id}`,
            title: blog.title,
            summary: blog.excerpt,
            source: 'ShareSaathi Blog',
            date: blog.publishedAt || blog.createdAt,
            sentiment: 'neutral',
            category: 'general',
        });
    });

    // General market news
    news.push(
        {
            id: 'news_sebi_1',
            title: 'SEBI considers new framework for unlisted share transactions',
            summary: 'The Securities and Exchange Board of India is evaluating a regulatory framework that could bring more transparency to the unlisted shares market, potentially benefiting long-term investors.',
            source: 'Regulatory Watch',
            date: new Date(now - 86400000).toISOString(),
            sentiment: 'positive',
            category: 'regulatory',
        },
        {
            id: 'news_market_1',
            title: 'Pre-IPO market sees 40% volume increase in Q1 2026',
            summary: 'The Indian pre-IPO secondary market has seen a significant uptick in trading volumes, with institutional investors leading the charge as several high-profile IPOs approach.',
            source: 'Market Intelligence',
            date: new Date(now - 86400000 * 3).toISOString(),
            sentiment: 'positive',
            category: 'general',
        },
        {
            id: 'news_tax_1',
            title: 'Budget 2026: Capital gains tax on unlisted shares remains unchanged',
            summary: 'In a relief to investors, the government has maintained the existing capital gains tax structure for unlisted equity shares, keeping LTCG at 12.5% for holdings exceeding 24 months.',
            source: 'Tax & Policy',
            date: new Date(now - 86400000 * 5).toISOString(),
            sentiment: 'positive',
            category: 'regulatory',
        }
    );

    return news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const sentimentConfig = {
    positive: { icon: 'ArrowTrendingUpIcon', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    negative: { icon: 'ArrowTrendingDownIcon', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    neutral: { icon: 'MinusIcon', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
};

const categoryConfig: Record<string, { label: string; color: string }> = {
    ipo: { label: 'IPO', color: 'bg-purple-100 text-purple-700' },
    earnings: { label: 'Earnings', color: 'bg-green-100 text-green-700' },
    funding: { label: 'Funding', color: 'bg-blue-100 text-blue-700' },
    regulatory: { label: 'Regulatory', color: 'bg-amber-100 text-amber-700' },
    general: { label: 'Market', color: 'bg-slate-100 text-slate-700' },
};

export default function NewsPage() {
    const { user } = useAuth();
    const { companies, blogs, orders } = useAppStore();
    const [filter, setFilter] = useState<'all' | 'portfolio' | 'ipo' | 'regulatory'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const userOrders = orders.filter(o => o.userId === user?.id && o.status === 'in_holding');
    const heldCompanyIds = new Set(userOrders.map(o => o.companyId));

    const allNews = useMemo(() => generateNewsFromData(companies, blogs, userOrders), [companies, blogs, userOrders]);

    const filteredNews = useMemo(() => {
        let result = allNews;

        if (filter === 'portfolio') {
            result = result.filter(n => n.companyId && heldCompanyIds.has(n.companyId));
        } else if (filter === 'ipo') {
            result = result.filter(n => n.category === 'ipo');
        } else if (filter === 'regulatory') {
            result = result.filter(n => n.category === 'regulatory');
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(n =>
                n.title.toLowerCase().includes(q) ||
                n.companyName?.toLowerCase().includes(q) ||
                n.sector?.toLowerCase().includes(q)
            );
        }

        return result;
    }, [allNews, filter, searchQuery, heldCompanyIds]);

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                            <Icon name="ArrowLeftIcon" size={18} />
                        </Link>
                        <h1 className="text-3xl font-display font-light tracking-tight text-foreground">News Feed</h1>
                    </div>
                    <p className="text-muted mt-1">Aggregated market news, company updates, and regulatory changes.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex gap-2">
                    {([
                        { key: 'all', label: 'All News' },
                        { key: 'portfolio', label: 'My Portfolio' },
                        { key: 'ipo', label: 'IPO Updates' },
                        { key: 'regulatory', label: 'Regulatory' },
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
                <div className="relative flex-1 max-w-xs">
                    <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search news..."
                        className="w-full bg-white border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            {/* Breaking News Banner */}
            {allNews.filter(n => n.isBreaking).length > 0 && filter === 'all' && (
                <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-1.5 bg-red-100 rounded-lg shrink-0 mt-0.5">
                        <Icon name="BoltIcon" size={16} className="text-red-600" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-red-600 mb-1">Breaking</p>
                        <p className="text-sm font-semibold text-foreground">{allNews.find(n => n.isBreaking)?.title}</p>
                        <p className="text-xs text-muted mt-1">{allNews.find(n => n.isBreaking)?.summary}</p>
                    </div>
                </div>
            )}

            {/* News List */}
            <div className="space-y-3">
                {filteredNews.length === 0 ? (
                    <div className="py-16 text-center">
                        <Icon name="NewspaperIcon" size={32} className="mx-auto text-muted mb-3" />
                        <p className="text-muted font-medium">No news found matching your filter.</p>
                    </div>
                ) : (
                    filteredNews.map(news => {
                        const sentiment = sentimentConfig[news.sentiment];
                        const category = categoryConfig[news.category];
                        const isPortfolioCompany = news.companyId && heldCompanyIds.has(news.companyId);

                        return (
                            <Card key={news.id} className={`border-border shadow-sm hover:shadow-md transition-shadow ${isPortfolioCompany ? 'ring-1 ring-primary/20' : ''}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${sentiment.bg}`}>
                                            <Icon name={sentiment.icon} size={16} className={sentiment.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${category.color}`}>{category.label}</span>
                                                {isPortfolioCompany && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">In Portfolio</span>
                                                )}
                                                {news.companyName && (
                                                    <span className="text-[10px] font-medium text-muted">{news.companyName}</span>
                                                )}
                                                <span className="text-[10px] text-muted ml-auto shrink-0">{timeAgo(news.date)}</span>
                                            </div>
                                            <h3 className="font-semibold text-foreground text-sm leading-snug mb-1">{news.title}</h3>
                                            <p className="text-xs text-muted leading-relaxed line-clamp-2">{news.summary}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] text-muted font-medium">{news.source}</span>
                                                {news.companyId && (
                                                    <Link href={`/shares/${news.companyId}`} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">
                                                        View Company →
                                                    </Link>
                                                )}
                                            </div>
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
