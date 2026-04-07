'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { useAppStore } from '@/lib/store';

interface CallbackRequest {
    id: string;
    date: string;
    timeSlot: string;
    topic: string;
    phone: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    notes: string;
    createdAt: string;
}

const timeSlots = [
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '2:00 PM - 2:30 PM',
    '2:30 PM - 3:00 PM',
    '3:00 PM - 3:30 PM',
    '3:30 PM - 4:00 PM',
    '4:00 PM - 4:30 PM',
    '4:30 PM - 5:00 PM',
];

const topics = [
    'Portfolio Review',
    'New Investment Guidance',
    'Order Issue',
    'Payment Query',
    'Demat Process',
    'KYC Assistance',
    'Tax Consultation',
    'General Query',
];

export default function CallbackPage() {
    const { user } = useAuth();
    const { users } = useAppStore();
    const assignedRm = users.find(u => u.id === (user as any)?.assignedRmId);
    const rmName = assignedRm?.name || 'Priya Patel';

    const [requests, setRequests] = useState<CallbackRequest[]>([]);
    const [showForm, setShowForm] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        date: '',
        timeSlot: timeSlots[0],
        topic: topics[0],
        phone: '',
        notes: '',
    });

    // Generate available dates (next 7 business days)
    const availableDates = (() => {
        const dates: string[] = [];
        const d = new Date();
        while (dates.length < 7) {
            d.setDate(d.getDate() + 1);
            if (d.getDay() !== 0 && d.getDay() !== 6) {
                dates.push(d.toISOString().split('T')[0]);
            }
        }
        return dates;
    })();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.date || !form.phone.trim()) return;

        const newRequest: CallbackRequest = {
            id: `CB-${1000 + requests.length + 1}`,
            date: form.date,
            timeSlot: form.timeSlot,
            topic: form.topic,
            phone: form.phone,
            status: 'scheduled',
            notes: form.notes,
            createdAt: new Date().toISOString(),
        };

        setRequests(prev => [newRequest, ...prev]);
        setSubmitted(true);
        setShowForm(false);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-3xl">
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                    <Icon name="ArrowLeftIcon" size={18} />
                </Link>
                <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Schedule a Callback</h1>
            </div>
            <p className="text-muted mt-1 mb-8">Book a call with your dedicated RM at a time that works for you.</p>

            {/* RM Info */}
            <div className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                    {rmName.charAt(0)}
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground">{rmName}</p>
                    <p className="text-xs text-muted">Your Dedicated Relationship Manager</p>
                    <p className="text-xs text-muted">Available Mon-Fri, 10 AM - 5 PM IST</p>
                </div>
            </div>

            {/* Success Message */}
            {submitted && !showForm && (
                <Card className="border-green-200 bg-green-50 shadow-sm mb-6">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                            <Icon name="CheckCircleIcon" size={24} className="text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-green-800 mb-1">Callback Scheduled!</h3>
                        <p className="text-sm text-green-700 mb-1">
                            {rmName} will call you on <strong>{formatDate(requests[0]?.date)}</strong> at <strong>{requests[0]?.timeSlot}</strong>
                        </p>
                        <p className="text-xs text-green-600 mb-4">Topic: {requests[0]?.topic}</p>
                        <Button variant="outline" onClick={() => { setShowForm(true); setSubmitted(false); }} className="text-xs">
                            Schedule Another
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Booking Form */}
            {showForm && (
                <Card className="border-border shadow-sm mb-6">
                    <CardHeader className="border-b border-border/50 bg-white pb-3">
                        <CardTitle className="font-display font-medium text-lg">Book Your Slot</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Date Selection */}
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Select Date</label>
                                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                                    {availableDates.map(date => (
                                        <button
                                            key={date}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, date }))}
                                            className={`p-2 rounded-xl border text-center transition-all ${
                                                form.date === date
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-white border-border hover:border-primary/30 text-foreground'
                                            }`}
                                        >
                                            <p className="text-[10px] font-bold uppercase">{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                                            <p className="text-sm font-bold">{new Date(date + 'T00:00:00').getDate()}</p>
                                            <p className="text-[10px]">{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Slot */}
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Select Time Slot</label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {timeSlots.map(slot => (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, timeSlot: slot }))}
                                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                                                form.timeSlot === slot
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-white border-border hover:border-primary/30 text-foreground'
                                            }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Topic & Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Topic</label>
                                    <select
                                        value={form.topic}
                                        onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        {topics.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                        placeholder="+91 98765 43210"
                                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Notes (optional)</label>
                                <textarea
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Any specific topics or questions you'd like to discuss..."
                                    rows={3}
                                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>

                            <Button type="submit" disabled={!form.date} className="w-full bg-primary text-white hover:bg-primary/90">
                                <Icon name="PhoneIcon" size={16} className="mr-2" /> Schedule Callback
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Previous Requests */}
            {requests.length > 0 && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-white pb-3">
                        <CardTitle className="font-display font-medium text-lg">Previous Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                                        <Icon name="PhoneIcon" size={16} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{req.topic}</p>
                                        <p className="text-xs text-muted">{formatDate(req.date)} · {req.timeSlot}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                    req.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {req.status}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
