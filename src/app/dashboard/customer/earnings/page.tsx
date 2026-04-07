'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { Company } from '@/lib/mock-data';

interface EarningsEvent {
    id: string;
    companyId: string;
    companyName: string;
    sector: string;
    date: string;
    quarter: string;
    fiscalYear: string;
    status: 'upcoming' | 'today' | 'reported';
    estimatedRevenue?: string;
    estimatedPat?: string;
    isTracked: boolean;
    price: number;
    change: string;
}

function generateEarningsCalendar(companies: Company[], heldCompanyIds: Set<string>): EarningsEvent[] {
    const events: EarningsEvent[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Typical quarterly reporting months: May (Q4), Aug (Q1), Nov (Q2), Feb (Q3)
    const quarterSchedule = [
        { months: [0, 1], quarter: 'Q3 FY26', fy: 'FY2025-26' },
        { months: [2, 3, 4], quarter: 'Q4 FY26', fy: 'FY2025-26' },
        { months: [5, 6, 7], quarter: 'Q1 FY27', fy: 'FY2026-27' },
        { months: [8, 9, 10], quarter: 'Q2 FY27', fy: 'FY2026-27' },
        { months: [11], quarter: 'Q3 FY27', fy: 'FY2026-27' },
    ];

    const currentQuarter = quarterSchedule.find(q => q.months.includes(currentMonth));

    companies.forEach((company, idx) => {
        // Generate upcoming earnings date (within next 30-90 days)
        const daysOffset = 7 + (idx * 13) % 75; // Spread across next ~75 days
        const earningsDate = new Date(now);
        earningsDate.setDate(earningsDate.getDate() + daysOffset);

        // Skip weekends
        if (earningsDate.getDay() === 0) earningsDate.setDate(earningsDate.getDate() + 1);
        if (earningsDate.getDay() === 6) earningsDate.setDate(earningsDate.getDate() + 2);

        const isToday = daysOffset === 0;
        const isPast = daysOffset < 0;

        events.push({
            id: `earnings_${company.id}`,
            companyId: company.id,
            companyName: company.name,
            sector: company.sector,
            date: earningsDate.toISOString(),
            quarter: currentQuarter?.quarter || 'Q4 FY26',
            fiscalYear: currentQuarter?.fy || 'FY2025-26',
            status: isToday ? 'today' : isPast ? 'reported' : 'upcoming',
            estimatedRevenue: company.valuation > 50000 ? '₹' + (company.valuation * 0.1).toLocaleString() + ' Cr' : undefined,
            isTracked: heldCompanyIds.has(company.id),
            price: company.currentAskPrice,
            change: company.change || '0%',
        });
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function EarningsCalendarPage() {
    const { user } = useAuth();
    const { companies, orders } = useAppStore();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [filter, setFilter] = useState<'all' | 'tracked' | 'thisMonth'>('all');

    const userOrders = orders.filter(o => o.userId === user?.id && o.status === 'in_holding');
    const heldCompanyIds = new Set(userOrders.map(o => o.companyId));

    const events = useMemo(() => generateEarningsCalendar(companies, heldCompanyIds), [companies, heldCompanyIds]);

    const filteredEvents = useMemo(() => {
        let result = events;
        if (filter === 'tracked') {
            result = result.filter(e => e.isTracked);
        } else if (filter === 'thisMonth') {
            const now = new Date();
            result = result.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        }
        return result;
    }, [events, filter]);

    // Group by week for calendar view
    const groupedByWeek = useMemo(() => {
        const groups: Record<string, EarningsEvent[]> = {};
        filteredEvents.forEach(event => {
            const d = new Date(event.date);
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            const key = weekStart.toISOString().split('T')[0];
            if (!groups[key]) groups[key] = [];
            groups[key].push(event);
        });
        return groups;
    }, [filteredEvents]);

    // Summary stats
    const thisWeekCount = filteredEvents.filter(e => {
        const d = new Date(e.date);
        const now = new Date();
        const diffDays = (d.getTime() - now.getTime()) / 86400000;
        return diffDays >= 0 && diffDays < 7;
    }).length;

    const trackedCount = events.filter(e => e.isTracked).length;

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                            <Icon name="ArrowLeftIcon" size={18} />
                        </Link>
                        <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Earnings Calendar</h1>
                    </div>
                    <p className="text-muted mt-1">Track upcoming quarterly results for companies you hold or follow.</p>
                </div>
                <div className="flex bg-surface border border-border rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === 'list' ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                    >
                        <Icon name="Bars3BottomLeftIcon" size={14} className="inline mr-1" />List
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === 'calendar' ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                    >
                        <Icon name="CalendarDaysIcon" size={14} className="inline mr-1" />Calendar
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">This Week</p>
                    <p className="text-2xl font-bold text-foreground">{thisWeekCount}</p>
                    <p className="text-xs text-muted">earnings reports</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Tracked</p>
                    <p className="text-2xl font-bold text-primary">{trackedCount}</p>
                    <p className="text-xs text-muted">from portfolio</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Total Upcoming</p>
                    <p className="text-2xl font-bold text-foreground">{events.length}</p>
                    <p className="text-xs text-muted">companies</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {([
                    { key: 'all', label: 'All Companies' },
                    { key: 'tracked', label: 'My Holdings' },
                    { key: 'thisMonth', label: 'This Month' },
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

            {/* List View */}
            {viewMode === 'list' ? (
                <div className="space-y-2">
                    {filteredEvents.length === 0 ? (
                        <div className="py-16 text-center">
                            <Icon name="CalendarIcon" size={32} className="mx-auto text-muted mb-3" />
                            <p className="text-muted font-medium">No earnings events match your filter.</p>
                        </div>
                    ) : (
                        filteredEvents.map(event => {
                            const d = new Date(event.date);
                            const change = parseFloat(event.change.replace('%', '').replace('+', '') || '0');
                            const daysUntil = Math.ceil((d.getTime() - Date.now()) / 86400000);

                            return (
                                <div key={event.id} className={`flex items-center gap-4 p-4 rounded-xl border bg-white hover:shadow-sm transition-all ${event.isTracked ? 'border-primary/20 ring-1 ring-primary/10' : 'border-border'}`}>
                                    {/* Date Block */}
                                    <div className="w-14 h-14 rounded-xl bg-surface flex flex-col items-center justify-center shrink-0 border border-border">
                                        <span className="text-[10px] font-bold uppercase text-muted">{monthNames[d.getMonth()]}</span>
                                        <span className="text-lg font-bold text-foreground leading-none">{d.getDate()}</span>
                                    </div>

                                    {/* Company Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-semibold text-foreground text-sm truncate">{event.companyName}</h3>
                                            {event.isTracked && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">Held</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted">
                                            <span>{event.sector}</span>
                                            <span className="font-medium">{event.quarter}</span>
                                            {event.estimatedRevenue && (
                                                <span>Est. Revenue: {event.estimatedRevenue}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right shrink-0 hidden sm:block">
                                        <p className="font-semibold text-foreground text-sm">₹{event.price.toLocaleString()}</p>
                                        <p className={`text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{event.change}</p>
                                    </div>

                                    {/* Days Until */}
                                    <div className={`text-center shrink-0 w-16 py-2 rounded-lg ${daysUntil <= 7 ? 'bg-amber-50 text-amber-700' : 'bg-surface text-muted'}`}>
                                        <p className="text-sm font-bold">{daysUntil}d</p>
                                        <p className="text-[8px] font-bold uppercase">away</p>
                                    </div>

                                    <Link href={`/shares/${event.companyId}`} className="shrink-0">
                                        <Button size="sm" variant="outline" className="text-xs">View</Button>
                                    </Link>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* Calendar View */
                <div className="space-y-6">
                    {Object.entries(groupedByWeek).map(([weekKey, weekEvents]) => {
                        const weekStart = new Date(weekKey);
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 6);

                        return (
                            <Card key={weekKey} className="border-border shadow-sm">
                                <CardHeader className="border-b border-border/50 bg-white py-3 px-4">
                                    <CardTitle className="font-display font-medium text-sm text-muted">
                                        Week of {monthNames[weekStart.getMonth()]} {weekStart.getDate()} – {monthNames[weekEnd.getMonth()]} {weekEnd.getDate()}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3">
                                    <div className="grid grid-cols-7 gap-2">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <div key={day} className="text-center text-[10px] font-bold uppercase text-muted tracking-wider pb-1">{day}</div>
                                        ))}
                                        {Array.from({ length: 7 }, (_, i) => {
                                            const dayDate = new Date(weekStart);
                                            dayDate.setDate(weekStart.getDate() + i);
                                            const dayEvents = weekEvents.filter(e => {
                                                const ed = new Date(e.date);
                                                return ed.getDate() === dayDate.getDate() && ed.getMonth() === dayDate.getMonth();
                                            });

                                            return (
                                                <div key={i} className={`min-h-[60px] p-1.5 rounded-lg border ${dayEvents.length > 0 ? 'border-primary/20 bg-primary/5' : 'border-border/30 bg-surface/30'}`}>
                                                    <p className="text-[10px] font-medium text-muted mb-1">{dayDate.getDate()}</p>
                                                    {dayEvents.map(event => (
                                                        <Link key={event.id} href={`/shares/${event.companyId}`}>
                                                            <div className={`text-[9px] font-semibold px-1 py-0.5 rounded mb-0.5 truncate cursor-pointer ${event.isTracked ? 'bg-primary text-white' : 'bg-white text-foreground border border-border'}`}>
                                                                {event.companyName}
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
