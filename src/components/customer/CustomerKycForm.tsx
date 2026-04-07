'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/utils/supabase/client';

interface KycData {
    id?: string;
    pan_number: string;
    aadhar_number: string;
    bank_details: { account_name: string; account_number: string; ifsc: string };
    demat_details: { dp_id: string; client_id: string; depository: string };
    cmr_url: string;
    cmr_status: string;
    kyc_status: string;
    rejection_reason?: string;
}

const INITIAL_KYC: KycData = {
    pan_number: '',
    aadhar_number: '',
    bank_details: { account_name: '', account_number: '', ifsc: '' },
    demat_details: { dp_id: '', client_id: '', depository: 'CDSL' },
    cmr_url: '',
    cmr_status: 'not_uploaded',
    kyc_status: 'not_started',
};

export default function CustomerKycForm() {
    const { user } = useAuth();
    const [kycData, setKycData] = useState<KycData>(INITIAL_KYC);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cmrFile, setCmrFile] = useState<File | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchKyc = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('customer_kyc')
                .select('*')
                .eq('user_id', user.id)
                .single();
            if (data) {
                setKycData({
                    id: data.id,
                    pan_number: data.pan_number || '',
                    aadhar_number: data.aadhar_number || '',
                    bank_details: data.bank_details || INITIAL_KYC.bank_details,
                    demat_details: data.demat_details || INITIAL_KYC.demat_details,
                    cmr_url: data.cmr_url || '',
                    cmr_status: data.cmr_status || 'not_uploaded',
                    kyc_status: data.kyc_status || 'not_started',
                    rejection_reason: data.rejection_reason,
                });
            }
            setLoading(false);
        };
        fetchKyc();
    }, [user]);

    const handleSubmit = async () => {
        if (!user) return;
        setSaving(true);
        const supabase = createClient();

        const payload = {
            user_id: user.id,
            pan_number: kycData.pan_number,
            aadhar_number: kycData.aadhar_number,
            bank_details: kycData.bank_details,
            demat_details: kycData.demat_details,
            cmr_url: kycData.cmr_url || `https://storage.sharesaathi.com/cmr/${user.id}/${cmrFile?.name || 'cmr'}`,
            cmr_status: cmrFile ? 'pending' : kycData.cmr_status,
            kyc_status: 'pending',
            submitted_at: new Date().toISOString(),
        };

        await supabase.from('customer_kyc').upsert(payload, { onConflict: 'user_id' });
        setKycData(prev => ({ ...prev, kyc_status: 'pending', cmr_status: cmrFile ? 'pending' : prev.cmr_status }));
        setSaving(false);
    };

    const isApproved = kycData.kyc_status === 'approved';
    const isPending = kycData.kyc_status === 'pending';
    const isRejected = kycData.kyc_status === 'rejected';

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status banner */}
            {isApproved && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <Icon name="CheckBadgeIcon" size={24} className="text-green-600" />
                    <div>
                        <p className="font-semibold text-green-700">KYC Verified</p>
                        <p className="text-sm text-green-600">Your identity has been verified. You can now trade on the platform.</p>
                    </div>
                </div>
            )}
            {isPending && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <Icon name="ClockIcon" size={24} className="text-blue-600" />
                    <div>
                        <p className="font-semibold text-blue-700">KYC Under Review</p>
                        <p className="text-sm text-blue-600">Your documents are being verified. This usually takes 24-48 hours.</p>
                    </div>
                </div>
            )}
            {isRejected && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <Icon name="ExclamationTriangleIcon" size={24} className="text-red-600" />
                    <div>
                        <p className="font-semibold text-red-700">KYC Rejected</p>
                        <p className="text-sm text-red-600">{kycData.rejection_reason || 'Please update your documents and resubmit.'}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="border-b border-border/50">
                            <CardTitle className="font-display text-lg font-medium">Identity Documents</CardTitle>
                            <CardDescription className="text-muted">Required for compliance with SEBI regulations.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">PAN Number</label>
                                    <Input
                                        placeholder="ABCDE1234F"
                                        value={kycData.pan_number}
                                        onChange={e => setKycData(p => ({ ...p, pan_number: e.target.value.toUpperCase() }))}
                                        disabled={isApproved}
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Aadhar Number</label>
                                    <Input
                                        placeholder="1234 5678 9012"
                                        value={kycData.aadhar_number}
                                        onChange={e => setKycData(p => ({ ...p, aadhar_number: e.target.value }))}
                                        disabled={isApproved}
                                        maxLength={14}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm">
                        <CardHeader className="border-b border-border/50">
                            <CardTitle className="font-display text-lg font-medium">Bank Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Account Holder Name</label>
                                <Input
                                    value={kycData.bank_details.account_name}
                                    onChange={e => setKycData(p => ({ ...p, bank_details: { ...p.bank_details, account_name: e.target.value } }))}
                                    disabled={isApproved}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Account Number</label>
                                    <Input
                                        value={kycData.bank_details.account_number}
                                        onChange={e => setKycData(p => ({ ...p, bank_details: { ...p.bank_details, account_number: e.target.value } }))}
                                        disabled={isApproved}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">IFSC Code</label>
                                    <Input
                                        placeholder="SBIN0001234"
                                        value={kycData.bank_details.ifsc}
                                        onChange={e => setKycData(p => ({ ...p, bank_details: { ...p.bank_details, ifsc: e.target.value.toUpperCase() } }))}
                                        disabled={isApproved}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm">
                        <CardHeader className="border-b border-border/50">
                            <CardTitle className="font-display text-lg font-medium">Demat Account</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">DP ID</label>
                                    <Input
                                        value={kycData.demat_details.dp_id}
                                        onChange={e => setKycData(p => ({ ...p, demat_details: { ...p.demat_details, dp_id: e.target.value } }))}
                                        disabled={isApproved}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Client ID</label>
                                    <Input
                                        value={kycData.demat_details.client_id}
                                        onChange={e => setKycData(p => ({ ...p, demat_details: { ...p.demat_details, client_id: e.target.value } }))}
                                        disabled={isApproved}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1">Depository</label>
                                    <select
                                        className="w-full h-9 px-3 border border-border rounded-md text-sm bg-background"
                                        value={kycData.demat_details.depository}
                                        onChange={e => setKycData(p => ({ ...p, demat_details: { ...p.demat_details, depository: e.target.value } }))}
                                        disabled={isApproved}
                                    >
                                        <option value="CDSL">CDSL</option>
                                        <option value="NSDL">NSDL</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm">
                        <CardHeader className="border-b border-border/50">
                            <CardTitle className="font-display text-lg font-medium">CMR Document</CardTitle>
                            <CardDescription>Upload your Client Master Report from your broker.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    {!isApproved && (
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={e => setCmrFile(e.target.files?.[0] || null)}
                                            className="text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                        />
                                    )}
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                    kycData.cmr_status === 'verified' ? 'bg-green-50 text-green-600 border-green-200' :
                                    kycData.cmr_status === 'pending' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                    kycData.cmr_status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                    'bg-surface text-muted border-border'
                                }`}>
                                    {kycData.cmr_status.replace('_', ' ')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {!isApproved && (
                        <Button
                            className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-sm font-semibold"
                            onClick={handleSubmit}
                            disabled={saving || !kycData.pan_number || !kycData.aadhar_number}
                        >
                            {saving ? 'Submitting...' : isPending ? 'Update & Resubmit' : 'Submit KYC Documents'}
                        </Button>
                    )}
                </div>

                {/* Info sidebar */}
                <div className="space-y-4">
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Icon name="InformationCircleIcon" size={18} className="text-primary" />
                                Why KYC?
                            </h3>
                            <ul className="space-y-2 text-sm text-muted">
                                <li className="flex items-start gap-2">
                                    <Icon name="CheckIcon" size={14} className="mt-0.5 text-green-500 shrink-0" />
                                    Required by SEBI for share transfers
                                </li>
                                <li className="flex items-start gap-2">
                                    <Icon name="CheckIcon" size={14} className="mt-0.5 text-green-500 shrink-0" />
                                    Enables seamless demat transfers
                                </li>
                                <li className="flex items-start gap-2">
                                    <Icon name="CheckIcon" size={14} className="mt-0.5 text-green-500 shrink-0" />
                                    One-time verification process
                                </li>
                                <li className="flex items-start gap-2">
                                    <Icon name="CheckIcon" size={14} className="mt-0.5 text-green-500 shrink-0" />
                                    Bank details used for payouts
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-foreground mb-3">Documents Needed</h3>
                            <ul className="space-y-2 text-sm text-muted">
                                <li>PAN Card (10-digit alphanumeric)</li>
                                <li>Aadhar Card (12-digit number)</li>
                                <li>Bank Account Details + IFSC</li>
                                <li>Demat Account (DP ID + Client ID)</li>
                                <li>CMR (Client Master Report) from broker</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
