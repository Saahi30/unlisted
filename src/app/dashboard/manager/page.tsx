'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import RmPerformanceCharts from '@/components/manager/RmPerformanceCharts';
import ManagerTickets from '@/components/manager/ManagerTickets';
import RmActivityLog from '@/components/manager/RmActivityLog';
import CommissionTracker from '@/components/manager/CommissionTracker';
import ManagerBroadcast from '@/components/manager/ManagerBroadcast';
import ManagerReports from '@/components/manager/ManagerReports';
import Leaderboard from '@/components/manager/Leaderboard';
import PipelineForecast from '@/components/manager/PipelineForecast';
import ManagerCalendar from '@/components/manager/ManagerCalendar';
import AuditTrail from '@/components/manager/AuditTrail';
import AIDigest from '@/components/manager/AIDigest';
import GoalWizard from '@/components/manager/GoalWizard';
import RmOnboarding from '@/components/manager/RmOnboarding';
import DocumentVault from '@/components/manager/DocumentVault';

type ManagerTab = 'overview' | 'leads' | 'transactions' | 'demat' | 'tickets' | 'activity' | 'commissions' | 'broadcast' | 'reports' | 'leaderboard' | 'forecast' | 'calendar' | 'audit' | 'digest' | 'goals' | 'onboarding' | 'documents';

interface RMPerformance {
    id: string;
    name: string;
    assignedDeals: number;
    pendingDocs: number;
    settledDeals: number;
    volume: number;
    target: number;
}

const TAB_CONFIG: { id: ManagerTab; label: string; icon: string; section: 'core' | 'ops' | 'insights' | 'tools' }[] = [
    { id: 'overview', label: 'Team', icon: 'UserGroupIcon', section: 'core' },
    { id: 'transactions', label: 'Pipeline', icon: 'ChartBarIcon', section: 'core' },
    { id: 'leads', label: 'Leads', icon: 'UserPlusIcon', section: 'core' },
    { id: 'demat', label: 'Demat', icon: 'DocumentArrowUpIcon', section: 'core' },
    { id: 'tickets', label: 'Tickets', icon: 'TicketIcon', section: 'ops' },
    { id: 'activity', label: 'Activity', icon: 'ClockIcon', section: 'ops' },
    { id: 'commissions', label: 'Commissions', icon: 'BanknotesIcon', section: 'ops' },
    { id: 'broadcast', label: 'Broadcast', icon: 'MegaphoneIcon', section: 'ops' },
    { id: 'documents', label: 'Documents', icon: 'FolderOpenIcon', section: 'ops' },
    { id: 'leaderboard', label: 'Leaderboard', icon: 'TrophyIcon', section: 'insights' },
    { id: 'forecast', label: 'Forecast', icon: 'ArrowTrendingUpIcon', section: 'insights' },
    { id: 'digest', label: 'AI Digest', icon: 'SparklesIcon', section: 'insights' },
    { id: 'reports', label: 'Reports', icon: 'ArrowDownTrayIcon', section: 'insights' },
    { id: 'goals', label: 'OKRs', icon: 'FlagIcon', section: 'tools' },
    { id: 'calendar', label: 'Calendar', icon: 'CalendarDaysIcon', section: 'tools' },
    { id: 'onboarding', label: 'Onboarding', icon: 'AcademicCapIcon', section: 'tools' },
    { id: 'audit', label: 'Audit Log', icon: 'ShieldCheckIcon', section: 'tools' },
];

export default function ManagerDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        }>
            <ManagerDashboardContent />
        </Suspense>
    );
}

