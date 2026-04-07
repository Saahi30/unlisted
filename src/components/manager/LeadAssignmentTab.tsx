'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export default function LeadAssignmentTab() {
    const { leads, users, updateLead } = useAppStore();

    const rms = useMemo(() => users.filter(u => u.role === 'rm'), [users]);

    const [selectedRmMap, setSelectedRmMap] = useState<Record<string, string>>({});
    const [filterMode, setFilterMode] = useState<'all' | 'assigned' | 'unassigned'>('all');
    const [filterRmName, setFilterRmName] = useState('');
    const [checkedLeads, setCheckedLeads] = useState<Set<string>>(new Set());
    const [bulkRmId, setBulkRmId] = useState('');
    const [assigning, setAssigning] = useState<Record<string, boolean>>({});

    const getRmName = (rmId?: string) => {
        if (!rmId) return 'Unassigned';
        const rm = users.find(u => u.id === rmId);
        return rm ? rm.name : 'Unknown';
    };

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            if (filterMode === 'assigned' && !lead.assignedRmId) return false;
            if (filterMode === 'unassigned' && lead.assignedRmId) return false;
            if (filterRmName) {
                const rmName = getRmName(lead.assignedRmId).toLowerCase();
                if (!rmName.includes(filterRmName.toLowerCase())) return false;
            }
            return true;
        });
    }, [leads, filterMode, filterRmName, users]);

    const unassignedCount = leads.filter(l => !l.assignedRmId).length;
    const totalCount = leads.length;

    const handleAssign = async (leadId: string) => {
        const selectedRmId = selectedRmMap[leadId];
        if (!selectedRmId) return;

        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        const selectedRm = users.find(u => u.id === selectedRmId);
        if (!selectedRm) return;

        setAssigning(prev => ({ ...prev, [leadId]: true }));

        const updatedLead = { ...lead, assignedRmId: selectedRmId };
        updateLead(updatedLead);

        await supabase.from('audit_log').insert([{
            entity_type: 'lead',
            entity_id: lead.id,
            action: 'assignment',
            old_value: lead.assignedRmId || 'unassigned',
            new_value: selectedRmId,
            performed_by_name: 'Manager',
            performed_by_role: 'staffmanager',
            metadata: { lead_name: lead.name, rm_name: selectedRm.name }
        }]);

        setSelectedRmMap(prev => {
            const next = { ...prev };
            delete next[leadId];
            return next;
        });
        setAssigning(prev => ({ ...prev, [leadId]: false }));
    };

    const handleBulkAssign = async () => {
        if (!bulkRmId || checkedLeads.size === 0) return;

        const selectedRm = users.find(u => u.id === bulkRmId);
        if (!selectedRm) return;

        const leadIds = Array.from(checkedLeads);
        for (const leadId of leadIds) {
            const lead = leads.find(l => l.id === leadId);
            if (!lead) continue;

            const updatedLead = { ...lead, assignedRmId: bulkRmId };
            updateLead(updatedLead);

            await supabase.from('audit_log').insert([{
                entity_type: 'lead',
                entity_id: lead.id,
                action: 'assignment',
                old_value: lead.assignedRmId || 'unassigned',
                new_value: bulkRmId,
                performed_by_name: 'Manager',
                performed_by_role: 'staffmanager',
                metadata: { lead_name: lead.name, rm_name: selectedRm.name }
            }]);
        }

        setCheckedLeads(new Set());
        setBulkRmId('');
    };

    const toggleCheck = (leadId: string) => {
        setCheckedLeads(prev => {
            const next = new Set(prev);
            if (next.has(leadId)) next.delete(leadId);
            else next.add(leadId);
            return next;
        });
    };

    const toggleAll = () => {
        if (checkedLeads.size === filteredLeads.length) {
            setCheckedLeads(new Set());
        } else {
            setCheckedLeads(new Set(filteredLeads.map(l => l.id)));
        }
    };

    return (
        <div className="space-y-6">
            {/* Count Badges */}
            <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold">
                    <Icon name="ExclamationTriangleIcon" size={16} />
                    {unassignedCount} Unassigned
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface text-foreground border border-border text-sm font-semibold">
                    <Icon name="UsersIcon" size={16} />
                    {totalCount} Total Leads
                </span>
            </div>

            {/* Filters & Bulk Actions */}
            <Card className="bg-white border-border shadow-sm">
                <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex flex-wrap gap-2 items-center">
                            <select
                                className="text-sm bg-surface border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
                                value={filterMode}
                                onChange={e => setFilterMode(e.target.value as any)}
                            >
                                <option value="all">All Leads</option>
                                <option value="assigned">Assigned Only</option>
                                <option value="unassigned">Unassigned Only</option>
                            </select>
                            <input
                                className="text-sm border border-border rounded-lg bg-surface/50 px-3 py-2 outline-none focus:border-primary"
                                placeholder="Filter by RM name..."
                                value={filterRmName}
                                onChange={e => setFilterRmName(e.target.value)}
                            />
                        </div>
                        {checkedLeads.size > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted font-medium">{checkedLeads.size} selected</span>
                                <select
                                    className="text-sm bg-surface border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
                                    value={bulkRmId}
                                    onChange={e => setBulkRmId(e.target.value)}
                                >
                                    <option value="">Select RM...</option>
                                    {rms.map(rm => (
                                        <option key={rm.id} value={rm.id}>{rm.name}</option>
                                    ))}
                                </select>
                                <Button
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-widest"
                                    onClick={handleBulkAssign}
                                    disabled={!bulkRmId}
                                >
                                    Assign All
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Leads Table */}
            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-white">
                    <CardTitle className="font-display font-medium text-lg">Lead Assignment</CardTitle>
                    <CardDescription className="text-muted">Assign or reassign leads to relationship managers.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50 hover:bg-surface/50">
                                    <TableHead className="w-10 pl-6">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                            checked={checkedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                                            onChange={toggleAll}
                                        />
                                    </TableHead>
                                    <TableHead className="text-muted font-semibold">Lead Name</TableHead>
                                    <TableHead className="text-muted font-semibold">Contact</TableHead>
                                    <TableHead className="text-muted font-semibold">Company</TableHead>
                                    <TableHead className="text-center text-muted font-semibold">Status</TableHead>
                                    <TableHead className="text-muted font-semibold">Currently Assigned To</TableHead>
                                    <TableHead className="text-right text-muted font-semibold pr-6">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLeads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center p-12 text-muted">
                                            <Icon name="UserPlusIcon" size={32} className="mx-auto mb-3 text-muted/50" />
                                            <p>No leads match your filters.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLeads.map(lead => (
                                    <TableRow key={lead.id} className="border-border hover:bg-surface/30">
                                        <TableCell className="pl-6">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                                checked={checkedLeads.has(lead.id)}
                                                onChange={() => toggleCheck(lead.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">{lead.name}</TableCell>
                                        <TableCell className="text-muted text-sm">
                                            <div>{lead.email}</div>
                                            <div className="text-xs text-muted/70">{lead.phone}</div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">{lead.companyName}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                {lead.status.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-sm font-medium ${lead.assignedRmId ? 'text-foreground' : 'text-amber-600'}`}>
                                                {getRmName(lead.assignedRmId)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <select
                                                    className="text-xs bg-surface border border-border rounded px-2 py-1.5 outline-none focus:border-primary"
                                                    value={selectedRmMap[lead.id] || ''}
                                                    onChange={e => setSelectedRmMap(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                                >
                                                    <option value="">Select RM...</option>
                                                    {rms.map(rm => (
                                                        <option key={rm.id} value={rm.id}>{rm.name}</option>
                                                    ))}
                                                </select>
                                                <Button
                                                    size="sm"
                                                    className="bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-widest"
                                                    onClick={() => handleAssign(lead.id)}
                                                    disabled={!selectedRmMap[lead.id] || assigning[lead.id]}
                                                >
                                                    {assigning[lead.id] ? 'Assigning...' : 'Assign'}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
