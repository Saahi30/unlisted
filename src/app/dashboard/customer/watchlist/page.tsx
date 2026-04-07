'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/utils/supabase/client';

interface PriceAlert {
    id: string;
    company_id: string;
    target_price: number;
    direction: 'above' | 'below';
    is_triggered: boolean;
}

export default function WatchlistPage() {
    const { user } = useAuth();
    const { companies } = useAppStore();
    const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [alertCompanyId, setAlertCompanyId] = useState<string | null>(null);
    const [alertPrice, setAlertPrice] = useState('');
    const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above');

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const supabase = createClient();
            const [{ data: wl }, { data: al }] = await Promise.all([
                supabase.from('watchlists').select('company_id').eq('user_id', user.id),
                supabase.from('price_alerts').select('*').eq('user_id', user.id).eq('is_triggered', false),
            ]);
            if (wl) setWatchlistIds(wl.map(w => w.company_id));
            if (al) setAlerts(al);
            setLoading(false);
        };
        load();
    }, [user]);

    const toggleWatchlist = async (companyId: string) => {
        if (!user) return;
        const supabase = createClient();
        if (watchlistIds.includes(companyId)) {
            await supabase.from('watchlists').delete().eq('user_id', user.id).eq('company_id', companyId);
            setWatchlistIds(prev => prev.filter(id => id !== companyId));
        } else {
            await supabase.from('watchlists').insert({ user_id: user.id, company_id: companyId });
            setWatchlistIds(prev => [...prev, companyId]);
        }
    };

    const createAlert = async () => {
        if (!user || !alertCompanyId || !alertPrice) return;
        const supabase = createClient();
        const { data } = await supabase.from('price_alerts').insert({
            user_id: user.id,
            company_id: alertCompanyId,
            target_price: parseFloat(alertPrice),
            direction: alertDirection,
        }).select().single();
        if (data) setAlerts(prev => [...prev, data]);
        setAlertCompanyId(null);
        setAlertPrice('');
    };

    const removeAlert = async (id: string) => {
        const supabase = createClient();
        await supabase.from('price_alerts').delete().eq('id', id);
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const watchedCompanies = companies.filter(c => watchlistIds.includes(c.id));
    const unwatchedCompanies = companies.filter(c => !watchlistIds.includes(c.id));

    if (loading) {
        return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Watchlist</h1>
                    <p className="text-muted mt-1">Track companies you're interested in and set price alerts.</p>
                </div>
            </div>

            {/* Watched companies */}
            {watchedCompanies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {watchedCompanies.map(company => {
                        const companyAlerts = alerts.filter(a => a.company_id === company.id);
                        return (
                            <Card key={company.id} className="border-border shadow-sm">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-foreground">{company.name}</h3>
                                            <span className="text-xs text-muted">{company.sector}</span>
                                        </div>
                                        <button onClick={() => toggleWatchlist(company.id)} className="text-amber-500 hover:text-amber-600">
                                            <Icon name="StarIcon" size={20} variant="solid" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-end mb-3">
                                        <div>
                                            <div className="text-xs text-muted">Ask Price</div>
                                            <div className="text-lg font-bold text-foreground">₹{company.currentAskPrice.toLocaleString()}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-muted">Bid Price</div>
                                            <div className="text-sm font-medium text-muted">₹{company.currentBidPrice.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {/* Price alerts for this company */}
                                    {companyAlerts.length > 0 && (
                                        <div className="border-t border-border pt-3 mt-3 space-y-2">
                                            {companyAlerts.map(alert => (
                                                <div key={alert.id} className="flex items-center justify-between text-xs">
                                                    <span className="text-muted">
                                                        Alert: {alert.direction === 'above' ? '>' : '<'} ₹{alert.target_price.toLocaleString()}
                                                    </span>
                                                    <button onClick={() => removeAlert(alert.id)} className="text-red-400 hover:text-red-600">
                                                        <Icon name="XMarkIcon" size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-3">
                                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setAlertCompanyId(company.id)}>
                                            <Icon name="BellIcon" size={14} className="mr-1" /> Set Alert
                                        </Button>
                                        <Button size="sm" className="flex-1 text-xs bg-primary hover:bg-primary/90 text-white" asChild>
                                            <Link href={`/dashboard/customer/buy/${company.id}`}>Buy</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="border-border shadow-sm mb-8">
                    <CardContent className="p-12 text-center">
                        <Icon name="StarIcon" size={48} className="mx-auto text-muted/30 mb-4" />
                        <p className="font-medium text-foreground mb-1">Your watchlist is empty</p>
                        <p className="text-sm text-muted mb-4">Add companies from the catalog to track their prices.</p>
                        <Button asChild><Link href="/shares">Browse Companies</Link></Button>
                    </CardContent>
                </Card>
            )}

            {/* Add to watchlist section */}
            {unwatchedCompanies.length > 0 && (
                <div>
                    <h2 className="text-lg font-display font-medium text-foreground mb-4">Add to Watchlist</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {unwatchedCompanies.slice(0, 6).map(company => (
                            <div key={company.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-surface/30 transition-colors">
                                <div>
                                    <span className="font-medium text-foreground text-sm">{company.name}</span>
                                    <span className="text-xs text-muted ml-2">₹{company.currentAskPrice.toLocaleString()}</span>
                                </div>
                                <button onClick={() => toggleWatchlist(company.id)} className="text-muted hover:text-amber-500 transition-colors">
                                    <Icon name="PlusCircleIcon" size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Set Alert Modal */}
            {alertCompanyId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-background rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <h3 className="font-display text-lg font-medium text-foreground">Set Price Alert</h3>
                            <button onClick={() => setAlertCompanyId(null)} className="text-muted hover:text-foreground p-1.5 rounded-lg">
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Alert when price goes</label>
                                <select className="w-full h-9 px-3 border border-border rounded-md text-sm bg-background" value={alertDirection} onChange={e => setAlertDirection(e.target.value as any)}>
                                    <option value="above">Above</option>
                                    <option value="below">Below</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Target Price (₹)</label>
                                <Input type="number" value={alertPrice} onChange={e => setAlertPrice(e.target.value)} placeholder="Enter target price" />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setAlertCompanyId(null)}>Cancel</Button>
                            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={createAlert} disabled={!alertPrice}>Create Alert</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
