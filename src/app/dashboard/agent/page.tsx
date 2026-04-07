'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Icon from '@/components/ui/AppIcon';
import AgentMarketplaceTab from '@/components/agent/AgentMarketplaceTab';
import AgentLinksTab from '@/components/agent/AgentLinksTab';
import AgentEarningsTab from '@/components/agent/AgentEarningsTab';
import AgentLeaderboard from '@/components/agent/AgentLeaderboard';
import AgentCRMTab from '@/components/agent/AgentCRMTab';
import AgentAnalyticsTab from '@/components/agent/AgentAnalyticsTab';
import AgentStatementsTab from '@/components/agent/AgentStatementsTab';
import AgentTiersTab from '@/components/agent/AgentTiersTab';
import AgentTrainingTab from '@/components/agent/AgentTrainingTab';
import AgentSupportChat from '@/components/agent/AgentSupportChat';
import AgentMarketingTab from '@/components/agent/AgentMarketingTab';
import AgentFeedbackTab from '@/components/agent/AgentFeedbackTab';
import AgentOnboarding from '@/components/agent/AgentOnboarding';

export default function AgentDashboardPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const activeTab = (searchParams?.get('tab') || 'marketplace') as string;

    const [kycData, setKycData] = useState<any>(null);
    const [kycLoading, setKycLoading] = useState(true);
    const [submittingKyc, setSubmittingKyc] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // KYC Form State
    const [pan, setPan] = useState('');
    const [aadhar, setAadhar] = useState('');
    const [bankDetails, setBankDetails] = useState({ account_name: '', account_number: '', ifsc: '' });
    const [cmrFile, setCmrFile] = useState<File | null>(null);
    const [cmrStatus, setCmrStatus] = useState('not_uploaded');
    const [cmrUrl, setCmrUrl] = useState('');

    const supabase = createClient();

    useEffect(() => {
        if (!user) return;
        const fetchKyc = async () => {
            const { data, error } = await supabase
                .from('agent_profiles')
                .select('*')
                .eq('agent_id', user.id)
                .single();

            if (data) {
                setKycData(data);
                setPan(data.pan_number || '');
                setAadhar(data.aadhar_number || '');
                setBankDetails(data.bank_details || { account_name: '', account_number: '', ifsc: '' });
                setCmrStatus(data.cmr_status || 'not_uploaded');
                setCmrUrl(data.cmr_url || '');
                // Show onboarding if not completed
                if (!data.onboarding_completed && data.kyc_status === 'approved') {
                    setShowOnboarding(true);
                }
            } else if (user.id === 'agt_1') {
                const mockData = {
                    kyc_status: 'approved',
                    pan_number: 'ABCDE1234F',
                    aadhar_number: '1234 5678 9012',
                    bank_details: { account_name: 'Partner Broker', account_number: '1234567890', ifsc: 'HDFC0001234' },
                    cmr_status: 'verified',
                    cmr_url: '',
                    total_earnings: 25000,
                    withdrawn_earnings: 5000,
                    current_tier: 'Silver',
                    onboarding_completed: false,
                    avg_rating: 4.3,
                    total_clients: 12,
                };
                setKycData(mockData);
                setPan(mockData.pan_number);
                setAadhar(mockData.aadhar_number);
                setBankDetails(mockData.bank_details);
                setCmrStatus(mockData.cmr_status);
                if (!mockData.onboarding_completed) setShowOnboarding(true);
            }
            setKycLoading(false);
        };
        fetchKyc();
    }, [user, supabase]);

    const completeOnboarding = async () => {
        setShowOnboarding(false);
        if (user) {
            await supabase.from('agent_profiles').update({ onboarding_completed: true }).eq('agent_id', user.id);
            setKycData((prev: any) => ({ ...prev, onboarding_completed: true }));
        }
    };

    const submitKyc = async (e: React.FormEvent) => {
        e.preventDefault();

        if (cmrStatus === 'not_uploaded' && !cmrFile) {
            alert('Please upload your Client Master Report (CMR) before submitting.');
            return;
        }

        if (!user) return;
        setSubmittingKyc(true);

        let finalCmrUrl = cmrUrl;
        let finalCmrStatus = cmrStatus;

        if (cmrFile) {
            finalCmrUrl = `https://storage.sharesaathi.com/cmr/${user.id}/${cmrFile.name}`;
            finalCmrStatus = 'pending';
        }

        const payload = {
            agent_id: user.id,
            pan_number: pan,
            aadhar_number: aadhar,
            bank_details: bankDetails,
            cmr_url: finalCmrUrl,
            cmr_status: finalCmrStatus,
            cmr_uploaded: true,
            kyc_status: 'pending',
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('agent_profiles')
            .upsert(payload)
            .select()
            .single();

        if (!error) {
            setKycData({ ...kycData, ...payload });
            setCmrStatus(finalCmrStatus);
            setCmrUrl(finalCmrUrl);
            alert('KYC & CMR Submitted Successfully! Awaiting Admin Approval.');
        } else if (user.id === 'agt_1') {
            setKycData({ ...payload, kyc_status: 'pending' });
            setCmrStatus(finalCmrStatus);
            setCmrUrl(finalCmrUrl);
            alert('Simulator: KYC Submitted Success (Mocked).');
        } else {
            alert('Failed to submit KYC. ' + error.message);
        }
        setSubmittingKyc(false);
    };

    if (kycLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    const needsKyc = !kycData || !kycData.kyc_status || kycData.kyc_status === 'pending' || kycData.kyc_status === 'rejected';
    const isApproved = kycData?.kyc_status === 'approved';

    // If they haven't submitted or it's pending/rejected, force them to the KYC view
    if (needsKyc && activeTab !== 'kyc') {
        return (
            <div className="p-8 max-w-2xl mx-auto mt-10">
                <div className="bg-white rounded-2xl p-8 border border-border shadow-xl text-center">
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon name="DocumentCheckIcon" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold font-display text-foreground mb-4">Complete Your Partner KYC</h1>
                    <p className="text-muted mb-8 leading-relaxed">
                        To start generating custom client links and earning margins, you need to verify your identity.
                        Please submit your PAN, Aadhar, and Bank Details securely.
                    </p>
                    <button
                        onClick={() => window.location.search = '?tab=kyc'}
                        className="bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-primary/90 transition-all focus:ring-4 focus:ring-primary/20"
                    >
                        Start KYC Verification
                    </button>
                    {kycData?.kyc_status === 'pending' && (
                        <p className="text-sm font-semibold text-amber-600 mt-4 px-4 py-2 bg-amber-50 rounded-lg inline-block">
                            Your last submission is currently under review by an administrator.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-up">
            {/* Onboarding Wizard */}
            {showOnboarding && isApproved && (
                <AgentOnboarding onComplete={completeOnboarding} userName={user?.name || 'Partner'} />
            )}

            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-foreground tracking-tight">Partner Dashboard</h1>
                    <p className="text-muted mt-2 tracking-wide text-sm">
                        {isApproved ? 'Manage your catalogue, links, and earnings.' : 'Complete your KYC below.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {kycData?.current_tier && isApproved && (
                        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg border border-amber-200 shadow-sm">
                            <Icon name="TrophyIcon" size={16} />
                            <span className="text-sm font-bold">{kycData.current_tier} Tier</span>
                        </div>
                    )}
                    {isApproved && (
                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 shadow-sm">
                            <Icon name="ShieldCheckIcon" size={18} className="text-green-600" />
                            <span className="text-sm font-bold tracking-wide">Verified Partner</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'kyc' && (
                <div className="bg-white rounded-2xl border border-border shadow-sm flex overflow-hidden">
                    <div className="w-full md:w-2/3 p-8 border-r border-border">
                        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                            <Icon name="IdentificationIcon" className="text-primary" />
                            Bank & Identity Verification
                        </h2>

                        {kycData?.kyc_status === 'pending' && (
                            <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 flex gap-3 text-amber-800 text-sm font-medium">
                                <Icon name="ClockIcon" className="text-amber-500 shrink-0" />
                                <p>Your KYC application is currently under review. You can update your details if needed.</p>
                            </div>
                        )}
                        {kycData?.kyc_status === 'rejected' && (
                            <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 flex gap-3 text-red-800 text-sm font-medium">
                                <Icon name="XCircleIcon" className="text-red-500 shrink-0" />
                                <p>Your KYC was rejected. Please verify the details below and submit again.</p>
                            </div>
                        )}

                        <form onSubmit={submitKyc} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest mb-2 block">PAN Number</label>
                                    <input
                                        required
                                        type="text"
                                        value={pan}
                                        onChange={e => setPan(e.target.value.toUpperCase())}
                                        className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-mono uppercase"
                                        placeholder="ABCDE1234F"
                                        disabled={isApproved}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest mb-2 block">Aadhar Number</label>
                                    <input
                                        required
                                        type="text"
                                        value={aadhar}
                                        onChange={e => setAadhar(e.target.value)}
                                        className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                                        placeholder="1234 5678 9012"
                                        disabled={isApproved}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border mt-6">
                                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Bank Detail for Payouts</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-muted mb-1 block">Account Holder Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={bankDetails.account_name}
                                            onChange={e => setBankDetails({ ...bankDetails, account_name: e.target.value })}
                                            className="w-full border border-border rounded-lg px-4 py-2.5 focus:border-primary transition-all"
                                            placeholder="As per bank records"
                                            disabled={isApproved}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-muted mb-1 block">Account Number</label>
                                            <input
                                                required
                                                type="text"
                                                value={bankDetails.account_number}
                                                onChange={e => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                                                className="w-full border border-border rounded-lg px-4 py-2.5 focus:border-primary transition-all font-mono"
                                                placeholder="XXXXXXXXXXXX"
                                                disabled={isApproved}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-muted mb-1 block">IFSC Code</label>
                                            <input
                                                required
                                                type="text"
                                                value={bankDetails.ifsc}
                                                onChange={e => setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase() })}
                                                className="w-full border border-border rounded-lg px-4 py-2.5 focus:border-primary transition-all font-mono uppercase"
                                                placeholder="HDFC0000123"
                                                disabled={isApproved}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border mt-6">
                                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Dematerialization Details</h3>
                                <div className={`relative p-4 rounded-xl border-2 border-dashed transition-all ${cmrStatus !== 'not_uploaded' || cmrFile ? 'border-green-200 bg-green-50/50' : 'border-border bg-slate-50'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(cmrStatus !== 'not_uploaded' || cmrFile) ? 'bg-green-100 text-green-600' : 'bg-white border border-border text-muted'}`}>
                                                {(cmrStatus === 'verified') ? <Icon name="CheckCircleIcon" size={18} /> : <Icon name="DocumentArrowUpIcon" size={18} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Client Master Report (CMR)</p>
                                                    {cmrStatus !== 'not_uploaded' && (
                                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${cmrStatus === 'verified' ? 'bg-green-100 text-green-700' :
                                                                cmrStatus === 'rejected' ? 'bg-red-50 text-red-600' :
                                                                    'bg-amber-50 text-amber-600'
                                                            }`}>
                                                            {cmrStatus}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-muted">
                                                    {cmrFile ? `Ready to upload: ${cmrFile.name}` :
                                                        cmrStatus === 'verified' ? 'Verified by Admin' :
                                                            cmrStatus === 'pending' ? 'Document under review' :
                                                                cmrStatus === 'rejected' ? `Rejected: ${kycData?.cmr_rejection_reason || 'Please re-upload'}` :
                                                                    'PDF or Image required'}
                                                </p>
                                            </div>
                                        </div>
                                        {cmrStatus === 'not_uploaded' && !cmrFile ? (
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="cmr-upload"
                                                    className="hidden"
                                                    accept=".pdf,image/*"
                                                    onChange={e => setCmrFile(e.target.files?.[0] || null)}
                                                    disabled={isApproved}
                                                />
                                                <label
                                                    htmlFor="cmr-upload"
                                                    className="h-8 px-4 text-[10px] flex items-center justify-center font-bold uppercase bg-white border border-border rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                                                >
                                                    Upload CMR
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                {cmrUrl && (
                                                    <a href={cmrUrl} target="_blank" className="text-[10px] text-primary font-bold hover:underline">View File</a>
                                                )}
                                                {!isApproved && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setCmrFile(null); setCmrStatus('not_uploaded'); }}
                                                        className="text-[10px] text-red-500 font-bold hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted mt-3">We need your CMR to verify your demat account ownership for transferring your partner shares.</p>
                                </div>
                            </div>

                            {!isApproved && (
                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submittingKyc}
                                        className="bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                                    >
                                        {submittingKyc ? 'Submitting...' : 'Submit Documents'}
                                        {!submittingKyc && <Icon name="ArrowRightIcon" size={16} />}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                    <div className="hidden md:flex w-1/3 bg-slate-50 flex-col items-center justify-center p-8 text-center text-slate-500">
                        <Icon name="ShieldCheckIcon" size={48} className="mb-4 text-slate-300" />
                        <h4 className="font-bold text-slate-700 mb-2">Secure Verification</h4>
                        <p className="text-sm">Your data is stored securely and used only for complying with RBI & SEBI guidelines regarding financial transactions.</p>
                    </div>
                </div>
            )}

            {activeTab === 'marketplace' && isApproved && <AgentMarketplaceTab />}
            {activeTab === 'links' && isApproved && <AgentLinksTab />}
            {activeTab === 'earnings' && isApproved && <AgentEarningsTab kycData={kycData} />}
            {activeTab === 'leaderboard' && isApproved && <AgentLeaderboard />}
            {activeTab === 'clients' && isApproved && <AgentCRMTab />}
            {activeTab === 'analytics' && isApproved && <AgentAnalyticsTab />}
            {activeTab === 'statements' && isApproved && <AgentStatementsTab kycData={kycData} />}
            {activeTab === 'tiers' && isApproved && <AgentTiersTab kycData={kycData} />}
            {activeTab === 'training' && isApproved && <AgentTrainingTab />}
            {activeTab === 'support' && isApproved && <AgentSupportChat />}
            {activeTab === 'marketing' && isApproved && <AgentMarketingTab currentTier={kycData?.current_tier || 'Bronze'} />}
            {activeTab === 'feedback' && isApproved && <AgentFeedbackTab />}
        </div>
    );
}
