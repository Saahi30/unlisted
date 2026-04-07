'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';

interface Notification {
    id: string;
    user_id: string | null;
    title: string;
    message: string;
    type: string;
    read: boolean;
    created_at: string;
}

export default function NotificationManagementTab() {
    const { users } = useAppStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCompose, setShowCompose] = useState(false);
    const [form, setForm] = useState({ title: '', message: '', type: 'info', targetRole: 'all', targetUserId: '' });
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    useEffect(() => {
        const fetchNotifications = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200);
            if (data) setNotifications(data);
            setLoading(false);
        };
        fetchNotifications();
    }, []);

    const getUserName = (userId: string | null) => {
        if (!userId) return 'All Users';
        return users.find(u => u.id === userId)?.name || userId.slice(0, 8);
    };

    const handleSend = async () => {
        if (!form.title.trim() || !form.message.trim()) {
            alert('Title and message are required.');
            return;
        }
        setSending(true);
        const supabase = createClient();

        if (form.targetRole === 'specific' && form.targetUserId) {
            await supabase.from('notifications').insert([{
                user_id: form.targetUserId,
                title: form.title,
                message: form.message,
                type: form.type,
            }]);
        } else if (form.targetRole === 'all') {
            const inserts = users.map(u => ({
                user_id: u.id,
                title: form.title,
                message: form.message,
                type: form.type,
            }));
            if (inserts.length > 0) await supabase.from('notifications').insert(inserts);
        } else {
            const targetUsers = users.filter(u => u.role === form.targetRole);
            const inserts = targetUsers.map(u => ({
                user_id: u.id,
                title: form.title,
                message: form.message,
                type: form.type,
            }));
            if (inserts.length > 0) await supabase.from('notifications').insert(inserts);
        }

        // Refresh
        const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200);
        if (data) setNotifications(data);
        setSending(false);
        setShowCompose(false);
        setForm({ title: '', message: '', type: 'info', targetRole: 'all', targetUserId: '' });
    };

    const handleDelete = async (id: string) => {
        const supabase = createClient();
        await supabase.from('notifications').delete().eq('id', id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const filtered = notifications.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        today: notifications.filter(n => new Date(n.created_at).toDateString() === new Date().toDateString()).length,
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-white">
                    <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Sent</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-white">
                    <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Unread</div>
                    <div className="text-2xl font-bold text-amber-600">{stats.unread}</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-white">
                    <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Sent Today</div>
                    <div className="text-2xl font-bold text-primary">{stats.today}</div>
                </div>
            </div>

            {/* Compose Modal */}
            {showCompose && (
                <Card className="border-primary/30 shadow-md">
                    <CardHeader className="border-b border-border/50 bg-primary/5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="font-display font-medium text-lg">Compose Notification</CardTitle>
                            <button onClick={() => setShowCompose(false)} className="text-muted hover:text-foreground p-1 rounded-lg"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Target Audience</label>
                                <select className="w-full h-10 px-3 bg-white border border-border rounded-lg text-sm" value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })}>
                                    <option value="all">All Users</option>
                                    <option value="customer">All Customers</option>
                                    <option value="rm">All RMs</option>
                                    <option value="staffmanager">All Staff Managers</option>
                                    <option value="agent">All Agents</option>
                                    <option value="specific">Specific User</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Type</label>
                                <select className="w-full h-10 px-3 bg-white border border-border rounded-lg text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="info">Info</option>
                                    <option value="success">Success</option>
                                    <option value="warning">Warning</option>
                                    <option value="order">Order Update</option>
                                    <option value="kyc">KYC Update</option>
                                </select>
                            </div>
                        </div>
                        {form.targetRole === 'specific' && (
                            <div>
                                <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Select User</label>
                                <select className="w-full h-10 px-3 bg-white border border-border rounded-lg text-sm" value={form.targetUserId} onChange={e => setForm({ ...form, targetUserId: e.target.value })}>
                                    <option value="">Choose...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Title</label>
                            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Notification title" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Message</label>
                            <textarea
                                className="w-full h-24 p-3 text-sm border border-border rounded-lg bg-white focus:ring-1 focus:ring-primary outline-none resize-none"
                                value={form.message}
                                onChange={e => setForm({ ...form, message: e.target.value })}
                                placeholder="Write the notification message..."
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
                            <Button className="bg-primary text-white" onClick={handleSend} disabled={sending}>
                                {sending ? 'Sending...' : `Send to ${form.targetRole === 'all' ? 'All Users' : form.targetRole === 'specific' ? '1 User' : `All ${form.targetRole}s`}`}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List */}
            <Card className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                    <div>
                        <CardTitle className="font-display font-medium text-lg">Notification History</CardTitle>
                        <CardDescription>{filtered.length} notifications</CardDescription>
                    </div>
                    <Button className="bg-primary text-white" onClick={() => setShowCompose(true)}>
                        <Icon name="PlusIcon" size={16} className="mr-2" /> Compose
                    </Button>
                </CardHeader>
                <div className="p-4 border-b border-border bg-surface/20">
                    <div className="relative">
                        <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <Input placeholder="Search notifications..." className="pl-10 h-10 border-border bg-white" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} />
                    </div>
                </div>
                <CardContent className="p-0 bg-white">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50 hover:bg-surface/50">
                                    <TableHead className="pl-6 font-semibold">Title</TableHead>
                                    <TableHead className="font-semibold">Recipient</TableHead>
                                    <TableHead className="font-semibold">Type</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Sent</TableHead>
                                    <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted italic">No notifications found.</TableCell></TableRow>
                                ) : paginated.map(n => (
                                    <TableRow key={n.id} className="border-border hover:bg-surface/30">
                                        <TableCell className="pl-6">
                                            <div className="font-medium text-sm">{n.title}</div>
                                            <div className="text-xs text-muted truncate max-w-xs">{n.message}</div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted">{getUserName(n.user_id)}</TableCell>
                                        <TableCell>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                                n.type === 'success' ? 'bg-green-50 text-green-600' :
                                                n.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                                                n.type === 'order' ? 'bg-blue-50 text-blue-600' :
                                                'bg-slate-50 text-slate-600'
                                            }`}>{n.type}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-[10px] font-bold ${n.read ? 'text-green-600' : 'text-amber-600'}`}>
                                                {n.read ? 'Read' : 'Unread'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted whitespace-nowrap">
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button variant="ghost" size="sm" className="text-red-500 text-[10px] font-bold uppercase" onClick={() => handleDelete(n.id)}>Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface/20">
                            <span className="text-xs text-muted">{filtered.length} notifications</span>
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
