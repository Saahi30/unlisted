'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function AgentPayoutsTab() {
    const supabase = createClient();
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWithdrawals = async () => {
        setLoading(true);
        // Fetch withdrawals along with agent profiles to get bank details and user name
        const { data } = await supabase
            .from('agent_withdrawals')
            .select(`
                *,
                agent_profiles(
                    pan_number,
                    bank_details,
                    kyc_status,
                    total_earnings,
                    withdrawn_earnings,
                    profiles(name, email)
                )
            `)
            .order('created_at', { ascending: false });

        if (data) setWithdrawals(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const handleMarkPaid = async (withdrawal: any) => {
        const confirmMsg = `Are you sure you have manually transferred ₹${withdrawal.amount} to ${withdrawal.agent_profiles?.bank_details?.account_name || 'the agent'}?`;
        if (!window.confirm(confirmMsg)) return;

        // Start transaction pseudo-logic. 
        // 1. Update status in agent_withdrawals
        // 2. Add amount to withdrawn_earnings of agent

        const { error: wError } = await supabase
            .from('agent_withdrawals')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', withdrawal.id);

        if (wError) {
            alert('Failed to update withdrawal status: ' + wError.message);
            return;
        }

        const newWithdrawn = Number(withdrawal.agent_profiles.withdrawn_earnings || 0) + Number(withdrawal.amount);

        const { error: pError } = await supabase
            .from('agent_profiles')
            .update({ withdrawn_earnings: newWithdrawn })
            .eq('agent_id', withdrawal.agent_id);

        if (pError) {
            alert('Warning: Marked as paid, but failed to update agent profile withdrawn amount: ' + pError.message);
        } else {
            alert('Successfully marked as paid and updated agent ledger!');
        }

        fetchWithdrawals();
    };

    const handleReject = async (id: string) => {
        const notes = window.prompt("Reason for rejection:");
        if (notes === null) return; // Cancelled

        const { error } = await supabase
            .from('agent_withdrawals')
            .update({ status: 'rejected', admin_notes: notes })
            .eq('id', id);

        if (error) {
            alert('Failed to reject: ' + error.message);
        } else {
            fetchWithdrawals();
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">Loading withdrawal requests...</div>;

    return (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
                <div>
                    <h3 className="font-display font-medium text-lg">Agent Payout Requests</h3>
                    <p className="text-sm text-muted">Manage manual bank transfers for sub-brokers.</p>
                </div>
                <Button variant="outline" onClick={fetchWithdrawals}>Refresh</Button>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="pl-6 font-semibold">Agent</TableHead>
                            <TableHead className="font-semibold text-right">Requested</TableHead>
                            <TableHead className="font-semibold">Bank Details</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {withdrawals.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted italic">
                                    No withdrawal requests currently found.
                                </TableCell>
                            </TableRow>
                        )}
                        {withdrawals.map((req) => (
                            <TableRow key={req.id}>
                                <TableCell className="pl-6">
                                    <p className="font-medium">{req.agent_profiles?.profiles?.name}</p>
                                    <p className="text-xs text-muted">{req.agent_profiles?.profiles?.email}</p>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-bold text-lg text-slate-800">₹{Number(req.amount).toLocaleString()}</span>
                                    {req.status === 'pending' && (
                                        <p className="text-[10px] text-muted">from min max diff ₹{Number(Number(req.agent_profiles?.total_earnings || 0) - Number(req.agent_profiles?.withdrawn_earnings || 0)).toLocaleString()}</p>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs font-mono bg-slate-50 p-2 rounded border border-border">
                                        <p><span className="text-muted">Name:</span> {req.agent_profiles?.bank_details?.account_name || 'N/A'}</p>
                                        <p><span className="text-muted">A/C:</span> {req.agent_profiles?.bank_details?.account_number || 'N/A'}</p>
                                        <p><span className="text-muted">IFSC:</span> {req.agent_profiles?.bank_details?.ifsc || 'N/A'}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${req.status === 'paid' ? 'bg-green-50 text-green-600 border border-green-200' :
                                            req.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200' :
                                                'bg-amber-50 text-amber-600 border border-amber-200'
                                        }`}>
                                        {req.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                    {new Date(req.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right pr-6 whitespace-nowrap">
                                    {req.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleReject(req.id)}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleMarkPaid(req)}
                                            >
                                                Mark Paid
                                            </Button>
                                        </div>
                                    )}
                                    {req.status === 'rejected' && req.admin_notes && (
                                        <p className="text-[10px] text-red-500 max-w-[150px] truncate" title={req.admin_notes}>
                                            {req.admin_notes}
                                        </p>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
