'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/utils/supabase/client';

interface ProfileFields {
    name: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
}

const emptyProfile: ProfileFields = {
    name: '', email: '', phone: '', dob: '',
    address: '', city: '', state: '', pincode: '',
};

export default function ProfileTab({ roleLabel }: { roleLabel: string }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<ProfileFields>(emptyProfile);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<ProfileFields>(emptyProfile);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const supabase = createClient();
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            const loaded: ProfileFields = {
                name: profileData?.name || user.name || '',
                email: profileData?.email || user.email || '',
                phone: profileData?.phone || '',
                dob: profileData?.dob || '',
                address: profileData?.address || '',
                city: profileData?.city || '',
                state: profileData?.state || '',
                pincode: profileData?.pincode || '',
            };
            setProfile(loaded);
            setDraft(loaded);
            setLoading(false);
        };
        load();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setMessage(null);
        const supabase = createClient();
        const { error } = await supabase
            .from('profiles')
            .update({
                name: draft.name,
                phone: draft.phone,
                dob: draft.dob || null,
                address: draft.address,
                city: draft.city,
                state: draft.state,
                pincode: draft.pincode,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (error) {
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } else {
            setProfile(draft);
            setEditing(false);
            setMessage({ type: 'success', text: 'Profile updated successfully.' });
        }
        setSaving(false);
    };

    const handleCancel = () => {
        setDraft(profile);
        setEditing(false);
        setMessage(null);
    };

    const update = (field: keyof ProfileFields, value: string) => {
        setDraft(prev => ({ ...prev, [field]: value }));
    };

    if (!user) return null;

    const profileValues = Object.values(profile);
    const completedFields = profileValues.filter(v => v && v.trim() !== '').length;
    const totalFields = profileValues.length;
    const completionPct = Math.round((completedFields / totalFields) * 100);

    const Field = ({ label, field, type = 'text', disabled = false }: { label: string; field: keyof ProfileFields; type?: string; disabled?: boolean }) => (
        <div>
            <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>
            {editing && !disabled ? (
                <Input
                    type={type}
                    value={draft[field]}
                    onChange={e => update(field, e.target.value)}
                    className="h-10"
                />
            ) : (
                <p className="text-sm text-foreground py-2 px-3 bg-surface rounded-lg border border-border min-h-[40px] flex items-center">
                    {profile[field] || <span className="text-muted/50 italic">Not provided</span>}
                </p>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-display font-light tracking-tight text-foreground">My Profile</h2>
                    <p className="text-muted text-sm">Manage your personal details.</p>
                </div>
                {!editing ? (
                    <Button onClick={() => setEditing(true)} className="gap-2">
                        <Icon name="PencilSquareIcon" size={16} />
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            {saving && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                )}
            </div>

            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <Icon name={message.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={16} />
                    {message.text}
                </div>
            )}

            {/* Profile Completion */}
            <Card>
                <CardContent className="py-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Profile Completion</span>
                        <span className="text-sm font-bold text-primary">{completionPct}%</span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${completionPct}%` }}
                        />
                    </div>
                    {completionPct < 100 && (
                        <p className="text-xs text-muted mt-2">Complete your profile for a better experience.</p>
                    )}
                </CardContent>
            </Card>

            {/* Avatar & Basic Info */}
            <Card>
                <CardContent className="py-6">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold font-display border-2 border-primary/20 uppercase shrink-0">
                            {(profile.name || user.name || '?').charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-semibold text-foreground truncate">{profile.name || user.name}</h2>
                            <p className="text-sm text-muted truncate">{profile.email || user.email}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 mt-1.5">
                                <Icon name="UserIcon" size={10} /> {roleLabel}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Icon name="UserIcon" size={18} className="text-primary" />
                        Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Full Name" field="name" />
                        <Field label="Email Address" field="email" type="email" disabled />
                        <Field label="Phone Number" field="phone" type="tel" />
                        <Field label="Date of Birth" field="dob" type="date" />
                    </div>
                </CardContent>
            </Card>

            {/* Address */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Icon name="MapPinIcon" size={18} className="text-primary" />
                        Address
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Field label="Street Address" field="address" />
                        </div>
                        <Field label="City" field="city" />
                        <Field label="State" field="state" />
                        <Field label="Pincode" field="pincode" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
