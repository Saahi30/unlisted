'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/utils/supabase/client';

export default function AgentSettingsConfig() {
    const supabase = createClient();

    // Config level selection
    const [scope, setScope] = useState<'global' | 'company' | 'agent' | 'agent_company'>('global');

    // Lists for dropdowns
    const [companies, setCompanies] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);

    // Current Selections
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [selectedAgent, setSelectedAgent] = useState<string>('');

    // Form Values
    const [fixedMarkup, setFixedMarkup] = useState<string>('5');
    const [marginThreshold, setMarginThreshold] = useState<string>('10');
    const [marginPercentage, setMarginPercentage] = useState<string>('20');

    const [existingRules, setExistingRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAllAssets = async () => {
        const { data: cData } = await supabase.from('companies').select('id, name').eq('status', 'active');
        if (cData) setCompanies(cData);

        const { data: aData } = await supabase.from('agent_profiles').select('agent_id, kyc_status, profiles(name, email)');
        if (aData) setAgents(aData);
    };

    const fetchRules = async () => {
        const { data: rules } = await supabase.from('agent_settings').select('*, companies(name), agent_profiles(profiles(name))');
        if (rules) setExistingRules(rules);
    };

    useEffect(() => {
        fetchAllAssets();
        fetchRules();
    }, []);

    const fetchSpecificRule = async () => {
        if (!scope) return;

        let query = supabase.from('agent_settings').select('*');
        if (scope === 'global') {
            query = query.is('company_id', null).is('agent_id', null);
        } else if (scope === 'company') {
            if (!selectedCompany) return;
            query = query.eq('company_id', selectedCompany).is('agent_id', null);
        } else if (scope === 'agent') {
            if (!selectedAgent) return;
            query = query.eq('agent_id', selectedAgent).is('company_id', null);
        } else if (scope === 'agent_company') {
            if (!selectedAgent || !selectedCompany) return;
            query = query.eq('agent_id', selectedAgent).eq('company_id', selectedCompany);
        }

        const { data } = await query.single();
        if (data) {
            setFixedMarkup(data.fixed_markup.toString());
            setMarginThreshold(data.margin_threshold.toString());
            setMarginPercentage(data.margin_percentage.toString());
        } else {
            // Reset to defaults if no rule exists for this scope yet
            setFixedMarkup('5');
            setMarginThreshold('10');
            setMarginPercentage('20');
        }
    };

    // Refetch when scope or selections change
    useEffect(() => {
        fetchSpecificRule();
    }, [scope, selectedCompany, selectedAgent]);

    const handleSave = async () => {
        setLoading(true);
        const payload = {
            agent_id: (scope === 'agent' || scope === 'agent_company') ? selectedAgent : null,
            company_id: (scope === 'company' || scope === 'agent_company') ? selectedCompany : null,
            fixed_markup: Number(fixedMarkup),
            margin_threshold: Number(marginThreshold),
            margin_percentage: Number(marginPercentage)
        };

        const { error } = await supabase.from('agent_settings').upsert(
            // Upsert works best when we specify the ON CONFLICT fields, 
            // but Supabase uses the primary key or unique constraints automatically.
            payload,
            { onConflict: 'agent_id,company_id' }
        );

        if (!error) {
            alert('Rule saved successfully!');
            fetchRules();
        } else {
            alert('Failed to save rule: ' + error.message);
        }
        setLoading(false);
    };

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border/50 bg-white">
                <CardTitle className="font-display font-medium text-lg">Sub-Broker Analytics & Config</CardTitle>
                <CardDescription>Manage agent markups globally, per-company, or securely per-agent.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-3 mb-4">
                    <Icon name="InformationCircleIcon" className="shrink-0 mt-0.5 text-amber-600" />
                    <div>
                        <p className="font-bold mb-1">Hierarchy of Resolution:</p>
                        <ul className="list-disc pl-4 text-xs space-y-1">
                            <li><strong>Agent + Company</strong> (Highest Priority)</li>
                            <li><strong>Agent Global</strong> (Applies to all companies for this agent)</li>
                            <li><strong>Company Global</strong> (Applies to all agents for this company)</li>
                            <li><strong>Platform Global</strong> (Lowest Priority - Default)</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-surface/50 p-5 rounded-xl border border-border space-y-5">
                    <div>
                        <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-2">Configuration Scope</label>
                        <div className="flex flex-wrap gap-2">
                            {['global', 'company', 'agent', 'agent_company'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        setScope(s as any);
                                        setSelectedAgent('');
                                        setSelectedCompany('');
                                    }}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${scope === s ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-border hover:bg-slate-50'
                                        }`}
                                >
                                    {s === 'global' ? 'Platform Global' :
                                        s === 'company' ? 'Per-Company' :
                                            s === 'agent' ? 'Per-Agent' : 'Agent + Company'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(scope === 'company' || scope === 'agent_company') && (
                            <div>
                                <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-2">Target Company</label>
                                <select
                                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                                    value={selectedCompany}
                                    onChange={e => setSelectedCompany(e.target.value)}
                                >
                                    <option value="" disabled>Select Company</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    {companies.length === 0 && <option value="sim_comp_1">Simulated Corp (Mock)</option>}
                                </select>
                            </div>
                        )}
                        {(scope === 'agent' || scope === 'agent_company') && (
                            <div>
                                <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-2">Target Agent</label>
                                <select
                                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                                    value={selectedAgent}
                                    onChange={e => setSelectedAgent(e.target.value)}
                                >
                                    <option value="" disabled>Select Agent</option>
                                    {agents.map(a => <option key={a.agent_id} value={a.agent_id}>{a.profiles?.name} ({a.profiles?.email})</option>)}
                                    {agents.length === 0 && <option value="agt_1">Partner Broker (Mock)</option>}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        <div>
                            <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Fixed Markup (INR)</label>
                            <p className="text-[10px] text-muted mb-2">Platform flat fee per share.</p>
                            <Input type="number" value={fixedMarkup} onChange={e => setFixedMarkup(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Margin Threshold (INR)</label>
                            <p className="text-[10px] text-muted mb-2">When % cut activates.</p>
                            <Input type="number" value={marginThreshold} onChange={e => setMarginThreshold(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Platform Cut (%)</label>
                            <p className="text-[10px] text-muted mb-2">Taken from margin above threshold.</p>
                            <Input type="number" value={marginPercentage} onChange={e => setMarginPercentage(e.target.value)} />
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={loading || (scope === 'company' && !selectedCompany) || (scope === 'agent' && !selectedAgent) || (scope === 'agent_company' && (!selectedAgent || !selectedCompany))}
                        className="w-auto bg-slate-900 hover:bg-slate-800 text-white mt-4 font-bold"
                    >
                        {loading ? 'Saving...' : 'Save Agent Rule'}
                    </Button>
                </div>

                {/* Listing of Existing Overrides */}
                <div className="pt-6 border-t border-border">
                    <h4 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Active Configured Rules</h4>
                    {existingRules.length === 0 ? (
                        <p className="text-sm text-muted italic">No rules defined. System will fallback to absolute defaults.</p>
                    ) : (
                        <div className="space-y-2">
                            {existingRules.map(rule => (
                                <div key={rule.id} className="text-xs flex justify-between items-center p-3 bg-white border border-border rounded-lg shadow-sm">
                                    <div>
                                        {rule.agent_id === null && rule.company_id === null && <span className="font-bold text-primary">Platform Global</span>}
                                        {rule.agent_id && rule.company_id === null && <span><span className="font-bold">Agent Rule:</span> {rule.agent_profiles?.profiles?.name || rule.agent_id}</span>}
                                        {rule.agent_id === null && rule.company_id && <span><span className="font-bold">Company Rule:</span> {rule.companies?.name || rule.company_id}</span>}
                                        {rule.agent_id && rule.company_id && <span><span className="font-bold">Specific:</span> {rule.agent_profiles?.profiles?.name || rule.agent_id} on {rule.companies?.name || rule.company_id}</span>}
                                    </div>
                                    <div className="flex gap-4 font-mono">
                                        <span>Fee: ₹{rule.fixed_markup}</span>
                                        <span>Thresh: ₹{rule.margin_threshold}</span>
                                        <span>Cut: {rule.margin_percentage}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </CardContent>
        </Card>
    );
}
