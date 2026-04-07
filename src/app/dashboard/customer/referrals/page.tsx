'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';

interface Referral {
    id: string;
    referred_user_id: string;
    status: string;
    reward_amount: number;
    created_at: string;
}

export default function ReferralsPage() {
    const { user } = useAuth();
    const { users } = useAppStore();
    const [referralCode, setReferralCode] = useState('');
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const supabase = createClient();

            // Get or create referral code
            let { data: codeData } = await supabase.from('referral_codes').select('code').eq('user_id', user.id).single();
            if (!codeData) {
                const code = user.name.replace(/\s/g, '').substring(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
                const { data: newCode } = await supabase.from('referral_codes').insert({ user_id: user.id, code }).select('code').single();
                codeData = newCode;
            }
            if (codeData) setReferralCode(codeData.code);

            // Get referrals
            const { data: refs } = await supabase.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false });
            if (refs) setReferrals(refs);

            setLoading(false);
        };
        load();
    }, [user]);

    const copyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/login?ref=${referralCode}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const totalRewards = referrals.filter(r => r.status === 'rewarded').reduce((sum, r) => sum + r.reward_amount, 0);
    const convertedCount = referrals.filter(r => r.status === 'converted' || r.status === 'rewarded').length;
    const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Invited User';

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
                    <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Refer & Earn</h1>
                    <p className="text-muted mt-1">Invite friends to ShareSaathi and earn rewards on their first trade.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-border shadow-sm">
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-foreground">{referrals.length}</div>
                        <div className="text-xs text-muted mt-1">Total Invites</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-green-600">{convertedCount}</div>
                        <div className="text-xs text-muted mt-1">Converted</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-accent">₹{totalRewards.toLocaleString()}</div>
                        <div className="text-xs text-muted mt-1">Total Rewards</div>
                    </CardContent>
                </Card>
            </div>

            {/* Referral code card */}
            <Card className="border-border shadow-sm mb-8">
                <CardHeader className="border-b border-border/50">
                    <CardTitle className="font-display text-lg font-medium">Your Referral Code</CardTitle>
                    <CardDescription className="text-muted">Share this code or link with friends.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="bg-surface border-2 border-dashed border-border rounded-xl px-8 py-4 text-center">
                            <div className="text-2xl font-bold font-mono text-primary tracking-widest">{referralCode}</div>
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={copyLink}>
                                    <Icon name={copied ? 'CheckIcon' : 'ClipboardDocumentIcon'} size={16} className="mr-2" />
                                    {copied ? 'Copied!' : 'Copy Invite Link'}
                                </Button>
                                <Button variant="outline" onClick={() => window.open(`https://wa.me/?text=Join ShareSaathi and invest in unlisted shares! Use my code: ${referralCode} ${window.location.origin}/login?ref=${referralCode}`, '_blank')}>
                                    <Icon name="ChatBubbleLeftIcon" size={16} className="mr-2" /> WhatsApp
                                </Button>
                            </div>
                            <p className="text-xs text-muted">When your friend signs up and completes their first trade, you both earn rewards.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Referral history */}
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50">
                    <CardTitle className="font-display text-lg font-medium">Referral History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-surface/50 hover:bg-surface/50">
                                <TableHead className="text-muted font-semibold pl-6">Referred User</TableHead>
                                <TableHead className="text-muted font-semibold">Date</TableHead>
                                <TableHead className="text-center text-muted font-semibold">Status</TableHead>
                                <TableHead className="text-right text-muted font-semibold pr-6">Reward</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referrals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center p-8 text-muted italic">No referrals yet. Share your code to get started!</TableCell>
                                </TableRow>
                            ) : referrals.map(ref => (
                                <TableRow key={ref.id} className="border-border hover:bg-surface/30">
                                    <TableCell className="pl-6 font-medium text-foreground">{getUserName(ref.referred_user_id)}</TableCell>
                                    <TableCell className="text-muted text-sm">{new Date(ref.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                            ref.status === 'rewarded' ? 'bg-green-50 text-green-600' :
                                            ref.status === 'converted' ? 'bg-blue-50 text-blue-600' :
                                            ref.status === 'registered' ? 'bg-amber-50 text-amber-600' :
                                            'bg-surface text-muted'
                                        }`}>
                                            {ref.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 font-semibold">
                                        {ref.reward_amount > 0 ? `₹${ref.reward_amount.toLocaleString()}` : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
