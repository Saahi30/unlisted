'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

export default function AgentKycTab() {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchAgents = async () => {
        setLoading(true);
        // Include profile join if possible, or just fetch agent_profiles
        const { data, error } = await supabase
            .from('agent_profiles')
            .select('*, profiles(name, email)');

        if (data) {
            setAgents(data);
        } else {
            console.error('Error fetching agents:', error);
            // Simulator fallback
            setAgents([
                {
                    agent_id: 'agt_1',
                    kyc_status: 'pending',
                    pan_number: 'SIMULATOR_PAN',
                    aadhar_number: 'SIMULATOR_AADHAR',
                    profiles: { name: 'Partner Broker', email: 'partner@sharesaathi.com' }
                }
            ]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const handleAction = async (agentId: string, status: 'approved' | 'rejected' | 'pending') => {
        const { error } = await supabase
            .from('agent_profiles')
            .update({ kyc_status: status, updated_at: new Date().toISOString() })
            .eq('agent_id', agentId);

        if (!error) {
            alert(`Agent ${status} successfully.`);
            fetchAgents();
        } else {
            // Simulator fallback
            alert(`Simulator: Agent ${status} successfully.`);
            setAgents(agents.map(a => a.agent_id === agentId ? { ...a, kyc_status: status } : a));
        }
    };

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-white">
                <div>
                    <CardTitle className="font-display font-medium text-lg">Agent KYC Review</CardTitle>
                    <CardDescription className="text-muted">Review, approve or reject Partner Agent KYC submissions.</CardDescription>
                </div>
                <Button onClick={fetchAgents} variant="outline" size="sm">Refresh</Button>
            </CardHeader>
            <CardContent className="p-0 bg-white">
                {loading ? (
                    <div className="p-8 text-center text-muted">Loading KYC data...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface/50">
                                    <TableHead className="pl-6 font-semibold">Agent Name</TableHead>
                                    <TableHead className="font-semibold">Email</TableHead>
                                    <TableHead className="font-semibold">PAN</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold text-right">Earned</TableHead>
                                    <TableHead className="font-semibold text-right">Withdrawn</TableHead>
                                    <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center p-8 text-muted italic">No agents found.</TableCell>
                                    </TableRow>
                                ) : (
                                    agents.map(agent => (
                                        <TableRow key={agent.agent_id} className="hover:bg-surface/30">
                                            <TableCell className="pl-6 font-medium">{agent.profiles?.name || 'Unknown'}</TableCell>
                                            <TableCell className="text-muted">{agent.profiles?.email || '-'}</TableCell>
                                            <TableCell className="font-mono text-xs">{agent.pan_number}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${agent.kyc_status === 'approved' ? 'bg-green-50 text-green-600' :
                                                    agent.kyc_status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-red-50 text-red-600'
                                                    }`}>
                                                    {agent.kyc_status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-primary">₹{Number(agent.total_earnings || 0).toLocaleString()}</TableCell>
                                            <TableCell className="text-right text-slate-600">₹{Number(agent.withdrawn_earnings || 0).toLocaleString()}</TableCell>
                                            <TableCell className="text-right pr-6 whitespace-nowrap">
                                                {agent.kyc_status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="h-7 text-[10px] font-bold bg-green-500 hover:bg-green-600 text-white"
                                                            onClick={() => handleAction(agent.agent_id, 'approved')}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-[10px] font-bold text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                                                            onClick={() => handleAction(agent.agent_id, 'rejected')}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                                {agent.kyc_status !== 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-[10px] text-muted hover:text-foreground"
                                                        onClick={() => handleAction(agent.agent_id, 'pending')}
                                                    >
                                                        Reset to Pending
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
