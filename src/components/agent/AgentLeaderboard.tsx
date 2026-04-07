'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/utils/supabase/client';

interface LeaderboardEntry {
    agent_id: string;
    agent_name: string;
    total_earnings: number;
    total_orders: number;
    rank: number;
}

const MEDAL_COLORS = ['text-amber-400', 'text-slate-400', 'text-amber-700'];

export default function AgentLeaderboard() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const supabase = createClient();

            // Get all paid agent orders grouped by agent
            const { data: orders } = await supabase
                .from('agent_client_orders')
                .select('agent_id, agent_earnings')
                .eq('status', 'paid');

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name')
                .eq('role', 'agent');

            if (!orders || !profiles) {
                // Fallback with simulated data
                setLeaderboard([
                    { agent_id: 'agt_1', agent_name: 'Agent Demo', total_earnings: 25000, total_orders: 12, rank: 1 },
                ]);
                setLoading(false);
                return;
            }

            const agentMap: Record<string, { earnings: number; orders: number }> = {};
            orders.forEach(o => {
                if (!agentMap[o.agent_id]) agentMap[o.agent_id] = { earnings: 0, orders: 0 };
                agentMap[o.agent_id].earnings += Number(o.agent_earnings || 0);
                agentMap[o.agent_id].orders += 1;
            });

            const entries = Object.entries(agentMap)
                .map(([id, data]) => ({
                    agent_id: id,
                    agent_name: profiles.find(p => p.id === id)?.name || 'Agent',
                    total_earnings: data.earnings,
                    total_orders: data.orders,
                    rank: 0,
                }))
                .sort((a, b) => b.total_earnings - a.total_earnings)
                .map((entry, i) => ({ ...entry, rank: i + 1 }));

            setLeaderboard(entries);
            setLoading(false);
        };
        fetch();
    }, []);

    const myRank = leaderboard.find(e => e.agent_id === user?.id);

    if (loading) {
        return <div className="flex justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Your rank card */}
            {myRank && (
                <Card className="border-border shadow-sm bg-primary/5">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold font-display">
                            #{myRank.rank}
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-foreground">Your Rank</div>
                            <div className="text-sm text-muted">₹{myRank.total_earnings.toLocaleString()} earned from {myRank.total_orders} orders</div>
                        </div>
                        {myRank.rank <= 3 && (
                            <Icon name="TrophyIcon" size={32} className={MEDAL_COLORS[myRank.rank - 1]} />
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Leaderboard */}
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50">
                    <CardTitle className="font-display text-lg font-medium">Top Agents</CardTitle>
                    <CardDescription className="text-muted">Ranked by total earnings from client orders.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {leaderboard.length === 0 ? (
                        <div className="p-12 text-center text-muted">No agent activity yet.</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {leaderboard.slice(0, 20).map(entry => {
                                const isMe = entry.agent_id === user?.id;
                                const privacyName = isMe
                                    ? entry.agent_name
                                    : entry.agent_name.split(' ')[0] + (entry.agent_name.split(' ')[1] ? ` ${entry.agent_name.split(' ')[1][0]}.` : '');

                                return (
                                    <div
                                        key={entry.agent_id}
                                        className={`flex items-center gap-4 px-6 py-4 ${isMe ? 'bg-primary/5' : 'hover:bg-surface/30'} transition-colors`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                            entry.rank <= 3 ? 'bg-accent/20 text-accent' : 'bg-surface text-muted'
                                        }`}>
                                            {entry.rank <= 3 ? (
                                                <Icon name="TrophyIcon" size={16} className={MEDAL_COLORS[entry.rank - 1]} />
                                            ) : entry.rank}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-foreground text-sm">
                                                {privacyName} {isMe && <span className="text-xs text-primary ml-1">(You)</span>}
                                            </div>
                                            <div className="text-xs text-muted">{entry.total_orders} orders completed</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-foreground">₹{entry.total_earnings.toLocaleString()}</div>
                                            <div className="text-[10px] text-muted uppercase">Earnings</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
