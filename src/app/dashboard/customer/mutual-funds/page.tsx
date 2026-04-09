'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/utils/supabase/client';

export default function MutualFundsPage() {
    const { user } = useAuth();
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [alreadyInterested, setAlreadyInterested] = useState(false);

    // Check if user already expressed interest
    useEffect(() => {
        if (!user) return;
        const check = async () => {
            const supabase = createClient();
            const { count } = await supabase
                .from('mutual_fund_interests')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            if (count && count > 0) setAlreadyInterested(true);
        };
        check();
    }, [user]);

    const handleExpressInterest = async () => {
        if (!user) return;
        setSubmitting(true);
        try {
            const supabase = createClient();
            await supabase.from('mutual_fund_interests').insert({
                user_id: user.id,
                name: user.name,
                email: user.email,
            });
            setSubmitted(true);
        } catch {
            // silently fail
        } finally {
            setSubmitting(false);
        }
    };

    const done = submitted || alreadyInterested;

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-4xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Mutual Funds</h1>
            </div>
            <p className="text-muted mt-1 mb-8">Curated mutual fund investments, coming soon to ShareSaathi.</p>

            {/* Coming Soon Hero */}
            <Card className="border-border shadow-sm overflow-hidden mb-8">
                <div className="bg-gradient-to-br from-primary/5 via-blue-50 to-indigo-50 p-8 md:p-12 text-center relative">
                    <div className="absolute top-4 right-6 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
                    <div className="absolute bottom-4 left-8 w-16 h-16 bg-indigo-100 rounded-full blur-2xl" />

                    <div className="relative">
                        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-bold text-primary uppercase tracking-wider">Coming Soon</span>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                            Mutual Funds on ShareSaathi
                        </h2>
                        <p className="text-muted max-w-lg mx-auto mb-8 text-sm leading-relaxed">
                            We're building a curated mutual fund marketplace — SIP investments, direct plans, expert-picked baskets,
                            and AI-powered fund recommendations. All integrated with your unlisted shares portfolio.
                        </p>

                        {/* Feature preview cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
                            {[
                                { icon: 'SparklesIcon', label: 'AI Fund Picks' },
                                { icon: 'ArrowPathIcon', label: 'SIP Automation' },
                                { icon: 'ChartBarIcon', label: 'Portfolio Analytics' },
                                { icon: 'ShieldCheckIcon', label: 'Direct Plans' },
                            ].map(f => (
                                <div key={f.label} className="bg-white/80 border border-border/50 rounded-xl p-3">
                                    <Icon name={f.icon} size={20} className="text-primary mx-auto mb-1.5" />
                                    <p className="text-xs font-medium text-foreground">{f.label}</p>
                                </div>
                            ))}
                        </div>

                        {done ? (
                            <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-5 py-2.5">
                                <Icon name="CheckCircleIcon" size={18} className="text-green-600" />
                                <span className="text-sm font-semibold text-green-700">You're on the early access list!</span>
                            </div>
                        ) : (
                            <Button
                                onClick={handleExpressInterest}
                                disabled={submitting}
                                className="bg-primary text-white hover:bg-primary/90 px-8 py-3 text-sm font-bold"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Registering...
                                    </span>
                                ) : (
                                    <>
                                        <Icon name="HandRaisedIcon" size={18} className="mr-2" />
                                        I'm Interested — Notify Me
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* FAQ Section */}
            <Card className="border-border shadow-sm">
                <CardContent className="p-6 space-y-4">
                    <h3 className="font-display font-medium text-lg text-foreground">What to expect</h3>
                    {[
                        { q: 'When will mutual funds launch?', a: 'We\'re targeting launch within the next quarter. Express interest to get notified first.' },
                        { q: 'Will I get AI recommendations?', a: 'Yes — our AI will analyze your risk profile and existing unlisted holdings to suggest complementary mutual funds.' },
                        { q: 'Direct or regular plans?', a: 'We\'ll offer direct plans with zero commission, saving you 0.5-1.5% annually compared to regular plans.' },
                        { q: 'Can I start SIPs?', a: 'Absolutely. Automated SIPs with flexible schedules will be available from day one.' },
                    ].map((faq, i) => (
                        <div key={i} className="border-b border-border/50 last:border-0 pb-3 last:pb-0">
                            <p className="text-sm font-semibold text-foreground">{faq.q}</p>
                            <p className="text-xs text-muted mt-1">{faq.a}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
