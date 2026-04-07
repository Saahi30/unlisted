'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';

export default function ManagerBroadcast() {
    const { broadcasts, addBroadcast, users } = useAppStore();
    const [showCompose, setShowCompose] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [selectedRms, setSelectedRms] = useState<string[]>([]);

    const rms = users.filter(u => u.role === 'rm');
    const getRmName = (id: string) => users.find(u => u.id === id)?.name || id;

    const handleSend = () => {
        if (!subject.trim() || !message.trim()) return;
        const targets = selectedRms.length === 0 ? rms.map(r => r.id) : selectedRms;
        addBroadcast({
            id: uuidv4(),
            from: 'mgr_1',
            to: targets,
            subject,
            message,
            createdAt: new Date().toISOString(),
            readBy: [],
        });
        setSubject('');
        setMessage('');
        setSelectedRms([]);
        setShowCompose(false);
    };

    const toggleRm = (id: string) => {
        setSelectedRms(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-display font-medium text-foreground">Team Communication</h2>
                    <p className="text-sm text-muted">Send announcements and messages to your RMs.</p>
                </div>
                <Button className="bg-primary text-white" onClick={() => setShowCompose(true)}>
                    <Icon name="PencilSquareIcon" size={16} className="mr-2" /> New Broadcast
                </Button>
            </div>

            <div className="space-y-4">
                {broadcasts.length === 0 ? (
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-12 text-center text-muted">
                            <Icon name="ChatBubbleLeftRightIcon" size={32} className="mx-auto mb-3 opacity-40" />
                            <p>No broadcasts sent yet. Start communicating with your team.</p>
                        </CardContent>
                    </Card>
                ) : broadcasts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(bc => (
                    <Card key={bc.id} className="border-border shadow-sm bg-white">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">S</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-sm text-foreground">{bc.subject}</p>
                                            <span className="text-[10px] text-muted">{new Date(bc.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-muted">{bc.message}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Sent to:</span>
                                            {bc.to.map(id => (
                                                <span key={id} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-surface text-muted border border-border">
                                                    {getRmName(id)}
                                                    {bc.readBy.includes(id) && <Icon name="CheckIcon" size={10} className="ml-1 text-green-500" />}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-[10px] text-muted">{bc.readBy.length}/{bc.to.length} read</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {showCompose && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-lg font-medium">New Broadcast</h3>
                            <button onClick={() => setShowCompose(false)} className="text-muted hover:text-foreground p-1.5 rounded-lg"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Recipients</label>
                                <div className="flex flex-wrap gap-2">
                                    {rms.map(rm => (
                                        <button key={rm.id} onClick={() => toggleRm(rm.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedRms.includes(rm.id) ? 'bg-primary text-white border-primary' : 'bg-surface text-muted border-border hover:border-primary'}`}>
                                            {rm.name}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-muted mt-1">{selectedRms.length === 0 ? 'Sending to all RMs' : `${selectedRms.length} selected`}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Subject</label>
                                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Announcement subject..." />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Message</label>
                                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none h-32" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message..." />
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
                            <Button className="bg-primary text-white" onClick={handleSend}>Send Broadcast</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
