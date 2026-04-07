'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/AppIcon';
import { useAppStore, Ticket } from '@/lib/store';

const priorityColors: Record<string, string> = {
    low: 'bg-gray-50 text-gray-600 border-gray-200',
    medium: 'bg-blue-50 text-blue-600 border-blue-200',
    high: 'bg-amber-50 text-amber-600 border-amber-200',
    critical: 'bg-red-50 text-red-600 border-red-200',
};

const statusColors: Record<string, string> = {
    open: 'bg-amber-50 text-amber-600',
    in_progress: 'bg-blue-50 text-blue-600',
    resolved: 'bg-green-50 text-green-600',
    escalated: 'bg-red-50 text-red-600',
};

export default function ManagerTickets() {
    const { tickets, updateTicketStatus, addTicketMessage, users } = useAppStore();
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [replyText, setReplyText] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const getRmName = (id: string) => users.find(u => u.id === id)?.name || id;

    const filtered = filterStatus === 'all' ? tickets : tickets.filter(t => t.status === filterStatus);

    const openCount = tickets.filter(t => t.status === 'open').length;
    const escalatedCount = tickets.filter(t => t.status === 'escalated').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

    const handleReply = () => {
        if (!selectedTicket || !replyText.trim()) return;
        addTicketMessage(selectedTicket.id, { from: 'mgr_1', text: replyText, at: new Date().toISOString() });
        setReplyText('');
        setSelectedTicket({ ...selectedTicket, messages: [...selectedTicket.messages, { from: 'mgr_1', text: replyText, at: new Date().toISOString() }] });
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                <Icon name="ExclamationCircleIcon" size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{openCount}</p>
                                <p className="text-xs text-muted font-medium uppercase tracking-wider">Open Tickets</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                <Icon name="FireIcon" size={20} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{escalatedCount}</p>
                                <p className="text-xs text-muted font-medium uppercase tracking-wider">Escalated</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                                <Icon name="CheckCircleIcon" size={20} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{resolvedCount}</p>
                                <p className="text-xs text-muted font-medium uppercase tracking-wider">Resolved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-white">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div>
                            <CardTitle className="font-display font-medium text-lg">Customer Support Tickets</CardTitle>
                            <CardDescription className="text-muted">Monitor and manage escalated customer issues across all RMs.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {['all', 'open', 'in_progress', 'escalated', 'resolved'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${filterStatus === s ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-foreground border border-border'}`}>
                                    {s === 'all' ? 'All' : s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50 hover:bg-surface/50">
                                    <TableHead className="text-muted font-semibold pl-6">Customer</TableHead>
                                    <TableHead className="text-muted font-semibold">Subject</TableHead>
                                    <TableHead className="text-muted font-semibold">Assigned RM</TableHead>
                                    <TableHead className="text-center text-muted font-semibold">Priority</TableHead>
                                    <TableHead className="text-center text-muted font-semibold">Status</TableHead>
                                    <TableHead className="text-muted font-semibold">Updated</TableHead>
                                    <TableHead className="pr-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center p-8 text-muted">No tickets found.</TableCell></TableRow>
                                ) : filtered.map(ticket => (
                                    <TableRow key={ticket.id} className="border-border hover:bg-surface/30">
                                        <TableCell className="font-medium text-foreground pl-6">{ticket.customerName}</TableCell>
                                        <TableCell className="text-sm max-w-[200px] truncate">{ticket.subject}</TableCell>
                                        <TableCell className="text-sm text-muted">{getRmName(ticket.assignedRmId)}</TableCell>
                                        <TableCell className="text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityColors[ticket.priority]}`}>
                                                {ticket.priority}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusColors[ticket.status]}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted">{new Date(ticket.updatedAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button variant="ghost" size="sm" className="text-primary text-xs uppercase tracking-widest font-bold"
                                                onClick={() => setSelectedTicket(ticket)}>
                                                Manage
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <div>
                                <h3 className="font-display text-lg font-medium">{selectedTicket.subject}</h3>
                                <p className="text-xs text-muted mt-1">By {selectedTicket.customerName} &middot; RM: {getRmName(selectedTicket.assignedRmId)}</p>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="text-muted hover:text-foreground p-1.5 rounded-lg"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <div className="p-5 flex-1 overflow-y-auto space-y-4">
                            <div className="bg-surface/50 p-3 rounded-lg border border-border">
                                <p className="text-sm text-foreground">{selectedTicket.description}</p>
                            </div>
                            {selectedTicket.messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.from === 'mgr_1' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-lg text-sm ${msg.from === 'mgr_1' ? 'bg-primary/10 text-primary' : 'bg-surface border border-border text-foreground'}`}>
                                        <p>{msg.text}</p>
                                        <p className="text-[10px] mt-1 opacity-60">{new Date(msg.at).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-border bg-surface/50 space-y-3">
                            <div className="flex gap-2">
                                <select className="text-xs bg-white border border-border rounded-lg px-3 py-2 outline-none"
                                    value={selectedTicket.status}
                                    onChange={(e) => { updateTicketStatus(selectedTicket.id, e.target.value as Ticket['status']); setSelectedTicket({ ...selectedTicket, status: e.target.value as Ticket['status'] }); }}>
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="escalated">Escalated</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Type a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReply()} />
                                <Button size="sm" className="bg-primary text-white" onClick={handleReply}>Send</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
