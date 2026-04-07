'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';

const categoryIcons: Record<string, string> = {
    login: 'ArrowRightOnRectangleIcon',
    lead: 'UserPlusIcon',
    order: 'ClipboardDocumentListIcon',
    call: 'PhoneIcon',
    document: 'DocumentArrowUpIcon',
    note: 'PencilSquareIcon',
};

const categoryColors: Record<string, string> = {
    login: 'bg-gray-100 text-gray-600',
    lead: 'bg-blue-50 text-blue-600',
    order: 'bg-green-50 text-green-600',
    call: 'bg-purple-50 text-purple-600',
    document: 'bg-amber-50 text-amber-600',
    note: 'bg-pink-50 text-pink-600',
};

export default function RmActivityLog() {
    const { rmActivities, users } = useAppStore();
    const [filterRm, setFilterRm] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    const rms = users.filter(u => u.role === 'rm');
    const getRmName = (id: string) => users.find(u => u.id === id)?.name || id;

    const filtered = rmActivities
        .filter(a => filterRm === 'all' || a.rmId === filterRm)
        .filter(a => filterCategory === 'all' || a.category === filterCategory)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // RM last active
    const rmLastActive = rms.map(rm => {
        const lastAct = rmActivities.filter(a => a.rmId === rm.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        const lastLogin = rmActivities.filter(a => a.rmId === rm.id && a.category === 'login').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        return { ...rm, lastActivity: lastAct?.timestamp, lastLogin: lastLogin?.timestamp, activityCount: rmActivities.filter(a => a.rmId === rm.id).length };
    });

    const timeAgo = (ts: string) => {
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {rmLastActive.map(rm => (
                    <Card key={rm.id} className="bg-white border-border shadow-sm">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                    {rm.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground text-sm truncate">{rm.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`w-2 h-2 rounded-full ${rm.lastLogin && (Date.now() - new Date(rm.lastLogin).getTime()) < 3600000 ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span className="text-[10px] text-muted">
                                            {rm.lastLogin ? `Last login ${timeAgo(rm.lastLogin)}` : 'Never logged in'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-foreground">{rm.activityCount}</p>
                                    <p className="text-[10px] text-muted uppercase">Actions</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-white">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div>
                            <CardTitle className="font-display font-medium text-lg">Activity Timeline</CardTitle>
                            <CardDescription className="text-muted">Real-time log of all RM actions across the platform.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <select className="text-xs bg-surface border border-border rounded-lg px-3 py-2 outline-none"
                                value={filterRm} onChange={e => setFilterRm(e.target.value)}>
                                <option value="all">All RMs</option>
                                {rms.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                            </select>
                            <select className="text-xs bg-surface border border-border rounded-lg px-3 py-2 outline-none"
                                value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                                <option value="all">All Types</option>
                                <option value="login">Login</option>
                                <option value="lead">Lead</option>
                                <option value="order">Order</option>
                                <option value="call">Call</option>
                                <option value="document">Document</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 bg-white">
                    <div className="divide-y divide-border">
                        {filtered.length === 0 ? (
                            <div className="p-8 text-center text-muted">No activities match your filters.</div>
                        ) : filtered.map(activity => (
                            <div key={activity.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface/30 transition-colors">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[activity.category] || 'bg-gray-100 text-gray-600'}`}>
                                    <Icon name={categoryIcons[activity.category] || 'InformationCircleIcon'} size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                                    <p className="text-xs text-muted truncate">{activity.details}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-semibold text-foreground">{getRmName(activity.rmId)}</p>
                                    <p className="text-[10px] text-muted">{timeAgo(activity.timestamp)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
