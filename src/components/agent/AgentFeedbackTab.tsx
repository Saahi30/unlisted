'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/button';

interface Feedback {
    id: string;
    client_name: string;
    client_email: string;
    rating: number;
    comment: string;
    submitted_at: string | null;
    created_at: string;
    order_id: string | null;
}

export default function AgentFeedbackTab() {
    const { user } = useAuth();
    const supabase = createClient();
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [reqName, setReqName] = useState('');
    const [reqEmail, setReqEmail] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchFeedback();
    }, [user]);

    const fetchFeedback = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('agent_client_feedback')
            .select('*')
            .eq('agent_id', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            setFeedbacks(data);
        } else if (user.id === 'agt_1') {
            setFeedbacks([
                { id: 'f1', client_name: 'Rajesh Kumar', client_email: 'rajesh@gmail.com', rating: 5, comment: 'Excellent service! Very professional and knowledgeable about the stocks.', submitted_at: new Date(Date.now() - 86400000 * 3).toISOString(), created_at: new Date(Date.now() - 86400000 * 5).toISOString(), order_id: null },
                { id: 'f2', client_name: 'Priya Sharma', client_email: 'priya@gmail.com', rating: 4, comment: 'Good experience overall. Quick response and transparent pricing.', submitted_at: new Date(Date.now() - 86400000 * 7).toISOString(), created_at: new Date(Date.now() - 86400000 * 10).toISOString(), order_id: null },
                { id: 'f3', client_name: 'Amit Patel', client_email: 'amit@gmail.com', rating: 5, comment: 'Best partner agent I have worked with. Highly recommend!', submitted_at: new Date(Date.now() - 86400000 * 15).toISOString(), created_at: new Date(Date.now() - 86400000 * 20).toISOString(), order_id: null },
                { id: 'f4', client_name: 'Sunita Verma', client_email: 'sunita@gmail.com', rating: 3, comment: 'Decent service but could be more responsive.', submitted_at: new Date(Date.now() - 86400000 * 25).toISOString(), created_at: new Date(Date.now() - 86400000 * 30).toISOString(), order_id: null },
                { id: 'f5', client_name: 'Neha Gupta', client_email: 'neha@gmail.com', rating: null as any, comment: '', submitted_at: null, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), order_id: null },
            ]);
        }
        setLoading(false);
    };

    const requestFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSending(true);

        const { error } = await supabase.from('agent_client_feedback').insert({
            agent_id: user.id,
            client_name: reqName,
            client_email: reqEmail,
        });

        if (!error || user.id === 'agt_1') {
            if (user.id === 'agt_1') {
                setFeedbacks(prev => [{ id: `f_${Date.now()}`, client_name: reqName, client_email: reqEmail, rating: null as any, comment: '', submitted_at: null, created_at: new Date().toISOString(), order_id: null }, ...prev]);
            } else {
                fetchFeedback();
            }
            setReqName('');
            setReqEmail('');
            setShowRequestForm(false);
            alert('Feedback request sent! The client will receive an email with a feedback link.');
        } else {
            alert('Failed: ' + error.message);
        }
        setSending(false);
    };

    const submittedFeedbacks = feedbacks.filter(f => f.submitted_at);
    const pendingFeedbacks = feedbacks.filter(f => !f.submitted_at);
    const avgRating = submittedFeedbacks.length > 0 ? submittedFeedbacks.reduce((s, f) => s + (f.rating || 0), 0) / submittedFeedbacks.length : 0;
    const ratingDist = [5, 4, 3, 2, 1].map(r => ({ rating: r, count: submittedFeedbacks.filter(f => f.rating === r).length }));

    if (loading) return <div className="text-center p-8 text-muted">Loading Feedback...</div>;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Avg Rating</p>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Icon key={s} name="StarIcon" size={14} className={s <= Math.round(avgRating) ? 'text-amber-400' : 'text-slate-200'} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Reviews</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{submittedFeedbacks.length}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Pending</p>
                    <p className="text-2xl font-bold text-amber-600 mt-2">{pendingFeedbacks.length}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">5-Star Reviews</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">{submittedFeedbacks.filter(f => f.rating === 5).length}</p>
                </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                <h4 className="font-display font-bold text-sm mb-4">Rating Distribution</h4>
                <div className="space-y-2">
                    {ratingDist.map(r => (
                        <div key={r.rating} className="flex items-center gap-3">
                            <div className="flex gap-0.5 w-20">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Icon key={s} name="StarIcon" size={12} className={s <= r.rating ? 'text-amber-400' : 'text-slate-200'} />
                                ))}
                            </div>
                            <div className="flex-1 h-2.5 bg-surface rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${submittedFeedbacks.length > 0 ? (r.count / submittedFeedbacks.length) * 100 : 0}%` }} />
                            </div>
                            <span className="text-xs font-bold text-muted w-8 text-right">{r.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Request Feedback Button */}
            <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-lg">Client Reviews</h3>
                <Button onClick={() => setShowRequestForm(true)} className="bg-primary text-white text-sm">
                    <Icon name="PaperAirplaneIcon" size={16} className="mr-1" /> Request Feedback
                </Button>
            </div>

            {/* Request Feedback Form */}
            {showRequestForm && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5">
                    <h4 className="font-bold text-foreground text-sm mb-3">Send Feedback Request</h4>
                    <p className="text-xs text-muted mb-4">The client will receive an email with a link to submit their feedback.</p>
                    <form onSubmit={requestFeedback} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div>
                            <label className="text-[10px] font-bold text-muted uppercase block mb-1">Client Name</label>
                            <input required value={reqName} onChange={e => setReqName(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Client name" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-muted uppercase block mb-1">Client Email</label>
                            <input required type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="client@email.com" />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={sending} className="bg-primary text-white flex-1">{sending ? 'Sending...' : 'Send'}</Button>
                            <Button type="button" variant="outline" onClick={() => setShowRequestForm(false)}>Cancel</Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Feedback List */}
            <div className="space-y-3">
                {pendingFeedbacks.length > 0 && (
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 mb-4">
                        <p className="text-xs font-bold text-amber-700 mb-2">Awaiting Response ({pendingFeedbacks.length})</p>
                        <div className="space-y-2">
                            {pendingFeedbacks.map(f => (
                                <div key={f.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{f.client_name}</p>
                                        <p className="text-xs text-muted">{f.client_email}</p>
                                    </div>
                                    <span className="text-[10px] text-amber-600 font-bold">Sent {new Date(f.created_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {submittedFeedbacks.map(f => (
                    <div key={f.id} className="bg-white rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="font-bold text-foreground text-sm">{f.client_name}</p>
                                <p className="text-xs text-muted">{f.client_email}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Icon key={s} name="StarIcon" size={16} className={s <= (f.rating || 0) ? 'text-amber-400' : 'text-slate-200'} />
                                ))}
                            </div>
                        </div>
                        {f.comment && <p className="text-sm text-muted italic">&ldquo;{f.comment}&rdquo;</p>}
                        <p className="text-[10px] text-muted/60 mt-3">{f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : ''}</p>
                    </div>
                ))}

                {submittedFeedbacks.length === 0 && (
                    <div className="text-center py-8 text-muted">
                        <Icon name="StarIcon" size={48} className="mx-auto text-muted/20 mb-3" />
                        <p className="text-sm font-medium">No reviews yet</p>
                        <p className="text-xs mt-1">Request feedback from your clients to build your reputation!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
