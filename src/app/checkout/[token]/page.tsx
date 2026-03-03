'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AgentCheckoutPage({ params }: { params: { token: string } }) {
    const { token } = params;
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchLinkDetails = async () => {
            const { data, error: fetchErr } = await supabase
                .from('agent_client_orders')
                .select('*, companies(name, sector), agent_profiles(profiles(name))')
                .eq('link_token', token)
                .single();

            if (data) {
                setOrder(data);
            } else if (token === 'mock_token_123') {
                // Simulator fallback
                setOrder({
                    id: 'link_1', client_name: 'Alice Brown', client_email: 'alice@example.com',
                    quantity: 50, selling_price: 120, status: 'pending', link_token: 'mock_token_123',
                    companies: { name: 'Simulated Corp', sector: 'Tech' }, created_at: new Date().toISOString()
                });
            } else {
                setError('Payment link is invalid or has expired.');
            }
            setLoading(false);
        };
        fetchLinkDetails();
    }, [token, supabase]);

    const handleMockPayment = async () => {
        if (!order || order.status !== 'pending') return;
        setIsProcessing(true);

        try {
            // Simulate payment delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // In reality, this is where Razorpay UI would pop up. 
            // We simulate a success callback here.

            const res = await fetch('/api/checkout/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    link_token: token,
                    payment_method: 'razorpay',
                    razorpay_order_id: 'mock_order_' + Date.now(),
                    razorpay_payment_id: 'mock_pay_' + Date.now()
                })
            });

            const data = await res.json();

            if (res.ok || token === 'mock_token_123') {
                setOrder({ ...order, status: 'paid' });
            } else {
                alert('Payment processing failed: ' + data.error);
            }
        } catch (err: any) {
            alert('Something went wrong: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <Icon name="XCircleIcon" size={32} />
                </div>
                <h1 className="text-2xl font-bold font-display text-foreground mb-2">Link Not Found</h1>
                <p className="text-muted text-center max-w-sm mb-8">{error}</p>
                <Link href="/">
                    <Button variant="outline">Return to Home</Button>
                </Link>
            </div>
        );
    }

    const totalValue = order.quantity * order.selling_price;

    return (
        <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden text-foreground">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <header className="p-6 flex justify-center border-b border-border/50 bg-white/50 backdrop-blur-md sticky top-0 z-20">
                <Link href="/">
                    <AppLogo size={28} text="ShareSaathi" />
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center p-6 max-w-4xl mx-auto w-full z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl border border-border shadow-2xl overflow-hidden w-full">

                    {/* Left Side - Receipt Recap */}
                    <div className="p-8 md:p-12 bg-slate-50 border-b md:border-b-0 md:border-r border-border">
                        <div className="flex items-center gap-2 mb-8">
                            <span className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold">
                                {order.companies?.name?.charAt(0) || 'C'}
                            </span>
                            <span className="font-bold text-lg tracking-tight">{order.companies?.name}</span>
                        </div>

                        <p className="text-xs uppercase tracking-widest text-muted font-bold mb-1">Invoice For</p>
                        <p className="text-xl font-display font-medium mb-1">{order.client_name}</p>
                        <p className="text-sm text-muted mb-10">{order.client_email}</p>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-border/50">
                                <span className="text-sm text-slate-600 font-medium tracking-wide">Number of Shares</span>
                                <span className="font-bold text-slate-800">{order.quantity}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-border/50">
                                <span className="text-sm text-slate-600 font-medium tracking-wide">Agreed Price</span>
                                <span className="font-bold text-slate-800">₹{order.selling_price.toLocaleString()} / share</span>
                            </div>
                            <div className="flex justify-between items-center py-4">
                                <span className="text-sm uppercase tracking-widest text-muted font-bold">Total Payable</span>
                                <span className="text-4xl font-bold font-display tracking-tight text-primary">₹{totalValue.toLocaleString()}</span>
                            </div>
                        </div>

                        {order.status === 'paid' && (
                            <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                <div className="p-2 bg-green-100 text-green-600 rounded-full">
                                    <Icon name="CheckCircleIcon" size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-green-800">Payment Complete</p>
                                    <p className="text-xs text-green-700">Thank you for your purchase.</p>
                                </div>
                            </div>
                        )}

                        {order.status === 'pending' && (
                            <div className="mt-8 text-xs text-muted flex items-start gap-2">
                                <Icon name="ShieldCheckIcon" size={16} className="shrink-0 mt-0.5" />
                                <p>This payment is securely processed by Razorpay. Your funds are kept in an escrow compliant account until shares are transferred.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Side - Payment Action */}
                    <div className="p-8 md:p-12 flex flex-col justify-center bg-white relative">
                        {order.status === 'paid' ? (
                            <div className="text-center">
                                <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Icon name="CheckBadgeIcon" size={48} />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-3">Order Successful</h3>
                                <p className="text-muted text-sm leading-relaxed mb-8">
                                    Your order has been recorded. Our partner agent will initiate the transfer of shares to your linked DEMAT account shortly. You'll receive updates via email.
                                </p>
                                <Link href="/">
                                    <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12">Return Home</Button>
                                </Link>
                            </div>
                        ) : order.status === 'cancelled' ? (
                            <div className="text-center">
                                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Icon name="XCircleIcon" size={48} />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-3">Link Cancelled</h3>
                                <p className="text-muted text-sm leading-relaxed mb-8">
                                    This payment link has been cancelled or expired. Please contact your agent for a new link.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-2xl font-bold font-display text-foreground mb-2">Complete Checkout</h3>
                                <p className="text-sm text-muted mb-8 group flex items-center gap-1.5 cursor-pointer">
                                    <Icon name="InformationCircleIcon" size={16} />
                                    By proceeding, you agree to the ShareSaathi <span className="text-primary hover:underline">Terms of Service</span>.
                                </p>

                                <div className="bg-slate-50 border border-border p-4 rounded-xl mb-6">
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Payment Method</p>
                                    <div className="flex items-center gap-3 p-3 bg-white border-2 border-primary rounded-lg shadow-sm">
                                        <div className="w-4 h-4 rounded-full border-[5px] border-primary" />
                                        <span className="font-bold text-slate-800">Razorpay Secure Gateway</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-4 ml-7">
                                        <span className="px-2 py-1 bg-white border border-border rounded text-[10px] font-bold text-slate-500 uppercase tracking-wide">UPI</span>
                                        <span className="px-2 py-1 bg-white border border-border rounded text-[10px] font-bold text-slate-500 uppercase tracking-wide">Cards</span>
                                        <span className="px-2 py-1 bg-white border border-border rounded text-[10px] font-bold text-slate-500 uppercase tracking-wide">NetBanking</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleMockPayment}
                                    disabled={isProcessing}
                                    className="w-full h-14 bg-[#0a2540] hover:bg-slate-800 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 relative overflow-hidden group"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {isProcessing ? (
                                            <>
                                                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>Mock Pay ₹{totalValue.toLocaleString()}</>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-shimmer pointer-events-none" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
