'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { Lead } from '@/lib/mock-data';

export default function LeadManagementTab() {
    const { leads, users, companies, updateLead, addLeadNote } = useAppStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
    const [rmFilter, setRmFilter] = useState<'all' | string>('all');
    const [expandedLead, setExpandedLead] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const rms = users.filter(u => u.role === 'rm');

    const filteredLeads = leads.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.phone || '').includes(searchQuery);
        const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
        const matchesRm = rmFilter === 'all' || l.assignedRmId === rmFilter;
        return matchesSearch && matchesStatus && matchesRm;
    });

    const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
    const paginated = filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const statusCounts = {
        all: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        converted: leads.filter(l => l.status === 'converted').length,
        lost: leads.filter(l => l.status === 'lost').length,
    };

    const totalPipelineValue = filteredLeads.reduce((sum, l) => sum + (l.quantity * l.price), 0);
    const getRmName = (rmId?: string) => rmId ? (users.find(u => u.id === rmId)?.name || rmId.slice(0, 8)) : 'Unassigned';
    const getCompanyName = (companyId: string) => companies.find(c => c.id === companyId)?.name || companyId.slice(0, 8);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'contacted': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'qualified': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'converted': return 'bg-green-50 text-green-600 border-green-200';
            case 'lost': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const handleStatusChange = (lead: Lead, newStatus: string) => {
        updateLead({ ...lead, status: newStatus as any });
    };

    const handleAssignRm = (lead: Lead, rmId: string) => {
        updateLead({ ...lead, assignedRmId: rmId });
    };

    const handleAddNote = (leadId: string) => {
        if (!noteText.trim()) return;
        addLeadNote(leadId, `[${new Date().toLocaleString()}] ${noteText.trim()}`);
        setNoteText('');
    };

    return (
        <div className="space-y-6">
            {/* Pipeline Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                        key={status}
                        onClick={() => { setStatusFilter(status === 'all' ? 'all' : status); setPage(1); }}
                        className={`p-4 rounded-xl border transition-all text-left ${statusFilter === status ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-white hover:border-primary/30'}`}
                    >
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">{status}</div>
                        <div className="text-xl font-bold">{count}</div>
                    </button>
                ))}
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                    <div>
                        <CardTitle className="font-display font-medium text-lg">Lead Pipeline</CardTitle>
                        <CardDescription>{filteredLeads.length} leads | Pipeline Value: ₹{(totalPipelineValue / 100000).toFixed(1)}L</CardDescription>
                    </div>
                </CardHeader>
                <div className="p-4 border-b border-border bg-surface/20 flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1">
                        <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <Input placeholder="Search by name, email, or phone..." className="pl-10 h-10 border-border bg-white" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} />
                    </div>
                    <select className="h-10 px-3 bg-white border border-border rounded-lg text-xs font-semibold" value={rmFilter} onChange={e => { setRmFilter(e.target.value); setPage(1); }}>
                        <option value="all">ALL RMs</option>
                        {rms.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                    </select>
                </div>
                <CardContent className="p-0 bg-white">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50 hover:bg-surface/50">
                                    <TableHead className="pl-6 font-semibold">Lead</TableHead>
                                    <TableHead className="font-semibold">Company</TableHead>
                                    <TableHead className="font-semibold text-right">Qty</TableHead>
                                    <TableHead className="font-semibold text-right">Value</TableHead>
                                    <TableHead className="font-semibold">KYC</TableHead>
                                    <TableHead className="font-semibold">Assigned RM</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted italic">No leads match your filters.</TableCell></TableRow>
                                ) : paginated.map(lead => (
                                    <React.Fragment key={lead.id}>
                                        <TableRow className={`border-border hover:bg-surface/30 cursor-pointer ${expandedLead === lead.id ? 'bg-primary/5' : ''}`} onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}>
                                            <TableCell className="pl-6">
                                                <div className="font-medium text-sm">{lead.name}</div>
                                                <div className="text-xs text-muted">{lead.email}</div>
                                            </TableCell>
                                            <TableCell className="text-sm">{getCompanyName(lead.companyId)}</TableCell>
                                            <TableCell className="text-right font-medium">{lead.quantity}</TableCell>
                                            <TableCell className="text-right font-semibold">₹{(lead.quantity * lead.price).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${lead.kycStatus === 'verified' ? 'bg-green-50 text-green-600' : lead.kycStatus === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                                                    {lead.kycStatus || 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs">{getRmName(lead.assignedRmId)}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${getStatusColor(lead.status)}`}>
                                                    {lead.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Icon name="ChevronDownIcon" size={16} className={`text-muted transition-transform ${expandedLead === lead.id ? 'rotate-180' : ''}`} />
                                            </TableCell>
                                        </TableRow>
                                        {expandedLead === lead.id && (
                                            <TableRow className="bg-surface/20">
                                                <TableCell colSpan={8} className="p-0">
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Contact Info</h4>
                                                            <div className="text-sm space-y-1">
                                                                <div>Phone: <span className="font-medium">{lead.phone || 'N/A'}</span></div>
                                                                <div>Email: <span className="font-medium">{lead.email}</span></div>
                                                            </div>
                                                            <div className="pt-3 border-t border-border/50">
                                                                <label className="text-xs font-bold text-muted block mb-1">Change Status</label>
                                                                <select className="w-full h-8 px-2 bg-white border border-border rounded-lg text-xs" value={lead.status} onChange={e => { e.stopPropagation(); handleStatusChange(lead, e.target.value); }}>
                                                                    <option value="new">New</option>
                                                                    <option value="contacted">Contacted</option>
                                                                    <option value="qualified">Qualified</option>
                                                                    <option value="converted">Converted</option>
                                                                    <option value="lost">Lost</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Assign RM</h4>
                                                            <select className="w-full h-8 px-2 bg-white border border-border rounded-lg text-xs" value={lead.assignedRmId || ''} onChange={e => { e.stopPropagation(); handleAssignRm(lead, e.target.value); }}>
                                                                <option value="">Unassigned</option>
                                                                {rms.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Notes ({lead.notes.length})</h4>
                                                            <div className="max-h-32 overflow-y-auto space-y-2">
                                                                {lead.notes.length === 0 ? (
                                                                    <p className="text-xs text-muted italic">No notes.</p>
                                                                ) : lead.notes.map((note, i) => (
                                                                    <div key={i} className="text-xs p-2 bg-white rounded border border-border/50">{note}</div>
                                                                ))}
                                                            </div>
                                                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                                <Input placeholder="Add a note..." className="h-8 text-xs" value={expandedLead === lead.id ? noteText : ''} onChange={e => setNoteText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddNote(lead.id); }} />
                                                                <Button size="sm" className="h-8 text-xs" onClick={() => handleAddNote(lead.id)}>Add</Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface/20">
                            <span className="text-xs text-muted">{filteredLeads.length} leads</span>
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
