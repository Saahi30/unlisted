'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';

interface AuditEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    entity: string;
    entityId: string;
    details: string;
    category: 'order' | 'user' | 'company' | 'kyc' | 'payout' | 'settings' | 'blog' | 'team' | 'lead';
}

// In-memory audit log (persisted in localStorage)
const AUDIT_STORAGE_KEY = 'admin_audit_log';

function getAuditLog(): AuditEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function logAuditEvent(entry: Omit<AuditEntry, 'id' | 'timestamp'>) {
    if (typeof window === 'undefined') return;
    const log = getAuditLog();
    log.unshift({
        ...entry,
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
    });
    // Keep last 500 entries
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(log.slice(0, 500)));
}

export default function AuditLogTab() {
    const { users } = useAppStore();
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 25;

    useEffect(() => {
        setAuditLog(getAuditLog());
        // Poll for updates
        const interval = setInterval(() => setAuditLog(getAuditLog()), 5000);
        return () => clearInterval(interval);
    }, []);

    const getActorName = (actorId: string) => users.find(u => u.id === actorId)?.name || actorId;

    const filtered = auditLog.filter(entry => {
        const matchesSearch = entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
            getActorName(entry.actor).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'order': return 'bg-blue-50 text-blue-600';
            case 'user': return 'bg-purple-50 text-purple-600';
            case 'company': return 'bg-green-50 text-green-600';
            case 'kyc': return 'bg-amber-50 text-amber-600';
            case 'payout': return 'bg-red-50 text-red-600';
            case 'settings': return 'bg-slate-50 text-slate-600';
            case 'blog': return 'bg-indigo-50 text-indigo-600';
            case 'team': return 'bg-cyan-50 text-cyan-600';
            case 'lead': return 'bg-pink-50 text-pink-600';
            default: return 'bg-slate-50 text-slate-600';
        }
    };

    const getActionIcon = (action: string) => {
        if (action.includes('create') || action.includes('add')) return 'PlusCircleIcon';
        if (action.includes('update') || action.includes('edit') || action.includes('change')) return 'PencilSquareIcon';
        if (action.includes('delete') || action.includes('remove')) return 'TrashIcon';
        if (action.includes('approve')) return 'CheckCircleIcon';
        if (action.includes('reject')) return 'XCircleIcon';
        return 'DocumentTextIcon';
    };

    const handleClearLog = () => {
        if (confirm('Clear all audit log entries? This cannot be undone.')) {
            localStorage.removeItem(AUDIT_STORAGE_KEY);
            setAuditLog([]);
        }
    };

    const handleExport = () => {
        const csv = [
            'Timestamp,Actor,Action,Entity,Entity ID,Details,Category',
            ...filtered.map(e => `"${e.timestamp}","${getActorName(e.actor)}","${e.action}","${e.entity}","${e.entityId}","${e.details}","${e.category}"`)
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const todayCount = auditLog.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString()).length;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-white">
                    <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Events</div>
                    <div className="text-2xl font-bold">{auditLog.length}</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-white">
                    <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Today</div>
                    <div className="text-2xl font-bold text-primary">{todayCount}</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-white">
                    <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Categories</div>
                    <div className="text-2xl font-bold">{new Set(auditLog.map(e => e.category)).size}</div>
                </div>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                    <div>
                        <CardTitle className="font-display font-medium text-lg">Audit Trail</CardTitle>
                        <CardDescription>Track all admin actions for compliance.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Icon name="ArrowDownTrayIcon" size={14} className="mr-1" /> Export CSV
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={handleClearLog}>
                            Clear
                        </Button>
                    </div>
                </CardHeader>
                <div className="p-4 border-b border-border bg-surface/20 flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1">
                        <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <Input placeholder="Search actions, entities, actors..." className="pl-10 h-10 border-border bg-white" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} />
                    </div>
                    <select className="h-10 px-3 bg-white border border-border rounded-lg text-xs font-semibold" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
                        <option value="all">ALL CATEGORIES</option>
                        <option value="order">Orders</option>
                        <option value="user">Users</option>
                        <option value="company">Companies</option>
                        <option value="kyc">KYC</option>
                        <option value="payout">Payouts</option>
                        <option value="settings">Settings</option>
                        <option value="blog">Blogs</option>
                        <option value="team">Teams</option>
                        <option value="lead">Leads</option>
                    </select>
                </div>
                <CardContent className="p-0 bg-white">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50 hover:bg-surface/50">
                                    <TableHead className="pl-6 font-semibold w-44">Timestamp</TableHead>
                                    <TableHead className="font-semibold">Actor</TableHead>
                                    <TableHead className="font-semibold">Action</TableHead>
                                    <TableHead className="font-semibold">Entity</TableHead>
                                    <TableHead className="font-semibold">Category</TableHead>
                                    <TableHead className="pr-6 font-semibold">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted">
                                            <Icon name="ShieldCheckIcon" size={32} className="mx-auto mb-2 text-muted/50" />
                                            <p className="italic">No audit events recorded yet.</p>
                                            <p className="text-xs mt-1">Admin actions will be logged here automatically.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.map(entry => (
                                    <TableRow key={entry.id} className="border-border hover:bg-surface/30">
                                        <TableCell className="pl-6 text-xs text-muted whitespace-nowrap font-mono">
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                                    {getActorName(entry.actor).charAt(0)}
                                                </div>
                                                <span className="text-xs font-medium">{getActorName(entry.actor)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <Icon name={getActionIcon(entry.action)} size={14} className="text-muted" />
                                                <span className="text-xs font-medium">{entry.action}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <span className="font-medium">{entry.entity}</span>
                                            <span className="text-muted ml-1 font-mono">({entry.entityId.slice(0, 8)})</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getCategoryColor(entry.category)}`}>
                                                {entry.category}
                                            </span>
                                        </TableCell>
                                        <TableCell className="pr-6 text-xs text-muted max-w-xs truncate">{entry.details}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface/20">
                            <span className="text-xs text-muted">{filtered.length} events</span>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                                <span className="text-xs text-muted">Page {page} of {totalPages}</span>
                                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
