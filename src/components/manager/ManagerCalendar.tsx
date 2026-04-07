'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAppStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';

const typeColors: Record<string, string> = {
    meeting: 'bg-blue-50 text-blue-600 border-blue-200',
    review: 'bg-purple-50 text-purple-600 border-purple-200',
    followup: 'bg-amber-50 text-amber-600 border-amber-200',
    deadline: 'bg-red-50 text-red-600 border-red-200',
};

export default function ManagerCalendar() {
    const { calendarEvents, addCalendarEvent, removeCalendarEvent, users } = useAppStore();
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ title: '', rmId: '', date: new Date().toISOString().split('T')[0], time: '10:00', type: 'meeting' as const, notes: '' });

    const rms = users.filter(u => u.role === 'rm');
    const getRmName = (id: string) => users.find(u => u.id === id)?.name || '';

    const today = new Date().toISOString().split('T')[0];
    const todayEvents = calendarEvents.filter(e => e.date === today).sort((a, b) => a.time.localeCompare(b.time));
    const upcomingEvents = calendarEvents.filter(e => e.date > today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    const handleAdd = () => {
        if (!form.title.trim()) return;
        addCalendarEvent({ id: uuidv4(), ...form });
        setForm({ title: '', rmId: '', date: new Date().toISOString().split('T')[0], time: '10:00', type: 'meeting', notes: '' });
        setShowAdd(false);
    };

    // Build week view
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return { date: d.toISOString().split('T')[0], dayName: d.toLocaleDateString('en', { weekday: 'short' }), dayNum: d.getDate(), isToday: i === 0 };
    });

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-display font-medium text-foreground">Calendar & Meetings</h2>
                    <p className="text-sm text-muted">Schedule 1:1s, reviews, and follow-ups with your team.</p>
                </div>
                <Button className="bg-primary text-white" onClick={() => setShowAdd(true)}>
                    <Icon name="PlusIcon" size={16} className="mr-2" /> Add Event
                </Button>
            </div>

            {/* Week Strip */}
            <div className="grid grid-cols-7 gap-2 mb-6">
                {weekDays.map(day => {
                    const dayEvents = calendarEvents.filter(e => e.date === day.date);
                    return (
                        <Card key={day.date} className={`border shadow-sm ${day.isToday ? 'border-primary bg-primary/5' : 'border-border bg-white'}`}>
                            <CardContent className="py-3 px-2 text-center">
                                <p className={`text-[10px] uppercase tracking-wider font-semibold ${day.isToday ? 'text-primary' : 'text-muted'}`}>{day.dayName}</p>
                                <p className={`text-lg font-bold ${day.isToday ? 'text-primary' : 'text-foreground'}`}>{day.dayNum}</p>
                                {dayEvents.length > 0 && (
                                    <div className="flex justify-center gap-1 mt-1">
                                        {dayEvents.slice(0, 3).map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Today */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Today's Schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        {todayEvents.length === 0 ? (
                            <div className="p-8 text-center text-muted text-sm">No events scheduled for today.</div>
                        ) : (
                            <div className="divide-y divide-border">
                                {todayEvents.map(event => (
                                    <div key={event.id} className="flex items-start gap-3 px-5 py-4 hover:bg-surface/30">
                                        <div className="text-center shrink-0 w-12">
                                            <p className="text-sm font-bold text-foreground">{event.time}</p>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm">{event.title}</p>
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${typeColors[event.type]}`}>{event.type}</span>
                                            </div>
                                            {event.rmId && <p className="text-xs text-muted mt-0.5">with {getRmName(event.rmId)}</p>}
                                            {event.notes && <p className="text-xs text-muted mt-1 italic">{event.notes}</p>}
                                        </div>
                                        <button onClick={() => removeCalendarEvent(event.id)} className="text-muted hover:text-red-500 p-1"><Icon name="TrashIcon" size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white">
                        <CardTitle className="font-display font-medium text-lg">Upcoming Events</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        {upcomingEvents.length === 0 ? (
                            <div className="p-8 text-center text-muted text-sm">No upcoming events.</div>
                        ) : (
                            <div className="divide-y divide-border">
                                {upcomingEvents.slice(0, 8).map(event => (
                                    <div key={event.id} className="flex items-start gap-3 px-5 py-4 hover:bg-surface/30">
                                        <div className="text-center shrink-0 w-16">
                                            <p className="text-xs font-bold text-foreground">{new Date(event.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
                                            <p className="text-[10px] text-muted">{event.time}</p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{event.title}</p>
                                            {event.rmId && <p className="text-xs text-muted mt-0.5">with {getRmName(event.rmId)}</p>}
                                        </div>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0 ${typeColors[event.type]}`}>{event.type}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
                            <h3 className="font-display text-lg font-medium">New Event</h3>
                            <button onClick={() => setShowAdd(false)} className="text-muted hover:text-foreground p-1.5 rounded-lg"><Icon name="XMarkIcon" size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Title</label>
                                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Date</label>
                                    <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Time</label>
                                    <input type="time" className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">Type</label>
                                    <select className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
                                        <option value="meeting">Meeting</option>
                                        <option value="review">Review</option>
                                        <option value="followup">Follow-up</option>
                                        <option value="deadline">Deadline</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-foreground mb-1 block">With RM</label>
                                    <select className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value={form.rmId} onChange={e => setForm({ ...form, rmId: e.target.value })}>
                                        <option value="">No specific RM</option>
                                        {rms.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-1 block">Notes</label>
                                <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none h-20" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-border bg-surface/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                            <Button className="bg-primary text-white" onClick={handleAdd}>Add Event</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
