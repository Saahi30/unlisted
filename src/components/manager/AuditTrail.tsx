'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';

export default function AuditTrail() {
    const { auditLog } = useAppStore();
    const [search, setSearch] = useState('');

    const filtered = auditLog
        .filter(e => !search || e.action.toLowerCase().includes(search.toLowerCase()) || e.target.toLowerCase().includes(search.toLowerCase()) || e.details.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const actionIcons: Record<string, string> = {
        'Updated RM Target': 'FlagIcon',
        'Approved Order': 'CheckCircleIcon',
        'Reassigned Lead': 'ArrowsRightLeftIcon',
        'Escalated Ticket': 'FireIcon',
        'Sent Broadcast': 'MegaphoneIcon',
    };

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border/50 bg-white">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div>
                        <CardTitle className="font-display font-medium text-lg">Audit Trail</CardTitle>
                        <CardDescription className="text-muted">Complete log of all manager actions for compliance and review.</CardDescription>
                    </div>
                    <input className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-surface/50 w-64"
                        placeholder="Search actions..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </CardHeader>
            <CardContent className="p-0 bg-white">
                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-muted">No audit entries found.</div>
                ) : (
                    <div className="divide-y divide-border">
                        {filtered.map(entry => (
                            <div key={entry.id} className="flex items-start gap-4 px-6 py-4 hover:bg-surface/30">
                                <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-border">
                                    <Icon name={actionIcons[entry.action] || 'DocumentTextIcon'} size={16} className="text-muted" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-sm font-semibold text-foreground">{entry.action}</p>
                                        <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded border border-border">{entry.target}</span>
                                    </div>
                                    <p className="text-xs text-muted">{entry.details}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-medium text-foreground">{entry.userName}</p>
                                    <p className="text-[10px] text-muted">{new Date(entry.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
