'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';

// Simulated document data from orders/leads/demat
interface DocEntry {
    id: string;
    customerName: string;
    rmName: string;
    type: 'kyc' | 'payment_proof' | 'demat' | 'agreement';
    status: 'pending' | 'uploaded' | 'verified' | 'rejected';
    context: string;
    date: string;
}

export default function DocumentVault() {
    const { orders, leads, dematRequests, users } = useAppStore();
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [search, setSearch] = useState('');

    const getRmName = (id: string) => users.find(u => u.id === id)?.name || id;
    const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;

    // Build document entries from various sources
    const docs: DocEntry[] = [
        ...leads.map(l => ({
            id: `doc_kyc_${l.id}`,
            customerName: l.name,
            rmName: getRmName(l.assignedRmId),
            type: 'kyc' as const,
            status: l.kycStatus === 'verified' ? 'verified' as const : l.kycStatus === 'documents_uploaded' ? 'uploaded' as const : 'pending' as const,
            context: `KYC for lead ${l.name}`,
            date: l.createdAt,
        })),
        ...orders.filter(o => o.txProofUrl).map(o => ({
            id: `doc_pay_${o.id}`,
            customerName: getUserName(o.userId),
            rmName: getRmName(users.find(u => u.id === o.userId)?.assignedRmId || ''),
            type: 'payment_proof' as const,
            status: 'uploaded' as const,
            context: `Payment proof for ${o.companyName} (${o.type})`,
            date: o.createdAt,
        })),
        ...dematRequests.map(d => ({
            id: `doc_demat_${d.id}`,
            customerName: getUserName(d.userId),
            rmName: '',
            type: 'demat' as const,
            status: d.status === 'completed' ? 'verified' as const : d.status === 'under_process' ? 'uploaded' as const : 'pending' as const,
            context: `Demat: ${d.companyName} — Folio: ${d.folioNumber}`,
            date: d.createdAt,
        })),
    ];

    const filtered = docs
        .filter(d => filterType === 'all' || d.type === filterType)
        .filter(d => filterStatus === 'all' || d.status === filterStatus)
        .filter(d => !search || d.customerName.toLowerCase().includes(search.toLowerCase()) || d.context.toLowerCase().includes(search.toLowerCase()));

    const statusColors: Record<string, string> = {
        pending: 'bg-amber-50 text-amber-600',
        uploaded: 'bg-blue-50 text-blue-600',
        verified: 'bg-green-50 text-green-600',
        rejected: 'bg-red-50 text-red-600',
    };

    const typeIcons: Record<string, string> = {
        kyc: 'IdentificationIcon',
        payment_proof: 'BanknotesIcon',
        demat: 'DocumentArrowUpIcon',
        agreement: 'DocumentTextIcon',
    };

    const pendingCount = docs.filter(d => d.status === 'pending').length;
    const uploadedCount = docs.filter(d => d.status === 'uploaded').length;
    const verifiedCount = docs.filter(d => d.status === 'verified').length;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Icon name="ClockIcon" size={20} className="text-amber-600" /></div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                                <p className="text-xs text-muted font-medium uppercase tracking-wider">Pending Docs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Icon name="ArrowUpTrayIcon" size={20} className="text-blue-600" /></div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{uploadedCount}</p>
                                <p className="text-xs text-muted font-medium uppercase tracking-wider">Uploaded</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-border shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><Icon name="CheckBadgeIcon" size={20} className="text-green-600" /></div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{verifiedCount}</p>
                                <p className="text-xs text-muted font-medium uppercase tracking-wider">Verified</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border/50 bg-white">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div>
                            <CardTitle className="font-display font-medium text-lg">Document Vault</CardTitle>
                            <CardDescription className="text-muted">Centralized view of all KYC, payment, and demat documents.</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <input className="border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary bg-surface/50"
                                placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                            <select className="text-xs bg-surface border border-border rounded-lg px-2 py-1.5 outline-none"
                                value={filterType} onChange={e => setFilterType(e.target.value)}>
                                <option value="all">All Types</option>
                                <option value="kyc">KYC</option>
                                <option value="payment_proof">Payment Proof</option>
                                <option value="demat">Demat</option>
                            </select>
                            <select className="text-xs bg-surface border border-border rounded-lg px-2 py-1.5 outline-none"
                                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="uploaded">Uploaded</option>
                                <option value="verified">Verified</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 bg-white">
                    {filtered.length === 0 ? (
                        <div className="p-8 text-center text-muted">No documents match your filters.</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filtered.map(doc => (
                                <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface/30">
                                    <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-border">
                                        <Icon name={typeIcons[doc.type]} size={16} className="text-muted" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-medium text-foreground">{doc.customerName}</p>
                                            <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded border border-border uppercase">{doc.type.replace('_', ' ')}</span>
                                        </div>
                                        <p className="text-xs text-muted truncate">{doc.context}</p>
                                    </div>
                                    {doc.rmName && <span className="text-xs text-muted shrink-0">{doc.rmName}</span>}
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${statusColors[doc.status]}`}>
                                        {doc.status}
                                    </span>
                                    <span className="text-[10px] text-muted shrink-0">{new Date(doc.date).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
