'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';

interface FeedbackRecord {
    id: string;
    user_id: string;
    order_id: string;
    rating: number;
    comment: string;
    type: string;
    created_at: string;
}

export default function FeedbackTab() {
    const { users, orders } = useAppStore();
    const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
            if (data) setFeedbackList(data);
            setLoading(false);
        };
        fetchFeedback();
    }, []);

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || userId;
    const getOrderCompany = (orderId: string) => orders.find(o => o.id === orderId)?.companyName || '-';

    const avgRating = feedbackList.length > 0
        ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1)
        : '0';

    const ratingDistribution = [5, 4, 3, 2, 1].map(r => ({
        rating: r,
        count: feedbackList.filter(f => f.rating === r).length,
        percent: feedbackList.length > 0 ? (feedbackList.filter(f => f.rating === r).length / feedbackList.length) * 100 : 0,
    }));

    if (loading) {
        return <div className="flex justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-border shadow-sm">
                    <CardContent className="p-6 text-center">
                        <div className="text-4xl font-bold text-foreground mb-1">{avgRating}</div>
                        <div className="flex justify-center gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Icon key={s} name="StarIcon" size={16} variant={s <= Math.round(Number(avgRating)) ? 'solid' : 'outline'} className={s <= Math.round(Number(avgRating)) ? 'text-amber-400' : 'text-border'} />
                            ))}
                        </div>
                        <div className="text-xs text-muted">Average Rating</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-6 text-center">
                        <div className="text-4xl font-bold text-foreground mb-1">{feedbackList.length}</div>
                        <div className="text-xs text-muted">Total Reviews</div>
                    </CardContent>
                </Card>
                <Card className="border-border shadow-sm">
                    <CardContent className="p-6">
                        <div className="space-y-2">
                            {ratingDistribution.map(r => (
                                <div key={r.rating} className="flex items-center gap-2 text-xs">
                                    <span className="w-3 font-semibold text-muted">{r.rating}</span>
                                    <Icon name="StarIcon" size={12} variant="solid" className="text-amber-400" />
                                    <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${r.percent}%` }} />
                                    </div>
                                    <span className="text-muted w-6 text-right">{r.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Feedback table */}
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-white">
                    <CardTitle className="font-display font-medium text-lg">All Feedback</CardTitle>
                    <CardDescription className="text-muted">Customer ratings and comments on transactions.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 bg-white">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50 hover:bg-surface/50">
                                    <TableHead className="text-muted font-semibold pl-6">Customer</TableHead>
                                    <TableHead className="text-muted font-semibold">Company</TableHead>
                                    <TableHead className="text-muted font-semibold">Rating</TableHead>
                                    <TableHead className="text-muted font-semibold">Comment</TableHead>
                                    <TableHead className="text-right text-muted font-semibold pr-6">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedbackList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center p-8 text-muted italic">No feedback received yet.</TableCell>
                                    </TableRow>
                                ) : feedbackList.map(fb => (
                                    <TableRow key={fb.id} className="border-border hover:bg-surface/30">
                                        <TableCell className="pl-6 font-medium text-foreground">{getUserName(fb.user_id)}</TableCell>
                                        <TableCell className="text-muted">{getOrderCompany(fb.order_id)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Icon key={s} name="StarIcon" size={14} variant={s <= fb.rating ? 'solid' : 'outline'} className={s <= fb.rating ? 'text-amber-400' : 'text-border'} />
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted max-w-xs truncate">{fb.comment || '-'}</TableCell>
                                        <TableCell className="text-right pr-6 text-xs text-muted">{new Date(fb.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
