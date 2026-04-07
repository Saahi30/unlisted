'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';

type TicketCategory = 'order_issue' | 'payment_dispute' | 'demat_delay' | 'kyc_issue' | 'general';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

interface Ticket {
    id: string;
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    description: string;
    createdAt: string;
    updatedAt: string;
    replies: { sender: string; text: string; timestamp: string }[];
}

const categoryOptions: { value: TicketCategory; label: string; icon: string }[] = [
    { value: 'order_issue', label: 'Order Issue', icon: 'ShoppingBagIcon' },
    { value: 'payment_dispute', label: 'Payment Dispute', icon: 'BanknotesIcon' },
    { value: 'demat_delay', label: 'Demat Delay', icon: 'DocumentTextIcon' },
    { value: 'kyc_issue', label: 'KYC / Verification', icon: 'IdentificationIcon' },
    { value: 'general', label: 'General Query', icon: 'ChatBubbleLeftRightIcon' },
];

const priorityConfig = {
    low: { label: 'Low', color: 'bg-slate-100 text-slate-600' },
    medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

const statusConfig = {
    open: { label: 'Open', color: 'bg-amber-100 text-amber-700' },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700' },
    closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600' },
};

export default function TicketsPage() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([
        {
            id: 'TKT-1001',
            subject: 'Payment not reflected for Swiggy order',
            category: 'payment_dispute',
            priority: 'high',
            status: 'in_progress',
            description: 'I made a payment of ₹45,000 via RTGS on March 28th but it has not been reflected in my order status.',
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            replies: [
                { sender: 'Support', text: 'We have received your query. Our finance team is verifying the payment. Please share your UTR number for faster resolution.', timestamp: new Date(Date.now() - 86400000).toISOString() },
            ],
        },
    ]);
    const [showForm, setShowForm] = useState(false);
    const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
    const [form, setForm] = useState({ subject: '', category: 'general' as TicketCategory, priority: 'medium' as TicketPriority, description: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.description.trim()) return;

        const newTicket: Ticket = {
            id: `TKT-${1000 + tickets.length + 1}`,
            subject: form.subject,
            category: form.category,
            priority: form.priority,
            status: 'open',
            description: form.description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            replies: [],
        };

        setTickets(prev => [newTicket, ...prev]);
        setForm({ subject: '', category: 'general', priority: 'medium', description: '' });
        setShowForm(false);
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-4xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                            <Icon name="ArrowLeftIcon" size={18} />
                        </Link>
                        <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Support Tickets</h1>
                    </div>
                    <p className="text-muted mt-1">Raise and track support requests.</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="bg-primary text-white hover:bg-primary/90">
                    <Icon name="PlusIcon" size={16} className="mr-1" /> New Ticket
                </Button>
            </div>

            {/* New Ticket Form */}
            {showForm && (
                <Card className="border-border shadow-sm mb-6">
                    <CardHeader className="border-b border-border/50 bg-white pb-3">
                        <CardTitle className="font-display font-medium text-lg">Raise a New Ticket</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Subject</label>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                    placeholder="Brief description of the issue"
                                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value as TicketCategory }))}
                                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        {categoryOptions.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Priority</label>
                                    <select
                                        value={form.priority}
                                        onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketPriority }))}
                                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        {Object.entries(priorityConfig).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Provide details about your issue, including order IDs, transaction references, etc."
                                    rows={4}
                                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                    required
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                                <Button type="submit" className="bg-primary text-white hover:bg-primary/90">Submit Ticket</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Tickets List */}
            <div className="space-y-3">
                {tickets.length === 0 ? (
                    <div className="py-16 text-center">
                        <Icon name="TicketIcon" size={32} className="mx-auto text-muted mb-3" />
                        <p className="text-muted font-medium">No support tickets yet.</p>
                    </div>
                ) : (
                    tickets.map(ticket => {
                        const isExpanded = expandedTicket === ticket.id;
                        const category = categoryOptions.find(c => c.value === ticket.category);
                        return (
                            <Card key={ticket.id} className="border-border shadow-sm">
                                <CardContent className="p-0">
                                    <div
                                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface/30 transition-colors"
                                        onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center shrink-0">
                                            <Icon name={category?.icon || 'ChatBubbleLeftRightIcon'} size={18} className="text-muted" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] font-mono font-bold text-muted">{ticket.id}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusConfig[ticket.status].color}`}>
                                                    {statusConfig[ticket.status].label}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityConfig[ticket.priority].color}`}>
                                                    {priorityConfig[ticket.priority].label}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-semibold text-foreground truncate">{ticket.subject}</h3>
                                            <p className="text-xs text-muted">
                                                Raised {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                {ticket.replies.length > 0 && ` · ${ticket.replies.length} ${ticket.replies.length === 1 ? 'reply' : 'replies'}`}
                                            </p>
                                        </div>
                                        <Icon name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} className="text-muted shrink-0" />
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-border bg-surface/30 p-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="bg-white border border-border rounded-xl p-4 mb-4">
                                                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Description</p>
                                                <p className="text-sm text-foreground">{ticket.description}</p>
                                            </div>

                                            {ticket.replies.length > 0 && (
                                                <div className="space-y-3 mb-4">
                                                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Replies</p>
                                                    {ticket.replies.map((reply, idx) => (
                                                        <div key={idx} className="bg-white border border-border rounded-xl p-4">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-semibold text-primary">{reply.sender}</span>
                                                                <span className="text-[10px] text-muted">
                                                                    {new Date(reply.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-foreground">{reply.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <Link href="/dashboard/customer/rm-chat" className="flex-1">
                                                    <Button variant="outline" className="w-full text-xs">
                                                        <Icon name="ChatBubbleLeftRightIcon" size={14} className="mr-1" /> Chat with RM
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
