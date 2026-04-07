'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';

interface Nominee {
    id: string;
    name: string;
    relationship: string;
    dob: string;
    pan: string;
    phone: string;
    email: string;
    percentage: number;
    address: string;
    createdAt: string;
}

const relationships = ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'];

export default function NomineePage() {
    const [nominees, setNominees] = useState<Nominee[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '', relationship: relationships[0], dob: '', pan: '', phone: '', email: '', percentage: 100, address: '',
    });

    const totalPercentage = nominees.reduce((s, n) => s + n.percentage, 0);
    const remainingPercentage = 100 - totalPercentage;

    const resetForm = () => {
        setForm({ name: '', relationship: relationships[0], dob: '', pan: '', phone: '', email: '', percentage: Math.min(100, remainingPercentage), address: '' });
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.pan.trim()) return;

        if (editingId) {
            setNominees(prev => prev.map(n => n.id === editingId ? { ...n, ...form, id: editingId } : n));
        } else {
            const newNominee: Nominee = {
                id: `nom_${Date.now()}`,
                ...form,
                createdAt: new Date().toISOString(),
            };
            setNominees(prev => [...prev, newNominee]);
        }
        resetForm();
        setShowForm(false);
    };

    const editNominee = (nominee: Nominee) => {
        setForm({
            name: nominee.name, relationship: nominee.relationship, dob: nominee.dob,
            pan: nominee.pan, phone: nominee.phone, email: nominee.email,
            percentage: nominee.percentage, address: nominee.address,
        });
        setEditingId(nominee.id);
        setShowForm(true);
    };

    const removeNominee = (id: string) => {
        setNominees(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-3xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                            <Icon name="ArrowLeftIcon" size={18} />
                        </Link>
                        <h1 className="text-3xl font-display font-light tracking-tight text-foreground">Nominee Management</h1>
                    </div>
                    <p className="text-muted mt-1">Add or update nominee details for your unlisted share holdings.</p>
                </div>
                {!showForm && (
                    <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary text-white hover:bg-primary/90" disabled={remainingPercentage <= 0}>
                        <Icon name="PlusIcon" size={16} className="mr-1" /> Add Nominee
                    </Button>
                )}
            </div>

            {/* Allocation Bar */}
            {nominees.length > 0 && (
                <div className="mb-6 bg-white border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-muted uppercase tracking-wider">Allocation</span>
                        <span className={`text-xs font-bold ${totalPercentage === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                            {totalPercentage}% allocated {totalPercentage < 100 && `· ${remainingPercentage}% remaining`}
                        </span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden flex bg-surface">
                        {nominees.map((n, i) => {
                            const colors = ['bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                            return (
                                <div key={n.id} className={`h-full ${colors[i % colors.length]} transition-all`} style={{ width: `${n.percentage}%` }} title={`${n.name}: ${n.percentage}%`} />
                            );
                        })}
                    </div>
                    <div className="flex gap-3 mt-2 flex-wrap">
                        {nominees.map((n, i) => {
                            const dotColors = ['bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                            return (
                                <span key={n.id} className="inline-flex items-center gap-1 text-[10px] text-muted">
                                    <span className={`w-2 h-2 rounded-full ${dotColors[i % dotColors.length]}`} />
                                    {n.name} ({n.percentage}%)
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <Card className="border-border shadow-sm mb-6">
                    <CardHeader className="border-b border-border/50 bg-white pb-3">
                        <CardTitle className="font-display font-medium text-lg">{editingId ? 'Edit Nominee' : 'Add Nominee'}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Full Name *</label>
                                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="As per PAN card" className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Relationship *</label>
                                    <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                                        {relationships.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Date of Birth</label>
                                    <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">PAN Number *</label>
                                    <input type="text" value={form.pan} onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" maxLength={10} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" required />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Phone</label>
                                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Email</label>
                                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="nominee@example.com" className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Share Percentage *</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={form.percentage} onChange={e => setForm(f => ({ ...f, percentage: Math.min(editingId ? 100 : remainingPercentage, Math.max(1, parseInt(e.target.value) || 1)) }))} min={1} max={editingId ? 100 : remainingPercentage} className="w-24 bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        <span className="text-sm text-muted">%</span>
                                        {!editingId && <span className="text-xs text-muted">(max {remainingPercentage}%)</span>}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Address</label>
                                <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full residential address" rows={2} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
                                <Button type="submit" className="bg-primary text-white hover:bg-primary/90">{editingId ? 'Update' : 'Add'} Nominee</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Nominees List */}
            {nominees.length === 0 && !showForm ? (
                <div className="py-20 text-center">
                    <Icon name="UsersIcon" size={40} className="mx-auto text-muted mb-4" />
                    <p className="text-muted font-medium mb-2">No nominees added yet.</p>
                    <p className="text-xs text-muted mb-4">Add nominees to ensure smooth transmission of your holdings.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {nominees.map(nominee => (
                        <Card key={nominee.id} className="border-border shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                                        {nominee.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="text-sm font-semibold text-foreground">{nominee.name}</h3>
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{nominee.relationship}</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted mt-2">
                                            <div><span className="font-semibold">PAN:</span> {nominee.pan}</div>
                                            {nominee.phone && <div><span className="font-semibold">Phone:</span> {nominee.phone}</div>}
                                            {nominee.email && <div><span className="font-semibold">Email:</span> {nominee.email}</div>}
                                            {nominee.dob && <div><span className="font-semibold">DOB:</span> {new Date(nominee.dob).toLocaleDateString('en-IN')}</div>}
                                        </div>
                                    </div>
                                    <div className="text-center shrink-0">
                                        <p className="text-lg font-bold text-primary">{nominee.percentage}%</p>
                                        <p className="text-[8px] font-bold text-muted uppercase">Share</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => editNominee(nominee)} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors">
                                            <Icon name="PencilIcon" size={14} />
                                        </button>
                                        <button onClick={() => removeNominee(nominee.id)} className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors">
                                            <Icon name="TrashIcon" size={14} />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-2">
                    <Icon name="InformationCircleIcon" size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800">
                        <p className="font-semibold mb-1">Why add a nominee?</p>
                        <p>Nomination ensures your unlisted share holdings are transmitted to your chosen beneficiary in case of an unforeseen event. It simplifies the claim process and avoids legal complications. Total allocation must equal 100%.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
