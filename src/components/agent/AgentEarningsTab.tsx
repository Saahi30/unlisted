'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';

export default function AgentEarningsTab({ kycData }: { kycData: any }) {
    const { user } = useAuth();
    const supabase = createClient();

    const [withdrawAmount, setWithdrawAmount] = useState<string>('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('agent_withdrawals')
            .select('*')
            .eq('agent_id', user.id)
            .order('created_at', { ascending: false });
        if (data) setWithdrawHistory(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchHistory();
    }, [user, supabase]);

    const totalEarned = Number(kycData?.total_earnings || 0);
    const totalWithdrawn = Number(kycData?.withdrawn_earnings || 0);
    const availableBalance = totalEarned - totalWithdrawn;

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const amount = Number(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        if (amount > availableBalance) {
            alert('Insufficient balance.');
            return;
        }

        setIsWithdrawing(true);
        const { error } = await supabase.from('agent_withdrawals').insert({
            agent_id: user.id,
            amount: amount,
            status: 'pending'
        });

        setIsWithdrawing(false);
        if (error) {
            alert('Failed to submit withdrawal request: ' + error.message);
        } else {
            alert('Withdrawal request submitted successfully! It will be processed soon.');
            setWithdrawAmount('');
            fetchHistory();
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between min-h-[160px]">
                    <p className="text-sm font-bold text-muted uppercase tracking-wider">Total Earned</p>
                    <h3 className="text-3xl font-display font-bold text-primary">₹{totalEarned.toLocaleString()}</h3>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between min-h-[160px]">
                    <p className="text-sm font-bold text-muted uppercase tracking-wider">Withdrawn</p>
                    <h3 className="text-3xl font-display font-bold text-slate-700">₹{totalWithdrawn.toLocaleString()}</h3>
                </div>
                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 shadow-sm flex flex-col justify-between min-h-[160px]">
                    <p className="text-sm font-bold text-primary/70 uppercase tracking-wider">Available Balance</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-display font-bold text-primary">₹{availableBalance.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Request Withdrawal Form */}
                <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                    <div className="bg-surface/50 p-5 border-b border-border">
                        <h3 className="font-display font-bold text-lg text-foreground">Request Withdrawal</h3>
                        <p className="text-sm text-muted">Withdraw funds to your verified bank account.</p>
                    </div>
                    <form onSubmit={handleWithdraw} className="p-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-2">Amount to Withdraw (INR)</label>
                            <input
                                type="number"
                                required
                                max={availableBalance}
                                value={withdrawAmount}
                                onChange={e => setWithdrawAmount(e.target.value)}
                                className="w-full border border-border rounded-lg px-4 py-3 text-lg font-bold focus:border-primary transition-all outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isWithdrawing || availableBalance <= 0}
                            className="w-full bg-primary text-white font-bold py-3 rounded-lg shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {isWithdrawing ? 'Processing...' : 'Submit Request'}
                        </button>
                    </form>
                </div>

                {/* Withdrawal History */}
                <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
                    <div className="bg-surface/50 p-5 border-b border-border">
                        <h3 className="font-display font-bold text-lg text-foreground">Withdrawal History</h3>
                    </div>
                    <div className="p-0 flex-1 overflow-y-auto max-h-[300px]">
                        {loading ? (
                            <p className="p-6 text-center text-muted text-sm">Loading history...</p>
                        ) : withdrawHistory.length === 0 ? (
                            <p className="p-6 text-center text-muted text-sm italic">No withdrawal requests found.</p>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted uppercase bg-surface/50 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Date</th>
                                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                                        <th className="px-4 py-3 font-semibold text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {withdrawHistory.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                ₹{Number(req.amount).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${req.status === 'paid' ? 'bg-green-50 text-green-600' :
                                                        req.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                                            'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
