'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

interface KycInfo {
    pan_number: string;
    aadhar_number: string;
    kyc_status: string;
    bank_details: { bank_name?: string; account_number?: string; ifsc?: string };
    demat_details: { demat_id?: string; depository?: string };
}

const emptyProfile: ProfileFields = {
    name: '', email: '', phone: '', dob: '',
    address: '', city: '', state: '', pincode: '',
};

const emptyKyc: KycInfo = {
    pan_number: '', aadhar_number: '', kyc_status: 'not_started',
    bank_details: {}, demat_details: {},
};

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<ProfileFields>(emptyProfile);
    const [kyc, setKyc] = useState<KycInfo>(emptyKyc);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<ProfileFields>(emptyProfile);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const supabase = createClient();
            const [{ data: profileData }, { data: kycData }] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('customer_kyc').select('*').eq('user_id', user.id).single(),
            ]);

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

            if (kycData) {
                setKyc({
                    pan_number: kycData.pan_number || '',
                    aadhar_number: kycData.aadhar_number || '',
                    kyc_status: kycData.kyc_status || 'not_started',
                    bank_details: kycData.bank_details || {},
                    demat_details: kycData.demat_details || {},
                });
            }
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

    const kycStatusLabel: Record<string, { text: string; color: string }> = {
        not_started: { text: 'Not Started', color: 'bg-gray-100 text-gray-600' },
        pending: { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-700' },
        approved: { text: 'Verified', color: 'bg-green-100 text-green-700' },
        rejected: { text: 'Rejected', color: 'bg-red-100 text-red-700' },
    };
    const kycBadge = kycStatusLabel[kyc.kyc_status] || kycStatusLabel.not_started;

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

    const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
        <div>
            <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>
            <p className="text-sm text-foreground py-2 px-3 bg-surface rounded-lg border border-border min-h-[40px] flex items-center">
                {value || <span className="text-muted/50 italic">Not provided</span>}
            </p>
        </div>
    );

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-4xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/customer" className="text-muted hover:text-foreground transition-colors">
                            <Icon name="ArrowLeftIcon" size={18} />
                        </Link>
                        <h1 className="text-3xl font-display font-light tracking-tight text-foreground">My Profile</h1>
                    </div>
                    <p className="text-muted text-sm ml-6">Manage your personal and financial details.</p>
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
                <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <Icon name={message.type === 'success' ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={16} />
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
            ) : (
                <div className="space-y-6">
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
                                <p className="text-xs text-muted mt-2">Complete your profile to enable faster order processing and KYC verification.</p>
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
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${kycBadge.color}`}>
                                            <Icon name="ShieldCheckIcon" size={10} /> KYC {kycBadge.text}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                            <Icon name="UserIcon" size={10} /> Customer
                                        </span>
                                    </div>
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

                    {/* KYC & Identity (read-only, from customer_kyc) */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Icon name="IdentificationIcon" size={18} className="text-primary" />
                                    KYC & Identity
                                </CardTitle>
                                <Link href="/dashboard/customer?tab=kyc" className="text-xs text-primary hover:underline">
                                    Update via KYC
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ReadOnlyField label="PAN Number" value={kyc.pan_number} />
                                <ReadOnlyField label="Aadhar Number" value={kyc.aadhar_number ? `XXXX-XXXX-${kyc.aadhar_number.slice(-4)}` : ''} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bank Details (read-only, from customer_kyc) */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Icon name="BuildingLibraryIcon" size={18} className="text-primary" />
                                    Bank Details
                                </CardTitle>
                                <Link href="/dashboard/customer?tab=kyc" className="text-xs text-primary hover:underline">
                                    Update via KYC
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ReadOnlyField label="Bank Name" value={kyc.bank_details?.bank_name || ''} />
                                <ReadOnlyField label="Account Number" value={kyc.bank_details?.account_number || ''} />
                                <ReadOnlyField label="IFSC Code" value={kyc.bank_details?.ifsc || ''} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Demat Details (read-only, from customer_kyc) */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Icon name="DocumentDuplicateIcon" size={18} className="text-primary" />
                                    Demat Account
                                </CardTitle>
                                <Link href="/dashboard/customer?tab=kyc" className="text-xs text-primary hover:underline">
                                    Update via KYC
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ReadOnlyField label="Demat Account ID" value={kyc.demat_details?.demat_id || ''} />
                                <ReadOnlyField label="Depository" value={kyc.demat_details?.depository || ''} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Links */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Icon name="LinkIcon" size={18} className="text-primary" />
                                Quick Links
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                <Link href="/dashboard/customer?tab=kyc" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface transition-colors group">
                                    <Icon name="IdentificationIcon" size={20} className="text-muted group-hover:text-primary transition-colors" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">KYC Verification</p>
                                        <p className="text-xs text-muted">Update your documents</p>
                                    </div>
                                </Link>
                                <Link href="/dashboard/customer/nominee" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface transition-colors group">
                                    <Icon name="UsersIcon" size={20} className="text-muted group-hover:text-primary transition-colors" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Nominees</p>
                                        <p className="text-xs text-muted">Manage your nominees</p>
                                    </div>
                                </Link>
                                <Link href="/dashboard/customer/orders" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface transition-colors group">
                                    <Icon name="ClipboardDocumentListIcon" size={20} className="text-muted group-hover:text-primary transition-colors" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">My Orders</p>
                                        <p className="text-xs text-muted">View order history</p>
                                    </div>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
