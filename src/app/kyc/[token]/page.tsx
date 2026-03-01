'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lead } from '@/lib/mock-data';
import { useAppStore } from '@/lib/store';
import AppLogo from '@/components/ui/AppLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/AppIcon';

export default function KycOnboardingPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = React.use(params);
    const router = useRouter();

    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [formParams, setFormParams] = useState({ pan: '', bank: '', ifsc: '', address: '' });
    const [uploads, setUploads] = useState({
        cmr: false,
        pan: false,
        aadhar: false,
        addressProof: false
    });
    const [declared, setDeclared] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showCmrHelp, setShowCmrHelp] = useState(false);
    const [selectedBroker, setSelectedBroker] = useState<string | null>(null);

    const BROKER_GUIDES: Record<string, { name: string, steps: string[] }> = {
        zerodha: {
            name: 'Zerodha',
            steps: [
                'Log in to Console.',
                'Click on Account.',
                'Click on Documents.',
                'Select Zerodha CMR copy.',
                'Click on E-mail to me.'
            ]
        },
        groww: {
            name: 'Groww',
            steps: [
                'Go to your profile.',
                'Select the ‘Reports’ option.',
                'Under ‘Holdings’, find ‘CMR Copy’.',
                'Click on ‘Send Email’.',
                'You will receive the CMR copy by the end of the day.'
            ]
        },
        upstox: {
            name: 'Upstox',
            steps: [
                'Open the Upstox App/Website and log in.',
                "Go to the 'Account' section at the bottom.",
                "Click on 'My Account' and select 'Profile'.",
                "Select the 'Documents' tab.",
                "Choose 'CMR (Client Master Report)' and click 'Get via E-mail'."
            ]
        },
        icici: {
            name: 'ICICI Direct',
            steps: [
                'Log in to the ICICI Direct website.',
                'Click on the Investments tab and select Demat.',
                'Navigate to Customer Service and click on Service Request.',
                'Under "Deliverables", click on Request for Client Master List.',
                'Choose "To be dispatched to Communication Address".',
                'Verify your address details and submit the request.'
            ]
        }
    };

    const { leads, updateLead } = useAppStore();

    useEffect(() => {
        // Find lead by token in live store
        const found = leads.find(l => l.onboardingToken === token);
        if (found) {
            setLead(found);
            setFormParams({
                pan: found.pan || '',
                bank: found.bank || '',
                ifsc: '',
                address: found.address || ''
            });
        }
        setLoading(false);
    }, [token, leads]);

    if (loading) return null;

    if (!lead) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
                <Icon name="ExclamationTriangleIcon" size={48} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-display font-medium text-foreground mb-2">Invalid or Expired Link</h1>
                <p className="text-muted mb-6">This onboarding link is no longer valid. Please request a new link from your Relationship Manager.</p>
                <Button onClick={() => router.push('/')}>Return to Homepage</Button>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <Icon name="CheckCircleIcon" size={40} />
                </div>
                <h1 className="text-3xl font-display font-medium text-foreground mb-2">KYC Complete</h1>
                <p className="text-muted max-w-md mb-8">Your details and documents have been successfully submitted. Your account is now active, and you can begin investing.</p>
                <Button onClick={() => router.push('/login')} className="bg-primary hover:bg-primary/90 text-white px-8">
                    Proceed to Login
                </Button>
            </div>
        );
    }

    const allUploaded = uploads.cmr && uploads.pan && uploads.aadhar && uploads.addressProof;
    const canSubmit = allUploaded && declared;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!canSubmit) {
            alert("Please upload all required documents and accept the declaration.");
            return;
        }

        if (lead) {
            updateLead({
                ...lead,
                pan: formParams.pan,
                bank: formParams.bank,
                address: formParams.address,
                kycStatus: 'verified',
                status: 'onboarded',
                onboardingToken: undefined // expire link
            });
        }

        setSubmitted(true);
    };

    const handleFileUpload = (type: keyof typeof uploads) => {
        // Simulate file upload
        setUploads(prev => ({ ...prev, [type]: true }));
    };

    const UploadSlot = ({ id, label, isDone }: { id: keyof typeof uploads, label: string, isDone: boolean }) => (
        <div className={`relative p-4 rounded-xl border-2 border-dashed transition-all ${isDone ? 'border-green-200 bg-green-50/50' : 'border-border bg-slate-50'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDone ? 'bg-green-100 text-green-600' : 'bg-white border border-border text-muted'}`}>
                        {isDone ? <Icon name="CheckCircleIcon" size={18} /> : <Icon name="DocumentArrowUpIcon" size={18} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">{label}</p>
                            {id === 'cmr' && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setShowCmrHelp(true); }}
                                    className="text-primary hover:text-primary/80 transition-colors"
                                    title="What is CMR?"
                                >
                                    <Icon name="InformationCircleIcon" size={14} />
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-muted">{isDone ? 'File ready' : 'PDF or Image required'}</p>
                    </div>
                </div>
                {!isDone ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px] font-bold uppercase bg-white"
                        onClick={() => handleFileUpload(id)}
                    >
                        Upload
                    </Button>
                ) : (
                    <button type="button" onClick={() => setUploads(p => ({ ...p, [id]: false }))} className="text-[10px] text-red-500 font-bold hover:underline">Remove</button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
            <header className="p-6 flex justify-center z-10 border-b border-border bg-white sticky top-0">
                <AppLogo size={28} text="ShareSaathi" />
            </header>

            <main className="flex-1 flex flex-col items-center py-12 px-4 z-10 w-full max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-display font-light text-foreground tracking-tight mb-2">
                        KYC & Verification
                    </h1>
                    <p className="text-muted text-sm max-w-md mx-auto">
                        Welcome, {lead.name}. Please provide your official documents to authorize your account for unlisted share trading.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 w-full">
                    {/* Form Section */}
                    <Card className="shadow-sm border-border">
                        <CardHeader className="border-b border-border/50 bg-slate-50/50">
                            <CardTitle className="text-base font-semibold">1. Personal & Banking Information</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8 px-8 pb-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">PAN Number</label>
                                        <input required type="text" value={formParams.pan} onChange={e => setFormParams({ ...formParams, pan: e.target.value.toUpperCase() })} className="w-full bg-slate-50/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary uppercase font-mono" placeholder="ABCDE1234F" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Address (As per Aadhar)</label>
                                        <input required type="text" value={formParams.address} onChange={e => setFormParams({ ...formParams, address: e.target.value })} className="w-full bg-slate-50/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" placeholder="B-12, Sector 5..." />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Bank Name & Branch</label>
                                        <input required type="text" value={formParams.bank} onChange={e => setFormParams({ ...formParams, bank: e.target.value })} className="w-full bg-slate-50/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" placeholder="HDFC Bank, Mumbai" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">IFSC Code</label>
                                        <input required type="text" value={formParams.ifsc} onChange={e => setFormParams({ ...formParams, ifsc: e.target.value.toUpperCase() })} className="w-full bg-slate-50/50 border border-border rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-primary uppercase" placeholder="HDFC0001234" />
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-border mt-8">
                                    <div className="mb-6">
                                        <h3 className="text-base font-semibold text-foreground">2. Document Verification</h3>
                                        <p className="text-xs text-muted mb-4 leading-relaxed">Please upload clear, scanned copies of the following documents. The CMR (Client Master Report) is mandatory for share transfers.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <UploadSlot id="cmr" label="Client Master Report (CMR)" isDone={uploads.cmr} />
                                        <UploadSlot id="pan" label="PAN Card Copy" isDone={uploads.pan} />
                                        <UploadSlot id="aadhar" label="Aadhar Card (Front & Back)" isDone={uploads.aadhar} />
                                        <UploadSlot id="addressProof" label="Address Proof (Bill/Statement)" isDone={uploads.addressProof} />
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-border mt-8 flex flex-col gap-6">
                                    <div className="bg-primary/[0.03] border border-primary/10 rounded-2xl p-6">
                                        <div className="flex gap-4">
                                            <div className="pt-1">
                                                <input
                                                    type="checkbox"
                                                    id="declaration"
                                                    className="w-5 h-5 rounded border-primary/30 text-primary focus:ring-primary accent-primary"
                                                    checked={declared}
                                                    onChange={e => setDeclared(e.target.checked)}
                                                />
                                            </div>
                                            <label htmlFor="declaration" className="text-xs text-foreground leading-relaxed font-medium cursor-pointer">
                                                I hereby declare that all the information provided is true to my knowledge and I understand the risks and want to trade in unlisted shares and gives the company the authority to make transactions like procurement on my behalf.
                                            </label>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className={`w-full py-7 rounded-2xl text-sm font-bold tracking-widest uppercase transition-all shadow-xl ${canSubmit
                                            ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/20 scale-[1.01]'
                                            : 'bg-slate-100 text-muted-foreground border border-border shadow-none opacity-60 cursor-not-allowed'
                                            }`}
                                    >
                                        Submit KYC & Authorize
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                        <Icon name="InformationCircleIcon" size={18} className="text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                            Security Note: All documents are encrypted and stored securely for compliance purposes. We will never share your data with unauthorized third parties.
                        </p>
                    </div>
                </div>
            </main>

            {/* CMR Help Modal */}
            {showCmrHelp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 h-[80vh] max-h-[600px]">
                        <div className="flex items-center justify-between p-6 border-b border-border bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">What is a CMR?</h3>
                                <p className="text-xs text-muted mt-0.5">Client Master Report (Official Demat Proof)</p>
                            </div>
                            <button
                                onClick={() => { setShowCmrHelp(false); setSelectedBroker(null); }}
                                className="text-muted hover:text-foreground p-2 rounded-full hover:bg-white transition-all shadow-sm"
                            >
                                <Icon name="XMarkIcon" size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 text-left">
                            {!selectedBroker ? (
                                <div className="space-y-6">
                                    <p className="text-sm text-muted leading-relaxed">
                                        The Client Master Report (CMR) is a digitally signed document from your broker that proves you are the owner of your demat account. It contains your DP ID, Client ID, and linked bank details.
                                    </p>

                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select your broker to see steps:</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {Object.entries(BROKER_GUIDES).map(([id, broker]) => (
                                                <button
                                                    key={id}
                                                    onClick={() => setSelectedBroker(id)}
                                                    className="p-4 border border-border rounded-xl text-left hover:border-primary hover:bg-primary/[0.02] transition-all group"
                                                >
                                                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{broker.name}</p>
                                                    <p className="text-[10px] text-muted mt-1 uppercase font-bold tracking-tight opacity-60">View Instructions</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3">
                                        <Icon name="LightBulbIcon" size={18} className="text-blue-600 mt-0.5 shrink-0" />
                                        <p className="text-xs text-blue-800 leading-relaxed">
                                            If your broker is not listed, you can simply email them asking for your <span className="font-bold">"Digitally Signed Client Master Report"</span>.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                    <button
                                        onClick={() => setSelectedBroker(null)}
                                        className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline uppercase tracking-wider mb-2"
                                    >
                                        <Icon name="ArrowLeftIcon" size={14} /> Back to selection
                                    </button>

                                    <div>
                                        <h4 className="text-lg font-bold text-foreground mb-4">Steps for {BROKER_GUIDES[selectedBroker].name}</h4>
                                        <div className="space-y-4">
                                            {BROKER_GUIDES[selectedBroker].steps.map((step, idx) => (
                                                <div key={idx} className="flex gap-4 group">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-[11px] font-bold text-slate-500 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                                                        {idx + 1}
                                                    </div>
                                                    <p className="text-sm text-foreground leading-relaxed pt-0.5">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-green-50 rounded-2xl border border-green-100/50">
                                        <p className="text-xs text-green-800 font-medium italic">
                                            Tip: Most brokers send the CMR directly to your registered email address within a few hours.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50/50 border-t border-border mt-auto">
                            <Button className="w-full h-12 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-xs" onClick={() => { setShowCmrHelp(false); setSelectedBroker(null); }}>
                                I Understand
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