function ManagerDashboardContent() {
    const { orders, leads, updateOrderStatus, dematRequests, updateDematStatus, rmTargets, updateRmTarget, users, reassignLead, approveOrder, addAuditEntry } = useAppStore();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<ManagerTab>('overview');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && TAB_CONFIG.some(t => t.id === tab)) {
            setActiveTab(tab as ManagerTab);
        }
    }, [searchParams]);

    const rms = React.useMemo<RMPerformance[]>(() => {
        const salesStaff = users.filter(u => u.role === 'rm');
        return salesStaff.map(staff => {
            const assignedCustomers = users.filter(u => u.assignedRmId === staff.id).map(u => u.id);
            const rmOrders = orders.filter(o => assignedCustomers.includes(o.userId));
            const assignedDeals = rmOrders.length;
            const pendingDocs = rmOrders.filter(o => o.status === 'requested').length;
            const settledDeals = rmOrders.filter(o => o.status === 'in_holding').length;
            const volume = rmOrders.filter(o => o.status === 'in_holding').reduce((sum, o) => sum + (o.price * o.quantity), 0);
            return { id: staff.id, name: staff.name, assignedDeals, pendingDocs, settledDeals, volume, target: rmTargets[staff.id] || 0 };
        });
    }, [orders, rmTargets, users]);

    const [selectedRm, setSelectedRm] = useState<RMPerformance | null>(null);
    const [adjustTargetVal, setAdjustTargetVal] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterShare, setFilterShare] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null);
    const [deliveryDetails, setDeliveryDetails] = useState({ isin: '', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().split(' ')[0].substring(0, 5), declared: false });
    const [reassignModal, setReassignModal] = useState<{ leadId: string; currentRm: string } | null>(null);
    const [newRmId, setNewRmId] = useState('');
    const [bulkSelected, setBulkSelected] = useState<string[]>([]);
    const [bulkAction, setBulkAction] = useState<string>('');

    const totalVolume = rms.reduce((sum, rm) => sum + rm.volume, 0);
    const totalTarget = rms.reduce((sum, rm) => sum + rm.target, 0);
    const progressPercent = totalTarget > 0 ? (totalVolume / totalTarget) * 100 : 0;
    const formattedVolume = `₹${(totalVolume / 10000000).toFixed(2)} Cr`;
    const totalDeals = rms.reduce((sum, rm) => sum + rm.assignedDeals, 0);
    const avgDeals = rms.length > 0 ? Math.round(totalDeals / rms.length) : 0;

    const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    const handleViewDetails = (rm: RMPerformance) => { setSelectedRm(rm); setAdjustTargetVal(rm.target.toString()); };

    const saveTarget = () => {
        if (!selectedRm) return;
        const newTarget = parseInt(adjustTargetVal, 10);
        if (!isNaN(newTarget) && newTarget > 0) {
            updateRmTarget(selectedRm.id, newTarget);
            addAuditEntry({ id: `aud_${Date.now()}`, userId: 'mgr_1', userName: 'Sales Director', action: 'Updated RM Target', target: selectedRm.name, details: `Changed target to ${formatINR(newTarget)}`, timestamp: new Date().toISOString() });
        }
        setSelectedRm(null);
    };

    const getUserName = (userId: string) => {
        const u = users.find(user => user.id === userId);
        if (u) return u.name;
        const lead = leads.find(l => l.id === userId);
        return lead ? lead.name : userId;
    };

    const filteredOrders = orders.filter(o => {
        const userName = getUserName(o.userId).toLowerCase();
        const shareName = o.companyName.toLowerCase();
        const dateMatch = filterDate ? o.createdAt.includes(filterDate) : true;
        return userName.includes(filterCustomer.toLowerCase()) && shareName.includes(filterShare.toLowerCase()) && dateMatch;
    });

    const handlePromoteToMailSent = () => {
        if (!deliveryOrderId || !deliveryDetails.declared) { if (!deliveryDetails.declared) alert('You must declare that the shares have been transferred.'); return; }
        updateOrderStatus(deliveryOrderId, 'mail_sent', deliveryDetails);
        setDeliveryOrderId(null);
        setDeliveryDetails({ isin: '', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().split(' ')[0].substring(0, 5), declared: false });
    };

    const handleReassign = () => {
        if (!reassignModal || !newRmId) return;
        reassignLead(reassignModal.leadId, newRmId);
        const lead = leads.find(l => l.id === reassignModal.leadId);
        addAuditEntry({ id: `aud_${Date.now()}`, userId: 'mgr_1', userName: 'Sales Director', action: 'Reassigned Lead', target: lead?.name || reassignModal.leadId, details: `Moved to ${users.find(u => u.id === newRmId)?.name || newRmId}`, timestamp: new Date().toISOString() });
        setReassignModal(null);
        setNewRmId('');
    };

    const handleApproveOrder = (orderId: string) => {
        approveOrder(orderId);
        addAuditEntry({ id: `aud_${Date.now()}`, userId: 'mgr_1', userName: 'Sales Director', action: 'Approved Order', target: orderId, details: `Order approved and moved to Under Process`, timestamp: new Date().toISOString() });
    };

    const handleBulkAction = () => {
        if (bulkSelected.length === 0 || !bulkAction) return;
        bulkSelected.forEach(id => {
            if (bulkAction === 'approve') approveOrder(id);
            else if (bulkAction === 'under_process') updateOrderStatus(id, 'under_process');
        });
        setBulkSelected([]);
        setBulkAction('');
    };

    const toggleBulkSelect = (id: string) => {
        setBulkSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const rmsList = users.filter(u => u.role === 'rm');

    // Section labels
    const sections = { core: 'Core', ops: 'Operations', insights: 'Insights', tools: 'Tools' };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Sales Leadership</h1>
                    <p className="text-muted mt-1">Comprehensive team management, pipeline control, and operational tools.</p>
                </div>
            </div>

            {/* Tab Navigation - Grouped */}
            <div className="mb-8 border border-border rounded-xl bg-white overflow-hidden">
                {(['core', 'ops', 'insights', 'tools'] as const).map(section => {
                    const sectionTabs = TAB_CONFIG.filter(t => t.section === section);
                    return (
                        <div key={section} className="flex items-center border-b border-border/50 last:border-b-0">
                            <div className="px-4 py-2 bg-surface/50 border-r border-border/50 min-w-[80px]">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted">{sections[section]}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 px-2 py-1.5">
                                {sectionTabs.map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-muted hover:text-foreground hover:bg-surface'
                                        }`}>
                                        <Icon name={tab.icon} size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ========== TEAM PERFORMANCE ========== */}
            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <Card className="bg-white border-border shadow-sm">
                            <CardHeader className="pb-2 border-b border-border/50">
                                <CardTitle className="text-sm text-muted font-semibold tracking-wide uppercase flex items-center">
                                    <Icon name="ChartBarIcon" size={16} className="mr-2" /> Monthly Volume
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold text-foreground">{formattedVolume} <span className="text-sm font-medium text-muted line-through ml-2">{formatINR(totalTarget)} Target</span></div>
                                <div className="mt-6 h-2 w-full bg-surface rounded-full overflow-hidden flex relative">
                                    <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${Math.min(100, progressPercent)}%` }}></div>
                                </div>
                                <div className="flex text-xs text-muted mt-4 gap-6 font-medium uppercase tracking-wider">
                                    <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-accent mr-2" /> Settled Vol</div>
                                    <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-surface border border-border mr-2" /> Remaining</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-border shadow-sm">
                            <CardHeader className="pb-2 border-b border-border/50">
                                <CardTitle className="text-sm text-muted font-semibold tracking-wide uppercase flex items-center">
                                    <Icon name="UserGroupIcon" size={16} className="mr-2" /> Active Relationship Managers
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold text-foreground">{rms.length}</div>
                                <div className="text-xs text-muted mt-2 font-medium bg-surface inline-block px-3 py-1 rounded-md border border-border">Avg {avgDeals} deals per RM</div>
                            </CardContent>
                        </Card>
                    </div>
                    <RmPerformanceCharts rms={rms} />
                    <Card className="border-border shadow-sm mt-6">
                        <CardHeader className="border-b border-border/50 bg-white">
                            <CardTitle className="font-display text-lg font-medium">Team Performance</CardTitle>
                            <CardDescription className="text-muted">Track deal assignment and settlement ratios per RM.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 bg-white overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-surface/50 hover:bg-surface/50">
                                            <TableHead className="text-muted font-semibold pl-6">RM Name</TableHead>
                                            <TableHead className="text-center text-muted font-semibold">Assigned</TableHead>
                                            <TableHead className="text-center text-muted font-semibold">Pending</TableHead>
                                            <TableHead className="text-center text-muted font-semibold">Settled</TableHead>
                                            <TableHead className="text-right text-muted font-semibold">Volume</TableHead>
                                            <TableHead className="text-center text-muted font-semibold">Goal</TableHead>
                                            <TableHead className="pr-6"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rms.map(rm => {
                                            const percent = rm.target > 0 ? Math.min(100, (rm.volume / rm.target) * 100) : 0;
                                            return (
                                                <TableRow key={rm.id} className="border-border hover:bg-surface/30">
                                                    <TableCell className="font-medium text-foreground pl-6">{rm.name}</TableCell>
                                                    <TableCell className="text-center font-medium">{rm.assignedDeals}</TableCell>
                                                    <TableCell className="text-center"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">{rm.pendingDocs}</span></TableCell>
                                                    <TableCell className="text-center"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-600 border border-green-100">{rm.settledDeals}</span></TableCell>
                                                    <TableCell className="text-right font-semibold">{formatINR(rm.volume)}</TableCell>
                                                    <TableCell className="text-center text-muted text-xs font-medium">
                                                        <div className="w-16 h-1.5 bg-surface rounded-full mx-auto mb-1 border border-border/50 overflow-hidden"><div className="h-full bg-accent" style={{ width: `${percent}%` }}></div></div>
                                                        {percent.toFixed(0)}%
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 text-xs uppercase tracking-widest font-bold" onClick={() => handleViewDetails(rm)}>Details</Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* ========== LEADS (with reassignment) ========== */}
            {activeTab === 'leads' && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Lead Management</CardTitle>
                        <CardDescription className="text-muted">Monitor sign-ups, KYC progression, RM notes, and reassign leads.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="text-muted font-semibold pl-6">Lead Name</TableHead>
                                        <TableHead className="text-muted font-semibold">Contact</TableHead>
                                        <TableHead className="text-muted font-semibold">Status</TableHead>
                                        <TableHead className="text-muted font-semibold">Source</TableHead>
                                        <TableHead className="text-muted font-semibold">Assigned To</TableHead>
                                        <TableHead className="text-muted font-semibold">Latest Note</TableHead>
                                        <TableHead className="pr-6"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leads.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} className="text-center p-8 text-muted">No leads available</TableCell></TableRow>
                                    ) : leads.map(lead => {
                                        const rmName = getUserName(lead.assignedRmId);
                                        const latestNote = lead.notes.length > 0 ? lead.notes[lead.notes.length - 1] : 'No notes yet';
                                        const daysSinceCreated = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000);
                                        return (
                                            <TableRow key={lead.id} className="border-border hover:bg-surface/30">
                                                <TableCell className="font-medium text-foreground pl-6">
                                                    {lead.name}
                                                    {lead.status === 'new' && daysSinceCreated > 3 && (
                                                        <span className="block text-[9px] text-red-500 font-semibold mt-0.5">Stale — {daysSinceCreated}d untouched</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted text-sm">
                                                    <div>{lead.email}</div>
                                                    <div className="text-xs text-muted/70">{lead.phone}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">{lead.status.replace('_', ' ')}</span>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted">
                                                    {lead.companyName ? <span className="bg-surface px-2 py-0.5 rounded border border-border text-[10px]">{lead.companyName}</span> : <span className="text-muted/50">Direct</span>}
                                                </TableCell>
                                                <TableCell className="text-muted font-medium text-sm">{rmName}</TableCell>
                                                <TableCell className="text-xs text-muted pr-2 italic max-w-[200px] truncate">"{latestNote}"</TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button variant="ghost" size="sm" className="text-xs text-primary font-bold uppercase tracking-widest"
                                                        onClick={() => setReassignModal({ leadId: lead.id, currentRm: lead.assignedRmId })}>
                                                        Reassign
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ========== ORDERS (with approval + bulk actions) ========== */}
            {activeTab === 'transactions' && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                                <CardTitle className="font-display font-medium text-lg">Platform Transactions</CardTitle>
                                <CardDescription className="text-muted">Approve, fulfill, and bulk-manage orders.</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm items-center">
                                {bulkSelected.length > 0 && (
                                    <div className="flex items-center gap-2 mr-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20">
                                        <span className="text-xs font-semibold text-primary">{bulkSelected.length} selected</span>
                                        <select className="text-xs border border-border rounded px-2 py-1 bg-white outline-none" value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
                                            <option value="">Action...</option>
                                            <option value="approve">Approve All</option>
                                            <option value="under_process">Move to Under Process</option>
                                        </select>
                                        <Button size="sm" className="text-xs bg-primary text-white h-7" onClick={handleBulkAction} disabled={!bulkAction}>Apply</Button>
                                        <button className="text-xs text-muted" onClick={() => setBulkSelected([])}>Clear</button>
                                    </div>
                                )}
                                <input className="border border-border rounded-lg bg-surface/50 px-3 py-1.5 focus:outline-none focus:border-primary" placeholder="Customer..." value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} />
                                <input className="border border-border rounded-lg bg-surface/50 px-3 py-1.5 focus:outline-none focus:border-primary" placeholder="Share..." value={filterShare} onChange={e => setFilterShare(e.target.value)} />
                                <input type="date" className="border border-border rounded-lg bg-surface/50 px-3 py-1.5 focus:outline-none focus:border-primary text-muted" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                                <Button variant="ghost" onClick={() => { setFilterCustomer(''); setFilterShare(''); setFilterDate(''); }} className="text-xs">Clear</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="w-10 pl-6"><input type="checkbox" className="rounded border-border" onChange={e => { if (e.target.checked) setBulkSelected(filteredOrders.map(o => o.id)); else setBulkSelected([]); }} checked={bulkSelected.length === filteredOrders.length && filteredOrders.length > 0} /></TableHead>
                                        <TableHead className="text-muted font-semibold">Date</TableHead>
                                        <TableHead className="text-muted font-semibold">Customer</TableHead>
                                        <TableHead className="text-muted font-semibold">Type</TableHead>
                                        <TableHead className="text-muted font-semibold">Asset</TableHead>
                                        <TableHead className="text-right text-muted font-semibold">Valuation</TableHead>
                                        <TableHead className="text-center text-muted font-semibold">Status</TableHead>
                                        <TableHead className="text-right text-muted font-semibold pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-center p-8 text-muted">No transactions match your filters.</TableCell></TableRow>
                                    ) : filteredOrders.map(order => {
                                        const isHighValue = order.quantity * order.price > 500000;
                                        return (
                                            <TableRow key={order.id} className={`border-border hover:bg-surface/30 ${isHighValue ? 'bg-amber-50/30' : ''}`}>
                                                <TableCell className="pl-6"><input type="checkbox" className="rounded border-border" checked={bulkSelected.includes(order.id)} onChange={() => toggleBulkSelect(order.id)} /></TableCell>
                                                <TableCell className="text-muted">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-medium text-foreground">
                                                    {getUserName(order.userId)}
                                                    {isHighValue && <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">High Value</span>}
                                                </TableCell>
                                                <TableCell><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${order.type === 'buy' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{order.type}</span></TableCell>
                                                <TableCell className="text-sm"><span className="font-semibold block">{order.companyName}</span><span className="text-xs text-muted">{order.quantity} Shares</span></TableCell>
                                                <TableCell className="text-right font-semibold">{formatINR(order.quantity * order.price)}</TableCell>
                                                <TableCell className="text-center"><span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${order.status === 'requested' ? 'bg-amber-50 text-amber-600' : order.status === 'under_process' || order.status === 'mail_sent' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{order.status.replace('_', ' ')}</span></TableCell>
                                                <TableCell className="text-right pr-6 space-x-1">
                                                    {order.status === 'requested' && (
                                                        <Button size="sm" className="text-xs font-bold bg-green-600 hover:bg-green-700 text-white h-7" onClick={() => handleApproveOrder(order.id)}>Approve</Button>
                                                    )}
                                                    {order.status === 'under_process' && (
                                                        <Button size="sm" className="text-xs font-bold bg-primary hover:bg-primary/90 text-white h-7" onClick={() => setDeliveryOrderId(order.id)}>Fulfill</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ========== DEMAT ========== */}
            {activeTab === 'demat' && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Demat Requests Tracker</CardTitle>
                        <CardDescription className="text-muted">Manage physical-to-digital share conversion requests.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-surface/50 hover:bg-surface/50">
                                        <TableHead className="text-muted font-semibold pl-6">Customer</TableHead>
                                        <TableHead className="text-muted font-semibold">Company</TableHead>
                                        <TableHead className="text-muted font-semibold">Quantity</TableHead>
                                        <TableHead className="text-muted font-semibold">Folio / Certificates</TableHead>
                                        <TableHead className="text-center text-muted font-semibold">Status</TableHead>
                                        <TableHead className="text-right text-muted font-semibold pr-6">Update</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dematRequests.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center p-12 text-muted">No demat requests yet.</TableCell></TableRow>
                                    ) : dematRequests.map(request => (
                                        <TableRow key={request.id} className="border-border hover:bg-surface/30">
                                            <TableCell className="font-medium text-foreground pl-6">{getUserName(request.userId)}</TableCell>
                                            <TableCell className="font-semibold">{request.companyName}</TableCell>
                                            <TableCell>{request.quantity}</TableCell>
                                            <TableCell className="text-xs text-muted"><div>Folio: {request.folioNumber}</div><div className="truncate max-w-[150px]">Certs: {request.certificateNumbers}</div></TableCell>
                                            <TableCell className="text-center"><span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase ${request.status === 'initiated' ? 'bg-amber-50 text-amber-600' : request.status === 'under_process' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{request.status.replace('_', ' ')}</span></TableCell>
                                            <TableCell className="text-right pr-6">
                                                <select className="text-xs bg-surface border border-border rounded px-2 py-1 outline-none" value={request.status} onChange={(e) => updateDematStatus(request.id, e.target.value as any)}>
                                                    <option value="initiated">Initiated</option>
                                                    <option value="under_process">Under Process</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ========== DELEGATED TABS ========== */}
            {activeTab === 'tickets' && <ManagerTickets />}
            {activeTab === 'activity' && <RmActivityLog />}
            {activeTab === 'commissions' && <CommissionTracker />}
            {activeTab === 'broadcast' && <ManagerBroadcast />}
            {activeTab === 'reports' && <ManagerReports />}
            {activeTab === 'leaderboard' && <Leaderboard />}
            {activeTab === 'forecast' && <PipelineForecast />}
            {activeTab === 'calendar' && <ManagerCalendar />}
            {activeTab === 'audit' && <AuditTrail />}
            {activeTab === 'digest' && <AIDigest />}
            {activeTab === 'goals' && <GoalWizard />}
            {activeTab === 'onboarding' && <RmOnboarding />}
            {activeTab === 'documents' && <DocumentVault />}

            {/* ========== MODALS ========== */}

            {/* Delivery Confirmation Modal */}
            {deliveryOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-xl font-medium text-foreground">Transfer Shares Confirmation</h3>
                            <button onClick={() => setDeliveryOrderId(null)} className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-muted mb-4">Please ensure you have sent the necessary mails. Details logged here mark the transaction as 'mail_sent', transitioning to 'in_holding' automatically after 5 minutes.</p>
                            <div className="grid gap-4">
                                <div><label className="text-sm font-semibold text-foreground mb-1 block">Asset ISIN Code</label><Input type="text" placeholder="e.g. INE01O101011" value={deliveryDetails.isin} onChange={(e) => setDeliveryDetails({ ...deliveryDetails, isin: e.target.value })} className="h-10 border-border" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-sm font-semibold text-foreground mb-1 block">Transfer Date</label><Input type="date" value={deliveryDetails.date} onChange={(e) => setDeliveryDetails({ ...deliveryDetails, date: e.target.value })} className="h-10 border-border text-muted" /></div>
                                    <div><label className="text-sm font-semibold text-foreground mb-1 block">Transfer Time</label><Input type="time" value={deliveryDetails.time} onChange={(e) => setDeliveryDetails({ ...deliveryDetails, time: e.target.value })} className="h-10 border-border text-muted" /></div>
                                </div>
                                <div className="flex items-start gap-3 mt-4 bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
                                    <input type="checkbox" id="declare-transfer" className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={deliveryDetails.declared} onChange={(e) => setDeliveryDetails({ ...deliveryDetails, declared: e.target.checked })} />
                                    <label htmlFor="declare-transfer" className="text-sm text-foreground">I formally declare that I have executed the necessary email communications and external transfers to assign these shares definitively to the client's DEMAT.</label>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setDeliveryOrderId(null)}>Cancel</Button>
                            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handlePromoteToMailSent}>Confirm Delivery Transfer</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* RM Details / Target Modal */}
            {selectedRm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-xl font-medium text-foreground">{selectedRm.name}</h3>
                            <button onClick={() => setSelectedRm(null)} className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-surface rounded-xl border border-border">
                                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Performance Rate</p>
                                    <p className="text-2xl font-bold text-foreground">{selectedRm.assignedDeals > 0 ? ((selectedRm.settledDeals / selectedRm.assignedDeals) * 100).toFixed(1) : 0}%</p>
                                </div>
                                <div className="p-4 bg-surface rounded-xl border border-border">
                                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Total Volume</p>
                                    <p className="text-2xl font-bold text-foreground">{formatINR(selectedRm.volume)}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Monthly Target (INR)</label>
                                    <p className="text-xs text-muted mb-2">Adjust this user's monthly revenue target expectations.</p>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted font-medium">₹</span>
                                        <input type="number" value={adjustTargetVal} onChange={e => setAdjustTargetVal(e.target.value)} className="w-full pl-8 p-2.5 text-sm border border-border rounded-lg bg-white focus-visible:ring-2 focus-visible:ring-primary outline-none font-semibold" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setSelectedRm(null)}>Cancel</Button>
                            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={saveTarget}>Save Assessment</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lead Reassignment Modal */}
            {reassignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-lg font-medium">Reassign Lead</h3>
                            <button onClick={() => setReassignModal(null)} className="text-muted hover:text-foreground p-1.5 rounded-lg"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-sm text-muted">Current RM: <strong className="text-foreground">{getUserName(reassignModal.currentRm)}</strong></p>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">New RM</label>
                                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={newRmId} onChange={e => setNewRmId(e.target.value)}>
                                    <option value="">Select RM...</option>
                                    {rmsList.filter(r => r.id !== reassignModal.currentRm).map(rm => (
                                        <option key={rm.id} value={rm.id}>{rm.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setReassignModal(null)}>Cancel</Button>
                            <Button className="bg-primary text-white" onClick={handleReassign} disabled={!newRmId}>Reassign</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
