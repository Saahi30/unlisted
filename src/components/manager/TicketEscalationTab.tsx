'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';

interface TicketReply {
    id: string;
    ticket_id: string;
    author_name: string;
    author_role: string;
    message: string;
    created_at: string;
}

interface SupportTicket {
    id: string;
    ticket_number: string;
    customer_name: string;
    customer_email: string;
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: string;
    escalation_level: string;
    escalated_by: string;
    escalated_at: string;
    escalated_to: string | null;
    resolution_notes: string | null;
    created_at: string;
    replies: TicketReply[];
}

const priorityStyles: Record<string, string> = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-green-50 text-green-700 border-green-200',
};

const escalationStyles: Record<string, string> = {
    rm: 'bg-blue-50 text-blue-700 border-blue-200',
    manager: 'bg-purple-50 text-purple-700 border-purple-200',
    admin: 'bg-red-50 text-red-700 border-red-200',
};

export default function TicketEscalationTab() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState<Record<string, string>>({});
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        const { data: ticketData } = await supabase
            .from('support_tickets')
            .select('*')
            .in('escalation_level', ['rm', 'manager'])
            .order('created_at', { ascending: false });

        if (ticketData && ticketData.length > 0) {
            const ticketIds = ticketData.map(t => t.id);
            const { data: repliesData } = await supabase
                .from('ticket_replies')
                .select('*')
                .in('ticket_id', ticketIds)
                .order('created_at', { ascending: true });

            const repliesByTicket: Record<string, TicketReply[]> = {};
            if (repliesData) {
                for (const reply of repliesData) {
                    if (!repliesByTicket[reply.ticket_id]) repliesByTicket[reply.ticket_id] = [];
                    repliesByTicket[reply.ticket_id].push(reply);
                }
            }

            const parsed: SupportTicket[] = ticketData.map(t => ({
                id: t.id,
                ticket_number: t.ticket_number || `#${t.id.slice(0, 8)}`,
                customer_name: t.customer_name || 'Unknown',
                customer_email: t.customer_email || '',
                subject: t.subject || '',
                description: t.description || '',
                priority: t.priority || 'medium',
                status: t.status || 'open',
                escalation_level: t.escalation_level || 'rm',
                escalated_by: t.escalated_by || 'System',
                escalated_at: t.escalated_at || t.created_at,
                escalated_to: t.escalated_to || null,
                resolution_notes: t.resolution_notes || null,
                created_at: t.created_at,
                replies: repliesByTicket[t.id] || [],
            }));

            setTickets(parsed);
        } else {
            setTickets([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleTakeOver = async (ticket: SupportTicket) => {
        setActionLoading(prev => ({ ...prev, [ticket.id]: true }));

        await supabase
            .from('support_tickets')
            .update({ escalated_to: 'Manager' })
            .eq('id', ticket.id);

        await supabase.from('audit_log').insert([{
            entity_type: 'support_ticket',
            entity_id: ticket.id,
            action: 'take_over',
            old_value: ticket.escalated_to || 'none',
            new_value: 'Manager',
            performed_by_name: 'Manager',
            performed_by_role: 'staffmanager',
            metadata: { ticket_number: ticket.ticket_number, subject: ticket.subject }
        }]);

        setTickets(prev => prev.map(t =>
            t.id === ticket.id ? { ...t, escalated_to: 'Manager' } : t
        ));
        setActionLoading(prev => ({ ...prev, [ticket.id]: false }));
    };

    const handleResolve = async (ticket: SupportTicket) => {
        setActionLoading(prev => ({ ...prev, [ticket.id]: true }));

        const resolutionNote = noteText[ticket.id] || null;

        await supabase
            .from('support_tickets')
            .update({
                status: 'resolved',
                escalation_level: 'none',
                resolution_notes: resolutionNote,
            })
            .eq('id', ticket.id);

        await supabase.from('audit_log').insert([{
            entity_type: 'support_ticket',
            entity_id: ticket.id,
            action: 'resolve',
            old_value: ticket.status,
            new_value: 'resolved',
            performed_by_name: 'Manager',
            performed_by_role: 'staffmanager',
            metadata: { ticket_number: ticket.ticket_number, resolution_notes: resolutionNote }
        }]);

        setTickets(prev => prev.filter(t => t.id !== ticket.id));
        setActionLoading(prev => ({ ...prev, [ticket.id]: false }));
    };

    const handleAddNote = async (ticket: SupportTicket) => {
        const message = noteText[ticket.id];
        if (!message || !message.trim()) return;

        setActionLoading(prev => ({ ...prev, [`note_${ticket.id}`]: true }));

        const { data } = await supabase
            .from('ticket_replies')
            .insert([{
                ticket_id: ticket.id,
                author_name: 'Manager',
                author_role: 'staffmanager',
                message: message.trim(),
            }])
            .select()
            .single();

        if (data) {
            setTickets(prev => prev.map(t =>
                t.id === ticket.id ? { ...t, replies: [...t.replies, data as TicketReply] } : t
            ));
        }

        setNoteText(prev => ({ ...prev, [ticket.id]: '' }));
        setActionLoading(prev => ({ ...prev, [`note_${ticket.id}`]: false }));
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-white">
                    <CardTitle className="font-display font-medium text-lg">Escalated Tickets</CardTitle>
                    <CardDescription className="text-muted">Review and resolve tickets escalated to RM or Manager level.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 bg-white overflow-hidden">
                    {tickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted">
                            <Icon name="ShieldCheckIcon" size={48} className="mb-4 text-muted/40" />
                            <p className="text-lg font-medium">No escalated tickets</p>
                            <p className="text-sm mt-1">All clear -- no tickets require your attention right now.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="text-muted font-semibold pl-6">Ticket #</TableHead>
                                        <TableHead className="text-muted font-semibold">Customer</TableHead>
                                        <TableHead className="text-muted font-semibold">Subject</TableHead>
                                        <TableHead className="text-center text-muted font-semibold">Priority</TableHead>
                                        <TableHead className="text-center text-muted font-semibold">Escalation</TableHead>
                                        <TableHead className="text-muted font-semibold">Escalated By</TableHead>
                                        <TableHead className="text-muted font-semibold">Escalated At</TableHead>
                                        <TableHead className="text-right text-muted font-semibold pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.map(ticket => (
                                        <React.Fragment key={ticket.id}>
                                            <TableRow
                                                className="border-border hover:bg-surface/30 cursor-pointer"
                                                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                                            >
                                                <TableCell className="font-mono text-sm font-medium text-foreground pl-6">
                                                    {ticket.ticket_number}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-foreground text-sm">{ticket.customer_name}</div>
                                                    <div className="text-xs text-muted/70">{ticket.customer_email}</div>
                                                </TableCell>
                                                <TableCell className="text-sm font-medium text-foreground max-w-[200px] truncate">
                                                    {ticket.subject}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityStyles[ticket.priority] || priorityStyles.medium}`}>
                                                        {ticket.priority}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${escalationStyles[ticket.escalation_level] || escalationStyles.rm}`}>
                                                        {ticket.escalation_level}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted">{ticket.escalated_by}</TableCell>
                                                <TableCell className="text-sm text-muted">{formatDate(ticket.escalated_at)}</TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                        {!ticket.escalated_to && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-xs font-bold uppercase tracking-widest border-blue-200 text-blue-700 hover:bg-blue-50"
                                                                onClick={() => handleTakeOver(ticket)}
                                                                disabled={actionLoading[ticket.id]}
                                                            >
                                                                Take Over
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-widest"
                                                            onClick={() => handleResolve(ticket)}
                                                            disabled={actionLoading[ticket.id]}
                                                        >
                                                            Resolve
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expanded Row */}
                                            {expandedId === ticket.id && (
                                                <TableRow className="bg-surface/20 border-border">
                                                    <TableCell colSpan={8} className="p-0">
                                                        <div className="px-6 py-5 space-y-4">
                                                            {/* Description */}
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Description</h4>
                                                                <p className="text-sm text-foreground bg-white p-3 rounded-lg border border-border">
                                                                    {ticket.description || 'No description provided.'}
                                                                </p>
                                                            </div>

                                                            {/* Replies Thread */}
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Replies ({ticket.replies.length})</h4>
                                                                {ticket.replies.length === 0 ? (
                                                                    <p className="text-xs text-muted italic">No replies yet.</p>
                                                                ) : (
                                                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                                                        {ticket.replies.map(reply => (
                                                                            <div key={reply.id} className="bg-white p-3 rounded-lg border border-border">
                                                                                <div className="flex items-center justify-between mb-1">
                                                                                    <span className="text-xs font-semibold text-foreground">
                                                                                        {reply.author_name}
                                                                                        <span className="text-muted font-normal ml-1">({reply.author_role})</span>
                                                                                    </span>
                                                                                    <span className="text-[10px] text-muted">{formatDate(reply.created_at)}</span>
                                                                                </div>
                                                                                <p className="text-sm text-foreground">{reply.message}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Add Note */}
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Add Note / Resolution</h4>
                                                                <div className="flex gap-2">
                                                                    <textarea
                                                                        className="flex-1 text-sm border border-border rounded-lg bg-white px-3 py-2 outline-none focus:border-primary resize-none"
                                                                        rows={2}
                                                                        placeholder="Type a note or resolution..."
                                                                        value={noteText[ticket.id] || ''}
                                                                        onChange={e => setNoteText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="self-end text-xs font-bold uppercase tracking-widest"
                                                                        onClick={() => handleAddNote(ticket)}
                                                                        disabled={!noteText[ticket.id]?.trim() || actionLoading[`note_${ticket.id}`]}
                                                                    >
                                                                        Add Note
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Existing Resolution Notes */}
                                                            {ticket.resolution_notes && (
                                                                <div>
                                                                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Resolution Notes</h4>
                                                                    <p className="text-sm text-foreground bg-green-50 p-3 rounded-lg border border-green-200">
                                                                        {ticket.resolution_notes}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
