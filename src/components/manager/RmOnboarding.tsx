'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CHECKLIST = [
    'Complete platform walkthrough',
    'Review product catalog and pricing',
    'Shadow a senior RM for 3 client calls',
    'Complete compliance training module',
    'Set up CRM access and templates',
    'First independent client outreach (5 calls)',
    'Submit first lead via platform',
    'Manager sign-off on onboarding',
];

export default function RmOnboarding() {
    const { onboardingTasks, addOnboardingTask, toggleOnboardingTask, users } = useAppStore();
    const [showCreate, setShowCreate] = useState(false);
    const [selectedRm, setSelectedRm] = useState('');

    const rms = users.filter(u => u.role === 'rm');
    const getRmName = (id: string) => users.find(u => u.id === id)?.name || id;

    // Group tasks by RM
    const rmTasks = rms.map(rm => ({
        ...rm,
        tasks: onboardingTasks.filter(t => t.rmId === rm.id),
    })).filter(rm => rm.tasks.length > 0);

    const handleInit = () => {
        if (!selectedRm) return;
        DEFAULT_CHECKLIST.forEach((task, i) => {
            addOnboardingTask({
                id: uuidv4(),
                rmId: selectedRm,
                task,
                completed: false,
                dueDate: new Date(Date.now() + (i + 1) * 2 * 86400000).toISOString().split('T')[0],
            });
        });
        setShowCreate(false);
        setSelectedRm('');
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-display font-medium text-foreground">RM Onboarding</h2>
                    <p className="text-sm text-muted">Track new RM training progress and checklist completion.</p>
                </div>
                <Button className="bg-primary text-white" onClick={() => setShowCreate(true)}>
                    <Icon name="UserPlusIcon" size={16} className="mr-2" /> Start Onboarding
                </Button>
            </div>

            {rmTasks.length === 0 ? (
                <Card className="border-border shadow-sm">
                    <CardContent className="p-12 text-center text-muted">
                        <Icon name="AcademicCapIcon" size={32} className="mx-auto mb-3 opacity-40" />
                        <p>No active onboarding. Start one for a new RM to track their training progress.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rmTasks.map(rm => {
                        const completed = rm.tasks.filter(t => t.completed).length;
                        const total = rm.tasks.length;
                        const progress = total > 0 ? (completed / total) * 100 : 0;
                        return (
                            <Card key={rm.id} className="border-border shadow-sm bg-white">
                                <CardHeader className="border-b border-border/50 pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{rm.name.charAt(0)}</div>
                                            <div>
                                                <CardTitle className="text-sm font-semibold">{rm.name}</CardTitle>
                                                <CardDescription className="text-[10px]">{completed}/{total} tasks complete</CardDescription>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-foreground">{progress.toFixed(0)}%</p>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-surface rounded-full overflow-hidden mt-3 border border-border/50">
                                        <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border">
                                        {rm.tasks.map(task => (
                                            <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface/30 cursor-pointer" onClick={() => toggleOnboardingTask(task.id)}>
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500' : 'border-border'}`}>
                                                    {task.completed && <Icon name="CheckIcon" size={12} className="text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm ${task.completed ? 'line-through text-muted' : 'text-foreground'}`}>{task.task}</p>
                                                </div>
                                                <span className="text-[10px] text-muted">{new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-lg font-medium">Start RM Onboarding</h3>
                            <button onClick={() => setShowCreate(false)} className="text-muted hover:text-foreground p-1.5 rounded-lg"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Select RM</label>
                                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={selectedRm} onChange={e => setSelectedRm(e.target.value)}>
                                    <option value="">Choose...</option>
                                    {rms.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground mb-2">Default Checklist ({DEFAULT_CHECKLIST.length} items)</p>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                    {DEFAULT_CHECKLIST.map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-muted">
                                            <div className="w-4 h-4 rounded border border-border flex items-center justify-center shrink-0">
                                                <span className="text-[9px]">{i + 1}</span>
                                            </div>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button className="bg-primary text-white" onClick={handleInit}>Initialize Onboarding</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
