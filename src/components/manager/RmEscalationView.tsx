'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { User } from '@/lib/store';

interface Props {
    rmId: string;
    rmName: string;
    users: User[];
}

interface Ticket {
    id: string;
    ticket_number: string;
    user_id: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    escalation_level: string;
    escalation_reason: string | null;
    created_at: string;
}

const priorityColors: Record<string, string> = {
    low: 'bg-gray-50 text-gray-600 border-gray-200',
    medium: 'bg-amber-50 text-amber-600 border-amber-200',
    high: 'bg-orange-50 text-orange-600 border-orange-200',
    critical: 'bg-red-50 text-red-600 border-red-200',
};

export default function RmEscalationView({ rmId, rmName, users }: Props) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [escalateId, setEscalateId] = useState<string | null>(null);
    const [reason, setReason] = useState('');

    const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;

    useEffect(() => {
        fetchMyTickets();
    }, [rmId]);

    const fetchMyTickets = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('support_tickets')
            .select('*')
            .or(`assigned_rm_id.eq.${rmId},user_id.eq.${rmId}`)
            .order('created_at', { ascending: false });
        if (data) setTickets(data as Ticket[]);
        setLoading(false);
    };

    const handleEscalate = async (ticketId: string) => {
        if (!reason.trim()) return;
        await supabase.from('support_tickets').update({
            escalation_level: 'manager',
            escalated_by: rmId,
            escalated_at: new Date().toISOString(),
            escalation_reason: reason,
            status: 'escalated'
        }).eq('id', ticketId);

        logAudit({
            entityType: 'ticket',
            entityId: ticketId,
            action: 'escalation',
            oldValue: 'rm',
            newValue: 'manager',
            performedByName: rmName,
            performedByRole: 'rm',
            metadata: { reason }
        });

        // Notify all managers
        const managers = users.filter(u => u.role === 'staffmanager');
        for (const mgr of managers) {
            createNotification({
                userId: mgr.id,
                title: 'Ticket Escalated',
                message: `RM ${rmName} escalated ticket to manager. Reason: ${reason}`,
                type: 'escalation',
                link: '/dashboard/manager?tab=tickets'
            });
        }

        setEscalateId(null);
        setReason('');
        fetchMyTickets();
    };

    const openTickets = tickets.filter(t => t.status !== 'resolved');
    const escalated = tickets.filter(t => t.escalation_level === 'manager');

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-foreground">{tickets.length}</div>
                        <div className="text-xs text-muted mt-1 uppercase tracking-wider font-semibold">Total Tickets</div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-amber-600">{openTickets.length}</div>
                        <div className="text-xs text-muted mt-1 uppercase tracking-wider font-semibold">Open</div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-600">{escalated.length}</div>
                        <div className="text-xs text-muted mt-1 uppercase tracking-wider font-semibold">Escalated</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-white">
                    <CardTitle className="font-display font-medium text-lg">My Tickets & Escalations</CardTitle>
                    <CardDescription className="text-muted">View customer tickets assigned to you and escalate to manager when needed.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 bg-white overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-muted">Loading tickets...</div>
                    ) : tickets.length === 0 ? (
                        <div className="p-12 text-center">
                            <Icon name="ShieldCheckIcon" size={40} className="mx-auto mb-3 text-muted/30" />
                            <p className="text-sm font-medium text-muted">No tickets assigned to you</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="text-muted font-semibold pl-6">Ticket #</TableHead>
                                        <TableHead className="text-muted font-semibold">Customer</TableHead>
                                        <TableHead className="text-muted font-semibold">Subject</TableHead>
                                        <TableHead className="text-muted font-semibold">Priority</TableHead>
                                        <TableHead className="text-muted font-semibold">Status</TableHead>
                                        <TableHead className="pr-6"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.map(ticket => (
                                        <TableRow key={ticket.id} className="border-border hover:bg-surface/30">
                                            <TableCell className="font-mono text-xs pl-6">{ticket.ticket_number}</TableCell>
                                            <TableCell className="text-sm">{getUserName(ticket.user_id)}</TableCell>
                                            <TableCell className="text-sm font-medium">{ticket.subject}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityColors[ticket.priority] || priorityColors.medium}`}>
                                                    {ticket.priority}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    ticket.escalation_level === 'manager' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                                                    ticket.status === 'resolved' ? 'bg-green-50 text-green-600 border border-green-200' :
                                                    'bg-amber-50 text-amber-600 border border-amber-200'
                                                }`}>
                                                    {ticket.escalation_level === 'manager' ? 'Escalated' : ticket.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                {ticket.status !== 'resolved' && ticket.escalation_level !== 'manager' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs text-red-600 hover:bg-red-50 font-bold uppercase tracking-widest"
                                                        onClick={() => setEscalateId(ticket.id)}
                                                    >
                                                        <Icon name="ArrowUpCircleIcon" size={14} className="mr-1" />
                                                        Escalate
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Escalation Reason Modal */}
            {escalateId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-border bg-surface/30">
                            <h3 className="font-semibold text-foreground">Escalate to Manager</h3>
                            <button onClick={() => { setEscalateId(null); setReason(''); }} className="text-muted hover:text-foreground p-1 rounded">
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-muted">Provide a reason for escalating this ticket to your manager.</p>
                            <textarea
                                className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                                placeholder="Describe why this needs manager attention..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-surface/30 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setEscalateId(null); setReason(''); }}>Cancel</Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleEscalate(escalateId)}
                                disabled={!reason.trim()}
                            >
                                Escalate to Manager
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
