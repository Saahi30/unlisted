'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';

interface CustomerKycRecord {
    id: string;
    user_id: string;
    pan_number: string;
    aadhar_number: string;
    bank_details: any;
    demat_details: any;
    cmr_url: string;
    cmr_status: string;
    kyc_status: string;
    submitted_at: string;
    rejection_reason?: string;
}

export default function CustomerKycTab() {
    const { users } = useAppStore();
    const [kycRecords, setKycRecords] = useState<CustomerKycRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | string>('all');

    useEffect(() => {
        const fetchKyc = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('customer_kyc').select('*').order('submitted_at', { ascending: false });
            if (data) setKycRecords(data);
            setLoading(false);
        };
        fetchKyc();
    }, []);

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || userId;
    const getUserEmail = (userId: string) => users.find(u => u.id === userId)?.email || '';

    const handleApprove = async (id: string) => {
        const supabase = createClient();
        await supabase.from('customer_kyc').update({ kyc_status: 'approved', verified_at: new Date().toISOString() }).eq('id', id);
        setKycRecords(prev => prev.map(r => r.id === id ? { ...r, kyc_status: 'approved' } : r));
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Rejection reason:');
        if (!reason) return;
        const supabase = createClient();
        await supabase.from('customer_kyc').update({ kyc_status: 'rejected', rejection_reason: reason }).eq('id', id);
        setKycRecords(prev => prev.map(r => r.id === id ? { ...r, kyc_status: 'rejected', rejection_reason: reason } : r));
    };

    const filtered = kycRecords.filter(r => {
        const name = getUserName(r.user_id).toLowerCase();
        const matchesSearch = name.includes(searchQuery.toLowerCase()) || r.pan_number?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || r.kyc_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return <div className="flex justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
    }

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                <div>
                    <CardTitle className="font-display font-medium text-lg">Customer KYC Review</CardTitle>
                    <CardDescription className="text-muted">Review and approve customer identity verification documents.</CardDescription>
                </div>
            </CardHeader>
            <div className="p-4 border-b border-border bg-surface/20 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                    <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <Input placeholder="Search by name or PAN..." className="pl-10 h-10 border-border bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <select className="h-10 px-3 bg-white border border-border rounded-lg text-xs font-semibold focus:ring-1 focus:ring-primary outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">ALL STATUS</option>
                    <option value="pending">PENDING</option>
                    <option value="approved">APPROVED</option>
                    <option value="rejected">REJECTED</option>
                </select>
            </div>
            <CardContent className="p-0 bg-white">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-surface/50 hover:bg-surface/50">
                                <TableHead className="text-muted font-semibold pl-6">Customer</TableHead>
                                <TableHead className="text-muted font-semibold">PAN</TableHead>
                                <TableHead className="text-muted font-semibold">Aadhar</TableHead>
                                <TableHead className="text-muted font-semibold">CMR</TableHead>
                                <TableHead className="text-center text-muted font-semibold">Status</TableHead>
                                <TableHead className="text-right text-muted font-semibold pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center p-8 text-muted italic">No KYC submissions found.</TableCell>
                                </TableRow>
                            ) : filtered.map(record => (
                                <TableRow key={record.id} className="border-border hover:bg-surface/30">
                                    <TableCell className="pl-6">
                                        <div className="font-medium text-foreground">{getUserName(record.user_id)}</div>
                                        <div className="text-xs text-muted">{getUserEmail(record.user_id)}</div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{record.pan_number || '-'}</TableCell>
                                    <TableCell className="font-mono text-xs">{record.aadhar_number ? `****${record.aadhar_number.slice(-4)}` : '-'}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                            record.cmr_status === 'verified' ? 'bg-green-50 text-green-600 border-green-200' :
                                            record.cmr_status === 'pending' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                            'bg-surface text-muted border-border'
                                        }`}>
                                            {record.cmr_status.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                                            record.kyc_status === 'approved' ? 'bg-green-50 text-green-600' :
                                            record.kyc_status === 'rejected' ? 'bg-red-50 text-red-600' :
                                            record.kyc_status === 'pending' ? 'bg-blue-50 text-blue-600' :
                                            'bg-surface text-muted'
                                        }`}>
                                            {record.kyc_status.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 whitespace-nowrap">
                                        {record.kyc_status === 'pending' && (
                                            <>
                                                <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50 text-[10px] font-bold uppercase tracking-widest mr-1" onClick={() => handleApprove(record.id)}>
                                                    Approve
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest" onClick={() => handleReject(record.id)}>
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
