'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAppStore, OrderStatus, User, ExtendedOrder } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { uploadPaymentProof } from '@/lib/upload';
import { logAudit } from '@/lib/audit';
import RmEscalationView from '@/components/manager/RmEscalationView';
import ProfileTab from '@/components/shared/ProfileTab';

export default function SalesDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        }>
            <SalesDashboardContent />
        </Suspense>
    );
}

function SalesDashboardContent() {
    const { orders, leads, updateOrderStatus, addOrderNote, addLeadNote, updateLead, users } = useAppStore();
    const { user: authUser } = useAuth();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'orders' | 'leads' | 'clients' | 'escalations' | 'profile'>('leads');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'orders' || tab === 'leads' || tab === 'clients' || tab === 'escalations' || tab === 'profile') {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Search & Filter
    const [dealSearch, setDealSearch] = useState('');
    const [dealFilter, setDealFilter] = useState<OrderStatus | 'all'>('all');

    // Messaging & Notes logic
    const [messagingEntity, setMessagingEntity] = useState<{ id: string, name: string, type: 'order' | 'lead' } | null>(null);
    const [messageText, setMessageText] = useState('');
    const [noteEntity, setNoteEntity] = useState<{ id: string, name: string, type: 'order' | 'lead' } | null>(null);
    const [noteText, setNoteText] = useState('');
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    // Selected Deal for details
    const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

    // Upload Proof logic
    const [uploadOrderId, setUploadOrderId] = useState<string | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const getUserName = (id: string) => {
        const u = users.find(user => user.id === id);
        if (u) return u.name;
        const l = leads.find(lead => lead.id === id);
        return l ? l.name : id;
    };

    const handleMessage = (id: string, name: string, type: 'order' | 'lead') => {
        setMessagingEntity({ id, name, type });
    };

    const sendMessage = () => {
        if (!messageText.trim() || !messagingEntity) return;
        const note = `[Message Sent]: ${messageText}`;
        if (messagingEntity.type === 'order') {
            addOrderNote(messagingEntity.id, note);
        } else {
            addLeadNote(messagingEntity.id, note);
        }
        setMessagingEntity(null);
        setMessageText('');
    };

    const handleAddNote = () => {
        if (!noteText.trim() || !noteEntity) return;
        if (noteEntity.type === 'order') {
            addOrderNote(noteEntity.id, noteText);
        } else {
            addLeadNote(noteEntity.id, noteText);
        }
        setNoteEntity(null);
        setNoteText('');
    };

    const generateKycLink = (lead: any) => {
        const token = Math.random().toString(36).substring(2, 12);
        const link = `${window.location.origin}/kyc/${token}`;

        // Save token to lead state
        updateLead({
            ...lead,
            onboardingToken: token,
            status: 'kyc_pending',
            kycStatus: lead.kycStatus === 'pending' ? 'pending' : lead.kycStatus
        });

        setGeneratedLink(link);
    };

    const handleUploadProofSubmit = async () => {
        if (!uploadOrderId || !uploadFile) return;
        setUploading(true);
        try {
            const storagePath = await uploadPaymentProof(uploadFile, uploadOrderId);
            if (storagePath) {
                updateOrderStatus(uploadOrderId, 'under_process', null, storagePath);
                addOrderNote(uploadOrderId, `Payment proof uploaded: ${uploadFile.name}`);
                logAudit({
                    entityType: 'order',
                    entityId: uploadOrderId,
                    action: 'file_uploaded',
                    newValue: storagePath,
                    performedByName: authUser?.name || 'RM',
                    performedByRole: 'rm',
                    metadata: { fileName: uploadFile.name }
                });
            } else {
                addOrderNote(uploadOrderId, 'Payment proof upload failed — please retry.');
            }
        } finally {
            setUploading(false);
            setUploadFile(null);
            setUploadOrderId(null);
        }
    };

    const myOrders = orders.filter(o => {
        const client = users.find(u => u.id === o.userId);
        return client?.assignedRmId === authUser?.id || o.userId === authUser?.id;
    });

    const filteredOrders = myOrders.filter(o => {
        const matchesSearch = getUserName(o.userId).toLowerCase().includes(dealSearch.toLowerCase()) ||
            o.companyName.toLowerCase().includes(dealSearch.toLowerCase()) ||
            o.id.toLowerCase().includes(dealSearch.toLowerCase());
        const matchesFilter = dealFilter === 'all' || o.status === dealFilter;
        return matchesSearch && matchesFilter;
    });

    const myLeads = leads.filter(l => {
        const matchesRM = l.assignedRmId === authUser?.id;
        const matchesSearch = l.name.toLowerCase().includes(dealSearch.toLowerCase()) ||
            l.email.toLowerCase().includes(dealSearch.toLowerCase()) ||
            l.phone.includes(dealSearch);
        return matchesRM && matchesSearch;
    });

    const requestedCount = myOrders.filter(o => o.status === 'requested').length;
    const underProcessCount = myOrders.filter(o => o.status === 'under_process' || o.status === 'mail_sent').length;
    const settledCount = myOrders.filter(o => o.status === 'in_holding').length;

    const selectedDeal = myOrders.find(o => o.id === selectedDealId);

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 relative max-w-6xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-display font-light tracking-tight text-foreground">RM Workspace</h1>
                    <p className="text-muted mt-1">Manage leads, track onboarding, and raise transfer requests.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-border/50 mb-8 overflow-x-auto pb-px">
                <button
                    onClick={() => setActiveTab('leads')}
                    className={`px-4 py-3 text-sm font-semibold tracking-wide uppercase whitespace-nowrap border-b-2 transition-colors ${activeTab === 'leads' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                >
                    My Leads & Onboarding
                </button>
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`px-4 py-3 text-sm font-semibold tracking-wide uppercase whitespace-nowrap border-b-2 transition-colors ${activeTab === 'clients' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                >
                    My Clients
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-3 text-sm font-semibold tracking-wide uppercase whitespace-nowrap border-b-2 transition-colors ${activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                >
                    Order Pipeline
                </button>
                <button
                    onClick={() => setActiveTab('escalations')}
                    className={`px-4 py-3 text-sm font-semibold tracking-wide uppercase whitespace-nowrap border-b-2 transition-colors ${activeTab === 'escalations' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
                >
                    Escalations
                </button>
            </div>

            {activeTab === 'orders' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <Card className={`bg-white border-border shadow-sm group cursor-pointer transition-all ${dealFilter === 'requested' ? 'ring-2 ring-amber-500' : ''}`} onClick={() => setDealFilter(dealFilter === 'requested' ? 'all' : 'requested')}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
                                        <Icon name="DocumentDuplicateIcon" size={20} />
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-muted mb-1">Requested Transfers</p>
                                <h3 className="text-2xl font-bold text-foreground">{requestedCount}</h3>
                            </CardContent>
                        </Card>

                        <Card className={`bg-white border-border shadow-sm group cursor-pointer transition-all ${dealFilter === 'under_process' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setDealFilter(dealFilter === 'under_process' ? 'all' : 'under_process')}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                        <Icon name="PhoneIcon" size={20} />
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-muted mb-1">Under Process</p>
                                <h3 className="text-2xl font-bold text-foreground">{underProcessCount}</h3>
                            </CardContent>
                        </Card>

                        <Card className={`bg-white border-border shadow-sm group cursor-pointer transition-all ${dealFilter === 'in_holding' ? 'ring-2 ring-green-500' : ''}`} onClick={() => setDealFilter(dealFilter === 'in_holding' ? 'all' : 'in_holding')}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
                                        <Icon name="CheckBadgeIcon" size={20} />
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-muted mb-1">Holding (Settled)</p>
                                <h3 className="text-2xl font-bold text-foreground">{settledCount}</h3>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <Icon name="MagnifyingGlassIcon" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <Input
                                placeholder="Search client name, company or deal ID..."
                                className="pl-10 h-11 bg-white"
                                value={dealSearch}
                                onChange={(e) => setDealSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-11 px-4" onClick={() => { setDealSearch(''); setDealFilter('all'); }}>Reset</Button>
                    </div>

                    <Card className="border-border shadow-sm relative overflow-hidden">
                        <CardHeader className="border-b border-border/50 bg-white">
                            <CardTitle className="font-display font-medium text-lg">Assigned Deals</CardTitle>
                            <CardDescription className="text-muted">Raise transfer requests on behalf of clients by uploading payment proof.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="text-muted font-semibold pl-6">Customer</TableHead>
                                        <TableHead className="text-muted font-semibold">Company</TableHead>
                                        <TableHead className="text-muted font-semibold">Qty</TableHead>
                                        <TableHead className="text-muted font-semibold">Total Value</TableHead>
                                        <TableHead className="text-muted font-semibold">Status</TableHead>
                                        <TableHead className="text-right text-muted font-semibold pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center p-12 text-muted italic">No deals found matching your criteria.</TableCell>
                                        </TableRow>
                                    ) : filteredOrders.map(order => {
                                        return (
                                            <TableRow key={order.id} className="border-border hover:bg-surface/30 cursor-pointer" onClick={() => setSelectedDealId(order.id)}>
                                                <TableCell className="font-medium text-foreground pl-6">
                                                    <div>{getUserName(order.userId)}</div>
                                                    <div className="text-[10px] text-muted font-mono">{order.id}</div>
                                                </TableCell>
                                                <TableCell className="text-muted">{order.companyName}</TableCell>
                                                <TableCell className="font-medium">{order.quantity}</TableCell>
                                                <TableCell className="font-semibold">₹{(order.price * order.quantity).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${order.status === 'requested' ? 'bg-amber-50 text-amber-600' :
                                                        order.status === 'under_process' || order.status === 'mail_sent' ? 'bg-blue-50 text-blue-600' :
                                                            'bg-green-50 text-green-600'}`}>
                                                        {order.status.replace('_', ' ')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex gap-2 justify-end">
                                                        <Button variant="ghost" size="sm" className="h-8 text-primary font-semibold hover:bg-primary/5" onClick={() => handleMessage(order.id, `${getUserName(order.userId)}`, 'order')}>
                                                            Message
                                                        </Button>
                                                        {order.status === 'requested' && order.paymentMethod === 'rm_connect' && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="h-8 bg-primary text-white hover:bg-primary/90"
                                                                onClick={() => setUploadOrderId(order.id)}
                                                            >
                                                                Upload Proof
                                                            </Button>
                                                        )}
                                                        <Button variant="outline" size="sm" className="h-8 border-border" onClick={() => setSelectedDealId(order.id)}>
                                                            Details
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}

            {activeTab === 'leads' && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">My Pipeline & Leads</CardTitle>
                        <CardDescription className="text-muted">Track communication and KYC progress for your assigned leads.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 bg-white overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50 hover:bg-surface/50">
                                    <TableHead className="text-muted font-semibold pl-6">Client Name</TableHead>
                                    <TableHead className="text-muted font-semibold">Contact Details</TableHead>
                                    <TableHead className="text-muted font-semibold">Latest Update</TableHead>
                                    <TableHead className="text-muted font-semibold">KYC Tracker</TableHead>
                                    <TableHead className="text-right text-muted font-semibold pr-6">Next Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myLeads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center p-8 text-muted">No leads assigned currently.</TableCell>
                                    </TableRow>
                                ) : myLeads.map(lead => {
                                    const latestNote = lead.notes.length > 0 ? lead.notes[lead.notes.length - 1] : 'No notes added.';
                                    return (
                                        <TableRow key={lead.id} className="border-border hover:bg-surface/30 group">
                                            <TableCell className="font-medium text-foreground pl-6">{lead.name}</TableCell>
                                            <TableCell className="text-muted text-sm pb-1 pt-3">
                                                <div>{lead.email}</div>
                                                <div className="text-xs text-muted/70">{lead.phone}</div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted italic max-w-xs pr-6">
                                                "{latestNote}"
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${lead.kycStatus === 'verified' ? 'bg-green-50 text-green-600 border border-green-200' :
                                                    lead.kycStatus === 'documents_uploaded' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                                        'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                    {lead.kycStatus.replace('_', ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="ghost" size="sm" onClick={() => setNoteEntity({ id: lead.id, name: lead.name, type: 'lead' })} className="text-xs font-semibold text-primary hover:bg-primary/10">Add Note</Button>
                                                    <Button variant="outline" size="sm" onClick={() => generateKycLink(lead)} className="text-xs font-semibold">Send KYC Link</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'clients' && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">My Managed Clients</CardTitle>
                        <CardDescription className="text-muted">A list of all users who have successfully completed onboarding and hold shares.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 bg-white overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50 hover:bg-surface/50">
                                    <TableHead className="text-muted font-semibold pl-6">Client Name</TableHead>
                                    <TableHead className="text-muted font-semibold">Contact</TableHead>
                                    <TableHead className="text-muted font-semibold text-center">Active Deals</TableHead>
                                    <TableHead className="text-muted font-semibold text-right">Portfolio Value</TableHead>
                                    <TableHead className="text-muted font-semibold text-center">Status</TableHead>
                                    <TableHead className="text-right text-muted font-semibold pr-6">Management</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.filter(u => u.role === 'customer' && u.assignedRmId === authUser?.id).map(client => {
                                    const clientOrders = orders.filter(o => o.userId === client.id);
                                    const activeDeals = clientOrders.filter(o => o.status !== 'in_holding').length;
                                    const portfolioValue = clientOrders
                                        .filter(o => o.status === 'in_holding')
                                        .reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

                                    return (
                                        <TableRow key={client.id} className="border-border hover:bg-surface/30 group transition-colors">
                                            <TableCell className="font-medium text-foreground pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-xs border border-primary/10">
                                                        {client.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold">{client.name}</div>
                                                        <div className="text-[10px] text-muted font-mono">{client.id}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted text-xs">
                                                <div>{client.email}</div>
                                                <div className="opacity-70">+91 99880 11223</div>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {activeDeals > 0 ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100">
                                                        {activeDeals} Active
                                                    </span>
                                                ) : (
                                                    <span className="text-muted text-xs">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-700">
                                                ₹{portfolioValue.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    Verified
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-primary" onClick={() => handleMessage(client.id, client.name, 'lead')}>Message</Button>
                                                    <Button variant="outline" size="sm" className="h-8 text-xs font-semibold" onClick={() => { setActiveTab('orders'); setDealSearch(client.name); }}>View Orders</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Messaging Dialog */}
            {messagingEntity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-border bg-surface/30">
                            <h3 className="font-semibold text-foreground">Message to {messagingEntity.name}</h3>
                            <button onClick={() => setMessagingEntity(null)} className="text-muted hover:text-foreground"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <div className="p-6">
                            <textarea
                                className="w-full h-32 p-3 bg-slate-50 border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                                placeholder={`Type your message to the ${messagingEntity.type}...`}
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                            />
                            <p className="text-[10px] text-muted mt-2 uppercase tracking-tighter">This will be sent via WhatsApp/SMS platform integration.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-surface/30 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setMessagingEntity(null)}>Cancel</Button>
                            <Button variant="default" className="bg-primary hover:bg-primary/90 text-white" onClick={sendMessage}>Send Message</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Note Dialog */}
            {noteEntity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-border bg-surface/30">
                            <h3 className="font-semibold text-foreground">Add Note for {noteEntity.name}</h3>
                            <button onClick={() => setNoteEntity(null)} className="text-muted hover:text-foreground"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <div className="p-6">
                            <textarea
                                className="w-full h-32 p-3 bg-slate-50 border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                                placeholder="Internal progress note..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                            />
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-surface/30 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setNoteEntity(null)}>Cancel</Button>
                            <Button variant="default" className="bg-primary hover:bg-primary/90 text-white" onClick={handleAddNote}>Save Note</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Escalations Tab */}
            {activeTab === 'escalations' && (
                <RmEscalationView rmId={authUser?.id || ''} rmName={authUser?.name || ''} users={users} />
            )}

            {activeTab === 'profile' && <ProfileTab roleLabel="Relationship Manager" />}

            {/* Deal Detail Dialog */}
            {selectedDealId && selectedDeal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-border bg-surface/30">
                            <div>
                                <h3 className="font-semibold text-foreground">Deal Detail: {selectedDeal.id}</h3>
                                <p className="text-[10px] text-muted uppercase font-bold tracking-widest">{selectedDeal.companyName} • {selectedDeal.quantity} Shares</p>
                            </div>
                            <button onClick={() => setSelectedDealId(null)} className="text-muted hover:text-foreground"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <div className="p-0 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-6 border-r border-border/50">
                                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Transaction Info</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted">Customer</span>
                                            <span className="text-sm font-medium">{getUserName(selectedDeal.userId)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted">Total Value</span>
                                            <span className="text-sm font-bold text-primary">₹{selectedDeal.totalAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted">Payment Mode</span>
                                            <span className="text-sm font-medium capitalize">{selectedDeal.paymentMethod.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted">Created Date</span>
                                            <span className="text-sm font-medium">{new Date(selectedDeal.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {selectedDeal.txProofUrl && (
                                            <div className="mt-4 p-3 bg-slate-50 border border-border rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Icon name="DocumentIcon" size={16} className="text-blue-500" />
                                                    <span className="text-xs font-medium">Payment_Proof.pdf</span>
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold">VIEW</Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8">
                                        <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Update Status</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {['requested', 'under_process', 'mail_sent', 'in_holding'].map((status) => (
                                                <Button
                                                    key={status}
                                                    variant={selectedDeal.status === status ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="h-8 text-[10px] h-7 px-2 font-bold uppercase tracking-tight"
                                                    onClick={() => {
                                                        updateOrderStatus(selectedDeal.id, status as OrderStatus);
                                                        addOrderNote(selectedDeal.id, `Status updated to ${status.replace('_', ' ')}`);
                                                    }}
                                                >
                                                    {status.replace('_', ' ')}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50/50 flex flex-col h-full">
                                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Internal Notes</h4>
                                    <div className="flex-1 space-y-3 mb-4 max-h-[200px] overflow-y-auto pr-2">
                                        {selectedDeal.notes && selectedDeal.notes.length > 0 ? (
                                            selectedDeal.notes.map((note, idx) => (
                                                <div key={idx} className="p-2.5 bg-white border border-border rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                                                    <p className="text-xs text-foreground leading-relaxed">{note}</p>
                                                    <div className="text-[9px] text-muted mt-1 uppercase font-semibold">Today • RM Workspace</div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted italic">No internal notes for this deal yet.</p>
                                        )}
                                    </div>
                                    <div className="mt-auto">
                                        <div className="relative">
                                            <textarea
                                                className="w-full p-2.5 bg-white border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
                                                placeholder="Add a quick note..."
                                                rows={2}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        if (e.currentTarget.value.trim()) {
                                                            addOrderNote(selectedDeal.id, e.currentTarget.value.trim());
                                                            e.currentTarget.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <div className="absolute right-2 bottom-2 text-[8px] text-muted uppercase font-bold">Press Enter</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-surface/30 flex justify-between items-center">
                            <Button variant="ghost" className="text-xs text-red-500 hover:bg-red-50" onClick={() => setSelectedDealId(null)}>Cancel Deal</Button>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setSelectedDealId(null)}>Close</Button>
                                <Button variant="default" className="bg-primary hover:bg-primary/90 text-white" onClick={() => handleMessage(selectedDeal.id, getUserName(selectedDeal.userId), 'order')}>Message Client</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Proof dialog */}
            {uploadOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-border bg-surface/30">
                            <h3 className="font-semibold text-foreground">Upload Payment Proof</h3>
                            <button onClick={() => setUploadOrderId(null)} className="text-muted hover:text-foreground hover:bg-surface p-1 rounded transition-colors"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-muted mb-4 block">Please upload the RTGS/NEFT proof provided by the customer.</p>
                            <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                className="cursor-pointer"
                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            />
                            {uploadFile && (
                                <p className="text-xs text-muted mt-2">Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(0)} KB)</p>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-surface/30 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setUploadOrderId(null); setUploadFile(null); }}>Cancel</Button>
                            <Button
                                variant="default"
                                className="bg-primary hover:bg-primary/90 text-white"
                                onClick={handleUploadProofSubmit}
                                disabled={!uploadFile || uploading}
                            >
                                {uploading ? 'Uploading...' : 'Raise Transfer Request'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* KYC Link Toast simulation */}
            {generatedLink && (
                <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-full duration-300">
                    <div className="bg-indigo-600 text-white px-6 py-4 rounded-xl shadow-2xl max-w-sm border border-indigo-500/50 backdrop-blur-md">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white/20 rounded-lg"><Icon name="LinkIcon" size={20} /></div>
                            <div>
                                <h4 className="font-bold text-sm">KYC Link Generated!</h4>
                                <p className="text-xs text-blue-100/80 mb-3 leading-relaxed">Send this unique link to Rahul Verma to complete their onboarding.</p>
                                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg mb-3">
                                    <code className="text-[10px] truncate flex-1 opacity-90">{generatedLink}</code>
                                    <button onClick={() => { navigator.clipboard.writeText(generatedLink); alert('Copied!'); }} className="text-[10px] font-bold uppercase hover:bg-white/20 px-2 py-1 rounded transition-colors">Copy</button>
                                </div>
                                <Button size="sm" variant="outline" className="w-full bg-white text-indigo-600 border-white hover:bg-indigo-50 h-8 font-bold text-[10px]" onClick={() => setGeneratedLink(null)}>DONE</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
