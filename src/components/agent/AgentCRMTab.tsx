'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    tags: string[];
    status: string;
    last_contacted_at: string | null;
    next_followup_at: string | null;
    total_invested: number;
    total_orders: number;
    created_at: string;
}

interface Followup {
    id: string;
    client_id: string;
    type: string;
    notes: string;
    outcome: string;
    scheduled_at: string | null;
    completed_at: string | null;
    created_at: string;
}

export default function AgentCRMTab() {
    const { user } = useAuth();
    const supabase = createClient();

    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [followups, setFollowups] = useState<Followup[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Add client form
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', notes: '', status: 'prospect' });
    // Add followup form
    const [showFollowupForm, setShowFollowupForm] = useState(false);
    const [newFollowup, setNewFollowup] = useState({ type: 'call', notes: '', outcome: '', scheduled_at: '' });

    useEffect(() => {
        fetchClients();
    }, [user]);

    const fetchClients = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('agent_clients')
            .select('*')
            .eq('agent_id', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            setClients(data);
        } else if (user.id === 'agt_1') {
            setClients([
                { id: 'c1', name: 'Rajesh Kumar', email: 'rajesh@gmail.com', phone: '9876543210', notes: 'Interested in tech stocks', tags: ['high-value', 'tech'], status: 'active', last_contacted_at: new Date().toISOString(), next_followup_at: new Date(Date.now() + 86400000 * 2).toISOString(), total_invested: 150000, total_orders: 3, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
                { id: 'c2', name: 'Priya Sharma', email: 'priya@gmail.com', phone: '9876543211', notes: 'First-time investor, needs guidance', tags: ['new'], status: 'prospect', last_contacted_at: null, next_followup_at: new Date(Date.now() + 86400000).toISOString(), total_invested: 0, total_orders: 0, created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
                { id: 'c3', name: 'Amit Patel', email: 'amit@gmail.com', phone: '9876543212', notes: 'Regular buyer, prefers fintech', tags: ['regular', 'fintech'], status: 'active', last_contacted_at: new Date(Date.now() - 86400000 * 3).toISOString(), next_followup_at: null, total_invested: 320000, total_orders: 7, created_at: new Date(Date.now() - 86400000 * 60).toISOString() },
                { id: 'c4', name: 'Sunita Verma', email: 'sunita@gmail.com', phone: '9876543213', notes: 'Lost interest after last call', tags: [], status: 'inactive', last_contacted_at: new Date(Date.now() - 86400000 * 15).toISOString(), next_followup_at: null, total_invested: 50000, total_orders: 1, created_at: new Date(Date.now() - 86400000 * 90).toISOString() },
            ]);
        }
        setLoading(false);
    };

    const fetchFollowups = async (clientId: string) => {
        if (!user) return;
        const { data } = await supabase
            .from('agent_followups')
            .select('*')
            .eq('agent_id', user.id)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (data) {
            setFollowups(data);
        } else {
            setFollowups([
                { id: 'f1', client_id: clientId, type: 'call', notes: 'Discussed new IPO opportunity', outcome: 'interested', scheduled_at: null, completed_at: new Date().toISOString(), created_at: new Date().toISOString() },
                { id: 'f2', client_id: clientId, type: 'whatsapp', notes: 'Sent company details', outcome: 'callback', scheduled_at: null, completed_at: new Date(Date.now() - 86400000 * 2).toISOString(), created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
            ]);
        }
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const { error } = await supabase.from('agent_clients').insert({
            agent_id: user.id,
            ...newClient,
        });

        if (!error || user.id === 'agt_1') {
            if (user.id === 'agt_1') {
                setClients(prev => [{ ...newClient, id: `c_${Date.now()}`, tags: [], last_contacted_at: null, next_followup_at: null, total_invested: 0, total_orders: 0, created_at: new Date().toISOString() }, ...prev]);
            } else {
                fetchClients();
            }
            setNewClient({ name: '', email: '', phone: '', notes: '', status: 'prospect' });
            setShowAddModal(false);
        } else {
            alert('Failed to add client: ' + error.message);
        }
    };

    const handleAddFollowup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedClient) return;

        const payload = {
            agent_id: user.id,
            client_id: selectedClient.id,
            type: newFollowup.type,
            notes: newFollowup.notes,
            outcome: newFollowup.outcome || null,
            scheduled_at: newFollowup.scheduled_at || null,
            completed_at: newFollowup.outcome ? new Date().toISOString() : null,
        };

        const { error } = await supabase.from('agent_followups').insert(payload);

        if (!error || user.id === 'agt_1') {
            // Update last_contacted_at
            await supabase.from('agent_clients').update({ last_contacted_at: new Date().toISOString() }).eq('id', selectedClient.id);
            fetchFollowups(selectedClient.id);
            setNewFollowup({ type: 'call', notes: '', outcome: '', scheduled_at: '' });
            setShowFollowupForm(false);
        } else {
            alert('Failed to log follow-up: ' + error.message);
        }
    };

    const openClientDetail = (client: Client) => {
        setSelectedClient(client);
        fetchFollowups(client.id);
    };

    const filteredClients = clients.filter(c => {
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    const upcomingFollowups = clients.filter(c => c.next_followup_at && new Date(c.next_followup_at) <= new Date(Date.now() + 86400000 * 3));

    const outcomeColors: Record<string, string> = {
        interested: 'bg-green-50 text-green-700 border-green-200',
        converted: 'bg-blue-50 text-blue-700 border-blue-200',
        callback: 'bg-amber-50 text-amber-700 border-amber-200',
        not_interested: 'bg-red-50 text-red-700 border-red-200',
        no_response: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    if (loading) return <div className="text-center p-8 text-muted">Loading CRM...</div>;

    // Client Detail View
    if (selectedClient) {
        return (
            <div className="space-y-6">
                <button onClick={() => { setSelectedClient(null); setFollowups([]); }} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={16} /> Back to Clients
                </button>

                <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-surface/30">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{selectedClient.name}</h2>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted">
                                    {selectedClient.email && <span className="flex items-center gap-1"><Icon name="EnvelopeIcon" size={14} /> {selectedClient.email}</span>}
                                    {selectedClient.phone && <span className="flex items-center gap-1"><Icon name="PhoneIcon" size={14} /> {selectedClient.phone}</span>}
                                </div>
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${selectedClient.status === 'active' ? 'bg-green-50 text-green-700' : selectedClient.status === 'prospect' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                {selectedClient.status}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-border">
                        <div className="text-center p-3 bg-surface/50 rounded-xl">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Invested</p>
                            <p className="text-lg font-bold text-foreground mt-1">₹{selectedClient.total_invested.toLocaleString()}</p>
                        </div>
                        <div className="text-center p-3 bg-surface/50 rounded-xl">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Orders</p>
                            <p className="text-lg font-bold text-foreground mt-1">{selectedClient.total_orders}</p>
                        </div>
                        <div className="text-center p-3 bg-surface/50 rounded-xl">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Last Contact</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{selectedClient.last_contacted_at ? new Date(selectedClient.last_contacted_at).toLocaleDateString() : 'Never'}</p>
                        </div>
                        <div className="text-center p-3 bg-surface/50 rounded-xl">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Next Follow-up</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{selectedClient.next_followup_at ? new Date(selectedClient.next_followup_at).toLocaleDateString() : 'Not set'}</p>
                        </div>
                    </div>

                    {selectedClient.notes && (
                        <div className="px-6 py-4 border-b border-border">
                            <p className="text-xs font-bold text-muted uppercase mb-1">Notes</p>
                            <p className="text-sm text-foreground">{selectedClient.notes}</p>
                        </div>
                    )}
                </div>

                {/* Follow-ups */}
                <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-border bg-surface/30 flex items-center justify-between">
                        <h3 className="font-display font-bold text-lg">Follow-up History</h3>
                        <Button onClick={() => setShowFollowupForm(true)} className="bg-primary text-white text-sm">
                            <Icon name="PlusIcon" size={16} className="mr-1" /> Log Follow-up
                        </Button>
                    </div>

                    {showFollowupForm && (
                        <form onSubmit={handleAddFollowup} className="p-5 border-b border-border bg-blue-50/30 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase block mb-1">Type</label>
                                    <select value={newFollowup.type} onChange={e => setNewFollowup({ ...newFollowup, type: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                                        <option value="call">Phone Call</option>
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="email">Email</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase block mb-1">Outcome</label>
                                    <select value={newFollowup.outcome} onChange={e => setNewFollowup({ ...newFollowup, outcome: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                                        <option value="">Select...</option>
                                        <option value="interested">Interested</option>
                                        <option value="not_interested">Not Interested</option>
                                        <option value="callback">Callback Requested</option>
                                        <option value="converted">Converted</option>
                                        <option value="no_response">No Response</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase block mb-1">Notes</label>
                                <textarea value={newFollowup.notes} onChange={e => setNewFollowup({ ...newFollowup, notes: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm h-20 resize-none" placeholder="What was discussed?" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase block mb-1">Schedule Next Follow-up</label>
                                <Input type="datetime-local" value={newFollowup.scheduled_at} onChange={e => setNewFollowup({ ...newFollowup, scheduled_at: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowFollowupForm(false)}>Cancel</Button>
                                <Button type="submit" className="bg-primary text-white">Save Follow-up</Button>
                            </div>
                        </form>
                    )}

                    <div className="divide-y divide-border">
                        {followups.length === 0 ? (
                            <p className="p-8 text-center text-muted text-sm italic">No follow-ups logged yet.</p>
                        ) : followups.map(f => (
                            <div key={f.id} className="p-4 flex items-start gap-4 hover:bg-surface/30 transition-colors">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${f.type === 'call' ? 'bg-blue-50 text-blue-600' : f.type === 'whatsapp' ? 'bg-green-50 text-green-600' : f.type === 'email' ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-600'}`}>
                                    <Icon name={f.type === 'call' ? 'PhoneIcon' : f.type === 'whatsapp' ? 'ChatBubbleLeftIcon' : f.type === 'email' ? 'EnvelopeIcon' : f.type === 'meeting' ? 'UserGroupIcon' : 'EllipsisHorizontalIcon'} size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-foreground capitalize">{f.type}</span>
                                        {f.outcome && (
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${outcomeColors[f.outcome] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                {f.outcome.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                    {f.notes && <p className="text-sm text-muted mt-1">{f.notes}</p>}
                                    <p className="text-[10px] text-muted/60 mt-2">{new Date(f.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Clients</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{clients.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Active</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{clients.filter(c => c.status === 'active').length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Prospects</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{clients.filter(c => c.status === 'prospect').length}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 shadow-sm">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Follow-ups Due</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{upcomingFollowups.length}</p>
                </div>
            </div>

            {/* Upcoming Follow-ups Alert */}
            {upcomingFollowups.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
                        <Icon name="BellAlertIcon" size={16} /> Upcoming Follow-ups (Next 3 Days)
                    </h4>
                    <div className="space-y-2">
                        {upcomingFollowups.map(c => (
                            <button key={c.id} onClick={() => openClientDetail(c)} className="w-full text-left flex items-center justify-between bg-white/80 rounded-lg p-3 hover:bg-white transition-colors">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                                    <p className="text-xs text-muted">{c.phone}</p>
                                </div>
                                <span className="text-xs font-bold text-amber-600">{new Date(c.next_followup_at!).toLocaleDateString()}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Clients Table */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border bg-surface/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <h3 className="font-display font-bold text-lg">My Clients</h3>
                    <div className="flex items-center gap-3">
                        <Input placeholder="Search clients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-48 h-9 text-sm" />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm h-9">
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="prospect">Prospects</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <Button onClick={() => setShowAddModal(true)} className="bg-primary text-white text-sm h-9">
                            <Icon name="PlusIcon" size={16} className="mr-1" /> Add Client
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-surface/50">
                                <TableHead className="pl-6 font-semibold">Client</TableHead>
                                <TableHead className="font-semibold">Contact</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Invested</TableHead>
                                <TableHead className="font-semibold">Last Contact</TableHead>
                                <TableHead className="text-right pr-6 font-semibold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center p-8 text-muted italic">No clients found.</TableCell></TableRow>
                            ) : filteredClients.map(client => (
                                <TableRow key={client.id} className="hover:bg-surface/30 cursor-pointer" onClick={() => openClientDetail(client)}>
                                    <TableCell className="pl-6">
                                        <p className="font-bold text-foreground">{client.name}</p>
                                        {client.tags?.length > 0 && (
                                            <div className="flex gap-1 mt-1">{client.tags.map(t => <span key={t} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{t}</span>)}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-xs text-muted">{client.email}</p>
                                        <p className="text-xs text-muted">{client.phone}</p>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${client.status === 'active' ? 'bg-green-50 text-green-600 border border-green-200' : client.status === 'prospect' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>{client.status}</span>
                                    </TableCell>
                                    <TableCell className="font-semibold">₹{client.total_invested.toLocaleString()}</TableCell>
                                    <TableCell className="text-xs text-muted">{client.last_contacted_at ? new Date(client.last_contacted_at).toLocaleDateString() : 'Never'}</TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Icon name="ChevronRightIcon" size={16} className="text-muted" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Add Client Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-5 border-b border-border bg-surface/30 flex items-center justify-between">
                            <h3 className="font-display text-lg font-bold">Add New Client</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-foreground p-1.5 rounded-lg"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <form onSubmit={handleAddClient} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase block mb-1">Client Name *</label>
                                <Input required value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="Full name" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase block mb-1">Email</label>
                                    <Input type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} placeholder="email@example.com" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase block mb-1">Phone</label>
                                    <Input value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} placeholder="9876543210" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase block mb-1">Status</label>
                                <select value={newClient.status} onChange={e => setNewClient({ ...newClient, status: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                                    <option value="prospect">Prospect</option>
                                    <option value="active">Active</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase block mb-1">Notes</label>
                                <textarea value={newClient.notes} onChange={e => setNewClient({ ...newClient, notes: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm h-20 resize-none" placeholder="Investment preferences, risk appetite, etc." />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                <Button type="submit" className="bg-primary text-white">Add Client</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
