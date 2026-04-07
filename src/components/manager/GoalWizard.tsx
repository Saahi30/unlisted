'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';

export default function GoalWizard() {
    const { rmGoals, setRmGoal, updateRmGoalProgress, users, orders, rmTargets } = useAppStore();
    const [showCreate, setShowCreate] = useState(false);
    const [selectedRm, setSelectedRm] = useState('');
    const [quarter, setQuarter] = useState('Q2 2026');
    const [goals, setGoals] = useState([{ label: 'Revenue Target', target: 0, current: 0 }, { label: 'New Leads Converted', target: 0, current: 0 }, { label: 'Customer Calls', target: 0, current: 0 }]);

    const rms = users.filter(u => u.role === 'rm');
    const getRmName = (id: string) => users.find(u => u.id === id)?.name || id;
    const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    const handleCreate = () => {
        if (!selectedRm) return;
        setRmGoal({
            id: uuidv4(),
            rmId: selectedRm,
            quarter,
            goals: goals.filter(g => g.target > 0),
        });
        setShowCreate(false);
        setSelectedRm('');
        setGoals([{ label: 'Revenue Target', target: 0, current: 0 }, { label: 'New Leads Converted', target: 0, current: 0 }, { label: 'Customer Calls', target: 0, current: 0 }]);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-display font-medium text-foreground">Goal Setting & OKRs</h2>
                    <p className="text-sm text-muted">Set quarterly goals and track RM milestones.</p>
                </div>
                <Button className="bg-primary text-white" onClick={() => setShowCreate(true)}>
                    <Icon name="FlagIcon" size={16} className="mr-2" /> Set New Goal
                </Button>
            </div>

            {rmGoals.length === 0 ? (
                <Card className="border-border shadow-sm">
                    <CardContent className="p-12 text-center text-muted">
                        <Icon name="FlagIcon" size={32} className="mx-auto mb-3 opacity-40" />
                        <p>No goals set yet. Create quarterly OKRs for your team.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rmGoals.map(goal => (
                        <Card key={goal.id} className="border-border shadow-sm bg-white">
                            <CardHeader className="border-b border-border/50 pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{getRmName(goal.rmId).charAt(0)}</div>
                                        <div>
                                            <CardTitle className="text-sm font-semibold">{getRmName(goal.rmId)}</CardTitle>
                                            <CardDescription className="text-[10px]">{goal.quarter}</CardDescription>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted bg-surface px-2 py-1 rounded border border-border font-semibold uppercase">{goal.goals.length} Goals</span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {goal.goals.map((g, i) => {
                                    const progress = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
                                    return (
                                        <div key={i}>
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-xs font-medium">{g.label}</p>
                                                <p className="text-xs text-muted">{g.current} / {g.target}</p>
                                            </div>
                                            <div className="h-2 bg-surface rounded-full overflow-hidden border border-border/50">
                                                <div className={`h-full rounded-full transition-all duration-700 ${progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-accent' : 'bg-amber-400'}`}
                                                    style={{ width: `${progress}%` }} />
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[10px] text-muted">{progress.toFixed(0)}%</span>
                                                <input type="number" className="w-16 text-[10px] border border-border rounded px-1.5 py-0.5 text-right outline-none focus:border-primary"
                                                    placeholder="Update"
                                                    onBlur={e => { const v = parseInt(e.target.value); if (!isNaN(v)) updateRmGoalProgress(goal.id, g.label, v); e.target.value = ''; }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-lg font-medium">Set Quarterly Goals</h3>
                            <button onClick={() => setShowCreate(false)} className="text-muted hover:text-foreground p-1.5 rounded-lg"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">RM</label>
                                    <select className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={selectedRm} onChange={e => setSelectedRm(e.target.value)}>
                                        <option value="">Select RM</option>
                                        {rms.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Quarter</label>
                                    <select className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={quarter} onChange={e => setQuarter(e.target.value)}>
                                        <option>Q1 2026</option>
                                        <option>Q2 2026</option>
                                        <option>Q3 2026</option>
                                        <option>Q4 2026</option>
                                    </select>
                                </div>
                            </div>
                            {goals.map((g, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={g.label}
                                        onChange={e => { const ng = [...goals]; ng[i].label = e.target.value; setGoals(ng); }} />
                                    <input type="number" className="w-24 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Target"
                                        value={g.target || ''} onChange={e => { const ng = [...goals]; ng[i].target = parseInt(e.target.value) || 0; setGoals(ng); }} />
                                    <button onClick={() => setGoals(goals.filter((_, j) => j !== i))} className="text-muted hover:text-red-500"><Icon name="XMarkIcon" size={16} /></button>
                                </div>
                            ))}
                            <button onClick={() => setGoals([...goals, { label: '', target: 0, current: 0 }])} className="text-xs text-primary font-semibold flex items-center gap-1">
                                <Icon name="PlusIcon" size={14} /> Add Goal
                            </button>
                        </div>
                        <div className="px-5 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button className="bg-primary text-white" onClick={handleCreate}>Save Goals</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
