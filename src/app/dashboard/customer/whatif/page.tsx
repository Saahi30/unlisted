'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';

export default function WhatIfPage() {
    const { user } = useAuth();
    const { companies } = useAppStore();

    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [scenarioType, setScenarioType] = useState<'ipo' | 'valuation_change'>('ipo');
    const [multiplier, setMultiplier] = useState(2);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);

    const runSimulation = async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/ai/whatif', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: selectedCompanyId,
                    userId: user?.id,
                    scenarioType,
                    multiplier,
                }),
            });
            const data = await res.json();
            setResult(data);
        } catch {
            // error handled silently
        } finally {
            setLoading(false);
        }
    };

    const presets = [
        { label: '1.5x', value: 1.5 },
        { label: '2x', value: 2 },
        { label: '3x', value: 3 },
        { label: '5x', value: 5 },
        { label: '10x', value: 10 },
    ];

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">What-If Simulator</h1>
            </div>
            <p className="text-muted mt-1 mb-8">Model portfolio impact of IPOs, valuation changes, and exit scenarios.</p>

            {/* Controls */}
            <Card className="border-border shadow-sm mb-8">
                <CardContent className="p-6 space-y-5">
                    {/* Company Selection */}
                    <div>
                        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Company</label>
                        <select
                            value={selectedCompanyId}
                            onChange={(e) => { setSelectedCompanyId(e.target.value); setResult(null); }}
                            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                        >
                            <option value="">Select a company...</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name} — ₹{c.currentAskPrice.toLocaleString()} ({c.sector})</option>
                            ))}
                        </select>
                    </div>

                    {/* Scenario Type */}
                    <div>
                        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Scenario</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setScenarioType('ipo')}
                                className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${scenarioType === 'ipo' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted hover:border-primary/30'}`}
                            >
                                <Icon name="RocketLaunchIcon" size={20} className="mx-auto mb-1" />
                                IPO at Multiplier
                            </button>
                            <button
                                onClick={() => setScenarioType('valuation_change')}
                                className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${scenarioType === 'valuation_change' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted hover:border-primary/30'}`}
                            >
                                <Icon name="ArrowTrendingUpIcon" size={20} className="mx-auto mb-1" />
                                Valuation Change
                            </button>
                        </div>
                    </div>

                    {/* Multiplier Slider + Presets */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-muted uppercase tracking-wider">Multiplier</label>
                            <span className="text-lg font-bold text-primary">{multiplier}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="10"
                            step="0.5"
                            value={multiplier}
                            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                            className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex gap-2 mt-3">
                            {presets.map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => setMultiplier(p.value)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${multiplier === p.value ? 'bg-primary text-white' : 'bg-surface border border-border text-muted hover:border-primary/30'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    {selectedCompany && (
                        <div className="bg-surface rounded-xl p-4 border border-border">
                            <p className="text-xs text-muted mb-2">Preview</p>
                            <p className="text-sm text-foreground">
                                What if <strong>{selectedCompany.name}</strong> {scenarioType === 'ipo' ? 'IPOs' : 'reaches'} at <strong>{multiplier}x</strong> current valuation?
                            </p>
                            <p className="text-xs text-muted mt-1">
                                ₹{selectedCompany.currentAskPrice.toLocaleString()} → ₹{(selectedCompany.currentAskPrice * multiplier).toLocaleString()} per share
                                · Valuation: ₹{selectedCompany.valuation.toLocaleString()}Cr → ₹{Math.round(selectedCompany.valuation * multiplier).toLocaleString()}Cr
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={runSimulation}
                        disabled={!selectedCompanyId || loading}
                        className="w-full bg-primary text-white hover:bg-primary/90 py-3"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2 justify-center">
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Running Simulation...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 justify-center">
                                <Icon name="PlayIcon" size={16} />
                                Run Simulation
                            </span>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Results */}
            {result && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5">
                    {/* Projection Card */}
                    <Card className="border-border shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Icon name="BeakerIcon" size={18} className="text-emerald-600" />
                                <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-800">Simulation Result</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Current Price</p>
                                    <p className="text-xl font-bold text-foreground">₹{result.projection.currentPrice.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Projected Price</p>
                                    <p className="text-xl font-bold text-green-600">₹{result.projection.projectedPrice.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Price Change</p>
                                    <p className="text-xl font-bold text-green-600">+{result.projection.priceChange}%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Projected Mkt Cap</p>
                                    <p className="text-xl font-bold text-foreground">₹{result.projection.projectedMarketCap.toLocaleString()}Cr</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* User Impact */}
                    {result.userImpact ? (
                        <Card className="border-border shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Icon name="UserIcon" size={18} className="text-blue-600" />
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-blue-800">Your Portfolio Impact</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Your Shares</p>
                                        <p className="text-lg font-bold text-foreground">{result.userImpact.quantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Invested</p>
                                        <p className="text-lg font-bold text-foreground">₹{result.userImpact.invested.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Projected Value</p>
                                        <p className="text-lg font-bold text-green-600">₹{result.userImpact.projectedValue.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 p-4 bg-white/70 rounded-xl border border-border/50">
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Gross Gain</p>
                                        <p className="text-xl font-bold text-green-600">+₹{result.userImpact.absoluteGain.toLocaleString()}</p>
                                        <p className="text-xs text-green-600 font-medium">+{result.userImpact.percentGain}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Est. Tax ({result.userImpact.taxRate})</p>
                                        <p className="text-xl font-bold text-red-600">-₹{result.userImpact.estimatedTax.toLocaleString()}</p>
                                        <p className="text-xs text-muted">LTCG on unlisted</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Net Gain</p>
                                        <p className="text-xl font-bold text-green-600">+₹{result.userImpact.netGain.toLocaleString()}</p>
                                        <p className="text-xs text-green-600 font-medium">after tax</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="border-border shadow-sm p-5">
                            <div className="flex items-center gap-3 text-sm text-muted">
                                <Icon name="InformationCircleIcon" size={18} />
                                <p>You don't hold {result.company.name} yet. <Link href="/shares" className="text-primary font-medium hover:underline">Buy shares</Link> to see personalized impact.</p>
                            </div>
                        </Card>
                    )}

                    {/* AI Narrative */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="border-b border-border/50 pb-3">
                            <CardTitle className="font-display font-medium text-lg flex items-center gap-2">
                                <Icon name="SparklesIcon" size={18} className="text-amber-600" />
                                AI Scenario Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{result.narrative}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Empty state */}
            {!result && !loading && (
                <div className="py-12 text-center">
                    <Icon name="BeakerIcon" size={40} className="mx-auto text-muted mb-4" />
                    <p className="text-muted font-medium mb-2">Configure a scenario above to run a simulation.</p>
                    <p className="text-xs text-muted">See projected portfolio impact, tax implications, and AI analysis.</p>
                </div>
            )}
        </div>
    );
}
