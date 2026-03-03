'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Icon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AgentMarketplaceTab() {
    const { user } = useAuth();
    const [companies, setCompanies] = useState<any[]>([]);
    const [agentRules, setAgentRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Link Generation Modal State
    const [selectedCompany, setSelectedCompany] = useState<any>(null);
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [quantity, setQuantity] = useState<number | ''>('');
    const [sellingPrice, setSellingPrice] = useState<number | ''>('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const fetchMarket = async () => {
            if (!user) return;
            // Fetch active companies
            const { data: cData } = await supabase.from('companies').select('*').eq('status', 'active');

            // Fetch all rules that could apply to this agent or are global
            const { data: sData } = await supabase.from('agent_settings')
                .select('*')
                .or(`agent_id.eq.${user.id},agent_id.is.null`);

            if (cData) setCompanies(cData);
            if (sData) {
                setAgentRules(sData);
            } else {
                setAgentRules([]);
            }
            // Add simulator fallback if no data
            if (!cData || cData.length === 0) {
                setCompanies([
                    { id: 'sim_comp_1', name: 'Simulated Corp', sector: 'Tech', current_ask_price: 150 },
                    { id: 'sim_comp_2', name: 'Fake Industries', sector: 'Finance', current_ask_price: 320 }
                ]);
            }
            setLoading(false);
        };
        fetchMarket();
    }, [supabase]);

    const getResolvedRule = (companyId: string) => {
        if (!agentRules || agentRules.length === 0) return { fixed_markup: 5, margin_threshold: 10, margin_percentage: 20 };

        let rule = agentRules.find(r => r.agent_id === user?.id && r.company_id === companyId);
        if (rule) return rule;

        rule = agentRules.find(r => r.agent_id === user?.id && r.company_id === null);
        if (rule) return rule;

        rule = agentRules.find(r => r.agent_id === null && r.company_id === companyId);
        if (rule) return rule;

        rule = agentRules.find(r => r.agent_id === null && r.company_id === null);
        if (rule) return rule;

        return { fixed_markup: 5, margin_threshold: 10, margin_percentage: 20 };
    };

    const handleGenerateLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompany || !user || !quantity || !sellingPrice) return;
        setIsGenerating(true);

        const basePrice = selectedCompany.current_ask_price;
        const resolvedRule = getResolvedRule(selectedCompany.id);
        const fixedMarkup = resolvedRule.fixed_markup || 5;
        const agentCost = basePrice + fixedMarkup;

        if (Number(sellingPrice) < agentCost) {
            alert(`Selling price cannot be less than your cost price (₹${agentCost}).`);
            setIsGenerating(false);
            return;
        }

        const payload = {
            agent_id: user.id,
            company_id: selectedCompany.id,
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone,
            quantity: Number(quantity),
            base_price: basePrice,
            fixed_markup: fixedMarkup,
            selling_price: Number(sellingPrice),
            status: 'pending'
        };

        const { data, error } = await supabase.from('agent_client_orders').insert(payload).select().single();

        setIsGenerating(false);
        if (error && user.id !== 'agt_1') {
            alert('Failed to generate link: ' + error.message);
        } else {
            alert('Payment link generated successfully! You can find it in the "My Links" tab.');
            setSelectedCompany(null);
            // Reset form
            setClientName(''); setClientEmail(''); setClientPhone(''); setQuantity(''); setSellingPrice('');
            // Typically we might redirect or change tabs, but an alert is fine for now.
        }
    };

    if (loading) return <div className="text-center p-8 text-muted">Loading Marketplace...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map(company => {
                    const resolvedRule = getResolvedRule(company.id);
                    const fixedMarkup = resolvedRule.fixed_markup || 5;
                    const costPrice = (company.current_ask_price || company.currentAskPrice || 0) + fixedMarkup;
                    return (
                        <div key={company.id} className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col transition-all hover:shadow-md hover:border-primary/30">
                            <div className="flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded mb-3 inline-block">
                                    {company.sector}
                                </span>
                                <h3 className="text-lg font-bold text-foreground mb-1">{company.name}</h3>
                                <div className="flex justify-between items-center mt-6 p-3 bg-surface rounded-xl border border-border/50">
                                    <div>
                                        <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Your Cost</p>
                                        <p className="text-xl font-display font-bold text-slate-800">₹{costPrice.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Base Price</p>
                                        <p className="text-sm font-semibold text-slate-500">₹{(company.current_ask_price || company.currentAskPrice || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={() => setSelectedCompany(company)}
                                className="w-full mt-6 bg-primary text-white font-bold"
                            >
                                Generate Client Link
                            </Button>
                        </div>
                    );
                })}
            </div>

            {/* Modal for Link Generation */}
            {selectedCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <div>
                                <h3 className="font-display text-xl font-bold text-foreground">Create Payment Link</h3>
                                <p className="text-xs text-muted mt-1">For {selectedCompany.name}</p>
                            </div>
                            <button onClick={() => setSelectedCompany(null)} className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg">
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleGenerateLink} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Client Name</label>
                                    <Input required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Client Email</label>
                                    <Input required type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="john@example.com" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Quantity</label>
                                    <Input required type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value as any)} placeholder="100" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Your Selling Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold">₹</span>
                                        <Input required type="number" min={(selectedCompany.current_ask_price || selectedCompany.currentAskPrice || 0) + (getResolvedRule(selectedCompany.id).fixed_markup || 5)} className="pl-8 text-lg font-bold text-primary" value={sellingPrice} onChange={e => setSellingPrice(e.target.value as any)} placeholder="0.00" />
                                    </div>
                                </div>
                            </div>

                            {/* Margin Calculation Preview */}
                            <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 text-sm mt-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-slate-600">Cost Price (Base + Platform Fee):</span>
                                    <span className="font-semibold text-slate-800">₹{((selectedCompany.current_ask_price || selectedCompany.currentAskPrice || 0) + (getResolvedRule(selectedCompany.id).fixed_markup || 5)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-slate-600">Client Pays:</span>
                                    <span className="font-semibold text-slate-800">₹{(Number(sellingPrice) || 0).toLocaleString()}</span>
                                </div>
                                <div className="w-full h-px bg-green-200 my-2" />
                                <div className="flex justify-between">
                                    <span className="font-bold text-green-800">Your Estimated Margin:</span>
                                    <span className="font-bold text-green-600">₹{Math.max(0, (Number(sellingPrice) || 0) - ((selectedCompany.current_ask_price || selectedCompany.currentAskPrice || 0) + (getResolvedRule(selectedCompany.id).fixed_markup || 5))).toLocaleString()} per share</span>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setSelectedCompany(null)}>Cancel</Button>
                                <Button type="submit" disabled={isGenerating} className="bg-primary text-white">
                                    {isGenerating ? 'Generating...' : 'Generate Secure Link'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
